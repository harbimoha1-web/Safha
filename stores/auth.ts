import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
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

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
      redirectTo: 'tellerapp://reset-password',
    });
    set({ isLoading: false });
    if (error) {
      throw error;
    }
  },
}));
