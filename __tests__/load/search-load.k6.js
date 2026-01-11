/**
 * Search API Load Test
 * Tests the search functionality under various load conditions
 * Includes both Arabic and English search queries
 *
 * Run with: k6 run __tests__/load/search-load.k6.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem, SEARCH_QUERIES } from './config.js';

// Custom metrics
const searchLatency = new Trend('search_latency');
const searchErrors = new Rate('search_errors');
const searchResultCount = new Counter('search_results');
const emptySearches = new Rate('empty_searches');

// Test configuration
export const options = {
  scenarios: {
    search_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // Warm up
        { duration: '2m', target: 50 },    // Normal load
        { duration: '2m', target: 100 },   // High load
        { duration: '1m', target: 50 },    // Scale down
        { duration: '30s', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],  // Search can be slower
    http_req_failed: ['rate<0.02'],                   // Allow 2% failures
    search_latency: ['p(95)<700', 'avg<400'],
    search_errors: ['rate<0.02'],
    empty_searches: ['rate<0.5'],                     // At least 50% should return results
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:54321';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

// Extended search queries for more realistic testing
const EXTENDED_QUERIES = [
  // Arabic queries
  'الرياض',           // Riyadh
  'السعودية',         // Saudi
  'اقتصاد',           // Economy
  'تقنية',            // Technology
  'رياضة',            // Sports
  'صحة',              // Health
  'ترفيه',            // Entertainment
  'سياسة',            // Politics
  'رؤية 2030',        // Vision 2030
  'نيوم',             // NEOM
  // English queries
  'Saudi Arabia',
  'technology',
  'football',
  'economy',
  'health',
  'entertainment',
  'sports',
  'business',
  'AI',
  'climate',
  // Partial/typo queries (realistic user behavior)
  'ري',               // Partial Arabic
  'tech',
  'foo',              // Likely no results
];

export function setup() {
  // Verify search endpoint is accessible
  const testQuery = encodeURIComponent('test');
  const res = http.get(
    `${BASE_URL}/rest/v1/stories?select=id,original_title&or=(original_title.ilike.*test*,summary_ar.ilike.*test*,summary_en.ilike.*test*)&limit=1`,
    {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    }
  );

  console.log(`Setup: Search endpoint responded with status ${res.status}`);
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
  };

  group('Search API', function () {
    // Test 1: Basic search with random query
    group('Basic Search', function () {
      const query = randomItem(EXTENDED_QUERIES);
      const encodedQuery = encodeURIComponent(query);

      const startTime = new Date();
      const res = http.get(
        `${data.baseUrl}/rest/v1/stories?select=id,original_title,summary_ar,summary_en,image_url,published_at&is_approved=eq.true&or=(original_title.ilike.*${encodedQuery}*,summary_ar.ilike.*${encodedQuery}*,summary_en.ilike.*${encodedQuery}*)&order=published_at.desc&limit=20`,
        { headers, tags: { name: 'basic_search' } }
      );

      const duration = new Date() - startTime;
      searchLatency.add(duration);

      const success = check(res, {
        'search status is 200': (r) => r.status === 200,
        'search returns array': (r) => Array.isArray(JSON.parse(r.body || '[]')),
        'search completes under 1s': (r) => r.timings.duration < 1000,
      });

      if (!success) {
        searchErrors.add(1);
      } else {
        const results = JSON.parse(res.body || '[]');
        searchResultCount.add(results.length);
        if (results.length === 0) {
          emptySearches.add(1);
        }
      }
    });

    sleep(0.3);

    // Test 2: Filtered search (by topic)
    group('Filtered Search', function () {
      const query = randomItem(['sports', 'رياضة', 'technology', 'تقنية']);
      const encodedQuery = encodeURIComponent(query);

      const res = http.get(
        `${data.baseUrl}/rest/v1/stories?select=id,original_title,topic_ids&is_approved=eq.true&or=(original_title.ilike.*${encodedQuery}*,summary_ar.ilike.*${encodedQuery}*)&limit=10`,
        { headers, tags: { name: 'filtered_search' } }
      );

      check(res, {
        'filtered search status is 200': (r) => r.status === 200,
        'filtered search returns array': (r) => Array.isArray(JSON.parse(r.body || '[]')),
      });
    });

    sleep(0.3);

    // Test 3: Full-text search simulation (using pg_trgm patterns)
    group('Full-text Search', function () {
      const query = randomItem(['Saudi Vision', 'الرؤية السعودية', 'tech news']);
      const encodedQuery = encodeURIComponent(query);

      const res = http.get(
        `${data.baseUrl}/rest/v1/stories?select=id,original_title,summary_ar,summary_en&is_approved=eq.true&or=(original_title.ilike.*${encodedQuery}*,summary_ar.ilike.*${encodedQuery}*,summary_en.ilike.*${encodedQuery}*,full_content.ilike.*${encodedQuery}*)&order=ai_quality_score.desc.nullslast&limit=20`,
        { headers, tags: { name: 'fulltext_search' } }
      );

      check(res, {
        'fulltext search status is 200': (r) => r.status === 200,
      });
    });

    sleep(0.3);

    // Test 4: Empty/short query handling
    group('Edge Case Queries', function () {
      // Very short query (should still work but may return many results)
      const shortQuery = randomItem(['ا', 'a', 'الـ', 'th']);
      const encodedQuery = encodeURIComponent(shortQuery);

      const res = http.get(
        `${data.baseUrl}/rest/v1/stories?select=id&is_approved=eq.true&or=(original_title.ilike.*${encodedQuery}*)&limit=5`,
        { headers, tags: { name: 'short_query' } }
      );

      check(res, {
        'short query status is 200': (r) => r.status === 200,
      });
    });

    sleep(0.3);

    // Test 5: Search with source filtering
    group('Source-Filtered Search', function () {
      // First get a source ID
      const sourcesRes = http.get(
        `${data.baseUrl}/rest/v1/sources?select=id&limit=1`,
        { headers }
      );

      if (sourcesRes.status === 200) {
        const sources = JSON.parse(sourcesRes.body || '[]');
        if (sources.length > 0) {
          const sourceId = sources[0].id;
          const query = randomItem(SEARCH_QUERIES);
          const encodedQuery = encodeURIComponent(query);

          const res = http.get(
            `${data.baseUrl}/rest/v1/stories?select=id,original_title&is_approved=eq.true&source_id=eq.${sourceId}&or=(original_title.ilike.*${encodedQuery}*)&limit=10`,
            { headers, tags: { name: 'source_filtered_search' } }
          );

          check(res, {
            'source-filtered search status is 200': (r) => r.status === 200,
          });
        }
      }
    });
  });

  sleep(Math.random() * 1.5 + 0.5); // Random sleep 0.5-2 seconds
}

export function teardown(data) {
  console.log('Search load test completed');
}
