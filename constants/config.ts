// API & Data Fetching
export const PAGE_SIZE = 20;
export const PREFETCH_THRESHOLD = 5;
export const SEARCH_DEBOUNCE_MS = 300;
export const API_TIMEOUT_MS = 10000;

// Timeouts (in milliseconds)
export const FETCH_TIMEOUT_MS = 25000; // General fetch timeout
export const CONTENT_FETCH_TIMEOUT_MS = 30000; // Full article content fetch
export const RSS_FETCH_TIMEOUT_MS = 30000; // RSS source fetch timeout
export const RETRY_DELAY_MS = 1000; // Base delay between retries

// Retry Configuration
export const MAX_RETRY_ATTEMPTS = 3;
export const PREMIUM_MAX_RETRY_ATTEMPTS = 999; // For premium users

// Animation & UI Delays
export const CLOSE_DELAY_MS = 150; // Modal/sheet close animation
export const PREFETCH_COUNT = 3; // Number of images to prefetch

// Storage
export const MAX_RECENT_SEARCHES = 10;

// Cache (in milliseconds)
export const STALE_TIME = 30 * 1000; // 30 seconds - news updates frequently
export const CACHE_TIME = 5 * 60 * 1000; // 5 minutes - shorter for fresh content

// Subscription
export const INTENT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for payment intent
