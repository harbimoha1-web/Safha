// Summary Prompt Card for Feed Header
// Shows personalized CTA for daily summary (premium feature)

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSubscriptionStore } from '@/stores/subscription';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

export function SummaryPromptCard() {
  const { isPremium } = useSubscriptionStore();
  const { profile, user } = useAuthStore();
  const { settings } = useAppStore();
  const isArabic = settings.language === 'ar';

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return isArabic ? 'صباح الخير' : 'Good Morning';
    } else if (hour < 18) {
      return isArabic ? 'مساء الخير' : 'Good Afternoon';
    }
    return isArabic ? 'مساء الخير' : 'Good Evening';
  };

  const userName = profile?.full_name || profile?.username || (isArabic ? 'صديقي' : 'there');

  const handlePress = () => {
    if (isPremium) {
      router.push('/summary');
    } else {
      router.push('/subscription');
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <Text style={[styles.greeting, isArabic && styles.arabicText]}>
            {getGreeting()}, {userName}
          </Text>
          {!isPremium && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={[styles.subtitle, isArabic && styles.arabicText]}>
          {isArabic
            ? 'احصل على ملخص اليوم في 60 ثانية'
            : "Get today's summary in 60 seconds"}
        </Text>
      </View>

      <View style={styles.previewSection}>
        {isPremium ? (
          // Premium user - show action prompt
          <View style={styles.actionPrompt}>
            <FontAwesome name="magic" size={20} color={colors.primary} />
            <Text style={[styles.actionText, isArabic && styles.arabicText]}>
              {isArabic ? 'أنشئ ملخصي اليومي' : 'Generate My Summary'}
            </Text>
            <FontAwesome
              name={isArabic ? 'arrow-left' : 'arrow-right'}
              size={14}
              color={colors.primary}
            />
          </View>
        ) : (
          // Free user - show blurred preview tease
          <View style={styles.lockedPreview}>
            <View style={styles.blurredLines}>
              <View style={[styles.blurLine, { width: '80%' }]} />
              <View style={[styles.blurLine, { width: '65%' }]} />
              <View style={[styles.blurLine, { width: '75%' }]} />
            </View>
            <View style={styles.lockOverlay}>
              <FontAwesome name="lock" size={16} color={colors.warning} />
              <Text style={[styles.lockText, isArabic && styles.arabicText]}>
                {isArabic ? 'افتح الملخص اليومي' : 'Unlock Daily Summary'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {!isPremium && (
        <View style={styles.socialProof}>
          <Text style={styles.socialProofText}>
            {isArabic
              ? '32,000+ محترف يحصلون على ملخصهم اليومي'
              : '32,000+ professionals get their daily summary'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    marginBottom: spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  proBadgeText: {
    color: colors.black,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  previewSection: {
    marginTop: spacing.sm,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  actionText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  lockedPreview: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    position: 'relative',
  },
  blurredLines: {
    gap: spacing.sm,
    opacity: 0.3,
  },
  blurLine: {
    height: 12,
    backgroundColor: colors.textMuted,
    borderRadius: 4,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  lockText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  socialProof: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  socialProofText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
