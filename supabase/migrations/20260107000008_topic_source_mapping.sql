-- Topic-Source Mapping RPC Function
-- Returns which sources publish stories in each topic

CREATE OR REPLACE FUNCTION get_topic_source_mapping()
RETURNS TABLE (topic_id UUID, source_ids UUID[]) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.topic_id,
    array_agg(DISTINCT s.id) as source_ids
  FROM (
    SELECT DISTINCT unnest(topic_ids) as topic_id, source_id
    FROM stories
    WHERE source_id IS NOT NULL
  ) t
  JOIN sources s ON s.id = t.source_id
  WHERE s.is_active = true
  GROUP BY t.topic_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment for documentation
COMMENT ON FUNCTION get_topic_source_mapping() IS 'Returns topic-source relationships derived from stories table';
