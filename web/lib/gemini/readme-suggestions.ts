/**
 * README Update Suggestions
 * 
 * This module generates AI-powered suggestions for README updates based on code changes
 */

import { model } from './config'
import { GEMINI_MODEL_CONFIG } from '@/lib/config/gemini'

export type ReadmeSuggestion = {
  section: string
  currentContent?: string
  suggestedContent: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export type ReadmeSuggestionResult = {
  suggestions: ReadmeSuggestion[]
  summary: string
  confidence: 'high' | 'medium' | 'low'
}

type ReadmeSuggestionOptions = {
  prTitle: string
  prNumber: number
  codeChanges: Array<{
    path: string
    status: 'added' | 'modified' | 'removed'
    summary: string
    additions?: number
    deletions?: number
  }>
  currentReadme?: string
  detectedEvents: string[]
  missingDocs: string[]
}

/**
 * Build prompt for generating README update suggestions
 */
function buildReadmeSuggestionPrompt(options: ReadmeSuggestionOptions): string {
  const { prTitle, prNumber, codeChanges, currentReadme, detectedEvents, missingDocs } = options

  const changesSummary = codeChanges
    .map((change) => {
      const status = change.status === 'added' ? 'Added' : change.status === 'modified' ? 'Modified' : 'Removed'
      return `- ${status}: \`${change.path}\` - ${change.summary}`
    })
    .join('\n')

  const eventsList = detectedEvents.length > 0 ? detectedEvents.map((e) => `- ${e}`).join('\n') : 'None detected'

  return `You are CodeKeeper, an AI assistant that helps maintain simple, user-focused README documentation. Your task is to suggest README updates that focus ONLY on what new users/leads need to know to get started quickly.

## Core Principle: Keep It Simple for New Users
The README should be concise, actionable, and focused on helping new users understand:
- What the project does (in plain language)
- How to get started quickly
- Essential features they need to know
- Basic configuration/requirements

**AVOID:**
- Overly technical implementation details
- Comprehensive API documentation (that belongs in separate docs)
- Internal architecture explanations
- Detailed troubleshooting guides
- Extensive examples or edge cases

## Pull Request Context
- **Title**: ${prTitle}
- **PR Number**: #${prNumber}
- **Detected Events**: ${eventsList}
- **Missing Documentation Areas**: ${missingDocs.length > 0 ? missingDocs.join(', ') : 'None'}

## Code Changes
${changesSummary}

${currentReadme ? `## Current README Content
\`\`\`
${currentReadme.slice(0, 5000)}
\`\`\`
` : `## Current README
No README content provided. Please suggest essential sections for new users.`}

## Your Task
Analyze the code changes and suggest README updates that help NEW USERS understand what they need to know. Focus on:

1. **Quick Start**: If setup/installation changed, update the "Getting Started" section with simple, step-by-step instructions
2. **What's New**: If new features were added, briefly mention them in a "Features" or "What It Does" section (1-2 sentences each)
3. **Essential Configuration**: If environment variables or config changed, add a simple "Configuration" section with only the essential variables
4. **Breaking Changes**: If breaking changes occurred, add a brief "Migration" note (2-3 sentences max)

**DO NOT suggest:**
- Detailed API documentation
- Complex architecture diagrams
- Extensive troubleshooting sections
- Multiple examples or edge cases
- Internal implementation details

## Output Format
Return a JSON object with this structure:
{
  "suggestions": [
    {
      "section": "Section name (e.g., 'Getting Started', 'Features', 'Configuration')",
      "currentContent": "Current content in that section (if applicable)",
      "suggestedContent": "Suggested new or updated content - KEEP IT SHORT AND SIMPLE (2-5 sentences max per section)",
      "reason": "Why this update is needed for new users",
      "priority": "high" | "medium" | "low"
    }
  ],
  "summary": "Brief summary of all suggested changes",
  "confidence": "high" | "medium" | "low"
}

## Guidelines
- **Simplicity First**: Each section should be 2-5 sentences maximum
- **New User Focus**: Write as if explaining to someone who has never seen the project
- **Actionable**: Focus on "how to" rather than "what is"
- **Concise**: Remove any unnecessary words or technical jargon
- **Essential Only**: Only include information new users absolutely need
- **Plain Language**: Avoid technical terms unless necessary, and explain them when used
- **Quick Wins**: Prioritize sections that help users get started in under 5 minutes

**Example of good, simple content:**
\`\`\`markdown
## Getting Started

1. Clone the repository
2. Run \`npm install\`
3. Set \`API_KEY\` in your environment
4. Run \`npm start\`
\`\`\`

**Example of content to avoid:**
\`\`\`markdown
## Architecture Overview

The system uses a microservices architecture with event-driven communication. The API gateway handles routing through a load balancer that distributes requests across multiple instances. Each service maintains its own database using the CQRS pattern...
\`\`\`

Generate simple, user-focused suggestions now:`
}

/**
 * Generate README update suggestions using Gemini AI
 */
export async function generateReadmeSuggestions(
  options: ReadmeSuggestionOptions
): Promise<ReadmeSuggestionResult> {
  const prompt = buildReadmeSuggestionPrompt(options)

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: GEMINI_MODEL_CONFIG,
    })

    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    let parsed: Partial<ReadmeSuggestionResult>
    
    if (text.trim().startsWith('{')) {
      parsed = JSON.parse(text.trim())
    } else {
      // Try to extract JSON from code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Could not parse JSON from response')
      }
    }

    return {
      suggestions: parsed.suggestions ?? [],
      summary: parsed.summary ?? 'No suggestions generated',
      confidence: parsed.confidence ?? 'low',
    }
  } catch (error) {
    console.error('Error generating README suggestions:', error)
    throw error
  }
}

