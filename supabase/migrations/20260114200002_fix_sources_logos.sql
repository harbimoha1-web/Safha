-- Migration: Fix Sources - 2 Arabic + 2 English Per Topic with Working Logos
-- Uses Google Favicon API for reliable logos: https://www.google.com/s2/favicons?domain=X&sz=128

-- ============================================
-- STEP 1: Reset - Deactivate all and clear mappings
-- ============================================
UPDATE rss_sources SET is_active = false;
UPDATE sources SET is_active = false;
DELETE FROM source_topics;

-- ============================================
-- STEP 2: Create/Update all curated sources
-- Using UPSERT pattern with Google Favicon logos
-- ============================================

-- ==================== POLITICS ====================
-- Arabic: Al Jazeera
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('الجزيرة', 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4571-a6eb-a8f8b77ea821/73d0e1b4-532f-45ef-b135-bba0a9a5943d', 'https://aljazeera.net', 'ar', 'general', 0.88, true, 'https://www.google.com/s2/favicons?domain=aljazeera.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Al Arabiya
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('العربية', 'https://www.alarabiya.net/ar/rss.xml', 'https://alarabiya.net', 'ar', 'general', 0.87, true, 'https://www.google.com/s2/favicons?domain=alarabiya.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Reuters
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Reuters', 'https://www.reutersagency.com/feed/', 'https://reuters.com', 'en', 'general', 0.92, true, 'https://www.google.com/s2/favicons?domain=reuters.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: BBC
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('BBC News', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'https://bbc.com', 'en', 'general', 0.92, true, 'https://www.google.com/s2/favicons?domain=bbc.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== ECONOMY ====================
-- Arabic: Argaam
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('أرقام', 'https://www.argaam.com/ar/rss/articles', 'https://argaam.com', 'ar', 'economy', 0.88, true, 'https://www.google.com/s2/favicons?domain=argaam.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Al Eqtisadiah
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('الاقتصادية', 'https://www.aleqt.com/rss', 'https://aleqt.com', 'ar', 'economy', 0.85, true, 'https://www.google.com/s2/favicons?domain=aleqt.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Bloomberg
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Bloomberg', 'https://feeds.bloomberg.com/markets/news.rss', 'https://bloomberg.com', 'en', 'economy', 0.92, true, 'https://www.google.com/s2/favicons?domain=bloomberg.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: CNBC
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('CNBC', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'https://cnbc.com', 'en', 'economy', 0.88, true, 'https://www.google.com/s2/favicons?domain=cnbc.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== TECHNOLOGY ====================
-- Arabic: AIT News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('البوابة التقنية', 'https://aitnews.com/feed/', 'https://aitnews.com', 'ar', 'technology', 0.85, true, 'https://www.google.com/s2/favicons?domain=aitnews.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Tech-wd
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('عالم التقنية', 'https://www.tech-wd.com/wd/feed/', 'https://tech-wd.com', 'ar', 'technology', 0.82, true, 'https://www.google.com/s2/favicons?domain=tech-wd.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: TechCrunch
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'en', 'technology', 0.90, true, 'https://www.google.com/s2/favicons?domain=techcrunch.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: The Verge
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('The Verge', 'https://www.theverge.com/rss/index.xml', 'https://theverge.com', 'en', 'technology', 0.88, true, 'https://www.google.com/s2/favicons?domain=theverge.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== GAMING ====================
-- Arabic: Arab Hardware
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('عرب هاردوير', 'https://arabhardware.net/feed/', 'https://arabhardware.net', 'ar', 'technology', 0.85, true, 'https://www.google.com/s2/favicons?domain=arabhardware.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: True Gaming
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('ترو جيمنج', 'https://www.true-gaming.net/feed/', 'https://true-gaming.net', 'ar', 'technology', 0.80, true, 'https://www.google.com/s2/favicons?domain=true-gaming.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: IGN
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('IGN', 'https://feeds.feedburner.com/ign/all', 'https://ign.com', 'en', 'technology', 0.88, true, 'https://www.google.com/s2/favicons?domain=ign.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Kotaku
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Kotaku', 'https://kotaku.com/rss', 'https://kotaku.com', 'en', 'technology', 0.85, true, 'https://www.google.com/s2/favicons?domain=kotaku.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== SPORTS ====================
-- Arabic: Kooora
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('كورة', 'https://www.kooora.com/rss/', 'https://kooora.com', 'ar', 'sports', 0.85, true, 'https://www.google.com/s2/favicons?domain=kooora.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Al Riyadiyah
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('الرياضية', 'https://www.arriyadiyah.com/rss', 'https://arriyadiyah.com', 'ar', 'sports', 0.82, true, 'https://www.google.com/s2/favicons?domain=arriyadiyah.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: ESPN
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('ESPN', 'https://www.espn.com/espn/rss/news', 'https://espn.com', 'en', 'sports', 0.90, true, 'https://www.google.com/s2/favicons?domain=espn.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Sky Sports
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Sky Sports', 'https://www.skysports.com/rss/12040', 'https://skysports.com', 'en', 'sports', 0.88, true, 'https://www.google.com/s2/favicons?domain=skysports.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== ENTERTAINMENT ====================
-- Arabic: El Cinema
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('السينما', 'https://www.elcinema.com/rss/', 'https://elcinema.com', 'ar', 'entertainment', 0.82, true, 'https://www.google.com/s2/favicons?domain=elcinema.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Rotana
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('روتانا', 'https://rotana.net/feed/', 'https://rotana.net', 'ar', 'entertainment', 0.80, true, 'https://www.google.com/s2/favicons?domain=rotana.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Variety
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Variety', 'https://variety.com/feed/', 'https://variety.com', 'en', 'entertainment', 0.90, true, 'https://www.google.com/s2/favicons?domain=variety.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Hollywood Reporter
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Hollywood Reporter', 'https://www.hollywoodreporter.com/feed/', 'https://hollywoodreporter.com', 'en', 'entertainment', 0.88, true, 'https://www.google.com/s2/favicons?domain=hollywoodreporter.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== SHOWS ====================
-- Arabic: MBC
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('MBC', 'https://www.mbc.net/ar/rss', 'https://mbc.net', 'ar', 'entertainment', 0.85, true, 'https://www.google.com/s2/favicons?domain=mbc.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Filfan
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('فيلفان', 'https://www.filfan.com/rss', 'https://filfan.com', 'ar', 'entertainment', 0.78, true, 'https://www.google.com/s2/favicons?domain=filfan.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Entertainment Weekly
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Entertainment Weekly', 'https://ew.com/feed/', 'https://ew.com', 'en', 'entertainment', 0.85, true, 'https://www.google.com/s2/favicons?domain=ew.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Deadline
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Deadline', 'https://deadline.com/feed/', 'https://deadline.com', 'en', 'entertainment', 0.88, true, 'https://www.google.com/s2/favicons?domain=deadline.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== COMEDY ====================
-- Arabic: Akhbarak
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('أخبارك', 'https://www.akhbarak.net/rss', 'https://akhbarak.net', 'ar', 'entertainment', 0.72, true, 'https://www.google.com/s2/favicons?domain=akhbarak.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Sasapost
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('ساسة بوست', 'https://www.sasapost.com/feed/', 'https://sasapost.com', 'ar', 'entertainment', 0.75, true, 'https://www.google.com/s2/favicons?domain=sasapost.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: BuzzFeed
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('BuzzFeed', 'https://www.buzzfeed.com/index.xml', 'https://buzzfeed.com', 'en', 'entertainment', 0.75, true, 'https://www.google.com/s2/favicons?domain=buzzfeed.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: BoredPanda
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('BoredPanda', 'https://www.boredpanda.com/feed/', 'https://boredpanda.com', 'en', 'entertainment', 0.72, true, 'https://www.google.com/s2/favicons?domain=boredpanda.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== ANIME & COMICS ====================
-- Arabic: Anime Flavor
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('أنمي فلافور', 'https://www.animeflavor.cc/feed/', 'https://animeflavor.cc', 'ar', 'entertainment', 0.75, true, 'https://www.google.com/s2/favicons?domain=animeflavor.cc&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Anime Gate
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('بوابة الأنمي', 'https://www.anime-gate.com/feed/', 'https://anime-gate.com', 'ar', 'entertainment', 0.73, true, 'https://www.google.com/s2/favicons?domain=anime-gate.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Anime News Network
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Anime News Network', 'https://www.animenewsnetwork.com/all/rss.xml', 'https://animenewsnetwork.com', 'en', 'entertainment', 0.88, true, 'https://www.google.com/s2/favicons?domain=animenewsnetwork.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: CBR
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('CBR', 'https://www.cbr.com/feed/', 'https://cbr.com', 'en', 'entertainment', 0.82, true, 'https://www.google.com/s2/favicons?domain=cbr.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== BEAUTY CARE ====================
-- Arabic: Sayidaty
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('سيدتي', 'https://www.sayidaty.net/rss', 'https://sayidaty.net', 'ar', 'lifestyle', 0.82, true, 'https://www.google.com/s2/favicons?domain=sayidaty.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Jamalouki
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('جمالك', 'https://www.jamalouki.net/rss', 'https://jamalouki.net', 'ar', 'lifestyle', 0.80, true, 'https://www.google.com/s2/favicons?domain=jamalouki.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Allure
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Allure', 'https://www.allure.com/feed/rss', 'https://allure.com', 'en', 'lifestyle', 0.85, true, 'https://www.google.com/s2/favicons?domain=allure.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Byrdie
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Byrdie', 'https://www.byrdie.com/rss', 'https://byrdie.com', 'en', 'lifestyle', 0.82, true, 'https://www.google.com/s2/favicons?domain=byrdie.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== FOOD ====================
-- Arabic: Atyab Tabkha
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('أطيب طبخة', 'https://www.atyabtabkha.com/rss', 'https://atyabtabkha.com', 'ar', 'food', 0.82, true, 'https://www.google.com/s2/favicons?domain=atyabtabkha.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Shahiya
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('شهية', 'https://shahiya.com/ar/rss', 'https://shahiya.com', 'ar', 'food', 0.80, true, 'https://www.google.com/s2/favicons?domain=shahiya.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Bon Appetit
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Bon Appetit', 'https://www.bonappetit.com/feed/rss', 'https://bonappetit.com', 'en', 'food', 0.88, true, 'https://www.google.com/s2/favicons?domain=bonappetit.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Serious Eats
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Serious Eats', 'https://www.seriouseats.com/rss', 'https://seriouseats.com', 'en', 'food', 0.85, true, 'https://www.google.com/s2/favicons?domain=seriouseats.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== CARS ====================
-- Arabic: Arab GT
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('عرب جي تي', 'https://www.arabgt.com/feed/', 'https://arabgt.com', 'ar', 'automotive', 0.82, true, 'https://www.google.com/s2/favicons?domain=arabgt.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Motory
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('موتوري', 'https://motory.com/ar/rss', 'https://motory.com', 'ar', 'automotive', 0.80, true, 'https://www.google.com/s2/favicons?domain=motory.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Motor1
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Motor1', 'https://www.motor1.com/rss/news/', 'https://motor1.com', 'en', 'automotive', 0.88, true, 'https://www.google.com/s2/favicons?domain=motor1.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Car and Driver
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Car and Driver', 'https://www.caranddriver.com/rss/all.xml/', 'https://caranddriver.com', 'en', 'automotive', 0.88, true, 'https://www.google.com/s2/favicons?domain=caranddriver.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== ANIMALS/PETS ====================
-- Arabic: Animal Arabic
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('عالم الحيوان', 'https://www.animalworld-ar.com/feed/', 'https://animalworld-ar.com', 'ar', 'lifestyle', 0.75, true, 'https://www.google.com/s2/favicons?domain=animalworld-ar.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Pet Arabia
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('عالم الحيوانات الأليفة', 'https://www.petarabia.com/feed/', 'https://petarabia.com', 'ar', 'lifestyle', 0.72, true, 'https://www.google.com/s2/favicons?domain=petarabia.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: National Geographic
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('National Geographic', 'https://www.nationalgeographic.com/animals/rss', 'https://nationalgeographic.com', 'en', 'lifestyle', 0.92, true, 'https://www.google.com/s2/favicons?domain=nationalgeographic.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: The Dodo
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('The Dodo', 'https://www.thedodo.com/rss', 'https://thedodo.com', 'en', 'lifestyle', 0.82, true, 'https://www.google.com/s2/favicons?domain=thedodo.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== FITNESS & HEALTH ====================
-- Arabic: WebTeb
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('ويب طب', 'https://www.webteb.com/rss', 'https://webteb.com', 'ar', 'health', 0.85, true, 'https://www.google.com/s2/favicons?domain=webteb.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Sehatok
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('صحتك', 'https://www.sehatok.com/feed/', 'https://sehatok.com', 'ar', 'health', 0.80, true, 'https://www.google.com/s2/favicons?domain=sehatok.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Healthline
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Healthline', 'https://www.healthline.com/rss/health-news', 'https://healthline.com', 'en', 'health', 0.88, true, 'https://www.google.com/s2/favicons?domain=healthline.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: WebMD
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('WebMD', 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', 'https://webmd.com', 'en', 'health', 0.88, true, 'https://www.google.com/s2/favicons?domain=webmd.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== EDUCATION ====================
-- Arabic: Edraak
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('إدراك', 'https://www.edraak.org/feed/', 'https://edraak.org', 'ar', 'science', 0.88, true, 'https://www.google.com/s2/favicons?domain=edraak.org&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Rwaq
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('رواق', 'https://www.rwaq.org/feed/', 'https://rwaq.org', 'ar', 'science', 0.85, true, 'https://www.google.com/s2/favicons?domain=rwaq.org&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Khan Academy
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Khan Academy', 'https://blog.khanacademy.org/feed/', 'https://khanacademy.org', 'en', 'science', 0.92, true, 'https://www.google.com/s2/favicons?domain=khanacademy.org&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Coursera
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Coursera', 'https://blog.coursera.org/feed/', 'https://coursera.org', 'en', 'science', 0.90, true, 'https://www.google.com/s2/favicons?domain=coursera.org&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ==================== SCIENCE ====================
-- Arabic: NASA Arabic
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('ناسا بالعربي', 'https://nasainarabic.net/feed/', 'https://nasainarabic.net', 'ar', 'science', 0.90, true, 'https://www.google.com/s2/favicons?domain=nasainarabic.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- Arabic: Scientific American Arabic
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('العلوم للعموم', 'https://www.scientificamerican.com/arabic/rss/', 'https://scientificamerican.com/arabic', 'ar', 'science', 0.92, true, 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Nature
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Nature', 'https://www.nature.com/nature.rss', 'https://nature.com', 'en', 'science', 0.95, true, 'https://www.google.com/s2/favicons?domain=nature.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- English: Scientific American
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Scientific American', 'https://rss.sciam.com/ScientificAmerican-Global', 'https://scientificamerican.com', 'en', 'science', 0.92, true, 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;

-- ============================================
-- STEP 3: Sync to sources table
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

-- ============================================
-- STEP 4: Link sources to topics
-- ============================================

-- POLITICS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'politics' AND t.is_active = true
  AND s.url IN ('https://aljazeera.net', 'https://alarabiya.net', 'https://reuters.com', 'https://bbc.com')
ON CONFLICT DO NOTHING;

-- ECONOMY
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'economy' AND t.is_active = true
  AND s.url IN ('https://argaam.com', 'https://aleqt.com', 'https://bloomberg.com', 'https://cnbc.com')
ON CONFLICT DO NOTHING;

-- TECHNOLOGY
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'technology' AND t.is_active = true
  AND s.url IN ('https://aitnews.com', 'https://tech-wd.com', 'https://techcrunch.com', 'https://theverge.com')
ON CONFLICT DO NOTHING;

-- GAMING
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'gaming' AND t.is_active = true
  AND s.url IN ('https://arabhardware.net', 'https://true-gaming.net', 'https://ign.com', 'https://kotaku.com')
ON CONFLICT DO NOTHING;

-- SPORTS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'sports' AND t.is_active = true
  AND s.url IN ('https://kooora.com', 'https://arriyadiyah.com', 'https://espn.com', 'https://skysports.com')
ON CONFLICT DO NOTHING;

-- ENTERTAINMENT
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'entertainment' AND t.is_active = true
  AND s.url IN ('https://elcinema.com', 'https://rotana.net', 'https://variety.com', 'https://hollywoodreporter.com')
ON CONFLICT DO NOTHING;

-- SHOWS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'shows' AND t.is_active = true
  AND s.url IN ('https://mbc.net', 'https://filfan.com', 'https://ew.com', 'https://deadline.com')
ON CONFLICT DO NOTHING;

-- COMEDY
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'comedy' AND t.is_active = true
  AND s.url IN ('https://akhbarak.net', 'https://sasapost.com', 'https://buzzfeed.com', 'https://boredpanda.com')
ON CONFLICT DO NOTHING;

-- ANIME & COMICS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'anime-comics' AND t.is_active = true
  AND s.url IN ('https://animeflavor.cc', 'https://anime-gate.com', 'https://animenewsnetwork.com', 'https://cbr.com')
ON CONFLICT DO NOTHING;

-- BEAUTY CARE
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'beauty-style' AND t.is_active = true
  AND s.url IN ('https://sayidaty.net', 'https://jamalouki.net', 'https://allure.com', 'https://byrdie.com')
ON CONFLICT DO NOTHING;

-- FOOD
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'food-drink' AND t.is_active = true
  AND s.url IN ('https://atyabtabkha.com', 'https://shahiya.com', 'https://bonappetit.com', 'https://seriouseats.com')
ON CONFLICT DO NOTHING;

-- CARS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'auto-vehicle' AND t.is_active = true
  AND s.url IN ('https://arabgt.com', 'https://motory.com', 'https://motor1.com', 'https://caranddriver.com')
ON CONFLICT DO NOTHING;

-- PETS/ANIMALS
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'pets' AND t.is_active = true
  AND s.url IN ('https://animalworld-ar.com', 'https://petarabia.com', 'https://nationalgeographic.com', 'https://thedodo.com')
ON CONFLICT DO NOTHING;

-- FITNESS & HEALTH
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'fitness-health' AND t.is_active = true
  AND s.url IN ('https://webteb.com', 'https://sehatok.com', 'https://healthline.com', 'https://webmd.com')
ON CONFLICT DO NOTHING;

-- EDUCATION
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'education' AND t.is_active = true
  AND s.url IN ('https://edraak.org', 'https://rwaq.org', 'https://khanacademy.org', 'https://coursera.org')
ON CONFLICT DO NOTHING;

-- SCIENCE
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'science' AND t.is_active = true
  AND s.url IN ('https://nasainarabic.net', 'https://scientificamerican.com/arabic', 'https://nature.com', 'https://scientificamerican.com')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 5: Log results
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

  RAISE NOTICE '=== Source Curation Complete ===';
  RAISE NOTICE 'Active sources: % (% Arabic, % English)', active_sources, arabic_count, english_count;
  RAISE NOTICE 'Source-topic mappings: %', total_mappings;
  RAISE NOTICE 'Topics with sources: %', topics_with_sources;
  RAISE NOTICE 'All sources have Google Favicon logos';
END $$;
