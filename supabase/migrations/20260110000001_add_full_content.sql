-- Migration: Add full article content fields
-- Enables storing scraped full article text for in-app reading

-- Add full_content to raw_articles (scraped from webpage)
ALTER TABLE raw_articles ADD COLUMN IF NOT EXISTS full_content TEXT;

-- Add full_content to stories (copied from raw_articles during processing)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS full_content TEXT;

-- Add index for stories with full content (for filtering/stats)
CREATE INDEX IF NOT EXISTS idx_stories_has_full_content
  ON stories ((full_content IS NOT NULL));

-- Comment for documentation
COMMENT ON COLUMN raw_articles.full_content IS 'Full article text scraped from the original webpage';
COMMENT ON COLUMN stories.full_content IS 'Full article text for in-app reading, with source attribution';
