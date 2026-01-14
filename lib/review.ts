// App Review Service
// Smart triggers for prompting users to review the app in App Store / Play Store
// Like premium apps: thoughtful timing, beautiful UX, easy to skip

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';
import { createLogger } from './debug';

const log = createLogger('Review');

const REVIEW_STORAGE_KEY = '@safha_review_state';

export interface ReviewState {
  // Has user completed or permanently dismissed the review?
  hasReviewed: boolean;
  // Number of times user has skipped the review prompt
  skipCount: number;
  // Last time we showed the review prompt (timestamp)
  lastPromptTime: number | null;
  // Total stories read (tracked locally for review triggers)
  storiesReadForReview: number;
  // Current streak when last checked
  lastStreakCheck: number;
  // Number of achievements unlocked when last checked
  lastAchievementCount: number;
  // First app open date (for time-based triggers)
  firstOpenDate: number | null;
}

const DEFAULT_STATE: ReviewState = {
  hasReviewed: false,
  skipCount: 0,
  lastPromptTime: null,
  storiesReadForReview: 0,
  lastStreakCheck: 0,
  lastAchievementCount: 0,
  firstOpenDate: null,
};

// Trigger thresholds (balanced - not too low, not too high)
const TRIGGERS = {
  // Show after reading 50 stories (shows real engagement)
  STORIES_READ: 50,
  // Show after 14-day streak (shows commitment)
  STREAK_DAYS: 14,
  // Show after unlocking 5 achievements (shows progress)
  ACHIEVEMENTS_UNLOCKED: 5,
  // Minimum days since first open before showing (let them get comfortable)
  MIN_DAYS_SINCE_INSTALL: 7,
  // Cooldown between prompts (don't spam - 30 days)
  COOLDOWN_DAYS: 30,
  // Max skips before we stop asking (respect user choice)
  MAX_SKIPS: 3,
};

// Bilingual messages for the review prompt
export const REVIEW_MESSAGES = {
  ar: {
    title: 'هل تستمتع بصفحة؟',
    subtitle: 'رأيك يساعدنا على التطور',
    message: 'إذا كانت صفحة تساعدك على البقاء على اطلاع بالأخبار، نتمنى أن تشاركنا رأيك. تقييمك يعني لنا الكثير ويساعد القراء الآخرين على اكتشاف التطبيق.',
    primaryButton: 'تقييم التطبيق',
    skipButton: 'ربما لاحقاً',
    neverButton: 'لا تسألني مجدداً',
  },
  en: {
    title: 'Enjoying Safha?',
    subtitle: 'Your feedback helps us improve',
    message: "If Safha helps you stay informed with the news that matters, we'd love to hear from you. Your review means a lot to us and helps other readers discover the app.",
    primaryButton: 'Rate the App',
    skipButton: 'Maybe Later',
    neverButton: "Don't Ask Again",
  },
};

/**
 * Get the current review state from storage
 */
async function getReviewState(): Promise<ReviewState> {
  try {
    const stored = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    }
  } catch (error) {
    log.error('Error reading review state:', error);
  }
  return { ...DEFAULT_STATE };
}

/**
 * Save review state to storage
 */
async function saveReviewState(state: ReviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    log.error('Error saving review state:', error);
  }
}

/**
 * Initialize review tracking on first app open
 */
export async function initializeReviewTracking(): Promise<void> {
  const state = await getReviewState();
  if (!state.firstOpenDate) {
    state.firstOpenDate = Date.now();
    await saveReviewState(state);
  }
}

/**
 * Record that a story was read (for review trigger tracking)
 */
export async function recordStoryReadForReview(): Promise<void> {
  const state = await getReviewState();
  state.storiesReadForReview++;
  await saveReviewState(state);
}

/**
 * Check if we should show the review prompt based on current user stats
 * @param currentStreak - User's current reading streak
 * @param achievementCount - Number of achievements unlocked
 * @returns Whether to show the review prompt
 */
export async function shouldShowReviewPrompt(
  currentStreak: number,
  achievementCount: number
): Promise<boolean> {
  const state = await getReviewState();

  // Never show if user has already reviewed or skipped too many times
  if (state.hasReviewed || state.skipCount >= TRIGGERS.MAX_SKIPS) {
    return false;
  }

  // Check cooldown period (30 days between prompts)
  if (state.lastPromptTime) {
    const daysSinceLastPrompt = (Date.now() - state.lastPromptTime) / (1000 * 60 * 60 * 24);
    if (daysSinceLastPrompt < TRIGGERS.COOLDOWN_DAYS) {
      return false;
    }
  }

  // Check minimum days since install
  if (state.firstOpenDate) {
    const daysSinceInstall = (Date.now() - state.firstOpenDate) / (1000 * 60 * 60 * 24);
    if (daysSinceInstall < TRIGGERS.MIN_DAYS_SINCE_INSTALL) {
      return false;
    }
  }

  // Trigger 1: 50+ stories read
  if (state.storiesReadForReview >= TRIGGERS.STORIES_READ) {
    return true;
  }

  // Trigger 2: 14+ day streak (and streak increased since last check)
  if (currentStreak >= TRIGGERS.STREAK_DAYS && currentStreak > state.lastStreakCheck) {
    return true;
  }

  // Trigger 3: 5+ achievements (and count increased since last check)
  if (achievementCount >= TRIGGERS.ACHIEVEMENTS_UNLOCKED && achievementCount > state.lastAchievementCount) {
    return true;
  }

  return false;
}

/**
 * Mark that we showed the review prompt (update tracking state)
 */
export async function markReviewPromptShown(
  currentStreak: number,
  achievementCount: number
): Promise<void> {
  const state = await getReviewState();
  state.lastPromptTime = Date.now();
  state.lastStreakCheck = currentStreak;
  state.lastAchievementCount = achievementCount;
  await saveReviewState(state);
}

/**
 * Handle user skipping the review prompt
 */
export async function handleReviewSkipped(): Promise<void> {
  const state = await getReviewState();
  state.skipCount++;
  state.lastPromptTime = Date.now();
  await saveReviewState(state);
}

/**
 * Handle user choosing "Don't ask again"
 */
export async function handleReviewNeverAsk(): Promise<void> {
  const state = await getReviewState();
  state.hasReviewed = true; // Treat as reviewed to never show again
  await saveReviewState(state);
}

/**
 * Handle user choosing to review the app
 */
export async function handleReviewAccepted(): Promise<void> {
  const state = await getReviewState();
  state.hasReviewed = true;
  await saveReviewState(state);
}

/**
 * Check if the native store review API is available
 */
export async function isStoreReviewAvailable(): Promise<boolean> {
  try {
    return await StoreReview.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Request the native store review dialog
 * This uses the native iOS/Android review APIs for a seamless experience
 */
export async function requestStoreReview(): Promise<boolean> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
      return true;
    }
    return false;
  } catch (error) {
    log.error('Error requesting store review:', error);
    return false;
  }
}

/**
 * Check if we have a store URL for fallback
 */
export async function hasStoreUrl(): Promise<boolean> {
  try {
    return await StoreReview.hasAction();
  } catch {
    return false;
  }
}

/**
 * Open the app's store page (fallback if native review not available)
 */
export async function openStorePage(): Promise<void> {
  try {
    // This will open the App Store / Play Store page for the app
    await StoreReview.requestReview();
  } catch (error) {
    log.error('Error opening store page:', error);
  }
}

/**
 * Get the appropriate trigger reason for analytics/display
 */
export async function getReviewTriggerReason(
  currentStreak: number,
  achievementCount: number
): Promise<'stories' | 'streak' | 'achievements' | null> {
  const state = await getReviewState();

  if (state.storiesReadForReview >= TRIGGERS.STORIES_READ) {
    return 'stories';
  }
  if (currentStreak >= TRIGGERS.STREAK_DAYS) {
    return 'streak';
  }
  if (achievementCount >= TRIGGERS.ACHIEVEMENTS_UNLOCKED) {
    return 'achievements';
  }
  return null;
}

/**
 * Reset review state (for testing purposes only)
 */
export async function resetReviewState(): Promise<void> {
  await AsyncStorage.removeItem(REVIEW_STORAGE_KEY);
}
