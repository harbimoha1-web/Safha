-- ============================================
-- FIX RSS FEED URLs
-- ============================================
-- Date: 2026-01-15
-- Many RSS URLs were outdated/404, fixing with verified working URLs
-- ============================================

-- Delete all existing sources and start fresh with verified URLs
DELETE FROM rss_sources;

-- ============================================
-- VERIFIED WORKING RSS SOURCES
-- ============================================

-- ARABIC NEWS (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('BBC عربي', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'https://bbc.com/arabic', 'ar', 'general', 0.95, true),
  ('سكاي نيوز عربية', 'https://www.skynewsarabia.com/web/rss', 'https://skynewsarabia.com', 'ar', 'general', 0.88, true),
  ('RT Arabic', 'https://arabic.rt.com/rss/', 'https://arabic.rt.com', 'ar', 'general', 0.75, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- ENGLISH NEWS (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('BBC News', 'https://feeds.bbci.co.uk/news/rss.xml', 'https://bbc.com/news', 'en', 'general', 0.95, true),
  ('NPR News', 'https://feeds.npr.org/1001/rss.xml', 'https://npr.org', 'en', 'general', 0.92, true),
  ('Reuters Top News', 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', 'https://reuters.com', 'en', 'general', 0.95, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- TECHNOLOGY (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'en', 'technology', 0.88, true),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'https://theverge.com', 'en', 'technology', 0.88, true),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/technology-lab', 'https://arstechnica.com', 'en', 'technology', 0.90, true),
  ('Wired', 'https://www.wired.com/feed/rss', 'https://wired.com', 'en', 'technology', 0.87, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- SCIENCE (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('Nature', 'https://www.nature.com/nature.rss', 'https://nature.com', 'en', 'science', 0.95, true),
  ('Science Daily', 'https://www.sciencedaily.com/rss/all.xml', 'https://sciencedaily.com', 'en', 'science', 0.88, true),
  ('Live Science', 'https://www.livescience.com/feeds/all', 'https://livescience.com', 'en', 'science', 0.85, true),
  ('NASA', 'https://www.nasa.gov/rss/dyn/breaking_news.rss', 'https://nasa.gov', 'en', 'science', 0.95, true),
  ('Space.com', 'https://www.space.com/feeds/all', 'https://space.com', 'en', 'science', 0.85, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- SPORTS (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('ESPN', 'https://www.espn.com/espn/rss/news', 'https://espn.com', 'en', 'sports', 0.88, true),
  ('BBC Sport', 'https://feeds.bbci.co.uk/sport/rss.xml', 'https://bbc.com/sport', 'en', 'sports', 0.90, true),
  ('Bleacher Report', 'https://bleacherreport.com/articles/feed', 'https://bleacherreport.com', 'en', 'sports', 0.80, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- ENTERTAINMENT (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('Variety', 'https://variety.com/feed/', 'https://variety.com', 'en', 'entertainment', 0.88, true),
  ('Hollywood Reporter', 'https://www.hollywoodreporter.com/feed/', 'https://hollywoodreporter.com', 'en', 'entertainment', 0.87, true),
  ('Entertainment Weekly', 'https://ew.com/feed/', 'https://ew.com', 'en', 'entertainment', 0.85, true),
  ('Deadline', 'https://deadline.com/feed/', 'https://deadline.com', 'en', 'entertainment', 0.86, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- GAMING (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('IGN', 'https://feeds.feedburner.com/ign/all', 'https://ign.com', 'en', 'technology', 0.85, true),
  ('Kotaku', 'https://kotaku.com/rss', 'https://kotaku.com', 'en', 'technology', 0.82, true),
  ('PC Gamer', 'https://www.pcgamer.com/rss/', 'https://pcgamer.com', 'en', 'technology', 0.84, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- BUSINESS (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('CNBC', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'https://cnbc.com', 'en', 'economy', 0.88, true),
  ('Financial Times', 'https://www.ft.com/rss/home', 'https://ft.com', 'en', 'economy', 0.92, true),
  ('MarketWatch', 'https://feeds.marketwatch.com/marketwatch/topstories/', 'https://marketwatch.com', 'en', 'economy', 0.85, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- HEALTH (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('Medical News Today', 'https://www.medicalnewstoday.com/rss', 'https://medicalnewstoday.com', 'en', 'health', 0.85, true),
  ('WebMD', 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', 'https://webmd.com', 'en', 'health', 0.85, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- FOOD (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('Serious Eats', 'https://www.seriouseats.com/atom.xml', 'https://seriouseats.com', 'en', 'food', 0.85, true),
  ('Food Network', 'https://www.foodnetwork.com/fn-dish/rss', 'https://foodnetwork.com', 'en', 'food', 0.82, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- AUTOMOTIVE (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('Motor1', 'https://www.motor1.com/rss/news/', 'https://motor1.com', 'en', 'automotive', 0.85, true),
  ('Car and Driver', 'https://www.caranddriver.com/rss/all.xml/', 'https://caranddriver.com', 'en', 'automotive', 0.88, true),
  ('Autoblog', 'https://www.autoblog.com/rss.xml', 'https://autoblog.com', 'en', 'automotive', 0.83, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- LIFESTYLE/TRAVEL (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('Condé Nast Traveler', 'https://www.cntraveler.com/feed/rss', 'https://cntraveler.com', 'en', 'lifestyle', 0.85, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- ANIME/COMICS (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('Anime News Network', 'https://www.animenewsnetwork.com/all/rss.xml', 'https://animenewsnetwork.com', 'en', 'entertainment', 0.85, true),
  ('CBR', 'https://www.cbr.com/feed/', 'https://cbr.com', 'en', 'entertainment', 0.80, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- ANIMALS (Verified Working)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('National Geographic', 'https://www.nationalgeographic.com/animals/feed', 'https://nationalgeographic.com/animals', 'en', 'lifestyle', 0.90, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true;

-- Log results
DO $$
DECLARE
  total_count INTEGER;
  ar_count INTEGER;
  en_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM rss_sources WHERE is_active = true;
  SELECT COUNT(*) INTO ar_count FROM rss_sources WHERE is_active = true AND language = 'ar';
  SELECT COUNT(*) INTO en_count FROM rss_sources WHERE is_active = true AND language = 'en';

  RAISE NOTICE 'Fixed RSS Sources:';
  RAISE NOTICE '  Total Active: %', total_count;
  RAISE NOTICE '  Arabic: %', ar_count;
  RAISE NOTICE '  English: %', en_count;
END $$;
