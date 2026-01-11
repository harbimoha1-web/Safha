// Subscription Store
// Manages user subscription state and premium features

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import {
  SUBSCRIPTION_PLANS,
  createSubscriptionInvoice,
  type PlanType,
} from '@/lib/payments/moyasar';

// Intent TTL: 24 hours
const INTENT_TTL_MS = 24 * 60 * 60 * 1000;

// Environment configuration
const IS_PRODUCTION = Constants.expoConfig?.extra?.isProduction ?? false;
const MOYASAR_API_KEY = Constants.expoConfig?.extra?.moyasarApiKey ?? process.env.EXPO_PUBLIC_MOYASAR_API_KEY ?? '';
const MOYASAR_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.moyasarPublishableKey ?? process.env.EXPO_PUBLIC_MOYASAR_PUBLISHABLE_KEY ?? '';

// Payment callback URL - deep link back to app
const PAYMENT_CALLBACK_URL = 'safha://subscription/callback';

interface Subscription {
  id: string;
  plan: PlanType;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

// Pending subscription intent - persisted to survive app restarts
interface PendingSubscriptionIntent {
  plan: PlanType;
  createdAt: number;
  source: 'paywall' | 'deeplink' | 'promotion';
}

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  isPremium: boolean;
  pendingPayment: { plan: PlanType; invoiceId: string } | null;
  pendingSubscriptionIntent: PendingSubscriptionIntent | null;

  // Actions
  fetchSubscription: () => Promise<void>;
  initiatePayment: (plan: PlanType) => Promise<PaymentResult>;
  confirmPayment: () => Promise<void>;
  subscribe: (plan: PlanType) => Promise<void>;
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
  checkFeatureAccess: (feature: keyof typeof SUBSCRIPTION_PLANS.premium.features) => boolean;
  getTopicLimit: () => number;
  reset: () => void;

  // Intent management
  setSubscriptionIntent: (plan: PlanType, source: 'paywall' | 'deeplink' | 'promotion') => void;
  clearSubscriptionIntent: () => void;
  getValidIntent: () => PendingSubscriptionIntent | null;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      isLoading: true,
      isPremium: false,
      pendingPayment: null,
      pendingSubscriptionIntent: null,

  fetchSubscription: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ subscription: null, isPremium: false, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Handle missing table gracefully - use free plan
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          console.log('Demo mode: Using free plan (database not configured)');
          set({ subscription: null, isPremium: false, isLoading: false });
          return;
        }
        if (error.code !== 'PGRST116') {
          console.error('Subscription fetch error:', error);
        }
      }

      if (data) {
        const subscription: Subscription = {
          id: data.id,
          plan: data.plan,
          status: data.status,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end,
        };

        const isPremium =
          (data.plan === 'premium' || data.plan === 'premium_annual') &&
          (data.status === 'active' || data.status === 'trialing') &&
          (!data.current_period_end || new Date(data.current_period_end) > new Date());

        set({ subscription, isPremium, isLoading: false });
      } else {
        set({ subscription: null, isPremium: false, isLoading: false });
      }
    } catch (error) {
      console.error('Subscription fetch failed:', error);
      set({ subscription: null, isPremium: false, isLoading: false });
    }
  },

  initiatePayment: async (plan: PlanType): Promise<PaymentResult> => {
    // In development without API key, use demo mode
    if (!IS_PRODUCTION && !MOYASAR_API_KEY) {
      console.log('Demo mode: Simulating payment flow');
      return {
        success: true,
        paymentUrl: undefined, // No URL means demo mode - will activate directly
      };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Create Moyasar payment invoice
      const invoice = await createSubscriptionInvoice(
        {
          apiKey: MOYASAR_API_KEY,
          publishableKey: MOYASAR_PUBLISHABLE_KEY,
        },
        {
          userId: user.id,
          plan: plan as 'premium' | 'premium_annual',
          callbackUrl: PAYMENT_CALLBACK_URL,
        }
      );

      // Store pending payment info for confirmation
      set({ pendingPayment: { plan, invoiceId: invoice.id } });

      return {
        success: true,
        paymentUrl: invoice.url,
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  },

  confirmPayment: async () => {
    // Called when user returns from payment
    // Refresh subscription status - webhook should have already updated it
    await get().fetchSubscription();
    set({ pendingPayment: null });
  },

  // INTERNAL: Direct subscription activation
  // In production: Only webhook-moyasar should activate subscriptions
  // In development: Used for demo mode testing without payment
  subscribe: async (plan: PlanType) => {
    // SECURITY: Block direct subscription in production
    if (IS_PRODUCTION) {
      console.error('Direct subscription blocked in production - use payment flow');
      throw new Error('Payment required');
    }

    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Demo mode: Activating subscription directly (no payment)');

      // Calculate subscription period (30-day free trial)
      const now = new Date();
      const periodEnd = new Date();
      if (plan === 'premium_annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Create/update subscription in database
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan,
          status: 'trialing', // Mark as trial in demo mode
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Subscription update error:', error);
        throw new Error('Failed to activate subscription');
      }

      // Refresh subscription state from database
      await useSubscriptionStore.getState().fetchSubscription();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  cancelSubscription: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { subscription } = get();
      if (!subscription) {
        return { success: false, error: 'No active subscription' };
      }

      // Mark subscription to cancel at period end
      const { error } = await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('user_id', user.id)
        .eq('id', subscription.id);

      if (error) {
        console.error('Cancel subscription error:', error);
        return { success: false, error: 'Failed to cancel subscription' };
      }

      // Update local state
      set({
        subscription: {
          ...subscription,
          cancelAtPeriodEnd: true,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Cancel subscription failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  checkFeatureAccess: (feature) => {
    const { subscription, isPremium } = get();

    if (!subscription || subscription.plan === 'free') {
      return SUBSCRIPTION_PLANS.free.features[feature] as boolean;
    }

    if (isPremium) {
      return SUBSCRIPTION_PLANS.premium.features[feature] as boolean;
    }

    return SUBSCRIPTION_PLANS.free.features[feature] as boolean;
  },

  getTopicLimit: () => {
    const { isPremium } = get();
    return isPremium ? 999 : 3;
  },

  reset: () => {
    set({
      subscription: null,
      isLoading: false,
      isPremium: false,
      pendingPayment: null,
      pendingSubscriptionIntent: null,
    });
  },

  // Intent management - for handling subscription flow across login
  setSubscriptionIntent: (plan, source) => {
    set({
      pendingSubscriptionIntent: {
        plan,
        source,
        createdAt: Date.now(),
      },
    });
  },

  clearSubscriptionIntent: () => {
    set({ pendingSubscriptionIntent: null });
  },

  getValidIntent: () => {
    const intent = get().pendingSubscriptionIntent;
    if (!intent) return null;

    // Check TTL - expire after 24 hours
    const age = Date.now() - intent.createdAt;
    if (age > INTENT_TTL_MS) {
      set({ pendingSubscriptionIntent: null });
      return null;
    }

    return intent;
  },
    }),
    {
      name: 'safha-subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist the intent - subscription status comes from server
        pendingSubscriptionIntent: state.pendingSubscriptionIntent,
      }),
    }
  )
);

// Helper hooks
export function useIsPremium(): boolean {
  return useSubscriptionStore(state => state.isPremium);
}

export function useCanAccessFeature(
  feature: keyof typeof SUBSCRIPTION_PLANS.premium.features
): boolean {
  return useSubscriptionStore(state => state.checkFeatureAccess(feature));
}
