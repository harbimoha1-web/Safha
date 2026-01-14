-- Migration: Sync all RSS sources and ensure each topic has 2+ Arabic & 2+ English sources
-- This migration:
-- 1. Syncs rss_sources → sources table
-- 2. Adds missing Arabic sources for topics lacking them
-- 3. Re-links all sources to their appropriate topics

-- ============================================
-- STEP 0: Add unique constraint on sources.url if not exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sources_url_key'
  ) THEN
    ALTER TABLE sources ADD CONSTRAINT sources_url_key UNIQUE (url);
  END IF;
END $$;

-- ============================================
-- STEP 1: Sync all rss_sources to sources table
-- Use DISTINCT ON to handle duplicate website_urls
-- ============================================
INSERT INTO sources (name, url, logo_url, language, reliability_score, is_active)
SELECT DISTINCT ON (website_url) name, website_url, logo_url, language, reliability_score, is_active
FROM rss_sources
WHERE website_url IS NOT NULL
ORDER BY website_url, reliability_score DESC
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  language = EXCLUDED.language,
  reliability_score = EXCLUDED.reliability_score,
  is_active = EXCLUDED.is_active;

-- ============================================
-- STEP 2: Add missing Arabic sources
-- ============================================

-- Gaming - Arabic sources
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('عرب هاردوير', 'https://arabhardware.net/feed/', 'https://arabhardware.net', 'ar', 'technology', 0.82, true),
  ('جيمرز', 'https://gamers.sa/feed/', 'https://gamers.sa', 'ar', 'technology', 0.78, true)
ON CONFLICT (feed_url) DO NOTHING;

-- Anime & Comics - Arabic sources
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('أنمي بالعربي', 'https://animeblarabi.net/feed/', 'https://animeblarabi.net', 'ar', 'entertainment', 0.75, true),
  ('مانجا العرب', 'https://manga-alarab.com/feed/', 'https://manga-alarab.com', 'ar', 'entertainment', 0.74, true)
ON CONFLICT (feed_url) DO NOTHING;

-- Education - Arabic sources
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('إدراك', 'https://www.edraak.org/feed/', 'https://edraak.org', 'ar', 'science', 0.85, true),
  ('رواق', 'https://www.rwaq.org/feed/', 'https://rwaq.org', 'ar', 'science', 0.82, true)
ON CONFLICT (feed_url) DO NOTHING;

-- Comedy - Arabic sources (viral/humor content)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('ضحك عربي', 'https://dahk3arabi.com/feed/', 'https://dahk3arabi.com', 'ar', 'entertainment', 0.70, true),
  ('نكت عربية', 'https://arabicjokes.net/feed/', 'https://arabicjokes.net', 'ar', 'entertainment', 0.68, true)
ON CONFLICT (feed_url) DO NOTHING;

-- Sync newly added sources to sources table
INSERT INTO sources (name, url, logo_url, language, reliability_score, is_active)
SELECT name, website_url, logo_url, language, reliability_score, is_active
FROM rss_sources
WHERE website_url IS NOT NULL
ON CONFLICT (url) DO NOTHING;

-- ============================================
-- STEP 3: Re-link ALL sources to topics
-- Clear existing and re-create for clean state
-- ============================================

-- Don't delete existing - just add missing links

-- Link 'general' news sources to Politics
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'general'
  AND t.slug = 'politics'
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'saudi' sources to Politics
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'saudi'
  AND t.slug = 'politics'
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'technology' sources to Technology AND Gaming
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'technology'
  AND t.slug IN ('technology', 'gaming')
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'economy' sources to Economy
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'economy'
  AND t.slug = 'economy'
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'sports' sources to Sports AND Fitness & Health
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'sports'
  AND t.slug IN ('sports', 'fitness-health')
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'science' sources to Science AND Education
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'science'
  AND t.slug IN ('science', 'education')
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'health' sources to Fitness & Health
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'health'
  AND t.slug = 'fitness-health'
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'entertainment' sources to Entertainment, Shows, Comedy, Anime & Comics
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'entertainment'
  AND t.slug IN ('entertainment', 'shows', 'comedy', 'anime-comics')
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'lifestyle' sources to Beauty Care AND Animals/Pets
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'lifestyle'
  AND t.slug IN ('beauty-style', 'pets')
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'automotive' sources to Cars & Off-road
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'automotive'
  AND t.slug = 'auto-vehicle'
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- Link 'food' sources to Food & Drink
INSERT INTO source_topics (source_id, topic_id)
SELECT DISTINCT s.id, t.id
FROM sources s
JOIN rss_sources rs ON rs.website_url = s.url
CROSS JOIN topics t
WHERE rs.category = 'food'
  AND t.slug = 'food-drink'
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ============================================
-- STEP 4: Log results
-- ============================================
DO $$
DECLARE
  total_sources INTEGER;
  total_mappings INTEGER;
  topics_with_sources INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_sources FROM sources WHERE is_active = true;
  SELECT COUNT(*) INTO total_mappings FROM source_topics;
  SELECT COUNT(DISTINCT topic_id) INTO topics_with_sources FROM source_topics;

  RAISE NOTICE 'Source sync complete:';
  RAISE NOTICE '  Total active sources: %', total_sources;
  RAISE NOTICE '  Total source-topic mappings: %', total_mappings;
  RAISE NOTICE '  Topics with sources: %', topics_with_sources;
END $$;
