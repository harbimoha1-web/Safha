-- Migration: Link new RSS sources to appropriate topics
-- Maps new categories (entertainment, lifestyle, automotive, food) to topic slugs

-- ============================================
-- ENTERTAINMENT → Comedy, Anime, Entertainment, Shows
-- ============================================
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'entertainment'
  AND t.slug IN ('comedy', 'anime-comics', 'entertainment', 'shows')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ============================================
-- LIFESTYLE → Beauty Care, Pets/Animals
-- ============================================
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'lifestyle'
  AND t.slug IN ('beauty-style', 'pets')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ============================================
-- AUTOMOTIVE → Cars & Off-road
-- ============================================
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'automotive'
  AND t.slug = 'auto-vehicle'
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ============================================
-- FOOD → Food & Drink
-- ============================================
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'food'
  AND t.slug = 'food-drink'
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ============================================
-- Update existing SCIENCE mapping with Arabic sources
-- ============================================
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'science'
  AND rs.language = 'ar'
  AND t.slug IN ('science', 'education')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ============================================
-- Update existing HEALTH mapping with Arabic sources
-- ============================================
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'health'
  AND rs.language = 'ar'
  AND t.slug IN ('health', 'fitness-health')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Log results
DO $$
DECLARE
  total_mappings INTEGER;
  new_mappings INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_mappings FROM source_topics;
  SELECT COUNT(*) INTO new_mappings FROM source_topics WHERE created_at > NOW() - INTERVAL '1 minute';
  RAISE NOTICE 'Total source-topic mappings: %, New mappings added: %', total_mappings, new_mappings;
END $$;
