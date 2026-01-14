-- ============================================
-- ADD GOOGLE NEWS RSS FOR BLOCKED ARABIC SOURCES
-- ============================================
-- Date: 2026-01-15
-- Many major Arabic sites block direct RSS access
-- Using Google News RSS as a workaround
-- ============================================

-- Al Arabiya via Google News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('العربية', 'https://news.google.com/rss/search?q=site:alarabiya.net&hl=ar&gl=SA&ceid=SA:ar', 'https://alarabiya.net', 'ar', 'general', 0.90, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- Al Jazeera via Google News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('الجزيرة', 'https://news.google.com/rss/search?q=site:aljazeera.net&hl=ar&gl=SA&ceid=SA:ar', 'https://aljazeera.net', 'ar', 'general', 0.92, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- Sky News Arabia via Google News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('سكاي نيوز عربية', 'https://news.google.com/rss/search?q=site:skynewsarabia.com&hl=ar&gl=SA&ceid=SA:ar', 'https://skynewsarabia.com', 'ar', 'general', 0.88, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- Asharq Al-Awsat via Google News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('الشرق الأوسط', 'https://news.google.com/rss/search?q=site:aawsat.com&hl=ar&gl=SA&ceid=SA:ar', 'https://aawsat.com', 'ar', 'general', 0.88, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- Asharq via Google News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('الشرق', 'https://news.google.com/rss/search?q=site:asharq.com&hl=ar&gl=SA&ceid=SA:ar', 'https://asharq.com', 'ar', 'general', 0.85, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- Kooora (Sports) via Google News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('كورة', 'https://news.google.com/rss/search?q=site:kooora.com&hl=ar&gl=SA&ceid=SA:ar', 'https://kooora.com', 'ar', 'sports', 0.85, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- FilGoal (Sports) via Google News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('فيلجول', 'https://news.google.com/rss/search?q=site:filgoal.com&hl=ar&gl=SA&ceid=SA:ar', 'https://filgoal.com', 'ar', 'sports', 0.82, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- MBC via Google News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('MBC', 'https://news.google.com/rss/search?q=site:mbc.net&hl=ar&gl=SA&ceid=SA:ar', 'https://mbc.net', 'ar', 'entertainment', 0.85, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- Disable the old broken URLs for these sources
UPDATE rss_sources SET is_active = false WHERE feed_url IN (
  'https://www.aljazeera.net/aje/articles_rss',
  'https://www.alarabiya.net/.mrss/ar.xml',
  'https://www.skynewsarabia.com/web/rss',
  'https://aawsat.com/feed/rss2',
  'https://asharq.com/rss',
  'https://www.kooora.com/rss/News',
  'https://www.filgoal.com/rss/',
  'https://www.mbc.net/ar/feed/'
);

-- ============================================
-- LOG RESULTS
-- ============================================
DO $$
DECLARE
  total_ar INTEGER;
  active_ar INTEGER;
  google_feeds INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_ar FROM rss_sources WHERE language = 'ar';
  SELECT COUNT(*) INTO active_ar FROM rss_sources WHERE language = 'ar' AND is_active = true;
  SELECT COUNT(*) INTO google_feeds FROM rss_sources WHERE language = 'ar' AND is_active = true AND feed_url LIKE '%news.google.com%';

  RAISE NOTICE 'Arabic RSS Sources Updated:';
  RAISE NOTICE '  Total Arabic: %', total_ar;
  RAISE NOTICE '  Active Arabic: %', active_ar;
  RAISE NOTICE '  Google News feeds: %', google_feeds;
END $$;
