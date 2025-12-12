# Code Keeper

Code Keeper is a full-stack app that helps you store and explore code repos, snippets, and docs in one place.


## Overall README Structure & Features

# Code Keeper

Code Keeper is a full-stack app that helps you store and explore code repos, snippets, and docs in one place.

## ✨ Features

*   **Repository Management**: Store and organize your code repositories.
*   **Snippet Storage**: Keep track of useful code snippets.
*   **Documentation Hub**: Centralize your project documentation.
*   **AI-powered README Suggestions**: Get intelligent, context-aware suggestions for improving your `README.md` files directly within the dashboard. This feature analyzes your pull request changes and provides actionable advice to keep your documentation up-to-date and comprehensive.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   Git
*   A database (e.g., PostgreSQL, MongoDB) - *Specify your actual database here*

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-org/code-keeper.git
    cd code-keeper
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    # or yarn install
    ```
3.  **Set up environment variables**:
    Create a `.env.local` file in the root directory and configure it. See the [Configuration](#-configuration) section for details.
4.  **Run database migrations**:
    ```bash
    # Example for Prisma:
    npx prisma migrate dev
    ```
5.  **Start the development server**:
    ```bash
    npm run dev
    # or yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Configuration

Code Keeper requires several environment variables to run correctly. Create a `.env.local` file based on `.env.example` (if it exists) or the following:

*   `DATABASE_URL`: Your database connection string.
*   `GITHUB_CLIENT_ID`: OAuth Client ID for GitHub integration.
*   `GITHUB_CLIENT_SECRET`: OAuth Client Secret for GitHub integration.
*   `NEXTAUTH_SECRET`: A random string used to sign and encrypt cookies.
*   `NEXTAUTH_URL`: The URL of your application (e.g., `http://localhost:3000`).
*   **`GEMINI_API_KEY`**: Your API key for Google Gemini, required for the AI-powered README suggestions feature. Obtain one from [Google AI Studio](https://aistudio.google.com/).

## 🌐 API Endpoints

Code Keeper exposes several API endpoints for interacting with its services.

### README Suggestions

*   **`GET /api/repositories/[owner]/[repo]/prs/[number]/readme-suggestions`**
    *   **Description**: Retrieves AI-generated README suggestions for a specific Pull Request.
    *   **Parameters**:
        *   `owner` (string): The owner of the repository.
        *   `repo` (string): The name of the repository.
        *   `number` (number): The pull request number.
    *   **Response**: Returns a JSON object containing suggested updates for the README.
    *   **Example Response**:
        ```json
        {
          "suggestions": [
            {
              "section": "Features",
              "suggestedContent": "Add a new feature: AI-powered README suggestions.",
              "reason": "New feature introduced in PR."
            }
          ]
        }
        ```
    *   **Note**: This endpoint leverages the `GEMINI_API_KEY` for AI processing.

### Other Endpoints (Placeholder)

*   `GET /api/repositories` - List all repositories.
*   `POST /api/snippets` - Create a new snippet.
*   ... (Add other relevant API endpoints here as they are developed)

## 🧠 How it Works (Architecture Overview)

Code Keeper is built with Next.js for the frontend and API routes. It utilizes a database for data persistence and integrates with external services like GitHub for repository access.

The new **AI-powered README Suggestions** feature works as follows:
1.  When a user requests README suggestions for a Pull Request, the application fetches the PR details and code changes.
2.  This information is then used to construct a prompt for the Google Gemini AI model (via `web/lib/gemini/readme-suggestions.ts`).
3.  Gemini processes the prompt and generates relevant README update suggestions.
4.  These suggestions are then displayed in the dashboard using the `ReadmeSuggestionsDisplay` component.

## 🤝 Contributing

We welcome contributions! Please see our `CONTRIBUTING.md` for more details.

## 📄 License

This project is licensed under the MIT License.

