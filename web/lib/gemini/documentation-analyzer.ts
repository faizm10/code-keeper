/**
 * Documentation Analyzer
 * 
 * Uses Gemini AI to deeply analyze code changes and determine what documentation needs updating
 */

import { model } from './config'
import { GEMINI_MODEL_CONFIG } from '@/lib/config/gemini'
import { CODEKEEPER_BASE_PROMPT } from './prompts'

export type CodeChange = {
  path: string
  status: 'added' | 'modified' | 'removed'
  additions: number
  deletions: number
  patch?: string
  summary?: string
}

export type DocumentationFile = {
  path: string
  type: 'docs' | 'documentation' | 'readme' | 'changelog' | 'contributing' | 'api' | 'other'
  priority: number
  content: string
}

export type AffectedDocumentation = {
  filePath: string
  reason: string
  sectionsToUpdate: string[]
  shouldCreate: boolean
  priority: 'high' | 'medium' | 'low'
}

export type NewDocumentationNeeded = {
  filePath: string
  type: 'readme' | 'docs' | 'changelog' | 'contributing' | 'api'
  reason: string
  priority: 'high' | 'medium' | 'low'
  suggestedStructure?: string[]
}

export type ApiEndpoint = {
  method: string // GET, POST, PUT, DELETE, etc.
  path: string // e.g., /api/users/:id
  description: string
  parameters?: Array<{ name: string; type: string; required: boolean; description: string }>
  requestBody?: { type: string; description: string; example?: string }
  response?: { type: string; description: string; example?: string }
  authentication?: string
  usageExample?: string // Code example showing how to use this endpoint
}

export type ImportantFunction = {
  name: string
  filePath: string
  description: string
  parameters?: Array<{ name: string; type: string; description: string }>
  returnType?: string
  usageExample?: string
  whenToUse?: string
}

export type ChangeAnalysisResult = {
  changesSummary: string // Detailed summary of what actually changed
  affectedDocs: AffectedDocumentation[]
  newDocsNeeded: NewDocumentationNeeded[]
  detectedFeatures: string[] // New features, endpoints, functions, etc.
  detectedApiEndpoints?: ApiEndpoint[] // New API endpoints that need documentation
  detectedFunctions?: ImportantFunction[] // Important functions that need documentation
  detectedBreakingChanges: boolean
  breakingChangesDescription?: string
  newDeveloperContext?: string // What new developers need to know
  confidence: 'high' | 'medium' | 'low'
}

type ChangeAnalysisOptions = {
  prTitle: string
  prNumber: number
  prBody?: string
  codeChanges: CodeChange[]
  existingDocumentation: DocumentationFile[]
  detectedEvents: string[]
}

/**
 * Build prompt for deep change analysis
 */
function buildChangeAnalysisPrompt(options: ChangeAnalysisOptions): string {
  const { prTitle, prNumber, prBody, codeChanges, existingDocumentation, detectedEvents } = options

  // Build detailed code changes summary with patches
  const changesWithDetails = codeChanges
    .map((change) => {
      const status = change.status.charAt(0).toUpperCase() + change.status.slice(1)
      let details = `**${status}**: \`${change.path}\` (+${change.additions} -${change.deletions})`
      
      if (change.patch) {
        // Include relevant parts of the patch (first 500 chars to avoid token limits)
        const patchPreview = change.patch.slice(0, 500)
        details += `\n\`\`\`diff\n${patchPreview}${change.patch.length > 500 ? '\n... (truncated)' : ''}\n\`\`\``
      }
      
      if (change.summary) {
        details += `\nSummary: ${change.summary}`
      }
      
      return details
    })
    .join('\n\n')

  // Build existing documentation structure
  const docsStructure = existingDocumentation.length > 0
    ? existingDocumentation
        .map((doc) => {
          const sections = doc.content
            .split(/^##+ /m)
            .filter(Boolean)
            .slice(0, 5) // First 5 sections
            .map((s) => s.split('\n')[0].trim())
            .filter(Boolean)
          
          return `- **${doc.path}** (${doc.type}, priority: ${doc.priority}): Sections: ${sections.join(', ') || 'None detected'}`
        })
        .join('\n')
    : 'No documentation files found in repository.'

  return `${CODEKEEPER_BASE_PROMPT}

You are CodeKeeper, an expert code analyst and technical writer. Your task is to deeply analyze code changes in a pull request and determine exactly what documentation needs to be updated or created.

## Pull Request Context
- **Title**: ${prTitle}
- **PR Number**: #${prNumber}
${prBody ? `- **Description**: ${prBody.slice(0, 500)}${prBody.length > 500 ? '...' : ''}` : ''}
- **Detected Events**: ${detectedEvents.length > 0 ? detectedEvents.join(', ') : 'None detected'}

## Code Changes (Detailed)

${changesWithDetails}

## Existing Documentation Structure

${docsStructure}

## Your Task

Analyze the code changes in detail and determine:

1. **What Actually Changed**: Provide a comprehensive summary of what the code changes do, including:
   - New features, functions, or endpoints added
   - Modified functionality or behavior
   - Removed features or deprecated code
   - Configuration changes
   - Dependencies added/removed
   - Breaking changes

2. **API Endpoints & Functions**: For new developers, identify:
   - **Key API endpoints**: HTTP routes (GET, POST, PUT, DELETE, etc.) with their paths, parameters, and purpose
   - **Important functions**: Public functions, classes, or methods that new developers need to know
   - **Usage examples**: How to call/use these APIs and functions (include code snippets)
   - **Authentication/Authorization**: If new auth mechanisms were added
   - **Request/Response formats**: What data structures are expected

3. **Which Documentation Files Need Updates**: For each existing documentation file, determine:
   - Does it need updates? (yes/no and why)
   - Which specific sections need updating?
   - Should new sections be created?
   - Priority level (high/medium/low)

4. **What New Documentation Is Needed**: If documentation is missing, suggest:
   - What new documentation files should be created?
   - What type of documentation (README, docs/, changelog, API docs, etc.)?
   - Why is it needed?
   - What structure should it have? (Must include API/Usage sections if APIs were added)

5. **Feature Detection**: Identify all new features, endpoints, functions, or significant changes that should be documented.

6. **Breaking Changes**: Detect if there are any breaking changes that need special documentation (migration guides, deprecation notices, etc.).

7. **New Developer Context**: Think like you're onboarding a new lead developer. What do they need to know?
   - How to use new features
   - Important configuration steps
   - Common use cases and examples
   - Integration points with other parts of the codebase

## Output Format (JSON)

Return a JSON object with this exact structure:

\`\`\`json
{
  "changesSummary": "Detailed 3-5 sentence summary of what actually changed in the code",
  "affectedDocs": [
    {
      "filePath": "docs/getting-started.md",
      "reason": "New authentication endpoint was added, needs to be documented in getting started guide",
      "sectionsToUpdate": ["Authentication", "API Endpoints"],
      "shouldCreate": false,
      "priority": "high"
    }
  ],
  "newDocsNeeded": [
    {
      "filePath": "docs/api-reference.md",
      "type": "docs",
      "reason": "New API endpoints were added but no API documentation exists",
      "priority": "high",
      "suggestedStructure": ["Overview", "Authentication", "Endpoints", "Examples"]
    }
  ],
  "detectedFeatures": [
    "New user authentication endpoint: POST /api/auth/login",
    "Added password reset functionality",
    "New environment variable: JWT_SECRET"
  ],
  "detectedBreakingChanges": false,
  "breakingChangesDescription": null,
  "confidence": "high"
}
\`\`\`

## Guidelines

- **Be Specific**: Don't just say "update docs" - specify which file and which sections
- **Prioritize Primary Docs**: If \`docs/\` folder exists, prioritize updating files there over README.md
- **Understand Context**: Read the code changes carefully to understand what they actually do
- **Detect Patterns**: Look for new endpoints, functions, config changes, dependencies, etc.
- **Breaking Changes**: Be thorough in detecting breaking changes - they need special documentation
- **Confidence**: Set confidence based on how clear the code changes are and how well you can determine documentation needs

Generate the analysis now:`
}

/**
 * Analyze code changes to determine documentation needs
 */
export async function analyzeChangesForDocumentation(
  options: ChangeAnalysisOptions
): Promise<ChangeAnalysisResult> {
  const prompt = buildChangeAnalysisPrompt(options)

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: GEMINI_MODEL_CONFIG,
    })

    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    let parsed: Partial<ChangeAnalysisResult>
    
    if (text.trim().startsWith('{')) {
      parsed = JSON.parse(text.trim())
    } else {
      // Try to extract JSON from code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/)
      if (jsonMatch && jsonMatch[1]) {
        parsed = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Could not extract JSON from Gemini response')
      }
    }

    // Validate and return structured result
    return {
      changesSummary: parsed.changesSummary || 'Code changes detected but summary unavailable.',
      affectedDocs: Array.isArray(parsed.affectedDocs) ? parsed.affectedDocs : [],
      newDocsNeeded: Array.isArray(parsed.newDocsNeeded) ? parsed.newDocsNeeded : [],
      detectedFeatures: Array.isArray(parsed.detectedFeatures) ? parsed.detectedFeatures : [],
      detectedBreakingChanges: parsed.detectedBreakingChanges || false,
      breakingChangesDescription: parsed.breakingChangesDescription || undefined,
      confidence: parsed.confidence || 'medium',
    }
  } catch (error) {
    console.error('Error analyzing changes for documentation:', error)
    
    // Return fallback result
    return {
      changesSummary: 'Error analyzing code changes. Please review manually.',
      affectedDocs: [],
      newDocsNeeded: [],
      detectedFeatures: [],
      detectedBreakingChanges: false,
      confidence: 'low',
    }
  }
}

