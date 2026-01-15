-- Add topic_ids column to raw_articles table
-- This allows RSS source topic_ids to flow through the pipeline to stories
-- ========================================================

-- Add topic_ids column to preserve RSS source topic assignments
ALTER TABLE raw_articles ADD COLUMN IF NOT EXISTS topic_ids UUID[] DEFAULT '{}';

-- Create GIN index for efficient array lookups
CREATE INDEX IF NOT EXISTS idx_raw_articles_topic_ids ON raw_articles USING GIN(topic_ids);

-- Add comment explaining the column
COMMENT ON COLUMN raw_articles.topic_ids IS 'Topic IDs inherited from rss_sources.topic_ids - ensures stories get correct topic assignments';
