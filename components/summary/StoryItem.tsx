// StoryItem - Individual story with staggered entrance animation
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
} from '@/constants/theme';
import { HapticFeedback } from '@/lib/haptics';

// Animation timing constants
const ANIMATION_TIMING = {
  TOPIC_STAGGER: 150,
  STORY_STAGGER: 100,
  FADE_IN: 300,
  TOPIC_APPEAR_DELAY: 200,
};

interface Story {
  id: string;
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  source: string;
}

interface StoryItemProps {
  story: Story;
  storyIndex: number;
  topicIndex: number;
  isLast: boolean;
  isArabic: boolean;
}

export function StoryItem({
  story,
  storyIndex,
  topicIndex,
  isLast,
  isArabic,
}: StoryItemProps) {
  const { colors, premiumColors } = useTheme();
  const translateX = useRef(new Animated.Value(isArabic ? 20 : -20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        translateX.setValue(0);
        opacity.setValue(1);
        return;
      }

      // Calculate delay: wait for topic to appear, then stagger stories
      const topicDelay = topicIndex * ANIMATION_TIMING.TOPIC_STAGGER;
      const storyDelay = storyIndex * ANIMATION_TIMING.STORY_STAGGER;
      const totalDelay = topicDelay + ANIMATION_TIMING.TOPIC_APPEAR_DELAY + storyDelay;

      Animated.sequence([
        Animated.delay(totalDelay),
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: ANIMATION_TIMING.FADE_IN,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, [storyIndex, topicIndex, isArabic]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    HapticFeedback.buttonPress();
    router.push(`/story/${story.id}`);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        !isLast && [styles.withBorder, { borderBottomColor: premiumColors.glassBorder }],
        {
          opacity,
          transform: [{ translateX }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={isArabic ? story.titleAr : story.title}
      >
        <Text
          style={[
            styles.title,
            { color: colors.textPrimary },
            isArabic && styles.arabicTitle,
          ]}
        >
          {isArabic ? story.titleAr : story.title}
        </Text>
        <Text
          style={[
            styles.summary,
            { color: colors.textSecondary },
            isArabic && styles.arabicSummary,
          ]}
        >
          {isArabic ? story.summaryAr : story.summary}
        </Text>
        <View style={[styles.sourceRow, isArabic && styles.sourceRowRtl]}>
          <View style={[styles.sourceDot, { backgroundColor: colors.textMuted }]} />
          <Text style={[styles.sourceText, { color: colors.textMuted }, isArabic && styles.arabicSource]}>
            {story.source}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },
  withBorder: {
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  summary: {
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  sourceRowRtl: {
    flexDirection: 'row-reverse',
  },
  sourceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sourceText: {
    fontSize: fontSize.xs,
    fontStyle: 'italic',
  },
  // Arabic text styles with Tajawal font and improved line height
  arabicTitle: {
    fontFamily: fontFamily.arabicBold,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 28, // Taller for Arabic diacritical marks
  },
  arabicSummary: {
    fontFamily: fontFamily.arabicRegular,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 28, // Taller for Arabic
  },
  arabicSource: {
    fontFamily: fontFamily.arabicRegular,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontStyle: 'normal', // Arabic doesn't have italic
  },
});
