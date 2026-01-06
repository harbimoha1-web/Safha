// Unified Notification Service
// Orchestrates WhatsApp, Email, and Push notifications

export * from './whatsapp';
export * from './email';
export * from './push';

import { sendWhatsAppMessage, sendDailyDigestWhatsApp, sendBreakingNewsWhatsApp } from './whatsapp';
import { sendEmail, generateDailyDigestEmail, generateWeeklyDigestEmail } from './email';
import { sendPushNotification, sendBreakingNewsPush, sendDigestReminderPush } from './push';

export type NotificationChannel = 'whatsapp' | 'email' | 'push';

export interface NotificationConfig {
  whatsapp?: {
    apiKey: string;
    senderName: string;
  };
  email?: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  push?: {
    appId: string;
    restApiKey: string;
  };
}

export interface UserNotificationPrefs {
  userId: string;
  email?: string;
  phoneNumber?: string;
  language: 'ar' | 'en';
  channels: {
    whatsapp: boolean;
    email: boolean;
    push: boolean;
  };
  types: {
    dailyDigest: boolean;
    weeklyDigest: boolean;
    breakingNews: boolean;
    streakReminder: boolean;
  };
}

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  notificationId?: string;
  error?: string;
}

/**
 * Send notification to user via their preferred channels
 */
export async function sendNotification(
  config: NotificationConfig,
  user: UserNotificationPrefs,
  notification: {
    type: 'daily_digest' | 'weekly_digest' | 'breaking_news' | 'streak_reminder';
    data: Record<string, unknown>;
  }
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  // Check if user wants this notification type
  const typeEnabled = {
    daily_digest: user.types.dailyDigest,
    weekly_digest: user.types.weeklyDigest,
    breaking_news: user.types.breakingNews,
    streak_reminder: user.types.streakReminder,
  }[notification.type];

  if (!typeEnabled) {
    return results;
  }

  // Send via each enabled channel
  if (user.channels.whatsapp && user.phoneNumber && config.whatsapp) {
    try {
      let result;
      if (notification.type === 'daily_digest') {
        result = await sendDailyDigestWhatsApp(
          config.whatsapp,
          user.phoneNumber,
          notification.data as any,
          user.language
        );
      } else if (notification.type === 'breaking_news') {
        result = await sendBreakingNewsWhatsApp(
          config.whatsapp,
          user.phoneNumber,
          notification.data as any,
          user.language
        );
      } else {
        result = await sendWhatsAppMessage(config.whatsapp, {
          to: user.phoneNumber,
          message: String(notification.data.message || ''),
        });
      }
      results.push({
        channel: 'whatsapp',
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    } catch (error) {
      results.push({
        channel: 'whatsapp',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (user.channels.email && user.email && config.email) {
    try {
      let emailContent;
      if (notification.type === 'daily_digest') {
        emailContent = generateDailyDigestEmail(notification.data as any, user.language);
      } else if (notification.type === 'weekly_digest') {
        emailContent = generateWeeklyDigestEmail(notification.data as any, user.language);
      } else {
        // Generic email for other types
        emailContent = {
          subject: String(notification.data.subject || 'Safha Notification'),
          html: String(notification.data.html || notification.data.message || ''),
          text: String(notification.data.text || notification.data.message || ''),
        };
      }

      const result = await sendEmail(config.email, {
        to: user.email,
        ...emailContent,
      });
      results.push({
        channel: 'email',
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    } catch (error) {
      results.push({
        channel: 'email',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (user.channels.push && config.push) {
    try {
      let result;
      if (notification.type === 'breaking_news') {
        result = await sendBreakingNewsPush(config.push, notification.data as any);
      } else if (notification.type === 'daily_digest') {
        result = await sendDigestReminderPush(config.push, user.language);
      } else {
        result = await sendPushNotification(config.push, {
          title: String(notification.data.title || 'Safha'),
          message: String(notification.data.message || ''),
          userIds: [user.userId],
        });
      }
      results.push({
        channel: 'push',
        success: result.success,
        notificationId: result.notificationId,
        error: result.error,
      });
    } catch (error) {
      results.push({
        channel: 'push',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
