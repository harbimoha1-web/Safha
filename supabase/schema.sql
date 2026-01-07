-- Safha App Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- ============================================
-- TABLES
-- ============================================

-- Topics (News categories)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sources (News sources)
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,
  language TEXT CHECK (language IN ('ar', 'en')) DEFAULT 'en',
  reliability_score NUMERIC(3,2) DEFAULT 0.80,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories (News articles)
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  original_url TEXT NOT NULL,
  original_title TEXT,
  title_ar TEXT,
  title_en TEXT,
  summary_ar TEXT,
  summary_en TEXT,
  -- AI-generated fields
  why_it_matters_ar TEXT,
  why_it_matters_en TEXT,
  ai_quality_score NUMERIC(3,2),
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  -- Other fields
  image_url TEXT,
  topic_ids UUID[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0
);

-- Profiles (User profiles - extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT CHECK (language IN ('ar', 'en')) DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{"daily_digest": true, "breaking_news": true, "weekly_summary": false, "push_enabled": true, "email_enabled": true}'::jsonb,
  selected_topics UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Stories (User bookmarks)
CREATE TABLE IF NOT EXISTS saved_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- Notes (User notes on stories)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Story Interactions (Analytics)
CREATE TABLE IF NOT EXISTS user_story_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT CHECK (interaction_type IN ('view', 'save', 'share', 'skip')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_topic_ids ON stories USING GIN(topic_ids);
CREATE INDEX IF NOT EXISTS idx_saved_stories_user_id ON saved_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_story_id ON notes(story_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_story_interactions(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_interactions ENABLE ROW LEVEL SECURITY;

-- Topics: Anyone can read
CREATE POLICY "Topics are viewable by everyone" ON topics
  FOR SELECT USING (true);

-- Sources: Anyone can read
CREATE POLICY "Sources are viewable by everyone" ON sources
  FOR SELECT USING (true);

-- Stories: Anyone can read
CREATE POLICY "Stories are viewable by everyone" ON stories
  FOR SELECT USING (true);

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Saved Stories: Users can manage their own saved stories
CREATE POLICY "Users can view own saved stories" ON saved_stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save stories" ON saved_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave stories" ON saved_stories
  FOR DELETE USING (auth.uid() = user_id);

-- Notes: Users can manage their own notes
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- User Interactions: Users can manage their own interactions
CREATE POLICY "Users can view own interactions" ON user_story_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create interactions" ON user_story_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update story counts
CREATE OR REPLACE FUNCTION increment_story_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.interaction_type = 'view' THEN
    UPDATE stories SET view_count = view_count + 1 WHERE id = NEW.story_id;
  ELSIF NEW.interaction_type = 'share' THEN
    UPDATE stories SET share_count = share_count + 1 WHERE id = NEW.story_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_story_interaction ON user_story_interactions;
CREATE TRIGGER on_story_interaction
  AFTER INSERT ON user_story_interactions
  FOR EACH ROW EXECUTE FUNCTION increment_story_count();

-- Update save count when saved_stories changes
CREATE OR REPLACE FUNCTION update_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stories SET save_count = save_count + 1 WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stories SET save_count = save_count - 1 WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_saved_story_change ON saved_stories;
CREATE TRIGGER on_saved_story_change
  AFTER INSERT OR DELETE ON saved_stories
  FOR EACH ROW EXECUTE FUNCTION update_save_count();

-- ============================================
-- SEED DATA: TOPICS
-- ============================================

INSERT INTO topics (name_ar, name_en, slug, icon, color, sort_order) VALUES
  -- Existing core topics
  ('السياسة', 'Politics', 'politics', 'landmark', '#DC2626', 1),
  ('الاقتصاد', 'Economy', 'economy', 'chart-line', '#16A34A', 2),
  ('التكنولوجيا', 'Technology', 'technology', 'microchip', '#7C3AED', 3),
  -- New topics from user request
  ('الطعام والمشروبات', 'Food & Drink', 'food-drink', 'cutlery', '#F97316', 4),
  ('الجمال والأناقة', 'Beauty & Style', 'beauty-style', 'diamond', '#EC4899', 5),
  ('الموسيقى', 'Music', 'music', 'music', '#8B5CF6', 6),
  ('اللياقة والصحة', 'Fitness & Health', 'fitness-health', 'heartbeat', '#10B981', 7),
  ('فلوقات', 'Vlogs', 'vlogs', 'video-camera', '#06B6D4', 8),
  ('كوميديا', 'Comedy', 'comedy', 'smile-o', '#FBBF24', 9),
  ('الرياضة', 'Sports', 'sports', 'futbol', '#2563EB', 10),
  ('الثقافة الترفيهية', 'Entertainment Culture', 'entertainment-culture', 'film', '#DB2777', 11),
  ('العلوم والتعليم', 'Science & Education', 'science-education', 'graduation-cap', '#0891B2', 12),
  ('العائلة', 'Family', 'family', 'users', '#F472B6', 13),
  ('التحفيز والنصائح', 'Motivation & Advice', 'motivation-advice', 'lightbulb-o', '#A855F7', 14),
  ('الرقص', 'Dance', 'dance', 'star', '#F43F5E', 15),
  ('السفر', 'Travel', 'travel', 'plane', '#F59E0B', 16),
  ('الألعاب', 'Gaming', 'gaming', 'gamepad', '#6366F1', 17),
  ('الحيوانات الأليفة', 'Pets', 'pets', 'paw', '#84CC16', 18),
  ('السيارات والمركبات', 'Auto & Vehicle', 'auto-vehicle', 'car', '#EF4444', 19),
  ('افعلها بنفسك', 'DIY', 'diy', 'wrench', '#78716C', 20),
  ('الفن', 'Art', 'art', 'paint-brush', '#D946EF', 21),
  ('الأنمي والقصص المصورة', 'Anime & Comics', 'anime-comics', 'book', '#FB7185', 22),
  ('حيل الحياة', 'Life Hacks', 'life-hacks', 'magic', '#14B8A6', 23),
  ('الطبيعة', 'Outdoors', 'outdoors', 'tree', '#22C55E', 24),
  ('مرضي بشكل غريب', 'Oddly Satisfying', 'oddly-satisfying', 'eye', '#7C3AED', 25),
  ('المنزل والحديقة', 'Home & Garden', 'home-garden', 'home', '#059669', 26)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SEED DATA: SAMPLE SOURCES
-- ============================================

INSERT INTO sources (name, url, language, reliability_score) VALUES
  ('Al Jazeera', 'https://aljazeera.net', 'ar', 0.85),
  ('BBC Arabic', 'https://bbc.com/arabic', 'ar', 0.90),
  ('CNN Arabic', 'https://arabic.cnn.com', 'ar', 0.85),
  ('Reuters', 'https://reuters.com', 'en', 0.92),
  ('Associated Press', 'https://apnews.com', 'en', 0.90),
  ('The Guardian', 'https://theguardian.com', 'en', 0.88)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: SAMPLE STORIES (for testing)
-- ============================================

-- Get topic and source IDs for sample stories
DO $$
DECLARE
  tech_topic_id UUID;
  politics_topic_id UUID;
  sports_topic_id UUID;
  reuters_source_id UUID;
  aljazeera_source_id UUID;
BEGIN
  SELECT id INTO tech_topic_id FROM topics WHERE slug = 'technology' LIMIT 1;
  SELECT id INTO politics_topic_id FROM topics WHERE slug = 'politics' LIMIT 1;
  SELECT id INTO sports_topic_id FROM topics WHERE slug = 'sports' LIMIT 1;
  SELECT id INTO reuters_source_id FROM sources WHERE name = 'Reuters' LIMIT 1;
  SELECT id INTO aljazeera_source_id FROM sources WHERE name = 'Al Jazeera' LIMIT 1;

  INSERT INTO stories (source_id, original_url, title_ar, title_en, summary_ar, summary_en, image_url, topic_ids, published_at) VALUES
    (
      reuters_source_id,
      'https://example.com/tech-ai-breakthrough',
      'اختراق جديد في مجال الذكاء الاصطناعي يغير قواعد اللعبة',
      'New AI Breakthrough Changes the Game',
      'أعلن باحثون عن تطوير نموذج ذكاء اصطناعي جديد يتفوق على جميع النماذج السابقة في مهام الاستدلال المعقدة.',
      'Researchers announce a new AI model that outperforms all previous models in complex reasoning tasks.',
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      ARRAY[tech_topic_id],
      NOW() - INTERVAL '2 hours'
    ),
    (
      aljazeera_source_id,
      'https://example.com/middle-east-summit',
      'قمة إقليمية تبحث التعاون الاقتصادي',
      'Regional Summit Discusses Economic Cooperation',
      'اجتمع قادة المنطقة لمناقشة سبل تعزيز التعاون الاقتصادي والتجاري بين الدول المشاركة.',
      'Regional leaders gathered to discuss ways to enhance economic and trade cooperation among participating countries.',
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
      ARRAY[politics_topic_id],
      NOW() - INTERVAL '4 hours'
    ),
    (
      reuters_source_id,
      'https://example.com/world-cup-qualifiers',
      'نتائج مثيرة في تصفيات كأس العالم',
      'Exciting Results in World Cup Qualifiers',
      'شهدت الجولة الأخيرة من التصفيات نتائج مفاجئة قلبت موازين التأهل.',
      'The latest round of qualifiers saw surprising results that shifted the qualification standings.',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
      ARRAY[sports_topic_id],
      NOW() - INTERVAL '6 hours'
    ),
    (
      aljazeera_source_id,
      'https://example.com/climate-tech',
      'تقنيات جديدة لمواجهة تغير المناخ',
      'New Technologies to Combat Climate Change',
      'تستثمر الحكومات والشركات في تقنيات مبتكرة لتقليل انبعاثات الكربون.',
      'Governments and companies invest in innovative technologies to reduce carbon emissions.',
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800',
      ARRAY[tech_topic_id],
      NOW() - INTERVAL '8 hours'
    )
  ON CONFLICT DO NOTHING;
END $$;
