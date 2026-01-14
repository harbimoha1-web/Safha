-- ============================================
-- FIX: SOURCES RLS POLICY WITH CHECK CLAUSE
-- ============================================
-- Date: 2026-01-15
-- Issue: Previous policy missing WITH CHECK, blocking UPDATE/INSERT
-- ============================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Admins can manage sources" ON sources;

-- Create correct policy with WITH CHECK for UPDATE/INSERT/DELETE
CREATE POLICY "Admins can manage sources" ON sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );
