// Email Notification Service via Resend
// Modern email API for transactional emails

interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Send email via Resend API
 */
export async function sendEmail(
  config: ResendConfig,
  message: EmailMessage
): Promise<SendResult> {
  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate weekly digest email HTML
 */
export function generateWeeklyDigestEmail(
  digest: {
    userName: string;
    stories: Array<{
      title: string;
      summary: string;
      whyItMatters: string;
      imageUrl?: string;
      category: string;
    }>;
    weekRange: string;
    stats: {
      storiesRead: number;
      streak: number;
    };
  },
  language: 'ar' | 'en'
): { subject: string; html: string; text: string } {
  const isArabic = language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';

  const subject = isArabic
    ? `📰 الملخص الأسبوعي - ${digest.weekRange}`
    : `📰 Weekly Digest - ${digest.weekRange}`;

  const greeting = isArabic
    ? `مرحباً ${digest.userName}،`
    : `Hi ${digest.userName},`;

  const intro = isArabic
    ? 'إليك أهم الأخبار من هذا الأسبوع:'
    : "Here are this week's top stories:";

  const storiesHtml = digest.stories.map((story, i) => `
    <tr>
      <td style="padding: 20px 0; border-bottom: 1px solid #eee;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${story.imageUrl ? `
            <td width="120" style="vertical-align: top; padding-${isArabic ? 'left' : 'right'}: 15px;">
              <img src="${story.imageUrl}" alt="" width="120" style="border-radius: 8px;">
            </td>
            ` : ''}
            <td style="vertical-align: top;">
              <span style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 12px; color: #666;">${story.category}</span>
              <h3 style="margin: 8px 0; color: #1a1a1a; font-size: 18px;">${story.title}</h3>
              <p style="margin: 0 0 8px; color: #444; font-size: 14px; line-height: 1.5;">${story.summary}</p>
              <p style="margin: 0; color: #d4a017; font-size: 13px;">💡 ${story.whyItMatters}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const statsText = isArabic
    ? `قرأت ${digest.stats.storiesRead} خبر هذا الأسبوع • سلسلة ${digest.stats.streak} يوم 🔥`
    : `You read ${digest.stats.storiesRead} stories this week • ${digest.stats.streak} day streak 🔥`;

  const html = `
<!DOCTYPE html>
<html dir="${dir}" lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 28px;">📰 Safha</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                ${isArabic ? 'الملخص الأسبوعي' : 'Weekly Digest'}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333;">${greeting}</p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #666;">${intro}</p>

              <!-- Stats Badge -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
                <span style="color: #666; font-size: 14px;">${statsText}</span>
              </div>

              <!-- Stories -->
              <table width="100%" cellpadding="0" cellspacing="0">
                ${storiesHtml}
              </table>

              <!-- CTA -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://safha.app" style="display: inline-block; background: #d4a017; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  ${isArabic ? 'افتح التطبيق' : 'Open App'}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                ${isArabic
                  ? 'أنت تتلقى هذا لأنك مشترك في صفحة. لإلغاء الاشتراك، قم بتحديث إعدادات الإشعارات في التطبيق.'
                  : 'You received this because you subscribed to Safha. To unsubscribe, update your notification settings in the app.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${greeting}\n\n${intro}\n\n${digest.stories.map((s, i) =>
    `${i + 1}. ${s.title}\n${s.summary}\n💡 ${s.whyItMatters}\n`
  ).join('\n')}\n\n${statsText}\n\nOpen Safha: https://safha.app`;

  return { subject, html, text };
}

/**
 * Generate daily digest email HTML
 */
export function generateDailyDigestEmail(
  digest: {
    userName: string;
    stories: Array<{
      title: string;
      summary: string;
      whyItMatters: string;
    }>;
    date: string;
  },
  language: 'ar' | 'en'
): { subject: string; html: string; text: string } {
  const isArabic = language === 'ar';

  const subject = isArabic
    ? `📰 ملخص اليوم - ${digest.date}`
    : `📰 Today's Summary - ${digest.date}`;

  const html = `
<!DOCTYPE html>
<html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${language}">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px;">
    <h1 style="color: #1a1a2e; margin: 0 0 20px;">📰 ${isArabic ? 'ملخص اليوم' : "Today's Summary"}</h1>
    <p style="color: #666; margin: 0 0 20px;">${isArabic ? `مرحباً ${digest.userName}،` : `Hi ${digest.userName},`}</p>

    ${digest.stories.map((story, i) => `
      <div style="padding: 16px 0; border-bottom: 1px solid #eee;">
        <h3 style="margin: 0 0 8px; color: #333;">${story.title}</h3>
        <p style="margin: 0 0 8px; color: #666; font-size: 14px;">${story.summary}</p>
        <p style="margin: 0; color: #d4a017; font-size: 13px;">💡 ${story.whyItMatters}</p>
      </div>
    `).join('')}

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://safha.app" style="background: #d4a017; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        ${isArabic ? 'اقرأ المزيد' : 'Read More'}
      </a>
    </div>
  </div>
</body>
</html>`;

  const text = digest.stories.map((s, i) =>
    `${i + 1}. ${s.title}\n${s.summary}\n💡 ${s.whyItMatters}`
  ).join('\n\n');

  return { subject, html, text };
}
