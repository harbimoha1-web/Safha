// Supabase Edge Function: Process Articles with AI
// Takes pending raw_articles and creates stories with AI summaries

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  published_at: string | null;
  rss_source: {
    language: string;
    name: string;
    reliability_score: number;
  };
}

interface AISummaryResponse {
  summary_ar: string;
  summary_en: string;
  why_it_matters_ar: string;
  why_it_matters_en: string;
  quality_score: number;
  topics: string[];
}

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

async function summarizeWithClaude(
  title: string,
  content: string,
  sourceLanguage: string,
  sourceName: string,
  apiKey: string
): Promise<AISummaryResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
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

  return JSON.parse(textContent.text);
}

async function processArticle(
  article: RawArticle,
  supabase: any,
  claudeApiKey: string
): Promise<{ success: boolean; story_id?: string; error?: string }> {
  try {
    // Mark as processing
    await supabase
      .from('raw_articles')
      .update({ status: 'processing' })
      .eq('id', article.id);

    // Get content (prefer full content, fallback to description)
    const content = article.original_content || article.original_description || '';

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

    // Generate AI summary
    const summary = await summarizeWithClaude(
      article.original_title,
      content,
      article.rss_source.language,
      article.rss_source.name,
      claudeApiKey
    );

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
    let sourceId: string | null = null;
    const { data: existingSource } = await supabase
      .from('sources')
      .select('id')
      .eq('name', article.rss_source.name)
      .single();

    if (existingSource) {
      sourceId = existingSource.id;
    } else {
      const { data: newSource } = await supabase
        .from('sources')
        .insert({
          name: article.rss_source.name,
          url: article.original_url.split('/').slice(0, 3).join('/'),
          language: article.rss_source.language,
          reliability_score: article.rss_source.reliability_score,
        })
        .select('id')
        .single();
      sourceId = newSource?.id;
    }

    // Map topic slugs to IDs
    const { data: topicsData } = await supabase
      .from('topics')
      .select('id, slug')
      .in('slug', summary.topics);

    const topicIds = topicsData?.map((t: { id: string }) => t.id) || [];

    // Create story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        source_id: sourceId,
        original_url: article.original_url,
        original_title: article.original_title,
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
        topic_ids: topicIds,
        published_at: article.published_at,
        is_approved: false, // Requires admin approval
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

    return { success: true, story_id: story.id };

  } catch (error) {
    // Mark as failed
    await supabase
      .from('raw_articles')
      .update({
        status: 'failed',
        error_message: error.message,
        retry_count: supabase.sql`retry_count + 1`,
        processed_at: new Date().toISOString(),
      })
      .eq('id', article.id);

    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Parse optional limit from request
    let limit = 10;
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 50);
    } catch {
      // No body or invalid JSON, use default
    }

    // Get pending articles (prioritize by reliability score)
    const { data: articles, error: articlesError } = await supabase
      .from('raw_articles')
      .select(`
        *,
        rss_source:rss_sources(language, name, reliability_score)
      `)
      .eq('status', 'pending')
      .lt('retry_count', 3)
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

    const summary = {
      total_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };

    return new Response(
      JSON.stringify({ summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process articles error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
