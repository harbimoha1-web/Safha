/**
 * k6 Load Test Configuration
 * Shared settings for all load tests
 */

// Environment-specific base URLs
export const BASE_URLS = {
  local: 'http://localhost:3000',
  staging: process.env.STAGING_URL || 'https://staging.safha.app',
  production: process.env.PRODUCTION_URL || 'https://safha.app',
};

// Supabase Edge Function URLs
export const EDGE_FUNCTION_URL = process.env.SUPABASE_URL
  ? `${process.env.SUPABASE_URL}/functions/v1`
  : 'http://localhost:54321/functions/v1';

// Test user credentials (for authenticated tests)
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'loadtest@safha.test',
  password: process.env.TEST_USER_PASSWORD || 'LoadTest123!',
};

// Common thresholds
export const DEFAULT_THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
  http_req_failed: ['rate<0.01'], // Less than 1% failure rate
  http_reqs: ['rate>100'], // At least 100 requests per second
};

// Strict thresholds for critical paths
export const STRICT_THRESHOLDS = {
  http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% under 200ms
  http_req_failed: ['rate<0.001'], // Less than 0.1% failure rate
};

// Load test scenarios
export const SCENARIOS = {
  // Smoke test - verify system works under minimal load
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },
  // Load test - typical production load
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 50 },   // Ramp up to 50 users
      { duration: '5m', target: 50 },   // Stay at 50 users
      { duration: '2m', target: 100 },  // Ramp up to 100 users
      { duration: '5m', target: 100 },  // Stay at 100 users
      { duration: '2m', target: 0 },    // Ramp down
    ],
  },
  // Stress test - find breaking point
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 200 },
      { duration: '5m', target: 500 },
      { duration: '5m', target: 1000 },
      { duration: '2m', target: 0 },
    ],
  },
  // Spike test - sudden traffic surge
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 10 },   // Normal load
      { duration: '10s', target: 500 },  // Spike!
      { duration: '1m', target: 500 },   // Stay at spike
      { duration: '10s', target: 10 },   // Return to normal
      { duration: '1m', target: 10 },    // Stay at normal
      { duration: '30s', target: 0 },    // Ramp down
    ],
  },
  // Soak test - extended duration
  soak: {
    executor: 'constant-vus',
    vus: 50,
    duration: '30m',
  },
};

// Helper to get API key header
export function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'apikey': process.env.SUPABASE_ANON_KEY || '',
  };
}

// Helper to pick random item from array
export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Sample topic slugs for testing
export const TOPIC_SLUGS = [
  'politics',
  'economy',
  'sports',
  'technology',
  'entertainment',
  'health',
  'science',
  'travel',
];

// Sample search queries (Arabic and English)
export const SEARCH_QUERIES = [
  'الرياض',      // Riyadh
  'السعودية',    // Saudi
  'اقتصاد',      // Economy
  'تقنية',       // Technology
  'football',
  'technology',
  'business',
  'health',
];
