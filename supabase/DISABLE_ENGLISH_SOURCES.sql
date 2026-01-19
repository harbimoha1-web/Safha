-- ============================================
-- DISABLE ENGLISH SOURCES - Arabic Only Policy
-- CEO Decision: 2026-01-19
-- ============================================

-- Step 1: Disable all English sources
UPDATE rss_sources
SET is_active = false
WHERE language = 'en' AND is_active = true;

-- Step 2: Verify the changes
SELECT
    language,
    is_active,
    COUNT(*) as count
FROM rss_sources
GROUP BY language, is_active
ORDER BY language, is_active;

-- Step 3: Verify no English sources are active (should return 0)
SELECT COUNT(*) as active_english_count
FROM rss_sources
WHERE language = 'en' AND is_active = true;

-- Step 4: Verify Arabic sources are still active
SELECT COUNT(*) as active_arabic_count
FROM rss_sources
WHERE language = 'ar' AND is_active = true;
