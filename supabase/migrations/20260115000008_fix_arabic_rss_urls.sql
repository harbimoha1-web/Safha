-- ============================================
-- FIX ARABIC RSS FEED URLs
-- ============================================
-- Date: 2026-01-15
-- Testing revealed many URLs were broken (404/403)
-- This migration disables broken sources and fixes URLs
-- ============================================

-- ============================================
-- DISABLE BROKEN SOURCES
-- ============================================

-- Al Jazeera (404) - Arabic version doesn't have working RSS
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.aljazeera.net/aje/articles_rss';

-- Al Arabiya (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.alarabiya.net/.mrss/ar.xml';

-- Sky News Arabia (blocked by bot protection)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.skynewsarabia.com/web/rss';

-- Asharq al-Awsat (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://aawsat.com/feed/rss2';

-- Asharq (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://asharq.com/rss';

-- Al Quds (timeout)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.alquds.co.uk/feed/';

-- Al Araby (timeout)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.alaraby.co.uk/rss.xml';

-- Al Riyadh (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.alriyadh.com/rss.xml';

-- Al Madina (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.al-madina.com/rss';

-- Al Jazirah Saudi (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.al-jazirah.com/rss.xml';

-- Tech-WD duplicate
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.tech-wd.com/feed/';

-- Arageek Tech (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.arageek.com/tech/feed';

-- Gamers SA (timeout)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://gamers.sa/feed/';

-- True Gaming (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://true-gaming.net/feed/';

-- Kooora (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.kooora.com/rss/News';

-- Arriyadiyah (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.arriyadiyah.com/rss/arriyadiyah.xml';

-- FilGoal (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.filgoal.com/rss/';

-- Sport360 (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://sport360.com/ar/feed/';

-- SPL (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.spl.com.sa/rss';

-- Mubasher (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.mubasher.info/rss';

-- Al Arabiya Aswaq (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.alarabiya.net/.mrss/ar/aswaq.xml';

-- Forbes ME (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.forbesmiddleeast.com/ar/feed/';

-- MBC (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.mbc.net/ar/feed/';

-- Layalina (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.layalina.com/feed/';

-- Sayidaty feeds (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url IN (
  'https://www.sayidaty.net/node/feed/entertainment',
  'https://www.sayidaty.net/node/feed',
  'https://www.sayidaty.net/node/feed/recipes'
);

-- Arageek Art (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.arageek.com/art/feed';

-- Erem News (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.eremnews.com/entertainment/feed';

-- Jamalouki (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.jamalouki.net/feed/';

-- 3arouss (timeout)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://3arouss.com/feed/';

-- Fatafeat (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.fatafeat.com/feed/';

-- Cookpad (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://cookpad.com/ar/feed/';

-- Motory (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://motory.com/ar/feed/';

-- Altibbi (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://altibbi.com/feed/';

-- Scientific American Arabic (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.scientificamerican.com/arabic/rss/';

-- Arabic Physics (timeout)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://arabicphysics.com/feed/';

-- Edraak (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.edraak.org/feed/';

-- Rwaq (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.rwaq.org/feed/';

-- Hsoub Academy (403)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://academy.hsoub.com/feed/';

-- Safariway (timeout)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.safariway.net/feed/';

-- Almosafer (404)
UPDATE rss_sources SET is_active = false
WHERE feed_url = 'https://www.almosafer.com/ar/feed/';

-- ============================================
-- FIX URLS WHERE ALTERNATIVES WORK
-- ============================================

-- Fix Argaam URL
UPDATE rss_sources
SET feed_url = 'https://www.argaam.com/ar/rss'
WHERE feed_url = 'https://www.argaam.com/ar/rss/articles';

-- ============================================
-- LOG RESULTS
-- ============================================
DO $$
DECLARE
  total_ar INTEGER;
  active_ar INTEGER;
  inactive_ar INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_ar FROM rss_sources WHERE language = 'ar';
  SELECT COUNT(*) INTO active_ar FROM rss_sources WHERE language = 'ar' AND is_active = true;
  SELECT COUNT(*) INTO inactive_ar FROM rss_sources WHERE language = 'ar' AND is_active = false;

  RAISE NOTICE 'Arabic RSS Sources Status:';
  RAISE NOTICE '  Total Arabic: %', total_ar;
  RAISE NOTICE '  Active (verified working): %', active_ar;
  RAISE NOTICE '  Inactive (broken URLs): %', inactive_ar;
END $$;
