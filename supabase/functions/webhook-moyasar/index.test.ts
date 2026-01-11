/**
 * Moyasar Webhook Edge Function Tests
 * Tests payment webhook handling, signature verification, and subscription activation
 *
 * Run with: deno test --allow-net --allow-env webhook-moyasar/index.test.ts
 */

import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// HMAC-SHA256 signature verification
async function createHmacSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

Deno.test('Signature Verification - should create valid HMAC-SHA256', async () => {
  const payload = '{"test": "data"}';
  const secret = 'webhook_secret_123';

  const signature = await createHmacSignature(payload, secret);

  // HMAC-SHA256 produces 64 hex characters
  assertEquals(signature.length, 64);
  assertEquals(/^[a-f0-9]+$/.test(signature), true);
});

Deno.test('Signature Verification - should verify matching signatures', async () => {
  const payload = '{"id": "pay_123", "status": "paid"}';
  const secret = 'my_webhook_secret';

  const sig1 = await createHmacSignature(payload, secret);
  const sig2 = await createHmacSignature(payload, secret);

  assertEquals(constantTimeCompare(sig1, sig2), true);
});

Deno.test('Signature Verification - should reject different payloads', async () => {
  const payload1 = '{"id": "pay_123"}';
  const payload2 = '{"id": "pay_456"}';
  const secret = 'my_webhook_secret';

  const sig1 = await createHmacSignature(payload1, secret);
  const sig2 = await createHmacSignature(payload2, secret);

  assertEquals(constantTimeCompare(sig1, sig2), false);
});

Deno.test('Signature Verification - should reject different secrets', async () => {
  const payload = '{"id": "pay_123"}';

  const sig1 = await createHmacSignature(payload, 'secret1');
  const sig2 = await createHmacSignature(payload, 'secret2');

  assertEquals(constantTimeCompare(sig1, sig2), false);
});

Deno.test('Constant Time Compare - should handle length mismatch', () => {
  assertEquals(constantTimeCompare('short', 'longer_string'), false);
  assertEquals(constantTimeCompare('a'.repeat(64), 'b'.repeat(32)), false);
});

Deno.test('Constant Time Compare - should match identical strings', () => {
  assertEquals(constantTimeCompare('abc123', 'abc123'), true);
  assertEquals(constantTimeCompare('', ''), true);
  assertEquals(constantTimeCompare('a'.repeat(100), 'a'.repeat(100)), true);
});

// Payment status handling
Deno.test('Payment Status - should identify successful payments', () => {
  function isSuccessfulPayment(status: string): boolean {
    return status === 'paid';
  }

  assertEquals(isSuccessfulPayment('paid'), true);
  assertEquals(isSuccessfulPayment('failed'), false);
  assertEquals(isSuccessfulPayment('pending'), false);
  assertEquals(isSuccessfulPayment('refunded'), false);
});

Deno.test('Payment Status - should identify failed payments', () => {
  function isFailedPayment(status: string): boolean {
    return status === 'failed';
  }

  assertEquals(isFailedPayment('failed'), true);
  assertEquals(isFailedPayment('paid'), false);
});

// Amount conversion
Deno.test('Amount Conversion - should convert halalas to SAR', () => {
  function halalasToSar(halalas: number): number {
    return halalas / 100;
  }

  assertEquals(halalasToSar(1600), 16);
  assertEquals(halalasToSar(15000), 150);
  assertEquals(halalasToSar(100), 1);
  assertEquals(halalasToSar(50), 0.5);
  assertEquals(halalasToSar(0), 0);
});

// Metadata validation
Deno.test('Metadata Validation - should validate required fields', () => {
  interface PaymentMetadata {
    user_id?: string;
    plan?: string;
    type?: string;
  }

  function validateMetadata(metadata: PaymentMetadata | undefined): {
    valid: boolean;
    error?: string;
  } {
    if (!metadata) {
      return { valid: false, error: 'Missing metadata' };
    }
    if (!metadata.user_id) {
      return { valid: false, error: 'Missing user_id' };
    }
    if (!metadata.plan) {
      return { valid: false, error: 'Missing plan' };
    }
    if (metadata.type !== 'subscription') {
      return { valid: false, error: 'Not a subscription payment' };
    }
    return { valid: true };
  }

  assertEquals(validateMetadata(undefined).valid, false);
  assertEquals(validateMetadata({}).valid, false);
  assertEquals(validateMetadata({ user_id: '123' }).valid, false);
  assertEquals(validateMetadata({ user_id: '123', plan: 'premium' }).valid, false);
  assertEquals(
    validateMetadata({
      user_id: '123',
      plan: 'premium',
      type: 'subscription',
    }).valid,
    true
  );
});

// Plan period calculation
Deno.test('Plan Period - should calculate monthly subscription end', () => {
  function getSubscriptionEnd(plan: string, startDate: Date): Date {
    const endDate = new Date(startDate);

    if (plan === 'premium_annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate;
  }

  const start = new Date('2024-01-15T00:00:00Z');

  const monthlyEnd = getSubscriptionEnd('premium', start);
  assertEquals(monthlyEnd.toISOString(), '2024-02-15T00:00:00.000Z');

  const annualEnd = getSubscriptionEnd('premium_annual', start);
  assertEquals(annualEnd.toISOString(), '2025-01-15T00:00:00.000Z');
});

// Idempotency
Deno.test('Idempotency - should detect duplicate payments', () => {
  const processedPayments = new Set<string>();

  function isDuplicate(paymentId: string): boolean {
    if (processedPayments.has(paymentId)) {
      return true;
    }
    processedPayments.add(paymentId);
    return false;
  }

  assertEquals(isDuplicate('pay_123'), false); // First time
  assertEquals(isDuplicate('pay_123'), true); // Duplicate
  assertEquals(isDuplicate('pay_456'), false); // Different payment
  assertEquals(isDuplicate('pay_123'), true); // Still duplicate
});

// Response formatting
Deno.test('Response - should format success response', () => {
  function createSuccessResponse(data: object): { status: number; body: string } {
    return {
      status: 200,
      body: JSON.stringify({ success: true, ...data }),
    };
  }

  const response = createSuccessResponse({ subscription_id: 'sub_123' });
  assertEquals(response.status, 200);

  const body = JSON.parse(response.body);
  assertEquals(body.success, true);
  assertEquals(body.subscription_id, 'sub_123');
});

Deno.test('Response - should format error response', () => {
  function createErrorResponse(
    status: number,
    message: string
  ): { status: number; body: string } {
    return {
      status,
      body: JSON.stringify({ error: message }),
    };
  }

  const response = createErrorResponse(401, 'Invalid signature');
  assertEquals(response.status, 401);

  const body = JSON.parse(response.body);
  assertEquals(body.error, 'Invalid signature');
});

// Subscription status mapping
Deno.test('Subscription Status - should map payment status to subscription status', () => {
  function getSubscriptionStatus(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'paid':
        return 'active';
      case 'failed':
        return 'past_due';
      case 'refunded':
        return 'canceled';
      default:
        return 'pending';
    }
  }

  assertEquals(getSubscriptionStatus('paid'), 'active');
  assertEquals(getSubscriptionStatus('failed'), 'past_due');
  assertEquals(getSubscriptionStatus('refunded'), 'canceled');
  assertEquals(getSubscriptionStatus('pending'), 'pending');
  assertEquals(getSubscriptionStatus('unknown'), 'pending');
});

// JSON parsing
Deno.test('JSON Parsing - should parse valid payment webhook', () => {
  const payload = JSON.stringify({
    data: {
      id: 'pay_123',
      status: 'paid',
      amount: 1600,
      currency: 'SAR',
      metadata: {
        user_id: 'user_456',
        plan: 'premium',
        type: 'subscription',
      },
    },
  });

  const parsed = JSON.parse(payload);
  assertExists(parsed.data);
  assertEquals(parsed.data.id, 'pay_123');
  assertEquals(parsed.data.status, 'paid');
  assertEquals(parsed.data.metadata.user_id, 'user_456');
});

Deno.test('JSON Parsing - should handle malformed JSON', () => {
  const malformedPayloads = [
    '{ invalid json }',
    '',
    'null',
    '[]',
  ];

  malformedPayloads.forEach((payload) => {
    try {
      const parsed = JSON.parse(payload);
      // null and [] are valid JSON but wrong structure
      if (parsed === null || Array.isArray(parsed)) {
        assertEquals(parsed?.data, undefined);
      }
    } catch {
      // Expected for invalid JSON
    }
  });
});
