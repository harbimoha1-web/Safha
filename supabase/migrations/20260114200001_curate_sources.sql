-- Migration: Curate Sources - Quality Over Quantity, Arabic Priority
-- This migration:
-- 1. Deactivates all current sources
-- 2. Reactivates only top-quality curated sources
-- 3. Adds logo URLs for all active sources
-- 4. Links sources to correct topics

-- ============================================
-- STEP 1: Deactivate all sources
-- ============================================
UPDATE rss_sources SET is_active = false;
UPDATE sources SET is_active = false;

-- ============================================
-- STEP 2: Clear existing source-topic mappings
-- ============================================
DELETE FROM source_topics;

-- ============================================
-- STEP 3: Define curated sources with logos
-- Using ON CONFLICT to update existing or insert new
-- ============================================

-- POLITICS & GENERAL NEWS
-- Al Jazeera Arabic
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/200px-Aljazeera_eng.svg.png'
WHERE website_url = 'https://aljazeera.net';

-- Al Arabiya
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Al_Arabiya_logo.svg/200px-Al_Arabiya_logo.svg.png'
WHERE website_url = 'https://alarabiya.net';

-- BBC Arabic
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/BBC_News_2022_%28Alt%29.svg/200px-BBC_News_2022_%28Alt%29.svg.png'
WHERE website_url = 'https://bbc.com/arabic';

-- Reuters (English)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Reuters_Logo.svg/200px-Reuters_Logo.svg.png'
WHERE website_url = 'https://reuters.com';

-- ECONOMY
-- Argaam (Arabic Business)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.argaam.com/Images/argaam-logo.png'
WHERE website_url = 'https://argaam.com';

-- Insert CNBC Arabia if not exists
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('CNBC عربية', 'https://www.cnbcarabia.com/rss/', 'https://cnbcarabia.com', 'ar', 'economy', 0.85, true, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/200px-CNBC_logo.svg.png')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Bloomberg (English)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Bloomberg', 'https://www.bloomberg.com/feed/podcast/etf-report.xml', 'https://bloomberg.com', 'en', 'economy', 0.90, true, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/New_Bloomberg_Logo.svg/200px-New_Bloomberg_Logo.svg.png')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- TECHNOLOGY
-- AIT News (Arabic Tech)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://aitnews.com/wp-content/uploads/2020/01/aitnews-logo.png'
WHERE website_url = 'https://aitnews.com';

-- Arab Hardware
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://arabhardware.net/wp-content/uploads/2021/01/arabhardware-logo.png'
WHERE website_url = 'https://arabhardware.net';

-- TechCrunch (English)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'en', 'technology', 0.88, true, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/TechCrunch_logo.svg/200px-TechCrunch_logo.svg.png')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- GAMING
-- Gamers SA (Arabic)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://gamers.sa/assets/images/logo.png'
WHERE website_url = 'https://gamers.sa';

-- IGN (English)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('IGN', 'https://feeds.feedburner.com/ign/all', 'https://ign.com', 'en', 'technology', 0.85, true, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/IGN_logo.svg/200px-IGN_logo.svg.png')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- SPORTS
-- Kooora (Arabic)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.kooora.com/images/logo.png'
WHERE website_url = 'https://kooora.com';

-- Al Riyadiyah (Arabic Sports)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.arriyadiyah.com/images/logo.png'
WHERE website_url = 'https://arriyadiyah.com';

-- ESPN (English)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('ESPN', 'https://www.espn.com/espn/rss/news', 'https://espn.com', 'en', 'sports', 0.88, true, 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/200px-ESPN_wordmark.svg.png')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- ENTERTAINMENT
-- El Cinema (Arabic)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.elcinema.com/static/images/logo.png'
WHERE website_url = 'https://elcinema.com';

-- Variety (English)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Variety_logo.svg/200px-Variety_logo.svg.png'
WHERE website_url = 'https://variety.com';

-- Entertainment Weekly (English)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Entertainment_Weekly.svg/200px-Entertainment_Weekly.svg.png'
WHERE website_url = 'https://ew.com';

-- COMEDY
-- BuzzFeed (English)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/BuzzFeed_Logo.svg/200px-BuzzFeed_Logo.svg.png'
WHERE website_url = 'https://buzzfeed.com';

-- ANIME & COMICS
-- Anime News Network (English)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.animenewsnetwork.com/images/ann-logo.png'
WHERE website_url = 'https://animenewsnetwork.com';

-- BEAUTY & LIFESTYLE
-- Sayidaty (Arabic Women)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.sayidaty.net/sites/default/files/sayidaty_logo.png'
WHERE website_url = 'https://sayidaty.net';

-- Jamalouki (Arabic Beauty)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.jamalouki.net/sites/default/files/jamalouki-logo.png'
WHERE website_url = 'https://jamalouki.net';

-- Allure (English Beauty)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Allure_logo.svg/200px-Allure_logo.svg.png'
WHERE website_url = 'https://allure.com';

-- FOOD
-- Atyab Tabkha (Arabic Food)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.atyabtabkha.com/sites/default/files/atyabtabkha-logo.png'
WHERE website_url = 'https://atyabtabkha.com';

-- Shahiya (Arabic Food)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://shahiya.com/ar/images/shahiya-logo.png'
WHERE website_url = 'https://shahiya.com';

-- Bon Appetit (English Food)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bon_Appetit_logo.svg/200px-Bon_Appetit_logo.svg.png'
WHERE website_url = 'https://bonappetit.com';

-- CARS & AUTOMOTIVE
-- Arab GT (Arabic Cars)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.arabgt.com/wp-content/uploads/2020/01/arabgt-logo.png'
WHERE website_url = 'https://arabgt.com';

-- Motory (Arabic Cars)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://motory.com/images/motory-logo.png'
WHERE website_url = 'https://motory.com';

-- Motor1 (English Cars)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Motor1_logo.svg/200px-Motor1_logo.svg.png'
WHERE website_url = 'https://motor1.com';

-- ANIMALS & PETS
-- National Geographic (English)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/National_Geographic_Channel.svg/200px-National_Geographic_Channel.svg.png'
WHERE website_url = 'https://nationalgeographic.com/animals';

-- The Dodo (English Pets)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.thedodo.com/images/logo.png'
WHERE website_url = 'https://thedodo.com';

-- HEALTH & FITNESS
-- WebTeb (Arabic Health)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.webteb.com/images/webteb-logo.png'
WHERE website_url = 'https://webteb.com';

-- Sehatok (Arabic Health)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.sehatok.com/images/sehatok-logo.png'
WHERE website_url = 'https://sehatok.com';

-- EDUCATION
-- Edraak (Arabic Education)
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://www.edraak.org/static/images/edraak-logo.png'
WHERE website_url = 'https://edraak.org';

-- SCIENCE
-- NASA Arabic
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png'
WHERE website_url = 'https://nasainarabic.net';

-- Scientific American Arabic
UPDATE rss_sources SET
  is_active = true,
  logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Scientific_American_logo.svg/200px-Scientific_American_logo.svg.png'
WHERE website_url = 'https://scientificamerican.com/arabic';

-- Nature (English)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Nature', 'https://www.nature.com/nature.rss', 'https://nature.com', 'en', 'science', 0.95, true, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Nature_%28journal%29.svg/200px-Nature_%28journal%29.svg.png')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- ============================================
-- STEP 4: Sync active rss_sources to sources table
-- ============================================
INSERT INTO sources (name, url, logo_url, language, reliability_score, is_active)
SELECT DISTINCT ON (website_url) name, website_url, logo_url, language, reliability_score, is_active
FROM rss_sources
WHERE is_active = true AND website_url IS NOT NULL
ORDER BY website_url, reliability_score DESC
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  language = EXCLUDED.language,
  reliability_score = EXCLUDED.reliability_score,
  is_active = EXCLUDED.is_active;

-- Deactivate sources not in active rss_sources
UPDATE sources SET is_active = false
WHERE url NOT IN (SELECT website_url FROM rss_sources WHERE is_active = true AND website_url IS NOT NULL);

-- ============================================
-- STEP 5: Link sources to correct topics
-- ============================================

-- POLITICS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'politics'
  AND t.is_active = true
  AND s.url IN ('https://aljazeera.net', 'https://alarabiya.net', 'https://bbc.com/arabic', 'https://reuters.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ECONOMY
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'economy'
  AND t.is_active = true
  AND s.url IN ('https://argaam.com', 'https://cnbcarabia.com', 'https://bloomberg.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- TECHNOLOGY
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'technology'
  AND t.is_active = true
  AND s.url IN ('https://aitnews.com', 'https://arabhardware.net', 'https://techcrunch.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- GAMING
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'gaming'
  AND t.is_active = true
  AND s.url IN ('https://arabhardware.net', 'https://gamers.sa', 'https://ign.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- SPORTS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'sports'
  AND t.is_active = true
  AND s.url IN ('https://kooora.com', 'https://arriyadiyah.com', 'https://espn.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ENTERTAINMENT
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'entertainment'
  AND t.is_active = true
  AND s.url IN ('https://elcinema.com', 'https://variety.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- SHOWS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'shows'
  AND t.is_active = true
  AND s.url IN ('https://elcinema.com', 'https://ew.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- COMEDY
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'comedy'
  AND t.is_active = true
  AND s.url IN ('https://buzzfeed.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ANIME & COMICS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'anime-comics'
  AND t.is_active = true
  AND s.url IN ('https://animenewsnetwork.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- BEAUTY CARE
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'beauty-style'
  AND t.is_active = true
  AND s.url IN ('https://sayidaty.net', 'https://jamalouki.net', 'https://allure.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- FOOD & DRINK
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'food-drink'
  AND t.is_active = true
  AND s.url IN ('https://atyabtabkha.com', 'https://shahiya.com', 'https://bonappetit.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- CARS & OFF-ROAD
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'auto-vehicle'
  AND t.is_active = true
  AND s.url IN ('https://arabgt.com', 'https://motory.com', 'https://motor1.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- PETS/ANIMALS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'pets'
  AND t.is_active = true
  AND s.url IN ('https://nationalgeographic.com/animals', 'https://thedodo.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- FITNESS & HEALTH
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'fitness-health'
  AND t.is_active = true
  AND s.url IN ('https://webteb.com', 'https://sehatok.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- EDUCATION
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'education'
  AND t.is_active = true
  AND s.url IN ('https://edraak.org', 'https://nasainarabic.net')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- SCIENCE
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s, topics t
WHERE s.is_active = true
  AND t.slug = 'science'
  AND t.is_active = true
  AND s.url IN ('https://nasainarabic.net', 'https://scientificamerican.com/arabic', 'https://nature.com')
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ============================================
-- STEP 6: Log results
-- ============================================
DO $$
DECLARE
  active_sources INTEGER;
  arabic_count INTEGER;
  english_count INTEGER;
  total_mappings INTEGER;
  topics_with_sources INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_sources FROM sources WHERE is_active = true;
  SELECT COUNT(*) INTO arabic_count FROM sources WHERE is_active = true AND language = 'ar';
  SELECT COUNT(*) INTO english_count FROM sources WHERE is_active = true AND language = 'en';
  SELECT COUNT(*) INTO total_mappings FROM source_topics;
  SELECT COUNT(DISTINCT topic_id) INTO topics_with_sources FROM source_topics;

  RAISE NOTICE 'Source curation complete:';
  RAISE NOTICE '  Active sources: % (% Arabic, % English)', active_sources, arabic_count, english_count;
  RAISE NOTICE '  Source-topic mappings: %', total_mappings;
  RAISE NOTICE '  Topics with sources: %', topics_with_sources;
END $$;
