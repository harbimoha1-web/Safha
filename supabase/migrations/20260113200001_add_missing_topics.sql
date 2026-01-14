-- Migration: Add 9 missing topics requested by user
-- Topics: Comedy, Anime & Comics, Beauty Care, Games, Cars/off-road, Food, Animals, Fitness & Health, Education

-- Use icons/colors consistent with constants/topicIcons.ts
INSERT INTO topics (name_ar, name_en, slug, icon, color, sort_order, is_active) VALUES
  ('الكوميديا', 'Comedy', 'comedy', 'smile-o', '#FBBF24', 30, true),
  ('الأنمي والقصص المصورة', 'Anime & Comics', 'anime-comics', 'book', '#FB7185', 31, true),
  ('الجمال والعناية', 'Beauty Care', 'beauty-style', 'diamond', '#EC4899', 32, true),
  ('الألعاب', 'Games', 'gaming', 'gamepad', '#6366F1', 33, true),
  ('السيارات', 'Cars & Off-road', 'auto-vehicle', 'car', '#EF4444', 34, true),
  ('الطعام', 'Food', 'food-drink', 'cutlery', '#F97316', 35, true),
  ('الحيوانات', 'Animals', 'pets', 'paw', '#84CC16', 36, true),
  ('اللياقة والصحة', 'Fitness & Health', 'fitness-health', 'heartbeat', '#10B981', 37, true),
  ('التعليم', 'Education', 'education', 'graduation-cap', '#0891B2', 38, true)
ON CONFLICT (slug) DO NOTHING;

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Successfully added 9 new topics: Comedy, Anime & Comics, Beauty Care, Games, Cars & Off-road, Food, Animals, Fitness & Health, Education';
END $$;
