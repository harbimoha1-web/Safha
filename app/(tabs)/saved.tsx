import { useCallback, useState, useRef } from 'react';
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
import { SwipeableRow } from '@/components/SwipeableRow';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore, useAuthStore } from '@/stores';
import { useSavedStories, useUnsaveStory, useSaveStory } from '@/hooks';
import { useToast } from '@/components/Toast';
import type { SavedStory } from '@/types';

export default function SavedScreen() {
  const { settings } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  const isArabic = settings.language === 'ar';

  // React Query hooks
  const { data: savedStories = [], isLoading: loading, refetch, isRefetching: refreshing } = useSavedStories();
  const unsaveStoryMutation = useUnsaveStory();
  const saveStoryMutation = useSaveStory();
  const { showToast } = useToast();

  // Track recently deleted item for undo
  const [deletedItem, setDeletedItem] = useState<SavedStory | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const UNDO_DURATION = 4000; // 4 seconds to undo

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const handleRemove = (savedItem: SavedStory) => {
    // Clear any existing undo timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Store the deleted item for potential undo
    setDeletedItem(savedItem);

    // Perform the deletion
    unsaveStoryMutation.mutate(savedItem.story_id);

    // Show toast with undo option
    showToast({
      message: isArabic ? 'تمت الإزالة - اضغط للتراجع' : 'Removed - Tap to undo',
      type: 'info',
      icon: 'undo',
      duration: UNDO_DURATION,
    });

    // Set timeout to clear the deleted item reference
    undoTimeoutRef.current = setTimeout(() => {
      setDeletedItem(null);
    }, UNDO_DURATION);
  };

  const handleUndo = useCallback(() => {
    if (deletedItem) {
      saveStoryMutation.mutate(deletedItem.story_id);
      setDeletedItem(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      showToast({
        message: isArabic ? 'تم استعادة الخبر' : 'Story restored',
        type: 'success',
        icon: 'bookmark',
      });
    }
  }, [deletedItem, saveStoryMutation, isArabic, showToast]);

  const renderItem = ({ item }: { item: SavedStory }) => {
    if (!item.story) return null;

    return (
      <SwipeableRow
        onDelete={() => handleRemove(item)}
        deleteText={isArabic ? 'إزالة' : 'Remove'}
      >
        <TouchableOpacity
          style={styles.storyCard}
          onPress={() => handleStoryPress(item.story!.id)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={(isArabic ? item.story!.title_ar : item.story!.title_en) || undefined}
          accessibilityHint={isArabic ? 'اسحب يساراً للإزالة' : 'Swipe left to remove'}
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
          <View style={styles.bookmarkIcon}>
            <FontAwesome name="bookmark" size={20} color="#007AFF" />
          </View>
        </TouchableOpacity>
      </SwipeableRow>
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
        <>
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
            ListHeaderComponent={
              savedStories.length > 0 ? (
                <Text style={styles.swipeHint}>
                  {isArabic ? '← اسحب يساراً للإزالة' : 'Swipe left to remove →'}
                </Text>
              ) : null
            }
          />

          {/* Undo Button Overlay */}
          {deletedItem && (
            <TouchableOpacity
              style={styles.undoButton}
              onPress={handleUndo}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'تراجع عن الإزالة' : 'Undo removal'}
            >
              <FontAwesome name="undo" size={16} color="#fff" />
              <Text style={styles.undoText}>
                {isArabic ? 'تراجع' : 'Undo'}
              </Text>
            </TouchableOpacity>
          )}
        </>
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
  swipeHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
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
  bookmarkIcon: {
    padding: 12,
    justifyContent: 'center',
  },
  undoButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  undoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
