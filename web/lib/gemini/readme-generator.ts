/**
 * README Generator
 * 
 * Generates complete README content from suggestions
 */

import { ReadmeSuggestion } from './readme-suggestions'

export type ReadmeGenerationOptions = {
  currentReadme?: string
  suggestions: ReadmeSuggestion[]
  prTitle: string
  prNumber: number
}

/**
 * Generate a complete README by merging current content with suggestions
 */
export function generateCompleteReadme(options: ReadmeGenerationOptions): {
  content: string
  title: string
  isNew: boolean
} {
  const { currentReadme, suggestions, prTitle, prNumber } = options
  const isNew = !currentReadme || currentReadme.trim().length === 0

  // If no current README, generate a new one
  if (isNew) {
    const title = generateReadmeTitle(prTitle, prNumber)
    const content = generateNewReadme(title, suggestions)
    return { content, title, isNew: true }
  }

  // Merge suggestions into existing README
  const mergedContent = mergeSuggestionsIntoReadme(currentReadme, suggestions)
  return { content: mergedContent, title: 'README.md', isNew: false }
}

/**
 * Generate a title for new README based on PR
 */
function generateReadmeTitle(prTitle: string, prNumber: number): string {
  // Extract project name or use a default
  // Could be enhanced to detect from repo name or package.json
  return 'README.md'
}

/**
 * Generate a new README from scratch - simplified for new users
 */
function generateNewReadme(title: string, suggestions: ReadmeSuggestion[]): string {
  const sections: string[] = []
  
  // Extract project name from title or use default
  const projectName = suggestions.find(s => 
    s.section.toLowerCase().includes('project') ||
    s.section.toLowerCase().includes('name')
  )?.section || 'Project'

  // Add title
  sections.push(`# ${projectName}\n`)

  // Prioritize essential sections for new users
  const essentialSections = [
    'description', 'overview', 'about', 'what it does',
    'getting started', 'quick start', 'installation', 'setup',
    'features', 'usage', 'configuration', 'requirements'
  ]

  // Sort suggestions: essential sections first, then by priority
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const aIsEssential = essentialSections.some(essential => 
      a.section.toLowerCase().includes(essential)
    )
    const bIsEssential = essentialSections.some(essential => 
      b.section.toLowerCase().includes(essential)
    )
    
    if (aIsEssential && !bIsEssential) return -1
    if (!aIsEssential && bIsEssential) return 1
    
    // Both essential or both not - sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  // Add description/overview first if available
  const descriptionSuggestion = sortedSuggestions.find(s => 
    s.section.toLowerCase().includes('description') || 
    s.section.toLowerCase().includes('overview') ||
    s.section.toLowerCase().includes('about') ||
    s.section.toLowerCase().includes('what it does')
  )
  if (descriptionSuggestion) {
    sections.push(descriptionSuggestion.suggestedContent)
    sections.push('')
  }

  // Add other sections (limit to essential ones for simplicity)
  const otherSuggestions = sortedSuggestions.filter(s => 
    !s.section.toLowerCase().includes('description') && 
    !s.section.toLowerCase().includes('overview') &&
    !s.section.toLowerCase().includes('about') &&
    !s.section.toLowerCase().includes('what it does')
  )

  // Only include top 5-6 most important sections to keep it simple
  const maxSections = 6
  const sectionsToInclude = otherSuggestions.slice(0, maxSections)

  for (const suggestion of sectionsToInclude) {
    sections.push(`## ${suggestion.section}\n`)
    // Simplify content - ensure it's concise
    const content = suggestion.suggestedContent
    sections.push(content)
    sections.push('')
  }

  return sections.join('\n')
}

/**
 * Merge suggestions into existing README - simplified for new users
 */
function mergeSuggestionsIntoReadme(
  currentReadme: string,
  suggestions: ReadmeSuggestion[]
): string {
  let result = currentReadme

  // Prioritize essential sections
  const essentialSections = [
    'getting started', 'quick start', 'installation', 'setup',
    'features', 'usage', 'configuration', 'requirements'
  ]

  // Sort by importance: essential first, then by priority
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const aIsEssential = essentialSections.some(essential => 
      a.section.toLowerCase().includes(essential)
    )
    const bIsEssential = essentialSections.some(essential => 
      b.section.toLowerCase().includes(essential)
    )
    
    if (aIsEssential && !bIsEssential) return -1
    if (!aIsEssential && bIsEssential) return 1
    
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  // Process each suggestion (limit to most important to keep README simple)
  const maxSuggestions = 6
  const suggestionsToProcess = sortedSuggestions.slice(0, maxSuggestions)

  for (const suggestion of suggestionsToProcess) {
    const sectionName = suggestion.section

    // Try to find existing section (case-insensitive, flexible matching)
    const sectionRegex = new RegExp(
      `(^##+\\s+[^#]*${escapeRegex(sectionName)}[^#]*?)(?=^##|$)`,
      'gmsi'
    )

    if (sectionRegex.test(result)) {
      // Section exists - replace with simplified content
      result = result.replace(
        sectionRegex,
        `## ${sectionName}\n\n${suggestion.suggestedContent}\n\n`
      )
    } else {
      // Section doesn't exist - append it (but only if essential or high priority)
      if (essentialSections.some(essential => sectionName.toLowerCase().includes(essential)) ||
          suggestion.priority === 'high') {
        result += `\n\n## ${sectionName}\n\n${suggestion.suggestedContent}\n`
      }
    }
  }

  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

