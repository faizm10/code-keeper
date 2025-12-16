# Live Testing Tool

## Overview

The live testing tool allows you to test the README generator and PR advice functionality against **real GitHub pull requests** in real-time. This is perfect for:

- Testing with actual PRs from your repositories
- Validating documentation generation quality
- Debugging issues with specific PRs
- Demonstrating the system's capabilities

## Usage

### Quick Start

```bash
npm run test:live
```

### Interactive Flow

1. **Authentication Check**: The tool verifies you have a valid GitHub token
2. **Repository Input**: Enter the repository in `owner/repo` format
3. **PR Number**: Enter the pull request number to analyze
4. **Test Type**: Choose what to test:
   - `1` - PR Advice Analysis only
   - `2` - README Generation only
   - `3` - Both (Full Analysis) - **Recommended**

### Example Session

```
🧪 Code Keeper Live Testing Tool
================================================================================

🔑 Checking GitHub authentication...
✅ GitHub authentication successful

Enter repository (owner/repo): faizm10/code-keeper
Enter PR number: 33

What would you like to test?
1. PR Advice Analysis
2. README Generation
3. Both (Full Analysis)

Enter choice (1-3, default: 3): 3

📡 Fetching PR #33 from faizm10/code-keeper...
✅ PR fetched: "Add new API endpoint"
📡 Fetching PR files...
✅ Found 8 changed files

🔍 Analyzing PR with Gemini AI...

📝 Generating documentation suggestions...

================================================================================
📊 ANALYSIS RESULTS
================================================================================

📋 PR Summary:
   Title: Add new API endpoint
   Number: #12345
   State: open
   Author: username
   Files Changed: 8
   Total Changes: +245 -89

📁 File Classification:
   Code Files: 6
   Doc Files: 1
   Config Files: 1

🤖 Gemini AI Analysis:
   Zones: code, api
   Events: new-api-endpoint, authentication-added
   Missing Docs: README.md, docs/api.md
   Should Warn: Yes
   Confidence: high
   Reasoning: New API endpoints added but documentation is incomplete

📝 README Suggestions:
   Total Suggestions: 4
   Confidence: high
   Summary: Added API endpoint documentation and usage examples

   Suggestions by Section:
   1. API Endpoints (high priority)
      Reason: New API endpoints need documentation
      Preview: ## API Endpoints\n\n### POST /api/users\nCreates a new user...

   2. Authentication (high priority)
      Reason: New authentication system needs setup instructions
      Preview: ## Authentication\n\nAll API endpoints require authentication...

   3. Getting Started (medium priority)
      Reason: Setup steps may have changed
      Preview: ## Getting Started\n\n1. Install dependencies...

   4. Configuration (low priority)
      Reason: New environment variables added
      Preview: ## Configuration\n\nSet the following environment variables...

📄 Generated README Preview:
--------------------------------------------------------------------------------
# Project

This project provides a REST API for user management.

## API Endpoints

### POST /api/users
Creates a new user in the system.

**Usage:**
```javascript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
})
```

...
--------------------------------------------------------------------------------

Test another PR? (y/n): n

👋 Thanks for testing!
```

## What It Tests

### PR Advice Analysis
- Fetches real PR data from GitHub
- Analyzes code changes using Gemini AI
- Detects:
  - Code zones affected
  - Events (new features, breaking changes, etc.)
  - Missing documentation
  - Documentation obligations

### README Generation
- Fetches existing README (if present)
- Generates documentation suggestions
- Creates complete README preview
- Shows:
  - Suggested sections
  - Priority levels
  - Content previews
  - Final generated README

## Requirements

1. **GitHub Authentication**: You must be logged in via the web app first
   - The tool uses the same authentication as the main app
   - Make sure you've connected your GitHub account

2. **Gemini API Key**: Set `GEMINI_API_KEY` environment variable
   ```bash
   export GEMINI_API_KEY=your-key-here
   ```

3. **Repository Access**: You must have access to the repository you're testing
   - Public repos: Always accessible
   - Private repos: Requires authentication with appropriate permissions

## Output Details

The tool provides comprehensive output:

### PR Summary
- PR title, number, state, author
- Total files changed
- Total additions/deletions

### File Classification
- Code files count
- Documentation files count
- Configuration files count

### Gemini Analysis
- Detected zones (code, docs, config, etc.)
- Events detected (new features, breaking changes, etc.)
- Missing documentation files
- Whether documentation warning is needed
- Confidence level
- AI reasoning

### README Suggestions
- Total number of suggestions
- Confidence level
- Summary of changes
- Detailed suggestions by section:
  - Section name
  - Priority level
  - Reason for suggestion
  - Content preview

### Generated README Preview
- Complete README content (first 1000 chars)
- Shows how suggestions are merged
- Demonstrates final output quality

## Tips

1. **Start with Public Repos**: Test with well-known public repositories first
2. **Use Recent PRs**: Recent PRs are more likely to have complete data
3. **Try Different PR Types**: Test with:
   - Feature PRs
   - Bug fix PRs
   - Documentation PRs
   - Refactoring PRs
4. **Compare Results**: Run the same PR multiple times to see consistency
5. **Check Quality**: Review the generated README for:
   - Code examples present
   - Clear instructions
   - New developer context
   - Proper formatting

## Troubleshooting

### "GitHub authentication failed"
- Make sure you're logged in via the web app
- Check that your GitHub token is valid
- Try logging out and back in

### "Failed to fetch PR"
- Verify the repository name is correct
- Check that the PR number exists
- Ensure you have access to the repository

### "Error analyzing PR"
- Check that `GEMINI_API_KEY` is set
- Verify the API key is valid
- Check your API quota

### "Error generating suggestions"
- Ensure Gemini API is accessible
- Check API rate limits
- Verify the PR has analyzable changes

## Advanced Usage

### Testing Multiple PRs

The tool supports testing multiple PRs in one session:

```bash
npm run test:live
# Enter repo and PR
# Review results
# Answer "y" to test another PR
# Enter new repo/PR
```

### Testing Your Own Repos

1. Create a test PR in your repository
2. Make various types of changes (API, functions, config, etc.)
3. Run the live test tool
4. Review the generated documentation
5. Compare with what you'd expect

### Integration with CI/CD

You can also use this tool in automated testing:

```bash
# Set environment variables
export GITHUB_TOKEN=your-token
export GEMINI_API_KEY=your-key

# Run with specific PR (non-interactive mode could be added)
npm run test:live
```

## Next Steps

After testing, you can:
1. Review the generated README quality
2. Provide feedback on suggestions
3. Use the results to improve the system
4. Share examples with the team

