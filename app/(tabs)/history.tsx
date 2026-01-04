import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { HistoryItemSkeleton } from '@/components/SkeletonLoader';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore, useAuthStore } from '@/stores';
import { useViewedStories } from '@/hooks';

export default function HistoryScreen() {
  const { settings } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  const isArabic = settings.language === 'ar';

  // React Query hook
  const { data: stories = [], isLoading, refetch, isRefetching: isRefreshing } = useViewedStories();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isArabic && styles.arabicText]}>
            {isArabic ? 'سجل القراءة' : 'Reading History'}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <FontAwesome name="sign-in" size={48} color="#333" />
          <Text style={styles.emptyText}>
            {isArabic ? 'سجل الدخول لرؤية سجل القراءة' : 'Sign in to see your reading history'}
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'تسجيل الدخول لرؤية سجل القراءة' : 'Sign in to view history'}
          >
            <Text style={styles.signInButtonText}>
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isArabic && styles.arabicText]}>
            {isArabic ? 'سجل القراءة' : 'Reading History'}
          </Text>
        </View>
        <View style={styles.listContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <HistoryItemSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isArabic && styles.arabicText]}>
          {isArabic ? 'سجل القراءة' : 'Reading History'}
        </Text>
        {stories.length > 0 && (
          <Text style={styles.countText}>
            {stories.length} {isArabic ? 'مقال' : 'articles'}
          </Text>
        )}
      </View>

      {stories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="history" size={48} color="#333" />
          <Text style={styles.emptyText}>
            {isArabic ? 'لا يوجد سجل قراءة بعد' : 'No reading history yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {isArabic
              ? 'المقالات التي تقرأها ستظهر هنا'
              : 'Articles you read will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.storyCard}
              onPress={() => handleStoryPress(item.id)}
              accessibilityRole="button"
              accessibilityLabel={(isArabic ? item.title_ar : item.title_en) || undefined}
            >
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.storyImage} />
              )}
              <View style={styles.storyContent}>
                <Text
                  style={[styles.storyTitle, isArabic && styles.arabicText]}
                  numberOfLines={2}
                >
                  {isArabic ? item.title_ar : item.title_en}
                </Text>
                <View style={styles.storyMeta}>
                  {item.source && (
                    <Text style={styles.sourceText}>{item.source.name}</Text>
                  )}
                  <Text style={styles.dateText}>
                    {new Date(item.published_at || item.created_at).toLocaleDateString(
                      isArabic ? 'ar-SA' : 'en-US',
                      { month: 'short', day: 'numeric' }
                    )}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  arabicText: {
    textAlign: 'right',
  },
  countText: {
    color: '#888',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 24,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  storyImage: {
    width: 100,
    height: 80,
  },
  storyContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  storyTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
});
