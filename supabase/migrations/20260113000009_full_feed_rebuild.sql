-- ============================================
-- FULL FEED SYSTEM REBUILD
-- ============================================
-- Date: 2026-01-13
-- Author: THEBOLDS Engineering
-- Purpose: Nuclear rebuild - eliminate all migration conflicts
--
-- This migration:
-- 1. DROPS all existing feed functions
-- 2. CREATES definitive versions with correct sorting
-- 3. RESETS cron jobs
-- 4. RECREATES indexes
--
-- REASON: Previous 8 migrations created conflicts.
-- Function was rewritten 5 times. This is the FINAL word.
-- ============================================

-- ============================================
-- SECTION 1: NUCLEAR CLEANUP
-- Drop ALL existing feed functions
-- ============================================

DROP FUNCTION IF EXISTS get_unseen_stories(UUID, INT, INT, UUID[], UUID[]);
DROP FUNCTION IF EXISTS get_new_story_count(UUID, TIMESTAMPTZ, UUID[]);

-- ============================================
-- SECTION 2: CREATE DEFINITIVE get_unseen_stories
-- The ONE TRUE version with 24-hour tiering
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
    -- FILTER 1: Not seen by user (view OR skip)
    NOT EXISTS (
      SELECT 1 FROM user_story_interactions usi
      WHERE usi.user_id = p_user_id
        AND usi.story_id = s.id
        AND usi.interaction_type IN ('view', 'skip')
    )
    -- FILTER 2: 5-day retention (only recent stories)
    AND (s.published_at > NOW() - INTERVAL '5 days' OR s.published_at IS NULL)
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
    -- ============================================
    -- CRITICAL: 24-HOUR TIERING
    -- Stories from last 24 hours get priority 0
    -- Older stories get priority 1
    -- This ensures NEW stories always appear FIRST
    -- ============================================
    CASE WHEN s.published_at > NOW() - INTERVAL '24 hours' THEN 0 ELSE 1 END,
    -- Within each tier, sort by published_at DESC
    s.published_at DESC NULLS LAST,
    -- Tiebreaker: created_at DESC
    s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================
-- SECTION 3: CREATE DEFINITIVE get_new_story_count
-- Matching logic for "new stories" badge
-- ============================================

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
    -- 5-day retention
    AND s.published_at > NOW() - INTERVAL '5 days'
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

-- ============================================
-- SECTION 4: CRON JOBS - CLEANUP & RECREATE
-- ============================================

-- Safely remove existing jobs (ignore errors if they don't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('fetch-rss-feeds');
EXCEPTION WHEN OTHERS THEN
  -- Job doesn't exist, that's fine
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('process-articles');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('warmup-edge-functions');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule RSS fetch every 30 minutes
SELECT cron.schedule(
  'fetch-rss-feeds',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qnibkvemxmhjgzydstlg.supabase.co/functions/v1/fetch-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule article processing 5 minutes after fetch
-- Runs at :05 and :35 past each hour
SELECT cron.schedule(
  'process-articles',
  '5,35 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qnibkvemxmhjgzydstlg.supabase.co/functions/v1/process-articles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{"limit": 25}'::jsonb
  );
  $$
);

-- ============================================
-- SECTION 5: INDEXES FOR PERFORMANCE
-- ============================================

-- Drop old indexes (if exist)
DROP INDEX IF EXISTS idx_stories_feed_sort;
DROP INDEX IF EXISTS idx_stories_published_created;

-- Create optimized index for feed sorting
CREATE INDEX idx_stories_feed_sort
  ON stories(is_approved, published_at DESC NULLS LAST, created_at DESC)
  WHERE is_approved = true;

-- ============================================
-- VERIFICATION QUERIES (Run these to confirm)
-- ============================================
--
-- 1. Check functions exist:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN ('get_unseen_stories', 'get_new_story_count');
--
-- 2. Check cron jobs active:
-- SELECT jobname, schedule, active FROM cron.job
-- WHERE jobname IN ('fetch-rss-feeds', 'process-articles');
--
-- 3. Test sorting:
-- SELECT
--   CASE WHEN published_at > NOW() - INTERVAL '24 hours'
--        THEN 'RECENT' ELSE 'OLDER' END as tier,
--   published_at, title_ar
-- FROM stories WHERE is_approved = true
-- ORDER BY
--   CASE WHEN published_at > NOW() - INTERVAL '24 hours' THEN 0 ELSE 1 END,
--   published_at DESC NULLS LAST
-- LIMIT 10;
-- ============================================
