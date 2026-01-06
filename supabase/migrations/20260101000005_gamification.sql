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

DROP POLICY IF EXISTS "Users view own stats" ON user_stats;
CREATE POLICY "Users view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own stats" ON user_stats;
CREATE POLICY "Users update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Achievements viewable by all" ON achievements;
CREATE POLICY "Achievements viewable by all" ON achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own achievements" ON user_achievements;
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
