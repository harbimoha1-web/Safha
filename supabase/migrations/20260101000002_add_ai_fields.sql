-- Migration: Add AI fields to stories table
-- Run this on existing databases to add the new AI columns

-- Add AI-generated columns to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS why_it_matters_ar TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS why_it_matters_en TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ai_quality_score NUMERIC(3,2);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create index for approved stories (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_stories_is_approved ON stories(is_approved);
CREATE INDEX IF NOT EXISTS idx_stories_ai_quality ON stories(ai_quality_score DESC);

-- Add role column to profiles for admin access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update RLS policy for admin access to stories
DROP POLICY IF EXISTS "Admins can manage all stories" ON stories;
CREATE POLICY "Admins can manage all stories" ON stories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );
