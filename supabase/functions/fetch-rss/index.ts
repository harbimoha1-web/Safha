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
}

interface FetchResult {
  source_id: string;
  source_name: string;
  articles_fetched: number;
  new_articles: number;
  error?: string;
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
  // Try various common image fields
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  if (item['media:content']?.url) {
    return item['media:content'].url;
  }
  if (item['media:thumbnail']?.url) {
    return item['media:thumbnail'].url;
  }
  // Try to extract from content
  if (item.content?.value) {
    const imgMatch = item.content.value.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];
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
      const imageUrl = extractImageUrl(entry);

      if (!url || !title) continue;

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
        error_count: supabase.sql`error_count + 1`,
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

    // Get sources that need fetching
    const { data: sources, error: sourcesError } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true)
      .lt('error_count', 5) // Skip sources with too many errors
      .or(`last_fetched_at.is.null,last_fetched_at.lt.${new Date(Date.now() - 30 * 60 * 1000).toISOString()}`);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No sources need fetching', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch sources in parallel (limit concurrency)
    const batchSize = 5;
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
