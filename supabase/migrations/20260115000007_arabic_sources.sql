-- ============================================
-- COMPREHENSIVE ARABIC RSS SOURCES
-- ============================================
-- Date: 2026-01-15
-- Adding all Arabic sources for proper coverage
-- ============================================

-- ============================================
-- ARABIC NEWS SOURCES (أخبار عامة)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  -- Major Arabic News Networks
  ('BBC عربي', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'https://bbc.com/arabic', 'ar', 'general', 0.95, true),
  ('الجزيرة', 'https://www.aljazeera.net/aje/articles_rss', 'https://aljazeera.net', 'ar', 'general', 0.92, true),
  ('العربية', 'https://www.alarabiya.net/.mrss/ar.xml', 'https://alarabiya.net', 'ar', 'general', 0.90, true),
  ('سكاي نيوز عربية', 'https://www.skynewsarabia.com/web/rss', 'https://skynewsarabia.com', 'ar', 'general', 0.88, true),
  ('فرانس 24 عربي', 'https://www.france24.com/ar/rss', 'https://france24.com/ar', 'ar', 'general', 0.88, true),
  ('DW عربي', 'https://rss.dw.com/rdf/rss-ar-all', 'https://dw.com/ar', 'ar', 'general', 0.88, true),
  ('RT Arabic', 'https://arabic.rt.com/rss/', 'https://arabic.rt.com', 'ar', 'general', 0.75, true),
  ('الشرق الأوسط', 'https://aawsat.com/feed/rss2', 'https://aawsat.com', 'ar', 'general', 0.88, true),
  ('الشرق', 'https://asharq.com/rss', 'https://asharq.com', 'ar', 'general', 0.85, true),
  ('القدس العربي', 'https://www.alquds.co.uk/feed/', 'https://alquds.co.uk', 'ar', 'general', 0.82, true),
  ('العربي الجديد', 'https://www.alaraby.co.uk/rss.xml', 'https://alaraby.co.uk', 'ar', 'general', 0.82, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- SAUDI SOURCES (مصادر سعودية)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('سبق', 'https://sabq.org/rss', 'https://sabq.org', 'ar', 'saudi', 0.85, true),
  ('عكاظ', 'https://www.okaz.com.sa/rss/all', 'https://okaz.com.sa', 'ar', 'saudi', 0.85, true),
  ('الرياض', 'https://www.alriyadh.com/rss.xml', 'https://alriyadh.com', 'ar', 'saudi', 0.85, true),
  ('المدينة', 'https://www.al-madina.com/rss', 'https://al-madina.com', 'ar', 'saudi', 0.82, true),
  ('الوطن', 'https://www.alwatan.com.sa/rss', 'https://alwatan.com.sa', 'ar', 'saudi', 0.82, true),
  ('اليوم', 'https://www.alyaum.com/rss', 'https://alyaum.com', 'ar', 'saudi', 0.80, true),
  ('الجزيرة السعودية', 'https://www.al-jazirah.com/rss.xml', 'https://al-jazirah.com', 'ar', 'saudi', 0.82, true),
  ('عاجل', 'https://www.ajel.sa/rss', 'https://ajel.sa', 'ar', 'saudi', 0.78, true),
  ('أخبار 24', 'https://akhbaar24.com/feed/', 'https://akhbaar24.com', 'ar', 'saudi', 0.78, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC TECHNOLOGY (تقنية)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('عالم التقنية', 'https://www.tech-wd.com/wd/feed/', 'https://tech-wd.com', 'ar', 'technology', 0.85, true),
  ('البوابة التقنية', 'https://aitnews.com/feed/', 'https://aitnews.com', 'ar', 'technology', 0.83, true),
  ('عرب هاردوير', 'https://arabhardware.net/feed/', 'https://arabhardware.net', 'ar', 'technology', 0.82, true),
  ('التقنية بلا حدود', 'https://www.tech-wd.com/feed/', 'https://tech-wd.com', 'ar', 'technology', 0.80, true),
  ('أراجيك تك', 'https://www.arageek.com/tech/feed', 'https://arageek.com/tech', 'ar', 'technology', 0.78, true),
  ('سعودي تك', 'https://sauditech.net/feed/', 'https://sauditech.net', 'ar', 'technology', 0.75, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC GAMING (ألعاب)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('سعودي جيمر', 'https://saudigamer.com/feed/', 'https://saudigamer.com', 'ar', 'technology', 0.80, true),
  ('جيمرز', 'https://gamers.sa/feed/', 'https://gamers.sa', 'ar', 'technology', 0.78, true),
  ('ترو جيمنج', 'https://true-gaming.net/feed/', 'https://true-gaming.net', 'ar', 'technology', 0.78, true),
  ('عرب جيمرز', 'https://arabicgamers.com/feed/', 'https://arabicgamers.com', 'ar', 'technology', 0.75, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC SPORTS (رياضة)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('كورة', 'https://www.kooora.com/rss/News', 'https://kooora.com', 'ar', 'sports', 0.85, true),
  ('الرياضية', 'https://www.arriyadiyah.com/rss/arriyadiyah.xml', 'https://arriyadiyah.com', 'ar', 'sports', 0.85, true),
  ('يلا كورة', 'https://www.yallakora.com/rss/news', 'https://yallakora.com', 'ar', 'sports', 0.82, true),
  ('فيلجول', 'https://www.filgoal.com/rss/', 'https://filgoal.com', 'ar', 'sports', 0.82, true),
  ('سبورت 360', 'https://sport360.com/ar/feed/', 'https://sport360.com/ar', 'ar', 'sports', 0.80, true),
  ('الدوري السعودي', 'https://www.spl.com.sa/rss', 'https://spl.com.sa', 'ar', 'sports', 0.85, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC ECONOMY & BUSINESS (اقتصاد)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('أرقام', 'https://www.argaam.com/ar/rss/articles', 'https://argaam.com', 'ar', 'economy', 0.90, true),
  ('CNBC عربية', 'https://www.cnbcarabia.com/rss/', 'https://cnbcarabia.com', 'ar', 'economy', 0.88, true),
  ('الاقتصادية', 'https://www.aleqt.com/rss.xml', 'https://aleqt.com', 'ar', 'economy', 0.88, true),
  ('مباشر', 'https://www.mubasher.info/rss', 'https://mubasher.info', 'ar', 'economy', 0.85, true),
  ('العربية أعمال', 'https://www.alarabiya.net/.mrss/ar/aswaq.xml', 'https://alarabiya.net/aswaq', 'ar', 'economy', 0.85, true),
  ('فوربس الشرق الأوسط', 'https://www.forbesmiddleeast.com/ar/feed/', 'https://forbesmiddleeast.com/ar', 'ar', 'economy', 0.85, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC ENTERTAINMENT (ترفيه)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('روتانا', 'https://rotana.net/feed/', 'https://rotana.net', 'ar', 'entertainment', 0.80, true),
  ('MBC', 'https://www.mbc.net/ar/feed/', 'https://mbc.net', 'ar', 'entertainment', 0.85, true),
  ('ليالينا', 'https://www.layalina.com/feed/', 'https://layalina.com', 'ar', 'entertainment', 0.78, true),
  ('سيدتي فن', 'https://www.sayidaty.net/node/feed/entertainment', 'https://sayidaty.net', 'ar', 'entertainment', 0.78, true),
  ('هي', 'https://www.hiamag.com/feed/', 'https://hiamag.com', 'ar', 'entertainment', 0.75, true),
  ('أراجيك فن', 'https://www.arageek.com/art/feed', 'https://arageek.com/art', 'ar', 'entertainment', 0.75, true),
  ('إرم نيوز فن', 'https://www.eremnews.com/entertainment/feed', 'https://eremnews.com', 'ar', 'entertainment', 0.75, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC LIFESTYLE & WOMEN (أسلوب حياة)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('سيدتي', 'https://www.sayidaty.net/node/feed', 'https://sayidaty.net', 'ar', 'lifestyle', 0.82, true),
  ('جمالك', 'https://www.jamalouki.net/feed/', 'https://jamalouki.net', 'ar', 'lifestyle', 0.78, true),
  ('فستاني', 'https://fustany.com/ar/feed/', 'https://fustany.com', 'ar', 'lifestyle', 0.78, true),
  ('مجلة هي', 'https://www.hiamag.com/feed/', 'https://hiamag.com', 'ar', 'lifestyle', 0.78, true),
  ('عروس', 'https://3arouss.com/feed/', 'https://3arouss.com', 'ar', 'lifestyle', 0.75, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC FOOD (طعام)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('فتافيت', 'https://www.fatafeat.com/feed/', 'https://fatafeat.com', 'ar', 'food', 0.82, true),
  ('أطيب طبخة', 'https://www.atyabtabkha.com/feed/', 'https://atyabtabkha.com', 'ar', 'food', 0.80, true),
  ('كوكباد عربي', 'https://cookpad.com/ar/feed/', 'https://cookpad.com/ar', 'ar', 'food', 0.78, true),
  ('مطبخ سيدتي', 'https://www.sayidaty.net/node/feed/recipes', 'https://sayidaty.net', 'ar', 'food', 0.78, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC CARS (سيارات)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('عرب جي تي', 'https://www.arabgt.com/feed/', 'https://arabgt.com', 'ar', 'automotive', 0.82, true),
  ('موتري', 'https://motory.com/ar/feed/', 'https://motory.com', 'ar', 'automotive', 0.80, true),
  ('سيارة', 'https://www.sayarah.net/feed/', 'https://sayarah.net', 'ar', 'automotive', 0.78, true),
  ('تيربو العرب', 'https://turbo.com.sa/feed/', 'https://turbo.com.sa', 'ar', 'automotive', 0.78, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC HEALTH (صحة)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('ويب طب', 'https://www.webteb.com/rss', 'https://webteb.com', 'ar', 'health', 0.85, true),
  ('صحتك', 'https://www.sehatok.com/feed/', 'https://sehatok.com', 'ar', 'health', 0.80, true),
  ('الطبي', 'https://altibbi.com/feed/', 'https://altibbi.com', 'ar', 'health', 0.82, true),
  ('كل يوم معلومة طبية', 'https://www.dailymedicalinfo.com/feed/', 'https://dailymedicalinfo.com', 'ar', 'health', 0.78, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC SCIENCE (علوم)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('ناسا بالعربي', 'https://nasainarabic.net/feed/', 'https://nasainarabic.net', 'ar', 'science', 0.88, true),
  ('العلوم للعموم', 'https://www.scientificamerican.com/arabic/rss/', 'https://scientificamerican.com/arabic', 'ar', 'science', 0.90, true),
  ('الفيزياء العربية', 'https://arabicphysics.com/feed/', 'https://arabicphysics.com', 'ar', 'science', 0.78, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC EDUCATION (تعليم)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('إدراك', 'https://www.edraak.org/feed/', 'https://edraak.org', 'ar', 'science', 0.85, true),
  ('رواق', 'https://www.rwaq.org/feed/', 'https://rwaq.org', 'ar', 'science', 0.82, true),
  ('أكاديمية حسوب', 'https://academy.hsoub.com/feed/', 'https://academy.hsoub.com', 'ar', 'science', 0.82, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- ARABIC TRAVEL (سياحة)
-- ============================================
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active) VALUES
  ('سفاري نت', 'https://www.safariway.net/feed/', 'https://safariway.net', 'ar', 'lifestyle', 0.78, true),
  ('المسافر العربي', 'https://www.almosafer.com/ar/feed/', 'https://almosafer.com', 'ar', 'lifestyle', 0.78, true)
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- ============================================
-- LOG RESULTS
-- ============================================
DO $$
DECLARE
  total_ar INTEGER;
  active_ar INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_ar FROM rss_sources WHERE language = 'ar';
  SELECT COUNT(*) INTO active_ar FROM rss_sources WHERE language = 'ar' AND is_active = true;

  RAISE NOTICE 'Arabic RSS Sources Added:';
  RAISE NOTICE '  Total Arabic: %', total_ar;
  RAISE NOTICE '  Active Arabic: %', active_ar;
END $$;
