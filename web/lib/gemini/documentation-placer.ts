/**
 * Documentation Placer
 * 
 * Intelligently decides where each documentation update should go
 * - Which file should receive each update
 * - Which section within that file
 * - Whether to create, update, or append
 */

import { model } from './config'
import { GEMINI_MODEL_CONFIG } from '@/lib/config/gemini'
import { CODEKEEPER_BASE_PROMPT } from './prompts'
import type { ChangeAnalysisResult, DocumentationFile } from './documentation-analyzer'

export type DocumentationPlacement = {
  targetFile: string
  targetSection: string
  action: 'create' | 'update' | 'append' | 'create_section'
  content: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  order: number // For ordering multiple updates
}

export type PlacementResult = {
  placements: DocumentationPlacement[]
  summary: string
  confidence: 'high' | 'medium' | 'low'
}

type PlacementOptions = {
  changeAnalysis: ChangeAnalysisResult
  existingDocumentation: DocumentationFile[]
  prTitle: string
  prNumber: number
}

/**
 * Build prompt for intelligent documentation placement
 */
function buildPlacementPrompt(options: PlacementOptions): string {
  const { changeAnalysis, existingDocumentation, prTitle, prNumber } = options

  // Build existing documentation structure with sections
  const docsWithSections = existingDocumentation.map((doc) => {
    const sections = doc.content
      .split(/^##+ /m)
      .filter(Boolean)
      .map((s, i) => {
        if (i === 0) {
          // First part might be title/intro
          const lines = s.split('\n').slice(0, 3)
          return lines.join('\n').trim()
        }
        return s.split('\n')[0].trim()
      })
      .filter(Boolean)
      .slice(0, 10) // Limit to first 10 sections

    return {
      path: doc.path,
      type: doc.type,
      priority: doc.priority,
      sections: sections.length > 0 ? sections : ['(No clear sections detected)'],
      contentPreview: doc.content.slice(0, 500), // First 500 chars for context
    }
  })

  const docsStructure = docsWithSections.length > 0
    ? docsWithSections
        .map((doc) => {
          return `**${doc.path}** (${doc.type}, priority: ${doc.priority})
Sections: ${doc.sections.join(', ')}
Preview: ${doc.contentPreview.slice(0, 200)}...`
        })
        .join('\n\n')
    : 'No documentation files exist in the repository.'

  // Build affected docs summary
  const affectedDocsSummary = changeAnalysis.affectedDocs
    .map((doc) => `- ${doc.filePath}: ${doc.reason} (sections: ${doc.sectionsToUpdate.join(', ') || 'new sections needed'})`)
    .join('\n')

  const newDocsSummary = changeAnalysis.newDocsNeeded
    .map((doc) => `- ${doc.filePath} (${doc.type}): ${doc.reason}`)
    .join('\n')

  return `${CODEKEEPER_BASE_PROMPT}

You are CodeKeeper, an expert technical writer and documentation architect. Your task is to intelligently decide where each piece of documentation should be placed based on code changes and existing documentation structure.

## Pull Request Context
- **Title**: ${prTitle}
- **PR Number**: #${prNumber}

## Change Analysis Summary
${changeAnalysis.changesSummary}

## Detected Features
${changeAnalysis.detectedFeatures.length > 0 
  ? changeAnalysis.detectedFeatures.map(f => `- ${f}`).join('\n')
  : 'None detected'}

${changeAnalysis.detectedBreakingChanges 
  ? `## ⚠️ Breaking Changes Detected
${changeAnalysis.breakingChangesDescription || 'Breaking changes detected but description not provided'}

**IMPORTANT**: Breaking changes need special documentation (migration guides, deprecation notices, changelog entries).`
  : ''}

## Existing Documentation Structure

${docsStructure}

## Documentation Needs

### Files That Need Updates
${changeAnalysis.affectedDocs.length > 0 ? affectedDocsSummary : 'None - all existing docs are up to date'}

### New Files Needed
${changeAnalysis.newDocsNeeded.length > 0 ? newDocsSummary : 'None - existing documentation structure is sufficient'}

## Your Task

For each piece of information that needs to be documented, decide:

1. **Target File**: Which documentation file should receive this update?
   - If docs/ folder exists, prioritize files there over README.md
   - Match content type to appropriate file (API docs → API file, setup → getting-started, etc.)
   - Consider file purpose and existing structure

2. **Target Section**: Which section within that file?
   - Use existing sections if appropriate
   - Create new sections if needed
   - Follow logical document flow (overview → setup → usage → API → advanced)

3. **Action Type**:
   - "create": Create a new documentation file
   - "update": Update an existing section in an existing file
   - "append": Add content to the end of an existing section
   - "create_section": Add a new section to an existing file

4. **Content**: Generate the actual markdown content for this update
   - **For API Documentation**: Include method, path, parameters, request/response examples, and usage
   - **For Function Documentation**: Include function signature, parameters, return type, usage example, and when to use it
   - **For General Sections**: Keep it simple and user-focused (2-5 sentences max per section)
   - Use plain language that a new developer can understand
   - Be specific and actionable
   - **Always include code examples** for APIs and functions - show how to actually use them
   - Include authentication/authorization requirements if applicable

5. **Priority & Order**: 
   - High priority: Breaking changes, new features, setup changes
   - Medium: Configuration updates, minor features
   - Low: Nice-to-have improvements
   - Order: Logical flow (setup before usage, overview before details)

## Guidelines

- **Prioritize Primary Docs**: If docs/ folder exists, use those files over README.md
- **Match Content to File**: API changes → API docs, setup changes → getting-started, etc.
- **Respect Existing Structure**: Don't reorganize unnecessarily, work with what exists
- **Logical Flow**: Place content in logical order (intro → setup → API/Usage → advanced)
- **New Developer Focus**: Write as if onboarding a new lead developer - they need practical, actionable information
- **API Documentation**: MUST include:
  - HTTP method and path
  - Parameters (query, path, body)
  - Request/response examples with actual code
  - Authentication requirements
  - Common use cases
- **Function Documentation**: MUST include:
  - Function signature
  - Parameters and return types
  - Usage example with code
  - When to use it
- **Keep It Practical**: Focus on "how to use" not just "what it is"
- **Breaking Changes**: Must be documented prominently (changelog, migration guide, or top of relevant docs)

## Output Format (JSON)

Return a JSON object with this structure:

\`\`\`json
{
  "placements": [
    {
      "targetFile": "docs/getting-started.md",
      "targetSection": "Installation",
      "action": "update",
      "content": "## Installation\\n\\n1. Clone the repository\\n2. Run npm install\\n3. Set the new JWT_SECRET environment variable\\n4. Run npm start",
      "reason": "New JWT_SECRET environment variable was added, installation steps need updating",
      "priority": "high",
      "order": 1
    },
    {
      "targetFile": "docs/api-reference.md",
      "targetSection": "Authentication",
      "action": "create_section",
      "content": "## Authentication\\n\\nThe API now supports JWT-based authentication. Include the token in the Authorization header:\\n\\nAuthorization: Bearer <your-token>",
      "reason": "New authentication endpoint was added, needs API documentation",
      "priority": "high",
      "order": 2
    }
  ],
  "summary": "Documentation updates needed for new authentication system and environment configuration",
  "confidence": "high"
}
\`\`\`

**Important**: 
- For each detected feature/change, create ONE placement entry
- If multiple changes affect the same section, combine them into one placement
- Order placements logically (setup → usage → API → advanced)
- Keep content concise and user-focused

Generate the placement decisions now:`
}

/**
 * Determine where each documentation update should be placed
 */
export async function determineDocumentationPlacement(
  options: PlacementOptions
): Promise<PlacementResult> {
  const prompt = buildPlacementPrompt(options)

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: GEMINI_MODEL_CONFIG,
    })

    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    let parsed: Partial<PlacementResult>
    
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

    // Validate and sort placements by order
    const placements = Array.isArray(parsed.placements) 
      ? parsed.placements
          .filter((p): p is DocumentationPlacement => 
            typeof p === 'object' &&
            p !== null &&
            typeof p.targetFile === 'string' &&
            typeof p.targetSection === 'string' &&
            typeof p.action === 'string' &&
            typeof p.content === 'string' &&
            typeof p.reason === 'string' &&
            (p.priority === 'high' || p.priority === 'medium' || p.priority === 'low')
          )
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      : []

    return {
      placements,
      summary: parsed.summary || 'Documentation placement determined.',
      confidence: parsed.confidence || 'medium',
    }
  } catch (error) {
    console.error('Error determining documentation placement:', error)
    
    // Return fallback result
    return {
      placements: [],
      summary: 'Error determining documentation placement. Please review manually.',
      confidence: 'low',
    }
  }
}

/**
 * Group placements by target file for easier processing
 */
export function groupPlacementsByFile(
  placements: DocumentationPlacement[]
): Map<string, DocumentationPlacement[]> {
  const grouped = new Map<string, DocumentationPlacement[]>()
  
  for (const placement of placements) {
    const existing = grouped.get(placement.targetFile) || []
    existing.push(placement)
    grouped.set(placement.targetFile, existing)
  }
  
  return grouped
}

/**
 * Get placements for a specific file
 */
export function getPlacementsForFile(
  placements: DocumentationPlacement[],
  filePath: string
): DocumentationPlacement[] {
  return placements.filter(p => p.targetFile === filePath)
}

