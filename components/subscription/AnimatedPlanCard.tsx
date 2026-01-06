// AnimatedPlanCard - Plan selection with bounce and glow effects
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { premiumColors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';
import { HapticFeedback } from '@/lib/haptics';

interface AnimatedPlanCardProps {
  plan: 'premium' | 'premium_annual';
  title: string;
  price: string;
  badge?: string;
  isSelected: boolean;
  onSelect: () => void;
  isArabic: boolean;
  isAnnual?: boolean;
}

export function AnimatedPlanCard({
  plan,
  title,
  price,
  badge,
  isSelected,
  onSelect,
  isArabic,
  isAnnual = false,
}: AnimatedPlanCardProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const radioScale = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      reduceMotionRef.current = reduceMotion;
    });
  }, []);

  useEffect(() => {
    if (reduceMotionRef.current) {
      radioScale.setValue(isSelected ? 1 : 0);
      glowOpacity.setValue(isSelected ? 0.6 : 0);
      return;
    }

    // Radio button animation
    Animated.spring(radioScale, {
      toValue: isSelected ? 1 : 0,
      friction: 4,
      useNativeDriver: true,
    }).start();

    // Glow animation
    if (isSelected) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.4,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();
      return () => glow.stop();
    } else {
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected]);

  // Badge pulse for annual plan
  useEffect(() => {
    if (!badge || reduceMotionRef.current) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [badge]);

  const handlePress = () => {
    HapticFeedback.buttonPress();

    if (reduceMotionRef.current) {
      onSelect();
      return;
    }

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSelect();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${title} ${price}`}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.surface },
          isSelected && { borderColor: colors.primary },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Glow overlay */}
        <Animated.View
          style={[
            styles.glowOverlay,
            isAnnual ? styles.glowGold : styles.glowBlue,
            { opacity: glowOpacity },
          ]}
        />

        {/* Gold border for annual */}
        {isAnnual && isSelected && (
          <LinearGradient
            colors={premiumColors.goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.goldBorder}
          />
        )}

        {/* Badge */}
        {badge && (
          <Animated.View
            style={[
              styles.badge,
              { backgroundColor: colors.success },
              { transform: [{ scale: badgeScale }] },
              isArabic ? styles.badgeRtl : styles.badgeLtr,
            ]}
          >
            <Text style={styles.badgeText}>{badge}</Text>
          </Animated.View>
        )}

        {/* Content */}
        <View style={[styles.content, isArabic && styles.contentRtl]}>
          {/* Radio button */}
          <View style={[styles.radio, { borderColor: colors.border }, isSelected && { borderColor: colors.primary }, isArabic && styles.radioRtl]}>
            <Animated.View
              style={[
                styles.radioInner,
                { backgroundColor: colors.primary },
                { transform: [{ scale: radioScale }] },
              ]}
            />
          </View>

          {/* Plan info */}
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
              {title}
            </Text>
            <Text style={[styles.price, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
              {price}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.lg - 2,
  },
  glowBlue: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  glowGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  goldBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: borderRadius.lg,
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  badgeLtr: {
    right: 8,
  },
  badgeRtl: {
    left: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  contentRtl: {
    flexDirection: 'row-reverse',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioRtl: {
    marginRight: 0,
    marginLeft: spacing.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  price: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  arabicText: {
    textAlign: 'right',
  },
});
