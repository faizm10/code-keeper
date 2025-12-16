# README/Documentation Enhancement Plan

## Overview
Enhance the README suggestion system to dynamically understand code changes, locate all documentation files, intelligently decide where updates should go, and handle cases where no documentation exists.

## Step-by-Step Implementation Plan

### Phase 1: Enhanced Documentation Discovery
**Goal**: Find all documentation files in the repository, prioritizing docs/ folder and other .md files over root README.md

**Priority Order** (most important first):
1. **`docs/` directory** - Primary documentation location (all .md files within)
2. **`documentation/` directory** - Alternative docs location
3. **Other .md files in root** - API.md, CONTRIBUTING.md, CHANGELOG.md, etc.
4. **README.md in root** - Secondary (usually just overview, not detailed docs)

**Tasks**:
1. Create `discoverDocumentationFiles()` function that:
   - Scans repository with priority order above
   - Searches for:
     - `docs/` directory and all markdown files within (PRIMARY)
     - `documentation/` directory and all markdown files within
     - `*.md` files in root (excluding README.md initially)
     - `README.md` in root (as fallback/secondary)
   - Returns structure: `{ path: string, type: 'docs' | 'documentation' | 'readme' | 'other', priority: number, content: string }[]`
   - Uses GitHub API to fetch file tree and contents
   - Marks which files are primary vs secondary documentation

**Files to modify**:
- `web/lib/gemini/documentation-discovery.ts` (NEW)
- `web/app/api/repositories/[owner]/[repo]/prs/[number]/readme-suggestions/route.ts`

---

### Phase 2: AI-Powered Change Analysis
**Goal**: Use Gemini to deeply understand what changed and what documentation needs updating

**Tasks**:
1. Enhance Gemini prompt to:
   - Analyze ALL code changes in detail (not just summaries)
   - Understand the context and purpose of changes
   - Identify which documentation files should be updated
   - Determine if new documentation files need to be created
   - Map specific changes to specific documentation sections

2. Create new function `analyzeChangesForDocumentation()` that:
   - Takes full PR file changes (with patches)
   - Uses Gemini to analyze and return:
     ```typescript
     {
       changesSummary: string, // What actually changed
       affectedDocs: Array<{
         filePath: string,
         reason: string,
         sectionsToUpdate: string[],
         shouldCreate: boolean
       }>,
       newDocsNeeded: Array<{
         filePath: string,
         type: 'readme' | 'docs' | 'changelog',
         reason: string
       }>
     }
     ```

**Files to modify**:
- `web/lib/gemini/documentation-analyzer.ts` (NEW)
- `web/lib/gemini/readme-suggestions.ts` (ENHANCE)

---

### Phase 3: Intelligent Documentation Placement
**Goal**: Decide where each piece of information should go

**Tasks**:
1. Create `determineDocumentationPlacement()` function that:
   - Takes analyzed changes and existing documentation structure
   - Uses Gemini to decide:
     - Which file should receive each update
     - Which section within that file
     - Whether to create new sections or update existing ones
     - Priority and ordering of updates

2. Return structured suggestions:
   ```typescript
   Array<{
     targetFile: string,
     targetSection: string,
     action: 'create' | 'update' | 'append',
     content: string,
     reason: string,
     priority: 'high' | 'medium' | 'low'
   }>
   ```

**Files to modify**:
- `web/lib/gemini/documentation-placer.ts` (NEW)

---

### Phase 4: User Interaction for Missing Documentation
**Goal**: Ask user to create documentation when none exists

**Tasks**:
1. Create UI component `DocumentationCreationPrompt` that:
   - Detects when no documentation exists
   - Shows a friendly prompt asking user if they want to create:
     - README.md
     - docs/ directory structure
     - Other suggested documentation files
   - Allows user to select which files to create
   - Shows preview of what will be generated

2. Update API to handle "no docs" scenario:
   - Return special response when no docs found
   - Include suggestions for what to create
   - Wait for user confirmation before generating

**Files to create**:
- `web/components/dashboard/documentation-creation-prompt.tsx` (NEW)
- `web/app/api/repositories/[owner]/[repo]/prs/[number]/documentation-create/route.ts` (NEW)

**Files to modify**:
- `web/components/dashboard/readme-suggestions-display.tsx`
- `web/app/api/repositories/[owner]/[repo]/prs/[number]/readme-suggestions/route.ts`

---

### Phase 5: Dynamic Documentation Editing
**Goal**: Intelligently merge updates into existing documentation

**Tasks**:
1. Enhance `readme-generator.ts` to:
   - Handle multiple documentation files (not just README.md)
   - Intelligently merge content into existing sections
   - Preserve existing structure and formatting
   - Handle conflicts gracefully
   - Support creating new sections in existing files

2. Create `documentation-merger.ts` that:
   - Takes target file, section, and new content
   - Uses Gemini to intelligently merge:
     - Preserves existing formatting
     - Maintains document structure
     - Updates only relevant sections
     - Adds new sections in appropriate places

**Files to modify**:
- `web/lib/gemini/readme-generator.ts` → Rename to `documentation-generator.ts`
- `web/lib/gemini/documentation-merger.ts` (NEW)

---

### Phase 6: Enhanced UI/UX
**Goal**: Better user experience for managing documentation updates

**Tasks**:
1. Update `ReadmeSuggestionsDisplay` to:
   - Show all discovered documentation files
   - Display which files will be updated/created
   - Allow user to select which suggestions to apply
   - Show preview of changes for each file
   - Handle multiple file updates in one PR

2. Add file tree view showing:
   - Current documentation structure
   - What will be created/updated
   - Visual indicators for changes

**Files to modify**:
- `web/components/dashboard/readme-suggestions-display.tsx` (MAJOR UPDATE)
- `web/components/dashboard/documentation-file-tree.tsx` (NEW)

---

## Implementation Order

1. **Phase 1** - Documentation Discovery (Foundation)
2. **Phase 2** - AI-Powered Change Analysis (Core Intelligence)
3. **Phase 3** - Intelligent Placement (Decision Making)
4. **Phase 4** - User Interaction (Missing Docs Handling)
5. **Phase 5** - Dynamic Editing (Execution)
6. **Phase 6** - Enhanced UI (User Experience)

## API Changes

### New Endpoints
- `GET /api/repositories/[owner]/[repo]/documentation` - Discover all docs
- `POST /api/repositories/[owner]/[repo]/prs/[number]/documentation-analyze` - Deep analysis
- `POST /api/repositories/[owner]/[repo]/prs/[number]/documentation-create` - Create new docs

### Modified Endpoints
- `POST /api/repositories/[owner]/[repo]/prs/[number]/readme-suggestions` - Enhanced to handle all docs
- `POST /api/repositories/[owner]/[repo]/prs/[number]/readme-apply` - Support multiple files

## Database Schema Updates

May need to track:
- Multiple documentation files per PR
- User preferences for documentation structure
- History of documentation updates

## Testing Considerations

- Test with repositories that have no documentation
- Test with multiple documentation files
- Test with complex existing documentation structures
- Test edge cases (empty files, malformed markdown, etc.)

