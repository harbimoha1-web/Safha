-- Fix empty topic_ids filtering in get_unseen_stories
-- Stories with NULL or empty topic_ids were being excluded from interest feed
-- This migration updates the RPC to include such stories

-- ============================================
-- RPC: GET UNSEEN STORIES (FIXED)
-- ============================================

-- Drop existing function first (return type changed to include original_description)
DROP FUNCTION IF EXISTS get_unseen_stories(UUID, INT, INT, UUID[], UUID[]);

CREATE OR REPLACE FUNCTION get_unseen_stories(
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
    -- Filter out seen stories (view OR skip)
    NOT EXISTS (
      SELECT 1 FROM user_story_interactions usi
      WHERE usi.user_id = p_user_id
        AND usi.story_id = s.id
        AND usi.interaction_type IN ('view', 'skip')
    )
    -- FIXED: Topic filter - also include stories with NULL/empty topic_ids
    -- This ensures stories without proper topic assignment still appear in feed
    AND (
      p_topic_ids IS NULL
      OR s.topic_ids && p_topic_ids
      OR s.topic_ids IS NULL
      OR array_length(s.topic_ids, 1) IS NULL
    )
    -- Blocked source filter (if provided)
    AND (p_blocked_source_ids IS NULL OR s.source_id != ALL(p_blocked_source_ids))
    -- Only approved stories
    AND s.is_approved = true
  ORDER BY s.published_at DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================
-- RPC: GET NEW STORY COUNT (FIXED)
-- ============================================

-- Also fix the new story count function for consistency
CREATE OR REPLACE FUNCTION get_new_story_count(
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
    AND NOT EXISTS (
      SELECT 1 FROM user_story_interactions usi
      WHERE usi.user_id = p_user_id
        AND usi.story_id = s.id
        AND usi.interaction_type IN ('view', 'skip')
    )
    -- FIXED: Include stories with NULL/empty topic_ids
    AND (
      p_topic_ids IS NULL
      OR s.topic_ids && p_topic_ids
      OR s.topic_ids IS NULL
      OR array_length(s.topic_ids, 1) IS NULL
    );
$$;
