/**
 * Database Connection Pool Stress Test
 * Tests Supabase PostgreSQL under heavy concurrent load
 * Verifies connection pool limits and query performance
 *
 * Run with: k6 run __tests__/load/database-stress.k6.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const queryLatency = new Trend('query_latency');
const writeLatency = new Trend('write_latency');
const readLatency = new Trend('read_latency');
const connectionErrors = new Rate('connection_errors');
const queryCount = new Counter('total_queries');
const concurrentRequests = new Gauge('concurrent_requests');

// Test configuration - stress test the connection pool
export const options = {
  scenarios: {
    // Read-heavy workload (typical for news feed)
    read_heavy: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '2m', target: 200 },   // Push to 200 concurrent
        { duration: '1m', target: 300 },   // Peak stress
        { duration: '30s', target: 100 },
        { duration: '30s', target: 0 },
      ],
      exec: 'readWorkload',
    },
    // Write workload (saves, notes, views)
    write_workload: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 30 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 30 },
        { duration: '30s', target: 0 },
      ],
      exec: 'writeWorkload',
    },
    // Mixed workload (realistic usage)
    mixed: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 150 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      exec: 'mixedWorkload',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    query_latency: ['p(95)<400'],
    read_latency: ['p(95)<300'],
    write_latency: ['p(95)<500'],
    connection_errors: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:54321';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

// Active VU counter
let activeVUs = 0;

export function setup() {
  console.log('Database stress test starting...');

  // Warm up the connection pool
  for (let i = 0; i < 10; i++) {
    http.get(`${BASE_URL}/rest/v1/stories?select=id&limit=1`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });
  }

  return { baseUrl: BASE_URL };
}

// Read-heavy workload (80% of typical traffic)
export function readWorkload(data) {
  activeVUs++;
  concurrentRequests.add(activeVUs);

  const headers = {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
  };

  group('Read Operations', function () {
    // Query 1: List stories with joins
    const startTime1 = new Date();
    const res1 = http.get(
      `${data.baseUrl}/rest/v1/stories?select=id,original_title,summary_ar,image_url,published_at,view_count,source:sources(name,favicon)&is_approved=eq.true&order=published_at.desc&limit=20`,
      { headers, tags: { name: 'list_stories' } }
    );
    readLatency.add(new Date() - startTime1);
    queryCount.add(1);

    check(res1, {
      'list stories returns 200': (r) => r.status === 200,
    }) || connectionErrors.add(1);

    sleep(0.1);

    // Query 2: Get single story detail
    const stories = JSON.parse(res1.body || '[]');
    if (stories.length > 0) {
      const storyId = stories[Math.floor(Math.random() * stories.length)].id;
      const startTime2 = new Date();
      const res2 = http.get(
        `${data.baseUrl}/rest/v1/stories?id=eq.${storyId}&select=*,source:sources(*)`,
        { headers, tags: { name: 'story_detail' } }
      );
      readLatency.add(new Date() - startTime2);
      queryCount.add(1);

      check(res2, {
        'story detail returns 200': (r) => r.status === 200,
      }) || connectionErrors.add(1);
    }

    sleep(0.1);

    // Query 3: Count query
    const startTime3 = new Date();
    const res3 = http.get(
      `${data.baseUrl}/rest/v1/stories?select=count&is_approved=eq.true`,
      { headers: { ...headers, 'Prefer': 'count=exact' }, tags: { name: 'count_stories' } }
    );
    readLatency.add(new Date() - startTime3);
    queryCount.add(1);

    check(res3, {
      'count returns 200': (r) => r.status === 200,
    }) || connectionErrors.add(1);

    sleep(0.1);

    // Query 4: Topics list
    const startTime4 = new Date();
    const res4 = http.get(
      `${data.baseUrl}/rest/v1/topics?select=*&order=display_order`,
      { headers, tags: { name: 'list_topics' } }
    );
    readLatency.add(new Date() - startTime4);
    queryCount.add(1);

    check(res4, {
      'topics returns 200': (r) => r.status === 200,
    }) || connectionErrors.add(1);

    sleep(0.1);

    // Query 5: Sources list
    const startTime5 = new Date();
    const res5 = http.get(
      `${data.baseUrl}/rest/v1/sources?select=id,name,favicon,reliability_score&order=name`,
      { headers, tags: { name: 'list_sources' } }
    );
    readLatency.add(new Date() - startTime5);
    queryCount.add(1);

    check(res5, {
      'sources returns 200': (r) => r.status === 200,
    }) || connectionErrors.add(1);
  });

  activeVUs--;
  sleep(Math.random() * 0.5 + 0.2);
}

// Write workload
export function writeWorkload(data) {
  activeVUs++;
  concurrentRequests.add(activeVUs);

  const headers = {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
  };

  group('Write Operations', function () {
    // Get a story to interact with
    const listRes = http.get(
      `${data.baseUrl}/rest/v1/stories?select=id&is_approved=eq.true&limit=10`,
      { headers }
    );

    if (listRes.status === 200) {
      const stories = JSON.parse(listRes.body || '[]');
      if (stories.length > 0) {
        const storyId = stories[Math.floor(Math.random() * stories.length)].id;

        // Simulate view increment (RPC call)
        const startTime1 = new Date();
        const res1 = http.post(
          `${data.baseUrl}/rest/v1/rpc/increment_view_count`,
          JSON.stringify({ story_id: storyId }),
          { headers, tags: { name: 'increment_view' } }
        );
        writeLatency.add(new Date() - startTime1);
        queryCount.add(1);

        check(res1, {
          'view increment returns 2xx': (r) => r.status >= 200 && r.status < 300,
        }) || connectionErrors.add(1);

        sleep(0.1);

        // Simulate story read tracking
        const startTime2 = new Date();
        const res2 = http.post(
          `${data.baseUrl}/rest/v1/story_reads`,
          JSON.stringify({
            user_id: 'test-user-' + __VU,
            story_id: storyId,
            read_at: new Date().toISOString(),
          }),
          {
            headers: { ...headers, 'Prefer': 'return=minimal' },
            tags: { name: 'track_read' },
          }
        );
        writeLatency.add(new Date() - startTime2);
        queryCount.add(1);

        // Note: This may fail due to RLS - that's expected
        if (res2.status >= 400 && res2.status !== 401 && res2.status !== 403) {
          connectionErrors.add(1);
        }
      }
    }
  });

  activeVUs--;
  sleep(Math.random() * 1 + 0.5);
}

// Mixed realistic workload
export function mixedWorkload(data) {
  // 80% reads, 20% writes
  if (Math.random() < 0.8) {
    readWorkload(data);
  } else {
    writeWorkload(data);
  }
}

export function teardown(data) {
  console.log('Database stress test completed');
}
