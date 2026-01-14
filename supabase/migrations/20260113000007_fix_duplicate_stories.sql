-- Fix Duplicate Stories
-- 1. Clean up existing duplicates (keep oldest)
-- 2. Add unique constraint to prevent future duplicates

-- ============================================
-- STEP 1: HANDLE saved_stories REFERENCES
-- Delete conflicting entries, then update remaining
-- ============================================

-- Delete saved_stories for duplicates where user already saved the kept story
WITH duplicates AS (
  SELECT
    s1.id as duplicate_id,
    s2.id as keep_id
  FROM stories s1
  INNER JOIN stories s2 ON s1.source_id = s2.source_id
    AND s1.original_url = s2.original_url
    AND s1.id > s2.id
)
DELETE FROM saved_stories ss
USING duplicates d
WHERE ss.story_id = d.duplicate_id
  AND EXISTS (
    SELECT 1 FROM saved_stories existing
    WHERE existing.user_id = ss.user_id
      AND existing.story_id = d.keep_id
  );

-- Update remaining saved_stories to point to kept story
WITH duplicates AS (
  SELECT
    s1.id as duplicate_id,
    s2.id as keep_id
  FROM stories s1
  INNER JOIN stories s2 ON s1.source_id = s2.source_id
    AND s1.original_url = s2.original_url
    AND s1.id > s2.id
)
UPDATE saved_stories ss
SET story_id = d.keep_id
FROM duplicates d
WHERE ss.story_id = d.duplicate_id;

-- ============================================
-- STEP 2: HANDLE user_story_interactions REFERENCES
-- Delete conflicting entries, then update remaining
-- ============================================

-- Delete interactions for duplicates where user already has same interaction with kept story
WITH duplicates AS (
  SELECT
    s1.id as duplicate_id,
    s2.id as keep_id
  FROM stories s1
  INNER JOIN stories s2 ON s1.source_id = s2.source_id
    AND s1.original_url = s2.original_url
    AND s1.id > s2.id
)
DELETE FROM user_story_interactions usi
USING duplicates d
WHERE usi.story_id = d.duplicate_id
  AND EXISTS (
    SELECT 1 FROM user_story_interactions existing
    WHERE existing.user_id = usi.user_id
      AND existing.story_id = d.keep_id
      AND existing.interaction_type = usi.interaction_type
  );

-- Update remaining interactions to point to kept story
WITH duplicates AS (
  SELECT
    s1.id as duplicate_id,
    s2.id as keep_id
  FROM stories s1
  INNER JOIN stories s2 ON s1.source_id = s2.source_id
    AND s1.original_url = s2.original_url
    AND s1.id > s2.id
)
UPDATE user_story_interactions usi
SET story_id = d.keep_id
FROM duplicates d
WHERE usi.story_id = d.duplicate_id;

-- ============================================
-- STEP 3: HANDLE raw_articles REFERENCES
-- ============================================

-- Update raw_articles story_id to point to kept story
WITH duplicates AS (
  SELECT
    s1.id as duplicate_id,
    s2.id as keep_id
  FROM stories s1
  INNER JOIN stories s2 ON s1.source_id = s2.source_id
    AND s1.original_url = s2.original_url
    AND s1.id > s2.id
)
UPDATE raw_articles ra
SET story_id = d.keep_id
FROM duplicates d
WHERE ra.story_id = d.duplicate_id;

-- ============================================
-- STEP 4: DELETE DUPLICATE STORIES
-- Now safe to delete since all references are handled
-- ============================================

DELETE FROM stories a
USING stories b
WHERE a.source_id = b.source_id
  AND a.original_url = b.original_url
  AND a.id > b.id;

-- ============================================
-- STEP 5: ADD UNIQUE CONSTRAINT
-- Prevent future duplicates
-- ============================================

ALTER TABLE stories
ADD CONSTRAINT stories_unique_source_url
UNIQUE (source_id, original_url);

-- ============================================
-- STEP 6: INDEX FOR CONSTRAINT PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stories_source_url_lookup
  ON stories(source_id, original_url)
  WHERE original_url IS NOT NULL;

