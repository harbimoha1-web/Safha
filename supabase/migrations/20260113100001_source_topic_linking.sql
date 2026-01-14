-- Migration: Source-Topic Explicit Linking
-- Creates a proper junction table for source-topic relationships
-- Replaces the derived relationship from stories

-- 1. Create junction table for explicit source-topic mapping
CREATE TABLE IF NOT EXISTS source_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, topic_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_source_topics_source ON source_topics(source_id);
CREATE INDEX IF NOT EXISTS idx_source_topics_topic ON source_topics(topic_id);

-- 2. Add topic_ids to rss_sources for initial topic assignment during RSS fetch
ALTER TABLE rss_sources ADD COLUMN IF NOT EXISTS topic_ids UUID[] DEFAULT '{}';

-- 3. Replace the derived mapping function with explicit relationship lookup
-- This function now uses the source_topics junction table
-- Falls back to derived relationship if no explicit mapping exists (for backward compatibility)
CREATE OR REPLACE FUNCTION get_topic_source_mapping()
RETURNS TABLE (topic_id UUID, source_ids UUID[]) AS $$
BEGIN
  RETURN QUERY
  WITH explicit_mapping AS (
    -- First, get explicit source-topic relationships
    SELECT st.topic_id, array_agg(DISTINCT st.source_id) as source_ids
    FROM source_topics st
    JOIN sources s ON s.id = st.source_id
    WHERE s.is_active = true
    GROUP BY st.topic_id
  ),
  derived_mapping AS (
    -- Fallback: derive from stories for sources without explicit mapping
    SELECT
      unnest(stories.topic_ids) as topic_id,
      stories.source_id
    FROM stories
    WHERE stories.source_id IS NOT NULL
      AND stories.source_id NOT IN (SELECT DISTINCT source_id FROM source_topics)
  ),
  derived_grouped AS (
    SELECT dm.topic_id, array_agg(DISTINCT dm.source_id) as source_ids
    FROM derived_mapping dm
    JOIN sources s ON s.id = dm.source_id
    WHERE s.is_active = true
    GROUP BY dm.topic_id
  )
  -- Combine both mappings
  SELECT COALESCE(em.topic_id, dg.topic_id) as topic_id,
         COALESCE(
           CASE WHEN em.source_ids IS NOT NULL AND dg.source_ids IS NOT NULL
                THEN em.source_ids || dg.source_ids
                ELSE COALESCE(em.source_ids, dg.source_ids)
           END,
           '{}'::UUID[]
         ) as source_ids
  FROM explicit_mapping em
  FULL OUTER JOIN derived_grouped dg ON em.topic_id = dg.topic_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Create helper function to assign a source to topics
CREATE OR REPLACE FUNCTION assign_source_to_topics(
  p_source_id UUID,
  p_topic_ids UUID[]
)
RETURNS void AS $$
BEGIN
  -- Remove existing assignments
  DELETE FROM source_topics WHERE source_id = p_source_id;

  -- Insert new assignments
  INSERT INTO source_topics (source_id, topic_id)
  SELECT p_source_id, unnest(p_topic_ids)
  ON CONFLICT (source_id, topic_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to get sources for a specific topic
CREATE OR REPLACE FUNCTION get_sources_for_topic(p_topic_id UUID)
RETURNS SETOF sources AS $$
BEGIN
  RETURN QUERY
  SELECT s.*
  FROM sources s
  JOIN source_topics st ON s.id = st.source_id
  WHERE st.topic_id = p_topic_id
    AND s.is_active = true
  ORDER BY s.reliability_score DESC, s.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Create function to get topics for a specific source
CREATE OR REPLACE FUNCTION get_topics_for_source(p_source_id UUID)
RETURNS SETOF topics AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM topics t
  JOIN source_topics st ON t.id = st.topic_id
  WHERE st.source_id = p_source_id
    AND t.is_active = true
  ORDER BY t.sort_order, t.name_en;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON source_topics TO authenticated;
GRANT SELECT ON source_topics TO anon;
GRANT EXECUTE ON FUNCTION assign_source_to_topics TO authenticated;
GRANT EXECUTE ON FUNCTION get_sources_for_topic TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_topics_for_source TO authenticated, anon;

-- Add comment
COMMENT ON TABLE source_topics IS 'Junction table linking sources to topics for explicit categorization';
