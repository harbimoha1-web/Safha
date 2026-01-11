-- Migration: Fix GUID NULL duplicates in raw_articles
-- ====================================================
-- Problem: UNIQUE(rss_source_id, guid) allows multiple NULL guids
-- Solution: Add partial unique index using content_hash as fallback
-- ====================================================

-- Drop the existing constraint that allows NULL duplicates
-- (This is a composite unique constraint, not a standalone index)
ALTER TABLE raw_articles DROP CONSTRAINT IF EXISTS raw_articles_rss_source_id_guid_key;

-- Create a unique index that handles NULL guids by using content_hash
-- This ensures:
-- 1. If guid is NOT NULL: guid + source must be unique
-- 2. If guid is NULL: content_hash + source must be unique (fallback)

-- Index for non-null GUIDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_articles_unique_guid
  ON raw_articles(rss_source_id, guid)
  WHERE guid IS NOT NULL;

-- Index for null GUIDs using content_hash as fallback
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_articles_unique_content_hash
  ON raw_articles(rss_source_id, content_hash)
  WHERE guid IS NULL AND content_hash IS NOT NULL;

-- Index for URL-based deduplication (last resort)
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_articles_unique_url
  ON raw_articles(rss_source_id, original_url)
  WHERE guid IS NULL AND content_hash IS NULL;

-- Comment explaining the deduplication strategy
COMMENT ON TABLE raw_articles IS
'Raw articles fetched from RSS feeds. Deduplication strategy:
1. Primary: GUID (RSS item identifier) - if provided
2. Fallback: content_hash (SHA256 of title+content) - if GUID is null
3. Last resort: original_url - if both GUID and content_hash are null

See indexes:
- idx_raw_articles_unique_guid (guid NOT NULL)
- idx_raw_articles_unique_content_hash (guid IS NULL, content_hash NOT NULL)
- idx_raw_articles_unique_url (both NULL)';

-- Ensure content_hash is populated for existing articles without it
-- This is a one-time backfill for any articles that slipped through
UPDATE raw_articles
SET content_hash = encode(
  sha256(
    (COALESCE(original_title, '') || COALESCE(original_content, ''))::bytea
  ),
  'hex'
)
WHERE content_hash IS NULL
  AND guid IS NULL
  AND (original_title IS NOT NULL OR original_content IS NOT NULL);
