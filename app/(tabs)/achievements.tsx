import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore, useAuthStore, useGamificationStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '@/constants';

export default function AchievementsScreen() {
  const { settings } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { stats, achievements, unlockedAchievements, isLoading, fetchStats, fetchAchievements } = useGamificationStore();
  const { colors } = useTheme();
  const isArabic = settings.language === 'ar';

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchAchievements();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? 'رجوع' : 'Go back'}
          >
            <FontAwesome name="chevron-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
            {isArabic ? 'الإنجازات' : 'Achievements'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.signInPrompt}>
          <FontAwesome name="trophy" size={48} color={colors.textMuted} />
          <Text style={[styles.signInTitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
            {isArabic ? 'سجل دخولك لتتبع إنجازاتك' : 'Sign in to track your achievements'}
          </Text>
          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInButtonText}>
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'رجوع' : 'Go back'}
        >
          <FontAwesome name="chevron-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
          {isArabic ? 'الإنجازات' : 'Achievements'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <FontAwesome name="fire" size={24} color="#FF6B35" />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.currentStreak || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {isArabic ? 'سلسلة الأيام' : 'Day Streak'}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <FontAwesome name="book" size={24} color="#4CAF50" />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats?.totalStoriesRead || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {isArabic ? 'أخبار مقروءة' : 'Stories Read'}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <FontAwesome name="trophy" size={24} color="#FFD700" />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{unlockedAchievements.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {isArabic ? 'إنجازات' : 'Achievements'}
          </Text>
        </View>
      </View>

      {/* Streak Info */}
      {stats && stats.currentStreak > 0 && (
        <View style={styles.streakBanner}>
          <View style={styles.streakContent}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={[styles.streakTitle, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
                {isArabic
                  ? `${stats.currentStreak} يوم متتالي!`
                  : `${stats.currentStreak} Day Streak!`}
              </Text>
              <Text style={[styles.streakSubtitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
                {isArabic
                  ? `أطول سلسلة: ${stats.longestStreak} يوم`
                  : `Longest: ${stats.longestStreak} days`}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Achievements List */}
      <View style={styles.achievementsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
          {isArabic ? 'جميع الإنجازات' : 'All Achievements'}
        </Text>

        {achievements.map((achievement) => {
          const isUnlocked = unlockedIds.has(achievement.id);

          // Calculate progress for locked achievements
          const progress = !isUnlocked ? calculateProgress(achievement, stats) : null;

          return (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                !isUnlocked && styles.achievementLocked,
              ]}
            >
              <View style={[styles.achievementIcon, !isUnlocked && { backgroundColor: colors.surfaceLight }]}>
                <FontAwesome
                  name={getIconName(achievement.icon)}
                  size={24}
                  color={isUnlocked ? '#FFD700' : colors.textMuted}
                />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementName, { color: colors.textPrimary }, isArabic && styles.arabicText]}>
                  {isArabic ? achievement.name_ar : achievement.name_en}
                </Text>
                <Text style={[styles.achievementDesc, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
                  {isArabic ? achievement.description_ar : achievement.description_en}
                </Text>
                {/* Progress bar for locked achievements */}
                {progress && (
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(progress.percentage, 100)}%`, backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textMuted }]}>
                      {progress.current}/{progress.target} ({Math.round(progress.percentage)}%)
                    </Text>
                  </View>
                )}
              </View>
              {isUnlocked ? (
                <View style={styles.achievementUnlocked}>
                  <FontAwesome name="check-circle" size={20} color="#4CAF50" />
                </View>
              ) : (
                <View style={[styles.achievementPoints, { backgroundColor: colors.primary }]}>
                  <Text style={styles.pointsText}>+{achievement.points}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Weekly Stats */}
      <View style={styles.weeklySection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }, isArabic && styles.arabicText]}>
          {isArabic ? 'إحصائيات الأسبوع' : 'This Week'}
        </Text>
        <View style={[styles.weeklyCard, { backgroundColor: colors.surface }]}>
          <View style={styles.weeklyStat}>
            <Text style={[styles.weeklyValue, { color: colors.textPrimary }]}>{stats?.storiesReadThisWeek || 0}</Text>
            <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
              {isArabic ? 'أخبار هذا الأسبوع' : 'Stories this week'}
            </Text>
          </View>
          <View style={[styles.weeklyDivider, { backgroundColor: colors.border }]} />
          <View style={styles.weeklyStat}>
            <Text style={[styles.weeklyValue, { color: colors.textPrimary }]}>{stats?.totalSaves || 0}</Text>
            <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
              {isArabic ? 'محفوظات' : 'Saved'}
            </Text>
          </View>
          <View style={[styles.weeklyDivider, { backgroundColor: colors.border }]} />
          <View style={styles.weeklyStat}>
            <Text style={[styles.weeklyValue, { color: colors.textPrimary }]}>{stats?.totalShares || 0}</Text>
            <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
              {isArabic ? 'مشاركات' : 'Shared'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function getIconName(icon: string | null): any {
  const iconMap: Record<string, string> = {
    fire: 'fire',
    trophy: 'trophy',
    crown: 'crown',
    book: 'book',
    'graduation-cap': 'graduation-cap',
    star: 'star',
    bookmark: 'bookmark',
    share: 'share',
    diamond: 'diamond',
  };
  return iconMap[icon || ''] || 'star';
}

interface Achievement {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  category: string;
  points: number;
  requirement_type?: string;
  requirement_value?: number;
}

interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalStoriesRead: number;
  totalTimeSpentMinutes: number;
  storiesReadThisWeek: number;
  storiesReadThisMonth: number;
  totalSaves: number;
  totalShares: number;
}

function calculateProgress(
  achievement: Achievement,
  stats: UserStats | null
): { current: number; target: number; percentage: number } | null {
  if (!stats) return null;

  // Infer requirement from achievement code if not explicitly set
  const code = achievement.code;
  let current = 0;
  let target = 1;

  // Streak achievements
  if (code.startsWith('streak_')) {
    target = parseInt(code.replace('streak_', ''), 10) || 3;
    current = stats.currentStreak;
  }
  // Reading achievements
  else if (code.startsWith('read_')) {
    target = parseInt(code.replace('read_', ''), 10) || 10;
    current = stats.totalStoriesRead;
  }
  // Save achievements
  else if (code.startsWith('save_') || code === 'first_save') {
    target = code === 'first_save' ? 1 : parseInt(code.replace('save_', ''), 10) || 1;
    current = stats.totalSaves;
  }
  // Share achievements
  else if (code.startsWith('share_') || code === 'first_share') {
    target = code === 'first_share' ? 1 : parseInt(code.replace('share_', ''), 10) || 1;
    current = stats.totalShares;
  }
  // Premium achievement - can't show progress
  else if (code === 'premium_member') {
    return null;
  }
  // Unknown achievement type
  else {
    return null;
  }

  const percentage = target > 0 ? (current / target) * 100 : 0;
  return { current, target, percentage };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  arabicText: {
    textAlign: 'right',
  },
  signInPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  signInTitle: {
    fontSize: fontSize.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  signInButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.md,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  streakBanner: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  streakSubtitle: {
    fontSize: fontSize.sm,
  },
  achievementsSection: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  achievementName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  achievementDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  achievementPoints: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  pointsText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  achievementUnlocked: {
    padding: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: fontSize.xs,
    minWidth: 40,
    textAlign: 'right',
  },
  weeklySection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  weeklyCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  weeklyLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  weeklyDivider: {
    width: 1,
    marginHorizontal: spacing.md,
  },
});
