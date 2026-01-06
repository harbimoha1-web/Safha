// AI Content Scoring Service
// Evaluates news articles for quality, relevance, and credibility

interface ContentScoreResult {
  overall_score: number;
  news_value: number;
  relevance: number;
  credibility: number;
  reasoning: string;
}

const SCORE_PROMPT = `You are a news editor AI that evaluates articles for quality.

Score articles on a scale of 0.0 to 1.0 based on:
1. news_value: How newsworthy is this? (0.0-1.0)
2. relevance: How relevant to Saudi Arabian professionals? (0.0-1.0)
3. credibility: How credible and factual does this appear? (0.0-1.0)
4. overall_score: Weighted average (news_value * 0.3 + relevance * 0.4 + credibility * 0.3)

Consider:
- Breaking news scores higher
- Regional relevance to GCC/MENA
- Source reliability
- Factual reporting vs opinion

Respond ONLY with valid JSON:
{
  "overall_score": 0.85,
  "news_value": 0.9,
  "relevance": 0.8,
  "credibility": 0.85,
  "reasoning": "Brief explanation"
}`;

/**
 * Score content quality and relevance
 */
export async function scoreContent(
  title: string,
  content: string,
  source: string,
  apiKey: string
): Promise<ContentScoreResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: SCORE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please score this article:

Source: ${source}
Title: ${title}

Content:
${content.slice(0, 2000)}`, // Limit content length
        },
      ],
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

  try {
    return JSON.parse(textContent.text) as ContentScoreResult;
  } catch {
    throw new Error(`Failed to parse score response: ${textContent.text}`);
  }
}

/**
 * Check if content meets minimum quality threshold
 */
export function meetsQualityThreshold(
  score: ContentScoreResult,
  threshold = 0.6
): boolean {
  return score.overall_score >= threshold;
}

/**
 * Get quality tier label
 */
export function getQualityTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}
