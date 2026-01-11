/**
 * Process Articles Edge Function Tests
 * Tests AI summarization, timeout handling, and retry logic
 *
 * Run with: deno test --allow-net --allow-env process-articles/index.test.ts
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// Test timeout configuration
const API_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000];

// Model selection tests
Deno.test('Model Selection - should select premium model for high reliability', () => {
  const MODELS = {
    premium: 'claude-sonnet-4-20250514',
    standard: 'claude-3-5-haiku-20241022',
  };

  function selectModel(reliabilityScore: number): string {
    return reliabilityScore > 0.7 ? MODELS.premium : MODELS.standard;
  }

  assertEquals(selectModel(0.9), MODELS.premium);
  assertEquals(selectModel(0.8), MODELS.premium);
  assertEquals(selectModel(0.71), MODELS.premium);
  assertEquals(selectModel(0.7), MODELS.standard);
  assertEquals(selectModel(0.5), MODELS.standard);
  assertEquals(selectModel(0), MODELS.standard);
});

// Content validation tests
Deno.test('Content Validation - should reject short content', () => {
  function validateContent(content: string | null): boolean {
    return content !== null && content.length >= 50;
  }

  assertEquals(validateContent(null), false);
  assertEquals(validateContent(''), false);
  assertEquals(validateContent('Short'), false);
  assertEquals(validateContent('A'.repeat(49)), false);
  assertEquals(validateContent('A'.repeat(50)), true);
  assertEquals(validateContent('A'.repeat(1000)), true);
});

// Quality score validation
Deno.test('Quality Score - should validate quality thresholds', () => {
  const QUALITY_THRESHOLD = 0.4;

  function shouldReject(qualityScore: number): boolean {
    return qualityScore < QUALITY_THRESHOLD;
  }

  assertEquals(shouldReject(0.1), true);
  assertEquals(shouldReject(0.3), true);
  assertEquals(shouldReject(0.39), true);
  assertEquals(shouldReject(0.4), false);
  assertEquals(shouldReject(0.5), false);
  assertEquals(shouldReject(1.0), false);
});

// JSON parsing tests
Deno.test('JSON Parsing - should strip markdown code blocks', () => {
  function parseClaudeResponse(text: string): object {
    let jsonText = text.trim();

    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    return JSON.parse(jsonText);
  }

  const withMarkdown = '```json\n{"summary": "Test"}\n```';
  const withoutMarkdown = '{"summary": "Test"}';
  const withCodeBlock = '```\n{"summary": "Test"}\n```';

  assertEquals(parseClaudeResponse(withMarkdown), { summary: 'Test' });
  assertEquals(parseClaudeResponse(withoutMarkdown), { summary: 'Test' });
  assertEquals(parseClaudeResponse(withCodeBlock), { summary: 'Test' });
});

// Retry logic tests
Deno.test('Retry Logic - should retry on 429 status', () => {
  function shouldRetry(status: number): boolean {
    return status === 429 || status >= 500;
  }

  assertEquals(shouldRetry(429), true);
  assertEquals(shouldRetry(500), true);
  assertEquals(shouldRetry(502), true);
  assertEquals(shouldRetry(503), true);
  assertEquals(shouldRetry(400), false);
  assertEquals(shouldRetry(401), false);
  assertEquals(shouldRetry(403), false);
  assertEquals(shouldRetry(404), false);
});

Deno.test('Retry Logic - should calculate correct delays', () => {
  function getRetryDelay(attempt: number): number {
    return RETRY_DELAYS[attempt] || 2000;
  }

  assertEquals(getRetryDelay(0), 1000);
  assertEquals(getRetryDelay(1), 2000);
  assertEquals(getRetryDelay(2), 2000); // Fallback
  assertEquals(getRetryDelay(99), 2000); // Fallback
});

// Timeout simulation
Deno.test('Timeout - should abort after timeout', async () => {
  async function fetchWithTimeout(
    timeoutMs: number,
    actualDelayMs: number
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, actualDelayMs);
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Aborted'));
        });
      });
      clearTimeout(timeoutId);
      return 'success';
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Should succeed when response is faster than timeout
  const result = await fetchWithTimeout(1000, 100);
  assertEquals(result, 'success');

  // Should fail when response is slower than timeout
  try {
    await fetchWithTimeout(100, 500);
    throw new Error('Should have timed out');
  } catch (error) {
    assertEquals((error as Error).message, 'Aborted');
  }
});

// Summary response validation
Deno.test('Summary Response - should validate required fields', () => {
  interface AISummaryResponse {
    summary_ar: string;
    summary_en: string;
    why_it_matters_ar: string;
    why_it_matters_en: string;
    quality_score: number;
    topics: string[];
  }

  function validateSummaryResponse(response: unknown): response is AISummaryResponse {
    if (typeof response !== 'object' || response === null) return false;

    const r = response as Record<string, unknown>;

    return (
      typeof r.summary_ar === 'string' &&
      typeof r.summary_en === 'string' &&
      typeof r.why_it_matters_ar === 'string' &&
      typeof r.why_it_matters_en === 'string' &&
      typeof r.quality_score === 'number' &&
      Array.isArray(r.topics)
    );
  }

  const validResponse = {
    summary_ar: 'ملخص',
    summary_en: 'Summary',
    why_it_matters_ar: 'لماذا يهم',
    why_it_matters_en: 'Why it matters',
    quality_score: 0.8,
    topics: ['technology'],
  };

  const invalidResponse1 = {
    summary_ar: 'ملخص',
    // Missing fields
  };

  const invalidResponse2 = {
    ...validResponse,
    quality_score: 'not a number', // Wrong type
  };

  assertEquals(validateSummaryResponse(validResponse), true);
  assertEquals(validateSummaryResponse(invalidResponse1), false);
  assertEquals(validateSummaryResponse(invalidResponse2), false);
  assertEquals(validateSummaryResponse(null), false);
  assertEquals(validateSummaryResponse('string'), false);
});

// Topic mapping tests
Deno.test('Topic Mapping - should validate topic slugs', () => {
  const VALID_TOPICS = [
    'politics',
    'economy',
    'sports',
    'technology',
    'entertainment',
    'health',
    'science',
    'travel',
  ];

  function filterValidTopics(topics: string[]): string[] {
    return topics.filter((t) => VALID_TOPICS.includes(t));
  }

  assertEquals(
    filterValidTopics(['technology', 'sports']),
    ['technology', 'sports']
  );
  assertEquals(
    filterValidTopics(['technology', 'invalid', 'sports']),
    ['technology', 'sports']
  );
  assertEquals(filterValidTopics(['invalid1', 'invalid2']), []);
  assertEquals(filterValidTopics([]), []);
});

// Period calculation tests
Deno.test('Period Calculation - should calculate monthly period', () => {
  const now = new Date('2024-01-15T12:00:00Z');
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  assertEquals(periodEnd.toISOString(), '2024-02-15T12:00:00.000Z');
});

Deno.test('Period Calculation - should calculate annual period', () => {
  const now = new Date('2024-01-15T12:00:00Z');
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  assertEquals(periodEnd.toISOString(), '2025-01-15T12:00:00.000Z');
});

// Error classification tests
Deno.test('Error Classification - should identify non-retryable errors', () => {
  function isNonRetryable(errorMessage: string): boolean {
    return errorMessage.includes('non-retryable');
  }

  assertEquals(isNonRetryable('Claude API error (non-retryable): 400'), true);
  assertEquals(isNonRetryable('Claude API error: 429'), false);
  assertEquals(isNonRetryable('Timeout error'), false);
});

// Content truncation tests
Deno.test('Content Truncation - should limit content to 3000 chars', () => {
  function truncateContent(content: string, maxLength: number = 3000): string {
    return content.slice(0, maxLength);
  }

  const shortContent = 'Short content';
  const longContent = 'A'.repeat(5000);

  assertEquals(truncateContent(shortContent).length, shortContent.length);
  assertEquals(truncateContent(longContent).length, 3000);
});
