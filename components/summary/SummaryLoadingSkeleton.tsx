// SummaryLoadingSkeleton - Premium skeleton loader with shimmer effect
import { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import {
  spacing,
  borderRadius,
} from '@/constants/theme';

// Animation timing
const SHIMMER_DURATION = 1500;

export function SummaryLoadingSkeleton() {
  const { premiumColors } = useTheme();
  const shimmerPosition = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(300);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      reduceMotionRef.current = reduceMotion;
      if (reduceMotion) return;

      // Continuous shimmer animation
      const shimmer = Animated.loop(
        Animated.timing(shimmerPosition, {
          toValue: 1,
          duration: SHIMMER_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      shimmer.start();

      return () => shimmer.stop();
    });
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const shimmerTranslate = shimmerPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-containerWidth, containerWidth * 2],
  });

  const renderShimmerOverlay = () => {
    if (reduceMotionRef.current) return null;

    return (
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
    );
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Hero skeleton */}
      <View style={styles.heroSection}>
        {/* Brand badge skeleton */}
        <View style={[styles.badgeSkeleton, { backgroundColor: premiumColors.glassBackground }]}>
          {renderShimmerOverlay()}
        </View>

        {/* Title skeleton */}
        <View style={[styles.titleSkeleton, { backgroundColor: premiumColors.glassBackground }]}>
          {renderShimmerOverlay()}
        </View>

        {/* Date skeleton */}
        <View style={[styles.dateSkeleton, { backgroundColor: premiumColors.glassBackground }]}>
          {renderShimmerOverlay()}
        </View>

        {/* Read time skeleton */}
        <View style={[styles.readTimeSkeleton, { backgroundColor: premiumColors.glassBackground }]}>
          {renderShimmerOverlay()}
        </View>
      </View>

      {/* Topic cards skeleton */}
      {[0, 1, 2].map((index) => (
        <View key={index} style={[styles.cardSkeleton, { backgroundColor: premiumColors.glassBackground, borderColor: premiumColors.glassBorder }]}>
          {/* Topic badge skeleton */}
          <View style={styles.topicBadgeSkeleton}>
            {renderShimmerOverlay()}
          </View>

          {/* Story lines skeleton */}
          <View style={styles.storyLineSkeleton}>
            {renderShimmerOverlay()}
          </View>
          <View style={[styles.storyLineSkeleton, styles.storyLineShort]}>
            {renderShimmerOverlay()}
          </View>
          <View style={styles.storyLineSkeleton}>
            {renderShimmerOverlay()}
          </View>
          <View style={[styles.storyLineSkeleton, styles.storyLineMedium]}>
            {renderShimmerOverlay()}
          </View>
        </View>
      ))}

      {/* Sources skeleton */}
      <View style={[styles.sourcesSkeleton, { backgroundColor: premiumColors.glassBackground, borderColor: premiumColors.glassBorder }]}>
        <View style={styles.sourcesHeaderSkeleton}>
          {renderShimmerOverlay()}
        </View>
        <View style={styles.chipsRow}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={styles.chipSkeleton}>
              {renderShimmerOverlay()}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xxl,
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  badgeSkeleton: {
    width: 140,
    height: 44,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  titleSkeleton: {
    width: 200,
    height: 28,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  dateSkeleton: {
    width: 160,
    height: 20,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  readTimeSkeleton: {
    width: 120,
    height: 24,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  cardSkeleton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topicBadgeSkeleton: {
    width: 100,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(128,128,128,0.15)',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  storyLineSkeleton: {
    height: 16,
    borderRadius: borderRadius.xs,
    backgroundColor: 'rgba(128,128,128,0.1)',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  storyLineShort: {
    width: '60%',
  },
  storyLineMedium: {
    width: '80%',
  },
  sourcesSkeleton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sourcesHeaderSkeleton: {
    width: 80,
    height: 16,
    borderRadius: borderRadius.xs,
    backgroundColor: 'rgba(128,128,128,0.15)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chipSkeleton: {
    width: 80,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(128,128,128,0.1)',
    overflow: 'hidden',
  },
});
