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
  const isArabic = language === 'ar';
  const title = isArabic ? story.title_ar : story.title_en;
  const summary = isArabic ? story.summary_ar : story.summary_en;

  const handleSave = useCallback(() => {
    onSave?.(story.id);
  }, [story.id, onSave]);

  const handleShare = useCallback(async () => {
    try {
      const result = await Share.share({
        message: `${title}\n\n${summary}\n\nRead more on Teller`,
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
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
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

            <View style={styles.actionButton}>
              <FontAwesome name="eye" size={28} color="#fff" />
              <Text style={styles.actionCount}>
                {formatCount(story.view_count)}
              </Text>
            </View>
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
    marginBottom: 20,
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
