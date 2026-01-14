-- Migration: Add 3 new topics requested by Mohammad
-- Topics: Shows, Daily Life, Society

-- Insert new topics
INSERT INTO topics (name_ar, name_en, slug, icon, color, sort_order, is_active) VALUES
  ('المسلسلات والبرامج', 'Shows', 'shows', 'television', '#A78BFA', 27, true),
  ('الحياة اليومية', 'Daily Life', 'daily-life', 'coffee', '#78716C', 28, true),
  ('المجتمع', 'Society', 'society', 'globe', '#0EA5E9', 29, true)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  is_active = true;

-- Verify the topics were added
DO $$
DECLARE
  topic_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO topic_count FROM topics WHERE slug IN ('shows', 'daily-life', 'society');
  IF topic_count < 3 THEN
    RAISE WARNING 'Not all new topics were created. Expected 3, got %', topic_count;
  ELSE
    RAISE NOTICE 'Successfully added 3 new topics: Shows, Daily Life, Society';
  END IF;
END $$;
