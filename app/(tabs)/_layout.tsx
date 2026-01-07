import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useAppStore } from '@/stores';
import { useGamificationStore } from '@/stores/gamification';
import { useSubscriptionStore } from '@/stores/subscription';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ReviewPrompt } from '@/components/ReviewPrompt';
import { useTheme } from '@/contexts/ThemeContext';
import {
  initializeReviewTracking,
  shouldShowReviewPrompt,
  markReviewPromptShown,
  getReviewTriggerReason,
} from '@/lib/review';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return (
    <View style={styles.iconContainer}>
      <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />
    </View>
  );
}

export default function TabLayout() {
  const { settings } = useAppStore();
  const { fetchStats, fetchAchievements, stats, unlockedAchievements } = useGamificationStore();
  const { isPremium } = useSubscriptionStore();
  const { colors } = useTheme();
  const isArabic = settings.language === 'ar';

  // Review prompt state
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [reviewTriggerReason, setReviewTriggerReason] = useState<'stories' | 'streak' | 'achievements' | null>(null);

  // Initialize review tracking on mount
  useEffect(() => {
    initializeReviewTracking();
  }, []);

  // Fetch gamification data on mount
  useEffect(() => {
    fetchStats();
    fetchAchievements();
  }, [fetchStats, fetchAchievements]);

  // Check if we should show review prompt when stats update
  const checkReviewPrompt = useCallback(async () => {
    if (!stats) return;

    const currentStreak = stats.currentStreak || 0;
    const achievementCount = unlockedAchievements?.length || 0;

    const shouldShow = await shouldShowReviewPrompt(currentStreak, achievementCount);

    if (shouldShow) {
      const reason = await getReviewTriggerReason(currentStreak, achievementCount);
      setReviewTriggerReason(reason);
      await markReviewPromptShown(currentStreak, achievementCount);
      setShowReviewPrompt(true);
    }
  }, [stats, unlockedAchievements]);

  // Check for review prompt when stats are loaded
  useEffect(() => {
    if (stats && unlockedAchievements) {
      // Small delay to not interrupt initial app experience
      const timer = setTimeout(() => {
        checkReviewPrompt();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stats, unlockedAchievements, checkReviewPrompt]);

  const handleCloseReviewPrompt = useCallback(() => {
    setShowReviewPrompt(false);
    setReviewTriggerReason(null);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 25,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
          headerShown: false,
        }}
      >
        {/* Tab 1: Home (Feed) */}
        <Tabs.Screen
          name="feed"
          options={{
            title: isArabic ? 'الرئيسية' : 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="newspaper-o" color={color} />,
          }}
        />

        {/* Tab 2: Explore (Search) */}
        <Tabs.Screen
          name="search"
          options={{
            title: isArabic ? 'استكشف' : 'Explore',
            tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
          }}
        />

        {/* Tab 3: Library (Saved + History) */}
        <Tabs.Screen
          name="library"
          options={{
            title: isArabic ? 'مكتبتي' : 'Library',
            tabBarIcon: ({ color }) => <TabBarIcon name="folder-o" color={color} />,
          }}
        />

        {/* Tab 4: Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            title: isArabic ? 'حسابي' : 'Me',
            tabBarIcon: ({ color }) => <TabBarIcon name="user-o" color={color} />,
          }}
        />

        {/* Hidden tabs - still accessible via navigation */}
        <Tabs.Screen
          name="achievements"
          options={{
            href: null, // Hidden - accessed via Profile
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            href: null, // Hidden - merged into Library
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            href: null, // Hidden - merged into Library
          }}
        />
      </Tabs>

      {/* Floating Action Button - only show for non-premium users */}
      {!isPremium && <FloatingActionButton />}

      {/* Review Prompt Modal */}
      <ReviewPrompt
        visible={showReviewPrompt}
        onClose={handleCloseReviewPrompt}
        triggerReason={reviewTriggerReason}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
