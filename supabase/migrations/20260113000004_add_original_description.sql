-- Add original_description column to stories table
-- This stores the RSS feed description as fallback content

ALTER TABLE stories ADD COLUMN IF NOT EXISTS original_description TEXT;

-- Comment explaining the column
COMMENT ON COLUMN stories.original_description IS 'Original RSS feed description - used as fallback when full_content is unavailable';
