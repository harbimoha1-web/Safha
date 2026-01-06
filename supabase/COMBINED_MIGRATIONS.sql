-- Migration: Add AI fields to stories table
-- Run this on existing databases to add the new AI columns

-- Add AI-generated columns to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS why_it_matters_ar TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS why_it_matters_en TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ai_quality_score NUMERIC(3,2);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create index for approved stories (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_stories_is_approved ON stories(is_approved);
CREATE INDEX IF NOT EXISTS idx_stories_ai_quality ON stories(ai_quality_score DESC);

-- Add role column to profiles for admin access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update RLS policy for admin access to stories
DROP POLICY IF EXISTS "Admins can manage all stories" ON stories;
CREATE POLICY "Admins can manage all stories" ON stories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );
-- Migration: RSS Aggregation Pipeline
-- Tables for automated news ingestion from RSS feeds

-- RSS Sources (News feed sources)
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  website_url TEXT,
  language VARCHAR(2) DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
  category VARCHAR(50),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  reliability_score NUMERIC(3,2) DEFAULT 0.80,
  last_fetched_at TIMESTAMPTZ,
  fetch_interval_minutes INT DEFAULT 30,
  error_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw Articles (Fetched but not yet processed)
CREATE TABLE IF NOT EXISTS raw_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rss_source_id UUID REFERENCES rss_sources(id) ON DELETE CASCADE,
  guid TEXT, -- RSS item GUID for deduplication
  original_url TEXT NOT NULL,
  original_title TEXT,
  original_content TEXT,
  original_description TEXT,
  author TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  -- Processing status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'duplicate', 'rejected')),
  processed_at TIMESTAMPTZ,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  -- Error tracking
  error_message TEXT,
  retry_count INT DEFAULT 0,
  -- Deduplication
  content_hash TEXT, -- Hash for duplicate detection
  UNIQUE(rss_source_id, guid)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_rss_sources_active ON rss_sources(is_active, last_fetched_at);
CREATE INDEX IF NOT EXISTS idx_rss_sources_category ON rss_sources(category);
CREATE INDEX IF NOT EXISTS idx_raw_articles_status ON raw_articles(status, fetched_at);
CREATE INDEX IF NOT EXISTS idx_raw_articles_content_hash ON raw_articles(content_hash);
CREATE INDEX IF NOT EXISTS idx_raw_articles_url ON raw_articles(original_url);

-- RLS Policies
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_articles ENABLE ROW LEVEL SECURITY;

-- Public read access for rss_sources (needed for admin dashboard)
CREATE POLICY "RSS sources viewable by admins" ON rss_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Admin management for rss_sources
CREATE POLICY "RSS sources manageable by admins" ON rss_sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin access for raw_articles
CREATE POLICY "Raw articles viewable by admins" ON raw_articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Raw articles manageable by admins" ON raw_articles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_rss_source_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rss_source_updated ON rss_sources;
CREATE TRIGGER rss_source_updated
  BEFORE UPDATE ON rss_sources
  FOR EACH ROW EXECUTE FUNCTION update_rss_source_timestamp();

-- ============================================
-- SEED DATA: Initial RSS Sources (50+ sources)
-- ============================================

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score) VALUES
  -- Arabic News Sources
  ('الجزيرة', 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4571-a6eb-a8f8b77ea821/73d0e1b4-532f-45ef-b135-bba0a9a5943d', 'https://aljazeera.net', 'ar', 'general', 0.85),
  ('العربية', 'https://www.alarabiya.net/ar/rss.xml', 'https://alarabiya.net', 'ar', 'general', 0.85),
  ('سكاي نيوز عربية', 'https://www.skynewsarabia.com/web/rss', 'https://skynewsarabia.com', 'ar', 'general', 0.82),
  ('BBC عربي', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'https://bbc.com/arabic', 'ar', 'general', 0.90),
  ('CNN بالعربية', 'https://arabic.cnn.com/rss/rss.xml', 'https://arabic.cnn.com', 'ar', 'general', 0.85),
  ('فرانس 24 عربي', 'https://www.france24.com/ar/rss', 'https://france24.com/ar', 'ar', 'general', 0.85),
  ('روسيا اليوم عربي', 'https://arabic.rt.com/rss/', 'https://arabic.rt.com', 'ar', 'general', 0.70),
  ('الشرق الأوسط', 'https://aawsat.com/feed/rss', 'https://aawsat.com', 'ar', 'general', 0.82),
  -- Saudi-specific sources
  ('عكاظ', 'https://www.okaz.com.sa/rss', 'https://okaz.com.sa', 'ar', 'saudi', 0.80),
  ('الرياض', 'https://www.alriyadh.com/rss.xml', 'https://alriyadh.com', 'ar', 'saudi', 0.80),
  ('الوطن السعودية', 'https://www.alwatan.com.sa/rss', 'https://alwatan.com.sa', 'ar', 'saudi', 0.78),
  ('سبق', 'https://sabq.org/rss', 'https://sabq.org', 'ar', 'saudi', 0.75),
  ('أرقام', 'https://www.argaam.com/ar/rss/articles', 'https://argaam.com', 'ar', 'economy', 0.85),
  -- Technology
  ('البوابة العربية للأخبار التقنية', 'https://aitnews.com/feed/', 'https://aitnews.com', 'ar', 'technology', 0.80),
  ('عالم التقنية', 'https://www.tech-wd.com/wd/feed/', 'https://tech-wd.com', 'ar', 'technology', 0.78),
  ('التقنية بلا حدود', 'https://www.unlimit-tech.com/feed/', 'https://unlimit-tech.com', 'ar', 'technology', 0.75),
  -- Sports
  ('كورة', 'https://www.kooora.com/rss/', 'https://kooora.com', 'ar', 'sports', 0.80),
  ('الرياضية السعودية', 'https://www.arriyadiyah.com/rss', 'https://arriyadiyah.com', 'ar', 'sports', 0.78),
  -- English News Sources
  ('Reuters', 'https://www.reutersagency.com/feed/', 'https://reuters.com', 'en', 'general', 0.92),
  ('Associated Press', 'https://rsshub.app/apnews/topics/apf-topnews', 'https://apnews.com', 'en', 'general', 0.90),
  ('BBC News', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'https://bbc.com/news', 'en', 'general', 0.90),
  ('The Guardian', 'https://www.theguardian.com/world/rss', 'https://theguardian.com', 'en', 'general', 0.88),
  ('Al Jazeera English', 'https://www.aljazeera.com/xml/rss/all.xml', 'https://aljazeera.com', 'en', 'general', 0.85),
  ('CNN', 'http://rss.cnn.com/rss/edition.rss', 'https://cnn.com', 'en', 'general', 0.85),
  ('NPR', 'https://feeds.npr.org/1001/rss.xml', 'https://npr.org', 'en', 'general', 0.88),
  -- English Technology
  ('TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'en', 'technology', 0.85),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'https://theverge.com', 'en', 'technology', 0.85),
  ('Wired', 'https://www.wired.com/feed/rss', 'https://wired.com', 'en', 'technology', 0.85),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'https://arstechnica.com', 'en', 'technology', 0.88),
  ('MIT Technology Review', 'https://www.technologyreview.com/feed/', 'https://technologyreview.com', 'en', 'technology', 0.90),
  -- English Business/Economy
  ('Bloomberg', 'https://feeds.bloomberg.com/markets/news.rss', 'https://bloomberg.com', 'en', 'economy', 0.90),
  ('Financial Times', 'https://www.ft.com/rss/home', 'https://ft.com', 'en', 'economy', 0.92),
  ('Wall Street Journal', 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', 'https://wsj.com', 'en', 'economy', 0.90),
  ('CNBC', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'https://cnbc.com', 'en', 'economy', 0.85),
  -- English Sports
  ('ESPN', 'https://www.espn.com/espn/rss/news', 'https://espn.com', 'en', 'sports', 0.85),
  ('BBC Sport', 'https://feeds.bbci.co.uk/sport/rss.xml', 'https://bbc.com/sport', 'en', 'sports', 0.88),
  -- Science
  ('Nature', 'https://www.nature.com/nature.rss', 'https://nature.com', 'en', 'science', 0.95),
  ('Science Daily', 'https://www.sciencedaily.com/rss/all.xml', 'https://sciencedaily.com', 'en', 'science', 0.88),
  ('New Scientist', 'https://www.newscientist.com/feed/home/', 'https://newscientist.com', 'en', 'science', 0.85),
  -- Health
  ('Medical News Today', 'https://www.medicalnewstoday.com/rss', 'https://medicalnewstoday.com', 'en', 'health', 0.85),
  ('WHO News', 'https://www.who.int/rss-feeds/news-english.xml', 'https://who.int', 'en', 'health', 0.95),
  -- Middle East specific English
  ('Arab News', 'https://www.arabnews.com/rss.xml', 'https://arabnews.com', 'en', 'saudi', 0.82),
  ('Gulf News', 'https://gulfnews.com/rss', 'https://gulfnews.com', 'en', 'general', 0.80),
  ('Middle East Eye', 'https://www.middleeasteye.net/rss', 'https://middleeasteye.net', 'en', 'general', 0.78)
ON CONFLICT (feed_url) DO NOTHING;
-- Migration: Notifications & Subscriptions
-- Tables for notification logs and premium subscriptions

-- ============================================
-- NOTIFICATION LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'email', 'push')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('daily_digest', 'weekly_digest', 'breaking_news', 'streak_reminder', 'welcome', 'subscription')),
  content JSONB,
  external_id VARCHAR(255), -- Provider's message ID
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status, sent_at);

-- ============================================
-- SUBSCRIPTIONS (Premium)
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'premium_annual')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
  -- Moyasar integration
  moyasar_customer_id VARCHAR(255),
  moyasar_subscription_id VARCHAR(255),
  -- Billing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status, current_period_end);

-- ============================================
-- PAYMENT HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SAR',
  payment_method VARCHAR(50), -- 'mada', 'visa', 'mastercard', 'applepay', 'stcpay'
  -- Moyasar
  moyasar_payment_id VARCHAR(255),
  moyasar_invoice_id VARCHAR(255),
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'disputed')),
  failure_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id, created_at DESC);

-- ============================================
-- UPDATE PROFILES TABLE
-- ============================================

-- Add phone number and WhatsApp opt-in
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_opted_in BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Add subscription reference
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free';

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users view own notifications" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own subscription
CREATE POLICY "Users view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own payment history
CREATE POLICY "Users view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins manage subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is premium
CREATE OR REPLACE FUNCTION is_premium(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sub_status VARCHAR;
  sub_end TIMESTAMPTZ;
BEGIN
  SELECT status, current_period_end INTO sub_status, sub_end
  FROM subscriptions
  WHERE user_id = user_uuid;

  IF sub_status IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN sub_status = 'active' AND (sub_end IS NULL OR sub_end > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's topic limit (free = 5, premium = unlimited)
CREATE OR REPLACE FUNCTION get_topic_limit(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  IF is_premium(user_uuid) THEN
    RETURN 999; -- Effectively unlimited
  ELSE
    RETURN 5;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update subscription timestamp trigger
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscription_updated ON subscriptions;
CREATE TRIGGER subscription_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_timestamp();

-- Sync subscription plan to profile
CREATE OR REPLACE FUNCTION sync_subscription_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET subscription_plan = NEW.plan
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS subscription_plan_sync ON subscriptions;
CREATE TRIGGER subscription_plan_sync
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_to_profile();
-- Migration: Gamification System
-- User stats, achievements, and streaks

-- ============================================
-- USER STATS
-- ============================================

CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Streaks
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  -- Reading stats
  total_stories_read INT DEFAULT 0,
  total_time_spent_minutes INT DEFAULT 0,
  stories_read_this_week INT DEFAULT 0,
  stories_read_this_month INT DEFAULT 0,
  -- Engagement
  total_saves INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  icon VARCHAR(50),
  category VARCHAR(50) DEFAULT 'general',
  points INT DEFAULT 0,
  requirement_type VARCHAR(50) NOT NULL, -- 'streak', 'stories_read', 'saves', 'shares', 'premium'
  requirement_value INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_stats_streak ON user_stats(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Achievements viewable by all" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Users view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update streak on story read
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS void AS $$
DECLARE
  last_date DATE;
  today DATE := CURRENT_DATE;
BEGIN
  SELECT last_active_date INTO last_date
  FROM user_stats WHERE user_id = user_uuid;

  IF last_date IS NULL THEN
    -- First time user
    INSERT INTO user_stats (user_id, current_streak, last_active_date)
    VALUES (user_uuid, 1, today)
    ON CONFLICT (user_id) DO UPDATE
    SET current_streak = 1, last_active_date = today;
  ELSIF last_date = today THEN
    -- Already active today, do nothing
    NULL;
  ELSIF last_date = today - 1 THEN
    -- Consecutive day, increment streak
    UPDATE user_stats
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_active_date = today,
        updated_at = NOW()
    WHERE user_id = user_uuid;
  ELSE
    -- Streak broken, reset to 1
    UPDATE user_stats
    SET current_streak = 1,
        last_active_date = today,
        updated_at = NOW()
    WHERE user_id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(user_uuid UUID)
RETURNS TABLE(achievement_code VARCHAR, achievement_name_en VARCHAR) AS $$
BEGIN
  RETURN QUERY
  WITH user_data AS (
    SELECT
      s.current_streak,
      s.total_stories_read,
      s.total_saves,
      s.total_shares,
      COALESCE(sub.plan, 'free') as plan
    FROM user_stats s
    LEFT JOIN subscriptions sub ON sub.user_id = s.user_id
    WHERE s.user_id = user_uuid
  ),
  new_achievements AS (
    SELECT a.id, a.code, a.name_en
    FROM achievements a
    CROSS JOIN user_data u
    WHERE a.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = user_uuid AND ua.achievement_id = a.id
    )
    AND (
      (a.requirement_type = 'streak' AND u.current_streak >= a.requirement_value)
      OR (a.requirement_type = 'stories_read' AND u.total_stories_read >= a.requirement_value)
      OR (a.requirement_type = 'saves' AND u.total_saves >= a.requirement_value)
      OR (a.requirement_type = 'shares' AND u.total_shares >= a.requirement_value)
      OR (a.requirement_type = 'premium' AND u.plan IN ('premium', 'premium_annual'))
    )
  )
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT user_uuid, id FROM new_achievements
  ON CONFLICT DO NOTHING
  RETURNING code, name_en;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED: ACHIEVEMENTS
-- ============================================

INSERT INTO achievements (code, name_ar, name_en, description_ar, description_en, icon, category, requirement_type, requirement_value, points, sort_order) VALUES
  -- Streak achievements
  ('streak_3', 'قارئ منتظم', 'Regular Reader', 'اقرأ 3 أيام متتالية', 'Read for 3 consecutive days', 'fire', 'streak', 'streak', 3, 10, 1),
  ('streak_7', 'أسبوع كامل', 'Week Warrior', 'اقرأ 7 أيام متتالية', 'Read for 7 consecutive days', 'fire', 'streak', 'streak', 7, 25, 2),
  ('streak_30', 'شهر متواصل', 'Monthly Champion', 'اقرأ 30 يوم متتالي', 'Read for 30 consecutive days', 'trophy', 'streak', 'streak', 30, 100, 3),
  ('streak_100', 'محترف', 'Century Reader', 'اقرأ 100 يوم متتالي', 'Read for 100 consecutive days', 'crown', 'streak', 'streak', 100, 500, 4),

  -- Reading achievements
  ('read_10', 'بداية جيدة', 'Good Start', 'اقرأ 10 أخبار', 'Read 10 stories', 'book', 'reading', 'stories_read', 10, 10, 5),
  ('read_50', 'قارئ نهم', 'Avid Reader', 'اقرأ 50 خبر', 'Read 50 stories', 'book', 'reading', 'stories_read', 50, 25, 6),
  ('read_100', 'مثقف', 'Well-Informed', 'اقرأ 100 خبر', 'Read 100 stories', 'graduation-cap', 'reading', 'stories_read', 100, 50, 7),
  ('read_500', 'خبير أخبار', 'News Expert', 'اقرأ 500 خبر', 'Read 500 stories', 'star', 'reading', 'stories_read', 500, 200, 8),

  -- Engagement achievements
  ('first_save', 'أول إشارة', 'First Bookmark', 'احفظ أول خبر', 'Save your first story', 'bookmark', 'engagement', 'saves', 1, 5, 9),
  ('save_25', 'جامع الأخبار', 'Story Collector', 'احفظ 25 خبر', 'Save 25 stories', 'bookmark', 'engagement', 'saves', 25, 25, 10),
  ('first_share', 'ناشر الأخبار', 'News Sharer', 'شارك أول خبر', 'Share your first story', 'share', 'engagement', 'shares', 1, 5, 11),
  ('share_10', 'مؤثر', 'Influencer', 'شارك 10 أخبار', 'Share 10 stories', 'share', 'engagement', 'shares', 10, 25, 12),

  -- Premium
  ('premium_member', 'عضو مميز', 'Premium Member', 'اشترك في الباقة المميزة', 'Subscribe to Premium', 'diamond', 'premium', 'premium', 1, 50, 13)
ON CONFLICT (code) DO NOTHING;
-- Migration: Missing Functions & Improvements
-- Adds increment_story_count_stat and other missing RPC functions

-- ============================================
-- INCREMENT STORY COUNT STAT
-- Called when user reads a story to update their stats
-- ============================================

CREATE OR REPLACE FUNCTION increment_story_count_stat(user_uuid UUID)
RETURNS void AS $$
BEGIN
  -- First ensure the user has a stats record
  INSERT INTO user_stats (user_id, total_stories_read)
  VALUES (user_uuid, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_stories_read = user_stats.total_stories_read + 1,
    stories_read_this_week = user_stats.stories_read_this_week + 1,
    stories_read_this_month = user_stats.stories_read_this_month + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INCREMENT SAVE COUNT STAT
-- ============================================

CREATE OR REPLACE FUNCTION increment_save_stat(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_stats
  SET
    total_saves = total_saves + 1,
    updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INCREMENT SHARE COUNT STAT
-- ============================================

CREATE OR REPLACE FUNCTION increment_share_stat(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_stats
  SET
    total_shares = total_shares + 1,
    updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RESET WEEKLY/MONTHLY STATS
-- Should be called by a cron job
-- ============================================

CREATE OR REPLACE FUNCTION reset_weekly_stats()
RETURNS void AS $$
BEGIN
  UPDATE user_stats SET stories_read_this_week = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_monthly_stats()
RETURNS void AS $$
BEGIN
  UPDATE user_stats SET stories_read_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE USER STREAK (Improved with timezone awareness)
-- ============================================

CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS void AS $$
DECLARE
  last_date DATE;
  today DATE := CURRENT_DATE AT TIME ZONE 'Asia/Riyadh'; -- Saudi Arabia timezone
BEGIN
  SELECT last_active_date INTO last_date
  FROM user_stats WHERE user_id = user_uuid;

  IF last_date IS NULL THEN
    -- First time user - create record with streak = 1
    INSERT INTO user_stats (user_id, current_streak, longest_streak, last_active_date)
    VALUES (user_uuid, 1, 1, today)
    ON CONFLICT (user_id) DO UPDATE
    SET current_streak = 1,
        longest_streak = GREATEST(user_stats.longest_streak, 1),
        last_active_date = today,
        updated_at = NOW();
  ELSIF last_date = today THEN
    -- Already active today, do nothing
    NULL;
  ELSIF last_date = today - 1 THEN
    -- Consecutive day, increment streak
    UPDATE user_stats
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_active_date = today,
        updated_at = NOW()
    WHERE user_id = user_uuid;
  ELSE
    -- Streak broken, reset to 1
    UPDATE user_stats
    SET current_streak = 1,
        last_active_date = today,
        updated_at = NOW()
    WHERE user_id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET USER STREAK STATUS
-- Returns current streak and whether it's at risk
-- ============================================

CREATE OR REPLACE FUNCTION get_streak_status(user_uuid UUID)
RETURNS TABLE(
  current_streak INT,
  longest_streak INT,
  is_at_risk BOOLEAN,
  hours_until_loss INT
) AS $$
DECLARE
  last_date DATE;
  today DATE := CURRENT_DATE AT TIME ZONE 'Asia/Riyadh';
BEGIN
  SELECT us.current_streak, us.longest_streak, us.last_active_date
  INTO current_streak, longest_streak, last_date
  FROM user_stats us WHERE us.user_id = user_uuid;

  IF last_date IS NULL OR current_streak IS NULL THEN
    RETURN QUERY SELECT 0, 0, FALSE, 0;
    RETURN;
  END IF;

  -- Calculate hours until streak would be lost (midnight + some buffer)
  IF last_date = today THEN
    -- Already read today, streak safe until tomorrow
    is_at_risk := FALSE;
    hours_until_loss := 24 + EXTRACT(HOUR FROM (DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Riyadh' + INTERVAL '1 day') - (NOW() AT TIME ZONE 'Asia/Riyadh')));
  ELSIF last_date = today - 1 THEN
    -- Last read yesterday, streak at risk
    is_at_risk := TRUE;
    hours_until_loss := EXTRACT(HOUR FROM (DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Riyadh' + INTERVAL '1 day') - (NOW() AT TIME ZONE 'Asia/Riyadh')));
  ELSE
    -- Streak already broken
    current_streak := 0;
    is_at_risk := FALSE;
    hours_until_loss := 0;
  END IF;

  RETURN QUERY SELECT current_streak, longest_streak, is_at_risk, hours_until_loss;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INSERT POLICY FOR USER STATS
-- Allow users to insert their own stats record
-- ============================================

-- Drop and recreate policies if they exist
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;
CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INSERT POLICY FOR SUBSCRIPTIONS
-- Allow users to create their own subscription
-- ============================================

DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stories_source_id ON stories(source_id);
CREATE INDEX IF NOT EXISTS idx_stories_ai_quality_score ON stories(ai_quality_score DESC) WHERE ai_quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_interactions_story_id ON user_story_interactions(story_id, created_at DESC);
