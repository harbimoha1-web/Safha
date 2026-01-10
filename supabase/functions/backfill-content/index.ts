// Supabase Edge Function: Backfill Full Article Content
// Fetches full article text for stories that have null full_content
// Uses DOM parsing, JSON-LD extraction, and quality scoring

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { DOMParser, Element } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackfillResult {
  story_id: string;
  original_url: string;
  content_found: boolean;
  content_length?: number;
  content_quality?: number;
  extraction_method?: string;
  error?: string;
}

interface ContentQuality {
  paragraphCount: number;
  avgParagraphLength: number;
  totalLength: number;
  hasProperStructure: boolean;
}

// Calculate content quality score (0-1)
function calculateQualityScore(quality: ContentQuality): number {
  let score = 0;
  if (quality.paragraphCount >= 5) score += 0.3;
  else if (quality.paragraphCount >= 3) score += 0.2;
  else if (quality.paragraphCount >= 2) score += 0.1;

  if (quality.avgParagraphLength >= 100) score += 0.3;
  else if (quality.avgParagraphLength >= 60) score += 0.2;
  else if (quality.avgParagraphLength >= 40) score += 0.1;

  if (quality.totalLength >= 1500) score += 0.2;
  else if (quality.totalLength >= 800) score += 0.15;
  else if (quality.totalLength >= 400) score += 0.1;

  if (quality.hasProperStructure) score += 0.2;
  return Math.min(score, 1);
}

// Boilerplate phrases to filter out
const BOILERPLATE_PATTERNS = [
  /copyright|©|all rights reserved/i,
  /subscribe|newsletter|sign up/i,
  /share on|follow us|like us/i,
  /read more|continue reading|click here/i,
  /advertisement|sponsored|promoted/i,
  /cookie|privacy policy|terms of/i,
  /اشترك|تابعنا|شاركنا/i,
  /حقوق النشر|جميع الحقوق محفوظة/i,
  /اقرأ أيضا|مواضيع ذات صلة/i,
];

function isBoilerplate(text: string): boolean {
  return BOILERPLATE_PATTERNS.some(pattern => pattern.test(text));
}

function cleanText(text: string): string {
  return text
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/  +/g, ' ')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

// Extract from JSON-LD structured data
function extractFromJsonLd(doc: Document): string | null {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent || '');
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (['NewsArticle', 'Article', 'BlogPosting', 'WebPage'].includes(item['@type'])) {
          if (item.articleBody && typeof item.articleBody === 'string') {
            return cleanText(item.articleBody);
          }
          if (item.text && typeof item.text === 'string') {
            return cleanText(item.text);
          }
          if (item.description && typeof item.description === 'string' && item.description.length > 300) {
            return cleanText(item.description);
          }
        }
      }
    } catch {
      // Invalid JSON, continue
    }
  }
  return null;
}

// DOM-based content extraction
function extractArticleContentDOM(doc: Document): { content: string | null; quality: ContentQuality } {
  const defaultQuality: ContentQuality = {
    paragraphCount: 0,
    avgParagraphLength: 0,
    totalLength: 0,
    hasProperStructure: false,
  };

  // Remove unwanted elements
  const unwantedSelectors = [
    'script', 'style', 'nav', 'footer', 'aside', 'header',
    '.ad', '.ads', '.advertisement', '.promo', '.banner',
    '.sidebar', '.related', '.comments', '.share', '.social',
    '.newsletter', '.popup', '.modal', '[role="navigation"]',
    '.breadcrumb', '.pagination', '.author-bio', '.tags',
  ];

  for (const selector of unwantedSelectors) {
    const elements = doc.querySelectorAll(selector);
    for (const el of elements) {
      el.remove();
    }
  }

  // Content container selectors
  const contentSelectors = [
    'article', 'main article', '[role="article"]',
    '.article-body', '.article-content', '.article__body', '.article__content',
    '.post-body', '.post-content', '.post__body', '.post__content',
    '.entry-content', '.entry-body', '.story-body', '.story-content',
    '.news-body', '.news-content', '.content-body', '.main-content',
    '.article-text', '.news-text', '.story-text', '.content-text',
    '.td-post-content', '.jeg_post_content', '.single-content',
    '#article', '#content', '#main-content', '#story', '#post-content',
    'main', '[role="main"]',
  ];

  let contentElement: Element | null = null;

  for (const selector of contentSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      const text = el.textContent || '';
      if (text.length > 200) {
        contentElement = el as Element;
        defaultQuality.hasProperStructure = true;
        break;
      }
    }
  }

  // Fallback: find div with most paragraphs
  if (!contentElement) {
    const divs = doc.querySelectorAll('div');
    let maxScore = 0;
    for (const div of divs) {
      const paragraphs = div.querySelectorAll('p');
      const textLength = (div.textContent || '').length;
      const score = paragraphs.length * 100 + textLength;
      if (score > maxScore && paragraphs.length >= 2 && textLength > 300) {
        maxScore = score;
        contentElement = div as Element;
      }
    }
  }

  if (!contentElement) {
    return { content: null, quality: defaultQuality };
  }

  // Extract paragraphs
  const paragraphs: string[] = [];
  const pElements = contentElement.querySelectorAll('p');

  for (const p of pElements) {
    const text = cleanText(p.textContent || '');
    if (text.length < 40) continue;
    if (isBoilerplate(text)) continue;
    paragraphs.push(text);
  }

  // Fallback for non-paragraph content
  if (paragraphs.length < 2) {
    const allText = cleanText(contentElement.textContent || '');
    if (allText.length >= 300 && !isBoilerplate(allText)) {
      const sentences = allText.split(/(?<=[.!?،。])\s+/);
      let currentParagraph = '';
      for (const sentence of sentences) {
        currentParagraph += sentence + ' ';
        if (currentParagraph.length >= 150) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
      }
      if (currentParagraph.trim().length > 40) {
        paragraphs.push(currentParagraph.trim());
      }
    }
  }

  if (paragraphs.length === 0) {
    return { content: null, quality: defaultQuality };
  }

  const fullContent = paragraphs.join('\n\n');
  const quality: ContentQuality = {
    paragraphCount: paragraphs.length,
    avgParagraphLength: fullContent.length / paragraphs.length,
    totalLength: fullContent.length,
    hasProperStructure: defaultQuality.hasProperStructure,
  };

  if (fullContent.length < 200) {
    return { content: null, quality };
  }

  return { content: fullContent, quality };
}

// Fetch and extract content from URL
async function fetchArticleContent(url: string): Promise<{
  content: string | null;
  quality: number;
  method: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': url,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { content: null, quality: 0, method: 'failed' };
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      return { content: null, quality: 0, method: 'parse_failed' };
    }

    // Try JSON-LD first (most reliable)
    const jsonLdContent = extractFromJsonLd(doc);
    if (jsonLdContent && jsonLdContent.length >= 300) {
      return { content: jsonLdContent, quality: 0.9, method: 'json-ld' };
    }

    // DOM-based extraction
    const { content, quality } = extractArticleContentDOM(doc);
    if (content) {
      return {
        content,
        quality: calculateQualityScore(quality),
        method: 'dom',
      };
    }

    return { content: null, quality: 0, method: 'not_found' };
  } catch (error) {
    console.error(`[backfill-content] Failed for ${url}:`, error.message);
    return { content: null, quality: 0, method: 'error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse options from request
    let limit = 20;
    let minQuality = 0; // Minimum quality threshold
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 50);
      if (body.min_quality) minQuality = body.min_quality;
    } catch {
      // Use defaults
    }

    // Get stories with null or low-quality full_content
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, original_url, content_quality')
      .or(`full_content.is.null,content_quality.lt.${minQuality}`)
      .not('original_url', 'is', null)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (storiesError) {
      throw new Error(`Failed to fetch stories: ${storiesError.message}`);
    }

    if (!stories || stories.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No stories need content backfilling', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[backfill-content] Processing ${stories.length} stories`);

    const results: BackfillResult[] = [];
    let successCount = 0;

    for (const story of stories) {
      const result: BackfillResult = {
        story_id: story.id,
        original_url: story.original_url,
        content_found: false,
      };

      try {
        const { content, quality, method } = await fetchArticleContent(story.original_url);

        if (content && quality >= minQuality) {
          const { error: updateError } = await supabase
            .from('stories')
            .update({
              full_content: content,
              content_quality: quality,
            })
            .eq('id', story.id);

          if (updateError) {
            result.error = `Update failed: ${updateError.message}`;
          } else {
            result.content_found = true;
            result.content_length = content.length;
            result.content_quality = quality;
            result.extraction_method = method;
            successCount++;
          }
        } else {
          result.extraction_method = method;
        }
      } catch (error) {
        result.error = error.message;
      }

      results.push(result);

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const summary = {
      total_processed: results.length,
      content_found: successCount,
      content_not_found: results.length - successCount,
      avg_quality: successCount > 0
        ? results.filter(r => r.content_quality).reduce((sum, r) => sum + (r.content_quality || 0), 0) / successCount
        : 0,
    };

    console.log(`[backfill-content] Complete: ${successCount}/${results.length} articles extracted`);

    return new Response(
      JSON.stringify({ summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[backfill-content] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
