/**
 * Payment Webhook Load Test
 * Tests the Moyasar payment webhook handler under load
 * Verifies idempotency, throughput, and error handling
 *
 * Run with: k6 run __tests__/load/webhook-load.k6.js
 *
 * IMPORTANT: This test simulates webhook calls. In production,
 * ensure proper signature validation is in place.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// Custom metrics
const webhookLatency = new Trend('webhook_latency');
const webhookErrors = new Rate('webhook_errors');
const duplicateHandled = new Counter('duplicate_webhooks_handled');
const successfulPayments = new Counter('successful_payments');

// Test configuration
export const options = {
  scenarios: {
    // Simulate burst of webhook events (e.g., Black Friday sale)
    webhook_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: '30s', target: 10 },   // Normal: 10 webhooks/second
        { duration: '1m', target: 50 },    // Surge: 50 webhooks/second
        { duration: '2m', target: 100 },   // Peak: 100 webhooks/second
        { duration: '1m', target: 50 },    // Cooling: 50 webhooks/second
        { duration: '30s', target: 10 },   // Back to normal
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],  // Webhook processing can take time
    http_req_failed: ['rate<0.01'],                   // Less than 1% failures
    webhook_latency: ['p(95)<800'],
    webhook_errors: ['rate<0.01'],
  },
};

const EDGE_FUNCTION_URL = __ENV.EDGE_FUNCTION_URL || 'http://localhost:54321/functions/v1';
const WEBHOOK_SECRET = __ENV.MOYASAR_WEBHOOK_SECRET || 'test_webhook_secret';

// Generate mock payment ID
function generatePaymentId() {
  return `pay_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Generate mock user ID
function generateUserId() {
  return `test_user_${Math.random().toString(36).substring(2, 10)}`;
}

// Create mock payment webhook payload
function createMockPayment(status = 'paid', plan = 'premium') {
  const paymentId = generatePaymentId();
  const userId = generateUserId();

  return {
    id: paymentId,
    status: status,
    amount: plan === 'premium_annual' ? 15000 : 1600,
    fee: plan === 'premium_annual' ? 450 : 48,
    currency: 'SAR',
    description: `Safha Premium - ${plan === 'premium_annual' ? 'Annual' : 'Monthly'} Subscription`,
    source: {
      type: 'creditcard',
      company: 'visa',
      name: 'Test User',
      number: '4111XXXXXXXX1111',
    },
    metadata: {
      user_id: userId,
      plan: plan,
      type: 'subscription',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Create HMAC signature for webhook
function createSignature(payload, secret) {
  const hmac = crypto.hmac('sha256', secret, payload, 'hex');
  return hmac;
}

export function setup() {
  console.log('Webhook load test starting...');
  console.log(`Target: ${EDGE_FUNCTION_URL}/webhook-moyasar`);

  return {
    edgeFunctionUrl: EDGE_FUNCTION_URL,
    webhookSecret: WEBHOOK_SECRET,
  };
}

export default function (data) {
  group('Payment Webhook', function () {
    // Test 1: Successful payment webhook
    group('Successful Payment', function () {
      const payment = createMockPayment('paid', Math.random() > 0.3 ? 'premium' : 'premium_annual');
      const payload = JSON.stringify({ data: payment });
      const signature = createSignature(payload, data.webhookSecret);

      const startTime = new Date();
      const res = http.post(
        `${data.edgeFunctionUrl}/webhook-moyasar`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Moyasar-Signature': signature,
          },
          tags: { name: 'successful_payment' },
        }
      );

      const duration = new Date() - startTime;
      webhookLatency.add(duration);

      const success = check(res, {
        'webhook status is 200': (r) => r.status === 200,
        'webhook response has success': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success === true || body.received === true;
          } catch {
            return false;
          }
        },
        'webhook completes under 2s': (r) => r.timings.duration < 2000,
      });

      if (success) {
        successfulPayments.add(1);
      } else {
        webhookErrors.add(1);
      }
    });

    sleep(0.1);

    // Test 2: Duplicate webhook (idempotency test)
    group('Duplicate Webhook', function () {
      // Use a fixed payment ID to simulate duplicate
      const payment = createMockPayment('paid');
      payment.id = 'pay_idempotency_test_12345';

      const payload = JSON.stringify({ data: payment });
      const signature = createSignature(payload, data.webhookSecret);

      // Send same webhook twice
      for (let i = 0; i < 2; i++) {
        const res = http.post(
          `${data.edgeFunctionUrl}/webhook-moyasar`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Moyasar-Signature': signature,
            },
            tags: { name: 'duplicate_webhook' },
          }
        );

        const success = check(res, {
          'duplicate webhook returns 200': (r) => r.status === 200,
        });

        if (i === 1 && success) {
          duplicateHandled.add(1);
        }

        sleep(0.05);
      }
    });

    sleep(0.1);

    // Test 3: Failed payment webhook
    group('Failed Payment', function () {
      const payment = createMockPayment('failed');
      const payload = JSON.stringify({ data: payment });
      const signature = createSignature(payload, data.webhookSecret);

      const res = http.post(
        `${data.edgeFunctionUrl}/webhook-moyasar`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Moyasar-Signature': signature,
          },
          tags: { name: 'failed_payment' },
        }
      );

      check(res, {
        'failed payment webhook returns 200': (r) => r.status === 200,
      });
    });

    sleep(0.1);

    // Test 4: Invalid signature (should be rejected)
    group('Invalid Signature', function () {
      const payment = createMockPayment('paid');
      const payload = JSON.stringify({ data: payment });
      const invalidSignature = 'invalid_signature_1234567890';

      const res = http.post(
        `${data.edgeFunctionUrl}/webhook-moyasar`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Moyasar-Signature': invalidSignature,
          },
          tags: { name: 'invalid_signature' },
        }
      );

      check(res, {
        'invalid signature returns 401': (r) => r.status === 401,
      });
    });

    sleep(0.1);

    // Test 5: Malformed payload
    group('Malformed Payload', function () {
      const malformedPayload = '{ invalid json }';
      const signature = createSignature(malformedPayload, data.webhookSecret);

      const res = http.post(
        `${data.edgeFunctionUrl}/webhook-moyasar`,
        malformedPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Moyasar-Signature': signature,
          },
          tags: { name: 'malformed_payload' },
        }
      );

      check(res, {
        'malformed payload returns 400': (r) => r.status === 400,
      });
    });
  });

  sleep(Math.random() * 0.5 + 0.1); // Random sleep 0.1-0.6 seconds
}

export function teardown(data) {
  console.log('Webhook load test completed');
}
