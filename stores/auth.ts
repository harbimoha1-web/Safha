import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useSubscriptionStore } from './subscription';
import type { Profile } from '@/types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingPhone: string | null; // For OTP verification

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  pendingPhone: null,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading: false,
    });
  },

  setProfile: (profile) => {
    set({ profile });
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Success - isLoading will be reset by onAuthStateChange listener
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUpWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      // Success - isLoading will be reset by onAuthStateChange listener
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      // Success - isLoading will be reset by onAuthStateChange listener
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signInWithApple: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });
      if (error) throw error;
      // Success - isLoading will be reset by onAuthStateChange listener
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signInWithPhone: async (phone) => {
    set({ isLoading: true });
    try {
      // Format Saudi phone number
      let formattedPhone = phone.replace(/\s+/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+966' + formattedPhone.slice(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+966' + formattedPhone;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      if (error) throw error;

      set({ pendingPhone: formattedPhone, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  verifyOTP: async (phone, token) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      if (error) throw error;

      set({ pendingPhone: null });
      // Success - isLoading will be reset by onAuthStateChange listener
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Reset subscription state to prevent premium status persisting after logout
      useSubscriptionStore.getState().reset();

      set({
        session: null,
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Profile doesn't exist - create it
        if (error.code === 'PGRST116' || error.message?.includes('coerce')) {
          console.log('Profile not found, creating new profile...');
          const newProfile = {
            id: user.id,
            username: user.email?.split('@')[0] || null,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            language: 'en',
            notification_preferences: { daily_digest: true, breaking_news: true, weekly_summary: false, push_enabled: true, email_enabled: true },
            selected_topics: [],
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('Failed to create profile:', createError.message);
            // Use local fallback
            set({ profile: { ...newProfile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any });
          } else {
            set({ profile: createdProfile });
          }
          return;
        }

        // Handle missing table gracefully - use mock profile
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          console.log('Demo mode: Using local profile (database not configured)');
          const mockProfile = {
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            language: 'en' as const,
            notification_preferences: { daily_digest: true, breaking_news: true },
            selected_topics: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          set({ profile: mockProfile as any });
          return;
        }
        console.error('Profile fetch error:', error.message);
        return;
      }

      if (data) {
        set({ profile: data });
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'safha://reset-password',
    });
    set({ isLoading: false });
    if (error) {
      throw error;
    }
  },
}));
