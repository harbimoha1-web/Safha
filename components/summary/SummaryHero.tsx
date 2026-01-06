// SummaryHero - Premium header with floating animation and glow
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
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

// Animation timing constants
const ANIMATION_TIMING = {
  FADE_IN: 400,
  FLOAT_DURATION: 2000,
  GLOW_DURATION: 1500,
  SPARKLE_DURATION: 3000,
};

interface SummaryHeroProps {
  date: string;
  totalStories: number;
  isArabic: boolean;
}

export function SummaryHero({
  date,
  totalStories,
  isArabic,
}: SummaryHeroProps) {
  const { colors, premiumColors } = useTheme();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const sparkleRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        fadeIn.setValue(1);
        return;
      }

      // Entrance fade
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: ANIMATION_TIMING.FADE_IN,
        useNativeDriver: true,
      }).start();

      // Continuous floating
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -8,
            duration: ANIMATION_TIMING.FLOAT_DURATION,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: ANIMATION_TIMING.FLOAT_DURATION,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow pulse via subtle scale (native driver compatible)
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.02,
            duration: ANIMATION_TIMING.GLOW_DURATION,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 1,
            duration: ANIMATION_TIMING.GLOW_DURATION,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Sparkle rotation
      Animated.loop(
        Animated.timing(sparkleRotation, {
          toValue: 1,
          duration: ANIMATION_TIMING.SPARKLE_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  }, []);

  const sparkleRotate = sparkleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatDate = (isoString: string) => {
    const dateObj = new Date(isoString);
    return dateObj.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      {/* Floating brand badge with glow */}
      <Animated.View
        style={[
          styles.brandBadge,
          {
            backgroundColor: premiumColors.glassBackground,
            borderColor: premiumColors.glassBorder,
            shadowColor: colors.primary,
            transform: [
              { translateY: floatAnim },
              { scale: glowScale },
            ],
          },
        ]}
      >
        <FontAwesome name="magic" size={18} color={colors.primary} />
        <Text style={[styles.brandText, { color: colors.textPrimary }, isArabic && styles.arabicBrandText]}>
          {isArabic ? 'الملخص الذكي' : 'AI Digest'}
        </Text>
      </Animated.View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }, isArabic && styles.arabicTitle]}>
        {isArabic ? 'ملخصك اليومي' : 'Your Daily Digest'}
      </Text>

      {/* Date with sparkle */}
      <View style={[styles.dateContainer, isArabic && styles.dateContainerRtl]}>
        <Animated.View style={{ transform: [{ rotate: sparkleRotate }] }}>
          <FontAwesome name="star" size={12} color={colors.premium} />
        </Animated.View>
        <Text style={[styles.dateText, { color: colors.textSecondary }, isArabic && styles.arabicDateText]}>
          {formatDate(date)}
        </Text>
      </View>

      {/* Read time badge */}
      <View style={[styles.readTimeBadge, { backgroundColor: premiumColors.glassBackground }]}>
        <FontAwesome name="clock-o" size={12} color={colors.textMuted} />
        <Text style={[styles.readTimeText, { color: colors.textMuted }, isArabic && styles.arabicReadTime]}>
          {isArabic
            ? `${totalStories} أخبار • 3 دقائق قراءة`
            : `${totalStories} stories • 3 min read`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  brandText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dateContainerRtl: {
    flexDirection: 'row-reverse',
  },
  dateText: {
    fontSize: fontSize.md,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  readTimeText: {
    fontSize: fontSize.sm,
  },
  // Arabic text styles with Tajawal font
  arabicBrandText: {
    fontFamily: fontFamily.arabicMedium,
    writingDirection: 'rtl',
  },
  arabicTitle: {
    fontFamily: fontFamily.arabicBold,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  arabicDateText: {
    fontFamily: fontFamily.arabicRegular,
    writingDirection: 'rtl',
  },
  arabicReadTime: {
    fontFamily: fontFamily.arabicRegular,
    writingDirection: 'rtl',
  },
});
