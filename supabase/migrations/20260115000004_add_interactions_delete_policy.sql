-- ============================================
-- ADD DELETE POLICY FOR USER_STORY_INTERACTIONS
-- ============================================
-- Date: 2026-01-15
-- Issue: Users need to be able to delete their own interactions
--        for the "reset feed" feature to work
-- ============================================

-- Allow users to delete their own interactions
CREATE POLICY "Users can delete own interactions" ON user_story_interactions
  FOR DELETE
  USING (auth.uid() = user_id);
