-- Migration: RSS Aggregation Pipeline
-- Tables for automated news ingestion from RSS feeds

-- RSS Sources (News feed sources)
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  website_url TEXT,
  language VARCHAR(2) DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
  category VARCHAR(50),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  reliability_score NUMERIC(3,2) DEFAULT 0.80,
  last_fetched_at TIMESTAMPTZ,
  fetch_interval_minutes INT DEFAULT 30,
  error_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw Articles (Fetched but not yet processed)
CREATE TABLE IF NOT EXISTS raw_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rss_source_id UUID REFERENCES rss_sources(id) ON DELETE CASCADE,
  guid TEXT, -- RSS item GUID for deduplication
  original_url TEXT NOT NULL,
  original_title TEXT,
  original_content TEXT,
  original_description TEXT,
  author TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  -- Processing status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'duplicate', 'rejected')),
  processed_at TIMESTAMPTZ,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  -- Error tracking
  error_message TEXT,
  retry_count INT DEFAULT 0,
  -- Deduplication
  content_hash TEXT, -- Hash for duplicate detection
  UNIQUE(rss_source_id, guid)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_rss_sources_active ON rss_sources(is_active, last_fetched_at);
CREATE INDEX IF NOT EXISTS idx_rss_sources_category ON rss_sources(category);
CREATE INDEX IF NOT EXISTS idx_raw_articles_status ON raw_articles(status, fetched_at);
CREATE INDEX IF NOT EXISTS idx_raw_articles_content_hash ON raw_articles(content_hash);
CREATE INDEX IF NOT EXISTS idx_raw_articles_url ON raw_articles(original_url);

-- RLS Policies
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_articles ENABLE ROW LEVEL SECURITY;

-- Public read access for rss_sources (needed for admin dashboard)
CREATE POLICY "RSS sources viewable by admins" ON rss_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Admin management for rss_sources
CREATE POLICY "RSS sources manageable by admins" ON rss_sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin access for raw_articles
CREATE POLICY "Raw articles viewable by admins" ON raw_articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Raw articles manageable by admins" ON raw_articles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_rss_source_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rss_source_updated ON rss_sources;
CREATE TRIGGER rss_source_updated
  BEFORE UPDATE ON rss_sources
  FOR EACH ROW EXECUTE FUNCTION update_rss_source_timestamp();

-- ============================================
-- SEED DATA: Initial RSS Sources (50+ sources)
-- ============================================

INSERT INTO rss_sources (name, feed_url, website_url, language, category, reliability_score) VALUES
  -- Arabic News Sources
  ('الجزيرة', 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4571-a6eb-a8f8b77ea821/73d0e1b4-532f-45ef-b135-bba0a9a5943d', 'https://aljazeera.net', 'ar', 'general', 0.85),
  ('العربية', 'https://www.alarabiya.net/ar/rss.xml', 'https://alarabiya.net', 'ar', 'general', 0.85),
  ('سكاي نيوز عربية', 'https://www.skynewsarabia.com/web/rss', 'https://skynewsarabia.com', 'ar', 'general', 0.82),
  ('BBC عربي', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'https://bbc.com/arabic', 'ar', 'general', 0.90),
  ('CNN بالعربية', 'https://arabic.cnn.com/rss/rss.xml', 'https://arabic.cnn.com', 'ar', 'general', 0.85),
  ('فرانس 24 عربي', 'https://www.france24.com/ar/rss', 'https://france24.com/ar', 'ar', 'general', 0.85),
  ('روسيا اليوم عربي', 'https://arabic.rt.com/rss/', 'https://arabic.rt.com', 'ar', 'general', 0.70),
  ('الشرق الأوسط', 'https://aawsat.com/feed/rss', 'https://aawsat.com', 'ar', 'general', 0.82),
  -- Saudi-specific sources
  ('عكاظ', 'https://www.okaz.com.sa/rss', 'https://okaz.com.sa', 'ar', 'saudi', 0.80),
  ('الرياض', 'https://www.alriyadh.com/rss.xml', 'https://alriyadh.com', 'ar', 'saudi', 0.80),
  ('الوطن السعودية', 'https://www.alwatan.com.sa/rss', 'https://alwatan.com.sa', 'ar', 'saudi', 0.78),
  ('سبق', 'https://sabq.org/rss', 'https://sabq.org', 'ar', 'saudi', 0.75),
  ('أرقام', 'https://www.argaam.com/ar/rss/articles', 'https://argaam.com', 'ar', 'economy', 0.85),
  -- Technology
  ('البوابة العربية للأخبار التقنية', 'https://aitnews.com/feed/', 'https://aitnews.com', 'ar', 'technology', 0.80),
  ('عالم التقنية', 'https://www.tech-wd.com/wd/feed/', 'https://tech-wd.com', 'ar', 'technology', 0.78),
  ('التقنية بلا حدود', 'https://www.unlimit-tech.com/feed/', 'https://unlimit-tech.com', 'ar', 'technology', 0.75),
  -- Sports
  ('كورة', 'https://www.kooora.com/rss/', 'https://kooora.com', 'ar', 'sports', 0.80),
  ('الرياضية السعودية', 'https://www.arriyadiyah.com/rss', 'https://arriyadiyah.com', 'ar', 'sports', 0.78),
  -- English News Sources
  ('Reuters', 'https://www.reutersagency.com/feed/', 'https://reuters.com', 'en', 'general', 0.92),
  ('Associated Press', 'https://rsshub.app/apnews/topics/apf-topnews', 'https://apnews.com', 'en', 'general', 0.90),
  ('BBC News', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'https://bbc.com/news', 'en', 'general', 0.90),
  ('The Guardian', 'https://www.theguardian.com/world/rss', 'https://theguardian.com', 'en', 'general', 0.88),
  ('Al Jazeera English', 'https://www.aljazeera.com/xml/rss/all.xml', 'https://aljazeera.com', 'en', 'general', 0.85),
  ('CNN', 'http://rss.cnn.com/rss/edition.rss', 'https://cnn.com', 'en', 'general', 0.85),
  ('NPR', 'https://feeds.npr.org/1001/rss.xml', 'https://npr.org', 'en', 'general', 0.88),
  -- English Technology
  ('TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'en', 'technology', 0.85),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'https://theverge.com', 'en', 'technology', 0.85),
  ('Wired', 'https://www.wired.com/feed/rss', 'https://wired.com', 'en', 'technology', 0.85),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'https://arstechnica.com', 'en', 'technology', 0.88),
  ('MIT Technology Review', 'https://www.technologyreview.com/feed/', 'https://technologyreview.com', 'en', 'technology', 0.90),
  -- English Business/Economy
  ('Bloomberg', 'https://feeds.bloomberg.com/markets/news.rss', 'https://bloomberg.com', 'en', 'economy', 0.90),
  ('Financial Times', 'https://www.ft.com/rss/home', 'https://ft.com', 'en', 'economy', 0.92),
  ('Wall Street Journal', 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', 'https://wsj.com', 'en', 'economy', 0.90),
  ('CNBC', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'https://cnbc.com', 'en', 'economy', 0.85),
  -- English Sports
  ('ESPN', 'https://www.espn.com/espn/rss/news', 'https://espn.com', 'en', 'sports', 0.85),
  ('BBC Sport', 'https://feeds.bbci.co.uk/sport/rss.xml', 'https://bbc.com/sport', 'en', 'sports', 0.88),
  -- Science
  ('Nature', 'https://www.nature.com/nature.rss', 'https://nature.com', 'en', 'science', 0.95),
  ('Science Daily', 'https://www.sciencedaily.com/rss/all.xml', 'https://sciencedaily.com', 'en', 'science', 0.88),
  ('New Scientist', 'https://www.newscientist.com/feed/home/', 'https://newscientist.com', 'en', 'science', 0.85),
  -- Health
  ('Medical News Today', 'https://www.medicalnewstoday.com/rss', 'https://medicalnewstoday.com', 'en', 'health', 0.85),
  ('WHO News', 'https://www.who.int/rss-feeds/news-english.xml', 'https://who.int', 'en', 'health', 0.95),
  -- Middle East specific English
  ('Arab News', 'https://www.arabnews.com/rss.xml', 'https://arabnews.com', 'en', 'saudi', 0.82),
  ('Gulf News', 'https://gulfnews.com/rss', 'https://gulfnews.com', 'en', 'general', 0.80),
  ('Middle East Eye', 'https://www.middleeasteye.net/rss', 'https://middleeasteye.net', 'en', 'general', 0.78)
ON CONFLICT (feed_url) DO NOTHING;
