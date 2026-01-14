// Gamification Store
// Manages user stats, streaks, and achievements

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { recordStoryReadForReview } from '@/lib/review';
import { createLogger } from '@/lib/debug';

const log = createLogger('Gamification');

interface Achievement {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  category: string;
  points: number;
  unlockedAt?: string;
}

interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalStoriesRead: number;
  totalTimeSpentMinutes: number;
  storiesReadThisWeek: number;
  storiesReadThisMonth: number;
  totalSaves: number;
  totalShares: number;
  lastActiveDate?: string;
}

interface GamificationState {
  stats: UserStats | null;
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  isLoading: boolean;
  newAchievements: Achievement[]; // Recently unlocked, for celebration

  // Actions
  fetchStats: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  recordStoryRead: (storyId: string) => Promise<Achievement[]>;
  recordSave: () => Promise<Achievement[]>;
  recordShare: () => Promise<Achievement[]>;
  clearNewAchievements: () => void;
}

const defaultStats: UserStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalStoriesRead: 0,
  totalTimeSpentMinutes: 0,
  storiesReadThisWeek: 0,
  storiesReadThisMonth: 0,
  totalSaves: 0,
  totalShares: 0,
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  stats: null,
  achievements: [],
  unlockedAchievements: [],
  isLoading: true,
  newAchievements: [],

  fetchStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ stats: null, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Handle missing table gracefully - use demo stats
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          log.debug('Demo mode: Using local stats (database not configured)');
          set({ stats: { ...defaultStats, currentStreak: 1 }, isLoading: false });
          return;
        }
        if (error.code !== 'PGRST116') {
          log.error('Stats fetch error:', error);
        }
      }

      if (data) {
        set({
          stats: {
            currentStreak: data.current_streak,
            longestStreak: data.longest_streak,
            totalStoriesRead: data.total_stories_read,
            totalTimeSpentMinutes: data.total_time_spent_minutes,
            storiesReadThisWeek: data.stories_read_this_week,
            storiesReadThisMonth: data.stories_read_this_month,
            totalSaves: data.total_saves,
            totalShares: data.total_shares,
          },
          isLoading: false,
        });
      } else {
        set({ stats: defaultStats, isLoading: false });
      }
    } catch (error) {
      log.error('Stats fetch failed:', error);
      set({ stats: defaultStats, isLoading: false });
    }
  },

  fetchAchievements: async () => {
    // Demo achievements for when database is not configured
    const demoAchievements: Achievement[] = [
      { id: '1', code: 'streak_3', name_ar: 'قارئ منتظم', name_en: 'Regular Reader', description_ar: 'اقرأ 3 أيام متتالية', description_en: 'Read for 3 consecutive days', icon: 'fire', category: 'streak', points: 10 },
      { id: '2', code: 'streak_7', name_ar: 'أسبوع كامل', name_en: 'Week Warrior', description_ar: 'اقرأ 7 أيام متتالية', description_en: 'Read for 7 consecutive days', icon: 'fire', category: 'streak', points: 25 },
      { id: '3', code: 'read_10', name_ar: 'بداية جيدة', name_en: 'Good Start', description_ar: 'اقرأ 10 أخبار', description_en: 'Read 10 stories', icon: 'book', category: 'reading', points: 10 },
      { id: '4', code: 'first_save', name_ar: 'أول إشارة', name_en: 'First Bookmark', description_ar: 'احفظ أول خبر', description_en: 'Save your first story', icon: 'bookmark', category: 'engagement', points: 5 },
    ];

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get all achievements
      const { data: allAchievements, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      // Handle missing table gracefully
      if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
        log.debug('Demo mode: Using local achievements (database not configured)');
        set({ achievements: demoAchievements, unlockedAchievements: [] });
        return;
      }

      if (!user) {
        set({ achievements: allAchievements || demoAchievements, unlockedAchievements: [] });
        return;
      }

      // Get user's unlocked achievements
      const { data: userAchievements, error: uaError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      if (uaError && (uaError.code === 'PGRST205' || uaError.message?.includes('schema cache'))) {
        set({ achievements: allAchievements || demoAchievements, unlockedAchievements: [] });
        return;
      }

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

      const unlocked = (allAchievements || [])
        .filter(a => unlockedIds.has(a.id))
        .map(a => ({
          ...a,
          unlockedAt: userAchievements?.find(ua => ua.achievement_id === a.id)?.unlocked_at,
        }));

      set({
        achievements: allAchievements || demoAchievements,
        unlockedAchievements: unlocked,
      });
    } catch (error) {
      log.error('Achievements fetch failed:', error);
      set({ achievements: demoAchievements, unlockedAchievements: [] });
    }
  },

  recordStoryRead: async (storyId: string) => {
    const newAchievements: Achievement[] = [];

    // Track for review prompt (runs regardless of auth)
    recordStoryReadForReview().catch(log.error);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return newAchievements;

      // Update streak
      await supabase.rpc('update_user_streak', { user_uuid: user.id });

      // Increment story count
      await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          total_stories_read: 1,
        }, {
          onConflict: 'user_id',
        });

      // Actually increment (upsert doesn't support increment)
      await supabase.rpc('increment_story_count_stat', { user_uuid: user.id });

      // Check for new achievements
      const { data: newAwards } = await supabase.rpc('check_achievements', {
        user_uuid: user.id,
      });

      if (newAwards && newAwards.length > 0) {
        const { achievements } = get();
        const awarded = achievements.filter(a =>
          newAwards.some((na: { achievement_code: string }) => na.achievement_code === a.code)
        );
        newAchievements.push(...awarded);
        set({ newAchievements: awarded });
      }

      // Refresh stats
      get().fetchStats();
    } catch (error) {
      log.error('Record story read error:', error);
    }

    return newAchievements;
  },

  recordSave: async () => {
    const newAchievements: Achievement[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return newAchievements;

      // Increment save count
      await supabase
        .from('user_stats')
        .update({ total_saves: supabase.rpc('increment') })
        .eq('user_id', user.id);

      // Check achievements
      const { data: newAwards } = await supabase.rpc('check_achievements', {
        user_uuid: user.id,
      });

      if (newAwards && newAwards.length > 0) {
        const { achievements } = get();
        const awarded = achievements.filter(a =>
          newAwards.some((na: { achievement_code: string }) => na.achievement_code === a.code)
        );
        newAchievements.push(...awarded);
        set({ newAchievements: awarded });
      }

      get().fetchStats();
    } catch (error) {
      log.error('Record save error:', error);
    }

    return newAchievements;
  },

  recordShare: async () => {
    const newAchievements: Achievement[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return newAchievements;

      // Increment share count
      await supabase
        .from('user_stats')
        .update({ total_shares: supabase.rpc('increment') })
        .eq('user_id', user.id);

      // Check achievements
      const { data: newAwards } = await supabase.rpc('check_achievements', {
        user_uuid: user.id,
      });

      if (newAwards && newAwards.length > 0) {
        const { achievements } = get();
        const awarded = achievements.filter(a =>
          newAwards.some((na: { achievement_code: string }) => na.achievement_code === a.code)
        );
        newAchievements.push(...awarded);
        set({ newAchievements: awarded });
      }

      get().fetchStats();
    } catch (error) {
      log.error('Record share error:', error);
    }

    return newAchievements;
  },

  clearNewAchievements: () => {
    set({ newAchievements: [] });
  },
}));
