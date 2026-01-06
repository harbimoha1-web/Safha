-- Safha Database Schema Reconciliation
-- This migration brings the remote database to the expected state
-- Handles partial schema where some tables exist with different columns

-- ============================================
-- FIX TOPICS TABLE
-- ============================================
ALTER TABLE topics ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_slug_key'
  ) THEN
    -- Update existing rows with slugs based on name_en
    UPDATE topics SET slug = LOWER(REPLACE(name_en, ' ', '-')) WHERE slug IS NULL;
    ALTER TABLE topics ADD CONSTRAINT topics_slug_key UNIQUE (slug);
  END IF;
END $$;

-- ============================================
-- FIX SOURCES TABLE
-- ============================================
ALTER TABLE sources ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE sources ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(3,2) DEFAULT 0.80;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sources_language_check'
  ) THEN
    ALTER TABLE sources ADD CONSTRAINT sources_language_check CHECK (language IN ('ar', 'en'));
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ============================================
-- FIX STORIES TABLE
-- ============================================
ALTER TABLE stories ADD COLUMN IF NOT EXISTS original_title TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS why_it_matters_ar TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS why_it_matters_en TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ai_quality_score NUMERIC(3,2);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS topic_ids UUID[] DEFAULT '{}';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Add foreign key for approved_by if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_approved_by_fkey'
  ) THEN
    ALTER TABLE stories ADD CONSTRAINT stories_approved_by_fkey
      FOREIGN KEY (approved_by) REFERENCES auth.users(id);
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ============================================
-- CREATE PROFILES TABLE (if not exists)
-- ============================================
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

-- ============================================
-- CREATE SAVED_STORIES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- ============================================
-- CREATE NOTES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE USER_STORY_INTERACTIONS TABLE (if not exists)
-- ============================================
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
CREATE INDEX IF NOT EXISTS idx_stories_is_approved ON stories(is_approved);
CREATE INDEX IF NOT EXISTS idx_stories_ai_quality ON stories(ai_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_saved_stories_user_id ON saved_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_story_id ON notes(story_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_story_interactions(user_id);
-- Note: idx_profiles_role created in add_ai_fields migration after role column is added

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_interactions ENABLE ROW LEVEL SECURITY;

-- Topics: Anyone can read
DROP POLICY IF EXISTS "Topics are viewable by everyone" ON topics;
CREATE POLICY "Topics are viewable by everyone" ON topics FOR SELECT USING (true);

-- Sources: Anyone can read
DROP POLICY IF EXISTS "Sources are viewable by everyone" ON sources;
CREATE POLICY "Sources are viewable by everyone" ON sources FOR SELECT USING (true);

-- Stories: Anyone can read
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON stories;
CREATE POLICY "Stories are viewable by everyone" ON stories FOR SELECT USING (true);

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Saved Stories policies
DROP POLICY IF EXISTS "Users can view own saved stories" ON saved_stories;
CREATE POLICY "Users can view own saved stories" ON saved_stories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save stories" ON saved_stories;
CREATE POLICY "Users can save stories" ON saved_stories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave stories" ON saved_stories;
CREATE POLICY "Users can unsave stories" ON saved_stories FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create notes" ON notes;
CREATE POLICY "Users can create notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON notes;
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- User Interactions policies
DROP POLICY IF EXISTS "Users can view own interactions" ON user_story_interactions;
CREATE POLICY "Users can view own interactions" ON user_story_interactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create interactions" ON user_story_interactions;
CREATE POLICY "Users can create interactions" ON user_story_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- Update save count
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
-- SEED DATA: UPDATE TOPICS WITH SLUGS
-- ============================================
UPDATE topics SET
  slug = 'politics', icon = 'landmark', color = '#DC2626', sort_order = 1
WHERE name_en = 'Politics' AND (slug IS NULL OR slug = '');

UPDATE topics SET
  slug = 'economy', icon = 'chart-line', color = '#16A34A', sort_order = 2
WHERE name_en = 'Economy' AND (slug IS NULL OR slug = '');

UPDATE topics SET
  slug = 'sports', icon = 'futbol', color = '#2563EB', sort_order = 3
WHERE name_en = 'Sports' AND (slug IS NULL OR slug = '');

UPDATE topics SET
  slug = 'technology', icon = 'microchip', color = '#7C3AED', sort_order = 4
WHERE name_en = 'Technology' AND (slug IS NULL OR slug = '');

UPDATE topics SET
  slug = 'entertainment', icon = 'film', color = '#DB2777', sort_order = 5
WHERE name_en = 'Entertainment' AND (slug IS NULL OR slug = '');

UPDATE topics SET
  slug = 'health', icon = 'heart-pulse', color = '#059669', sort_order = 6
WHERE name_en = 'Health' AND (slug IS NULL OR slug = '');

UPDATE topics SET
  slug = 'science', icon = 'flask', color = '#0891B2', sort_order = 7
WHERE name_en = 'Science' AND (slug IS NULL OR slug = '');

UPDATE topics SET
  slug = 'travel', icon = 'plane', color = '#F59E0B', sort_order = 8
WHERE name_en = 'Travel' AND (slug IS NULL OR slug = '');

-- Insert any missing topics
INSERT INTO topics (name_ar, name_en, slug, icon, color, sort_order)
SELECT * FROM (VALUES
  ('السياسة', 'Politics', 'politics', 'landmark', '#DC2626', 1),
  ('الاقتصاد', 'Economy', 'economy', 'chart-line', '#16A34A', 2),
  ('الرياضة', 'Sports', 'sports', 'futbol', '#2563EB', 3),
  ('التكنولوجيا', 'Technology', 'technology', 'microchip', '#7C3AED', 4),
  ('الترفيه', 'Entertainment', 'entertainment', 'film', '#DB2777', 5),
  ('الصحة', 'Health', 'health', 'heart-pulse', '#059669', 6),
  ('العلوم', 'Science', 'science', 'flask', '#0891B2', 7),
  ('السفر', 'Travel', 'travel', 'plane', '#F59E0B', 8)
) AS t(name_ar, name_en, slug, icon, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE topics.slug = t.slug);
