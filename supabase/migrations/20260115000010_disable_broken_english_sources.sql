-- ============================================
-- DISABLE BROKEN ENGLISH RSS SOURCES
-- ============================================
-- Date: 2026-01-15
-- Testing revealed these URLs return 404/403/timeout
-- ============================================

-- Reuters (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best';

-- Bleacher Report (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://bleacherreport.com/articles/feed';

-- Entertainment Weekly (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://ew.com/feed/';

-- CNBC (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.cnbc.com/id/100003114/device/rss/rss.html';

-- Medical News Today (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.medicalnewstoday.com/rss';

-- WebMD (timeout)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC';

-- Food Network (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.foodnetwork.com/fn-dish/rss';

-- Motor1 (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.motor1.com/rss/news/';

-- Autoblog (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.autoblog.com/rss.xml';

-- National Geographic (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.nationalgeographic.com/animals/feed';

-- ============================================
-- LOG RESULTS
-- ============================================
DO $$
DECLARE
  total_active INTEGER;
  ar_active INTEGER;
  en_active INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_active FROM rss_sources WHERE is_active = true;
  SELECT COUNT(*) INTO ar_active FROM rss_sources WHERE is_active = true AND language = 'ar';
  SELECT COUNT(*) INTO en_active FROM rss_sources WHERE is_active = true AND language = 'en';

  RAISE NOTICE 'RSS Sources Status After Cleanup:';
  RAISE NOTICE '  Total Active: %', total_active;
  RAISE NOTICE '  Arabic Active: %', ar_active;
  RAISE NOTICE '  English Active: %', en_active;
END $$;
