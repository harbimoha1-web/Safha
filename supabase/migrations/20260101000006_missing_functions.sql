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
