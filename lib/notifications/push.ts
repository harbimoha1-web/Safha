// Push Notification Service via OneSignal
// Cross-platform push notifications for iOS and Android

interface OneSignalConfig {
  appId: string;
  restApiKey: string;
}

interface PushNotification {
  title: string;
  message: string;
  data?: Record<string, string>;
  // Target options (one required)
  userIds?: string[]; // External user IDs
  segments?: string[]; // Segment names like "All", "Premium"
  tags?: Record<string, string>; // User tags
  // Optional
  imageUrl?: string;
  url?: string;
  ttl?: number; // Time to live in seconds
}

interface SendResult {
  success: boolean;
  notificationId?: string;
  recipients?: number;
  error?: string;
}

const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

/**
 * Send push notification via OneSignal
 */
export async function sendPushNotification(
  config: OneSignalConfig,
  notification: PushNotification
): Promise<SendResult> {
  try {
    const payload: Record<string, unknown> = {
      app_id: config.appId,
      headings: { en: notification.title, ar: notification.title },
      contents: { en: notification.message, ar: notification.message },
      data: notification.data,
    };

    // Add targeting
    if (notification.userIds && notification.userIds.length > 0) {
      payload.include_external_user_ids = notification.userIds;
    } else if (notification.segments && notification.segments.length > 0) {
      payload.included_segments = notification.segments;
    } else if (notification.tags) {
      payload.filters = Object.entries(notification.tags).map(([key, value]) => ({
        field: 'tag',
        key,
        relation: '=',
        value,
      }));
    } else {
      // Default to all users
      payload.included_segments = ['All'];
    }

    // Add optional fields
    if (notification.imageUrl) {
      payload.big_picture = notification.imageUrl;
      payload.ios_attachments = { id: notification.imageUrl };
    }
    if (notification.url) {
      payload.url = notification.url;
    }
    if (notification.ttl) {
      payload.ttl = notification.ttl;
    }

    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${config.restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      return {
        success: false,
        error: data.errors?.join(', ') || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      notificationId: data.id,
      recipients: data.recipients,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send breaking news push notification
 */
export async function sendBreakingNewsPush(
  config: OneSignalConfig,
  news: {
    storyId: string;
    title: string;
    summary: string;
    imageUrl?: string;
  },
  targetSegments?: string[]
): Promise<SendResult> {
  return sendPushNotification(config, {
    title: '🚨 Breaking News',
    message: news.title,
    data: {
      type: 'breaking_news',
      story_id: news.storyId,
    },
    imageUrl: news.imageUrl,
    url: `safha://story/${news.storyId}`,
    segments: targetSegments || ['Breaking News Subscribers'],
    ttl: 3600, // 1 hour
  });
}

/**
 * Send daily digest reminder push
 */
export async function sendDigestReminderPush(
  config: OneSignalConfig,
  language: 'ar' | 'en'
): Promise<SendResult> {
  const isArabic = language === 'ar';

  return sendPushNotification(config, {
    title: isArabic ? '📰 ملخص اليوم جاهز' : "📰 Today's Digest Ready",
    message: isArabic
      ? 'اطلع على أهم أخبار اليوم في دقيقة واحدة'
      : 'Catch up on today\'s top stories in one minute',
    data: {
      type: 'daily_digest',
    },
    url: 'safha://digest',
    segments: ['Premium'],
  });
}

/**
 * Send streak reminder push
 */
export async function sendStreakReminderPush(
  config: OneSignalConfig,
  userId: string,
  streakDays: number,
  language: 'ar' | 'en'
): Promise<SendResult> {
  const isArabic = language === 'ar';

  return sendPushNotification(config, {
    title: isArabic ? `🔥 سلسلة ${streakDays} يوم!` : `🔥 ${streakDays} Day Streak!`,
    message: isArabic
      ? 'لا تفقد سلسلتك! اقرأ خبراً واحداً اليوم'
      : "Don't lose your streak! Read one story today",
    data: {
      type: 'streak_reminder',
      streak: String(streakDays),
    },
    userIds: [userId],
    url: 'safha://feed',
    ttl: 43200, // 12 hours
  });
}

/**
 * Register user device with OneSignal
 * (Called from mobile app)
 */
export async function setUserTags(
  config: OneSignalConfig,
  playerId: string,
  tags: Record<string, string>
): Promise<SendResult> {
  try {
    const response = await fetch(
      `https://onesignal.com/api/v1/players/${playerId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${config.restApiKey}`,
        },
        body: JSON.stringify({
          app_id: config.appId,
          tags,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.errors?.join(', ') };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
