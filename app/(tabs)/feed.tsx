import { useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StoryCard } from '@/components/feed/StoryCard';
import { StoryCardSkeleton } from '@/components/SkeletonLoader';
import { useAppStore, useAuthStore } from '@/stores';
import { recordInteraction } from '@/lib/api';
import { useStories, useSavedStories, useSaveStory, useUnsaveStory } from '@/hooks';
import { PREFETCH_THRESHOLD } from '@/constants/config';

export default function FeedScreen() {
  const pagerRef = useRef<PagerView>(null);
  const { currentStoryIndex, setCurrentStoryIndex, settings, selectedTopics } = useAppStore();
  const { user } = useAuthStore();

  // Saved stories with React Query
  const { data: savedStoriesData } = useSavedStories();
  const saveStoryMutation = useSaveStory();
  const unsaveStoryMutation = useUnsaveStory();

  const savedStoryIds = useMemo(() => {
    return new Set(savedStoriesData?.map((s) => s.story_id) ?? []);
  }, [savedStoriesData]);

  // Get topic IDs from selected topics
  const topicIds = useMemo(() => {
    if (selectedTopics.length === 0) return undefined;
    return selectedTopics.map((t) => t.id);
  }, [selectedTopics]);

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

  if (isLoading) {
    return <StoryCardSkeleton />;
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {settings.language === 'ar'
            ? 'فشل في تحميل الأخبار'
            : 'Failed to load stories'}
        </Text>
        <Text style={styles.retryText} onPress={() => refetch()}>
          {settings.language === 'ar' ? 'إعادة المحاولة' : 'Tap to retry'}
        </Text>
      </View>
    );
  }

  if (stories.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          {settings.language === 'ar' ? 'لا توجد أخبار' : 'No stories available'}
        </Text>
      </View>
    );
  }

  const isArabic = settings.language === 'ar';

  return (
    <View style={styles.container}>
      {/* Topic Filter Bar */}
      {selectedTopics.length > 0 && (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {selectedTopics.map((topic) => (
              <View key={topic.id} style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {isArabic ? topic.name_ar : topic.name_en}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.editFiltersButton}
              onPress={() => router.push('/(auth)/onboarding')}
            >
              <FontAwesome name="sliders" size={14} color="#007AFF" />
              <Text style={styles.editFiltersText}>
                {isArabic ? 'تعديل' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

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
            />
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  filterBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 12,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  editFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,122,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editFiltersText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    color: '#007AFF',
    fontSize: 14,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});
