import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { TopStory } from '@/lib/api';

interface TopStoryItemProps {
  story: TopStory;
  rank: number;
  onPress?: () => void;
}

export function TopStoryItem({ story, rank, onPress }: TopStoryItemProps) {
  const { colors } = useTheme();
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  const title = (isArabic ? story.title_ar : story.title_en) || story.original_title || 'Untitled';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Rank badge */}
      <View style={[styles.rankBadge, { backgroundColor: rank <= 3 ? '#FFD700' : colors.border }]}>
        <Text style={[styles.rankText, { color: rank <= 3 ? '#000' : colors.textMuted }]}>
          {rank}
        </Text>
      </View>

      {/* Image */}
      <OptimizedImage
        url={story.image_url}
        style={styles.image}
        width={60}
        height={60}
        fallbackIcon="newspaper-o"
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.meta}>
          {story.source_name && (
            <Text style={[styles.source, { color: colors.primary }]} numberOfLines={1}>
              {story.source_name}
            </Text>
          )}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <FontAwesome name="eye" size={10} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>
                {story.view_count}
              </Text>
            </View>
            <View style={styles.stat}>
              <FontAwesome name="bookmark" size={10} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>
                {story.save_count}
              </Text>
            </View>
            <View style={styles.stat}>
              <FontAwesome name="share" size={10} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>
                {story.share_count}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  source: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: fontSize.xxs,
  },
});
