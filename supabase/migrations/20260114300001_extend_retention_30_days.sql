-- ============================================
-- EXTEND RETENTION WINDOW FROM 5 TO 30 DAYS
-- ============================================
-- Date: 2026-01-14
-- Reason: 5-day window too aggressive, users running out of content
-- This gives users 30 days of stories before they "catch up"
-- ============================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_unseen_stories(UUID, INT, INT, UUID[], UUID[]);

-- Recreate with 30-day retention
CREATE FUNCTION get_unseen_stories(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_topic_ids UUID[] DEFAULT NULL,
  p_blocked_source_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_id UUID,
  original_url TEXT,
  original_title TEXT,
  original_description TEXT,
  title_ar TEXT,
  title_en TEXT,
  summary_ar TEXT,
  summary_en TEXT,
  full_content TEXT,
  content_quality NUMERIC,
  why_it_matters_ar TEXT,
  why_it_matters_en TEXT,
  ai_quality_score NUMERIC,
  image_url TEXT,
  video_url TEXT,
  video_type TEXT,
  topic_ids UUID[],
  published_at TIMESTAMPTZ,
  is_approved BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.id,
    s.source_id,
    s.original_url,
    s.original_title,
    s.original_description,
    s.title_ar,
    s.title_en,
    s.summary_ar,
    s.summary_en,
    s.full_content,
    s.content_quality,
    s.why_it_matters_ar,
    s.why_it_matters_en,
    s.ai_quality_score,
    s.image_url,
    s.video_url,
    s.video_type,
    s.topic_ids,
    s.published_at,
    s.is_approved,
    s.created_at
  FROM stories s
  WHERE
    -- FILTER 1: Not seen by user (view OR skip)
    NOT EXISTS (
      SELECT 1 FROM user_story_interactions usi
      WHERE usi.user_id = p_user_id
        AND usi.story_id = s.id
        AND usi.interaction_type IN ('view', 'skip')
    )
    -- FILTER 2: 30-day retention (extended from 5 days)
    AND (s.published_at > NOW() - INTERVAL '30 days' OR s.published_at IS NULL)
    -- FILTER 3: Topic filter (include NULL/empty topic_ids)
    AND (
      p_topic_ids IS NULL
      OR s.topic_ids && p_topic_ids
      OR s.topic_ids IS NULL
      OR array_length(s.topic_ids, 1) IS NULL
    )
    -- FILTER 4: Blocked sources
    AND (p_blocked_source_ids IS NULL OR s.source_id != ALL(p_blocked_source_ids))
    -- FILTER 5: Only approved stories
    AND s.is_approved = true
  ORDER BY
    -- 24-hour tiering: Recent stories first
    CASE WHEN s.published_at > NOW() - INTERVAL '24 hours' THEN 0 ELSE 1 END,
    s.published_at DESC NULLS LAST,
    s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Also update get_new_story_count to use 30 days
DROP FUNCTION IF EXISTS get_new_story_count(UUID, TIMESTAMPTZ, UUID[]);

CREATE FUNCTION get_new_story_count(
  p_user_id UUID,
  p_since TIMESTAMPTZ,
  p_topic_ids UUID[] DEFAULT NULL
)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INT
  FROM stories s
  WHERE
    s.published_at > p_since
    AND s.is_approved = true
    -- 30-day retention
    AND s.published_at > NOW() - INTERVAL '30 days'
    -- Not seen by user
    AND NOT EXISTS (
      SELECT 1 FROM user_story_interactions usi
      WHERE usi.user_id = p_user_id
        AND usi.story_id = s.id
        AND usi.interaction_type IN ('view', 'skip')
    )
    -- Topic filter (include NULL/empty)
    AND (
      p_topic_ids IS NULL
      OR s.topic_ids && p_topic_ids
      OR s.topic_ids IS NULL
      OR array_length(s.topic_ids, 1) IS NULL
    );
$$;
