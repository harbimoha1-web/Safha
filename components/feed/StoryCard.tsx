import React, { useCallback, useState, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
  TouchableOpacity,
  Share,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Story, Language } from '@/types';
import { HapticFeedback } from '@/lib/haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { ActionSheet, ActionSheetOption } from '@/components/ActionSheet';
import { TopicFallback } from './TopicFallback';
import { VideoPlayer } from './VideoPlayer';
import { getOptimizedImageUrl, getBlurredImageUrl } from '@/lib/image';
import { createLogger } from '@/lib/debug';

const log = createLogger('StoryCard');

const { width, height } = Dimensions.get('window');

interface StoryCardProps {
  story: Story;
  isActive: boolean;
  language: Language;
  isSaved?: boolean;
  onSave?: (storyId: string) => void;
  onShare?: (storyId: string) => void;
  onHideSource?: (sourceId: string, sourceName: string) => void;
}

// Memoized to prevent re-renders when only isActive changes but story data is the same
export const StoryCard = memo(function StoryCard({ story, isActive, language, isSaved, onSave, onShare, onHideSource }: StoryCardProps) {
  const { colors } = useTheme();
  const isArabic = language === 'ar';
  const title = (isArabic ? story.title_ar : story.title_en) || story.original_title;
  // Always use Arabic summary (Arabic-only summarization)
  const summary = story.summary_ar;

  // Get first ~150 chars of original content for preview
  const fullContent = story.full_content?.slice(0, 150)?.trim() || null;

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // PERF: Single state for image loading to prevent cascading re-renders
  // States: loading -> optimized -> original -> logo -> fallback
  type ImageState = 'loading' | 'optimized' | 'original' | 'logo' | 'fallback';
  const [imageState, setImageState] = useState<ImageState>('loading');

  // PERF: Reset image state when story changes (component reuse in PagerView)
  useEffect(() => {
    setImageState('loading');
  }, [story.id]);

  // PERF: Memoize URL calculations to avoid recalculating on every render
  const sourceLogoUrl = story.source?.logo_url;
  const { optimizedImageUrl, blurredImageUrl, optimizedLogoUrl } = useMemo(() => ({
    optimizedImageUrl: getOptimizedImageUrl(story.image_url, undefined, undefined, 'contain'),
    blurredImageUrl: getBlurredImageUrl(story.image_url),
    optimizedLogoUrl: sourceLogoUrl ? getOptimizedImageUrl(sourceLogoUrl, undefined, undefined, 'contain') : null,
  }), [story.image_url, sourceLogoUrl]);

  // Determine which image URL to display based on state
  const displayImageUrl = useMemo(() => {
    switch (imageState) {
      case 'loading':
      case 'optimized':
        return optimizedImageUrl;
      case 'original':
        return story.image_url;
      case 'logo':
        return optimizedLogoUrl;
      default:
        return null;
    }
  }, [imageState, optimizedImageUrl, story.image_url, optimizedLogoUrl]);

  // PERF: Only show blurred background while loading (not continuously)
  const displayBlurredUrl = imageState === 'loading' ? blurredImageUrl : null;

  // Has valid image only if we have a URL to try AND haven't exhausted all options
  const hasValidImage = displayImageUrl && imageState !== 'fallback';
  const imageLoaded = imageState !== 'loading';

  // Check for video content (only MP4 supported)
  const hasVideo = !!story.video_url && story.video_type === 'mp4';

  // Get topic slug for fallback styling
  const topicSlug = story.topics?.[0]?.slug;

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageState('optimized');
  }, []);

  // Handle image load error - fallback chain: optimized → original → source logo → TopicFallback
  // PERF: Single state transition per error instead of multiple setState calls
  const handleImageError = useCallback(() => {
    setImageState(prev => {
      if (prev === 'loading' || prev === 'optimized') {
        // Step 1: Try original URL if optimized URL failed
        if (story.image_url) {
          log.debug('[StoryCard] Optimized image failed, trying original');
          return 'original';
        }
      }
      if (prev === 'original') {
        // Step 2: Try source logo if original URL failed
        if (sourceLogoUrl) {
          log.debug('[StoryCard] Original image failed, trying source logo');
          return 'logo';
        }
      }
      // Step 3: All options exhausted, show TopicFallback
      log.debug('[StoryCard] All image options failed, showing TopicFallback');
      return 'fallback';
    });
  }, [story.image_url, sourceLogoUrl]);

  const handleSave = useCallback(() => {
    HapticFeedback.saveStory();
    onSave?.(story.id);
  }, [story.id, onSave]);

  const handleShare = useCallback(async () => {
    HapticFeedback.shareStory();
    try {
      // PERF: Calculate inside callback to avoid stale closure with memo()
      const shareTitle = (isArabic ? story.title_ar : story.title_en) || story.original_title;
      // Always use Arabic summary (Arabic-only summarization)
      const shareSummary = story.summary_ar;

      const result = await Share.share({
        message: `${shareTitle}\n\n${shareSummary}\n\nRead more on Safha`,
        url: story.original_url,
      });
      // Track share if user completed the share action
      if (result.action === Share.sharedAction) {
        onShare?.(story.id);
      }
    } catch (error) {
      log.error('Share error:', error);
    }
  }, [story, isArabic, onShare]);

  const handleReadMore = useCallback(() => {
    HapticFeedback.buttonPress();
    router.push(`/story/${story.id}`);
  }, [story.id]);

  const handleOpenMenu = useCallback(() => {
    HapticFeedback.buttonPress();
    setShowActionSheet(true);
  }, []);

  const handleHideSource = useCallback(() => {
    if (story.source_id && story.source) {
      onHideSource?.(story.source_id, story.source.name);
    }
  }, [story.source_id, story.source, onHideSource]);

  const sourceName = story.source?.name || (isArabic ? 'هذا المصدر' : 'this source');
  const actionSheetOptions: ActionSheetOption[] = [
    {
      label: `Hide posts from ${sourceName}`,
      labelAr: `إخفاء منشورات ${sourceName}`,
      icon: 'eye-slash',
      onPress: handleHideSource,
    },
  ];

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container}>
      {/* Background: Video, optimized image, or topic fallback */}
      {hasVideo ? (
        /* Video player for stories with MP4 videos */
        <View style={styles.videoContainer}>
          <VideoPlayer
            uri={story.video_url!}
            poster={displayImageUrl || undefined}
            isActive={isActive}
          />
          {/* Content overlay on video */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
            locations={[0, 0.5, 1]}
            style={styles.videoGradient}
            pointerEvents="box-none"
          >
            <View style={styles.content}>
              {story.source && (
                <View style={[styles.sourceBadge, isArabic && styles.sourceBadgeRtl]}>
                  <Text style={styles.sourceText}>{story.source.name}</Text>
                </View>
              )}
              <Text
                style={[styles.title, isArabic && styles.arabicText]}
                numberOfLines={3}
              >
                {title}
              </Text>
              {/* AI Summary - Clickable */}
              {summary && (
                <TouchableOpacity
                  onPress={() => setShowSummaryModal(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={isArabic ? 'عرض الملخص الكامل' : 'View full summary'}
                >
                  <LinearGradient
                    colors={['rgba(20,10,30,0.85)', 'rgba(30,15,45,0.80)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.aiSummaryContainer}
                  >
                    <View style={[styles.aiSummaryHeader, isArabic && styles.rtlRow]}>
                      <View style={styles.aiBadge}>
                        <FontAwesome name="magic" size={10} color="#fff" />
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                      <Text style={[styles.aiSummaryLabel, isArabic && styles.arabicText]}>
                        {isArabic ? 'ملخص' : 'Summary'}
                      </Text>
                    </View>
                    <Text
                      style={[styles.aiSummaryText, isArabic && styles.arabicText]}
                      numberOfLines={2}
                    >
                      {summary}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Original Content Preview */}
              {fullContent && (
                <Text
                  style={[styles.contentPreview, isArabic && styles.arabicText]}
                  numberOfLines={2}
                >
                  {fullContent}...
                </Text>
              )}

              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={handleReadMore}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'اقرأ المزيد' : 'Read more'}
              >
                <Text style={styles.readMoreText}>
                  {isArabic ? 'اقرأ المزيد' : 'Read More'}
                </Text>
                <FontAwesome
                  name={isArabic ? 'arrow-left' : 'arrow-right'}
                  size={14}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            {/* Side Actions */}
            <View style={styles.sideActions} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSave}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? (isArabic ? 'إزالة الإشارة المرجعية' : 'Remove bookmark') : (isArabic ? 'حفظ الخبر' : 'Save story')}
              >
                <FontAwesome name={isSaved ? "bookmark" : "bookmark-o"} size={28} color="#fff" />
                <Text style={styles.actionCount}>{formatCount(story.save_count)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'مشاركة الخبر' : 'Share story'}
              >
                <FontAwesome name="share" size={28} color="#fff" />
                <Text style={styles.actionCount}>{formatCount(story.share_count)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenMenu}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'المزيد من الخيارات' : 'More options'}
              >
                <FontAwesome name="ellipsis-v" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      ) : hasValidImage ? (
        <View style={styles.imageContainer}>
          {/* Loading placeholder - shows until image loads */}
          {!imageLoaded && (
            <View style={styles.loadingPlaceholder}>
              <LinearGradient
                colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
                style={StyleSheet.absoluteFill}
              />
              <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
            </View>
          )}

          {/* Layer 1: Blurred background image (fills entire screen) */}
          {displayBlurredUrl && (
            <Image
              source={{ uri: displayBlurredUrl }}
              style={styles.blurredBackground}
              resizeMode="cover"
            />
          )}

          {/* Layer 2: Dark overlay on blurred background */}
          <View style={styles.blurOverlay} />

          {/* Layer 3: Sharp foreground image (contain mode - shows full image) */}
          <Image
            source={{ uri: displayImageUrl || undefined }}
            style={[styles.sharpForeground, !imageLoaded && styles.imageHidden]}
            resizeMode="contain"
            accessible={true}
            accessibilityLabel={title || undefined}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Layer 4: Gradient overlay for text readability */}
          <LinearGradient
            colors={colors.cardGradient}
            locations={[0, 0.5, 1]}
            style={styles.gradient}
            pointerEvents="box-none"
          >
          {/* Content */}
          <View style={styles.content}>
            {/* Source Badge */}
            {story.source && (
              <View style={[styles.sourceBadge, isArabic && styles.sourceBadgeRtl]}>
                <Text style={styles.sourceText}>{story.source.name}</Text>
              </View>
            )}

            {/* Title */}
            <Text
              style={[styles.title, isArabic && styles.arabicText]}
              numberOfLines={3}
            >
              {title}
            </Text>

            {/* AI Summary - Clickable */}
            {summary && (
              <TouchableOpacity
                onPress={() => setShowSummaryModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'عرض الملخص الكامل' : 'View full summary'}
              >
                <LinearGradient
                  colors={['rgba(20,10,30,0.85)', 'rgba(30,15,45,0.80)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiSummaryContainer}
                >
                  <View style={[styles.aiSummaryHeader, isArabic && styles.rtlRow]}>
                    <View style={styles.aiBadge}>
                      <FontAwesome name="magic" size={10} color="#fff" />
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                    <Text style={[styles.aiSummaryLabel, isArabic && styles.arabicText]}>
                      {isArabic ? 'ملخص' : 'Summary'}
                    </Text>
                  </View>
                  <Text
                    style={[styles.aiSummaryText, isArabic && styles.arabicText]}
                    numberOfLines={2}
                  >
                    {summary}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Original Content Preview */}
            {fullContent && (
              <Text
                style={[styles.contentPreview, isArabic && styles.arabicText]}
                numberOfLines={2}
              >
                {fullContent}...
              </Text>
            )}

            {/* Read More Button */}
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={handleReadMore}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'اقرأ المزيد' : 'Read more'}
            >
              <Text style={styles.readMoreText}>
                {isArabic ? 'اقرأ المزيد' : 'Read More'}
              </Text>
              <FontAwesome
                name={isArabic ? 'arrow-left' : 'arrow-right'}
                size={14}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* Side Actions */}
          <View style={styles.sideActions} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSave}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? (isArabic ? 'إزالة الإشارة المرجعية' : 'Remove bookmark') : (isArabic ? 'حفظ الخبر' : 'Save story')}
            >
              <FontAwesome name={isSaved ? "bookmark" : "bookmark-o"} size={28} color="#fff" />
              <Text style={styles.actionCount}>
                {formatCount(story.save_count)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'مشاركة الخبر' : 'Share story'}
            >
              <FontAwesome name="share" size={28} color="#fff" />
              <Text style={styles.actionCount}>
                {formatCount(story.share_count)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenMenu}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'المزيد من الخيارات' : 'More options'}
            >
              <FontAwesome name="ellipsis-v" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        </View>
      ) : (
        /* Fallback when no image available */
        <View style={styles.fallbackContainer}>
          <TopicFallback topicSlug={topicSlug} sourceName={story.source?.name} />
          {/* Content overlay on fallback */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.4, 1]}
            style={styles.fallbackGradient}
            pointerEvents="box-none"
          >
            {/* Content */}
            <View style={styles.content}>
              {/* Title */}
              <Text
                style={[styles.title, isArabic && styles.arabicText]}
                numberOfLines={3}
              >
                {title}
              </Text>

              {/* AI Summary - Clickable */}
              {summary && (
                <TouchableOpacity
                  onPress={() => setShowSummaryModal(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={isArabic ? 'عرض الملخص الكامل' : 'View full summary'}
                >
                  <LinearGradient
                    colors={['rgba(20,10,30,0.85)', 'rgba(30,15,45,0.80)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.aiSummaryContainer}
                  >
                    <View style={[styles.aiSummaryHeader, isArabic && styles.rtlRow]}>
                      <View style={styles.aiBadge}>
                        <FontAwesome name="magic" size={10} color="#fff" />
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                      <Text style={[styles.aiSummaryLabel, isArabic && styles.arabicText]}>
                        {isArabic ? 'ملخص' : 'Summary'}
                      </Text>
                    </View>
                    <Text
                      style={[styles.aiSummaryText, isArabic && styles.arabicText]}
                      numberOfLines={2}
                    >
                      {summary}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Original Content Preview */}
              {fullContent && (
                <Text
                  style={[styles.contentPreview, isArabic && styles.arabicText]}
                  numberOfLines={2}
                >
                  {fullContent}...
                </Text>
              )}

              {/* Read More Button */}
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={handleReadMore}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'اقرأ المزيد' : 'Read more'}
              >
                <Text style={styles.readMoreText}>
                  {isArabic ? 'اقرأ المزيد' : 'Read More'}
                </Text>
                <FontAwesome
                  name={isArabic ? 'arrow-left' : 'arrow-right'}
                  size={14}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            {/* Side Actions */}
            <View style={styles.sideActions} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSave}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? (isArabic ? 'إزالة الإشارة المرجعية' : 'Remove bookmark') : (isArabic ? 'حفظ الخبر' : 'Save story')}
              >
                <FontAwesome name={isSaved ? "bookmark" : "bookmark-o"} size={28} color="#fff" />
                <Text style={styles.actionCount}>
                  {formatCount(story.save_count)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'مشاركة الخبر' : 'Share story'}
              >
                <FontAwesome name="share" size={28} color="#fff" />
                <Text style={styles.actionCount}>
                  {formatCount(story.share_count)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenMenu}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={isArabic ? 'المزيد من الخيارات' : 'More options'}
              >
                <FontAwesome name="ellipsis-v" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Summary Modal */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSummaryModal(false)}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'إغلاق النافذة' : 'Close modal'}
        >
          <View style={styles.summaryModalContainer}>
            <LinearGradient
              colors={['rgba(20,10,30,0.95)', 'rgba(30,15,45,0.92)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryModalContent}
            >
              <View style={[styles.summaryModalHeader, isArabic && styles.rtlRow]}>
                <View style={styles.aiBadge}>
                  <FontAwesome name="magic" size={12} color="#fff" />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
                <Text style={[styles.summaryModalLabel, isArabic && styles.arabicText]}>
                  {isArabic ? 'ملخص' : 'Summary'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSummaryModal(false)}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
                >
                  <FontAwesome name="times" size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.summaryModalText, isArabic && styles.arabicText]}>
                {summary}
              </Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Action Sheet */}
      <ActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Story Options"
        titleAr="خيارات الخبر"
        options={actionSheetOptions}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blurredBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sharpForeground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    opacity: 0,
  },
  loadingPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  fallbackContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fallbackGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 20,
    paddingRight: 80,
  },
  sourceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  sourceBadgeRtl: {
    alignSelf: 'flex-end',
  },
  sourceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 36,
  },
  summary: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  aiSummaryContainer: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.5)',
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aiSummaryLabel: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiSummaryText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    lineHeight: 20,
  },
  contentPreview: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A855F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sideActions: {
    position: 'absolute',
    right: 16,
    bottom: 150,
    alignItems: 'center',
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryModalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  summaryModalContent: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.5)',
  },
  summaryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  summaryModalLabel: {
    color: '#E9D5FF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  summaryModalText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    lineHeight: 26,
  },
});
