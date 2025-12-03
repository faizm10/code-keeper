# Code Keeper - Application Summary

## Overview

**Code Keeper** is an intelligent, automated code maintenance system that helps developers keep their repositories well-documented, architecturally consistent, and maintainable. It operates as an autonomous agent that monitors GitHub repositories and provides intelligent feedback on pull requests, with a particular focus on ensuring documentation stays synchronized with code changes.

## Core Purpose

Code Keeper addresses common maintenance challenges in software repositories:
- **Out-of-date documentation** - READMEs, API docs, and changelogs that drift from actual code
- **Inconsistent architecture** - Folder structures and code organization that degrades over time
- **Forgotten documentation updates** - Code changes that should trigger doc updates but don't
- **Missing context for new developers** - PRs that lack clear explanations of what changed and why

## Key Features

### 1. **Automated Pull Request Analysis**
Code Keeper automatically analyzes every pull request and provides intelligent feedback:

- **Change Detection**: Identifies what changed in the codebase (new endpoints, functions, database schema changes, infrastructure updates, etc.)
- **Documentation Gap Detection**: Determines if code changes require documentation updates
- **Intelligent Comments**: Posts helpful, context-aware comments on PRs explaining changes from a new developer's perspective
- **File Summarization**: Provides clear, human-readable summaries of every changed file

### 2. **Repository Health Monitoring**
- Scans entire repositories to understand structure and organization
- Tracks documentation coverage
- Monitors file types and extensions
- Tracks repository activity and commit history

### 3. **GitHub Integration**
- Full GitHub OAuth authentication
- Webhook support for real-time PR monitoring
- Repository browsing and exploration
- Pull request management and tracking

### 4. **Dashboard & Management**
- Clean, modern web interface built with Next.js 16 and React 19
- Repository management and onboarding
- PR run history and tracking
- Settings and account management
- Code snippet storage and organization

## LLM Integration (Gemini AI) - The Intelligence Layer

The **LLM portion is the core intelligence** of Code Keeper, powered by Google's Gemini 2.5 Flash model. This is what makes Code Keeper truly intelligent rather than just a rule-based system.

### How Gemini is Used

#### 1. **Pull Request Analysis Engine**

When a PR is analyzed, Gemini receives:
- **PR metadata**: Title, number, description
- **All changed files**: With full patch/diff content (up to 18 files with 2000 chars each)
- **File classifications**: Code vs. documentation vs. infrastructure vs. database vs. CI
- **Documentation files touched**: List of any doc files that were modified

Gemini then performs sophisticated analysis:

**Zone Detection**:
- Identifies which repository zones were touched (Code, Docs, Infrastructure, Database, CI/Automation)
- Understands the impact scope of changes

**Event Detection**:
- Detects meaningful events like:
  - `NewEndpointAdded` - New API endpoints
  - `NewPublicFunction` - New exported functions/classes
  - `DbSchemaChanged` - Database schema modifications
  - `NewMigrationFile` - Database migration files
  - `DockerfileChanged` / `DockerComposeChanged` - Infrastructure changes
  - `NewEnvVar` - New environment variables
  - `WorkflowChanged` - CI/CD pipeline changes

**Documentation Obligation Mapping**:
- Maps each detected event to documentation areas that should be updated:
  - API documentation
  - Database/schema documentation
  - Setup/environment documentation
  - Changelog entries
  - Infrastructure/runbook documentation

**Intelligent Decision Making**:
- Determines if documentation already covers the changes (by checking if relevant doc files were modified)
- Decides whether to warn about missing documentation or provide positive feedback
- Provides reasoning for its decisions with confidence levels (high/medium/low)

#### 2. **File Summarization**

For **every single file** in a PR, Gemini generates:
- **What the file is**: Route, component, migration, workflow, config, etc.
- **What changed**: In plain language, explaining the new or modified code
- **Key functions/endpoints**: Names and descriptions of important functions, what they do, parameters, return values
- **Impact explanation**: For DB/infra/CI files, explains effects on schema, env vars, ports, workflows

These summaries are written from a **new developer's perspective** - like onboarding notes that help someone quickly understand the change.

#### 3. **Context-Aware Comment Generation**

Gemini crafts intelligent PR comments that:
- **Explain the main changes** in developer-friendly language
- **Describe where things live** (file paths) and how they're called in the system
- **Call out important details**: Parameters, return values, database changes, infrastructure impacts
- **Provide a "tour"** of the PR for new team members
- **Use appropriate tone**: Friendly, professional, supportive - not robotic or overly critical

The comments are **contextual** - they adapt based on:
- Whether docs were updated (positive feedback vs. gentle reminders)
- The type of changes (code, infrastructure, database, etc.)
- The complexity of the PR
- The repository's structure and conventions

#### 4. **Fallback Intelligence**

Code Keeper has a sophisticated fallback system:
- **Heuristic-based analysis**: If Gemini fails, it falls back to rule-based file classification and change detection
- **Hybrid approach**: Combines LLM insights with deterministic rules for reliability
- **Graceful degradation**: Always provides useful feedback, even if LLM is unavailable

### Technical Implementation

**Model**: Google Gemini 2.5 Flash
- Fast, cost-effective model optimized for structured JSON responses
- Temperature: 0.15 (low for consistent, focused responses)
- Max tokens: 1024 (sufficient for structured analysis)
- Response format: JSON (structured, parseable output)

**Prompt Engineering**:
- Specialized `CODEKEEPER_PROMPT` that defines the AI's role and expertise
- Detailed instructions for event detection, documentation mapping, and comment generation
- Emphasis on being helpful, professional, and supportive
- Focus on actionable, specific feedback

**Context Management**:
- Truncates large patches intelligently (2000 chars per file)
- Limits file count (18 files) to stay within token limits
- Provides file paths and summaries for omitted files
- Maintains full context for critical files

**Error Handling**:
- Catches and logs LLM errors gracefully
- Falls back to heuristic-based analysis
- Logs analysis results for debugging and improvement
- Stores LLM analysis results in database for audit trail

## Architecture

### Frontend (Web)
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS 4
- **Type Safety**: TypeScript throughout
- **Authentication**: Supabase Auth with GitHub OAuth
- **UI Components**: Custom component library with shadcn/ui

### Backend
- **API**: Next.js API routes (serverless functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **External APIs**: GitHub REST API

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Services**: Web (port 3000), Backend (port 3001), Docs (port 8080)
- **Deployment**: Supports standalone Next.js builds, horizontal scaling

### Data Storage
- **Repository Analyses**: Stored in `repo_analyses` table
- **PR Runs**: Tracked in `pr_runs` table with full logs
- **User Data**: Managed through Supabase Auth

## Workflow

1. **Repository Connection**: User connects GitHub account via OAuth
2. **Repository Selection**: User selects repositories to monitor
3. **Webhook Setup**: Code Keeper receives GitHub webhooks for PR events
4. **PR Analysis Trigger**: When a PR is opened/updated, analysis is triggered
5. **LLM Analysis**: Gemini analyzes the PR changes, detects events, maps documentation obligations
6. **Comment Generation**: Intelligent comment is generated and posted to the PR
7. **Tracking**: Analysis results are stored in database for history and insights

## Key Differentiators

1. **Intelligence Over Rules**: Uses LLM to understand context and intent, not just pattern matching
2. **Developer-Friendly**: Comments read like they're from a helpful senior engineer, not a bot
3. **Comprehensive**: Analyzes entire PRs, not just individual files
4. **Context-Aware**: Understands repository structure, zones, and documentation patterns
5. **Proactive**: Suggests documentation updates before they're forgotten
6. **Educational**: Helps new developers understand changes quickly

## Use Cases

- **Teams**: Keep documentation in sync across large codebases
- **Open Source**: Maintain high-quality documentation for contributors
- **Onboarding**: Help new team members understand PRs quickly
- **Code Reviews**: Provide additional context for reviewers
- **Technical Debt**: Catch documentation drift early

## Technology Stack Summary

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **AI/LLM**: Google Gemini 2.5 Flash
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + GitHub OAuth
- **Infrastructure**: Docker, Docker Compose
- **Version Control**: GitHub Integration

---

**The LLM integration is what makes Code Keeper intelligent** - it transforms a simple file-change detector into a sophisticated code analysis system that understands context, provides helpful feedback, and helps teams maintain better documentation and code quality.

