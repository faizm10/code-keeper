-- Create pr_runs table to store PR advice runs and other run types
-- This table tracks when Codekeeper analyzed a PR and posted advice comments

CREATE TABLE IF NOT EXISTS pr_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_full_name TEXT NOT NULL,
  pr_number INTEGER NOT NULL,
  run_type TEXT NOT NULL DEFAULT 'advice', -- 'advice', 'analysis', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  logs JSONB, -- Store error messages, suggestions, etc.
  github_comment_id BIGINT, -- GitHub comment ID if comment was posted
  base_sha TEXT,
  head_sha TEXT,
  
  -- Ensure we don't duplicate runs for the same PR
  CONSTRAINT pr_runs_user_repo_pr_key UNIQUE (user_id, repo_full_name, pr_number, run_type, created_at)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pr_runs_user_id ON pr_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_pr_runs_repo_full_name ON pr_runs(repo_full_name);
CREATE INDEX IF NOT EXISTS idx_pr_runs_pr_number ON pr_runs(repo_full_name, pr_number);
CREATE INDEX IF NOT EXISTS idx_pr_runs_status ON pr_runs(status);
CREATE INDEX IF NOT EXISTS idx_pr_runs_created_at ON pr_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pr_runs_user_repo_pr ON pr_runs(user_id, repo_full_name, pr_number, created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE pr_runs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own PR runs
CREATE POLICY "Users can view their own PR runs"
  ON pr_runs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own PR runs
CREATE POLICY "Users can insert their own PR runs"
  ON pr_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own PR runs
CREATE POLICY "Users can update their own PR runs"
  ON pr_runs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own PR runs
CREATE POLICY "Users can delete their own PR runs"
  ON pr_runs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE pr_runs IS 'Stores PR advice runs and other run types performed by Codekeeper';
COMMENT ON COLUMN pr_runs.id IS 'Unique identifier for the PR run';
COMMENT ON COLUMN pr_runs.user_id IS 'User who owns this run';
COMMENT ON COLUMN pr_runs.repo_full_name IS 'Full repository name in format owner/repo';
COMMENT ON COLUMN pr_runs.pr_number IS 'GitHub PR number';
COMMENT ON COLUMN pr_runs.run_type IS 'Type of run: advice, analysis, etc.';
COMMENT ON COLUMN pr_runs.status IS 'Run status: pending, running, completed, failed';
COMMENT ON COLUMN pr_runs.logs IS 'JSON object containing run results, suggestions, errors, etc.';
COMMENT ON COLUMN pr_runs.github_comment_id IS 'GitHub comment ID if a comment was posted';
COMMENT ON COLUMN pr_runs.base_sha IS 'Base SHA of the PR';
COMMENT ON COLUMN pr_runs.head_sha IS 'Head SHA of the PR';

