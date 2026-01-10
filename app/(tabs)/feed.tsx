import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StoryCard } from '@/components/feed/StoryCard';
import { StoryCardSkeleton } from '@/components/SkeletonLoader';
import { StreakBadge } from '@/components/StreakBadge';
import { useAppStore, useAuthStore } from '@/stores';
import { useSubscriptionStore } from '@/stores/subscription';
import { useGamificationStore } from '@/stores/gamification';
import { recordInteraction } from '@/lib/api';
import { useStories, useSavedStories, useSaveStory, useUnsaveStory, useBlockSource } from '@/hooks';
import { useTheme } from '@/contexts/ThemeContext';
import { PREFETCH_THRESHOLD, colors as defaultColors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';

export default function FeedScreen() {
  const pagerRef = useRef<PagerView>(null);
  const {
    currentStoryIndex,
    setCurrentStoryIndex,
    settings,
    selectedTopics,
    activeFilters,
    toggleActiveFilter,
    clearActiveFilters,
  } = useAppStore();
  const { user } = useAuthStore();
  const { isPremium } = useSubscriptionStore();
  const { stats, fetchStats } = useGamificationStore();
  const { colors } = useTheme();
  const isArabic = settings.language === 'ar';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedMode, setFeedMode] = useState<'interests' | 'explore'>('interests');

  // Reorder topics - active filters first
  const orderedTopics = useMemo(() => {
    const active = selectedTopics.filter((t) => activeFilters.includes(t.id));
    const inactive = selectedTopics.filter((t) => !activeFilters.includes(t.id));
    return [...active, ...inactive];
  }, [selectedTopics, activeFilters]);

  // Fetch stats on mount
  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  // Saved stories with React Query
  const { data: savedStoriesData } = useSavedStories();
  const saveStoryMutation = useSaveStory();
  const unsaveStoryMutation = useUnsaveStory();
  const blockSourceMutation = useBlockSource();

  const savedStoryIds = useMemo(() => {
    return new Set(savedStoriesData?.map((s) => s.story_id) ?? []);
  }, [savedStoriesData]);

  // UUID validation regex for topic IDs
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Get topic IDs from active filters (multi-select) or all selected topics
  const topicIds = useMemo(() => {
    // Explore mode = no filter, show everything
    if (feedMode === 'explore') return undefined;

    // My Interests mode - validate that IDs are proper UUIDs
    const isValidUUID = (id: string) => UUID_REGEX.test(id);

    if (activeFilters.length > 0) {
      const validFilters = activeFilters.filter(isValidUUID);
      return validFilters.length > 0 ? validFilters : undefined;
    }

    if (selectedTopics.length === 0) return undefined;

    const validTopicIds = selectedTopics.map((t) => t.id).filter(isValidUUID);
    return validTopicIds.length > 0 ? validTopicIds : undefined;
  }, [selectedTopics, activeFilters, feedMode]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useStories(topicIds);

  // Flatten paginated data into a single array
  const stories = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  const handleSaveStory = useCallback(
    (storyId: string) => {
      if (!user) {
        router.push('/(auth)/login');
        return;
      }

      const wasSaved = savedStoryIds.has(storyId);

      if (wasSaved) {
        unsaveStoryMutation.mutate(storyId, {
          onError: () => {
            Alert.alert(
              settings.language === 'ar' ? 'خطأ' : 'Error',
              settings.language === 'ar' ? 'فشل في إلغاء الحفظ' : 'Failed to unsave story'
            );
          },
        });
      } else {
        saveStoryMutation.mutate(storyId, {
          onError: () => {
            Alert.alert(
              settings.language === 'ar' ? 'خطأ' : 'Error',
              settings.language === 'ar' ? 'فشل في حفظ الخبر' : 'Failed to save story'
            );
          },
        });
      }
    },
    [user, savedStoryIds, settings.language, saveStoryMutation, unsaveStoryMutation]
  );

  const handleShareStory = useCallback(
    (storyId: string) => {
      if (user) {
        recordInteraction(user.id, storyId, 'share').catch(console.error);
      }
    },
    [user]
  );

  const handleHideSource = useCallback(
    (sourceId: string, sourceName: string) => {
      if (!user) {
        router.push('/(auth)/login');
        return;
      }

      blockSourceMutation.mutate(sourceId, {
        onSuccess: () => {
          Alert.alert(
            isArabic ? 'تم' : 'Done',
            isArabic
              ? `تم إخفاء منشورات ${sourceName}`
              : `Hidden posts from ${sourceName}`
          );
        },
        onError: (error: any) => {
          if (error.code === 'ALREADY_BLOCKED') {
            Alert.alert(
              isArabic ? 'تنبيه' : 'Note',
              isArabic ? 'هذا المصدر مخفي بالفعل' : 'Source already hidden'
            );
          } else {
            Alert.alert(
              isArabic ? 'خطأ' : 'Error',
              isArabic ? 'فشل في إخفاء المصدر' : 'Failed to hide source'
            );
          }
        },
      });
    },
    [user, blockSourceMutation, isArabic]
  );

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const position = e.nativeEvent.position;
      const previousPosition = currentStoryIndex;
      setCurrentStoryIndex(position);

      // Track skip when user swipes to next story (didn't read more)
      if (user && position > previousPosition && stories[previousPosition]) {
        const skippedStory = stories[previousPosition];
        recordInteraction(user.id, skippedStory.id, 'skip').catch(console.error);
      }

      // Prefetch next page when user is near the end
      const storiesCount = stories.length;
      if (position >= storiesCount - PREFETCH_THRESHOLD && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [setCurrentStoryIndex, currentStoryIndex, stories, user, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      if (user) {
        await fetchStats();
      }
      // Reset to first story after refresh
      setCurrentStoryIndex(0);
      pagerRef.current?.setPage(0);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, user, fetchStats, setCurrentStoryIndex]);

  if (isLoading) {
    return <StoryCardSkeleton />;
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {settings.language === 'ar'
            ? 'فشل في تحميل الأخبار'
            : 'Failed to load stories'}
        </Text>
        <Text
          style={[styles.retryText, { color: colors.primary }]}
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel={settings.language === 'ar' ? 'إعادة المحاولة' : 'Tap to retry'}
        >
          {settings.language === 'ar' ? 'إعادة المحاولة' : 'Tap to retry'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Refresh + Streak + Summary Button */}
      <View style={styles.feedHeader}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isRefreshing}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'تحديث الأخبار' : 'Refresh stories'}
        >
          <Animated.View style={isRefreshing ? styles.spinning : undefined}>
            <FontAwesome
              name="refresh"
              size={16}
              color={isRefreshing ? colors.textMuted : colors.white}
            />
          </Animated.View>
        </TouchableOpacity>
        <StreakBadge compact showWarning />
        <TouchableOpacity
            style={styles.safhaButton}
            onPress={() => router.push(isPremium ? '/summary' : '/subscription')}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'ملخص اليوم' : 'Daily Summary'}
          >
            <Text style={styles.safhaButtonText}>{isArabic ? 'ملخص اليوم' : 'Daily Summary'}</Text>
          </TouchableOpacity>
      </View>

      {/* Premium Pill Toggle */}
      <View style={styles.feedModeToggle}>
        <View style={styles.feedModePill}>
          <TouchableOpacity
            style={[
              styles.feedModeSegment,
              feedMode === 'interests' && styles.feedModeSegmentActive,
            ]}
            onPress={() => setFeedMode('interests')}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'اهتماماتي' : 'For You'}
          >
            <FontAwesome
              name="heart"
              size={16}
              color={feedMode === 'interests' ? '#000' : '#fff'}
            />
            <Text style={[
              styles.feedModeText,
              { color: feedMode === 'interests' ? '#000' : '#fff' },
            ]}>
              {isArabic ? 'اهتماماتي' : 'For You'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.feedModeSegment,
              feedMode === 'explore' && styles.feedModeSegmentActive,
            ]}
            onPress={() => setFeedMode('explore')}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'استكشف' : 'Explore'}
          >
            <FontAwesome
              name="compass"
              size={16}
              color={feedMode === 'explore' ? '#000' : '#fff'}
            />
            <Text style={[
              styles.feedModeText,
              { color: feedMode === 'explore' ? '#000' : '#fff' },
            ]}>
              {isArabic ? 'استكشف' : 'Explore'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Topic Filter Bar - Only show in interests mode */}
      {feedMode === 'interests' && selectedTopics.length > 0 && (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {/* Edit Filters Button - First */}
            <TouchableOpacity
              style={[styles.editFiltersButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(auth)/onboarding')}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'تعديل الفلاتر' : 'Edit filters'}
            >
              <FontAwesome name="sliders" size={16} color="#fff" />
              <Text style={[styles.editFiltersText, { color: '#fff' }]}>
                {isArabic ? 'تعديل' : 'Edit'}
              </Text>
            </TouchableOpacity>
            {/* All Topics Chip */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: colors.surfaceOverlay, borderColor: colors.borderLight },
                activeFilters.length === 0 && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => clearActiveFilters()}
              accessibilityLabel={isArabic ? 'الكل' : 'All'}
              accessibilityRole="button"
            >
              <Text style={[
                styles.filterChipText,
                { color: colors.textPrimary },
                activeFilters.length === 0 && { color: colors.white },
              ]}>
                {isArabic ? 'الكل' : 'All'}
              </Text>
            </TouchableOpacity>
            {orderedTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.surfaceOverlay, borderColor: colors.borderLight },
                  activeFilters.includes(topic.id) && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => toggleActiveFilter(topic.id)}
                accessibilityLabel={isArabic ? topic.name_ar : topic.name_en}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.filterChipText,
                  { color: colors.textPrimary },
                  activeFilters.includes(topic.id) && { color: colors.white },
                ]}>
                  {isArabic ? topic.name_ar : topic.name_en}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content - Either Empty State OR PagerView */}
      {stories.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <FontAwesome name="inbox" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isArabic ? 'لا توجد أخبار لهذا الموضوع' : 'No stories for this topic'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            {isArabic ? 'اختر موضوعاً آخر أو اضغط "الكل"' : 'Select another topic or tap "All"'}
          </Text>
        </View>
      ) : (
        <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        orientation="vertical"
        onPageSelected={onPageSelected}
      >
        {stories.map((story, index) => (
          <View key={story.id} style={styles.page} collapsable={false}>
            <StoryCard
              story={story}
              isActive={index === currentStoryIndex}
              language={settings.language}
              isSaved={savedStoryIds.has(story.id)}
              onSave={handleSaveStory}
              onShare={handleShareStory}
              onHideSource={handleHideSource}
            />
          </View>
        ))}
      </PagerView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  feedHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  refreshButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 4,
  },
  spinning: {
    opacity: 0.5,
  },
  feedModeToggle: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 25,
    alignItems: 'center',
  },
  feedModePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 25,
    padding: 4,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 8,
  },
  feedModeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 21,
    minWidth: 110,
  },
  feedModeSegmentActive: {
    backgroundColor: '#fff',
  },
  feedModeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  safhaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 4,
  },
  safhaButtonText: {
    color: defaultColors.black,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  filterBar: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.md,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  filterChipActive: {
    // Dynamic colors applied inline
  },
  filterChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  filterChipTextActive: {
    // Dynamic colors applied inline
  },
  editFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  editFiltersText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryText: {
    fontSize: fontSize.sm,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: 120,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
