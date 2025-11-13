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

