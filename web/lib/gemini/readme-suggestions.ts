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

  return `You are CodeKeeper, an AI assistant that helps maintain documentation. Your task is to suggest specific README updates based on code changes in a pull request.

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
No README content provided. Please suggest new sections to add.`}

## Your Task
Analyze the code changes and suggest specific README updates. Consider:

1. **New Features/Endpoints**: If new API endpoints, functions, or features were added, suggest updates to:
   - Features/Functionality sections
   - API documentation
   - Usage examples
   - Installation/setup instructions

2. **Configuration Changes**: If environment variables, config files, or dependencies changed, suggest updates to:
   - Environment variables section
   - Configuration documentation
   - Setup/installation steps

3. **Architecture Changes**: If significant structural changes occurred, suggest updates to:
   - Architecture/Design sections
   - Project structure
   - Component/module descriptions

4. **Breaking Changes**: If any breaking changes are detected, suggest:
   - Migration guides
   - Changelog entries
   - Deprecation notices

5. **New Dependencies**: If new packages or tools were added, suggest updates to:
   - Dependencies section
   - Installation instructions
   - Requirements

## Output Format
Return a JSON object with this structure:
{
  "suggestions": [
    {
      "section": "Section name (e.g., 'Features', 'API Reference', 'Configuration')",
      "currentContent": "Current content in that section (if applicable)",
      "suggestedContent": "Suggested new or updated content for this section",
      "reason": "Why this update is needed based on the code changes",
      "priority": "high" | "medium" | "low"
    }
  ],
  "summary": "Brief summary of all suggested changes",
  "confidence": "high" | "medium" | "low"
}

## Guidelines
- Be specific and actionable - provide actual content suggestions, not just vague recommendations
- Focus on sections that directly relate to the code changes
- Prioritize high-impact changes (new features, breaking changes, new APIs)
- If the README is missing, suggest a complete structure
- Keep suggestions concise but informative
- Use markdown formatting in suggestedContent
- Consider the user's perspective - what would they need to know?

Generate the suggestions now:`
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

