-- Migration: Add full article content fields
-- Enables storing scraped full article text for in-app reading

-- Add full_content to raw_articles (scraped from webpage)
ALTER TABLE raw_articles ADD COLUMN IF NOT EXISTS full_content TEXT;

-- Add content_quality score to raw_articles (0-1 confidence score)
ALTER TABLE raw_articles ADD COLUMN IF NOT EXISTS content_quality NUMERIC(3,2) DEFAULT 0;

-- Add full_content to stories (copied from raw_articles during processing)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS full_content TEXT;

-- Add content_quality to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS content_quality NUMERIC(3,2) DEFAULT 0;

-- Add index for stories with full content (for filtering/stats)
CREATE INDEX IF NOT EXISTS idx_stories_has_full_content
  ON stories ((full_content IS NOT NULL));

-- Add index for high-quality content (quality > 0.5)
CREATE INDEX IF NOT EXISTS idx_stories_high_quality_content
  ON stories (content_quality) WHERE content_quality > 0.5;

-- Comment for documentation
COMMENT ON COLUMN raw_articles.full_content IS 'Full article text scraped from the original webpage';
COMMENT ON COLUMN raw_articles.content_quality IS 'Content extraction quality score (0-1), higher is better';
COMMENT ON COLUMN stories.full_content IS 'Full article text for in-app reading, with source attribution';
COMMENT ON COLUMN stories.content_quality IS 'Content quality score for filtering/display decisions';
