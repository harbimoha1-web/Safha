// Haptic Feedback Utilities
// Provides consistent haptic feedback across the app (majnon's psychology fix)

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Check if haptics are available
const isHapticsAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light tap feedback - for button presses, selections
 */
export async function lightTap(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently fail on unsupported devices
  }
}

/**
 * Medium tap feedback - for more significant actions
 */
export async function mediumTap(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Silently fail on unsupported devices
  }
}

/**
 * Heavy tap feedback - for important actions
 */
export async function heavyTap(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    // Silently fail on unsupported devices
  }
}

/**
 * Success feedback - for successful actions (save, purchase, etc.)
 */
export async function successFeedback(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Silently fail on unsupported devices
  }
}

/**
 * Error feedback - for failed actions
 */
export async function errorFeedback(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Silently fail on unsupported devices
  }
}

/**
 * Warning feedback - for cautionary actions
 */
export async function warningFeedback(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    // Silently fail on unsupported devices
  }
}

/**
 * Selection feedback - for picker/selection changes
 */
export async function selectionFeedback(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    // Silently fail on unsupported devices
  }
}

// Pre-defined feedback types for common actions
export const HapticFeedback = {
  // UI interactions
  buttonPress: lightTap,
  tabSwitch: selectionFeedback,
  swipe: lightTap,

  // Story actions
  saveStory: successFeedback,
  unsaveStory: mediumTap,
  shareStory: successFeedback,

  // Achievements
  achievementUnlock: successFeedback,
  streakMilestone: successFeedback,

  // Navigation
  pageChange: selectionFeedback,
  modalOpen: lightTap,
  modalClose: lightTap,

  // Errors
  error: errorFeedback,
  warning: warningFeedback,

  // Premium
  upgradeToPremium: successFeedback,
} as const;
