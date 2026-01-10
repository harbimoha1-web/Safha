// Image utilities for feed optimization and fallbacks
import { Dimensions, PixelRatio } from 'react-native';

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
 * - Applies sharpening for crisp output
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  cssWidth?: number,
  cssHeight?: number
): string | null {
  if (!url) return null;

  // Skip optimization for already optimized URLs or data URLs
  if (url.startsWith('data:') || url.includes('wsrv.nl')) {
    return url;
  }

  try {
    // Get actual screen dimensions if not provided
    const screenWidth = cssWidth || Dimensions.get('window').width;
    const screenHeight = cssHeight || Dimensions.get('window').height;

    // Account for device pixel ratio (2x, 3x displays)
    const dpr = Math.min(PixelRatio.get(), 3); // Cap at 3x to avoid excessive sizes
    const physicalWidth = Math.round(screenWidth * dpr);
    const physicalHeight = Math.round(screenHeight * dpr);

    // Use wsrv.nl as free image optimization proxy
    const encoded = encodeURIComponent(url);
    // Higher quality (90), af=auto-focus with sharpening for crisp images
    return `https://wsrv.nl/?url=${encoded}&w=${physicalWidth}&h=${physicalHeight}&fit=cover&output=webp&q=90&af`;
  } catch {
    return url;
  }
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

    return hasImageExtension || isImageHost || true; // Be permissive, let it try
  } catch {
    return false;
  }
}
