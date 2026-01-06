// TopicSectionCard - Glassmorphism topic container with staggered entrance
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import {
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  borderRadius,
} from '@/constants/theme';
import { getTopicIcon, getTopicColor } from '@/constants/topicIcons';
import { StoryItem } from './StoryItem';

// Animation timing constants
const ANIMATION_TIMING = {
  TOPIC_STAGGER: 150,
  FADE_IN: 300,
};

interface Story {
  id: string;
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  source: string;
}

interface TopicSection {
  topic: string;
  topicAr: string;
  stories: Story[];
}

interface TopicSectionCardProps {
  section: TopicSection;
  index: number;
  isArabic: boolean;
}

// Helper to darken a color
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export function TopicSectionCard({
  section,
  index,
  isArabic,
}: TopicSectionCardProps) {
  const { colors, premiumColors } = useTheme();
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const topicColor = getTopicColor(section.topic);
  const topicIcon = getTopicIcon(section.topic);
  const topicGradient: [string, string] = [topicColor, darkenColor(topicColor, 20)];

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        translateY.setValue(0);
        opacity.setValue(1);
        return;
      }

      // Staggered entrance based on index
      Animated.sequence([
        Animated.delay(index * ANIMATION_TIMING.TOPIC_STAGGER),
        Animated.parallel([
          Animated.spring(translateY, {
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
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {/* Glassmorphism card */}
      <View style={[styles.glassContainer, { backgroundColor: premiumColors.glassBackground, borderColor: premiumColors.glassBorder }]}>
        {/* Gradient accent border */}
        <LinearGradient
          colors={topicGradient}
          style={[
            styles.gradientBorder,
            isArabic && styles.gradientBorderRtl,
          ]}
        />

        {/* Topic badge */}
        <View style={[styles.topicHeader, isArabic && styles.topicHeaderRtl]}>
          <LinearGradient
            colors={topicGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.topicBadge, isArabic && styles.topicBadgeRtl]}
          >
            <View style={styles.iconContainer}>
              <FontAwesome
                name={topicIcon}
                size={14}
                color={colors.white}
              />
            </View>
            <Text style={[styles.topicText, isArabic && styles.topicTextRtl]}>
              {isArabic ? section.topicAr : section.topic}
            </Text>
          </LinearGradient>
        </View>

        {/* Stories */}
        <View style={styles.storiesContainer}>
          {section.stories.map((story, storyIndex) => (
            <StoryItem
              key={story.id}
              story={story}
              storyIndex={storyIndex}
              topicIndex={index}
              isLast={storyIndex === section.stories.length - 1}
              isArabic={isArabic}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
    marginHorizontal: spacing.lg,
  },
  glassContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  gradientBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  gradientBorderRtl: {
    left: undefined,
    right: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  topicHeader: {
    marginBottom: spacing.md,
  },
  topicHeaderRtl: {
    alignItems: 'flex-end',
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  topicBadgeRtl: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-end',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  topicTextRtl: {
    fontFamily: fontFamily.arabicBold,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: 0, // Remove letter spacing for Arabic
    textTransform: 'none', // Don't uppercase Arabic
  },
  storiesContainer: {
    marginTop: spacing.sm,
  },
});
