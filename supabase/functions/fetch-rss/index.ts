// Supabase Edge Function: Fetch RSS Feeds
// Fetches articles from all active RSS sources and stores them in raw_articles

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { parseFeed } from 'https://deno.land/x/rss@1.0.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSSource {
  id: string;
  name: string;
  feed_url: string;
  language: string;
  reliability_score: number;
  fetch_interval_minutes: number;
  last_fetched_at: string | null;
  error_count: number;
}

interface FetchResult {
  source_id: string;
  source_name: string;
  articles_fetched: number;
  new_articles: number;
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

// Generate content hash for deduplication
async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// Extract image URL from RSS item
function extractImageUrl(item: any): string | null {
  // 1. Enclosure with image MIME type
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url;
  }

  // 2. Media content (handle both object and array)
  const mediaContent = item['media:content'];
  if (mediaContent) {
    const url = Array.isArray(mediaContent)
      ? mediaContent[0]?.url
      : mediaContent.url;
    if (url) return url;
  }

  // 3. Media thumbnail (handle both object and array)
  const mediaThumbnail = item['media:thumbnail'];
  if (mediaThumbnail) {
    const url = Array.isArray(mediaThumbnail)
      ? mediaThumbnail[0]?.url
      : mediaThumbnail.url;
    if (url) return url;
  }

  // 4. Direct image property
  if (item.image?.url) return item.image.url;
  if (typeof item.image === 'string') return item.image;

  // 5. iTunes image (podcast feeds)
  if (item['itunes:image']?.href) return item['itunes:image'].href;

  // 6. Try to extract from content HTML
  if (item.content?.value) {
    const imgMatch = item.content.value.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];
  }

  // 7. Try to extract from description HTML (many feeds use this)
  if (item.description?.value) {
    const imgMatch = item.description.value.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];
  }
  if (typeof item.description === 'string') {
    const imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];
  }

  return null;
}

// Fetch og:image from the actual webpage (fallback when RSS has no image)
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for slow sites

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Use browser-like User-Agent to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': url, // Some sites require this
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`[fetchOgImage] HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();

    // Try og:image first - flexible regex handles whitespace variations
    // Pattern 1: property before content (most common)
    let ogImageMatch = html.match(/<meta[^>]*?property\s*=\s*["']?og:image["']?[^>]*?content\s*=\s*["']([^"']+)["']/i);
    // Pattern 2: content before property
    if (!ogImageMatch) {
      ogImageMatch = html.match(/<meta[^>]*?content\s*=\s*["']([^"']+)["'][^>]*?property\s*=\s*["']?og:image["']?/i);
    }
    // Pattern 3: using itemprop instead of property
    if (!ogImageMatch) {
      ogImageMatch = html.match(/<meta[^>]*?itemprop\s*=\s*["']?image["']?[^>]*?content\s*=\s*["']([^"']+)["']/i);
    }
    if (ogImageMatch?.[1]) {
      const resolved = resolveImageUrl(ogImageMatch[1], url);
      if (resolved) return resolved;
    }

    // Try twitter:image with flexible patterns
    let twitterImageMatch = html.match(/<meta[^>]*?name\s*=\s*["']?twitter:image["']?[^>]*?content\s*=\s*["']([^"']+)["']/i);
    if (!twitterImageMatch) {
      twitterImageMatch = html.match(/<meta[^>]*?content\s*=\s*["']([^"']+)["'][^>]*?name\s*=\s*["']?twitter:image["']?/i);
    }
    if (twitterImageMatch?.[1]) {
      const resolved = resolveImageUrl(twitterImageMatch[1], url);
      if (resolved) return resolved;
    }

    // Try link rel="image_src" (older sites)
    const linkImageMatch = html.match(/<link[^>]*?rel\s*=\s*["']?image_src["']?[^>]*?href\s*=\s*["']([^"']+)["']/i);
    if (linkImageMatch?.[1]) {
      const resolved = resolveImageUrl(linkImageMatch[1], url);
      if (resolved) return resolved;
    }

    // Try first image in article, main, or content div
    const articleImgMatch = html.match(/<(?:article|main|div[^>]*class=["'][^"']*(?:content|article|post|entry)[^"']*["'])[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    if (articleImgMatch?.[1]) {
      const resolved = resolveImageUrl(articleImgMatch[1], url);
      if (resolved) return resolved;
    }

    // Last resort: any reasonably-sized image (not icons/logos)
    const anyImgMatch = html.match(/<img[^>]+src=["']([^"']+(?:jpg|jpeg|png|webp)[^"']*)["']/i);
    if (anyImgMatch?.[1]) {
      const resolved = resolveImageUrl(anyImgMatch[1], url);
      if (resolved) return resolved;
    }

    console.log(`[fetchOgImage] No image found in HTML for ${url}`);
    return null;
  } catch (error) {
    // Log failures for debugging
    console.error(`[fetchOgImage] Failed for ${url}:`, error.message || 'Unknown error');
    return null;
  }
}

// Extract video URL from RSS item
function extractVideoUrl(item: any): { url: string; type: string } | null {
  // Check enclosure for video
  if (item.enclosure?.url && item.enclosure.type?.startsWith('video/')) {
    return { url: item.enclosure.url, type: 'mp4' };
  }

  // Check media:content for video
  if (item['media:content']?.medium === 'video' && item['media:content'].url) {
    return { url: item['media:content'].url, type: 'mp4' };
  }

  // Check for video in media:group
  if (item['media:group']?.['media:content']) {
    const mediaContent = item['media:group']['media:content'];
    const videoContent = Array.isArray(mediaContent)
      ? mediaContent.find((m: any) => m.medium === 'video' || m.type?.startsWith('video/'))
      : (mediaContent.medium === 'video' || mediaContent.type?.startsWith('video/')) ? mediaContent : null;
    if (videoContent?.url) {
      return { url: videoContent.url, type: 'mp4' };
    }
  }

  // Check for YouTube embeds in content
  if (item.content?.value) {
    // YouTube embed URL
    const ytEmbedMatch = item.content.value.match(/youtube\.com\/embed\/([^"&?\s]+)/);
    if (ytEmbedMatch) {
      return { url: `https://www.youtube.com/watch?v=${ytEmbedMatch[1]}`, type: 'youtube' };
    }
    // YouTube watch URL
    const ytWatchMatch = item.content.value.match(/youtube\.com\/watch\?v=([^"&\s]+)/);
    if (ytWatchMatch) {
      return { url: `https://www.youtube.com/watch?v=${ytWatchMatch[1]}`, type: 'youtube' };
    }
    // Vimeo embed
    const vimeoMatch = item.content.value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return { url: `https://vimeo.com/${vimeoMatch[1]}`, type: 'vimeo' };
    }
  }

  return null;
}

// Clean HTML from content
function stripHtml(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchRSSSource(
  source: RSSSource,
  supabase: any
): Promise<FetchResult> {
  const result: FetchResult = {
    source_id: source.id,
    source_name: source.name,
    articles_fetched: 0,
    new_articles: 0,
  };

  try {
    // Fetch RSS feed with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(source.feed_url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Safha News Aggregator/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const feed = await parseFeed(xml);

    if (!feed.entries || feed.entries.length === 0) {
      throw new Error('No entries found in feed');
    }

    result.articles_fetched = feed.entries.length;

    // Process each entry
    for (const entry of feed.entries) {
      const guid = entry.id || entry.links?.[0]?.href || entry.title?.value;
      const url = entry.links?.[0]?.href || entry.id;
      const title = entry.title?.value || '';
      const content = entry.content?.value || entry.description?.value || '';
      const description = entry.description?.value || '';
      const author = entry.author?.name || entry['dc:creator'] || null;
      const publishedAt = entry.published || entry.updated || null;
      let imageUrl = extractImageUrl(entry);
      const videoInfo = extractVideoUrl(entry);

      if (!url || !title) continue;

      // Resolve relative URLs from RSS extraction
      if (imageUrl) {
        imageUrl = resolveImageUrl(imageUrl, url);
      }

      // Fallback: fetch og:image from webpage if RSS has no image
      if (!imageUrl && url) {
        imageUrl = await fetchOgImage(url);
      }

      // Final validation: ensure URL is absolute, discard invalid URLs
      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = null;
      }

      // Generate content hash for deduplication
      const contentHash = await generateContentHash(title + stripHtml(content));

      // Check for duplicates by URL or content hash
      const { data: existing } = await supabase
        .from('raw_articles')
        .select('id')
        .or(`original_url.eq.${url},content_hash.eq.${contentHash}`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Insert new article
      const { error: insertError } = await supabase
        .from('raw_articles')
        .insert({
          rss_source_id: source.id,
          guid,
          original_url: url,
          original_title: title,
          original_content: stripHtml(content),
          original_description: stripHtml(description),
          author,
          image_url: imageUrl,
          video_url: videoInfo?.url || null,
          video_type: videoInfo?.type || null,
          published_at: publishedAt,
          content_hash: contentHash,
          status: 'pending',
        });

      if (!insertError) {
        result.new_articles++;
      }
    }

    // Update source last_fetched_at and reset error count
    await supabase
      .from('rss_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        error_count: 0,
        last_error: null,
      })
      .eq('id', source.id);

  } catch (error) {
    result.error = error.message;

    // Update source with error info
    await supabase
      .from('rss_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        error_count: (source.error_count || 0) + 1,
        last_error: error.message,
      })
      .eq('id', source.id);
  }

  return result;
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

    // Parse optional limit from request body (default 10 to avoid resource limits)
    let sourceLimit = 10;
    try {
      const body = await req.json();
      if (body.limit) sourceLimit = Math.min(body.limit, 20);
    } catch {
      // No body or invalid JSON, use default
    }

    // Get sources that need fetching
    const { data: sources, error: sourcesError } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true)
      .lt('error_count', 5) // Skip sources with too many errors
      .or(`last_fetched_at.is.null,last_fetched_at.lt.${new Date(Date.now() - 30 * 60 * 1000).toISOString()}`)
      .order('last_fetched_at', { ascending: true, nullsFirst: true })
      .limit(sourceLimit);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No sources need fetching', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch sources in parallel (limit concurrency to avoid resource limits)
    const batchSize = 3;
    const results: FetchResult[] = [];

    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(source => fetchRSSSource(source, supabase))
      );
      results.push(...batchResults);
    }

    const summary = {
      sources_processed: results.length,
      total_articles_fetched: results.reduce((sum, r) => sum + r.articles_fetched, 0),
      total_new_articles: results.reduce((sum, r) => sum + r.new_articles, 0),
      errors: results.filter(r => r.error).length,
    };

    return new Response(
      JSON.stringify({ summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RSS fetch error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
