// Supabase Edge Function: Process Articles with AI
// Takes pending raw_articles and creates stories with AI summaries

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// Allowed origins for CORS - restrict to app domains only
const ALLOWED_ORIGINS = [
  'https://safha.app',
  'https://www.safha.app',
  'https://qnibkvemxmhjgzydstlg.supabase.co', // Supabase project (for cron jobs)
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  // For cron jobs (no origin) or allowed origins, permit the request
  const allowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin)
    ? (origin || ALLOWED_ORIGINS[0])
    : '';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// Authentication: Verify request is from authorized source
function verifyAuth(req: Request): { valid: boolean; error?: string } {
  // Check for function secret (for cron jobs and internal calls)
  const functionSecret = Deno.env.get('FUNCTION_SECRET');
  const providedSecret = req.headers.get('x-function-secret');

  if (functionSecret && providedSecret === functionSecret) {
    return { valid: true };
  }

  // Check for valid Supabase service role key in authorization header
  const authHeader = req.headers.get('authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (authHeader && serviceRoleKey) {
    const token = authHeader.replace('Bearer ', '');
    if (token === serviceRoleKey) {
      return { valid: true };
    }
  }

  // Check if request is from Supabase cron (has specific user-agent)
  const userAgent = req.headers.get('user-agent') || '';
  if (userAgent.includes('Supabase') || userAgent.includes('pg_net')) {
    return { valid: true };
  }

  return { valid: false, error: 'Unauthorized: Missing or invalid authentication' };
}

interface RawArticle {
  id: string;
  rss_source_id: string;
  original_url: string;
  original_title: string;
  original_content: string;
  original_description: string;
  full_content: string | null;
  content_quality: number | null;
  image_url: string | null;
  video_url: string | null;
  video_type: string | null;
  published_at: string | null;
  retry_count: number;
  retry_after: string | null;
  topic_ids: string[] | null;
  rss_source: {
    language: string;
    name: string;
    reliability_score: number;
    website_url: string | null;
    logo_url: string | null;
  };
}

interface CircuitBreakerStatus {
  is_open: boolean;
  failure_count: number;
  can_proceed: boolean;
  cooldown_until?: string;
  just_reset?: boolean;
}

// Check circuit breaker status
async function checkCircuitBreaker(supabase: any): Promise<CircuitBreakerStatus> {
  try {
    const { data, error } = await supabase.rpc('get_circuit_breaker_status');
    if (error || !data) {
      console.warn('Circuit breaker check failed:', error?.message || 'No data returned');
      return { is_open: false, failure_count: 0, can_proceed: true };
    }
    return data as CircuitBreakerStatus;
  } catch (e) {
    console.warn('Circuit breaker exception:', e);
    return { is_open: false, failure_count: 0, can_proceed: true };
  }
}

// Record circuit breaker failure
async function recordFailure(supabase: any): Promise<void> {
  try {
    const result = await supabase.rpc('record_circuit_breaker_failure');
    if (result?.error) {
      console.warn('Failed to record circuit breaker failure:', result.error.message);
    }
  } catch (e) {
    console.warn('Exception recording circuit breaker failure:', e);
  }
}

// Record circuit breaker success
async function recordSuccess(supabase: any): Promise<void> {
  try {
    const result = await supabase.rpc('record_circuit_breaker_success');
    if (result?.error) {
      console.warn('Failed to record circuit breaker success:', result.error.message);
    }
  } catch (e) {
    console.warn('Exception recording circuit breaker success:', e);
  }
}

// Log pipeline event
async function logPipelineEvent(
  supabase: any,
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata: Record<string, any> = {},
  articleId?: string
): Promise<void> {
  try {
    await supabase.rpc('log_pipeline_event', {
      p_function_name: 'process-articles',
      p_level: level,
      p_message: message,
      p_metadata: metadata,
      p_article_id: articleId || null,
    });
  } catch {
    // Silent fail - logging should not break processing
  }
}

// Calculate exponential backoff retry time
function calculateRetryAfter(retryCount: number): string {
  const delayMinutes = Math.min(Math.pow(2, retryCount), 60);
  const retryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  return retryAt.toISOString();
}

interface AISummaryResponse {
  summary_ar: string;
  summary_en: string;
  why_it_matters_ar: string;
  why_it_matters_en: string;
  quality_score: number;
  topics: string[];
}

// Model configuration - Sonnet only for best quality
const MODEL = 'claude-sonnet-4-20250514';

// Sonnet pricing (per 1M tokens) for cost calculation
const PRICING = {
  input: 3.00,   // $3.00 per 1M input tokens
  output: 15.00, // $15.00 per 1M output tokens
};

const SUMMARIZE_PROMPT = `You are a news summarization AI for Safha, a Saudi Arabian news app.

Summarize news articles for busy professionals in 15-30 second reads.

Provide:
1. summary_ar: Arabic summary (2-3 sentences, max 100 words, فصحى)
2. summary_en: English summary (2-3 sentences, max 100 words)
3. why_it_matters_ar: "لماذا يهمك؟" (1-2 sentences, Saudi context)
4. why_it_matters_en: "Why it matters" (1-2 sentences, Saudi context)
5. quality_score: 0.0-1.0 (news value, relevance, credibility)
6. topics: Array of slugs (politics, economy, sports, technology, entertainment, health, science, travel)

Respond ONLY with valid JSON.`;

interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
}

interface SummarizeResult {
  summary: AISummaryResponse;
  usage: ClaudeUsage;
}

async function summarizeWithClaude(
  title: string,
  content: string,
  sourceLanguage: string,
  sourceName: string,
  apiKey: string
): Promise<SummarizeResult> {
  // Add 30-second timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SUMMARIZE_PROMPT,
        messages: [{
          role: 'user',
          content: `Source: ${sourceName}
Language: ${sourceLanguage}
Title: ${title}

Content:
${content.slice(0, 3000)}`,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const textContent = data.content.find((c: { type: string }) => c.type === 'text');

    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Extract usage data for cost tracking
    const usage: ClaudeUsage = {
      input_tokens: data.usage?.input_tokens || 0,
      output_tokens: data.usage?.output_tokens || 0,
    };

    // Strip markdown code blocks if present
    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const summary = JSON.parse(jsonText);
    return { summary, usage };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Claude API timeout after 30 seconds');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function processArticle(
  article: RawArticle,
  supabase: any,
  claudeApiKey: string
): Promise<{ success: boolean; story_id?: string; error?: string; model_used?: string; skipped?: boolean; cost_usd?: number }> {
  try {
    // Mark as processing
    await supabase
      .from('raw_articles')
      .update({ status: 'processing' })
      .eq('id', article.id);

    // Get content (prefer full_content from webpage scraping, fallback to RSS snippet)
    const content = article.full_content || article.original_content || article.original_description || '';

    if (!content || content.length < 50) {
      await supabase
        .from('raw_articles')
        .update({
          status: 'rejected',
          error_message: 'Content too short',
          processed_at: new Date().toISOString(),
        })
        .eq('id', article.id);
      return { success: false, error: 'Content too short' };
    }

    console.log(`Processing "${article.original_title?.slice(0, 30)}..." with ${MODEL}`);

    // Generate AI summary
    const { summary, usage } = await summarizeWithClaude(
      article.original_title,
      content,
      article.rss_source.language,
      article.rss_source.name,
      claudeApiKey
    );

    // Calculate cost for tracking
    const cost_usd = (usage.input_tokens * PRICING.input + usage.output_tokens * PRICING.output) / 1_000_000;

    // Log API usage to database
    await supabase.from('api_usage').insert({
      function_name: 'process-articles',
      model: MODEL,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd,
      article_id: article.id,
    });

    // Check quality threshold
    if (summary.quality_score < 0.4) {
      await supabase
        .from('raw_articles')
        .update({
          status: 'rejected',
          error_message: `Quality score too low: ${summary.quality_score}`,
          processed_at: new Date().toISOString(),
        })
        .eq('id', article.id);
      return { success: false, error: 'Quality score too low' };
    }

    // Get or create source in sources table
    // Use website_url from rss_source (correct) instead of article domain (wrong)
    const websiteUrl = article.rss_source.website_url ||
      article.original_url.split('/').slice(0, 3).join('/');

    let sourceId: string | null = null;

    // Try to find existing source by name OR url (more robust matching)
    // Use separate queries to avoid SQL injection from string interpolation
    let existingSource = null;

    // First try to find by name
    const { data: sourceByName } = await supabase
      .from('sources')
      .select('id')
      .eq('name', article.rss_source.name)
      .limit(1)
      .single();

    if (sourceByName) {
      existingSource = sourceByName;
    } else {
      // If not found by name, try by URL
      const { data: sourceByUrl } = await supabase
        .from('sources')
        .select('id')
        .eq('url', websiteUrl)
        .limit(1)
        .single();
      existingSource = sourceByUrl;
    }

    if (existingSource) {
      sourceId = existingSource.id;
    } else {
      // Create new source with correct website URL and logo from rss_source
      const { data: newSource } = await supabase
        .from('sources')
        .insert({
          name: article.rss_source.name,
          url: websiteUrl,
          logo_url: article.rss_source.logo_url,
          language: article.rss_source.language,
          reliability_score: article.rss_source.reliability_score,
        })
        .select('id')
        .single();
      sourceId = newSource?.id;
    }

    // Map topic slugs to IDs with validation and default fallback
    const { data: topicsData } = await supabase
      .from('topics')
      .select('id, slug')
      .in('slug', summary.topics);

    // Log missing topic slugs for debugging
    const foundSlugs = topicsData?.map((t: { slug: string }) => t.slug) || [];
    const missingSlugs = summary.topics.filter((s: string) => !foundSlugs.includes(s));
    if (missingSlugs.length > 0) {
      console.warn(`[${article.original_title?.slice(0, 30)}] Unknown topic slugs: ${missingSlugs.join(', ')}`);
    }

    // Get AI-generated topic IDs
    const aiTopicIds = topicsData?.map((t: { id: string }) => t.id) || [];

    // Get RSS source topic IDs (inherited from rss_sources.topic_ids via fetch-rss)
    const rssTopicIds: string[] = article.topic_ids || [];

    // Merge topics: RSS source topics take priority (they're curated), then AI topics
    // Using Set to deduplicate
    let topicIds = [...new Set([...rssTopicIds, ...aiTopicIds])];

    if (rssTopicIds.length > 0) {
      console.log(`[${article.original_title?.slice(0, 30)}] Using RSS topics: ${rssTopicIds.length}, AI topics: ${aiTopicIds.length}, merged: ${topicIds.length}`);
    }

    // If no topics found, assign default 'general' topic so stories are discoverable
    if (topicIds.length === 0) {
      const { data: defaultTopic } = await supabase
        .from('topics')
        .select('id')
        .eq('slug', 'general')
        .single();
      if (defaultTopic) {
        topicIds = [defaultTopic.id];
        console.log(`[${article.original_title?.slice(0, 30)}] Assigned default 'general' topic`);
      }
    }

    // Check if story already exists (prevent duplicates)
    const { data: existingStory } = await supabase
      .from('stories')
      .select('id')
      .eq('source_id', sourceId)
      .eq('original_url', article.original_url)
      .single();

    if (existingStory) {
      // Story already exists - mark raw_article as processed and skip
      console.log(`[${article.original_title?.slice(0, 30)}] Story already exists, skipping`);
      await supabase
        .from('raw_articles')
        .update({
          status: 'processed',
          story_id: existingStory.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', article.id);
      return { success: true, story_id: existingStory.id, skipped: true };
    }

    // Create story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        source_id: sourceId,
        original_url: article.original_url,
        original_title: article.original_title,
        original_description: article.original_description,  // RSS description as fallback
        title_ar: article.rss_source.language === 'ar' ? article.original_title : null,
        title_en: article.rss_source.language === 'en' ? article.original_title : null,
        summary_ar: summary.summary_ar,
        summary_en: summary.summary_en,
        full_content: article.full_content,
        content_quality: article.content_quality || 0,
        why_it_matters_ar: summary.why_it_matters_ar,
        why_it_matters_en: summary.why_it_matters_en,
        ai_quality_score: summary.quality_score,
        image_url: article.image_url,
        video_url: article.video_url,
        video_type: article.video_type,
        topic_ids: topicIds,
        // Default to fetched_at or NOW() if published_at is NULL (ensures proper feed sorting)
        published_at: article.published_at || article.fetched_at || new Date().toISOString(),
        is_approved: true, // Auto-approved, admin can remove if needed
      })
      .select('id')
      .single();

    if (storyError) {
      throw new Error(`Failed to create story: ${storyError.message}`);
    }

    // Update raw_article as processed
    await supabase
      .from('raw_articles')
      .update({
        status: 'processed',
        story_id: story.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', article.id);

    return { success: true, story_id: story.id, model_used: MODEL, cost_usd };

  } catch (error) {
    const newRetryCount = (article.retry_count || 0) + 1;
    const maxRetries = 5;

    // If we've exceeded max retries, mark as permanently failed
    // Otherwise, set retry_after for exponential backoff
    const isFinalFailure = newRetryCount >= maxRetries;

    await supabase
      .from('raw_articles')
      .update({
        status: isFinalFailure ? 'failed' : 'pending',
        error_message: error.message,
        retry_count: newRetryCount,
        retry_after: isFinalFailure ? null : calculateRetryAfter(newRetryCount),
        processed_at: isFinalFailure ? new Date().toISOString() : null,
      })
      .eq('id', article.id);

    return { success: false, error: error.message, will_retry: !isFinalFailure };
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify authentication
  const auth = verifyAuth(req);
  if (!auth.valid) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    if (!claudeApiKey) {
      throw new Error('CLAUDE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check circuit breaker before processing
    const circuitBreaker = await checkCircuitBreaker(supabase);
    if (!circuitBreaker.can_proceed) {
      console.log(`Circuit breaker is OPEN. Cooldown until: ${circuitBreaker.cooldown_until}`);
      await logPipelineEvent(supabase, 'warn', 'Circuit breaker is open, skipping processing', {
        failure_count: circuitBreaker.failure_count,
        cooldown_until: circuitBreaker.cooldown_until,
      });
      return new Response(
        JSON.stringify({
          message: 'Circuit breaker is open',
          cooldown_until: circuitBreaker.cooldown_until,
          failure_count: circuitBreaker.failure_count,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (circuitBreaker.just_reset) {
      console.log('Circuit breaker just reset after cooldown');
      await logPipelineEvent(supabase, 'info', 'Circuit breaker reset after cooldown');
    }

    // Parse optional limit from request
    // Keep batch size small to avoid Edge Function timeout (60s limit)
    let limit = 10;
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 20);
    } catch {
      // No body or invalid JSON, use default
    }

    // Reset stuck "processing" articles (older than 5 minutes) back to pending
    // This prevents articles from getting stuck if the function times out
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: stuckArticles } = await supabase
      .from('raw_articles')
      .update({ status: 'pending', retry_after: null })
      .eq('status', 'processing')
      .lt('updated_at', fiveMinutesAgo)
      .select('id');

    if (stuckArticles && stuckArticles.length > 0) {
      console.log(`Reset ${stuckArticles.length} stuck "processing" articles back to pending`);
      await logPipelineEvent(supabase, 'warn', `Reset ${stuckArticles.length} stuck articles`, {
        article_ids: stuckArticles.map((a: { id: string }) => a.id),
      });
    }

    // Get pending articles that are ready for processing
    // Respect retry_after for exponential backoff
    const now = new Date().toISOString();
    const { data: articles, error: articlesError } = await supabase
      .from('raw_articles')
      .select(`
        *,
        rss_source:rss_sources(language, name, reliability_score, website_url, logo_url)
      `)
      .eq('status', 'pending')
      .lt('retry_count', 5)
      .or(`retry_after.is.null,retry_after.lt.${now}`)
      .order('fetched_at', { ascending: true })
      .limit(limit);

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending articles', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process articles sequentially to avoid rate limits
    const results = [];
    for (const article of articles) {
      const result = await processArticle(article, supabase, claudeApiKey);
      results.push({
        article_id: article.id,
        title: article.original_title?.slice(0, 50),
        ...result,
      });

      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const totalCost = results
      .filter(r => r.cost_usd)
      .reduce((sum, r) => sum + (r.cost_usd || 0), 0);

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    const summary = {
      total_processed: results.length,
      successful: successCount,
      failed: failedCount,
      skipped_duplicates: results.filter(r => r.skipped).length,
      model: MODEL,
      total_cost_usd: Number(totalCost.toFixed(6)),
    };

    // Update circuit breaker based on results
    // If ALL articles failed, record a failure
    // If ANY article succeeded, record success (reset failure count)
    if (results.length > 0) {
      if (successCount > 0) {
        await recordSuccess(supabase);
      } else if (failedCount === results.length) {
        await recordFailure(supabase);
        await logPipelineEvent(supabase, 'error', 'All articles in batch failed', {
          batch_size: results.length,
          errors: results.map(r => r.error).filter(Boolean),
        });
      }
    }

    await logPipelineEvent(supabase, 'info', 'Batch processing complete', {
      successful: successCount,
      failed: failedCount,
      total_cost_usd: summary.total_cost_usd,
    });

    return new Response(
      JSON.stringify({ summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Explicitly log the error with stack trace for debugging
    const errorMessage = error?.message || String(error) || 'Unknown error';
    const errorStack = error?.stack || 'No stack trace';
    console.error('Process articles error:', errorMessage);
    console.error('Stack trace:', errorStack);

    // Record circuit breaker failure for unhandled errors
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await recordFailure(supabase);
        await logPipelineEvent(supabase, 'error', 'Unhandled error in process-articles', {
          error: errorMessage,
          stack: errorStack,
        });
      }
    } catch (innerError) {
      console.error('Failed to log error to database:', innerError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
