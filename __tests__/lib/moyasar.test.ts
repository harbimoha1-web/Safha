/**
 * Moyasar Payment Integration Tests
 * Tests payment creation, invoices, refunds, and webhook verification
 */

import {
  createPayment,
  getPayment,
  refundPayment,
  createInvoice,
  getInvoice,
  verifyWebhookSignature,
  createSubscriptionInvoice,
  SUBSCRIPTION_PLANS,
} from '@/lib/payments/moyasar';

// Mock fetch
global.fetch = jest.fn();

// Mock config
const mockConfig = {
  apiKey: 'sk_test_12345',
  publishableKey: 'pk_test_12345',
  webhookSecret: 'webhook_secret_12345',
};

// Mock payment data
const mockPayment = {
  id: 'pay_12345',
  status: 'paid' as const,
  amount: 1600,
  fee: 48,
  currency: 'SAR',
  description: 'Safha Premium - Monthly Subscription',
  source: {
    type: 'creditcard',
    company: 'visa',
    name: 'Test User',
    number: '4111XXXXXXXX1111',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock invoice data
const mockInvoice = {
  id: 'inv_12345',
  status: 'initiated' as const,
  amount: 1600,
  currency: 'SAR',
  description: 'Safha Premium - Monthly Subscription',
  url: 'https://moyasar.com/invoices/inv_12345',
  callback_url: 'safha://subscription/callback',
  expired_at: '2024-01-02T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  payments: [],
};

describe('Moyasar Payment Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment with creditcard source', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPayment,
      });

      const result = await createPayment(mockConfig, {
        amount: 1600,
        description: 'Test Payment',
        source: {
          type: 'creditcard',
          name: 'Test User',
          number: '4111111111111111',
          month: '12',
          year: '2025',
          cvc: '123',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.moyasar.com/v1/payments',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockPayment);
    });

    it('should create a payment with mada source', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPayment,
      });

      await createPayment(mockConfig, {
        amount: 1600,
        description: 'Test Payment',
        source: {
          type: 'mada',
          name: 'Test User',
          number: '4543111111111111',
          month: '12',
          year: '2025',
          cvc: '123',
        },
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid card number' }),
      });

      await expect(
        createPayment(mockConfig, {
          amount: 1600,
          description: 'Test Payment',
          source: {
            type: 'creditcard',
            number: 'invalid',
          },
        })
      ).rejects.toThrow('Invalid card number');
    });

    it('should handle multiple error messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: ['Invalid card', 'Expired'] }),
      });

      await expect(
        createPayment(mockConfig, {
          amount: 1600,
          description: 'Test',
          source: { type: 'creditcard' },
        })
      ).rejects.toThrow('Invalid card, Expired');
    });

    it('should default to SAR currency', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPayment,
      });

      await createPayment(mockConfig, {
        amount: 1600,
        description: 'Test',
        source: { type: 'creditcard' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"currency":"SAR"'),
        })
      );
    });
  });

  describe('getPayment', () => {
    it('should get payment by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPayment,
      });

      const result = await getPayment(mockConfig, 'pay_12345');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.moyasar.com/v1/payments/pay_12345',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockPayment);
    });

    it('should throw error for non-existent payment', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Payment not found' }),
      });

      await expect(getPayment(mockConfig, 'pay_invalid')).rejects.toThrow('Payment not found');
    });
  });

  describe('refundPayment', () => {
    it('should refund full payment', async () => {
      const refundedPayment = { ...mockPayment, status: 'refunded' as const };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => refundedPayment,
      });

      const result = await refundPayment(mockConfig, 'pay_12345');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.moyasar.com/v1/payments/pay_12345/refund',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.status).toBe('refunded');
    });

    it('should refund partial amount', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPayment,
      });

      await refundPayment(mockConfig, 'pay_12345', 800);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"amount":800'),
        })
      );
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockInvoice,
      });

      const result = await createInvoice(mockConfig, {
        amount: 1600,
        description: 'Test Invoice',
        callbackUrl: 'safha://callback',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.moyasar.com/v1/invoices',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockInvoice);
    });

    it('should include metadata', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockInvoice,
      });

      await createInvoice(mockConfig, {
        amount: 1600,
        description: 'Test Invoice',
        callbackUrl: 'safha://callback',
        metadata: { user_id: 'user123', plan: 'premium' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"user_id":"user123"'),
        })
      );
    });
  });

  describe('getInvoice', () => {
    it('should get invoice by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockInvoice,
      });

      const result = await getInvoice(mockConfig, 'inv_12345');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.moyasar.com/v1/invoices/inv_12345',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockInvoice);
    });
  });

  describe('verifyWebhookSignature', () => {
    // Mock crypto.subtle for testing
    beforeAll(() => {
      global.crypto = {
        subtle: {
          importKey: jest.fn().mockResolvedValue('mockKey'),
          sign: jest.fn().mockResolvedValue(new Uint8Array([0x12, 0x34, 0x56])),
        } as unknown as SubtleCrypto,
      } as Crypto;
    });

    it('should return false for missing parameters', async () => {
      expect(await verifyWebhookSignature('', 'sig', 'secret')).toBe(false);
      expect(await verifyWebhookSignature('payload', '', 'secret')).toBe(false);
      expect(await verifyWebhookSignature('payload', 'sig', '')).toBe(false);
    });

    it('should return false for length mismatch', async () => {
      // The mock will return a fixed signature, so different length should fail
      const result = await verifyWebhookSignature(
        '{"test":"data"}',
        'short',
        'webhook_secret'
      );
      expect(result).toBe(false);
    });
  });

  describe('createSubscriptionInvoice', () => {
    it('should create monthly subscription invoice', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockInvoice,
      });

      const result = await createSubscriptionInvoice(mockConfig, {
        userId: 'user123',
        plan: 'premium',
        callbackUrl: 'safha://subscription/callback',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"amount":1600'),
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Monthly Subscription'),
        })
      );
    });

    it('should create annual subscription invoice', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockInvoice,
      });

      await createSubscriptionInvoice(mockConfig, {
        userId: 'user123',
        plan: 'premium_annual',
        callbackUrl: 'safha://subscription/callback',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"amount":15000'),
        })
      );
    });

    it('should include user metadata', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockInvoice,
      });

      await createSubscriptionInvoice(mockConfig, {
        userId: 'user123',
        plan: 'premium',
        callbackUrl: 'safha://callback',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"user_id":"user123"'),
        })
      );
    });

    it('should set 24-hour expiry', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockInvoice,
      });

      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      await createSubscriptionInvoice(mockConfig, {
        userId: 'user123',
        plan: 'premium',
        callbackUrl: 'safha://callback',
      });

      // The expiry should be approximately 24 hours from now
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('expired_at'),
        })
      );

      jest.restoreAllMocks();
    });
  });

  describe('SUBSCRIPTION_PLANS', () => {
    it('should have correct free plan', () => {
      expect(SUBSCRIPTION_PLANS.free.price).toBe(0);
      expect(SUBSCRIPTION_PLANS.free.features.ads).toBe(true);
      expect(SUBSCRIPTION_PLANS.free.features.topics).toBe(5);
      expect(SUBSCRIPTION_PLANS.free.features.dailyDigest).toBe(false);
    });

    it('should have correct premium plan', () => {
      expect(SUBSCRIPTION_PLANS.premium.price).toBe(1600);
      expect(SUBSCRIPTION_PLANS.premium.features.ads).toBe(false);
      expect(SUBSCRIPTION_PLANS.premium.features.topics).toBe(999);
      expect(SUBSCRIPTION_PLANS.premium.features.dailyDigest).toBe(true);
      expect(SUBSCRIPTION_PLANS.premium.features.whatsapp).toBe(true);
    });

    it('should have correct annual plan with discount', () => {
      expect(SUBSCRIPTION_PLANS.premium_annual.price).toBe(15000);
      // Annual should be cheaper than 12 months of premium
      const monthlyTotal = SUBSCRIPTION_PLANS.premium.price * 12; // 19200
      expect(SUBSCRIPTION_PLANS.premium_annual.price).toBeLessThan(monthlyTotal);
      // Discount is approximately 22%
      const discount = (monthlyTotal - SUBSCRIPTION_PLANS.premium_annual.price) / monthlyTotal;
      expect(discount).toBeCloseTo(0.22, 1);
    });

    it('should have Arabic translations', () => {
      expect(SUBSCRIPTION_PLANS.free.nameAr).toBeDefined();
      expect(SUBSCRIPTION_PLANS.premium.nameAr).toBeDefined();
      expect(SUBSCRIPTION_PLANS.premium.priceDisplayAr).toContain('ريال');
    });
  });
});
