// Smart Paywall Triggers
// Intelligent prompts based on user behavior (Hormozi's recommendation)

import AsyncStorage from '@react-native-async-storage/async-storage';

const PAYWALL_STORAGE_KEY = '@safha_paywall_triggers';
const COOLDOWN_HOURS = 24; // Don't show more than once per day

interface PaywallTriggerData {
  topicLimitHits: number;
  digestAttempts: number;
  adDismissals: number;
  lastPromptTime: number | null;
  premiumFeatureViews: number;
  streakDays: number;
}

const defaultData: PaywallTriggerData = {
  topicLimitHits: 0,
  digestAttempts: 0,
  adDismissals: 0,
  lastPromptTime: null,
  premiumFeatureViews: 0,
  streakDays: 0,
};

/**
 * Get current trigger data
 */
async function getTriggerData(): Promise<PaywallTriggerData> {
  try {
    const stored = await AsyncStorage.getItem(PAYWALL_STORAGE_KEY);
    if (stored) {
      return { ...defaultData, ...JSON.parse(stored) };
    }
    return defaultData;
  } catch {
    return defaultData;
  }
}

/**
 * Save trigger data
 */
async function saveTriggerData(data: PaywallTriggerData): Promise<void> {
  try {
    await AsyncStorage.setItem(PAYWALL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if we're in cooldown period
 */
function isInCooldown(lastPromptTime: number | null): boolean {
  if (!lastPromptTime) return false;
  const hoursSinceLastPrompt = (Date.now() - lastPromptTime) / (1000 * 60 * 60);
  return hoursSinceLastPrompt < COOLDOWN_HOURS;
}

/**
 * Record when user hits topic limit
 */
export async function recordTopicLimitHit(): Promise<boolean> {
  const data = await getTriggerData();
  data.topicLimitHits++;
  await saveTriggerData(data);

  // Show paywall after 2 hits
  if (data.topicLimitHits >= 2 && !isInCooldown(data.lastPromptTime)) {
    data.lastPromptTime = Date.now();
    await saveTriggerData(data);
    return true;
  }
  return false;
}

/**
 * Record when user tries to access digest
 */
export async function recordDigestAttempt(): Promise<boolean> {
  const data = await getTriggerData();
  data.digestAttempts++;
  await saveTriggerData(data);

  // Always show paywall for digest attempts (premium feature)
  if (!isInCooldown(data.lastPromptTime)) {
    data.lastPromptTime = Date.now();
    await saveTriggerData(data);
    return true;
  }
  return false;
}

/**
 * Record when user dismisses an ad
 */
export async function recordAdDismissal(): Promise<boolean> {
  const data = await getTriggerData();
  data.adDismissals++;
  await saveTriggerData(data);

  // Show paywall after 5 ad dismissals (user is annoyed)
  if (data.adDismissals >= 5 && !isInCooldown(data.lastPromptTime)) {
    data.lastPromptTime = Date.now();
    await saveTriggerData(data);
    return true;
  }
  return false;
}

/**
 * Record when user views a premium feature
 */
export async function recordPremiumFeatureView(): Promise<boolean> {
  const data = await getTriggerData();
  data.premiumFeatureViews++;
  await saveTriggerData(data);

  // Show paywall after viewing 3 premium features
  if (data.premiumFeatureViews >= 3 && !isInCooldown(data.lastPromptTime)) {
    data.lastPromptTime = Date.now();
    await saveTriggerData(data);
    return true;
  }
  return false;
}

/**
 * Update streak and check for paywall trigger
 * Users with streaks are highly engaged - perfect for conversion
 */
export async function recordStreakUpdate(days: number): Promise<boolean> {
  const data = await getTriggerData();
  const previousStreak = data.streakDays;
  data.streakDays = days;
  await saveTriggerData(data);

  // Show paywall when user hits streak milestones (3, 7, 14, 30 days)
  const milestones = [3, 7, 14, 30];
  const hitMilestone = milestones.some(
    (m) => days >= m && previousStreak < m
  );

  if (hitMilestone && !isInCooldown(data.lastPromptTime)) {
    data.lastPromptTime = Date.now();
    await saveTriggerData(data);
    return true;
  }
  return false;
}

/**
 * Get personalized paywall message based on trigger
 */
export type PaywallTrigger =
  | 'topic_limit'
  | 'digest'
  | 'ad_fatigue'
  | 'premium_feature'
  | 'streak_milestone'
  | 'default';

export function getPaywallMessage(
  trigger: PaywallTrigger,
  isArabic: boolean,
  streakDays?: number
): { title: string; subtitle: string } {
  const messages: Record<PaywallTrigger, { en: { title: string; subtitle: string }; ar: { title: string; subtitle: string } }> = {
    topic_limit: {
      en: {
        title: 'Want more topics?',
        subtitle: 'Premium gives you unlimited topics to stay informed',
      },
      ar: {
        title: 'تريد المزيد من المواضيع؟',
        subtitle: 'بريميوم يمنحك مواضيع غير محدودة للبقاء على اطلاع',
      },
    },
    digest: {
      en: {
        title: 'Get your daily digest',
        subtitle: "Never miss what's important with personalized summaries",
      },
      ar: {
        title: 'احصل على ملخصك اليومي',
        subtitle: 'لا تفوت ما هو مهم مع ملخصات مخصصة',
      },
    },
    ad_fatigue: {
      en: {
        title: 'Enjoy ad-free reading',
        subtitle: 'Focus on the news that matters, without interruptions',
      },
      ar: {
        title: 'استمتع بالقراءة بدون إعلانات',
        subtitle: 'ركز على الأخبار المهمة، بدون انقطاع',
      },
    },
    premium_feature: {
      en: {
        title: 'Unlock all features',
        subtitle: 'Get the complete Safha experience',
      },
      ar: {
        title: 'افتح جميع المميزات',
        subtitle: 'احصل على تجربة صفحة الكاملة',
      },
    },
    streak_milestone: {
      en: {
        title: `${streakDays} day streak! 🔥`,
        subtitle: "You're committed! Level up with Premium",
      },
      ar: {
        title: `${streakDays} أيام متتالية! 🔥`,
        subtitle: 'أنت ملتزم! ارتقِ مع بريميوم',
      },
    },
    default: {
      en: {
        title: 'Try Premium Free',
        subtitle: '7 days of unlimited access, no commitment',
      },
      ar: {
        title: 'جرّب بريميوم مجاناً',
        subtitle: '7 أيام وصول غير محدود، بدون التزام',
      },
    },
  };

  const lang = isArabic ? 'ar' : 'en';
  return messages[trigger][lang];
}

/**
 * Reset all trigger data (for testing or on logout)
 */
export async function resetTriggerData(): Promise<void> {
  await AsyncStorage.removeItem(PAYWALL_STORAGE_KEY);
}
