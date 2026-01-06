// WhatsApp Notification Service via Taqnyat
// Saudi-approved WhatsApp Business API provider

interface TaqnyatConfig {
  apiKey: string;
  senderName: string;
}

interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., +966501234567)
  message: string;
  templateId?: string;
  templateParams?: Record<string, string>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const TAQNYAT_API_URL = 'https://api.taqnyat.sa/v1/messages';

/**
 * Send WhatsApp message via Taqnyat API
 */
export async function sendWhatsAppMessage(
  config: TaqnyatConfig,
  message: WhatsAppMessage
): Promise<SendResult> {
  try {
    // Format phone number (ensure +966 prefix for Saudi)
    let phoneNumber = message.to.replace(/\s+/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+966' + phoneNumber.slice(1);
    } else if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }

    const payload = {
      sender: config.senderName,
      recipients: phoneNumber,
      body: message.message,
      ...(message.templateId && {
        templateId: message.templateId,
        templateParams: message.templateParams,
      }),
    };

    const response = await fetch(TAQNYAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
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
      messageId: data.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send daily digest via WhatsApp
 */
export async function sendDailyDigestWhatsApp(
  config: TaqnyatConfig,
  phoneNumber: string,
  digest: {
    greeting: string;
    stories: Array<{ title: string; summary: string }>;
    date: string;
  },
  language: 'ar' | 'en'
): Promise<SendResult> {
  const isArabic = language === 'ar';

  // Format digest message
  let message = isArabic
    ? `📰 *ملخص اليوم - ${digest.date}*\n\n${digest.greeting}\n\n`
    : `📰 *Today's Summary - ${digest.date}*\n\n${digest.greeting}\n\n`;

  digest.stories.slice(0, 5).forEach((story, index) => {
    message += `*${index + 1}. ${story.title}*\n${story.summary}\n\n`;
  });

  message += isArabic
    ? '\n📱 افتح تطبيق صفحة لقراءة المزيد'
    : '\n📱 Open Safha app to read more';

  return sendWhatsAppMessage(config, {
    to: phoneNumber,
    message,
  });
}

/**
 * Send breaking news alert via WhatsApp
 */
export async function sendBreakingNewsWhatsApp(
  config: TaqnyatConfig,
  phoneNumber: string,
  news: {
    title: string;
    summary: string;
    whyItMatters: string;
  },
  language: 'ar' | 'en'
): Promise<SendResult> {
  const isArabic = language === 'ar';

  const message = isArabic
    ? `🚨 *خبر عاجل*\n\n*${news.title}*\n\n${news.summary}\n\n💡 *لماذا يهمك:* ${news.whyItMatters}\n\n📱 افتح صفحة للتفاصيل`
    : `🚨 *Breaking News*\n\n*${news.title}*\n\n${news.summary}\n\n💡 *Why it matters:* ${news.whyItMatters}\n\n📱 Open Safha for details`;

  return sendWhatsAppMessage(config, {
    to: phoneNumber,
    message,
  });
}

/**
 * Validate Saudi phone number format
 */
export function isValidSaudiPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, '');
  // Saudi mobile: +966 5X XXX XXXX or 05X XXX XXXX
  return /^(\+966|00966|0)?5[0-9]{8}$/.test(cleaned);
}
