-- Google News Arabic Feeds for User's 16 Active Interests
-- ========================================================
-- This migration adds 22 Google News RSS feeds covering all 16 user interests
-- Using Google News RSS as a workaround for sites that block direct RSS access
--
-- 16 Interests:
-- 1. Politics, 2. Business & Economy, 3. Sports, 4. Technology,
-- 5. Science, 6. Travel, 7. Shows, 8. Comedy, 9. Anime, 10. Beauty Care,
-- 11. Games, 12. Cars, 13. Food, 14. Animals, 15. Fitness & Health, 16. Education
-- ========================================================

DO $$
DECLARE
  tid_politics UUID;
  tid_economy UUID;
  tid_sports UUID;
  tid_technology UUID;
  tid_science UUID;
  tid_education UUID;
  tid_travel UUID;
  tid_shows UUID;
  tid_comedy UUID;
  tid_anime UUID;
  tid_beauty UUID;
  tid_gaming UUID;
  tid_auto UUID;
  tid_food UUID;
  tid_pets UUID;
  tid_fitness UUID;
BEGIN
  -- Get topic IDs for the 16 interests
  SELECT id INTO tid_politics FROM topics WHERE slug = 'politics';
  SELECT id INTO tid_economy FROM topics WHERE slug = 'economy';
  SELECT id INTO tid_sports FROM topics WHERE slug = 'sports';
  SELECT id INTO tid_technology FROM topics WHERE slug = 'technology';
  SELECT id INTO tid_science FROM topics WHERE slug = 'science';
  SELECT id INTO tid_education FROM topics WHERE slug = 'education';
  SELECT id INTO tid_travel FROM topics WHERE slug = 'travel';
  SELECT id INTO tid_shows FROM topics WHERE slug = 'shows';
  SELECT id INTO tid_comedy FROM topics WHERE slug = 'comedy';
  SELECT id INTO tid_anime FROM topics WHERE slug = 'anime-comics';
  SELECT id INTO tid_beauty FROM topics WHERE slug = 'beauty-style';
  SELECT id INTO tid_gaming FROM topics WHERE slug = 'gaming';
  SELECT id INTO tid_auto FROM topics WHERE slug = 'auto-vehicle';
  SELECT id INTO tid_food FROM topics WHERE slug = 'food-drink';
  SELECT id INTO tid_pets FROM topics WHERE slug = 'pets';
  SELECT id INTO tid_fitness FROM topics WHERE slug = 'fitness-health';

  -- Insert Google News feeds with topic_ids
  INSERT INTO rss_sources (name, feed_url, language, category, is_active, reliability_score, topic_ids) VALUES

  -- 1. POLITICS (2 feeds)
  ('الرياض Google', 'https://news.google.com/rss/search?q=site:alriyadh.com&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'politics', true, 0.85, ARRAY[tid_politics]),
  ('المدينة Google', 'https://news.google.com/rss/search?q=site:al-madina.com&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'politics', true, 0.82, ARRAY[tid_politics]),

  -- 2. BUSINESS & ECONOMY (3 feeds)
  ('أرقام Google', 'https://news.google.com/rss/search?q=site:argaam.com&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'economy', true, 0.85, ARRAY[tid_economy]),
  ('الاقتصادية Google', 'https://news.google.com/rss/search?q=site:aleqt.com&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'economy', true, 0.85, ARRAY[tid_economy]),
  ('مباشر Google', 'https://news.google.com/rss/search?q=site:mubasher.info&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'economy', true, 0.82, ARRAY[tid_economy]),

  -- 3. SPORTS (2 feeds)
  ('الرياضية Google', 'https://news.google.com/rss/search?q=site:arriyadiyah.com&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'sports', true, 0.85, ARRAY[tid_sports]),
  ('الدوري السعودي', 'https://news.google.com/rss/search?q=الدوري+السعودي&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'sports', true, 0.82, ARRAY[tid_sports]),

  -- 4. TECHNOLOGY (1 feed)
  ('تقنية عربية', 'https://news.google.com/rss/search?q=تقنية+تكنولوجيا+عربي&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'technology', true, 0.80, ARRAY[tid_technology]),

  -- 5. SCIENCE (1 feed)
  ('علوم عربية', 'https://news.google.com/rss/search?q=علوم+اكتشافات+عربي&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'science', true, 0.80, ARRAY[tid_science]),

  -- 16. EDUCATION (1 feed)
  ('تعليم عربي', 'https://news.google.com/rss/search?q=تعليم+جامعات+السعودية&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'education', true, 0.80, ARRAY[tid_education]),

  -- 6. TRAVEL (1 feed)
  ('سفر وسياحة', 'https://news.google.com/rss/search?q=سفر+سياحة+السعودية&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'lifestyle', true, 0.80, ARRAY[tid_travel]),

  -- 7. SHOWS (1 feed)
  ('مسلسلات عربية', 'https://news.google.com/rss/search?q=مسلسلات+برامج+تلفزيون+عربي&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'entertainment', true, 0.80, ARRAY[tid_shows]),

  -- 8. COMEDY (1 feed)
  ('كوميديا عربية', 'https://news.google.com/rss/search?q=كوميديا+مضحك+عربي&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'entertainment', true, 0.75, ARRAY[tid_comedy]),

  -- 9. ANIME (1 feed)
  ('أنمي عربي', 'https://news.google.com/rss/search?q=أنمي+مانجا+عربي&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'entertainment', true, 0.75, ARRAY[tid_anime]),

  -- 10. BEAUTY CARE (2 feeds)
  ('سيدتي Google', 'https://news.google.com/rss/search?q=site:sayidaty.net&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'lifestyle', true, 0.82, ARRAY[tid_beauty]),
  ('ليالينا Google', 'https://news.google.com/rss/search?q=site:layalina.com&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'lifestyle', true, 0.80, ARRAY[tid_beauty]),

  -- 11. GAMES (1 feed)
  ('ألعاب فيديو', 'https://news.google.com/rss/search?q=ألعاب+فيديو+بلايستيشن&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'technology', true, 0.80, ARRAY[tid_gaming]),

  -- 12. CARS (1 feed)
  ('سيارات السعودية', 'https://news.google.com/rss/search?q=سيارات+السعودية&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'automotive', true, 0.80, ARRAY[tid_auto]),

  -- 13. FOOD (2 feeds)
  ('فتافيت Google', 'https://news.google.com/rss/search?q=site:fatafeat.com&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'food', true, 0.80, ARRAY[tid_food]),
  ('وصفات طبخ', 'https://news.google.com/rss/search?q=وصفات+طبخ+عربية&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'food', true, 0.78, ARRAY[tid_food]),

  -- 14. ANIMALS (1 feed)
  ('حيوانات أليفة', 'https://news.google.com/rss/search?q=حيوانات+أليفة+قطط+كلاب&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'lifestyle', true, 0.75, ARRAY[tid_pets]),

  -- 15. FITNESS & HEALTH (1 feed)
  ('صحة ولياقة', 'https://news.google.com/rss/search?q=صحة+لياقة+نصائح&hl=ar&gl=SA&ceid=SA:ar', 'ar', 'health', true, 0.80, ARRAY[tid_fitness])

  ON CONFLICT (feed_url) DO NOTHING;

  RAISE NOTICE 'Added 22 Google News feeds for 16 interests';
END $$;

-- Verify the feeds were added
SELECT
  t.name_en as interest,
  t.slug,
  COUNT(rs.id) as feeds
FROM topics t
LEFT JOIN rss_sources rs ON t.id = ANY(rs.topic_ids) AND rs.is_active = true
WHERE t.slug IN ('politics', 'economy', 'sports', 'technology', 'science-education',
  'travel', 'shows', 'comedy', 'anime-comics', 'beauty-style', 'gaming',
  'auto-vehicle', 'food-drink', 'pets', 'fitness-health')
GROUP BY t.name_en, t.slug
ORDER BY t.sort_order;
