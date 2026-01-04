import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAppStore, useAuthStore } from '@/stores';
import { getStoryById, recordInteraction, saveStory, unsaveStory, isStorySaved } from '@/lib/api';
import type { Story } from '@/types';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { settings } = useAppStore();
  const { user } = useAuthStore();

  const isArabic = settings.language === 'ar';

  useEffect(() => {
    if (id) {
      loadStory();
    }
  }, [id]);

  const loadStory = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStoryById(id);
      setStory(data);
      // Check if story is already saved (optimized - single row check instead of fetching all)
      if (user && data) {
        const saved = await isStorySaved(user.id, id);
        setIsSaved(saved);
        // Record view interaction
        recordInteraction(user.id, id, 'view').catch(() => {});
      }
    } catch (err) {
      setError(isArabic ? 'فشل في تحميل الخبر' : 'Failed to load story');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !id) return;
    const wasIsSaved = isSaved;
    setIsSaved(!isSaved); // Optimistic update
    try {
      if (wasIsSaved) {
        await unsaveStory(user.id, id);
      } else {
        await saveStory(user.id, id);
      }
    } catch (err) {
      setIsSaved(wasIsSaved); // Revert on error
    }
  };

  const handleShare = async () => {
    if (!story) return;
    try {
      const result = await Share.share({
        message: `${isArabic ? story.title_ar : story.title_en}\n\nRead on Teller`,
        url: story.original_url,
      });
      // Track share if user completed the share action
      if (result.action === Share.sharedAction && user && id) {
        recordInteraction(user.id, id, 'share').catch(console.error);
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenOriginal = () => {
    if (story?.original_url) {
      Linking.openURL(story.original_url);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || (isArabic ? 'الخبر غير موجود' : 'Story not found')}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>
            {isArabic ? 'رجوع' : 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
            <FontAwesome
              name={isSaved ? 'bookmark' : 'bookmark-o'}
              size={22}
              color={isSaved ? '#007AFF' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <FontAwesome name="share" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {story.image_url && (
          <Image source={{ uri: story.image_url }} style={styles.image} />
        )}

        {/* Source & Date */}
        <View style={styles.meta}>
          {story.source && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{story.source.name}</Text>
            </View>
          )}
          <Text style={styles.dateText}>
            {new Date(story.published_at || story.created_at).toLocaleDateString(
              isArabic ? 'ar-SA' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, isArabic && styles.arabicText]}>
          {isArabic ? story.title_ar : story.title_en}
        </Text>

        {/* Summary */}
        <Text style={[styles.summary, isArabic && styles.arabicText]}>
          {isArabic ? story.summary_ar : story.summary_en}
        </Text>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <FontAwesome name="eye" size={16} color="#888" />
            <Text style={styles.statText}>{story.view_count}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="bookmark-o" size={16} color="#888" />
            <Text style={styles.statText}>{story.save_count}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="share" size={16} color="#888" />
            <Text style={styles.statText}>{story.share_count}</Text>
          </View>
        </View>

        {/* Read Original Button */}
        <TouchableOpacity style={styles.originalButton} onPress={handleOpenOriginal}>
          <Text style={styles.originalButtonText}>
            {isArabic ? 'قراءة المقال الأصلي' : 'Read Original Article'}
          </Text>
          <FontAwesome name="external-link" size={16} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
  backLink: {
    color: '#007AFF',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sourceBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sourceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    lineHeight: 34,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  summary: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 17,
    lineHeight: 28,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 24,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#222',
    marginHorizontal: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#888',
    fontSize: 14,
  },
  originalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  originalButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 100,
  },
});
