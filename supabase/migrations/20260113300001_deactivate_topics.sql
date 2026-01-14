-- Deactivate unwanted topics: World, Daily Life, Society, Health
-- These topics will no longer appear in the app (is_active = false)

UPDATE topics
SET is_active = false
WHERE slug IN ('world', 'daily-life', 'society', 'health');
