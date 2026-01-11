import { useEffect, useState, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAppStore, useAuthStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { getStoryById, recordInteraction, saveStory, unsaveStory, isStorySaved, fetchStoryContent } from '@/lib/api';
import { getOptimizedImageUrl } from '@/lib/image';
import { spacing, borderRadius, fontSize, fontWeight, fontFamily } from '@/constants/theme';
import type { Story } from '@/types';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [fetchedContent, setFetchedContent] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [useOriginalUrl, setUseOriginalUrl] = useState(false);
  const { settings } = useAppStore();
  const { user } = useAuthStore();
  const { colors } = useTheme();

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
      if (user && data) {
        const saved = await isStorySaved(user.id, id);
        setIsSaved(saved);
        recordInteraction(user.id, id, 'view').catch(() => {});
      }
    } catch (err) {
      setError(isArabic ? 'فشل في تحميل الخبر' : 'Failed to load story');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch content on-demand if story doesn't have full_content
  useEffect(() => {
    const loadContentOnDemand = async () => {
      // Only fetch if story loaded, has URL, no content, and not already fetching
      if (!story || !story.original_url || isLoadingContent || fetchedContent) return;

      // Check if content already exists
      const existingContent = story.full_content;
      if (existingContent && existingContent.length > 100) return;

      setIsLoadingContent(true);
      try {
        const result = await fetchStoryContent(story.id, story.original_url);
        if (result.content) {
          setFetchedContent(result.content);
        }
      } catch (err) {
        console.error('Failed to fetch content on-demand:', err);
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadContentOnDemand();
  }, [story?.id, story?.original_url, story?.full_content]);

  const handleSave = useCallback(async () => {
    if (!user || !id) return;
    const wasIsSaved = isSaved;
    setIsSaved(!isSaved);
    try {
      if (wasIsSaved) {
        await unsaveStory(user.id, id);
      } else {
        await saveStory(user.id, id);
      }
    } catch (err) {
      setIsSaved(wasIsSaved);
    }
  }, [user, id, isSaved]);

  const handleShare = useCallback(async () => {
    if (!story) return;
    try {
      const result = await Share.share({
        message: `${isArabic ? story.title_ar : story.title_en}\n\nRead on Safha`,
        url: story.original_url,
      });
      if (result.action === Share.sharedAction && user && id) {
        recordInteraction(user.id, id, 'share').catch(console.error);
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [story, isArabic, user, id]);

  const handleOpenOriginal = useCallback(() => {
    if (story?.original_url) {
      Linking.openURL(story.original_url);
    }
  }, [story]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {error || (isArabic ? 'الخبر غير موجود' : 'Story not found')}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>
            {isArabic ? 'رجوع' : 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = isArabic ? story.title_ar : story.title_en;
  const summary = isArabic ? story.summary_ar : story.summary_en;
  const whyItMatters = isArabic ? story.why_it_matters_ar : story.why_it_matters_en;

  // Use fetched content if available, otherwise use story's full_content
  const fullContent = fetchedContent || story.full_content;
  const hasFullContent = fullContent && fullContent.length > 100;

  // Image URL with fallback chain (same pattern as StoryCard)
  // 1. Try optimized URL (wsrv.nl) first
  // 2. On error, fall back to original URL
  // 3. If both fail, hide image
  const optimizedImageUrl = story.image_url ? getOptimizedImageUrl(story.image_url, undefined, 300) : null;
  const displayImageUrl = useOriginalUrl ? story.image_url : (optimizedImageUrl || story.image_url);
  const hasValidImage = displayImageUrl && !imageError;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'رجوع' : 'Go back'}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? (isArabic ? 'إزالة الإشارة المرجعية' : 'Remove bookmark') : (isArabic ? 'حفظ الخبر' : 'Save story')}
          >
            <FontAwesome
              name={isSaved ? 'bookmark' : 'bookmark-o'}
              size={22}
              color={isSaved ? '#007AFF' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'مشاركة' : 'Share'}
          >
            <FontAwesome name="share" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image with fallback chain: optimized → original → hide */}
        {hasValidImage && (
          <Image
            source={{ uri: displayImageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              if (!useOriginalUrl && story.image_url) {
                // Optimized URL failed, try original URL
                setUseOriginalUrl(true);
              } else {
                // Both failed, hide image
                setImageError(true);
              }
            }}
          />
        )}

        {/* Source & Date */}
        <View style={styles.meta}>
          {story.source && (
            <View style={[styles.sourceBadge, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sourceText, { color: colors.textPrimary }]}>{story.source.name}</Text>
            </View>
          )}
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {new Date(story.published_at || story.created_at).toLocaleDateString(
              isArabic ? 'ar-SA' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
          {title}
        </Text>

        {/* AI Summary Section */}
        <LinearGradient
          colors={['rgba(168,85,247,0.15)', 'rgba(0,122,255,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryContainer}
        >
          <View style={[styles.summaryHeader, isArabic && styles.summaryHeaderRtl]}>
            <View style={styles.aiBadge}>
              <FontAwesome name="magic" size={12} color="#fff" />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              {isArabic ? 'ملخص' : 'Summary'}
            </Text>
          </View>
          <Text style={[styles.summaryText, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
            {summary}
          </Text>
        </LinearGradient>

        {/* Full Article Content */}
        {hasFullContent ? (
          <View style={styles.articleSection}>
            <View style={[styles.articleDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.articleLabel, { color: colors.textMuted }, isArabic && styles.arabicText]}>
              {isArabic ? 'المقال الكامل' : 'Full Article'}
            </Text>
            <Text style={[
              isArabic ? styles.articleContentArabic : styles.articleContent,
              { color: colors.textPrimary },
              isArabic && styles.arabicText
            ]}>
              {fullContent}
            </Text>
          </View>
        ) : isLoadingContent ? (
          <View style={styles.loadingContentSection}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingContentText, { color: colors.textMuted }, isArabic && styles.arabicText]}>
              {isArabic ? 'جاري تحميل المقال...' : 'Loading full article...'}
            </Text>
          </View>
        ) : (
          <View style={styles.noContentSection}>
            <Text style={[styles.noContentText, { color: colors.textMuted }, isArabic && styles.arabicText]}>
              {isArabic
                ? 'المقال الكامل غير متوفر. اضغط على الزر أدناه لقراءة المقال الأصلي.'
                : 'Full article not available. Tap below to read the original article.'}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={[styles.stats, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <FontAwesome name="eye" size={16} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textMuted }]}>{story.view_count}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="bookmark-o" size={16} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textMuted }]}>{story.save_count}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="share" size={16} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textMuted }]}>{story.share_count}</Text>
          </View>
        </View>

        {/* Source Attribution & Original Link */}
        <View style={styles.sourceAttribution}>
          <Text style={[styles.attributionText, { color: colors.textMuted }, isArabic && styles.arabicText]}>
            {isArabic
              ? `المصدر: ${story.source?.name || 'غير معروف'}`
              : `Source: ${story.source?.name || 'Unknown'}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.originalButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          onPress={handleOpenOriginal}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'قراءة المقال الأصلي' : 'Read original article'}
        >
          <Text style={[styles.originalButtonText, { color: colors.primary }]}>
            {isArabic ? 'قراءة المقال الأصلي' : 'Read Original Article'}
          </Text>
          <FontAwesome name="external-link" size={16} color={colors.primary} />
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
  scrollContent: {
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
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: fontFamily.arabicRegular,
    letterSpacing: 0,
  },
  // AI Summary Section
  summaryContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryHeaderRtl: {
    flexDirection: 'row-reverse',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A855F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  chevron: {
    marginLeft: 'auto',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 26,
  },
  whyItMattersSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(168,85,247,0.2)',
  },
  whyItMattersLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  whyItMattersText: {
    fontSize: 15,
    lineHeight: 24,
  },
  // Full Article Section
  articleSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  articleDivider: {
    height: 1,
    marginBottom: 16,
  },
  articleLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleContent: {
    fontSize: 18,
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  articleContentArabic: {
    fontSize: 18,
    lineHeight: 32,
    letterSpacing: 0,
    fontFamily: fontFamily.arabicRegular,
  },
  noContentSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
  },
  noContentText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  loadingContentSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingContentText: {
    fontSize: 14,
  },
  // Stats
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
  // Source Attribution
  sourceAttribution: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  attributionText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Original Article Button
  originalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
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
