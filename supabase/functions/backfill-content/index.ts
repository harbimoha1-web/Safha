// Supabase Edge Function: Backfill Full Article Content
// Fetches full article text for stories that have null full_content

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackfillResult {
  story_id: string;
  original_url: string;
  content_found: boolean;
  content_length?: number;
  error?: string;
}

// Extract article content from HTML using multiple strategies
function extractArticleContent(html: string): string | null {
  // Step 1: Remove unwanted elements (scripts, styles, nav, etc.)
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<header\b[^>]*class=["'][^"']*(?:site|main|page|global)[^"']*["'][^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*(?:ad-|ads-|advert|promo|banner|sidebar|related|comment|share|social|newsletter|popup|modal)[^"']*["'][^<]*(?:(?!<\/div>)<[^<]*)*<\/div>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Step 2: Try to find the main article content using various strategies
  let articleHtml: string | null = null;

  // Strategy 1: Look for <article> tag (most semantic)
  const articleTagMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleTagMatch?.[1]) {
    articleHtml = articleTagMatch[1];
  }

  // Strategy 2: Look for common article content class names
  if (!articleHtml) {
    const contentPatterns = [
      /<div[^>]*class=["'][^"']*(?:article-body|article-content|article__body|article__content|post-body|post-content|post__body|post__content|entry-content|entry-body|story-body|story-content|news-body|news-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class=["'][^"']*(?:content-body|main-content|page-content|text-content|body-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id=["'](?:article|content|main-content|story|post)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class=["'][^"']*(?:article-text|news-text|story-text|content-text)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of contentPatterns) {
      const match = cleaned.match(pattern);
      if (match?.[1] && match[1].length > 200) {
        articleHtml = match[1];
        break;
      }
    }
  }

  // Strategy 3: Look for <main> tag
  if (!articleHtml) {
    const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch?.[1]) {
      articleHtml = mainMatch[1];
    }
  }

  // Strategy 4: Find the div with the most paragraph tags (heuristic)
  if (!articleHtml) {
    const divMatches = cleaned.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi);
    let bestContent = '';
    let maxParagraphs = 0;

    for (const match of divMatches) {
      const content = match[1];
      const paragraphCount = (content.match(/<p[^>]*>/gi) || []).length;
      const contentLength = content.replace(/<[^>]*>/g, '').length;

      if (paragraphCount > maxParagraphs && contentLength > 500) {
        maxParagraphs = paragraphCount;
        bestContent = content;
      }
    }

    if (bestContent && maxParagraphs >= 3) {
      articleHtml = bestContent;
    }
  }

  if (!articleHtml) {
    return null;
  }

  // Step 3: Extract and clean paragraphs
  const paragraphs: string[] = [];

  const pMatches = articleHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const match of pMatches) {
    const text = cleanHtmlToText(match[1]);
    if (text.length > 40) {
      paragraphs.push(text);
    }
  }

  if (paragraphs.length >= 2) {
    const fullContent = paragraphs.join('\n\n');
    if (fullContent.length >= 300) {
      return fullContent;
    }
  }

  // Fallback: if paragraphs extraction failed, try to get all text
  const allText = cleanHtmlToText(articleHtml);
  if (allText.length >= 300) {
    return allText.replace(/\s{3,}/g, '\n\n').trim();
  }

  return null;
}

// Clean HTML to readable text
function cleanHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, ''')
    .replace(/&rsquo;/g, ''')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '...')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

// Fetch and extract full article content from webpage
async function fetchArticleContent(url: string): Promise<string | null> {
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
      console.log(`[backfill-content] HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();
    return extractArticleContent(html);
  } catch (error) {
    console.error(`[backfill-content] Failed for ${url}:`, error.message || 'Unknown error');
    return null;
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

    // Parse optional limit from request body (default 20)
    let limit = 20;
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 50);
    } catch {
      // No body or invalid JSON, use default
    }

    // Get stories with null full_content
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, original_url')
      .is('full_content', null)
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

    // Process stories sequentially to avoid rate limiting
    const results: BackfillResult[] = [];
    let successCount = 0;

    for (const story of stories) {
      const result: BackfillResult = {
        story_id: story.id,
        original_url: story.original_url,
        content_found: false,
      };

      try {
        const fullContent = await fetchArticleContent(story.original_url);

        if (fullContent) {
          // Update the story with the found content
          const { error: updateError } = await supabase
            .from('stories')
            .update({ full_content: fullContent })
            .eq('id', story.id);

          if (updateError) {
            result.error = `Update failed: ${updateError.message}`;
          } else {
            result.content_found = true;
            result.content_length = fullContent.length;
            successCount++;
          }
        }
      } catch (error) {
        result.error = error.message;
      }

      results.push(result);

      // Small delay between requests to be nice to servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const summary = {
      total_processed: results.length,
      content_found: successCount,
      content_not_found: results.length - successCount,
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
