import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores';
import { useAdminDashboardStats, useTopStories } from '@/hooks/useAdminAnalytics';
import { StatCard, TopStoryItem } from '@/components/admin';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface AdminCardProps {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: string;
}

function AdminCard({ title, subtitle, icon, route, color }: AdminCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push(route as any)}
      activeOpacity={0.8}
    >
      <View style={[styles.cardIcon, { backgroundColor: color }]}>
        <FontAwesome name={icon as any} size={24} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      <FontAwesome name="chevron-right" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function StatsSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.skeletonCircle, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: 40 }]} />
          <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: 60 }]} />
        </View>
      ))}
    </View>
  );
}

export default function AdminDashboard() {
  const { colors } = useTheme();
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching } = useAdminDashboardStats();
  const { data: topStories = [], refetch: refetchStories } = useTopStories(5, 7);

  const handleRefresh = () => {
    refetchStats();
    refetchStories();
  };

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
      <Text style={[styles.header, { color: colors.textPrimary }]}>
        {isArabic ? 'لوحة التحكم' : 'Admin Dashboard'}
      </Text>
      <Text style={[styles.subheader, { color: colors.textMuted }]}>
        {isArabic ? 'إدارة المصادر والمواضيع' : 'Manage sources, topics & analytics'}
      </Text>

      {/* Stats Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {isArabic ? 'الإحصائيات' : 'Overview'}
        </Text>

        {statsLoading ? (
          <StatsSkeleton />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              title={isArabic ? 'المستخدمين اليوم' : 'Active Today'}
              value={stats?.active_users_daily || 0}
              icon="users"
              color="#3B82F6"
            />
            <StatCard
              title={isArabic ? 'إجمالي المستخدمين' : 'Total Users'}
              value={stats?.total_users || 0}
              icon="user"
              color="#8B5CF6"
            />
            <StatCard
              title={isArabic ? 'القصص اليوم' : 'Stories Today'}
              value={stats?.stories_today || 0}
              icon="newspaper-o"
              color="#10B981"
            />
            <StatCard
              title={isArabic ? 'المشتركين' : 'Premium'}
              value={stats?.premium_users || 0}
              icon="star"
              color="#F59E0B"
            />
          </View>
        )}

        {/* Secondary stats row */}
        {stats && (
          <View style={styles.secondaryStats}>
            <View style={[styles.secondaryStat, { backgroundColor: colors.surface }]}>
              <FontAwesome name="rss" size={14} color={colors.primary} />
              <Text style={[styles.secondaryValue, { color: colors.textPrimary }]}>
                {stats.active_sources}/{stats.total_sources}
              </Text>
              <Text style={[styles.secondaryLabel, { color: colors.textMuted }]}>
                {isArabic ? 'مصادر نشطة' : 'Active Sources'}
              </Text>
            </View>
            <View style={[styles.secondaryStat, { backgroundColor: colors.surface }]}>
              <FontAwesome name="tags" size={14} color="#10B981" />
              <Text style={[styles.secondaryValue, { color: colors.textPrimary }]}>
                {stats.active_topics}/{stats.total_topics}
              </Text>
              <Text style={[styles.secondaryLabel, { color: colors.textMuted }]}>
                {isArabic ? 'مواضيع نشطة' : 'Active Topics'}
              </Text>
            </View>
            <View style={[styles.secondaryStat, { backgroundColor: colors.surface }]}>
              <FontAwesome name="clock-o" size={14} color="#F59E0B" />
              <Text style={[styles.secondaryValue, { color: colors.textPrimary }]}>
                {stats.pending_stories}
              </Text>
              <Text style={[styles.secondaryLabel, { color: colors.textMuted }]}>
                {isArabic ? 'بانتظار المراجعة' : 'Pending'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/admin/topics' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF620' }]}>
              <FontAwesome name="tags" size={18} color="#8B5CF6" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
              {isArabic ? 'المواضيع' : 'Topics'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/admin/sources' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F620' }]}>
              <FontAwesome name="newspaper-o" size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
              {isArabic ? 'المصادر' : 'Sources'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/admin/analytics' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#10B98120' }]}>
              <FontAwesome name="line-chart" size={18} color="#10B981" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
              {isArabic ? 'التحليلات' : 'Analytics'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/admin/source-topics' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B20' }]}>
              <FontAwesome name="link" size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
              {isArabic ? 'الربط' : 'Linking'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Top Stories */}
      {topStories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {isArabic ? 'أكثر القصص تفاعلاً' : 'Top Stories This Week'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/admin/analytics' as any)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                {isArabic ? 'عرض الكل' : 'See All'}
              </Text>
            </TouchableOpacity>
          </View>

          {topStories.map((story, index) => (
            <TopStoryItem
              key={story.id}
              story={story}
              rank={index + 1}
              onPress={() => router.push(`/story/${story.id}` as any)}
            />
          ))}
        </View>
      )}

      {/* Management Cards */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {isArabic ? 'إدارة المحتوى' : 'Content Management'}
        </Text>

        <AdminCard
          title={isArabic ? 'إدارة المواضيع' : 'Manage Topics'}
          subtitle={isArabic ? 'تفعيل/تعطيل وتعديل المواضيع' : 'Activate, deactivate & edit topics'}
          icon="tags"
          route="/admin/topics"
          color="#8B5CF6"
        />

        <AdminCard
          title={isArabic ? 'إدارة المصادر' : 'Manage Sources'}
          subtitle={isArabic ? 'تعديل تفاصيل المصادر والحالة' : 'Edit source details, logos & status'}
          icon="newspaper-o"
          route="/admin/sources"
          color="#3B82F6"
        />

        <AdminCard
          title={isArabic ? 'ربط المصادر بالمواضيع' : 'Source-Topic Linking'}
          subtitle={isArabic ? 'ربط المصادر بالمواضيع للتصنيف' : 'Assign sources to topics'}
          icon="link"
          route="/admin/source-topics"
          color="#10B981"
        />
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
    fontSize: 28,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subheader: {
    fontSize: fontSize.md,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  // Secondary Stats
  secondaryStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  secondaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  secondaryLabel: {
    fontSize: fontSize.xxs,
    flex: 1,
  },
  // Quick Actions
  quickActionsScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    minWidth: 80,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickActionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  // Admin Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
  },
  // Skeleton
  skeletonCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: spacing.sm,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
});
