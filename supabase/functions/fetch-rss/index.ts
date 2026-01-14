// Supabase Edge Function: Fetch RSS Feeds
// Fetches articles from all active RSS sources and stores them in raw_articles

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { parseFeed } from 'https://deno.land/x/rss@1.0.0/mod.ts';
import { DOMParser, Element } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts';
import { Readability } from 'https://esm.sh/@mozilla/readability@0.5.0';

const ALLOWED_ORIGINS = [
  'https://safha.app',
  'https://www.safha.app',
  'https://qnibkvemxmhjgzydstlg.supabase.co',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

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

// Result from webpage scraping (image + full content + video)
interface WebpageData {
  imageUrl: string | null;
  fullContent: string | null;
  contentQuality: number; // 0-1 score
  extractionMethod: 'readability' | 'json-ld' | 'dom' | 'failed';
  // Readability metadata
  excerpt?: string | null;
  byline?: string | null;
  siteName?: string | null;
  // Video extracted from HTML
  videoUrl: string | null;
  videoType: 'mp4' | 'youtube' | 'vimeo' | 'dailymotion' | null;
}

// Content quality indicators
interface ContentQuality {
  paragraphCount: number;
  avgParagraphLength: number;
  totalLength: number;
  hasProperStructure: boolean;
}

// Calculate content quality score (0-1)
function calculateQualityScore(quality: ContentQuality): number {
  let score = 0;

  // Paragraph count (0-0.3)
  if (quality.paragraphCount >= 5) score += 0.3;
  else if (quality.paragraphCount >= 3) score += 0.2;
  else if (quality.paragraphCount >= 2) score += 0.1;

  // Average paragraph length (0-0.3)
  if (quality.avgParagraphLength >= 100) score += 0.3;
  else if (quality.avgParagraphLength >= 60) score += 0.2;
  else if (quality.avgParagraphLength >= 40) score += 0.1;

  // Total length (0-0.2)
  if (quality.totalLength >= 1500) score += 0.2;
  else if (quality.totalLength >= 800) score += 0.15;
  else if (quality.totalLength >= 400) score += 0.1;

  // Proper structure bonus (0-0.2)
  if (quality.hasProperStructure) score += 0.2;

  return Math.min(score, 1);
}

// Boilerplate phrases to filter out (English + Arabic)
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

// Check if text is likely boilerplate
function isBoilerplate(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BOILERPLATE_PATTERNS.some(pattern => pattern.test(lowerText));
}

// Fetch webpage and extract og:image, video, and full article content
async function fetchWebpageData(url: string): Promise<WebpageData> {
  const result: WebpageData = {
    imageUrl: null,
    fullContent: null,
    contentQuality: 0,
    extractionMethod: 'failed',
    videoUrl: null,
    videoType: null,
  };

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
      console.log(`[fetchWebpageData] HTTP ${response.status} for ${url}`);
      return result;
    }

    const html = await response.text();

    // Parse HTML with DOM parser
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      console.log(`[fetchWebpageData] Failed to parse HTML for ${url}`);
      return result;
    }

    // ========== EXTRACT IMAGE (using DOM) ==========
    result.imageUrl = extractImageFromDOM(doc, url);

    // ========== EXTRACT VIDEO (from HTML) ==========
    const videoInfo = extractVideoFromHtml(doc, url);
    if (videoInfo) {
      result.videoUrl = videoInfo.url;
      result.videoType = videoInfo.type;
    }

    // ========== EXTRACT CONTENT ==========
    // Strategy 1: Mozilla Readability (what Firefox Reader Mode & Pocket use)
    try {
      // Clone the document since Readability modifies it
      const docClone = doc.cloneNode(true);
      const reader = new Readability(docClone, {
        charThreshold: 200, // Minimum content length
        keepClasses: false,
        disableJSONLD: false, // Let Readability also check JSON-LD
      });
      const article = reader.parse();

      if (article && article.textContent && article.textContent.length >= 200) {
        result.fullContent = cleanText(article.textContent);
        result.extractionMethod = 'readability';
        result.excerpt = article.excerpt || null;
        result.byline = article.byline || null;
        result.siteName = article.siteName || null;

        // Calculate quality score based on Readability metrics
        result.contentQuality = calculateReadabilityQuality(article);

        console.log(`[fetchWebpageData] Readability extracted ${result.fullContent.length} chars from ${url}`);
        return result;
      }
    } catch (readabilityError) {
      console.log(`[fetchWebpageData] Readability failed for ${url}:`, readabilityError.message);
    }

    // Strategy 2: Try JSON-LD structured data (fallback)
    const jsonLdContent = extractFromJsonLd(doc);
    if (jsonLdContent && jsonLdContent.length >= 300) {
      result.fullContent = jsonLdContent;
      result.contentQuality = 0.85; // High confidence for structured data
      result.extractionMethod = 'json-ld';
      console.log(`[fetchWebpageData] JSON-LD extracted ${jsonLdContent.length} chars from ${url}`);
      return result;
    }

    // Strategy 3: DOM-based extraction with quality scoring (last resort)
    const { content, quality } = extractArticleContentDOM(doc);
    if (content) {
      result.fullContent = content;
      result.contentQuality = calculateQualityScore(quality);
      result.extractionMethod = 'dom';
      console.log(`[fetchWebpageData] DOM extracted ${content.length} chars from ${url}`);
    }

    return result;
  } catch (error) {
    console.error(`[fetchWebpageData] Failed for ${url}:`, error.message || 'Unknown error');
    return result;
  }
}

// Calculate quality score from Readability article
function calculateReadabilityQuality(article: any): number {
  let score = 0.5; // Base score for successful Readability parse

  const length = article.textContent?.length || 0;

  // Length score (0-0.25)
  if (length >= 2000) score += 0.25;
  else if (length >= 1000) score += 0.2;
  else if (length >= 500) score += 0.15;
  else if (length >= 300) score += 0.1;

  // Has excerpt (0.1)
  if (article.excerpt && article.excerpt.length > 50) score += 0.1;

  // Has byline/author (0.05)
  if (article.byline) score += 0.05;

  // Has site name (0.05)
  if (article.siteName) score += 0.05;

  // Readable content structure (0.05)
  // Check if content has multiple paragraphs
  const paragraphCount = (article.textContent?.match(/\n\n/g) || []).length + 1;
  if (paragraphCount >= 3) score += 0.05;

  return Math.min(score, 1);
}

// Extract image URL using DOM parsing
function extractImageFromDOM(doc: Document, baseUrl: string): string | null {
  // 1. og:image meta tag
  const ogImage = doc.querySelector('meta[property="og:image"]');
  if (ogImage) {
    const content = ogImage.getAttribute('content');
    if (content) return resolveImageUrl(content, baseUrl);
  }

  // 2. twitter:image meta tag
  const twitterImage = doc.querySelector('meta[name="twitter:image"]');
  if (twitterImage) {
    const content = twitterImage.getAttribute('content');
    if (content) return resolveImageUrl(content, baseUrl);
  }

  // 3. Schema.org image
  const schemaImage = doc.querySelector('meta[itemprop="image"]');
  if (schemaImage) {
    const content = schemaImage.getAttribute('content');
    if (content) return resolveImageUrl(content, baseUrl);
  }

  // 4. link rel="image_src"
  const linkImage = doc.querySelector('link[rel="image_src"]');
  if (linkImage) {
    const href = linkImage.getAttribute('href');
    if (href) return resolveImageUrl(href, baseUrl);
  }

  // 5. First image in article/main
  const articleImg = doc.querySelector('article img, main img, .article-content img, .post-content img');
  if (articleImg) {
    const src = articleImg.getAttribute('src');
    if (src) return resolveImageUrl(src, baseUrl);
  }

  // 6. Any large image (check for dimensions in attributes)
  const images = doc.querySelectorAll('img[src]');
  for (const img of images) {
    const src = img.getAttribute('src') || '';
    const width = parseInt(img.getAttribute('width') || '0', 10);
    const height = parseInt(img.getAttribute('height') || '0', 10);

    // Skip small images (icons, avatars)
    if (width > 200 || height > 200 || /\.(jpg|jpeg|png|webp)/i.test(src)) {
      // Skip common non-content images
      if (!/logo|icon|avatar|button|banner|ad/i.test(src)) {
        return resolveImageUrl(src, baseUrl);
      }
    }
  }

  return null;
}

// Extract video URL from HTML page
function extractVideoFromHtml(doc: Document, baseUrl: string): { url: string; type: 'mp4' | 'youtube' | 'vimeo' | 'dailymotion' } | null {
  // 1. Check og:video meta tag
  const ogVideo = doc.querySelector('meta[property="og:video"]') ||
                  doc.querySelector('meta[property="og:video:url"]') ||
                  doc.querySelector('meta[property="og:video:secure_url"]');
  if (ogVideo) {
    const videoUrl = ogVideo.getAttribute('content');
    if (videoUrl) {
      const videoType = detectVideoType(videoUrl);
      if (videoType) {
        console.log(`[extractVideoFromHtml] Found og:video: ${videoUrl}`);
        return { url: normalizeVideoUrl(videoUrl, videoType), type: videoType };
      }
    }
  }

  // 2. Check twitter:player meta tag
  const twitterPlayer = doc.querySelector('meta[name="twitter:player"]');
  if (twitterPlayer) {
    const playerUrl = twitterPlayer.getAttribute('content');
    if (playerUrl) {
      const videoType = detectVideoType(playerUrl);
      if (videoType) {
        console.log(`[extractVideoFromHtml] Found twitter:player: ${playerUrl}`);
        return { url: normalizeVideoUrl(playerUrl, videoType), type: videoType };
      }
    }
  }

  // 3. Check for HTML5 <video> tags
  const videoElements = doc.querySelectorAll('video');
  for (const video of videoElements) {
    // Check video src attribute
    const videoSrc = video.getAttribute('src');
    if (videoSrc && isVideoFile(videoSrc)) {
      const resolvedUrl = resolveImageUrl(videoSrc, baseUrl);
      if (resolvedUrl) {
        console.log(`[extractVideoFromHtml] Found <video src>: ${resolvedUrl}`);
        return { url: resolvedUrl, type: 'mp4' };
      }
    }

    // Check <source> children
    const sources = video.querySelectorAll('source');
    for (const source of sources) {
      const sourceSrc = source.getAttribute('src');
      const sourceType = source.getAttribute('type');
      if (sourceSrc && (isVideoFile(sourceSrc) || sourceType?.startsWith('video/'))) {
        const resolvedUrl = resolveImageUrl(sourceSrc, baseUrl);
        if (resolvedUrl) {
          console.log(`[extractVideoFromHtml] Found <video><source>: ${resolvedUrl}`);
          return { url: resolvedUrl, type: 'mp4' };
        }
      }
    }
  }

  // 4. Check for iframe embeds (YouTube, Vimeo, Dailymotion)
  const iframes = doc.querySelectorAll('iframe');
  for (const iframe of iframes) {
    const iframeSrc = iframe.getAttribute('src') || iframe.getAttribute('data-src');
    if (iframeSrc) {
      const videoType = detectVideoType(iframeSrc);
      if (videoType) {
        console.log(`[extractVideoFromHtml] Found <iframe>: ${iframeSrc}`);
        return { url: normalizeVideoUrl(iframeSrc, videoType), type: videoType };
      }
    }
  }

  // 5. Check for embedded video links in article body
  const articleBody = doc.querySelector('article, main, .article-content, .post-content');
  if (articleBody) {
    const htmlContent = articleBody.innerHTML || '';

    // YouTube patterns
    const ytEmbedMatch = htmlContent.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (ytEmbedMatch) {
      console.log(`[extractVideoFromHtml] Found YouTube embed in body: ${ytEmbedMatch[1]}`);
      return { url: `https://www.youtube.com/watch?v=${ytEmbedMatch[1]}`, type: 'youtube' };
    }

    const ytWatchMatch = htmlContent.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (ytWatchMatch) {
      console.log(`[extractVideoFromHtml] Found YouTube watch in body: ${ytWatchMatch[1]}`);
      return { url: `https://www.youtube.com/watch?v=${ytWatchMatch[1]}`, type: 'youtube' };
    }

    const ytShortMatch = htmlContent.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (ytShortMatch) {
      console.log(`[extractVideoFromHtml] Found YouTube short in body: ${ytShortMatch[1]}`);
      return { url: `https://www.youtube.com/watch?v=${ytShortMatch[1]}`, type: 'youtube' };
    }

    // Vimeo patterns
    const vimeoMatch = htmlContent.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      console.log(`[extractVideoFromHtml] Found Vimeo in body: ${vimeoMatch[1]}`);
      return { url: `https://vimeo.com/${vimeoMatch[1]}`, type: 'vimeo' };
    }

    // Dailymotion patterns
    const dailymotionMatch = htmlContent.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/);
    if (dailymotionMatch) {
      console.log(`[extractVideoFromHtml] Found Dailymotion in body: ${dailymotionMatch[1]}`);
      return { url: `https://www.dailymotion.com/video/${dailymotionMatch[1]}`, type: 'dailymotion' };
    }
  }

  return null;
}

// Detect video type from URL
function detectVideoType(url: string): 'mp4' | 'youtube' | 'vimeo' | 'dailymotion' | null {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowerUrl.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (lowerUrl.includes('dailymotion.com')) {
    return 'dailymotion';
  }
  if (isVideoFile(url)) {
    return 'mp4';
  }

  return null;
}

// Check if URL is a video file
function isVideoFile(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.mp4') ||
         lowerUrl.endsWith('.webm') ||
         lowerUrl.endsWith('.m4v') ||
         lowerUrl.endsWith('.mov') ||
         lowerUrl.includes('/video/') ||
         lowerUrl.includes('video.') ||
         /\.mp4\?/.test(lowerUrl);
}

// Normalize video URL to standard watch/view format
function normalizeVideoUrl(url: string, type: 'mp4' | 'youtube' | 'vimeo' | 'dailymotion'): string {
  if (type === 'youtube') {
    // Extract video ID and convert to standard watch URL
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) {
      return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
    }
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) {
      return `https://www.youtube.com/watch?v=${shortMatch[1]}`;
    }
  }

  if (type === 'vimeo') {
    // Extract video ID and convert to standard URL
    const vimeoMatch = url.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://vimeo.com/${vimeoMatch[1]}`;
    }
  }

  if (type === 'dailymotion') {
    // Extract video ID and convert to standard URL
    const dmMatch = url.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/);
    if (dmMatch) {
      return `https://www.dailymotion.com/video/${dmMatch[1]}`;
    }
  }

  return url;
}

// Extract article text from JSON-LD structured data
function extractFromJsonLd(doc: Document): string | null {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent || '');
      const items = Array.isArray(json) ? json : [json];

      for (const item of items) {
        // Check for NewsArticle, Article, or BlogPosting schema
        if (['NewsArticle', 'Article', 'BlogPosting', 'WebPage'].includes(item['@type'])) {
          // articleBody is the full text
          if (item.articleBody && typeof item.articleBody === 'string') {
            return cleanText(item.articleBody);
          }
          // Some sites use text instead
          if (item.text && typeof item.text === 'string') {
            return cleanText(item.text);
          }
          // description as fallback (usually shorter)
          if (item.description && typeof item.description === 'string' && item.description.length > 300) {
            return cleanText(item.description);
          }
        }
      }
    } catch {
      // Invalid JSON, continue to next script
    }
  }

  return null;
}

// Extract article content using DOM with quality metrics
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

  // Content container selectors (ordered by specificity)
  const contentSelectors = [
    // Semantic HTML5
    'article',
    'main article',
    '[role="article"]',
    // Common class patterns (English)
    '.article-body', '.article-content', '.article__body', '.article__content',
    '.post-body', '.post-content', '.post__body', '.post__content',
    '.entry-content', '.entry-body', '.story-body', '.story-content',
    '.news-body', '.news-content', '.content-body', '.main-content',
    // Arabic news sites specific
    '.article-text', '.news-text', '.story-text', '.content-text',
    '.td-post-content', '.jeg_post_content', '.single-content',
    // ID-based
    '#article', '#content', '#main-content', '#story', '#post-content',
    // Fallback
    'main', '[role="main"]',
  ];

  let contentElement: Element | null = null;

  for (const selector of contentSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      // Check if it has meaningful content
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
    console.log('[extractArticleContentDOM] No content container found');
    return { content: null, quality: defaultQuality };
  }

  // Extract paragraphs
  const paragraphs: string[] = [];
  const pElements = contentElement.querySelectorAll('p');

  for (const p of pElements) {
    const text = cleanText(p.textContent || '');

    // Skip short paragraphs (likely captions, metadata)
    if (text.length < 40) continue;

    // Skip boilerplate content
    if (isBoilerplate(text)) continue;

    paragraphs.push(text);
  }

  // If not enough paragraphs, try getting all text content
  if (paragraphs.length < 2) {
    const allText = cleanText(contentElement.textContent || '');
    if (allText.length >= 300 && !isBoilerplate(allText)) {
      // Split into paragraphs by sentence groups
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
    console.log('[extractArticleContentDOM] No valid paragraphs found');
    return { content: null, quality: defaultQuality };
  }

  const fullContent = paragraphs.join('\n\n');

  // Calculate quality metrics
  const quality: ContentQuality = {
    paragraphCount: paragraphs.length,
    avgParagraphLength: fullContent.length / paragraphs.length,
    totalLength: fullContent.length,
    hasProperStructure: defaultQuality.hasProperStructure,
  };

  // Final validation
  if (fullContent.length < 200) {
    console.log('[extractArticleContentDOM] Content too short');
    return { content: null, quality };
  }

  return { content: fullContent, quality };
}

// Clean text content
function cleanText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/  +/g, ' ')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

// Legacy function for backward compatibility
async function fetchOgImage(url: string): Promise<string | null> {
  const data = await fetchWebpageData(url);
  return data.imageUrl;
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

      // Fetch webpage data (image fallback + full article content + video)
      let fullContent: string | null = null;
      let contentQuality = 0;
      let webpageVideoUrl: string | null = null;
      let webpageVideoType: string | null = null;
      if (url) {
        const webpageData = await fetchWebpageData(url);
        // Use webpage image if RSS didn't provide one
        if (!imageUrl && webpageData.imageUrl) {
          imageUrl = webpageData.imageUrl;
        }
        // Store full article content and quality score
        fullContent = webpageData.fullContent;
        contentQuality = webpageData.contentQuality;
        // Store video extracted from webpage
        webpageVideoUrl = webpageData.videoUrl;
        webpageVideoType = webpageData.videoType;
      }

      // Final validation: ensure URL is absolute, discard invalid URLs
      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = null;
      }

      // Prefer webpage video over RSS video (webpage is more reliable)
      const finalVideoUrl = webpageVideoUrl || videoInfo?.url || null;
      const finalVideoType = webpageVideoType || videoInfo?.type || null;

      // Generate content hash for deduplication
      const contentHash = await generateContentHash(title + stripHtml(content));

      // Check for duplicates by URL (parameterized query - safe from injection)
      const { data: existingByUrl } = await supabase
        .from('raw_articles')
        .select('id')
        .eq('original_url', url)
        .limit(1);

      if (existingByUrl && existingByUrl.length > 0) continue;

      // Check for duplicates by content hash (parameterized query - safe from injection)
      const { data: existingByHash } = await supabase
        .from('raw_articles')
        .select('id')
        .eq('content_hash', contentHash)
        .limit(1);

      if (existingByHash && existingByHash.length > 0) continue;

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
          full_content: fullContent,
          content_quality: contentQuality,
          author,
          image_url: imageUrl,
          video_url: finalVideoUrl,
          video_type: finalVideoType,
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
  const corsHeaders = getCorsHeaders(req);

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

    // Get sources that need fetching (30 minutes stale threshold)
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: sources, error: sourcesError } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true)
      .lt('error_count', 5) // Skip sources with too many errors
      .or(`last_fetched_at.is.null,last_fetched_at.lt.${staleThreshold}`)
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
