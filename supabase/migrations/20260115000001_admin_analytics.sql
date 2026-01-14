-- ============================================
-- ADMIN ANALYTICS FUNCTIONS
-- ============================================
-- Date: 2026-01-15
-- Purpose: RPC functions for admin dashboard analytics
-- ============================================

-- 1. Get dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'premium_users', (SELECT COUNT(*) FROM subscriptions WHERE status IN ('active', 'trialing') AND plan != 'free'),
    'users_today', (SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = CURRENT_DATE),
    'active_users_daily', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_story_interactions
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    ),
    'active_users_weekly', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_story_interactions
      WHERE created_at >= NOW() - INTERVAL '7 days'
    ),
    'active_users_monthly', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_story_interactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
    ),
    'total_stories', (SELECT COUNT(*) FROM stories),
    'stories_today', (SELECT COUNT(*) FROM stories WHERE DATE(created_at) = CURRENT_DATE),
    'pending_stories', (SELECT COUNT(*) FROM stories WHERE is_approved = false),
    'total_sources', (SELECT COUNT(*) FROM sources),
    'active_sources', (SELECT COUNT(*) FROM sources WHERE is_active = true),
    'total_topics', (SELECT COUNT(*) FROM topics),
    'active_topics', (SELECT COUNT(*) FROM topics WHERE is_active = true)
  ) INTO result;

  RETURN result;
END;
$$;

-- 2. Get top stories by engagement
CREATE OR REPLACE FUNCTION get_top_stories_by_engagement(
  p_limit INT DEFAULT 10,
  p_days INT DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  title_ar TEXT,
  title_en TEXT,
  original_title TEXT,
  image_url TEXT,
  source_name TEXT,
  view_count INT,
  save_count INT,
  share_count INT,
  engagement_score INT,
  published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title_ar,
    s.title_en,
    s.original_title,
    s.image_url,
    src.name as source_name,
    COALESCE(s.view_count, 0)::INT as view_count,
    COALESCE(s.save_count, 0)::INT as save_count,
    COALESCE(s.share_count, 0)::INT as share_count,
    (COALESCE(s.view_count, 0) + COALESCE(s.save_count, 0) * 3 + COALESCE(s.share_count, 0) * 5)::INT as engagement_score,
    s.published_at
  FROM stories s
  LEFT JOIN sources src ON s.source_id = src.id
  WHERE s.published_at >= NOW() - (p_days || ' days')::INTERVAL
    AND s.is_approved = true
  ORDER BY engagement_score DESC
  LIMIT p_limit;
END;
$$;

-- 3. Get source performance
CREATE OR REPLACE FUNCTION get_source_performance(
  p_limit INT DEFAULT 20,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  source_id UUID,
  source_name TEXT,
  logo_url TEXT,
  language TEXT,
  is_active BOOLEAN,
  story_count BIGINT,
  total_views BIGINT,
  total_saves BIGINT,
  total_shares BIGINT,
  avg_engagement NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    src.id as source_id,
    src.name as source_name,
    src.logo_url,
    src.language,
    src.is_active,
    COUNT(s.id) as story_count,
    COALESCE(SUM(s.view_count), 0) as total_views,
    COALESCE(SUM(s.save_count), 0) as total_saves,
    COALESCE(SUM(s.share_count), 0) as total_shares,
    ROUND(AVG(COALESCE(s.view_count, 0) + COALESCE(s.save_count, 0) * 3 + COALESCE(s.share_count, 0) * 5), 2) as avg_engagement
  FROM sources src
  LEFT JOIN stories s ON src.id = s.source_id
    AND s.published_at >= NOW() - (p_days || ' days')::INTERVAL
    AND s.is_approved = true
  GROUP BY src.id, src.name, src.logo_url, src.language, src.is_active
  ORDER BY total_views DESC
  LIMIT p_limit;
END;
$$;

-- 4. Get user engagement trends (daily data for charts)
CREATE OR REPLACE FUNCTION get_engagement_trends(
  p_days INT DEFAULT 14
)
RETURNS TABLE (
  date DATE,
  active_users BIGINT,
  views BIGINT,
  saves BIGINT,
  shares BIGINT,
  new_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (p_days || ' days')::INTERVAL,
      CURRENT_DATE,
      '1 day'
    )::DATE as date
  ),
  daily_interactions AS (
    SELECT
      DATE(created_at) as date,
      COUNT(DISTINCT user_id) as active_users,
      COUNT(*) FILTER (WHERE interaction_type = 'view') as views,
      COUNT(*) FILTER (WHERE interaction_type = 'save') as saves,
      COUNT(*) FILTER (WHERE interaction_type = 'share') as shares
    FROM user_story_interactions
    WHERE created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    GROUP BY DATE(created_at)
  ),
  daily_signups AS (
    SELECT DATE(created_at) as date, COUNT(*) as new_users
    FROM profiles
    WHERE created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    GROUP BY DATE(created_at)
  )
  SELECT
    ds.date,
    COALESCE(di.active_users, 0) as active_users,
    COALESCE(di.views, 0) as views,
    COALESCE(di.saves, 0) as saves,
    COALESCE(di.shares, 0) as shares,
    COALESCE(du.new_users, 0) as new_users
  FROM date_series ds
  LEFT JOIN daily_interactions di ON ds.date = di.date
  LEFT JOIN daily_signups du ON ds.date = du.date
  ORDER BY ds.date;
END;
$$;

-- 5. Get all topics (including inactive) for admin
CREATE OR REPLACE FUNCTION get_all_topics_admin()
RETURNS SETOF topics
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM topics
  ORDER BY sort_order, name_en;
$$;

-- 6. Update topic details
CREATE OR REPLACE FUNCTION update_topic_admin(
  p_topic_id UUID,
  p_name_ar TEXT DEFAULT NULL,
  p_name_en TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_sort_order INT DEFAULT NULL
)
RETURNS topics
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_topic topics;
BEGIN
  UPDATE topics SET
    name_ar = COALESCE(p_name_ar, name_ar),
    name_en = COALESCE(p_name_en, name_en),
    slug = COALESCE(p_slug, slug),
    icon = COALESCE(p_icon, icon),
    color = COALESCE(p_color, color),
    is_active = COALESCE(p_is_active, is_active),
    sort_order = COALESCE(p_sort_order, sort_order)
  WHERE id = p_topic_id
  RETURNING * INTO updated_topic;

  RETURN updated_topic;
END;
$$;

-- 7. Get source story counts (for enhanced sources page)
CREATE OR REPLACE FUNCTION get_source_story_counts()
RETURNS TABLE (
  source_id UUID,
  story_count BIGINT,
  stories_this_week BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    s.source_id,
    COUNT(*) as story_count,
    COUNT(*) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') as stories_this_week
  FROM stories s
  WHERE s.is_approved = true
  GROUP BY s.source_id;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_stories_by_engagement TO authenticated;
GRANT EXECUTE ON FUNCTION get_source_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_topics_admin TO authenticated;
GRANT EXECUTE ON FUNCTION update_topic_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_source_story_counts TO authenticated;
