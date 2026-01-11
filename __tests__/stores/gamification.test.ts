/**
 * Gamification Store Tests
 * Tests user stats, streaks, achievements, and action recording
 */

import { act } from '@testing-library/react';

// Mock dependencies before importing the store
jest.mock('@/lib/supabase');
jest.mock('@/lib/review', () => ({
  recordStoryReadForReview: jest.fn().mockResolvedValue(undefined),
}));

import { useGamificationStore } from '@/stores/gamification';
import { supabase } from '@/lib/supabase';
import { recordStoryReadForReview } from '@/lib/review';

const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
const mockStoryId = '456e4567-e89b-12d3-a456-426614174001';

const mockStats = {
  user_id: mockUserId,
  current_streak: 5,
  longest_streak: 10,
  total_stories_read: 100,
  total_time_spent_minutes: 500,
  stories_read_this_week: 20,
  stories_read_this_month: 80,
  total_saves: 25,
  total_shares: 15,
};

const mockAchievements = [
  {
    id: '1',
    code: 'streak_3',
    name_ar: 'قارئ منتظم',
    name_en: 'Regular Reader',
    description_ar: 'اقرأ 3 أيام متتالية',
    description_en: 'Read for 3 consecutive days',
    icon: 'fire',
    category: 'streak',
    points: 10,
    is_active: true,
    sort_order: 1,
  },
  {
    id: '2',
    code: 'read_10',
    name_ar: 'بداية جيدة',
    name_en: 'Good Start',
    description_ar: 'اقرأ 10 أخبار',
    description_en: 'Read 10 stories',
    icon: 'book',
    category: 'reading',
    points: 10,
    is_active: true,
    sort_order: 2,
  },
];

describe('Gamification Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useGamificationStore.setState({
      stats: null,
      achievements: [],
      unlockedAchievements: [],
      isLoading: true,
      newAchievements: [],
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useGamificationStore.getState();
      expect(state.stats).toBeNull();
      expect(state.achievements).toEqual([]);
      expect(state.unlockedAchievements).toEqual([]);
      expect(state.isLoading).toBe(true);
      expect(state.newAchievements).toEqual([]);
    });
  });

  describe('fetchStats', () => {
    it('should fetch and set stats for authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockStats, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await act(async () => {
        await useGamificationStore.getState().fetchStats();
      });

      const state = useGamificationStore.getState();
      expect(state.stats).not.toBeNull();
      expect(state.stats?.currentStreak).toBe(5);
      expect(state.stats?.longestStreak).toBe(10);
      expect(state.stats?.totalStoriesRead).toBe(100);
      expect(state.stats?.totalSaves).toBe(25);
      expect(state.isLoading).toBe(false);
    });

    it('should handle unauthenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await act(async () => {
        await useGamificationStore.getState().fetchStats();
      });

      const state = useGamificationStore.getState();
      expect(state.stats).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should handle demo mode (schema cache error)', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST205', message: 'schema cache' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await act(async () => {
        await useGamificationStore.getState().fetchStats();
      });

      const state = useGamificationStore.getState();
      expect(state.stats).not.toBeNull();
      expect(state.stats?.currentStreak).toBe(1); // Demo mode sets streak to 1
      expect(state.isLoading).toBe(false);
    });

    it('should handle no stats gracefully (PGRST116)', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await act(async () => {
        await useGamificationStore.getState().fetchStats();
      });

      const state = useGamificationStore.getState();
      // Should use default stats when no data found
      expect(state.stats?.currentStreak).toBe(0);
      expect(state.isLoading).toBe(false);
    });

    it('should use default stats on exception', async () => {
      (supabase.auth.getUser as jest.Mock).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useGamificationStore.getState().fetchStats();
      });

      const state = useGamificationStore.getState();
      expect(state.stats?.currentStreak).toBe(0);
      expect(state.stats?.totalStoriesRead).toBe(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('fetchAchievements', () => {
    it('should fetch achievements and user unlocks', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock achievements query
      const mockAchievementsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAchievements, error: null }),
      };

      // Mock user_achievements query
      const mockUserAchievementsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ achievement_id: '1', unlocked_at: '2024-01-01T00:00:00Z' }],
          error: null,
        }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'achievements') {
          return mockAchievementsQuery;
        }
        if (table === 'user_achievements') {
          return mockUserAchievementsQuery;
        }
        return mockAchievementsQuery;
      });

      await act(async () => {
        await useGamificationStore.getState().fetchAchievements();
      });

      const state = useGamificationStore.getState();
      expect(state.achievements.length).toBeGreaterThan(0);
      expect(state.unlockedAchievements.length).toBe(1);
      expect(state.unlockedAchievements[0].code).toBe('streak_3');
    });

    it('should handle demo mode for achievements', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST205', message: 'schema cache' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await act(async () => {
        await useGamificationStore.getState().fetchAchievements();
      });

      const state = useGamificationStore.getState();
      // Demo mode uses local achievements
      expect(state.achievements.length).toBeGreaterThan(0);
      expect(state.achievements[0].code).toBe('streak_3');
    });

    it('should handle unauthenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAchievements, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await act(async () => {
        await useGamificationStore.getState().fetchAchievements();
      });

      const state = useGamificationStore.getState();
      expect(state.achievements.length).toBe(2);
      expect(state.unlockedAchievements).toEqual([]);
    });
  });

  describe('recordStoryRead', () => {
    it('should record story read for authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

      const mockQuery = {
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await act(async () => {
        const result = await useGamificationStore.getState().recordStoryRead(mockStoryId);
        expect(result).toEqual([]);
      });

      expect(recordStoryReadForReview).toHaveBeenCalled();
      expect(supabase.rpc).toHaveBeenCalledWith('update_user_streak', { user_uuid: mockUserId });
    });

    it('should return empty array for unauthenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await act(async () => {
        const result = await useGamificationStore.getState().recordStoryRead(mockStoryId);
        expect(result).toEqual([]);
      });

      // Still calls recordStoryReadForReview regardless of auth
      expect(recordStoryReadForReview).toHaveBeenCalled();
    });

    it('should return new achievements when awarded', async () => {
      // Set up initial achievements
      useGamificationStore.setState({
        achievements: mockAchievements,
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      // Mock check_achievements RPC to return new award
      (supabase.rpc as jest.Mock).mockImplementation((name) => {
        if (name === 'check_achievements') {
          return { data: [{ achievement_code: 'read_10' }], error: null };
        }
        return { data: [], error: null };
      });

      const mockQuery = {
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await act(async () => {
        const result = await useGamificationStore.getState().recordStoryRead(mockStoryId);
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('read_10');
      });

      expect(useGamificationStore.getState().newAchievements.length).toBe(1);
    });
  });

  describe('recordSave', () => {
    it('should record save for authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await act(async () => {
        const result = await useGamificationStore.getState().recordSave();
        expect(result).toEqual([]);
      });
    });

    it('should return empty array for unauthenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await act(async () => {
        const result = await useGamificationStore.getState().recordSave();
        expect(result).toEqual([]);
      });
    });
  });

  describe('recordShare', () => {
    it('should record share for authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await act(async () => {
        const result = await useGamificationStore.getState().recordShare();
        expect(result).toEqual([]);
      });
    });

    it('should return empty array for unauthenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await act(async () => {
        const result = await useGamificationStore.getState().recordShare();
        expect(result).toEqual([]);
      });
    });
  });

  describe('clearNewAchievements', () => {
    it('should clear new achievements', () => {
      useGamificationStore.setState({
        newAchievements: mockAchievements,
      });

      expect(useGamificationStore.getState().newAchievements.length).toBe(2);

      act(() => {
        useGamificationStore.getState().clearNewAchievements();
      });

      expect(useGamificationStore.getState().newAchievements).toEqual([]);
    });
  });
});
