import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores';
import {
  useAdminDashboardStats,
  useEngagementTrends,
  useTopStories,
  useSourcePerformance,
} from '@/hooks/useAdminAnalytics';
import { StatCard, TopStoryItem, SourceRankingItem } from '@/components/admin';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeRange = 7 | 14 | 30;

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  const { colors } = useTheme();
  const options: { value: TimeRange; label: string }[] = [
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
  ];

  return (
    <View style={[styles.timeRange, { backgroundColor: colors.surface }]}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.timeRangeOption,
            value === opt.value && { backgroundColor: colors.primary },
          ]}
          onPress={() => onChange(opt.value)}
        >
          <Text
            style={[
              styles.timeRangeText,
              { color: value === opt.value ? '#fff' : colors.textMuted },
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SimpleBarChart({
  data,
  color,
  maxValue,
}: {
  data: number[];
  color: string;
  maxValue: number;
}) {
  const { colors } = useTheme();
  const barWidth = (SCREEN_WIDTH - spacing.lg * 4) / data.length - 2;

  return (
    <View style={styles.chartContainer}>
      {data.map((value, index) => {
        const height = maxValue > 0 ? (value / maxValue) * 80 : 0;
        return (
          <View key={index} style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(height, 4),
                  width: barWidth,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  const [timeRange, setTimeRange] = useState<TimeRange>(14);

  const { data: stats, refetch: refetchStats, isRefetching } = useAdminDashboardStats();
  const { data: trends = [], refetch: refetchTrends } = useEngagementTrends(timeRange);
  const { data: topStories = [], refetch: refetchStories } = useTopStories(10, timeRange);
  const { data: sourcePerformance = [], refetch: refetchSources } = useSourcePerformance(10, timeRange);

  const handleRefresh = () => {
    refetchStats();
    refetchTrends();
    refetchStories();
    refetchSources();
  };

  const chartData = useMemo(() => {
    const activeUsers = trends.map((t) => t.active_users);
    const views = trends.map((t) => t.views);
    const newUsers = trends.map((t) => t.new_users);

    return {
      activeUsers,
      views,
      newUsers,
      maxActiveUsers: Math.max(...activeUsers, 1),
      maxViews: Math.max(...views, 1),
      maxNewUsers: Math.max(...newUsers, 1),
    };
  }, [trends]);

  const totals = useMemo(() => {
    return {
      views: trends.reduce((sum, t) => sum + t.views, 0),
      saves: trends.reduce((sum, t) => sum + t.saves, 0),
      shares: trends.reduce((sum, t) => sum + t.shares, 0),
      newUsers: trends.reduce((sum, t) => sum + t.new_users, 0),
    };
  }, [trends]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <Text style={[styles.header, { color: colors.textPrimary }]}>
        {isArabic ? 'التحليلات' : 'Analytics'}
      </Text>

      {/* Time Range Selector */}
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      {/* User Metrics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {isArabic ? 'نشاط المستخدمين' : 'User Activity'}
        </Text>

        <View style={styles.metricsRow}>
          <StatCard
            title={isArabic ? 'يومي' : 'Daily'}
            value={stats?.active_users_daily || 0}
            icon="user"
            color="#3B82F6"
            compact
          />
          <StatCard
            title={isArabic ? 'أسبوعي' : 'Weekly'}
            value={stats?.active_users_weekly || 0}
            icon="users"
            color="#8B5CF6"
            compact
          />
          <StatCard
            title={isArabic ? 'شهري' : 'Monthly'}
            value={stats?.active_users_monthly || 0}
            icon="calendar"
            color="#10B981"
            compact
          />
        </View>

        {/* Active Users Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
            {isArabic ? 'المستخدمين النشطين' : 'Active Users'}
          </Text>
          <SimpleBarChart
            data={chartData.activeUsers}
            color="#3B82F6"
            maxValue={chartData.maxActiveUsers}
          />
          <View style={styles.chartLegend}>
            <Text style={[styles.chartLegendText, { color: colors.textMuted }]}>
              {trends[0]?.date?.split('-').slice(1).join('/')}
            </Text>
            <Text style={[styles.chartLegendText, { color: colors.textMuted }]}>
              {trends[trends.length - 1]?.date?.split('-').slice(1).join('/')}
            </Text>
          </View>
        </View>
      </View>

      {/* Engagement Metrics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {isArabic ? 'التفاعل' : 'Engagement'}
        </Text>

        <View style={styles.engagementGrid}>
          <View style={[styles.engagementCard, { backgroundColor: colors.surface }]}>
            <FontAwesome name="eye" size={20} color="#3B82F6" />
            <Text style={[styles.engagementValue, { color: colors.textPrimary }]}>
              {totals.views.toLocaleString()}
            </Text>
            <Text style={[styles.engagementLabel, { color: colors.textMuted }]}>
              {isArabic ? 'مشاهدات' : 'Views'}
            </Text>
          </View>
          <View style={[styles.engagementCard, { backgroundColor: colors.surface }]}>
            <FontAwesome name="bookmark" size={20} color="#10B981" />
            <Text style={[styles.engagementValue, { color: colors.textPrimary }]}>
              {totals.saves.toLocaleString()}
            </Text>
            <Text style={[styles.engagementLabel, { color: colors.textMuted }]}>
              {isArabic ? 'حفظ' : 'Saves'}
            </Text>
          </View>
          <View style={[styles.engagementCard, { backgroundColor: colors.surface }]}>
            <FontAwesome name="share" size={20} color="#F59E0B" />
            <Text style={[styles.engagementValue, { color: colors.textPrimary }]}>
              {totals.shares.toLocaleString()}
            </Text>
            <Text style={[styles.engagementLabel, { color: colors.textMuted }]}>
              {isArabic ? 'مشاركات' : 'Shares'}
            </Text>
          </View>
          <View style={[styles.engagementCard, { backgroundColor: colors.surface }]}>
            <FontAwesome name="user-plus" size={20} color="#8B5CF6" />
            <Text style={[styles.engagementValue, { color: colors.textPrimary }]}>
              {totals.newUsers.toLocaleString()}
            </Text>
            <Text style={[styles.engagementLabel, { color: colors.textMuted }]}>
              {isArabic ? 'جدد' : 'New Users'}
            </Text>
          </View>
        </View>

        {/* Views Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
            {isArabic ? 'المشاهدات اليومية' : 'Daily Views'}
          </Text>
          <SimpleBarChart
            data={chartData.views}
            color="#10B981"
            maxValue={chartData.maxViews}
          />
        </View>
      </View>

      {/* Top Stories */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {isArabic ? 'أفضل القصص' : 'Top Stories'}
        </Text>

        {topStories.slice(0, 5).map((story, index) => (
          <TopStoryItem
            key={story.id}
            story={story}
            rank={index + 1}
            onPress={() => router.push(`/story/${story.id}` as any)}
          />
        ))}
      </View>

      {/* Source Performance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {isArabic ? 'أداء المصادر' : 'Source Performance'}
        </Text>

        {sourcePerformance.slice(0, 5).map((source, index) => (
          <SourceRankingItem
            key={source.source_id}
            source={source}
            rank={index + 1}
          />
        ))}

        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/admin/sources' as any)}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            {isArabic ? 'عرض كل المصادر' : 'View All Sources'}
          </Text>
          <FontAwesome name="chevron-right" size={12} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  // Time Range
  timeRange: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.xl,
  },
  timeRangeOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  // Chart
  chartCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  chartTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 2,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  chartLegendText: {
    fontSize: fontSize.xxs,
  },
  // Engagement Grid
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  engagementCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  engagementLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  // View All
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
