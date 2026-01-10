// Supabase Edge Function: Backfill Images
// Fetches og:image for stories that have null image_url

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackfillResult {
  story_id: string;
  original_url: string;
  image_found: boolean;
  image_url?: string;
  error?: string;
}

// Resolve relative URLs to absolute URLs
function resolveImageUrl(imageUrl: string | null, baseUrl: string): string | null {
  if (!imageUrl) return null;

  // Already absolute
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Protocol-relative (//example.com/img.jpg)
  if (imageUrl.startsWith('//')) {
    return 'https:' + imageUrl;
  }

  // Relative URL - resolve against base
  try {
    const base = new URL(baseUrl);
    return new URL(imageUrl, base.origin).href;
  } catch {
    return null;
  }
}

// Fetch og:image from webpage
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

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
      console.log(`[backfill] HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();

    // Try og:image first - flexible regex handles whitespace variations
    let ogImageMatch = html.match(/<meta[^>]*?property\s*=\s*["']?og:image["']?[^>]*?content\s*=\s*["']([^"']+)["']/i);
    if (!ogImageMatch) {
      ogImageMatch = html.match(/<meta[^>]*?content\s*=\s*["']([^"']+)["'][^>]*?property\s*=\s*["']?og:image["']?/i);
    }
    if (!ogImageMatch) {
      ogImageMatch = html.match(/<meta[^>]*?itemprop\s*=\s*["']?image["']?[^>]*?content\s*=\s*["']([^"']+)["']/i);
    }
    if (ogImageMatch?.[1]) {
      const resolved = resolveImageUrl(ogImageMatch[1], url);
      if (resolved) return resolved;
    }

    // Try twitter:image
    let twitterImageMatch = html.match(/<meta[^>]*?name\s*=\s*["']?twitter:image["']?[^>]*?content\s*=\s*["']([^"']+)["']/i);
    if (!twitterImageMatch) {
      twitterImageMatch = html.match(/<meta[^>]*?content\s*=\s*["']([^"']+)["'][^>]*?name\s*=\s*["']?twitter:image["']?/i);
    }
    if (twitterImageMatch?.[1]) {
      const resolved = resolveImageUrl(twitterImageMatch[1], url);
      if (resolved) return resolved;
    }

    // Try link rel="image_src"
    const linkImageMatch = html.match(/<link[^>]*?rel\s*=\s*["']?image_src["']?[^>]*?href\s*=\s*["']([^"']+)["']/i);
    if (linkImageMatch?.[1]) {
      const resolved = resolveImageUrl(linkImageMatch[1], url);
      if (resolved) return resolved;
    }

    // Try first image in article/main/content
    const articleImgMatch = html.match(/<(?:article|main|div[^>]*class=["'][^"']*(?:content|article|post|entry)[^"']*["'])[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    if (articleImgMatch?.[1]) {
      const resolved = resolveImageUrl(articleImgMatch[1], url);
      if (resolved) return resolved;
    }

    // Last resort: any image with common extensions
    const anyImgMatch = html.match(/<img[^>]+src=["']([^"']+(?:jpg|jpeg|png|webp)[^"']*)["']/i);
    if (anyImgMatch?.[1]) {
      const resolved = resolveImageUrl(anyImgMatch[1], url);
      if (resolved) return resolved;
    }

    return null;
  } catch (error) {
    console.error(`[backfill] Failed for ${url}:`, error.message || 'Unknown error');
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

    // Get stories with null image_url
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, original_url')
      .is('image_url', null)
      .not('original_url', 'is', null)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (storiesError) {
      throw new Error(`Failed to fetch stories: ${storiesError.message}`);
    }

    if (!stories || stories.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No stories need backfilling', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[backfill] Processing ${stories.length} stories`);

    // Process stories sequentially to avoid rate limiting
    const results: BackfillResult[] = [];
    let successCount = 0;

    for (const story of stories) {
      const result: BackfillResult = {
        story_id: story.id,
        original_url: story.original_url,
        image_found: false,
      };

      try {
        const imageUrl = await fetchOgImage(story.original_url);

        if (imageUrl) {
          // Update the story with the found image
          const { error: updateError } = await supabase
            .from('stories')
            .update({ image_url: imageUrl })
            .eq('id', story.id);

          if (updateError) {
            result.error = `Update failed: ${updateError.message}`;
          } else {
            result.image_found = true;
            result.image_url = imageUrl;
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
      images_found: successCount,
      images_not_found: results.length - successCount,
    };

    console.log(`[backfill] Complete: ${successCount}/${results.length} images found`);

    return new Response(
      JSON.stringify({ summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[backfill] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
