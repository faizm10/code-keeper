# Supabase Migration Scripts

This directory contains SQL migration scripts for setting up and maintaining the Supabase database schema.

## Scripts

### 001_create_repo_analyses_table.sql

Creates the `repo_analyses` table to store repository analysis runs performed by Codekeeper.

**Table Structure:**
- `id` (UUID): Primary key
- `user_id` (UUID): Reference to auth.users
- `repo_full_name` (TEXT): Full repository name in format `owner/repo`
- `run_at` (TIMESTAMPTZ): Timestamp when the analysis was run
- `stats` (JSONB): Analysis results containing:
  - Documentation files detected
  - File counts by extension
  - Repository activity information
- `created_at` (TIMESTAMPTZ): Record creation timestamp

**Security:**
- Row Level Security (RLS) enabled
- Users can only view, insert, and delete their own analyses

**Indexes:**
- Indexed on `user_id`, `repo_full_name`, and `run_at` for fast queries

### 002_create_pr_runs_table.sql

Creates the `pr_runs` table to store PR advice runs and other PR-related analysis runs.

**Table Structure:**
- `id` (UUID): Primary key
- `user_id` (UUID): Reference to auth.users
- `repo_full_name` (TEXT): Full repository name in format `owner/repo`
- `pr_number` (INTEGER): GitHub PR number
- `run_type` (TEXT): Type of run (e.g., 'advice', 'analysis')
- `status` (TEXT): Run status ('pending', 'running', 'completed', 'failed')
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `started_at` (TIMESTAMPTZ): When the run started
- `completed_at` (TIMESTAMPTZ): When the run completed
- `logs` (JSONB): Run results, suggestions, errors, etc.
- `github_comment_id` (BIGINT): GitHub comment ID if a comment was posted
- `base_sha` (TEXT): Base SHA of the PR
- `head_sha` (TEXT): Head SHA of the PR

**Security:**
- Row Level Security (RLS) enabled
- Users can only view, insert, update, and delete their own PR runs

**Indexes:**
- Indexed on `user_id`, `repo_full_name`, `pr_number`, `status`, and `created_at` for fast queries

## How to Run

### Using Supabase CLI

```bash
# Make sure you have Supabase CLI installed
supabase db reset

# Or apply a specific migration
supabase migration up
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration script
4. Paste and execute in the SQL Editor

### Using psql

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/scripts/001_create_repo_analyses_table.sql
```

## Notes

- Always run migrations in order (001, 002, etc.)
- Backup your database before running migrations in production
- Test migrations in a development environment first

