# Quick Start - Live Testing

## Run Live Tests

```bash
npm run test:live
```

## What You'll Be Asked

1. **Repository**: Enter in format `owner/repo`
   - Example: `faizm10/code-keeper`

2. **PR Number**: Enter the pull request number
   - Example: `12345`
   - Example: `1`

3. **Test Type**: Choose what to test
   - `1` - PR Advice Analysis (analyzes PR with AI)
   - `2` - README Generation (generates documentation)
   - `3` - Both (recommended)

## Example

```bash
$ npm run test:live

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
✅ PR fetched: "Add new feature"
📡 Fetching PR files...
✅ Found 12 changed files

🔍 Analyzing PR with Gemini AI...
📝 Generating documentation suggestions...

[Results displayed...]

Test another PR? (y/n): n
```

## Requirements

- Must be logged in via web app (GitHub authentication)
- `GEMINI_API_KEY` environment variable set
- Access to the repository you're testing

## Tips

- Start with public repos to test
- Use recent PRs for best results
- Try different PR types (features, bugs, docs)
- Review the generated README quality

For more details, see [LIVE_TESTING.md](./LIVE_TESTING.md)

