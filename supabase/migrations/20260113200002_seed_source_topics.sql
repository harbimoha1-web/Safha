-- Migration: Seed source_topics junction table
-- Links sources to topics based on their RSS category

-- First, ensure we have the topic slugs we need
-- This creates a temporary lookup for topic IDs

-- Link 'general' news sources to Politics, Society
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'general'
  AND t.slug IN ('politics', 'society')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'saudi' sources to Politics, Society
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'saudi'
  AND t.slug IN ('politics', 'society')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'technology' sources to Technology, Gaming
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'technology'
  AND t.slug IN ('technology', 'gaming')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'economy' sources to Economy
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'economy'
  AND t.slug = 'economy'
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'sports' sources to Sports, Fitness & Health
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'sports'
  AND t.slug IN ('sports', 'fitness-health')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'science' sources to Science, Education
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'science'
  AND t.slug IN ('science', 'education')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'health' sources to Health, Fitness & Health
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'health'
  AND t.slug IN ('health', 'fitness-health')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'entertainment' sources to Entertainment, Shows, Comedy
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'entertainment'
  AND t.slug IN ('entertainment', 'shows', 'comedy')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Log the results
DO $$
DECLARE
  mapping_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mapping_count FROM source_topics;
  RAISE NOTICE 'Source-topic mappings created: % total mappings', mapping_count;
END $$;
