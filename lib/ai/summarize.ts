// AI Summarization Service
// Generates bilingual summaries and "Why it matters" sections

import type { AISummaryRequest, AISummaryResponse } from '@/types';

// Model tiers for cost optimization
export const AI_MODELS = {
  premium: 'claude-sonnet-4-20250514',  // Higher quality, higher cost
  standard: 'claude-3-5-haiku-20241022', // Good quality, ~4x cheaper
} as const;

export type AIModelTier = keyof typeof AI_MODELS;

/**
 * Select AI model based on source reliability score
 * - High reliability sources (>0.7) get Sonnet for best quality
 * - Standard sources get Haiku for cost efficiency
 */
export function selectModel(reliabilityScore?: number): string {
  const score = reliabilityScore ?? 0.5;
  return score > 0.7 ? AI_MODELS.premium : AI_MODELS.standard;
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

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

export interface SummarizeOptions {
  reliabilityScore?: number;
}

/**
 * Summarize an article using Claude AI
 * This function is meant to be called from a Supabase Edge Function
 * @param request - The article to summarize
 * @param apiKey - Claude API key
 * @param options - Optional settings including reliabilityScore for model selection
 */
export async function summarizeArticle(
  request: AISummaryRequest,
  apiKey: string,
  options?: SummarizeOptions
): Promise<AISummaryResponse> {
  const model = selectModel(options?.reliabilityScore);

  const userMessage = `Please summarize this article:

Title: ${request.title}

Content:
${request.content}

Source language: ${request.source_language}`;

  const messages: ClaudeMessage[] = [
    { role: 'user', content: userMessage }
  ];

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
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as ClaudeResponse;
  const textContent = data.content.find(c => c.type === 'text');

  if (!textContent) {
    throw new Error('No text content in Claude response');
  }

  try {
    const result = JSON.parse(textContent.text) as AISummaryResponse;
    return result;
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${textContent.text}`);
  }
}

export interface BatchSummarizeRequest extends AISummaryRequest {
  reliabilityScore?: number;
}

/**
 * Batch summarize multiple articles
 * Each article can have its own reliabilityScore for model selection
 */
export async function batchSummarize(
  requests: BatchSummarizeRequest[],
  apiKey: string,
  concurrency = 3
): Promise<AISummaryResponse[]> {
  const results: AISummaryResponse[] = [];

  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(req => summarizeArticle(req, apiKey, { reliabilityScore: req.reliabilityScore }))
    );
    results.push(...batchResults);
  }

  return results;
}
