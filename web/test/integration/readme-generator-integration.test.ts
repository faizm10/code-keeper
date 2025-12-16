import { describe, it, expect } from 'vitest'
import { generateCompleteReadme } from '@/lib/gemini/readme-generator'
import type { ReadmeSuggestion } from '@/lib/gemini/readme-suggestions'

/**
 * Integration tests for README generator with realistic data
 * These tests use actual PR data patterns
 */

describe('README Generator Integration Tests', () => {
  it('should generate README for a new API endpoint PR', () => {
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
  body: JSON.stringify({ email: 'user@example.com' })
})
\`\`\`

**Parameters:**
- \`email\` (string, required): User email address
- \`name\` (string, optional): User's full name

**Response:**
\`\`\`json
{
  "id": "123",
  "email": "user@example.com"
}
\`\`\``,
        reason: 'New API endpoint was added',
        priority: 'high',
      },
      {
        section: 'Getting Started',
        suggestedContent: `## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set environment variables:
   \`\`\`bash
   export DATABASE_URL=your-database-url
   \`\`\`

3. Run the server:
   \`\`\`bash
   npm start
   \`\`\``,
        reason: 'Setup instructions needed',
        priority: 'high',
      },
    ]

    const result = generateCompleteReadme({
      currentReadme: undefined,
      suggestions,
      prTitle: 'Add user creation API endpoint',
      prNumber: 42,
    })

    expect(result.isNew).toBe(true)
    expect(result.content).toContain('API Endpoints')
    expect(result.content).toContain('POST /api/users')
    expect(result.content).toContain('Getting Started')
    expect(result.content).toContain('npm install')
  })

  it('should merge API documentation into existing README', () => {
    const existingReadme = `# My API Project

## Overview
A REST API for managing users.

## Installation
\`\`\`bash
npm install
\`\`\`
`

    const suggestions: ReadmeSuggestion[] = [
      {
        section: 'API Endpoints',
        suggestedContent: `## API Endpoints

### GET /api/users/:id
Retrieves a user by ID.

### POST /api/users
Creates a new user.`,
        reason: 'New endpoints added',
        priority: 'high',
      },
    ]

    const result = generateCompleteReadme({
      currentReadme: existingReadme,
      suggestions,
      prTitle: 'Add user endpoints',
      prNumber: 43,
    })

    expect(result.isNew).toBe(false)
    expect(result.content).toContain('My API Project')
    expect(result.content).toContain('API Endpoints')
    expect(result.content).toContain('GET /api/users/:id')
    expect(result.content).toContain('POST /api/users')
  })

  it('should handle function documentation suggestions', () => {
    const suggestions: ReadmeSuggestion[] = [
      {
        section: 'Important Functions',
        suggestedContent: `## Important Functions

### createUser(email, name)
Creates a new user in the system.

**Parameters:**
- \`email\` (string): User email address
- \`name\` (string): User's full name

**Returns:** Promise<User>

**Usage Example:**
\`\`\`javascript
const user = await createUser('user@example.com', 'John Doe')
\`\`\``,
        reason: 'New function added',
        priority: 'high',
      },
    ]

    const result = generateCompleteReadme({
      currentReadme: undefined,
      suggestions,
      prTitle: 'Add user creation function',
      prNumber: 44,
    })

    expect(result.content).toContain('Important Functions')
    expect(result.content).toContain('createUser')
    expect(result.content).toContain('Parameters:')
    expect(result.content).toContain('Usage Example:')
  })

  it('should prioritize new developer context', () => {
    const suggestions: ReadmeSuggestion[] = [
      {
        section: 'For New Developers',
        suggestedContent: `## For New Developers

This PR introduces a new authentication system. Here's what you need to know:

1. **How to use**: Call \`authenticateUser(token)\` before making API requests
2. **Configuration**: Set \`JWT_SECRET\` environment variable
3. **Common use case**: Most endpoints now require authentication
4. **Integration**: The auth system integrates with the existing user management`,
        reason: 'New developer onboarding info',
        priority: 'high',
      },
      {
        section: 'Advanced Configuration',
        suggestedContent: 'Advanced config details...',
        reason: 'Advanced info',
        priority: 'low',
      },
    ]

    const result = generateCompleteReadme({
      currentReadme: undefined,
      suggestions,
      prTitle: 'Add authentication system',
      prNumber: 45,
    })

    // "For New Developers" should be included
    expect(result.content).toContain('For New Developers')
    expect(result.content).toContain('authenticateUser')
    expect(result.content).toContain('JWT_SECRET')
  })
})

