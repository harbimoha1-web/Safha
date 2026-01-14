-- Migration: Add RSS sources for missing topics
-- Each topic needs 2 Arabic + 2 English sources
-- Categories: entertainment, lifestyle, automotive, food

-- ============================================
-- ENTERTAINMENT SOURCES (Comedy, Anime, Shows)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  -- Arabic Entertainment
  ('السينما', 'https://www.elcinema.com/rss/', 'https://elcinema.com', 'ar', 'entertainment', 0.78, true),
  ('مصراوي فن', 'https://www.masrawy.com/arts/rss', 'https://masrawy.com/arts', 'ar', 'entertainment', 0.76, true),
  ('البوابة الفنية', 'https://www.albawaba.com/ar/entertainment/rss', 'https://albawaba.com/ar/entertainment', 'ar', 'entertainment', 0.75, true),
  ('فيتو فن', 'https://www.vetogate.com/rss/section/5', 'https://vetogate.com/section/5', 'ar', 'entertainment', 0.74, true),
  -- English Entertainment
  ('Entertainment Weekly', 'https://ew.com/feed/', 'https://ew.com', 'en', 'entertainment', 0.85, true),
  ('Variety', 'https://variety.com/feed/', 'https://variety.com', 'en', 'entertainment', 0.88, true),
  ('Deadline', 'https://deadline.com/feed/', 'https://deadline.com', 'en', 'entertainment', 0.86, true),
  ('The Hollywood Reporter', 'https://www.hollywoodreporter.com/feed/', 'https://hollywoodreporter.com', 'en', 'entertainment', 0.87, true),
  -- English Anime/Comics
  ('Anime News Network', 'https://www.animenewsnetwork.com/all/rss.xml', 'https://animenewsnetwork.com', 'en', 'entertainment', 0.85, true),
  ('Comic Book Resources', 'https://www.cbr.com/feed/', 'https://cbr.com', 'en', 'entertainment', 0.80, true),
  -- English Comedy/Viral
  ('BuzzFeed', 'https://www.buzzfeed.com/index.xml', 'https://buzzfeed.com', 'en', 'entertainment', 0.70, true),
  ('BoredPanda', 'https://www.boredpanda.com/feed/', 'https://boredpanda.com', 'en', 'entertainment', 0.72, true)
ON CONFLICT (feed_url) DO NOTHING;

-- ============================================
-- LIFESTYLE SOURCES (Beauty, Pets/Animals)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  -- Arabic Beauty/Lifestyle
  ('جمالك', 'https://www.jamalouki.net/rss', 'https://jamalouki.net', 'ar', 'lifestyle', 0.78, true),
  ('فستاني', 'https://fustany.com/ar/rss', 'https://fustany.com', 'ar', 'lifestyle', 0.76, true),
  ('ليالينا', 'https://www.layalina.com/feed/', 'https://layalina.com', 'ar', 'lifestyle', 0.77, true),
  ('سيدتي', 'https://www.sayidaty.net/rss', 'https://sayidaty.net', 'ar', 'lifestyle', 0.80, true),
  -- English Beauty
  ('Allure', 'https://www.allure.com/feed/rss', 'https://allure.com', 'en', 'lifestyle', 0.82, true),
  ('Byrdie', 'https://www.byrdie.com/rss', 'https://byrdie.com', 'en', 'lifestyle', 0.80, true),
  -- English Animals/Pets
  ('National Geographic Animals', 'https://www.nationalgeographic.com/animals/rss', 'https://nationalgeographic.com/animals', 'en', 'lifestyle', 0.90, true),
  ('The Dodo', 'https://www.thedodo.com/rss', 'https://thedodo.com', 'en', 'lifestyle', 0.80, true),
  ('PetMD', 'https://www.petmd.com/rss', 'https://petmd.com', 'en', 'lifestyle', 0.82, true)
ON CONFLICT (feed_url) DO NOTHING;

-- ============================================
-- AUTOMOTIVE SOURCES (Cars & Off-road)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  -- Arabic Cars
  ('عرب جي تي', 'https://www.arabgt.com/feed/', 'https://arabgt.com', 'ar', 'automotive', 0.80, true),
  ('موتوري', 'https://motory.com/ar/rss', 'https://motory.com', 'ar', 'automotive', 0.78, true),
  ('سيارة', 'https://www.sayarah.com/feed/', 'https://sayarah.com', 'ar', 'automotive', 0.76, true),
  -- English Cars
  ('Motor1', 'https://www.motor1.com/rss/news/', 'https://motor1.com', 'en', 'automotive', 0.85, true),
  ('Top Speed', 'https://www.topspeed.com/feed/', 'https://topspeed.com', 'en', 'automotive', 0.82, true),
  ('Car and Driver', 'https://www.caranddriver.com/rss/all.xml/', 'https://caranddriver.com', 'en', 'automotive', 0.88, true)
ON CONFLICT (feed_url) DO NOTHING;

-- ============================================
-- FOOD SOURCES
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  -- Arabic Food
  ('شهية', 'https://shahiya.com/ar/rss', 'https://shahiya.com', 'ar', 'food', 0.80, true),
  ('أطيب طبخة', 'https://www.atyabtabkha.com/rss', 'https://atyabtabkha.com', 'ar', 'food', 0.78, true),
  ('كوكباد عربي', 'https://cookpad.com/ar/rss', 'https://cookpad.com/ar', 'ar', 'food', 0.77, true),
  -- English Food
  ('Serious Eats', 'https://www.seriouseats.com/rss', 'https://seriouseats.com', 'en', 'food', 0.85, true),
  ('Bon Appetit', 'https://www.bonappetit.com/feed/rss', 'https://bonappetit.com', 'en', 'food', 0.85, true),
  ('Food Network', 'https://www.foodnetwork.com/rss', 'https://foodnetwork.com', 'en', 'food', 0.82, true)
ON CONFLICT (feed_url) DO NOTHING;

-- ============================================
-- ARABIC SCIENCE SOURCES (filling gap)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('العلوم للعموم', 'https://www.scientificamerican.com/arabic/rss/', 'https://scientificamerican.com/arabic', 'ar', 'science', 0.90, true),
  ('ناسا بالعربي', 'https://nasainarabic.net/feed/', 'https://nasainarabic.net', 'ar', 'science', 0.88, true),
  ('الفيزياء العربية', 'https://arabicphysics.com/feed/', 'https://arabicphysics.com', 'ar', 'science', 0.75, true)
ON CONFLICT (feed_url) DO NOTHING;

-- ============================================
-- ARABIC HEALTH SOURCES (filling gap)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('ويب طب', 'https://www.webteb.com/rss', 'https://webteb.com', 'ar', 'health', 0.82, true),
  ('صحتك', 'https://www.sehatok.com/feed/', 'https://sehatok.com', 'ar', 'health', 0.78, true),
  ('الطبي', 'https://altibbi.com/feed/', 'https://altibbi.com', 'ar', 'health', 0.80, true)
ON CONFLICT (feed_url) DO NOTHING;

-- Log results
DO $$
DECLARE
  new_source_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO new_source_count FROM rss_sources WHERE created_at > NOW() - INTERVAL '1 minute';
  RAISE NOTICE 'Added % new RSS sources', new_source_count;
END $$;
