// SourcesFooter - Polished attribution section with glassmorphism
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import {
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  borderRadius,
} from '@/constants/theme';

// Animation timing
const ANIMATION_TIMING = {
  FADE_IN: 400,
  DELAY: 600, // Wait for topics to animate in first
};

interface SourceAttribution {
  name: string;
  storyCount: number;
}

interface SourcesFooterProps {
  sources: SourceAttribution[];
  isArabic: boolean;
}

export function SourcesFooter({ sources, isArabic }: SourcesFooterProps) {
  const { colors, premiumColors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        opacity.setValue(1);
        translateY.setValue(0);
        return;
      }

      Animated.sequence([
        Animated.delay(ANIMATION_TIMING.DELAY),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: ANIMATION_TIMING.FADE_IN,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: premiumColors.glassBackground,
          borderColor: premiumColors.glassBorder,
          shadowColor: premiumColors.purpleGlow,
        },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, isArabic && styles.headerRtl]}>
        <FontAwesome name="link" size={14} color={colors.textSecondary} />
        <Text style={[styles.title, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
          {isArabic ? 'المصادر' : 'Sources'}
        </Text>
      </View>

      {/* Source chips */}
      <View style={[styles.chipContainer, isArabic && styles.chipContainerRtl]}>
        {sources.map((source, index) => (
          <View key={index} style={[styles.chip, { borderColor: premiumColors.glassBorder }]}>
            <Text style={[styles.chipText, { color: colors.textMuted }]}>
              {source.name} ({source.storyCount})
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerRtl: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipContainerRtl: {
    flexDirection: 'row-reverse',
  },
  chip: {
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: fontSize.xs,
  },
  // Arabic text styles with Tajawal font
  arabicText: {
    fontFamily: fontFamily.arabicMedium,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: 0, // No letter spacing for Arabic
    textTransform: 'none', // Don't uppercase Arabic
  },
});
