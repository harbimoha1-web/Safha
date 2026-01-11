/**
 * RSS Content Pipeline Load Test
 * Tests the RSS fetching and article processing edge functions
 *
 * Run with: k6 run __tests__/load/rss-pipeline-load.k6.js
 *
 * Note: These tests simulate the content pipeline under load.
 * In production, the CRON jobs handle this automatically.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const rssFetchLatency = new Trend('rss_fetch_latency');
const contentFetchLatency = new Trend('content_fetch_latency');
const processLatency = new Trend('process_latency');
const pipelineErrors = new Rate('pipeline_errors');
const articlesProcessed = new Counter('articles_processed');

// Test configuration
export const options = {
  scenarios: {
    // Sequential processing (matches CRON behavior)
    sequential_pipeline: {
      executor: 'per-vu-iterations',
      vus: 5,           // 5 parallel workers
      iterations: 10,    // Each processes 10 batches
      maxDuration: '10m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<30000', 'p(99)<60000'], // Edge functions can take up to 30s
    http_req_failed: ['rate<0.1'],                      // Allow 10% failures (external feeds can be flaky)
    rss_fetch_latency: ['p(95)<10000'],                 // RSS fetch under 10s
    content_fetch_latency: ['p(95)<15000'],             // Content fetch under 15s
    process_latency: ['p(95)<30000'],                   // AI processing under 30s
  },
};

const EDGE_FUNCTION_URL = __ENV.EDGE_FUNCTION_URL || 'http://localhost:54321/functions/v1';
const SERVICE_ROLE_KEY = __ENV.SUPABASE_SERVICE_ROLE_KEY || '';

export function setup() {
  console.log('RSS Pipeline load test starting...');
  console.log(`Target: ${EDGE_FUNCTION_URL}`);

  // Verify edge functions are accessible
  const warmupRes = http.post(
    `${EDGE_FUNCTION_URL}/warmup`,
    JSON.stringify({}),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );

  console.log(`Warmup response: ${warmupRes.status}`);

  return {
    edgeFunctionUrl: EDGE_FUNCTION_URL,
    serviceRoleKey: SERVICE_ROLE_KEY,
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.serviceRoleKey}`,
  };

  group('RSS Content Pipeline', function () {
    // Step 1: Fetch RSS feeds
    group('Fetch RSS Feeds', function () {
      const startTime = new Date();
      const res = http.post(
        `${data.edgeFunctionUrl}/fetch-rss`,
        JSON.stringify({ limit: 5 }), // Process 5 sources at a time
        {
          headers,
          tags: { name: 'fetch_rss' },
          timeout: '60s',
        }
      );

      const duration = new Date() - startTime;
      rssFetchLatency.add(duration);

      const success = check(res, {
        'fetch-rss status is 200': (r) => r.status === 200,
        'fetch-rss returns summary': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.summary !== undefined || body.sources_processed !== undefined;
          } catch {
            return false;
          }
        },
      });

      if (!success) {
        pipelineErrors.add(1);
        console.log(`fetch-rss failed: ${res.status} - ${res.body}`);
      } else {
        try {
          const body = JSON.parse(res.body);
          console.log(`RSS fetch: ${body.summary?.sources_processed || 0} sources processed`);
        } catch {
          // Ignore parse errors for logging
        }
      }
    });

    sleep(1); // Brief pause between pipeline stages

    // Step 2: Fetch full content for pending articles
    group('Fetch Content', function () {
      const startTime = new Date();
      const res = http.post(
        `${data.edgeFunctionUrl}/fetch-content`,
        JSON.stringify({ limit: 10 }), // Fetch content for 10 articles
        {
          headers,
          tags: { name: 'fetch_content' },
          timeout: '60s',
        }
      );

      const duration = new Date() - startTime;
      contentFetchLatency.add(duration);

      const success = check(res, {
        'fetch-content status is 200': (r) => r.status === 200,
        'fetch-content returns summary': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.summary !== undefined || body.articles_processed !== undefined;
          } catch {
            return false;
          }
        },
      });

      if (!success) {
        pipelineErrors.add(1);
        console.log(`fetch-content failed: ${res.status} - ${res.body}`);
      } else {
        try {
          const body = JSON.parse(res.body);
          console.log(`Content fetch: ${body.summary?.successful || 0} articles processed`);
        } catch {
          // Ignore parse errors
        }
      }
    });

    sleep(1);

    // Step 3: Process articles with AI
    group('Process Articles', function () {
      const startTime = new Date();
      const res = http.post(
        `${data.edgeFunctionUrl}/process-articles`,
        JSON.stringify({ limit: 5 }), // Process 5 articles at a time (AI is slow)
        {
          headers,
          tags: { name: 'process_articles' },
          timeout: '120s', // AI processing can take up to 2 minutes
        }
      );

      const duration = new Date() - startTime;
      processLatency.add(duration);

      const success = check(res, {
        'process-articles status is 200': (r) => r.status === 200,
        'process-articles returns summary': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.summary !== undefined;
          } catch {
            return false;
          }
        },
      });

      if (success) {
        try {
          const body = JSON.parse(res.body);
          const processed = body.summary?.successful || 0;
          articlesProcessed.add(processed);
          console.log(`AI processing: ${processed} articles processed`);
        } catch {
          // Ignore parse errors
        }
      } else {
        pipelineErrors.add(1);
        console.log(`process-articles failed: ${res.status} - ${res.body}`);
      }
    });
  });

  sleep(5); // Wait between pipeline runs to avoid overwhelming the system
}

export function teardown(data) {
  console.log('RSS Pipeline load test completed');
}
