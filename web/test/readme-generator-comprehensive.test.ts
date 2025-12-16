import { describe, it, expect } from 'vitest'
import { generateCompleteReadme } from '@/lib/gemini/readme-generator'
import type { ReadmeSuggestion } from '@/lib/gemini/readme-suggestions'

/**
 * Comprehensive tests for README generator across different PR types
 * Goal: Ensure effective documentation is generated for all codebase changes
 */

describe('README Generator - Comprehensive PR Scenarios', () => {
  describe('API Endpoint PRs', () => {
    it('should generate effective documentation for REST API endpoints', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'API Endpoints',
          suggestedContent: `## API Endpoints

### POST /api/users
Creates a new user in the system.

**Usage:**
\`\`\`javascript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com',
    name: 'John Doe'
  })
})
const user = await response.json()
\`\`\`

**Parameters:**
- \`email\` (string, required): User email address
- \`name\` (string, optional): User's full name

**Response:**
\`\`\`json
{
  "id": "123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

**Authentication:** Bearer token required

### GET /api/users/:id
Retrieves a user by ID.

**Usage:**
\`\`\`javascript
const response = await fetch('/api/users/123', {
  headers: { 'Authorization': \`Bearer \${token}\` }
})
const user = await response.json()
\`\`\``,
          reason: 'New REST API endpoints added',
          priority: 'high',
        },
        {
          section: 'Authentication',
          suggestedContent: `## Authentication

All API endpoints require authentication using a Bearer token.

**Getting a Token:**
\`\`\`javascript
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})
const { token } = await loginResponse.json()
\`\`\`

**Using the Token:**
Include the token in the Authorization header:
\`\`\`javascript
headers: { 'Authorization': \`Bearer \${token}\` }
\`\`\``,
          reason: 'Authentication system added',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add user management API endpoints',
        prNumber: 1,
      })

      // Verify API documentation is comprehensive
      expect(result.content).toContain('POST /api/users')
      expect(result.content).toContain('GET /api/users/:id')
      expect(result.content).toContain('Usage:')
      expect(result.content).toContain('Parameters:')
      expect(result.content).toContain('Response:')
      expect(result.content).toContain('Authentication')
      expect(result.content).toContain('Bearer token')
      expect(result.content).toContain('fetch(') // Code examples present
    })

    it('should document GraphQL API endpoints effectively', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'API Endpoints',
          suggestedContent: `## GraphQL API

### Query: getUser
\`\`\`graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    name
    createdAt
  }
}
\`\`\`

**Usage:**
\`\`\`javascript
const query = \`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
    }
  }
\`

const response = await fetch('/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { id: '123' } })
})
\`\`\`

### Mutation: createUser
\`\`\`graphql
mutation CreateUser($input: UserInput!) {
  createUser(input: $input) {
    id
    email
  }
}
\`\`\``,
          reason: 'GraphQL API added',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add GraphQL API',
        prNumber: 2,
      })

      expect(result.content).toContain('GraphQL')
      expect(result.content).toContain('query GetUser')
      expect(result.content).toContain('mutation CreateUser')
      expect(result.content).toContain('variables')
    })
  })

  describe('Function/Utility PRs', () => {
    it('should document important utility functions effectively', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Important Functions',
          suggestedContent: `## Important Functions

### createUser(email, name)
Creates a new user in the system and sends a welcome email.

**Parameters:**
- \`email\` (string): User email address
- \`name\` (string): User's full name

**Returns:** Promise<User>

**When to use:** Call this when registering a new user through the signup flow.

**Usage Example:**
\`\`\`javascript
import { createUser } from './lib/users'

const user = await createUser('user@example.com', 'John Doe')
console.log(\`Created user: \${user.id}\`)
\`\`\`

### validateEmail(email)
Validates an email address format.

**Parameters:**
- \`email\` (string): Email to validate

**Returns:** boolean

**Usage Example:**
\`\`\`javascript
import { validateEmail } from './lib/validation'

if (validateEmail('user@example.com')) {
  // Email is valid
}
\`\`\``,
          reason: 'New utility functions added',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add user management utilities',
        prNumber: 3,
      })

      expect(result.content).toContain('createUser')
      expect(result.content).toContain('validateEmail')
      expect(result.content).toContain('Parameters:')
      expect(result.content).toContain('Returns:')
      expect(result.content).toContain('When to use:')
      expect(result.content).toContain('Usage Example:')
      expect(result.content).toContain('import')
    })

    it('should document class methods and constructors', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Important Functions',
          suggestedContent: `## API Client

### UserService
A service class for managing users.

**Constructor:**
\`\`\`javascript
const userService = new UserService({
  apiUrl: 'https://api.example.com',
  apiKey: 'your-api-key'
})
\`\`\`

**Methods:**

#### userService.create(data)
Creates a new user.

\`\`\`javascript
const user = await userService.create({
  email: 'user@example.com',
  name: 'John Doe'
})
\`\`\`

#### userService.getById(id)
Retrieves a user by ID.

\`\`\`javascript
const user = await userService.getById('123')
\`\`\``,
          reason: 'New service class added',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add UserService class',
        prNumber: 4,
      })

      expect(result.content).toContain('UserService')
      expect(result.content).toContain('Constructor:')
      expect(result.content).toContain('Methods:')
      expect(result.content).toContain('userService.create')
      expect(result.content).toContain('userService.getById')
    })
  })

  describe('Configuration PRs', () => {
    it('should document environment variables effectively', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Configuration',
          suggestedContent: `## Configuration

Set the following environment variables:

**Required:**
- \`DATABASE_URL\`: PostgreSQL connection string
  \`\`\`bash
  export DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
  \`\`\`
- \`JWT_SECRET\`: Secret key for JWT token signing
  \`\`\`bash
  export JWT_SECRET=your-secret-key-here
  \`\`\`

**Optional:**
- \`PORT\`: Server port (default: 3000)
- \`NODE_ENV\`: Environment (development, production)
- \`LOG_LEVEL\`: Logging level (debug, info, warn, error)

**Example .env file:**
\`\`\`bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
\`\`\``,
          reason: 'New environment variables added',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add database and JWT configuration',
        prNumber: 5,
      })

      expect(result.content).toContain('Configuration')
      expect(result.content).toContain('DATABASE_URL')
      expect(result.content).toContain('JWT_SECRET')
      expect(result.content).toContain('Required:')
      expect(result.content).toContain('Optional:')
      expect(result.content).toContain('export')
      expect(result.content).toContain('.env')
    })

    it('should document config file changes', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Configuration',
          suggestedContent: `## Configuration

The application uses \`config.json\` for settings.

**Example config.json:**
\`\`\`json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp"
  },
  "api": {
    "timeout": 5000,
    "retries": 3
  }
}
\`\`\`

**Important Settings:**
- \`database.host\`: Database server hostname
- \`api.timeout\`: API request timeout in milliseconds`,
          reason: 'Config file structure changed',
          priority: 'medium',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Update configuration structure',
        prNumber: 6,
      })

      expect(result.content).toContain('config.json')
      expect(result.content).toContain('database')
      expect(result.content).toContain('Important Settings:')
    })
  })

  describe('Database/Migration PRs', () => {
    it('should document database schema changes', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Database',
          suggestedContent: `## Database

### Schema Changes

A new \`users\` table has been added with the following structure:

\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Running Migrations

\`\`\`bash
npm run migrate
\`\`\`

### For New Developers

The database uses PostgreSQL. To set up locally:

1. Install PostgreSQL
2. Create a database: \`CREATE DATABASE myapp;\`
3. Run migrations: \`npm run migrate\`
4. Seed data (optional): \`npm run seed\``,
          reason: 'New database table added',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add users table migration',
        prNumber: 7,
      })

      expect(result.content).toContain('Database')
      expect(result.content).toContain('CREATE TABLE')
      expect(result.content).toContain('Running Migrations')
      expect(result.content).toContain('npm run migrate')
      expect(result.content).toContain('For New Developers')
    })
  })

  describe('Feature PRs', () => {
    it('should document new features with usage examples', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Features',
          suggestedContent: `## Features

### User Authentication
The app now supports user authentication with JWT tokens.

**How to use:**
1. Register a new user
2. Login to get a token
3. Use the token for authenticated requests

**Example:**
\`\`\`javascript
// Register
await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})

// Login
const { token } = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
}).then(r => r.json())

// Use token
await fetch('/api/protected', {
  headers: { 'Authorization': \`Bearer \${token}\` }
})
\`\`\`

### File Upload
Upload files to the server with progress tracking.

**Usage:**
\`\`\`javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})
\`\`\``,
          reason: 'New authentication and file upload features',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add authentication and file upload',
        prNumber: 8,
      })

      expect(result.content).toContain('User Authentication')
      expect(result.content).toContain('File Upload')
      expect(result.content).toContain('How to use:')
      expect(result.content).toContain('Example:')
      expect(result.content).toContain('fetch(')
    })
  })

  describe('Frontend Component PRs', () => {
    it('should document React components effectively', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Components',
          suggestedContent: `## React Components

### UserProfile Component
Displays user profile information.

**Props:**
- \`userId\` (string, required): User ID to display
- \`showEmail\` (boolean, optional): Show email address (default: true)
- \`onEdit\` (function, optional): Callback when edit button is clicked

**Usage:**
\`\`\`tsx
import { UserProfile } from './components/UserProfile'

<UserProfile 
  userId="123" 
  showEmail={true}
  onEdit={() => console.log('Edit clicked')}
/>
\`\`\`

### useAuth Hook
Custom hook for authentication state.

**Returns:**
- \`user\`: Current user object or null
- \`login\`: Login function
- \`logout\`: Logout function
- \`isLoading\`: Loading state

**Usage:**
\`\`\`tsx
import { useAuth } from './hooks/useAuth'

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!user) return <button onClick={login}>Login</button>
  
  return <div>Welcome, {user.name}!</div>
}
\`\`\``,
          reason: 'New React components added',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add UserProfile component and useAuth hook',
        prNumber: 9,
      })

      expect(result.content).toContain('UserProfile')
      expect(result.content).toContain('useAuth')
      expect(result.content).toContain('Props:')
      expect(result.content).toContain('Returns:')
      expect(result.content).toContain('import')
      expect(result.content).toContain('tsx')
    })
  })

  describe('Breaking Changes PRs', () => {
    it('should document breaking changes prominently', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Breaking Changes',
          suggestedContent: `## ⚠️ Breaking Changes

### API Endpoint Changes
The \`/api/v1/users\` endpoint has been removed. Use \`/api/v2/users\` instead.

**Migration:**
\`\`\`javascript
// Old (deprecated)
fetch('/api/v1/users')

// New
fetch('/api/v2/users')
\`\`\`

### Configuration Changes
The \`DB_HOST\` environment variable has been renamed to \`DATABASE_HOST\`.

**Migration:**
\`\`\`bash
# Old
export DB_HOST=localhost

# New
export DATABASE_HOST=localhost
\`\`\``,
          reason: 'Breaking changes introduced',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Migrate to API v2',
        prNumber: 10,
      })

      expect(result.content).toContain('Breaking Changes')
      expect(result.content).toContain('Migration:')
      expect(result.content).toContain('deprecated')
    })
  })

  describe('Dependency Updates PRs', () => {
    it('should document dependency changes and requirements', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Requirements',
          suggestedContent: `## Requirements

**Node.js:** Version 18.0.0 or higher

**Package Manager:** npm 9.0.0 or higher, or yarn 3.0.0+

**Dependencies:**
- Updated to React 19.0.0 (breaking changes from React 18)
- Updated to Next.js 16.0.0
- Added new dependency: \`@prisma/client\` for database access

**Installation:**
\`\`\`bash
npm install
# or
yarn install
\`\`\`

**Note:** If upgrading from an older version, you may need to:
1. Clear node_modules: \`rm -rf node_modules\`
2. Clear package-lock: \`rm package-lock.json\`
3. Reinstall: \`npm install\``,
          reason: 'Dependencies updated',
          priority: 'medium',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Update dependencies to latest versions',
        prNumber: 11,
      })

      expect(result.content).toContain('Requirements')
      expect(result.content).toContain('Node.js')
      expect(result.content).toContain('npm install')
      expect(result.content).toContain('Note:')
    })
  })

  describe('CI/CD PRs', () => {
    it('should document CI/CD setup and workflows', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'CI/CD',
          suggestedContent: `## CI/CD

### GitHub Actions Workflows

The project uses GitHub Actions for continuous integration.

**Workflows:**
- \`ci.yml\`: Runs tests on every push
- \`deploy.yml\`: Deploys to production on merge to main

**Running Tests Locally:**
\`\`\`bash
npm test
\`\`\`

**Running Linting:**
\`\`\`bash
npm run lint
\`\`\`

**Pre-commit Hooks:**
The project uses Husky for pre-commit hooks. Before committing:
- Tests must pass
- Code must be linted
- TypeScript must compile without errors`,
          reason: 'CI/CD workflows added',
          priority: 'medium',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add GitHub Actions CI/CD',
        prNumber: 12,
      })

      expect(result.content).toContain('CI/CD')
      expect(result.content).toContain('GitHub Actions')
      expect(result.content).toContain('npm test')
      expect(result.content).toContain('Pre-commit')
    })
  })

  describe('Error Handling PRs', () => {
    it('should document error handling patterns', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Error Handling',
          suggestedContent: `## Error Handling

### API Error Responses
All API endpoints return errors in a consistent format:

\`\`\`json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 123 not found",
    "statusCode": 404
  }
}
\`\`\`

### Error Codes
- \`USER_NOT_FOUND\`: User does not exist
- \`VALIDATION_ERROR\`: Request validation failed
- \`UNAUTHORIZED\`: Authentication required
- \`FORBIDDEN\`: Insufficient permissions

### Handling Errors in Code
\`\`\`javascript
try {
  const user = await fetchUser(id)
} catch (error) {
  if (error.code === 'USER_NOT_FOUND') {
    // Handle not found
  } else if (error.code === 'VALIDATION_ERROR') {
    // Handle validation error
  }
}
\`\`\``,
          reason: 'Error handling system added',
          priority: 'medium',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add standardized error handling',
        prNumber: 13,
      })

      expect(result.content).toContain('Error Handling')
      expect(result.content).toContain('Error Codes')
      expect(result.content).toContain('try')
      expect(result.content).toContain('catch')
    })
  })

  describe('Testing Infrastructure PRs', () => {
    it('should document testing setup and usage', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Testing',
          suggestedContent: `## Testing

### Running Tests
\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
\`\`\`

### Writing Tests
Tests are located in the \`__tests__\` directory.

**Example test:**
\`\`\`javascript
import { describe, it, expect } from 'vitest'
import { createUser } from './users'

describe('createUser', () => {
  it('should create a user with valid data', async () => {
    const user = await createUser('test@example.com', 'Test User')
    expect(user.email).toBe('test@example.com')
  })
})
\`\`\`

### Test Coverage
Aim for at least 80% code coverage. Check coverage with:
\`\`\`bash
npm run test:coverage
\`\`\``,
          reason: 'Testing infrastructure added',
          priority: 'medium',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add testing infrastructure',
        prNumber: 14,
      })

      expect(result.content).toContain('Testing')
      expect(result.content).toContain('npm test')
      expect(result.content).toContain('Writing Tests')
      expect(result.content).toContain('Test Coverage')
    })
  })

  describe('Complex Multi-Feature PRs', () => {
    it('should handle PRs with multiple types of changes', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'API Endpoints',
          suggestedContent: `## API Endpoints

### POST /api/users
Creates a new user.`,
          reason: 'New API endpoint',
          priority: 'high',
        },
        {
          section: 'Important Functions',
          suggestedContent: `## Important Functions

### createUser(email, name)
Creates a user in the database.`,
          reason: 'New function',
          priority: 'high',
        },
        {
          section: 'Configuration',
          suggestedContent: `## Configuration

Set \`DATABASE_URL\` environment variable.`,
          reason: 'Config change',
          priority: 'high',
        },
        {
          section: 'For New Developers',
          suggestedContent: `## For New Developers

This PR adds user management. Key points:
1. Use the \`createUser\` function to create users
2. Set up the database before running
3. All API calls require authentication`,
          reason: 'New developer context',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add complete user management system',
        prNumber: 15,
      })

      // Should include all important sections
      expect(result.content).toContain('API Endpoints')
      expect(result.content).toContain('Important Functions')
      expect(result.content).toContain('Configuration')
      expect(result.content).toContain('For New Developers')
      
      // Verify all high-priority sections are present (order may vary based on essential section logic)
      const hasAPI = result.content.includes('API Endpoints')
      const hasFunctions = result.content.includes('Important Functions')
      const hasConfig = result.content.includes('Configuration')
      const hasNewDev = result.content.includes('For New Developers')
      
      expect(hasAPI).toBe(true)
      expect(hasFunctions).toBe(true)
      expect(hasConfig).toBe(true)
      expect(hasNewDev).toBe(true)
    })
  })

  describe('Documentation Quality Checks', () => {
    it('should ensure code examples are present for APIs', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'API Endpoints',
          suggestedContent: `## API Endpoints

### POST /api/users
Creates a new user.

**Usage:**
\`\`\`javascript
const response = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ email: 'user@example.com' })
})
\`\`\``,
          reason: 'API endpoint added',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add user API',
        prNumber: 16,
      })

      // Verify code examples are included
      expect(result.content).toContain('```javascript')
      expect(result.content).toContain('fetch(')
      expect(result.content).toContain('POST /api/users')
    })

    it('should ensure function documentation includes usage examples', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Important Functions',
          suggestedContent: `## Important Functions

### createUser(email, name)
Creates a user.

**Usage Example:**
\`\`\`javascript
const user = await createUser('user@example.com', 'John')
\`\`\``,
          reason: 'Function added',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add createUser function',
        prNumber: 17,
      })

      expect(result.content).toContain('createUser')
      expect(result.content).toContain('Usage Example:')
      expect(result.content).toContain('```javascript')
    })

    it('should ensure new developer context is included when provided', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'For New Developers',
          suggestedContent: `## For New Developers

This PR introduces authentication. Here's what you need to know:

1. **How to use**: Call \`authenticate(token)\` before API requests
2. **Configuration**: Set \`JWT_SECRET\` environment variable
3. **Common use case**: Most endpoints now require auth
4. **Integration**: Works with existing user system`,
          reason: 'New developer onboarding',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add authentication',
        prNumber: 18,
      })

      expect(result.content).toContain('For New Developers')
      expect(result.content).toContain('How to use')
      expect(result.content).toContain('Configuration')
      expect(result.content).toContain('Common use case')
    })
  })
})

