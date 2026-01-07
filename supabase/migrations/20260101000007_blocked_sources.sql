-- Blocked Sources Table
-- Allows users to hide/block specific news sources from their feed

CREATE TABLE blocked_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate blocks
  UNIQUE(user_id, source_id)
);

-- Index for efficient querying by user
CREATE INDEX idx_blocked_sources_user_id ON blocked_sources(user_id);

-- Enable Row Level Security
ALTER TABLE blocked_sources ENABLE ROW LEVEL SECURITY;

-- Users can only view their own blocked sources
CREATE POLICY "Users can view own blocked sources"
  ON blocked_sources FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own blocked sources
CREATE POLICY "Users can block sources"
  ON blocked_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own blocked sources (unblock)
CREATE POLICY "Users can unblock sources"
  ON blocked_sources FOR DELETE
  USING (auth.uid() = user_id);
