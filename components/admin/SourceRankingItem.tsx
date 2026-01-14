import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import type { SourcePerformance } from '@/lib/api';

interface SourceRankingItemProps {
  source: SourcePerformance;
  rank: number;
}

export function SourceRankingItem({ source, rank }: SourceRankingItemProps) {
  const { colors } = useTheme();

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Rank */}
      <Text style={[styles.rank, { color: colors.textMuted }]}>#{rank}</Text>

      {/* Logo */}
      <OptimizedImage
        url={source.logo_url}
        style={styles.logo}
        width={40}
        height={40}
        fallbackIcon="rss"
      />

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {source.source_name}
          </Text>
          {!source.is_active && (
            <View style={[styles.inactiveBadge, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.inactiveText, { color: colors.error }]}>Inactive</Text>
            </View>
          )}
        </View>
        <Text style={[styles.language, { color: colors.textMuted }]}>
          {source.language === 'ar' ? 'Arabic' : 'English'} | {source.story_count} stories
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <FontAwesome name="eye" size={12} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {formatNumber(source.total_views)}
          </Text>
        </View>
        <View style={styles.stat}>
          <FontAwesome name="bookmark" size={12} color="#4CAF50" />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {formatNumber(source.total_saves)}
          </Text>
        </View>
      </View>
    </View>
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
  rank: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    width: 28,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.medium,
  },
  language: {
    fontSize: fontSize.xxs,
    marginTop: 2,
  },
  stats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    minWidth: 32,
    textAlign: 'right',
  },
});
