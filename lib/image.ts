// Image utilities for feed optimization and fallbacks
import { Dimensions, PixelRatio } from 'react-native';

// Get actual screen dimensions for full-screen story cards
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Topic gradients for fallback backgrounds (when no image available)
const TOPIC_GRADIENTS: Record<string, [string, string, string]> = {
  politics: ['#1a1a2e', '#16213e', '#0f3460'],
  economy: ['#1b4332', '#2d6a4f', '#40916c'],
  sports: ['#7b2cbf', '#9d4edd', '#c77dff'],
  technology: ['#023e8a', '#0077b6', '#0096c7'],
  entertainment: ['#ff006e', '#8338ec', '#3a86ff'],
  health: ['#2a9d8f', '#264653', '#e76f51'],
  science: ['#480ca8', '#560bad', '#7209b7'],
  saudi: ['#006c35', '#00873e', '#00a94d'],
  travel: ['#f4a261', '#e76f51', '#2a9d8f'],
  general: ['#1a1a1a', '#2d2d2d', '#404040'],
  default: ['#1a1a1a', '#2d2d2d', '#404040'],
};

// Topic icons (Ionicons names)
const TOPIC_ICONS: Record<string, string> = {
  politics: 'globe-outline',
  economy: 'trending-up-outline',
  sports: 'football-outline',
  technology: 'hardware-chip-outline',
  entertainment: 'film-outline',
  health: 'fitness-outline',
  science: 'flask-outline',
  saudi: 'flag-outline',
  travel: 'airplane-outline',
  general: 'newspaper-outline',
  default: 'newspaper-outline',
};

/**
 * Get gradient colors for a topic (used as fallback background)
 */
export function getTopicGradient(topicSlug?: string): [string, string, string] {
  if (!topicSlug) return TOPIC_GRADIENTS.default;
  return TOPIC_GRADIENTS[topicSlug] || TOPIC_GRADIENTS.default;
}

/**
 * Get icon name for a topic (Ionicons)
 */
export function getTopicIcon(topicSlug?: string): string {
  if (!topicSlug) return TOPIC_ICONS.default;
  return TOPIC_ICONS[topicSlug] || TOPIC_ICONS.default;
}

/**
 * Optimize image URL using wsrv.nl proxy service
 * - Automatically scales for device pixel ratio (2x, 3x displays)
 * - Uses actual screen dimensions if not provided
 * - Converts to WebP format with high quality
 * - Supports contain mode to show full image without cropping
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  cssWidth?: number,
  cssHeight?: number,
  fitMode: 'cover' | 'contain' = 'contain'
): string | null {
  if (!url) return null;

  // CRITICAL: Validate URL is absolute - reject relative URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Relative URL cannot be proxied, return null
    return null;
  }

  // Skip optimization for already optimized URLs or data URLs
  if (url.startsWith('data:') || url.includes('wsrv.nl')) {
    return url;
  }

  try {
    // Use full screen dimensions by default for feed story cards
    const screenWidth = cssWidth || SCREEN_WIDTH;
    const screenHeight = cssHeight || SCREEN_HEIGHT;

    // Account for device pixel ratio (2x, 3x displays)
    const dpr = Math.min(PixelRatio.get(), 3); // Cap at 3x to avoid excessive sizes

    // Cap dimensions to prevent wsrv.nl timeouts on large images
    const MAX_WIDTH = 1200;
    const MAX_HEIGHT = 800;
    const physicalWidth = Math.min(Math.round(screenWidth * dpr), MAX_WIDTH);
    const physicalHeight = Math.min(Math.round(screenHeight * dpr), MAX_HEIGHT);

    // Use wsrv.nl as free image optimization proxy
    // Parameters: w=width, h=height, fit=contain/cover, output=webp, q=quality (85 for good balance)
    const encoded = encodeURIComponent(url);
    return `https://wsrv.nl/?url=${encoded}&w=${physicalWidth}&h=${physicalHeight}&fit=${fitMode}&output=webp&q=85`;
  } catch {
    return url;
  }
}

/**
 * Get a blurred version of an image for use as a background fill
 * - Uses lower quality and smaller dimensions for faster loading
 * - Applies blur effect server-side via wsrv.nl
 * - Perfect for the "Spotify-style" blurred background effect
 */
export function getBlurredImageUrl(
  url: string | null | undefined,
  blurAmount: number = 15,
  quality: number = 40
): string | null {
  if (!url) return null;

  // CRITICAL: Validate URL is absolute - reject relative URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return null;
  }

  // Skip optimization for data URLs
  if (url.startsWith('data:')) {
    return url;
  }

  // If already a wsrv.nl URL, add blur parameter
  if (url.includes('wsrv.nl')) {
    // Already optimized, just add blur
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}blur=${blurAmount}`;
  }

  try {
    // Use smaller dimensions for blurred background (faster load, less data)
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 600;

    const encoded = encodeURIComponent(url);
    // fit=cover ensures the blurred image fills the entire background
    return `https://wsrv.nl/?url=${encoded}&w=${MAX_WIDTH}&h=${MAX_HEIGHT}&fit=cover&output=webp&q=${quality}&blur=${blurAmount}`;
  } catch {
    return url;
  }
}

/**
 * Get source logo URL using Google Favicons API
 * Fallback chain: manual override -> Google Favicons -> null
 *
 * @param websiteUrl - The source's website URL (e.g., "https://aljazeera.net")
 * @param manualLogoUrl - Optional manual override URL from database
 * @param size - Icon size (16, 32, 64, 128, 256), defaults to 128
 */
export function getSourceLogo(
  websiteUrl: string | null | undefined,
  manualLogoUrl?: string | null,
  size: number = 128
): string | null {
  // 1. If manual logo URL is provided and valid, use it
  if (manualLogoUrl && isValidImageUrl(manualLogoUrl)) {
    return manualLogoUrl;
  }

  // 2. If website URL is provided, use Google Favicons API
  if (websiteUrl) {
    try {
      // Extract domain from URL
      const url = new URL(websiteUrl);
      const domain = url.hostname;

      // Google Favicons API - reliable and free
      // Supported sizes: 16, 32, 64, 128, 256
      const validSize = [16, 32, 64, 128, 256].includes(size) ? size : 128;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=${validSize}`;
    } catch {
      // Invalid URL, can't extract domain
      return null;
    }
  }

  return null;
}

/**
 * Get source logo with optimized sizing for display
 * Uses getOptimizedImageUrl for manual logos, Google API for auto-fetch
 */
export function getOptimizedSourceLogo(
  websiteUrl: string | null | undefined,
  manualLogoUrl?: string | null,
  displaySize: number = 40
): string | null {
  // For manual logos, optimize through wsrv.nl
  if (manualLogoUrl && isValidImageUrl(manualLogoUrl)) {
    return getOptimizedImageUrl(manualLogoUrl, displaySize, displaySize);
  }

  // For auto-fetch, use Google Favicons API (already optimized)
  // Request 2x size for retina displays
  const faviconSize = displaySize <= 32 ? 64 : displaySize <= 64 ? 128 : 256;
  return getSourceLogo(websiteUrl, null, faviconSize);
}

/**
 * Check if a URL is likely a valid image URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    // Check for common image extensions or known image hosts
    const path = parsed.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => path.endsWith(ext));

    // Known image CDNs/hosts that may not have extensions
    const imageHosts = ['images.unsplash.com', 'i.imgur.com', 'pbs.twimg.com', 'cdn.'];
    const isImageHost = imageHosts.some(host => parsed.host.includes(host));

    // Be reasonably permissive for unknown URLs, but validate structure
    // CDN URLs often don't have extensions (e.g., /images/abc123)
    const hasReasonablePath = path.length > 1 && !path.endsWith('/');
    return hasImageExtension || isImageHost || hasReasonablePath;
  } catch {
    return false;
  }
}
