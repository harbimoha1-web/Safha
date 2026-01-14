-- Fix feed sort order: Add secondary sort on created_at
-- This ensures consistent ordering when multiple stories have the same published_at

-- ============================================
-- UPDATE: GET UNSEEN STORIES
-- ============================================

-- Recreate function with proper sort order (published_at DESC, created_at DESC)
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
  -- FIX: Secondary sort on created_at for consistent ordering
  ORDER BY s.published_at DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================
-- INDEX: Optimize sort performance
-- ============================================

-- Composite index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_stories_published_created
  ON stories(published_at DESC NULLS LAST, created_at DESC)
  WHERE is_approved = true;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_unseen_stories TO authenticated;
