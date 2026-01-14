-- ============================================
-- COMPREHENSIVE RSS SOURCES SEED
-- ============================================
-- Date: 2026-01-15
-- Purpose: Seed all RSS sources with feed URLs
-- The rss_sources table was empty, preventing RSS fetching
-- ============================================

-- ============================================
-- ARABIC NEWS SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  ('BBC عربي', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'https://bbc.com/arabic', 'ar', 'general', 0.95, true, 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/BBC_News_2022_%28Alt%29.svg/200px-BBC_News_2022_%28Alt%29.svg.png'),
  ('الجزيرة', 'https://www.aljazeera.net/aje/articles_rss', 'https://aljazeera.net', 'ar', 'general', 0.92, true, 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/200px-Aljazeera_eng.svg.png'),
  ('العربية', 'https://www.alarabiya.net/ar/rss.xml', 'https://alarabiya.net', 'ar', 'general', 0.90, true, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Al_Arabiya_logo.svg/200px-Al_Arabiya_logo.svg.png'),
  ('سكاي نيوز عربية', 'https://www.skynewsarabia.com/rss/main', 'https://skynewsarabia.com', 'ar', 'general', 0.88, true, NULL),
  ('روسيا اليوم عربي', 'https://arabic.rt.com/rss/', 'https://arabic.rt.com', 'ar', 'general', 0.75, true, NULL),
  ('الشرق الأوسط', 'https://aawsat.com/feed/rss2', 'https://aawsat.com', 'ar', 'general', 0.88, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ENGLISH NEWS SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  ('Al Jazeera English', 'https://www.aljazeera.com/xml/rss/all.xml', 'https://aljazeera.com', 'en', 'general', 0.90, true, NULL),
  ('Reuters', 'https://www.reutersagency.com/feed/', 'https://reuters.com', 'en', 'general', 0.95, true, NULL),
  ('BBC News', 'https://feeds.bbci.co.uk/news/rss.xml', 'https://bbc.com/news', 'en', 'general', 0.95, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- SAUDI NEWS SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  ('سبق', 'https://sabq.org/rss', 'https://sabq.org', 'ar', 'saudi', 0.82, true, NULL),
  ('عكاظ', 'https://www.okaz.com.sa/rss', 'https://okaz.com.sa', 'ar', 'saudi', 0.85, true, NULL),
  ('الرياض', 'https://www.alriyadh.com/rss', 'https://alriyadh.com', 'ar', 'saudi', 0.85, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- TECHNOLOGY SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- Arabic Tech
  ('عالم التقنية', 'https://www.tech-wd.com/wd/feed/', 'https://tech-wd.com', 'ar', 'technology', 0.82, true, NULL),
  ('البوابة التقنية', 'https://aitnews.com/feed/', 'https://aitnews.com', 'ar', 'technology', 0.80, true, NULL),
  ('عرب هاردوير', 'https://arabhardware.net/feed/', 'https://arabhardware.net', 'ar', 'technology', 0.82, true, NULL),
  -- English Tech
  ('TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'en', 'technology', 0.88, true, NULL),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'https://theverge.com', 'en', 'technology', 0.88, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ECONOMY & BUSINESS SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- Arabic Business
  ('أرقام', 'https://www.argaam.com/ar/rss/articles', 'https://argaam.com', 'ar', 'economy', 0.88, true, NULL),
  ('CNBC عربية', 'https://www.cnbcarabia.com/rss/', 'https://cnbcarabia.com', 'ar', 'economy', 0.85, true, NULL),
  -- English Business
  ('Bloomberg', 'https://www.bloomberg.com/feed/podcast/etf-report.xml', 'https://bloomberg.com', 'en', 'economy', 0.90, true, NULL),
  ('CNBC', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'https://cnbc.com', 'en', 'economy', 0.88, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- SPORTS SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- Arabic Sports
  ('كورة', 'https://www.kooora.com/rss/all', 'https://kooora.com', 'ar', 'sports', 0.85, true, NULL),
  ('الرياضية', 'https://www.arriyadiyah.com/rss', 'https://arriyadiyah.com', 'ar', 'sports', 0.82, true, NULL),
  -- English Sports
  ('ESPN', 'https://www.espn.com/espn/rss/news', 'https://espn.com', 'en', 'sports', 0.88, true, NULL),
  ('Sky Sports', 'https://www.skysports.com/rss/12040', 'https://skysports.com', 'en', 'sports', 0.87, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ENTERTAINMENT SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- Arabic Entertainment
  ('روتانا', 'https://rotana.net/feed/', 'https://rotana.net', 'ar', 'entertainment', 0.78, true, NULL),
  ('ليالينا', 'https://www.layalina.com/feed/', 'https://layalina.com', 'ar', 'entertainment', 0.77, true, NULL),
  ('MBC', 'https://www.mbc.net/feed/', 'https://mbc.net', 'ar', 'entertainment', 0.82, true, NULL),
  -- English Entertainment
  ('Variety', 'https://variety.com/feed/', 'https://variety.com', 'en', 'entertainment', 0.88, true, NULL),
  ('Hollywood Reporter', 'https://www.hollywoodreporter.com/feed/', 'https://hollywoodreporter.com', 'en', 'entertainment', 0.87, true, NULL),
  ('Entertainment Weekly', 'https://ew.com/feed/', 'https://ew.com', 'en', 'entertainment', 0.85, true, NULL),
  ('Deadline', 'https://deadline.com/feed/', 'https://deadline.com', 'en', 'entertainment', 0.86, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- GAMING SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- Arabic Gaming
  ('سعودي جيمر', 'https://saudigamer.com/feed/', 'https://saudigamer.com', 'ar', 'technology', 0.78, true, NULL),
  -- English Gaming
  ('IGN', 'https://feeds.feedburner.com/ign/all', 'https://ign.com', 'en', 'technology', 0.85, true, NULL),
  ('Kotaku', 'https://kotaku.com/rss', 'https://kotaku.com', 'en', 'technology', 0.82, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- SCIENCE SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- English Science
  ('Nature', 'https://www.nature.com/nature.rss', 'https://nature.com', 'en', 'science', 0.95, true, NULL),
  ('Scientific American', 'https://rss.sciam.com/ScientificAmerican-Global', 'https://scientificamerican.com', 'en', 'science', 0.92, true, NULL),
  ('Live Science', 'https://www.livescience.com/feeds/all', 'https://livescience.com', 'en', 'science', 0.85, true, NULL),
  ('National Geographic', 'https://www.nationalgeographic.com/rss/', 'https://nationalgeographic.com', 'en', 'science', 0.90, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- HEALTH SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- Arabic Health
  ('ويب طب', 'https://www.webteb.com/rss', 'https://webteb.com', 'ar', 'health', 0.82, true, NULL),
  ('صحتك', 'https://www.sehatok.com/feed/', 'https://sehatok.com', 'ar', 'health', 0.78, true, NULL),
  -- English Health
  ('WebMD', 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', 'https://webmd.com', 'en', 'health', 0.85, true, NULL),
  ('Healthline', 'https://www.healthline.com/rss', 'https://healthline.com', 'en', 'health', 0.83, true, NULL),
  ('Harvard Health', 'https://www.health.harvard.edu/blog/feed', 'https://health.harvard.edu', 'en', 'health', 0.92, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- FOOD SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- Arabic Food
  ('فتافيت', 'https://www.fatafeat.com/feed/', 'https://fatafeat.com', 'ar', 'food', 0.80, true, NULL),
  -- English Food
  ('Bon Appetit', 'https://www.bonappetit.com/feed/rss', 'https://bonappetit.com', 'en', 'food', 0.85, true, NULL),
  ('Serious Eats', 'https://www.seriouseats.com/rss', 'https://seriouseats.com', 'en', 'food', 0.85, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- LIFESTYLE & BEAUTY SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- Arabic Lifestyle
  ('سيدتي', 'https://www.sayidaty.net/rss', 'https://sayidaty.net', 'ar', 'lifestyle', 0.80, true, NULL),
  -- English Lifestyle
  ('Allure', 'https://www.allure.com/feed/rss', 'https://allure.com', 'en', 'lifestyle', 0.82, true, NULL),
  ('Byrdie', 'https://www.byrdie.com/rss', 'https://byrdie.com', 'en', 'lifestyle', 0.80, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- AUTOMOTIVE SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  -- Arabic Automotive
  ('عرب جي تي', 'https://www.arabgt.com/feed/', 'https://arabgt.com', 'ar', 'automotive', 0.80, true, NULL),
  -- English Automotive
  ('Motor1', 'https://www.motor1.com/rss/news/', 'https://motor1.com', 'en', 'automotive', 0.85, true, NULL),
  ('Car and Driver', 'https://www.caranddriver.com/rss/all.xml/', 'https://caranddriver.com', 'en', 'automotive', 0.88, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- TRAVEL SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  ('Lonely Planet', 'https://www.lonelyplanet.com/rss', 'https://lonelyplanet.com', 'en', 'lifestyle', 0.85, true, NULL),
  ('Travel + Leisure', 'https://www.travelandleisure.com/feed', 'https://travelandleisure.com', 'en', 'lifestyle', 0.83, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ANIMALS & PETS SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  ('The Dodo', 'https://www.thedodo.com/rss', 'https://thedodo.com', 'en', 'lifestyle', 0.80, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- COMEDY/VIRAL SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  ('BuzzFeed', 'https://www.buzzfeed.com/index.xml', 'https://buzzfeed.com', 'en', 'entertainment', 0.70, true, NULL),
  ('BoredPanda', 'https://www.boredpanda.com/feed/', 'https://boredpanda.com', 'en', 'entertainment', 0.72, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ANIME/COMICS SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  ('Anime News Network', 'https://www.animenewsnetwork.com/all/rss.xml', 'https://animenewsnetwork.com', 'en', 'entertainment', 0.85, true, NULL),
  ('CBR', 'https://www.cbr.com/feed/', 'https://cbr.com', 'en', 'entertainment', 0.80, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- EDUCATION SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url) VALUES
  ('Khan Academy', 'https://www.khanacademy.org/rss.xml', 'https://khanacademy.org', 'en', 'science', 0.90, true, NULL),
  ('Coursera', 'https://blog.coursera.org/feed/', 'https://coursera.org', 'en', 'science', 0.88, true, NULL)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- LOG RESULTS
-- ============================================
DO $$
DECLARE
  total_sources INTEGER;
  arabic_sources INTEGER;
  english_sources INTEGER;
  active_sources INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_sources FROM rss_sources;
  SELECT COUNT(*) INTO arabic_sources FROM rss_sources WHERE language = 'ar';
  SELECT COUNT(*) INTO english_sources FROM rss_sources WHERE language = 'en';
  SELECT COUNT(*) INTO active_sources FROM rss_sources WHERE is_active = true;

  RAISE NOTICE 'RSS Sources Seeded:';
  RAISE NOTICE '  Total: %', total_sources;
  RAISE NOTICE '  Arabic: %', arabic_sources;
  RAISE NOTICE '  English: %', english_sources;
  RAISE NOTICE '  Active: %', active_sources;
END $$;
