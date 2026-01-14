-- Migration: Trusted Arabic Sources Only
-- Uses only established, major Arabic sources (Saudi + Pan-Arab)
-- Reuses sources across related topics

-- ============================================
-- STEP 1: Reset
-- ============================================
UPDATE rss_sources SET is_active = false;
UPDATE sources SET is_active = false;
DELETE FROM source_topics;

-- ============================================
-- STEP 2: Activate ONLY trusted Arabic sources
-- ============================================

-- === PAN-ARAB NEWS CHANNELS ===
-- Al Jazeera (الجزيرة)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('الجزيرة', 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4571-a6eb-a8f8b77ea821/73d0e1b4-532f-45ef-b135-bba0a9a5943d', 'https://aljazeera.net', 'ar', 'general', 0.88, true, 'https://www.google.com/s2/favicons?domain=aljazeera.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Al Arabiya (العربية)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('العربية', 'https://www.alarabiya.net/ar/rss.xml', 'https://alarabiya.net', 'ar', 'general', 0.87, true, 'https://www.google.com/s2/favicons?domain=alarabiya.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Sky News Arabia (سكاي نيوز عربية)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('سكاي نيوز عربية', 'https://www.skynewsarabia.com/web/rss', 'https://skynewsarabia.com', 'ar', 'general', 0.85, true, 'https://www.google.com/s2/favicons?domain=skynewsarabia.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- === SAUDI NEWSPAPERS ===
-- Okaz (عكاظ)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('عكاظ', 'https://www.okaz.com.sa/rss', 'https://okaz.com.sa', 'ar', 'saudi', 0.82, true, 'https://www.google.com/s2/favicons?domain=okaz.com.sa&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Al Riyadh (الرياض)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('الرياض', 'https://www.alriyadh.com/rss.xml', 'https://alriyadh.com', 'ar', 'saudi', 0.82, true, 'https://www.google.com/s2/favicons?domain=alriyadh.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Sabq (سبق)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('سبق', 'https://sabq.org/rss', 'https://sabq.org', 'ar', 'saudi', 0.78, true, 'https://www.google.com/s2/favicons?domain=sabq.org&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Asharq Al-Awsat (الشرق الأوسط)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('الشرق الأوسط', 'https://aawsat.com/feed/rss', 'https://aawsat.com', 'ar', 'general', 0.85, true, 'https://www.google.com/s2/favicons?domain=aawsat.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- === BUSINESS/ECONOMY ===
-- Argaam (أرقام)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('أرقام', 'https://www.argaam.com/ar/rss/articles', 'https://argaam.com', 'ar', 'economy', 0.88, true, 'https://www.google.com/s2/favicons?domain=argaam.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- === TECHNOLOGY ===
-- AIT News (البوابة التقنية)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('البوابة التقنية', 'https://aitnews.com/feed/', 'https://aitnews.com', 'ar', 'technology', 0.85, true, 'https://www.google.com/s2/favicons?domain=aitnews.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Arab Hardware (عرب هاردوير)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('عرب هاردوير', 'https://arabhardware.net/feed/', 'https://arabhardware.net', 'ar', 'technology', 0.85, true, 'https://www.google.com/s2/favicons?domain=arabhardware.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- === SPORTS ===
-- Kooora (كورة)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('كورة', 'https://www.kooora.com/rss/', 'https://kooora.com', 'ar', 'sports', 0.85, true, 'https://www.google.com/s2/favicons?domain=kooora.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Al Riyadiyah (الرياضية)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('الرياضية', 'https://www.arriyadiyah.com/rss', 'https://arriyadiyah.com', 'ar', 'sports', 0.82, true, 'https://www.google.com/s2/favicons?domain=arriyadiyah.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- === ENTERTAINMENT/NETWORKS ===
-- MBC
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('MBC', 'https://www.mbc.net/ar/rss', 'https://mbc.net', 'ar', 'entertainment', 0.85, true, 'https://www.google.com/s2/favicons?domain=mbc.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Rotana (روتانا)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('روتانا', 'https://rotana.net/feed/', 'https://rotana.net', 'ar', 'entertainment', 0.82, true, 'https://www.google.com/s2/favicons?domain=rotana.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- === LIFESTYLE/WOMEN ===
-- Sayidaty (سيدتي)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('سيدتي', 'https://www.sayidaty.net/rss', 'https://sayidaty.net', 'ar', 'lifestyle', 0.82, true, 'https://www.google.com/s2/favicons?domain=sayidaty.net&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Layalina (ليالينا)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('ليالينا', 'https://www.layalina.com/feed/', 'https://layalina.com', 'ar', 'lifestyle', 0.80, true, 'https://www.google.com/s2/favicons?domain=layalina.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- === FOOD ===
-- Fatafeat (فتافيت)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('فتافيت', 'https://www.fatafeat.com/rss', 'https://fatafeat.com', 'ar', 'food', 0.82, true, 'https://www.google.com/s2/favicons?domain=fatafeat.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- === CARS ===
-- Arab GT (عرب جي تي)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('عرب جي تي', 'https://www.arabgt.com/feed/', 'https://arabgt.com', 'ar', 'automotive', 0.82, true, 'https://www.google.com/s2/favicons?domain=arabgt.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- === HEALTH ===
-- WebTeb (ويب طب)
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('ويب طب', 'https://www.webteb.com/rss', 'https://webteb.com', 'ar', 'health', 0.85, true, 'https://www.google.com/s2/favicons?domain=webteb.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- ============================================
-- STEP 3: English Sources (keeping existing trusted ones)
-- ============================================

-- News
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Reuters', 'https://www.reutersagency.com/feed/', 'https://reuters.com', 'en', 'general', 0.92, true, 'https://www.google.com/s2/favicons?domain=reuters.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('BBC News', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'https://bbc.com', 'en', 'general', 0.92, true, 'https://www.google.com/s2/favicons?domain=bbc.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Economy
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Bloomberg', 'https://feeds.bloomberg.com/markets/news.rss', 'https://bloomberg.com', 'en', 'economy', 0.92, true, 'https://www.google.com/s2/favicons?domain=bloomberg.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('CNBC', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'https://cnbc.com', 'en', 'economy', 0.88, true, 'https://www.google.com/s2/favicons?domain=cnbc.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Technology
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'en', 'technology', 0.90, true, 'https://www.google.com/s2/favicons?domain=techcrunch.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('The Verge', 'https://www.theverge.com/rss/index.xml', 'https://theverge.com', 'en', 'technology', 0.88, true, 'https://www.google.com/s2/favicons?domain=theverge.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Gaming
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('IGN', 'https://feeds.feedburner.com/ign/all', 'https://ign.com', 'en', 'technology', 0.88, true, 'https://www.google.com/s2/favicons?domain=ign.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Kotaku', 'https://kotaku.com/rss', 'https://kotaku.com', 'en', 'technology', 0.85, true, 'https://www.google.com/s2/favicons?domain=kotaku.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Sports
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('ESPN', 'https://www.espn.com/espn/rss/news', 'https://espn.com', 'en', 'sports', 0.90, true, 'https://www.google.com/s2/favicons?domain=espn.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Sky Sports', 'https://www.skysports.com/rss/12040', 'https://skysports.com', 'en', 'sports', 0.88, true, 'https://www.google.com/s2/favicons?domain=skysports.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Entertainment
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Variety', 'https://variety.com/feed/', 'https://variety.com', 'en', 'entertainment', 0.90, true, 'https://www.google.com/s2/favicons?domain=variety.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Hollywood Reporter', 'https://www.hollywoodreporter.com/feed/', 'https://hollywoodreporter.com', 'en', 'entertainment', 0.88, true, 'https://www.google.com/s2/favicons?domain=hollywoodreporter.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Entertainment Weekly', 'https://ew.com/feed/', 'https://ew.com', 'en', 'entertainment', 0.85, true, 'https://www.google.com/s2/favicons?domain=ew.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Deadline', 'https://deadline.com/feed/', 'https://deadline.com', 'en', 'entertainment', 0.88, true, 'https://www.google.com/s2/favicons?domain=deadline.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Comedy/Viral
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('BuzzFeed', 'https://www.buzzfeed.com/index.xml', 'https://buzzfeed.com', 'en', 'entertainment', 0.75, true, 'https://www.google.com/s2/favicons?domain=buzzfeed.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('BoredPanda', 'https://www.boredpanda.com/feed/', 'https://boredpanda.com', 'en', 'entertainment', 0.72, true, 'https://www.google.com/s2/favicons?domain=boredpanda.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Anime/Comics
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Anime News Network', 'https://www.animenewsnetwork.com/all/rss.xml', 'https://animenewsnetwork.com', 'en', 'entertainment', 0.88, true, 'https://www.google.com/s2/favicons?domain=animenewsnetwork.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('CBR', 'https://www.cbr.com/feed/', 'https://cbr.com', 'en', 'entertainment', 0.82, true, 'https://www.google.com/s2/favicons?domain=cbr.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Beauty/Lifestyle
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Allure', 'https://www.allure.com/feed/rss', 'https://allure.com', 'en', 'lifestyle', 0.85, true, 'https://www.google.com/s2/favicons?domain=allure.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Byrdie', 'https://www.byrdie.com/rss', 'https://byrdie.com', 'en', 'lifestyle', 0.82, true, 'https://www.google.com/s2/favicons?domain=byrdie.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Food
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Bon Appetit', 'https://www.bonappetit.com/feed/rss', 'https://bonappetit.com', 'en', 'food', 0.88, true, 'https://www.google.com/s2/favicons?domain=bonappetit.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Serious Eats', 'https://www.seriouseats.com/rss', 'https://seriouseats.com', 'en', 'food', 0.85, true, 'https://www.google.com/s2/favicons?domain=seriouseats.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Cars
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Motor1', 'https://www.motor1.com/rss/news/', 'https://motor1.com', 'en', 'automotive', 0.88, true, 'https://www.google.com/s2/favicons?domain=motor1.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Car and Driver', 'https://www.caranddriver.com/rss/all.xml/', 'https://caranddriver.com', 'en', 'automotive', 0.88, true, 'https://www.google.com/s2/favicons?domain=caranddriver.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Animals
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('National Geographic', 'https://www.nationalgeographic.com/animals/rss', 'https://nationalgeographic.com', 'en', 'lifestyle', 0.92, true, 'https://www.google.com/s2/favicons?domain=nationalgeographic.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('The Dodo', 'https://www.thedodo.com/rss', 'https://thedodo.com', 'en', 'lifestyle', 0.82, true, 'https://www.google.com/s2/favicons?domain=thedodo.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Health
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Healthline', 'https://www.healthline.com/rss/health-news', 'https://healthline.com', 'en', 'health', 0.88, true, 'https://www.google.com/s2/favicons?domain=healthline.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('WebMD', 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', 'https://webmd.com', 'en', 'health', 0.88, true, 'https://www.google.com/s2/favicons?domain=webmd.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Education
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Khan Academy', 'https://blog.khanacademy.org/feed/', 'https://khanacademy.org', 'en', 'science', 0.92, true, 'https://www.google.com/s2/favicons?domain=khanacademy.org&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Coursera', 'https://blog.coursera.org/feed/', 'https://coursera.org', 'en', 'science', 0.90, true, 'https://www.google.com/s2/favicons?domain=coursera.org&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- Science
INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Nature', 'https://www.nature.com/nature.rss', 'https://nature.com', 'en', 'science', 0.95, true, 'https://www.google.com/s2/favicons?domain=nature.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score, is_active, logo_url)
VALUES ('Scientific American', 'https://rss.sciam.com/ScientificAmerican-Global', 'https://scientificamerican.com', 'en', 'science', 0.92, true, 'https://www.google.com/s2/favicons?domain=scientificamerican.com&sz=128')
ON CONFLICT (feed_url) DO UPDATE SET is_active = true, logo_url = EXCLUDED.logo_url;

-- ============================================
-- STEP 4: Sync to sources table
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
-- STEP 5: Link sources to topics
-- Using established sources across multiple related topics
-- ============================================

-- POLITICS (الجزيرة، العربية، عكاظ + Reuters, BBC)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'politics' AND t.is_active = true
  AND s.url IN ('https://aljazeera.net', 'https://alarabiya.net', 'https://okaz.com.sa', 'https://reuters.com', 'https://bbc.com')
ON CONFLICT DO NOTHING;

-- ECONOMY (أرقام، الشرق الأوسط + Bloomberg, CNBC)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'economy' AND t.is_active = true
  AND s.url IN ('https://argaam.com', 'https://aawsat.com', 'https://bloomberg.com', 'https://cnbc.com')
ON CONFLICT DO NOTHING;

-- TECHNOLOGY (البوابة التقنية، عرب هاردوير + TechCrunch, The Verge)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'technology' AND t.is_active = true
  AND s.url IN ('https://aitnews.com', 'https://arabhardware.net', 'https://techcrunch.com', 'https://theverge.com')
ON CONFLICT DO NOTHING;

-- GAMING (عرب هاردوير، البوابة التقنية + IGN, Kotaku)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'gaming' AND t.is_active = true
  AND s.url IN ('https://arabhardware.net', 'https://aitnews.com', 'https://ign.com', 'https://kotaku.com')
ON CONFLICT DO NOTHING;

-- SPORTS (كورة، الرياضية + ESPN, Sky Sports)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'sports' AND t.is_active = true
  AND s.url IN ('https://kooora.com', 'https://arriyadiyah.com', 'https://espn.com', 'https://skysports.com')
ON CONFLICT DO NOTHING;

-- ENTERTAINMENT (روتانا، MBC + Variety, Hollywood Reporter)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'entertainment' AND t.is_active = true
  AND s.url IN ('https://rotana.net', 'https://mbc.net', 'https://variety.com', 'https://hollywoodreporter.com')
ON CONFLICT DO NOTHING;

-- SHOWS (MBC، العربية + Entertainment Weekly, Deadline)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'shows' AND t.is_active = true
  AND s.url IN ('https://mbc.net', 'https://alarabiya.net', 'https://ew.com', 'https://deadline.com')
ON CONFLICT DO NOTHING;

-- COMEDY (العربية، سكاي نيوز + BuzzFeed, BoredPanda)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'comedy' AND t.is_active = true
  AND s.url IN ('https://alarabiya.net', 'https://skynewsarabia.com', 'https://buzzfeed.com', 'https://boredpanda.com')
ON CONFLICT DO NOTHING;

-- ANIME & COMICS (عرب هاردوير، البوابة التقنية + Anime News Network, CBR)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'anime-comics' AND t.is_active = true
  AND s.url IN ('https://arabhardware.net', 'https://aitnews.com', 'https://animenewsnetwork.com', 'https://cbr.com')
ON CONFLICT DO NOTHING;

-- BEAUTY CARE (سيدتي، ليالينا + Allure, Byrdie)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'beauty-style' AND t.is_active = true
  AND s.url IN ('https://sayidaty.net', 'https://layalina.com', 'https://allure.com', 'https://byrdie.com')
ON CONFLICT DO NOTHING;

-- FOOD (سيدتي، فتافيت + Bon Appetit, Serious Eats)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'food-drink' AND t.is_active = true
  AND s.url IN ('https://sayidaty.net', 'https://fatafeat.com', 'https://bonappetit.com', 'https://seriouseats.com')
ON CONFLICT DO NOTHING;

-- CARS (عرب جي تي، العربية + Motor1, Car and Driver)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'auto-vehicle' AND t.is_active = true
  AND s.url IN ('https://arabgt.com', 'https://alarabiya.net', 'https://motor1.com', 'https://caranddriver.com')
ON CONFLICT DO NOTHING;

-- PETS/ANIMALS (العربية، الجزيرة + National Geographic, The Dodo)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'pets' AND t.is_active = true
  AND s.url IN ('https://alarabiya.net', 'https://aljazeera.net', 'https://nationalgeographic.com', 'https://thedodo.com')
ON CONFLICT DO NOTHING;

-- FITNESS & HEALTH (ويب طب، سيدتي + Healthline, WebMD)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'fitness-health' AND t.is_active = true
  AND s.url IN ('https://webteb.com', 'https://sayidaty.net', 'https://healthline.com', 'https://webmd.com')
ON CONFLICT DO NOTHING;

-- EDUCATION (الجزيرة، العربية + Khan Academy, Coursera)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'education' AND t.is_active = true
  AND s.url IN ('https://aljazeera.net', 'https://alarabiya.net', 'https://khanacademy.org', 'https://coursera.org')
ON CONFLICT DO NOTHING;

-- SCIENCE (الجزيرة، العربية + Nature, Scientific American)
INSERT INTO source_topics (source_id, topic_id)
SELECT s.id, t.id FROM sources s, topics t
WHERE s.is_active = true AND t.slug = 'science' AND t.is_active = true
  AND s.url IN ('https://aljazeera.net', 'https://alarabiya.net', 'https://nature.com', 'https://scientificamerican.com')
ON CONFLICT DO NOTHING;

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

  RAISE NOTICE '=== Trusted Sources Migration Complete ===';
  RAISE NOTICE 'Active sources: % (% Arabic, % English)', active_sources, arabic_count, english_count;
  RAISE NOTICE 'Source-topic mappings: %', total_mappings;
  RAISE NOTICE 'Topics with sources: %', topics_with_sources;
  RAISE NOTICE '';
  RAISE NOTICE 'Arabic sources used:';
  RAISE NOTICE '  - Pan-Arab: الجزيرة، العربية، سكاي نيوز عربية';
  RAISE NOTICE '  - Saudi: عكاظ، الرياض، سبق، الشرق الأوسط';
  RAISE NOTICE '  - Business: أرقام';
  RAISE NOTICE '  - Tech: البوابة التقنية، عرب هاردوير';
  RAISE NOTICE '  - Sports: كورة، الرياضية';
  RAISE NOTICE '  - Entertainment: MBC، روتانا';
  RAISE NOTICE '  - Lifestyle: سيدتي، ليالينا، فتافيت';
  RAISE NOTICE '  - Cars: عرب جي تي';
  RAISE NOTICE '  - Health: ويب طب';
END $$;
