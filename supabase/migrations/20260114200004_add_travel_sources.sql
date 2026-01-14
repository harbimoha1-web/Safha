-- Migration: Add Travel Topic Sources
-- Ensures travel topic has 2 Arabic + 2 English sources
-- Arabic: سيدتي، العربية (existing, just link)
-- English: Lonely Planet, Travel + Leisure (add new)

-- ============================================
-- STEP 1: Add English travel sources to rss_sources
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, logo_url, language, category, reliability_score, is_active) VALUES
  ('Lonely Planet', 'https://www.lonelyplanet.com/feed.xml', 'https://lonelyplanet.com', 'https://www.google.com/s2/favicons?domain=lonelyplanet.com&sz=128', 'en', 'lifestyle', 0.88, true),
  ('Travel + Leisure', 'https://www.travelandleisure.com/feeds/all', 'https://travelandleisure.com', 'https://www.google.com/s2/favicons?domain=travelandleisure.com&sz=128', 'en', 'lifestyle', 0.87, true)
ON CONFLICT (feed_url) DO UPDATE SET
  is_active = true,
  logo_url = EXCLUDED.logo_url;

-- ============================================
-- STEP 2: Sync to sources table
-- ============================================
INSERT INTO sources (name, url, logo_url, language, reliability_score, is_active)
SELECT name, website_url, logo_url, language, reliability_score, is_active
FROM rss_sources
WHERE name IN ('Lonely Planet', 'Travel + Leisure')
  AND website_url IS NOT NULL
ON CONFLICT (url) DO UPDATE SET
  is_active = true,
  logo_url = EXCLUDED.logo_url;

-- ============================================
-- STEP 3: Link Arabic sources to travel topic
-- سيدتي and العربية should already be active
-- ============================================
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s
CROSS JOIN topics t
WHERE s.name IN ('سيدتي', 'العربية')
  AND s.is_active = true
  AND t.slug = 'travel'
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ============================================
-- STEP 4: Link English sources to travel topic
-- ============================================
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id
FROM sources s
CROSS JOIN topics t
WHERE s.name IN ('Lonely Planet', 'Travel + Leisure')
  AND s.is_active = true
  AND t.slug = 'travel'
  AND t.is_active = true
ON CONFLICT (source_id, topic_id) DO NOTHING;

-- ============================================
-- STEP 5: Verify travel sources
-- ============================================
DO $$
DECLARE
  travel_ar_count INTEGER;
  travel_en_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO travel_ar_count
  FROM source_topics st
  JOIN sources s ON s.id = st.source_id
  JOIN topics t ON t.id = st.topic_id
  WHERE t.slug = 'travel' AND s.language = 'ar' AND s.is_active = true;

  SELECT COUNT(*) INTO travel_en_count
  FROM source_topics st
  JOIN sources s ON s.id = st.source_id
  JOIN topics t ON t.id = st.topic_id
  WHERE t.slug = 'travel' AND s.language = 'en' AND s.is_active = true;

  RAISE NOTICE 'Travel topic sources:';
  RAISE NOTICE '  Arabic sources: %', travel_ar_count;
  RAISE NOTICE '  English sources: %', travel_en_count;
END $$;
