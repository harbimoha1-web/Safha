// Streak Badge Component
// Shows current streak with loss aversion warning

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useGamificationStore } from '@/stores/gamification';
import { useAppStore } from '@/stores';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface StreakBadgeProps {
  compact?: boolean;
  showWarning?: boolean;
}

/**
 * Calculate if streak is at risk based on last activity
 * Saudi Arabia timezone (UTC+3)
 */
function checkStreakRisk(lastActiveDate?: string): { isAtRisk: boolean; hoursLeft: number } {
  if (!lastActiveDate) {
    return { isAtRisk: false, hoursLeft: 0 };
  }

  // Get current time in Saudi timezone
  const now = new Date();
  const saudiOffset = 3 * 60; // UTC+3 in minutes
  const localOffset = now.getTimezoneOffset();
  const saudiTime = new Date(now.getTime() + (saudiOffset + localOffset) * 60 * 1000);

  // Parse last active date
  const lastDate = new Date(lastActiveDate);
  const lastDateSaudi = new Date(lastDate.getTime() + (saudiOffset + localOffset) * 60 * 1000);

  // Get dates (ignoring time)
  const todaySaudi = new Date(saudiTime.getFullYear(), saudiTime.getMonth(), saudiTime.getDate());
  const lastDateOnly = new Date(lastDateSaudi.getFullYear(), lastDateSaudi.getMonth(), lastDateSaudi.getDate());

  // Calculate difference in days
  const diffTime = todaySaudi.getTime() - lastDateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already read today - streak safe until tomorrow
    const tomorrow = new Date(todaySaudi);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const hoursLeft = Math.ceil((tomorrow.getTime() - saudiTime.getTime()) / (1000 * 60 * 60));
    return { isAtRisk: false, hoursLeft: hoursLeft + 24 };
  } else if (diffDays === 1) {
    // Last read was yesterday - streak at risk!
    const midnight = new Date(todaySaudi);
    midnight.setDate(midnight.getDate() + 1);
    const hoursLeft = Math.ceil((midnight.getTime() - saudiTime.getTime()) / (1000 * 60 * 60));
    return { isAtRisk: true, hoursLeft };
  } else {
    // Streak already broken
    return { isAtRisk: false, hoursLeft: 0 };
  }
}

export function StreakBadge({ compact = false, showWarning = false }: StreakBadgeProps) {
  const { stats } = useGamificationStore();
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';
  const [pulseAnim] = useState(new Animated.Value(1));

  const currentStreak = stats?.currentStreak || 0;

  // Check if streak is at risk using time-based logic
  // Note: This would ideally use lastActiveDate from stats, but we'll use a simple heuristic
  // In production, fetch last_active_date from user_stats table
  const { isAtRisk: isStreakAtRisk, hoursLeft } = showWarning && currentStreak > 0
    ? checkStreakRisk(stats?.lastActiveDate)
    : { isAtRisk: false, hoursLeft: 0 };

  // Pulse animation when at risk
  useEffect(() => {
    if (isStreakAtRisk) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isStreakAtRisk, pulseAnim]);

  if (compact) {
    return (
      <View style={[styles.compactContainer, isStreakAtRisk && styles.atRisk]}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <Text style={[styles.compactCount, isStreakAtRisk && styles.atRiskText]}>
          {currentStreak}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.badge, isStreakAtRisk && styles.atRisk]}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <Text style={[styles.count, isStreakAtRisk && styles.atRiskText]}>
          {currentStreak}
        </Text>
        <Text style={[styles.label, isStreakAtRisk && styles.atRiskText, isArabic && styles.arabicText]}>
          {isArabic
            ? (currentStreak === 1 ? 'يوم' : 'أيام')
            : (currentStreak === 1 ? 'day' : 'days')}
        </Text>
      </View>

      {isStreakAtRisk && (
        <Animated.View style={[styles.warningContainer, { transform: [{ scale: pulseAnim }] }]}>
          <FontAwesome name="exclamation-triangle" size={12} color={colors.warning} />
          <Text style={[styles.warningText, isArabic && styles.arabicText]}>
            {isArabic
              ? `${hoursLeft} ساعة متبقية للحفاظ على سلسلتك!`
              : `${hoursLeft}h left to keep your streak!`}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 4,
  },
  atRisk: {
    borderColor: colors.warning,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
  },
  fireEmoji: {
    fontSize: 16,
  },
  count: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  compactCount: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  atRiskText: {
    color: colors.warning,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  warningText: {
    color: colors.warning,
    fontSize: fontSize.xs,
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
