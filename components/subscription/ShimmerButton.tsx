// ShimmerButton - Irresistible CTA with shimmer effect
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  AccessibilityInfo,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, premiumColors, spacing, borderRadius, fontSize, fontWeight } from '@/constants';
import { HapticFeedback } from '@/lib/haptics';

interface ShimmerButtonProps {
  text: string;
  subtext?: string;
  onPress: () => void;
  isLoading?: boolean;
  isArabic?: boolean;
}

export function ShimmerButton({
  text,
  subtext,
  onPress,
  isLoading = false,
  isArabic = false,
}: ShimmerButtonProps) {
  const shimmerPosition = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [buttonWidth, setButtonWidth] = useState(300);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      reduceMotionRef.current = reduceMotion;

      if (reduceMotion) return;

      // Continuous shimmer animation
      const shimmer = Animated.loop(
        Animated.timing(shimmerPosition, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      shimmer.start();

      return () => shimmer.stop();
    });
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    setButtonWidth(event.nativeEvent.layout.width);
  };

  const handlePressIn = () => {
    if (isLoading || reduceMotionRef.current) return;

    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (isLoading || reduceMotionRef.current) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (isLoading) return;
    HapticFeedback.buttonPress();
    onPress();
  };

  const shimmerTranslate = shimmerPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-buttonWidth, buttonWidth * 2],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: isLoading }}
    >
      <Animated.View
        style={[
          styles.container,
          isLoading && styles.containerDisabled,
          { transform: [{ scale: scaleAnim }] },
        ]}
        onLayout={handleLayout}
      >
        {/* Gradient background */}
        <LinearGradient
          colors={premiumColors.ctaGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />

        {/* Shimmer overlay */}
        {!isLoading && !reduceMotionRef.current && (
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          >
            <LinearGradient
              colors={[
                'transparent',
                premiumColors.shimmerHighlight,
                'transparent',
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Text style={[styles.text, isArabic && styles.arabicText]}>
                {text}
              </Text>
              {subtext && (
                <Text style={[styles.subtext, isArabic && styles.arabicText]}>
                  {subtext}
                </Text>
              )}
            </>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  containerDisabled: {
    opacity: 0.7,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
  content: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    zIndex: 2,
  },
  text: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  arabicText: {
    textAlign: 'center',
  },
});
