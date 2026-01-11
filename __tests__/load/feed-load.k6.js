/**
 * Feed API Load Test
 * Tests the stories feed endpoint under various load conditions
 *
 * Run with: k6 run __tests__/load/feed-load.k6.js
 * Or with options: k6 run --vus 100 --duration 5m __tests__/load/feed-load.k6.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem, TOPIC_SLUGS, getAuthHeaders } from './config.js';

// Custom metrics
const feedLoadTime = new Trend('feed_load_time');
const feedErrors = new Rate('feed_errors');
const storiesLoaded = new Counter('stories_loaded');

// Test configuration
export const options = {
  scenarios: {
    // Default: ramping load test
    feed_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },   // Ramp up
        { duration: '3m', target: 100 },  // Sustained load
        { duration: '1m', target: 200 },  // Peak load
        { duration: '2m', target: 100 },  // Scale down
        { duration: '1m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],                  // Less than 1% errors
    feed_errors: ['rate<0.01'],                      // Custom error rate
    feed_load_time: ['p(95)<400'],                   // Feed loads under 400ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:54321';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

export function setup() {
  // Verify the API is accessible
  const res = http.get(`${BASE_URL}/rest/v1/stories?select=id&limit=1`, {
    headers: getAuthHeaders(),
  });

  if (res.status !== 200) {
    console.warn(`Setup check failed: ${res.status} - ${res.body}`);
  }

  return { baseUrl: BASE_URL };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
  };

  group('Feed API', function () {
    // Test 1: Load initial feed (first page)
    group('Initial Feed Load', function () {
      const startTime = new Date();
      const res = http.get(
        `${data.baseUrl}/rest/v1/stories?select=*,source:sources(name,favicon)&is_approved=eq.true&order=published_at.desc&limit=20`,
        { headers, tags: { name: 'initial_feed' } }
      );

      const duration = new Date() - startTime;
      feedLoadTime.add(duration);

      const success = check(res, {
        'feed status is 200': (r) => r.status === 200,
        'feed returns array': (r) => Array.isArray(JSON.parse(r.body || '[]')),
        'feed has stories': (r) => JSON.parse(r.body || '[]').length > 0,
        'response time < 500ms': (r) => r.timings.duration < 500,
      });

      if (!success) {
        feedErrors.add(1);
      } else {
        const stories = JSON.parse(res.body || '[]');
        storiesLoaded.add(stories.length);
      }
    });

    sleep(0.5); // Brief pause between requests

    // Test 2: Load feed with topic filter
    group('Topic Filtered Feed', function () {
      const topic = randomItem(TOPIC_SLUGS);
      const res = http.get(
        `${data.baseUrl}/rest/v1/stories?select=*&is_approved=eq.true&topic_ids=cs.{${topic}}&order=published_at.desc&limit=20`,
        { headers, tags: { name: 'topic_feed' } }
      );

      check(res, {
        'topic feed status is 200': (r) => r.status === 200,
        'topic feed returns array': (r) => Array.isArray(JSON.parse(r.body || '[]')),
      });
    });

    sleep(0.5);

    // Test 3: Pagination (load more)
    group('Feed Pagination', function () {
      // Get initial page
      const page1 = http.get(
        `${data.baseUrl}/rest/v1/stories?select=id,published_at&is_approved=eq.true&order=published_at.desc&limit=20`,
        { headers, tags: { name: 'feed_page1' } }
      );

      if (page1.status === 200) {
        const stories = JSON.parse(page1.body || '[]');
        if (stories.length > 0) {
          const lastDate = stories[stories.length - 1].published_at;

          // Get next page
          const page2 = http.get(
            `${data.baseUrl}/rest/v1/stories?select=id,published_at&is_approved=eq.true&published_at=lt.${lastDate}&order=published_at.desc&limit=20`,
            { headers, tags: { name: 'feed_page2' } }
          );

          check(page2, {
            'page 2 status is 200': (r) => r.status === 200,
            'page 2 has different stories': (r) => {
              const page2Stories = JSON.parse(r.body || '[]');
              return page2Stories.length === 0 || page2Stories[0].id !== stories[0].id;
            },
          });
        }
      }
    });

    sleep(0.5);

    // Test 4: Story detail fetch
    group('Story Detail', function () {
      // First get a story ID
      const listRes = http.get(
        `${data.baseUrl}/rest/v1/stories?select=id&is_approved=eq.true&limit=1`,
        { headers }
      );

      if (listRes.status === 200) {
        const stories = JSON.parse(listRes.body || '[]');
        if (stories.length > 0) {
          const storyId = stories[0].id;
          const detailRes = http.get(
            `${data.baseUrl}/rest/v1/stories?id=eq.${storyId}&select=*,source:sources(*)`,
            { headers, tags: { name: 'story_detail' } }
          );

          check(detailRes, {
            'story detail status is 200': (r) => r.status === 200,
            'story detail has content': (r) => {
              const story = JSON.parse(r.body || '[]')[0];
              return story && story.summary_ar && story.summary_en;
            },
          });
        }
      }
    });
  });

  sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds between iterations
}

export function teardown(data) {
  console.log('Feed load test completed');
}
