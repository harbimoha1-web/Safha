// AnimatedHero - Epic hero with floating icon and gradient background
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { premiumColors, spacing, fontSize, fontWeight } from '@/constants';

interface AnimatedHeroProps {
  isArabic: boolean;
}

export function AnimatedHero({ isArabic }: AnimatedHeroProps) {
  const { colors, isDark } = useTheme();

  // Theme-aware gradient - dark uses premium gradient, light uses soft blue/purple tints
  const heroGradient: [string, string, string] = isDark
    ? premiumColors.heroGradient
    : ['#f0f4ff', '#e8f0ff', '#f5f0ff'];
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Start at 1 for instant display (no entrance animation)
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const textFadeAnim = useRef(new Animated.Value(1)).current;
  // Glow animation uses separate animated value for opacity (non-native driver)
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    let isMounted = true;

    // Check for reduce motion preference
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted) return;

      if (reduceMotion) {
        // Skip all animations
        return;
      }

      // Continuous float animation (keep this for polish)
      const float = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      float.start();

      // Glow pulse animation (separate from transform animations)
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      glow.start();

      return () => {
        float.stop();
        glow.stop();
      };
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={heroGradient}
        style={styles.gradientBackground}
      />

      {/* Glow wrapper (non-native driver for shadowOpacity) */}
      <Animated.View
        style={[
          styles.glowWrapper,
          { shadowOpacity: glowOpacity, shadowColor: colors.primary },
        ]}
      >
        {/* Floating Brand Name (native driver for transforms) */}
        <Animated.View
          style={[
            styles.brandContainer,
            {
              backgroundColor: isDark ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 122, 255, 0.15)',
              transform: [
                { translateY: floatAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <Text style={[styles.brandName, { color: colors.primary }]}>
            {isArabic ? 'صفحة+' : 'Safha+'}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Title & Subtitle */}
      <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
        <Text style={[styles.title, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
          {isArabic ? 'كل ما يهمك.' : 'Everything you care about.'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
          {isArabic
            ? 'مدعوم بالذكاء الاصطناعي.'
            : 'Powered by AI.'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
  },
  gradientBackground: {
    position: 'absolute',
    top: -100,
    left: -50,
    right: -50,
    bottom: -50,
    opacity: 0.5,
  },
  glowWrapper: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    elevation: 10,
  },
  brandContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  arabicText: {
    textAlign: 'center',
  },
});
