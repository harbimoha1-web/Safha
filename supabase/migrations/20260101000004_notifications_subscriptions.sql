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
