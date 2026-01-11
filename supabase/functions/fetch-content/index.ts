// Supabase Edge Function: Fetch Content On-Demand
// Extracts full article content for a single story when user opens it
// Uses robust extraction logic from backfill-content

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { DOMParser, Element } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts';
import { Readability } from 'https://esm.sh/@mozilla/readability@0.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentQuality {
  paragraphCount: number;
  avgParagraphLength: number;
  totalLength: number;
  hasProperStructure: boolean;
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

// Clean text content
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

// Calculate quality score from Readability article
function calculateReadabilityQuality(article: any): number {
  let score = 0.5;
  const length = article.textContent?.length || 0;

  if (length >= 2000) score += 0.25;
  else if (length >= 1000) score += 0.2;
  else if (length >= 500) score += 0.15;
  else if (length >= 300) score += 0.1;

  if (article.excerpt && article.excerpt.length > 50) score += 0.1;
  if (article.byline) score += 0.05;
  if (article.siteName) score += 0.05;

  const paragraphCount = (article.textContent?.match(/\n\n/g) || []).length + 1;
  if (paragraphCount >= 3) score += 0.05;

  return Math.min(score, 1);
}

// Extract content from JSON-LD structured data
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

// Robust DOM-based content extraction (from backfill-content)
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

  // Comprehensive content container selectors
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
      console.log(`[fetch-content] HTTP ${response.status} for ${url}`);
      return { content: null, quality: 0, method: 'http_error' };
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      return { content: null, quality: 0, method: 'parse_failed' };
    }

    // Strategy 1: Mozilla Readability (best quality)
    try {
      const docClone = doc.cloneNode(true);
      const reader = new Readability(docClone, {
        charThreshold: 200,
        keepClasses: false,
        disableJSONLD: false,
      });
      const article = reader.parse();

      if (article && article.textContent && article.textContent.length >= 200) {
        const content = cleanText(article.textContent);
        const quality = calculateReadabilityQuality(article);
        console.log(`[fetch-content] Readability: ${content.length} chars from ${url}`);
        return { content, quality, method: 'readability' };
      }
    } catch (err) {
      console.log(`[fetch-content] Readability failed: ${err.message}`);
    }

    // Strategy 2: JSON-LD structured data
    const jsonLdContent = extractFromJsonLd(doc);
    if (jsonLdContent && jsonLdContent.length >= 300) {
      console.log(`[fetch-content] JSON-LD: ${jsonLdContent.length} chars from ${url}`);
      return { content: jsonLdContent, quality: 0.85, method: 'json-ld' };
    }

    // Strategy 3: Robust DOM-based extraction (25+ selectors, fallbacks)
    const { content, quality } = extractArticleContentDOM(doc);
    if (content) {
      console.log(`[fetch-content] DOM: ${content.length} chars from ${url}`);
      return {
        content,
        quality: calculateQualityScore(quality),
        method: 'dom',
      };
    }

    return { content: null, quality: 0, method: 'not_found' };
  } catch (error) {
    console.error(`[fetch-content] Error for ${url}:`, error.message);
    return { content: null, quality: 0, method: 'error' };
  }
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Parse request body
    const { story_id, url } = await req.json();

    if (!story_id || !url) {
      return new Response(
        JSON.stringify({ error: 'story_id and url are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[fetch-content] Fetching content for story ${story_id}: ${url}`);

    // Fetch and extract content
    const { content, quality, method } = await fetchArticleContent(url);

    if (content && content.length >= 100) {
      // Update the story with the extracted content
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          full_content: content,
          content_quality: quality,
        })
        .eq('id', story_id);

      if (updateError) {
        console.error(`[fetch-content] Update failed:`, updateError.message);
        // Still return the content even if save failed
      } else {
        console.log(`[fetch-content] Saved ${content.length} chars (quality: ${quality}, method: ${method}) for story ${story_id}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          content,
          quality,
          method,
          length: content.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Content extraction failed
    console.log(`[fetch-content] Extraction failed for ${url} - method: ${method}`);
    return new Response(
      JSON.stringify({
        success: false,
        content: null,
        method,
        error: 'Could not extract content from this article',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[fetch-content] Error:', error);
    console.error('[fetch-content] Stack:', error.stack);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
