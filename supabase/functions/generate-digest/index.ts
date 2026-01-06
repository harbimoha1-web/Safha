// Supabase Edge Function: Generate Daily/Weekly Digests
// Creates personalized digests and sends via WhatsApp/Email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DigestRequest {
  type: 'daily' | 'weekly';
  userId?: string; // Optional: specific user, otherwise all eligible users
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  language: 'ar' | 'en';
  notification_preferences: {
    daily_digest: boolean;
    weekly_summary: boolean;
    email_enabled: boolean;
    push_enabled: boolean;
  };
  selected_topics: string[];
  subscription_plan: string;
  whatsapp_opted_in: boolean;
}

interface Story {
  id: string;
  title_ar: string;
  title_en: string;
  summary_ar: string;
  summary_en: string;
  why_it_matters_ar: string;
  why_it_matters_en: string;
  image_url: string;
  topic_ids: string[];
  ai_quality_score: number;
  topics: Array<{ name_ar: string; name_en: string }>;
}

// Email template for digest
function generateEmailHtml(
  user: UserProfile,
  stories: Story[],
  type: 'daily' | 'weekly',
  dateRange: string
): string {
  const isArabic = user.language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';

  const title = type === 'daily'
    ? (isArabic ? 'ملخص اليوم' : "Today's Digest")
    : (isArabic ? 'الملخص الأسبوعي' : 'Weekly Digest');

  const storiesHtml = stories.map((story, i) => {
    const storyTitle = isArabic ? story.title_ar : story.title_en;
    const summary = isArabic ? story.summary_ar : story.summary_en;
    const whyItMatters = isArabic ? story.why_it_matters_ar : story.why_it_matters_en;
    const category = story.topics?.[0]
      ? (isArabic ? story.topics[0].name_ar : story.topics[0].name_en)
      : '';

    return `
      <div style="padding: 16px 0; border-bottom: 1px solid #eee;">
        <span style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: #666;">${category}</span>
        <h3 style="margin: 8px 0; font-size: 16px; color: #1a1a1a;">${storyTitle}</h3>
        <p style="margin: 0 0 8px; font-size: 14px; color: #444; line-height: 1.5;">${summary}</p>
        ${whyItMatters ? `<p style="margin: 0; font-size: 13px; color: #d4a017;">💡 ${whyItMatters}</p>` : ''}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${user.language}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-size: 24px;">📰 ${title}</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">${dateRange}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <p style="margin: 0 0 16px; font-size: 15px; color: #333;">
              ${isArabic ? `مرحباً ${user.full_name || ''},` : `Hi ${user.full_name || ''},`}
            </p>
            ${storiesHtml}
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://safha.app" style="display: inline-block; background: #d4a017; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600;">
                ${isArabic ? 'افتح التطبيق' : 'Open App'}
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #999; font-size: 11px;">Safha - ${isArabic ? 'أخبارك في ثوانٍ' : 'Your news in seconds'}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// WhatsApp message for digest
function generateWhatsAppMessage(
  user: UserProfile,
  stories: Story[],
  type: 'daily' | 'weekly',
  dateRange: string
): string {
  const isArabic = user.language === 'ar';

  const title = type === 'daily'
    ? (isArabic ? '📰 *ملخص اليوم*' : "📰 *Today's Digest*")
    : (isArabic ? '📰 *الملخص الأسبوعي*' : '📰 *Weekly Digest*');

  const greeting = isArabic
    ? `مرحباً ${user.full_name || ''}،`
    : `Hi ${user.full_name || ''},`;

  let message = `${title}\n${dateRange}\n\n${greeting}\n\n`;

  stories.slice(0, 5).forEach((story, i) => {
    const storyTitle = isArabic ? story.title_ar : story.title_en;
    const summary = isArabic ? story.summary_ar : story.summary_en;
    message += `*${i + 1}. ${storyTitle}*\n${summary}\n\n`;
  });

  message += isArabic
    ? '\n📱 افتح صفحة للمزيد'
    : '\n📱 Open Safha for more';

  return message;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const taqnyatApiKey = Deno.env.get('TAQNYAT_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { type, userId }: DigestRequest = await req.json();

    if (!type || !['daily', 'weekly'].includes(type)) {
      throw new Error('Invalid digest type');
    }

    // Get eligible users
    let usersQuery = supabase
      .from('profiles')
      .select('*')
      .eq(type === 'daily' ? 'notification_preferences->daily_digest' : 'notification_preferences->weekly_summary', true);

    // For premium features, filter by subscription
    if (type === 'daily') {
      usersQuery = usersQuery.in('subscription_plan', ['premium', 'premium_annual']);
    }

    if (userId) {
      usersQuery = usersQuery.eq('id', userId);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No eligible users', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get date range
    const now = new Date();
    let dateRange: string;
    let storiesFrom: Date;

    if (type === 'daily') {
      dateRange = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      storiesFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateRange = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      storiesFrom = weekAgo;
    }

    // Results tracking
    const results = {
      total_users: users.length,
      emails_sent: 0,
      whatsapp_sent: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const user of users as UserProfile[]) {
      try {
        // Get top stories for user's topics
        let storiesQuery = supabase
          .from('stories')
          .select(`
            id, title_ar, title_en, summary_ar, summary_en,
            why_it_matters_ar, why_it_matters_en, image_url,
            topic_ids, ai_quality_score,
            topics:topics(name_ar, name_en)
          `)
          .eq('is_approved', true)
          .gte('published_at', storiesFrom.toISOString())
          .order('ai_quality_score', { ascending: false })
          .limit(type === 'daily' ? 5 : 10);

        // Filter by user's topics if they have any
        if (user.selected_topics && user.selected_topics.length > 0) {
          storiesQuery = storiesQuery.overlaps('topic_ids', user.selected_topics);
        }

        const { data: stories, error: storiesError } = await storiesQuery;

        if (storiesError || !stories || stories.length === 0) {
          continue; // Skip user if no stories
        }

        // Send email if enabled
        if (user.notification_preferences.email_enabled && user.email && resendApiKey) {
          const emailHtml = generateEmailHtml(user, stories as Story[], type, dateRange);

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'Safha <digest@safha.app>',
              to: user.email,
              subject: type === 'daily' ? `📰 ${dateRange}` : `📰 Weekly Digest - ${dateRange}`,
              html: emailHtml,
            }),
          });

          if (emailResponse.ok) {
            results.emails_sent++;

            // Log notification
            await supabase.from('notification_logs').insert({
              user_id: user.id,
              channel: 'email',
              type: type === 'daily' ? 'daily_digest' : 'weekly_digest',
              status: 'sent',
            });
          }
        }

        // Send WhatsApp if enabled (weekly only and opted in)
        if (type === 'weekly' && user.whatsapp_opted_in && user.phone_number && taqnyatApiKey) {
          const whatsappMessage = generateWhatsAppMessage(user, stories as Story[], type, dateRange);

          const whatsappResponse = await fetch('https://api.taqnyat.sa/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${taqnyatApiKey}`,
            },
            body: JSON.stringify({
              sender: 'Safha',
              recipients: user.phone_number,
              body: whatsappMessage,
            }),
          });

          if (whatsappResponse.ok) {
            results.whatsapp_sent++;

            await supabase.from('notification_logs').insert({
              user_id: user.id,
              channel: 'whatsapp',
              type: 'weekly_digest',
              status: 'sent',
            });
          }
        }

      } catch (userError) {
        results.errors.push(`User ${user.id}: ${userError.message}`);
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Digest generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
