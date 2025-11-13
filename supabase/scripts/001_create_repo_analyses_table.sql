-- Create repo_analyses table to store repository analysis runs
-- This table tracks when Codekeeper analyzed a repository and what it found

CREATE TABLE IF NOT EXISTS repo_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_full_name TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stats JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure user_id and repo_full_name are indexed for fast lookups
  CONSTRAINT repo_analyses_user_id_repo_key UNIQUE (user_id, repo_full_name, run_at)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_repo_analyses_user_id ON repo_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_repo_analyses_repo_full_name ON repo_analyses(repo_full_name);
CREATE INDEX IF NOT EXISTS idx_repo_analyses_run_at ON repo_analyses(run_at DESC);
CREATE INDEX IF NOT EXISTS idx_repo_analyses_user_repo ON repo_analyses(user_id, repo_full_name, run_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE repo_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own analyses
CREATE POLICY "Users can view their own analyses"
  ON repo_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert their own analyses"
  ON repo_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own analyses (optional, for cleanup)
CREATE POLICY "Users can delete their own analyses"
  ON repo_analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE repo_analyses IS 'Stores repository analysis runs performed by Codekeeper';
COMMENT ON COLUMN repo_analyses.id IS 'Unique identifier for the analysis run';
COMMENT ON COLUMN repo_analyses.user_id IS 'User who triggered the analysis';
COMMENT ON COLUMN repo_analyses.repo_full_name IS 'Full repository name in format owner/repo';
COMMENT ON COLUMN repo_analyses.run_at IS 'Timestamp when the analysis was run';
COMMENT ON COLUMN repo_analyses.stats IS 'JSON object containing analysis results (docs, files, activity, etc.)';
COMMENT ON COLUMN repo_analyses.created_at IS 'Timestamp when the record was created';

