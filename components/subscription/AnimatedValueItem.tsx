// AnimatedValueItem - Value stack item with staggered slide-in animation
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
import { premiumColors, spacing, fontSize, fontWeight } from '@/constants';
import type { IconName } from '@/types';

interface AnimatedValueItemProps {
  icon: IconName;
  text: string;
  value: string;
  index: number;
  isArabic: boolean;
  startAnimation?: boolean;
}

export function AnimatedValueItem({
  icon,
  text,
  value,
  index,
  isArabic,
  startAnimation = true,
}: AnimatedValueItemProps) {
  const { colors, isDark } = useTheme();
  const translateX = useRef(new Animated.Value(isArabic ? 50 : -50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!startAnimation) return;

    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted) return;

      if (reduceMotion) {
        translateX.setValue(0);
        opacity.setValue(1);
        return;
      }

      // Staggered entrance animation
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Icon pulse after entrance
        Animated.loop(
          Animated.sequence([
            Animated.timing(iconScale, {
              toValue: 1.15,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(iconScale, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ).start();
      });
    });

    return () => {
      isMounted = false;
    };
  }, [startAnimation, index, isArabic]);

  return (
    <Animated.View
      style={[
        styles.container,
        isArabic && styles.containerRtl,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      <View style={[styles.leftSection, isArabic && styles.leftSectionRtl]}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.12)',
              shadowColor: colors.primary,
            },
            { transform: [{ scale: iconScale }] },
          ]}
        >
          <FontAwesome name={icon} size={18} color={colors.primary} />
        </Animated.View>
        <Text style={[styles.text, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
          {text}
        </Text>
      </View>
      <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: premiumColors.glassBorder,
  },
  containerRtl: {
    flexDirection: 'row-reverse',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  leftSectionRtl: {
    flexDirection: 'row-reverse',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  arabicText: {
    textAlign: 'right',
  },
  value: {
    fontSize: fontSize.sm,
    textDecorationLine: 'line-through',
  },
});
