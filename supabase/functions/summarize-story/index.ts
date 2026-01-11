// Supabase Edge Function: Summarize Story
// Uses Claude AI to generate summaries and "Why it matters" sections

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

// Model tiers for cost optimization
const MODELS = {
  premium: 'claude-sonnet-4-20250514',  // Higher quality, higher cost
  standard: 'claude-3-5-haiku-20241022', // Good quality, ~4x cheaper
} as const;

/**
 * Select AI model based on source reliability score
 * - High reliability sources (>0.7) get Sonnet for best quality
 * - Standard sources get Haiku for cost efficiency
 */
function selectModel(reliabilityScore?: number): string {
  const score = reliabilityScore ?? 0.5;
  return score > 0.7 ? MODELS.premium : MODELS.standard;
}

interface AISummaryResponse {
  summary_ar: string;
  summary_en: string;
  why_it_matters_ar: string;
  why_it_matters_en: string;
  quality_score: number;
  topics: string[];
}

const SUMMARIZE_PROMPT = `You are a news summarization AI for Safha, a Saudi Arabian news app targeting busy professionals.

Your task is to summarize news articles in a way that can be read in 15-30 seconds.

For each article, provide:
1. summary_ar: Arabic summary (2-3 sentences, max 100 words)
2. summary_en: English summary (2-3 sentences, max 100 words)
3. why_it_matters_ar: "لماذا يهمك؟" section in Arabic (1-2 sentences explaining relevance to Saudi professionals)
4. why_it_matters_en: "Why it matters" section in English (1-2 sentences explaining relevance to Saudi professionals)
5. quality_score: Score from 0.0 to 1.0 based on news value, relevance, and credibility
6. topics: Array of topic slugs that apply (choose from: politics, economy, sports, technology, entertainment, health, science, travel)

Guidelines:
- Write in clear, professional Arabic and English
- Focus on facts, avoid sensationalism
- Make "Why it matters" specific to Saudi Arabian context when relevant
- For Arabic, use Modern Standard Arabic (فصحى)
- Prioritize accuracy over brevity

Respond ONLY with valid JSON, no markdown or explanation.`;

async function summarizeWithClaude(
  title: string,
  content: string,
  sourceLanguage: string,
  apiKey: string,
  model: string
): Promise<AISummaryResponse> {
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
      model,
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

  return JSON.parse(textContent.text);
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

    // Select model based on source reliability (cost optimization)
    const model = selectModel(reliability_score);
    console.log(`Using model ${model} for story ${story_id} (reliability: ${reliability_score ?? 'unknown'})`);

    // Generate summary with Claude
    const summary = await summarizeWithClaude(
      title,
      content,
      source_language || 'en',
      claudeApiKey,
      model
    );

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get topic IDs from slugs
    const { data: topicsData } = await supabase
      .from('topics')
      .select('id, slug')
      .in('slug', summary.topics);

    const topicIds = topicsData?.map((t: { id: string }) => t.id) || [];

    // Update story with AI-generated content
    const { data, error } = await supabase
      .from('stories')
      .update({
        summary_ar: summary.summary_ar,
        summary_en: summary.summary_en,
        why_it_matters_ar: summary.why_it_matters_ar,
        why_it_matters_en: summary.why_it_matters_en,
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
        model_used: model,
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
