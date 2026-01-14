-- ============================================
-- ADD ADMIN RLS POLICY FOR SOURCES TABLE
-- ============================================
-- Date: 2026-01-15
-- Fix: Source toggle failing due to missing UPDATE policy
-- ============================================

-- Allow admins and moderators to manage sources (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage sources" ON sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );
