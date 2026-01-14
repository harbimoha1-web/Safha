-- CONSOLIDATION MIGRATION: Definitive Feed Sorting Fix
-- This migration combines:
--   1. Topic filter fix from 000005 (include NULL/empty topic_ids)
--   2. Correct sorting from 000006 (24-hour tiering + 5-day retention)
--
-- REASON: Migrations 000005 and 000006 both defined get_unseen_stories
-- with CREATE OR REPLACE, causing potential ordering conflicts.
-- This migration is the FINAL word on feed sorting.

-- ============================================
-- DROP AND RECREATE FOR CLEAN STATE
-- ============================================

DROP FUNCTION IF EXISTS get_unseen_stories(UUID, INT, INT, UUID[], UUID[]);

-- ============================================
-- RPC: GET UNSEEN STORIES (DEFINITIVE VERSION)
-- ============================================

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
    -- Filter out seen stories (view OR skip) - they go to History
    NOT EXISTS (
      SELECT 1 FROM user_story_interactions usi
      WHERE usi.user_id = p_user_id
        AND usi.story_id = s.id
        AND usi.interaction_type IN ('view', 'skip')
    )
    -- 5-DAY RETENTION: Only stories from last 5 days appear in feed
    AND (s.published_at > NOW() - INTERVAL '5 days' OR s.published_at IS NULL)
    -- TOPIC FILTER FIX: Include stories with NULL/empty topic_ids
    -- (From migration 000005)
    AND (
      p_topic_ids IS NULL
      OR s.topic_ids && p_topic_ids
      OR s.topic_ids IS NULL
      OR array_length(s.topic_ids, 1) IS NULL
    )
    -- Blocked source filter
    AND (p_blocked_source_ids IS NULL OR s.source_id != ALL(p_blocked_source_ids))
    -- Only approved stories
    AND s.is_approved = true
  ORDER BY
    -- ============================================
    -- CRITICAL: 24-HOUR TIERING
    -- Stories from last 24 hours appear FIRST
    -- ============================================
    CASE WHEN s.published_at > NOW() - INTERVAL '24 hours' THEN 0 ELSE 1 END,
    -- Within each tier, sort by published_at DESC (newest first)
    s.published_at DESC NULLS LAST,
    -- Tiebreaker: created_at DESC
    s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================
-- RPC: GET NEW STORY COUNT (MATCHING LOGIC)
-- ============================================

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
    -- 5-DAY RETENTION: Only count stories from last 5 days
    AND s.published_at > NOW() - INTERVAL '5 days'
    AND NOT EXISTS (
      SELECT 1 FROM user_story_interactions usi
      WHERE usi.user_id = p_user_id
        AND usi.story_id = s.id
        AND usi.interaction_type IN ('view', 'skip')
    )
    -- TOPIC FILTER FIX: Include stories with NULL/empty topic_ids
    AND (
      p_topic_ids IS NULL
      OR s.topic_ids && p_topic_ids
      OR s.topic_ids IS NULL
      OR array_length(s.topic_ids, 1) IS NULL
    );
$$;

-- ============================================
-- INDEX FOR SORTING PERFORMANCE
-- ============================================

-- Drop and recreate index for clean state
DROP INDEX IF EXISTS idx_stories_feed_sort;

CREATE INDEX idx_stories_feed_sort
  ON stories(is_approved, published_at DESC NULLS LAST, created_at DESC)
  WHERE is_approved = true;

-- ============================================
-- VERIFICATION COMMENT
-- ============================================
-- After applying this migration, verify with:
--
-- SELECT
--   title_ar,
--   published_at,
--   CASE WHEN published_at > NOW() - INTERVAL '24 hours' THEN 'RECENT' ELSE 'OLDER' END as tier
-- FROM get_unseen_stories('YOUR_USER_ID'::UUID, 20, 0, NULL, NULL)
-- ORDER BY published_at DESC;
--
-- Expected: All 'RECENT' stories should appear before 'OLDER' stories
