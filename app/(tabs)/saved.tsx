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
import { useSavedStories, useUnsaveStory } from '@/hooks';
import type { SavedStory } from '@/types';

export default function SavedScreen() {
  const { settings } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  const isArabic = settings.language === 'ar';

  // React Query hooks
  const { data: savedStories = [], isLoading: loading, refetch, isRefetching: refreshing } = useSavedStories();
  const unsaveStoryMutation = useUnsaveStory();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const handleRemove = (savedItem: SavedStory) => {
    unsaveStoryMutation.mutate(savedItem.story_id);
  };

  const renderItem = ({ item }: { item: SavedStory }) => {
    if (!item.story) return null;

    return (
      <TouchableOpacity
        style={styles.storyCard}
        onPress={() => handleStoryPress(item.story!.id)}
        accessibilityRole="button"
        accessibilityLabel={(isArabic ? item.story!.title_ar : item.story!.title_en) || undefined}
      >
        <Image
          source={{ uri: item.story.image_url || 'https://via.placeholder.com/100' }}
          style={styles.storyImage}
        />
        <View style={styles.storyContent}>
          <Text
            style={[styles.storyTitle, isArabic && styles.arabicText]}
            numberOfLines={2}
          >
            {isArabic ? item.story.title_ar : item.story.title_en}
          </Text>
          <Text style={styles.storyMeta}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item)}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'إزالة من المحفوظات' : 'Remove from saved'}
        >
          <FontAwesome name="bookmark" size={20} color="#007AFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <FontAwesome name="user-circle-o" size={64} color="#333" />
          <Text style={styles.emptyTitle}>
            {isArabic ? 'سجل الدخول لحفظ القصص' : 'Sign in to Save Stories'}
          </Text>
          <Text style={styles.emptySubtext}>
            {isArabic
              ? 'قم بتسجيل الدخول للوصول إلى قصصك المحفوظة'
              : 'Log in to access your saved stories'}
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'تسجيل الدخول لحفظ القصص' : 'Sign in to save stories'}
          >
            <Text style={styles.loginButtonText}>
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isArabic && styles.arabicText]}>
            {isArabic ? 'المحفوظات' : 'Saved'}
          </Text>
        </View>
        <View style={styles.list}>
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
          {isArabic ? 'المحفوظات' : 'Saved'}
        </Text>
        <Text style={styles.headerCount}>
          {savedStories.length} {isArabic ? 'قصة' : 'stories'}
        </Text>
      </View>

      {/* Content */}
      {savedStories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="bookmark-o" size={64} color="#333" />
          <Text style={styles.emptyTitle}>
            {isArabic ? 'لا توجد قصص محفوظة' : 'No Saved Stories'}
          </Text>
          <Text style={styles.emptySubtext}>
            {isArabic
              ? 'اضغط على أيقونة الحفظ لإضافة القصص هنا'
              : 'Tap the bookmark icon to save stories here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedStories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
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
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerCount: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  arabicText: {
    textAlign: 'right',
  },
  list: {
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
    height: 100,
  },
  storyContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  storyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  storyMeta: {
    color: '#888',
    fontSize: 12,
  },
  removeButton: {
    padding: 12,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
