import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Story, Language } from '@/types';
import { HapticFeedback } from '@/lib/haptics';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface StoryCardProps {
  story: Story;
  isActive: boolean;
  language: Language;
  isSaved?: boolean;
  onSave?: (storyId: string) => void;
  onShare?: (storyId: string) => void;
}

export function StoryCard({ story, isActive, language, isSaved, onSave, onShare }: StoryCardProps) {
  const { colors } = useTheme();
  const isArabic = language === 'ar';
  const title = isArabic ? story.title_ar : story.title_en;
  const summary = isArabic ? story.summary_ar : story.summary_en;
  const whyItMatters = isArabic ? story.why_it_matters_ar : story.why_it_matters_en;

  const handleSave = useCallback(() => {
    HapticFeedback.saveStory();
    onSave?.(story.id);
  }, [story.id, onSave]);

  const handleShare = useCallback(async () => {
    HapticFeedback.shareStory();
    try {
      const result = await Share.share({
        message: `${title}\n\n${summary}\n\nRead more on Safha`,
        url: story.original_url,
      });
      // Track share if user completed the share action
      if (result.action === Share.sharedAction) {
        onShare?.(story.id);
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [title, summary, story.original_url, story.id, onShare]);

  const handleReadMore = useCallback(() => {
    HapticFeedback.buttonPress();
    router.push(`/story/${story.id}`);
  }, [story.id]);

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
      <ImageBackground
        source={{ uri: story.image_url || 'https://via.placeholder.com/800x1200' }}
        style={styles.backgroundImage}
        resizeMode="cover"
        accessible={true}
        accessibilityLabel={title || undefined}
      >
        {/* Gradient Overlay */}
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
              <View style={styles.sourceBadge}>
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

            {/* Summary */}
            <Text
              style={[styles.summary, isArabic && styles.arabicText]}
              numberOfLines={4}
            >
              {summary}
            </Text>

            {/* Why It Matters Section - AI Enhanced Design */}
            {whyItMatters && (
              <LinearGradient
                colors={['rgba(168,85,247,0.25)', 'rgba(0,122,255,0.18)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.whyItMattersContainer}
              >
                <View
                  accessible={true}
                  accessibilityLabel={isArabic ? `لماذا يهمك: ${whyItMatters}` : `Why it matters: ${whyItMatters}`}
                >
                  <View style={[styles.whyItMattersHeader, isArabic && styles.whyItMattersHeaderRtl]}>
                    <View style={styles.aiBadge}>
                      <FontAwesome name="magic" size={10} color="#fff" />
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                    <Text style={[styles.whyItMattersLabel, isArabic && styles.arabicText]}>
                      {isArabic ? 'لماذا يهمك؟' : 'Why it matters'}
                    </Text>
                  </View>
                  <Text
                    style={[styles.whyItMattersText, isArabic && styles.arabicText]}
                    numberOfLines={2}
                  >
                    {whyItMatters}
                  </Text>
                </View>
              </LinearGradient>
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
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  whyItMattersContainer: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.35)',
  },
  whyItMattersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  whyItMattersHeaderRtl: {
    flexDirection: 'row-reverse',
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
  whyItMattersLabel: {
    color: '#E9D5FF', // Light purple for better contrast with gradient
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  whyItMattersText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    lineHeight: 20,
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
});
