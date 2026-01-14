import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({
  width: w = '100%',
  height = 20,
  borderRadius = 4,
  style
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: w, height, borderRadius, opacity, backgroundColor: colors.surfaceLight },
        style,
      ]}
    />
  );
}

export function StoryCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.background }]}>
      {/* Background placeholder */}
      <View style={[styles.cardBackground, { backgroundColor: colors.surface }]}>
        {/* Content area */}
        <View style={styles.cardContent}>
          {/* Source badge */}
          <Skeleton width={80} height={28} borderRadius={14} />

          {/* Title lines */}
          <View style={styles.titleArea}>
            <Skeleton width="90%" height={28} style={styles.marginBottom} />
            <Skeleton width="75%" height={28} style={styles.marginBottom} />
          </View>

          {/* Summary lines */}
          <View style={styles.summaryArea}>
            <Skeleton width="100%" height={16} style={styles.marginBottomSmall} />
            <Skeleton width="95%" height={16} style={styles.marginBottomSmall} />
            <Skeleton width="60%" height={16} />
          </View>

          {/* Read more button */}
          <Skeleton width={140} height={44} borderRadius={22} style={styles.readMoreSkeleton} />
        </View>

        {/* Side actions */}
        <View style={styles.sideActions}>
          <Skeleton width={40} height={40} borderRadius={20} style={styles.marginBottom} />
          <Skeleton width={40} height={40} borderRadius={20} style={styles.marginBottom} />
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>
      </View>
    </View>
  );
}

export function SearchResultSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.searchResult, { backgroundColor: colors.surface }]}>
      <Skeleton width={100} height={80} borderRadius={12} />
      <View style={styles.searchContent}>
        <Skeleton width="90%" height={16} style={styles.marginBottomSmall} />
        <Skeleton width="70%" height={16} style={styles.marginBottomSmall} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function HistoryItemSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.historyItem, { backgroundColor: colors.surface }]}>
      <Skeleton width={100} height={80} borderRadius={12} />
      <View style={styles.historyContent}>
        <Skeleton width="85%" height={15} style={styles.marginBottomSmall} />
        <Skeleton width="60%" height={15} style={styles.marginBottomSmall} />
        <Skeleton width="30%" height={12} />
      </View>
    </View>
  );
}

// Chip-style skeleton for topic selection
export function TopicChipSkeleton({ width = 120 }: { width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.topicChip, { backgroundColor: colors.surface, width }]}>
      <Skeleton width={18} height={18} borderRadius={9} />
      <Skeleton width={width - 50} height={16} borderRadius={4} />
    </View>
  );
}

export function TopicGridSkeleton({ count = 12 }: { count?: number }) {
  // Variable widths for natural look
  const chipWidths = [110, 130, 100, 140, 120, 90, 150, 115, 135, 105, 125, 145];
  return (
    <View style={styles.topicChipsGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <TopicChipSkeleton key={i} width={chipWidths[i % chipWidths.length]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    // backgroundColor set dynamically via theme
  },
  marginBottom: {
    marginBottom: 8,
  },
  marginBottomSmall: {
    marginBottom: 6,
  },
  cardContainer: {
    flex: 1,
    width,
    // backgroundColor set dynamically via theme
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 100,
    // backgroundColor set dynamically via theme
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingRight: 80,
  },
  titleArea: {
    marginTop: 20,
  },
  summaryArea: {
    marginTop: 16,
  },
  readMoreSkeleton: {
    marginTop: 20,
  },
  sideActions: {
    position: 'absolute',
    right: 16,
    bottom: 150,
    alignItems: 'center',
  },
  searchResult: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    // backgroundColor set dynamically via theme
  },
  searchContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    // backgroundColor set dynamically via theme
  },
  historyContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  topicChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
});
