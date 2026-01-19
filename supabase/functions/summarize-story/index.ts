// Supabase Edge Function: Summarize Story
// Uses Claude AI to generate Arabic summaries

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SummarizeRequest {
  story_id: string;
  title: string;
  content: string;
  source_language: 'ar' | 'en';
  reliability_score?: number;
}

// Model configuration - Sonnet only for best quality
const MODEL = 'claude-sonnet-4-20250514';

// Sonnet pricing (per 1M tokens) for cost calculation
const PRICING = {
  input: 3.00,   // $3.00 per 1M input tokens
  output: 15.00, // $15.00 per 1M output tokens
};

interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
}

interface SummarizeResult {
  summary: AISummaryResponse;
  usage: ClaudeUsage;
}

interface AISummaryResponse {
  summary_ar: string;
  quality_score: number;
  topics: string[];
}

const SUMMARIZE_PROMPT = `You are a news summarization AI for Safha, a Saudi Arabian news app targeting busy professionals.

Your task is to summarize news articles in Arabic in a way that can be read in 15-30 seconds.

For each article, provide:
1. summary_ar: Arabic summary (2-3 sentences, max 100 words, فصحى)
2. quality_score: Score from 0.0 to 1.0 based on news value, relevance, and credibility
3. topics: Array of topic slugs that apply (choose from: politics, economy, sports, technology, entertainment, health, science, travel)

Guidelines:
- Write in clear, professional Modern Standard Arabic (فصحى)
- Focus on facts, avoid sensationalism
- Make the summary relevant to Saudi Arabian context when applicable
- Prioritize accuracy over brevity

Respond ONLY with valid JSON, no markdown or explanation.`;

async function summarizeWithClaude(
  title: string,
  content: string,
  sourceLanguage: string,
  apiKey: string
): Promise<SummarizeResult> {
  const userMessage = `Please summarize this article:

Title: ${title}

Content:
${content.slice(0, 4000)}

Source language: ${sourceLanguage}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
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
      messages: [{ role: 'user', content: userMessage }],
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

  const summary = JSON.parse(textContent.text);
  return { summary, usage };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get API keys from environment
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!claudeApiKey) {
      throw new Error('CLAUDE_API_KEY not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Parse request body
    const { story_id, title, content, source_language, reliability_score }: SummarizeRequest = await req.json();

    if (!story_id || !title || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: story_id, title, content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Using model ${MODEL} for story ${story_id}`);

    // Generate summary with Claude
    const { summary, usage } = await summarizeWithClaude(
      title,
      content,
      source_language || 'en',
      claudeApiKey
    );

    // Calculate cost for tracking
    const cost_usd = (usage.input_tokens * PRICING.input + usage.output_tokens * PRICING.output) / 1_000_000;

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log API usage to database
    await supabase.from('api_usage').insert({
      function_name: 'summarize-story',
      model: MODEL,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd,
      story_id,
    });

    // Get topic IDs from slugs
    const { data: topicsData } = await supabase
      .from('topics')
      .select('id, slug')
      .in('slug', summary.topics);

    const topicIds = topicsData?.map((t: { id: string }) => t.id) || [];

    // Update story with AI-generated content (Arabic-only)
    const { data, error } = await supabase
      .from('stories')
      .update({
        summary_ar: summary.summary_ar,
        ai_quality_score: summary.quality_score,
        topic_ids: topicIds,
      })
      .eq('id', story_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        story: data,
        summary,
        model_used: MODEL,
        cost_usd: Number(cost_usd.toFixed(6)),
        tokens: usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Summarization error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
