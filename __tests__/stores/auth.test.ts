import { act } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';

// Reset store before each test
beforeEach(() => {
  useAuthStore.setState({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });
  jest.clearAllMocks();
});

describe('useAuthStore', () => {
  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useAuthStore.getState();

      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
      expect(state.isLoading).toBe(true);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setSession', () => {
    it('should set session and update authentication state', () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123', email: 'test@example.com' },
      } as any;

      act(() => {
        useAuthStore.getState().setSession(mockSession);
      });

      const state = useAuthStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.user).toEqual(mockSession.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should clear state when session is null', () => {
      // First set a session
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123' },
      } as any;

      act(() => {
        useAuthStore.getState().setSession(mockSession);
      });

      // Then clear it
      act(() => {
        useAuthStore.getState().setSession(null);
      });

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setProfile', () => {
    it('should set profile correctly', () => {
      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        username: 'testuser',
      } as any;

      act(() => {
        useAuthStore.getState().setProfile(mockProfile);
      });

      expect(useAuthStore.getState().profile).toEqual(mockProfile);
    });
  });

  describe('signInWithEmail', () => {
    it('should set loading state during sign in', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });

      const signInPromise = useAuthStore.getState().signInWithEmail('test@example.com', 'password');

      // Loading should be true immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await signInPromise;
    });

    it('should throw error and reset loading on failure', async () => {
      const mockError = new Error('Invalid credentials');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        useAuthStore.getState().signInWithEmail('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('signUpWithEmail', () => {
    it('should call supabase signUp', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      await useAuthStore.getState().signUpWithEmail('new@example.com', 'password123');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
    });

    it('should throw error on failure', async () => {
      const mockError = new Error('Email already registered');
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        useAuthStore.getState().signUpWithEmail('existing@example.com', 'password')
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('signOut', () => {
    it('should clear all user state on sign out', async () => {
      // Set up authenticated state
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123' },
      } as any;

      act(() => {
        useAuthStore.getState().setSession(mockSession);
        useAuthStore.getState().setProfile({ id: 'user-123', full_name: 'Test' } as any);
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should call supabase resetPasswordForEmail', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      await useAuthStore.getState().resetPassword('test@example.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'safha://reset-password',
      });
    });

    it('should handle loading state correctly', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      // Reset to known state
      useAuthStore.setState({ isLoading: false });

      const promise = useAuthStore.getState().resetPassword('test@example.com');
      expect(useAuthStore.getState().isLoading).toBe(true);

      await promise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
