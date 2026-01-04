import { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { StoryCard } from '@/components/feed/StoryCard';
import { useAppStore } from '@/stores';
import { getStories } from '@/lib/api';
import type { Story } from '@/types';

export default function FeedScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pagerRef = useRef<PagerView>(null);
  const { currentStoryIndex, setCurrentStoryIndex, settings } = useAppStore();

  const fetchStories = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await getStories(20, 0);
      setStories(data);
    } catch (err) {
      setError(settings.language === 'ar'
        ? 'فشل في تحميل الأخبار'
        : 'Failed to load stories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [settings.language]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const onRefresh = useCallback(() => {
    fetchStories(true);
  }, [fetchStories]);

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setCurrentStoryIndex(e.nativeEvent.position);
    },
    [setCurrentStoryIndex]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={() => fetchStories()}>
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

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        orientation="vertical"
        onPageSelected={onPageSelected}
      >
        {stories.map((story, index) => (
          <View key={story.id} style={styles.page}>
            <StoryCard
              story={story}
              isActive={index === currentStoryIndex}
              language={settings.language}
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
