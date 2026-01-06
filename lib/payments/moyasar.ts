// Moyasar Payment Integration
// Saudi payment gateway supporting mada, Visa, Mastercard, Apple Pay, STC Pay

interface MoyasarConfig {
  apiKey: string;
  publishableKey: string;
  webhookSecret?: string;
}

interface PaymentSource {
  type: 'creditcard' | 'applepay' | 'stcpay' | 'mada';
  // For creditcard
  name?: string;
  number?: string;
  month?: string;
  year?: string;
  cvc?: string;
  // For applepay
  token?: string;
  // For stcpay
  mobile?: string;
}

interface CreatePaymentRequest {
  amount: number; // In halalas (SAR * 100)
  currency?: string;
  description: string;
  source: PaymentSource;
  callbackUrl?: string;
  metadata?: Record<string, string>;
}

interface Payment {
  id: string;
  status: 'initiated' | 'paid' | 'failed' | 'refunded';
  amount: number;
  fee: number;
  currency: string;
  description: string;
  source: {
    type: string;
    company?: string;
    name?: string;
    number?: string;
    message?: string;
  };
  invoice_id?: string;
  ip?: string;
  callback_url?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, string>;
}

interface CreateInvoiceRequest {
  amount: number;
  currency?: string;
  description: string;
  callbackUrl: string;
  expiredAt?: string;
  metadata?: Record<string, string>;
}

interface Invoice {
  id: string;
  status: 'initiated' | 'paid' | 'expired';
  amount: number;
  currency: string;
  description: string;
  url: string;
  callback_url: string;
  expired_at: string;
  created_at: string;
  payments: Payment[];
  metadata?: Record<string, string>;
}

const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

/**
 * Base64 encode for React Native (btoa polyfill)
 * btoa() is not available in React Native environment
 */
function base64Encode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = '='), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));
    if (charCode > 0xff) {
      throw new Error('Base64 encoding error: string contains characters outside of the Latin1 range.');
    }
    block = (block << 8) | charCode;
  }
  return output;
}

/**
 * Create Moyasar API client
 */
function createClient(config: MoyasarConfig) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${base64Encode(config.apiKey + ':')}`,
  };

  return {
    async request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
      const response = await fetch(`${MOYASAR_API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.errors?.join(', ') || `HTTP ${response.status}`);
      }

      return data;
    },
  };
}

/**
 * Create a payment
 */
export async function createPayment(
  config: MoyasarConfig,
  request: CreatePaymentRequest
): Promise<Payment> {
  const client = createClient(config);

  return client.request<Payment>('POST', '/payments', {
    amount: request.amount,
    currency: request.currency || 'SAR',
    description: request.description,
    source: request.source,
    callback_url: request.callbackUrl,
    metadata: request.metadata,
  });
}

/**
 * Get payment by ID
 */
export async function getPayment(
  config: MoyasarConfig,
  paymentId: string
): Promise<Payment> {
  const client = createClient(config);
  return client.request<Payment>('GET', `/payments/${paymentId}`);
}

/**
 * Refund a payment
 */
export async function refundPayment(
  config: MoyasarConfig,
  paymentId: string,
  amount?: number
): Promise<Payment> {
  const client = createClient(config);
  return client.request<Payment>('POST', `/payments/${paymentId}/refund`, {
    amount,
  });
}

/**
 * Create an invoice (payment link)
 */
export async function createInvoice(
  config: MoyasarConfig,
  request: CreateInvoiceRequest
): Promise<Invoice> {
  const client = createClient(config);

  return client.request<Invoice>('POST', '/invoices', {
    amount: request.amount,
    currency: request.currency || 'SAR',
    description: request.description,
    callback_url: request.callbackUrl,
    expired_at: request.expiredAt,
    metadata: request.metadata,
  });
}

/**
 * Get invoice by ID
 */
export async function getInvoice(
  config: MoyasarConfig,
  invoiceId: string
): Promise<Invoice> {
  const client = createClient(config);
  return client.request<Invoice>('GET', `/invoices/${invoiceId}`);
}

/**
 * HMAC-SHA256 for webhook signature verification
 * Works in both React Native and Edge Function environments
 */
async function hmacSha256(secret: string, message: string): Promise<string> {
  // For Edge Functions (Deno) environment
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback error - should not reach here in production
  throw new Error('Crypto API not available for HMAC verification');
}

/**
 * Verify webhook signature from Moyasar
 * CRITICAL: Always verify webhook signatures to prevent payment fraud
 *
 * Moyasar sends signature in X-Moyasar-Signature header as HMAC-SHA256
 * The signature is computed over the raw request body
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!payload || !signature || !secret) {
    console.error('Webhook verification failed: Missing required parameters');
    return false;
  }

  try {
    const expectedSignature = await hmacSha256(secret, payload);

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Create subscription payment invoice
 */
export async function createSubscriptionInvoice(
  config: MoyasarConfig,
  options: {
    userId: string;
    plan: 'premium' | 'premium_annual';
    callbackUrl: string;
  }
): Promise<Invoice> {
  const amounts = {
    premium: 1600, // SAR 16.00 monthly
    premium_annual: 15000, // SAR 150.00 annually (22% discount)
  };

  const descriptions = {
    premium: 'Safha Premium - Monthly Subscription',
    premium_annual: 'Safha Premium - Annual Subscription',
  };

  return createInvoice(config, {
    amount: amounts[options.plan],
    description: descriptions[options.plan],
    callbackUrl: options.callbackUrl,
    expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    metadata: {
      user_id: options.userId,
      plan: options.plan,
      type: 'subscription',
    },
  });
}

// Plan type
export type PlanType = 'free' | 'premium' | 'premium_annual';

// Subscription pricing
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    nameAr: 'مجاني',
    price: 0,
    priceDisplay: 'Free',
    priceDisplayAr: 'مجاني',
    features: {
      topics: 5,
      ads: true,
      dailyDigest: false,
      weeklyDigest: false,
      breakingNews: true,
      whatsapp: false,
    },
  },
  premium: {
    name: 'Premium',
    nameAr: 'بريميوم',
    price: 1600, // halalas (SAR 16)
    priceDisplay: 'SAR 16/month',
    priceDisplayAr: '16 ريال/شهر',
    features: {
      topics: 999,
      ads: false,
      dailyDigest: true,
      weeklyDigest: true,
      breakingNews: true,
      whatsapp: true,
    },
  },
  premium_annual: {
    name: 'Premium Annual',
    nameAr: 'بريميوم سنوي',
    price: 15000, // halalas (SAR 150)
    priceDisplay: 'SAR 150/year (Save 22%)',
    priceDisplayAr: '150 ريال/سنة (وفر 22%)',
    features: {
      topics: 999,
      ads: false,
      dailyDigest: true,
      weeklyDigest: true,
      breakingNews: true,
      whatsapp: true,
    },
  },
} as const;
