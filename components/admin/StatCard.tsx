import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
  compact?: boolean;
}

export function StatCard({ title, value, icon, color, subtitle, compact }: StatCardProps) {
  const { colors } = useTheme();

  const formattedValue = typeof value === 'number'
    ? value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()
    : value;

  if (compact) {
    return (
      <View style={[styles.compactCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.compactIcon, { backgroundColor: `${color}20` }]}>
          <FontAwesome name={icon as any} size={16} color={color} />
        </View>
        <View style={styles.compactContent}>
          <Text style={[styles.compactValue, { color: colors.textPrimary }]}>
            {formattedValue}
          </Text>
          <Text style={[styles.compactTitle, { color: colors.textMuted }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <FontAwesome name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.value, { color: colors.textPrimary }]}>
        {formattedValue}
      </Text>
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 100,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  title: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.xxs,
    marginTop: 2,
  },
  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  compactTitle: {
    fontSize: fontSize.xxs,
  },
});
