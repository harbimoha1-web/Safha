-- Live Feed: No Repeat Posts + Real-time Updates
-- This migration adds:
-- 1. Indexes for efficient seen-story filtering
-- 2. Unique constraint to prevent duplicate interactions
-- 3. RPC functions for server-side filtering

-- ============================================
-- INDEXES
-- ============================================

-- Index for efficient lookup of seen stories (view OR skip)
CREATE INDEX IF NOT EXISTS idx_interactions_user_seen
  ON user_story_interactions(user_id, story_id)
  WHERE interaction_type IN ('view', 'skip');

-- Index for user interaction type queries
CREATE INDEX IF NOT EXISTS idx_interactions_user_type
  ON user_story_interactions(user_id, interaction_type);

-- ============================================
-- DEDUPLICATE EXISTING DATA
-- ============================================

-- Remove duplicate interactions, keeping the earliest one
DELETE FROM user_story_interactions a
USING user_story_interactions b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.story_id = b.story_id
  AND a.interaction_type = b.interaction_type;

-- ============================================
-- UNIQUE CONSTRAINT
-- ============================================

-- Prevent future duplicates (one interaction per user/story/type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_story_interaction'
  ) THEN
    ALTER TABLE user_story_interactions
      ADD CONSTRAINT unique_user_story_interaction
      UNIQUE (user_id, story_id, interaction_type);
  END IF;
END $$;

-- ============================================
-- RPC: GET UNSEEN STORIES
-- ============================================

-- Efficiently fetch stories the user hasn't seen (view or skip)
-- Uses NOT EXISTS for optimal performance with index
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
    -- Topic filter (if provided)
    AND (p_topic_ids IS NULL OR s.topic_ids && p_topic_ids)
    -- Blocked source filter (if provided)
    AND (p_blocked_source_ids IS NULL OR s.source_id != ALL(p_blocked_source_ids))
    -- Only approved stories
    AND s.is_approved = true
  ORDER BY s.published_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================
-- RPC: GET NEW STORY COUNT
-- ============================================

-- Count new unseen stories since a timestamp (for "X new stories" badge)
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
    AND (p_topic_ids IS NULL OR s.topic_ids && p_topic_ids);
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_unseen_stories TO authenticated;
GRANT EXECUTE ON FUNCTION get_new_story_count TO authenticated;
