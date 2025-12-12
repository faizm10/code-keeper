# Code Keeper

Code Keeper is a full-stack app that helps you store and explore code repos, snippets, and docs in one place.


## Introduction / Features

# Code Keeper

Code Keeper is a full-stack app designed to streamline your documentation workflow. It helps you store and explore code repositories, snippets, and documentation in one centralized place.

**Key Features:**
*   **Repository Management**: Store and organize your code repositories.
*   **Snippet Storage**: Keep track of useful code snippets.
*   **Documentation Hub**: Centralize your project documentation.
*   **AI-Powered README Suggestions**: Automatically generate and suggest updates for your repository READMEs based on recent code changes in pull requests, helping you keep your documentation fresh and accurate.


## Usage - AI-Powered README Suggestions

## Usage

### AI-Powered README Suggestions

Code Keeper now provides intelligent suggestions for updating your repository's `README.md` files. When viewing a pull request in the dashboard, you will find a new section or tab dedicated to "README Suggestions".

1.  Navigate to a specific pull request within your repository dashboard (`/dashboard/repositories/[owner]/[repo]/pulls/[number]`).
2.  Look for the "README Suggestions" display, typically located in the sidebar or a dedicated section.
3.  Review the AI-generated suggestions for updates to your `README.md` based on the changes in the pull request.
4.  You can then incorporate these suggestions into your documentation.


## API Reference - README Suggestions

## API Reference

### Get README Suggestions for a Pull Request

Retrieves AI-generated README suggestions for a given pull request.

*   **URL**: `/api/repositories/{owner}/{repo}/prs/{number}/readme-suggestions`
*   **Method**: `GET`
*   **URL Parameters**:
    *   `owner`: The owner of the repository (e.g., `octocat`).
    *   `repo`: The name of the repository (e.g., `Spoon-Knife`).
    *   `number`: The pull request number.
*   **Response**: A JSON object containing an array of suggested README updates.
    ```json
    {
      "suggestions": [
        {
          "section": "Features",
          "currentContent": "Current feature list...",
          "suggestedContent": "Updated feature list including new AI-powered suggestions.",
          "reason": "New feature added in PR #33.",
          "priority": "high"
        }
      ],
      "summary": "Suggested updates for README based on PR #33.",
      "confidence": "high"
    }
    ```
*   **Notes**: This endpoint leverages AI (e.g., Gemini, as indicated by `web/lib/gemini/readme-suggestions.ts`) to analyze code changes and generate relevant documentation updates.
