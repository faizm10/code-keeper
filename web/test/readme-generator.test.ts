import { describe, it, expect } from 'vitest'
import { generateCompleteReadme } from '@/lib/gemini/readme-generator'
import type { ReadmeSuggestion } from '@/lib/gemini/readme-suggestions'

describe('README Generator', () => {
  const mockSuggestions: ReadmeSuggestion[] = [
    {
      section: 'Description',
      suggestedContent: 'This is a test project that demonstrates README generation.',
      reason: 'Project needs a clear description',
      priority: 'high',
    },
    {
      section: 'Getting Started',
      suggestedContent: '1. Clone the repository\n2. Run `npm install`\n3. Run `npm start`',
      reason: 'Users need installation instructions',
      priority: 'high',
    },
    {
      section: 'Features',
      suggestedContent: '- Feature 1\n- Feature 2\n- Feature 3',
      reason: 'List key features',
      priority: 'medium',
    },
    {
      section: 'Configuration',
      suggestedContent: 'Set the following environment variables:\n- `API_KEY`: Your API key',
      reason: 'Document configuration',
      priority: 'low',
    },
  ]

  describe('generateCompleteReadme', () => {
    it('should generate a new README when no current README exists', () => {
      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions: mockSuggestions,
        prTitle: 'Add README documentation',
        prNumber: 1,
      })

      expect(result.isNew).toBe(true)
      expect(result.content).toContain('This is a test project')
      expect(result.content).toContain('Getting Started')
      expect(result.content).toContain('Clone the repository')
      expect(result.title).toBe('README.md')
    })

    it('should generate a new README when current README is empty', () => {
      const result = generateCompleteReadme({
        currentReadme: '',
        suggestions: mockSuggestions,
        prTitle: 'Add README documentation',
        prNumber: 1,
      })

      expect(result.isNew).toBe(true)
      expect(result.content).toContain('This is a test project')
    })

    it('should merge suggestions into existing README', () => {
      const existingReadme = `# My Project

## Overview
This is an existing project.

## Installation
Old installation steps.
`

      const result = generateCompleteReadme({
        currentReadme: existingReadme,
        suggestions: mockSuggestions,
        prTitle: 'Update README',
        prNumber: 2,
      })

      expect(result.isNew).toBe(false)
      expect(result.content).toContain('My Project')
      expect(result.content).toContain('Getting Started')
    })

    it('should prioritize essential sections', () => {
      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions: mockSuggestions,
        prTitle: 'Add README',
        prNumber: 1,
      })

      // Description content should come before Features section
      const descriptionContentIndex = result.content.indexOf('This is a test project')
      const featuresIndex = result.content.indexOf('Features')
      
      expect(descriptionContentIndex).toBeLessThan(featuresIndex)
    })

    it('should limit sections for simplicity', () => {
      const manySuggestions: ReadmeSuggestion[] = Array.from({ length: 15 }, (_, i) => ({
        section: `Section ${i + 1}`,
        suggestedContent: `Content for section ${i + 1}`,
        reason: 'Test',
        priority: i < 5 ? 'high' : 'low',
      }))

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions: manySuggestions,
        prTitle: 'Add README',
        prNumber: 1,
      })

      // Should not include all 15 sections
      const sectionCount = (result.content.match(/^## /gm) || []).length
      expect(sectionCount).toBeLessThanOrEqual(7) // Description + max 6 sections
    })

    it('should handle high priority suggestions first', () => {
      const suggestions: ReadmeSuggestion[] = [
        {
          section: 'Low Priority Section',
          suggestedContent: 'Low priority content',
          reason: 'Test',
          priority: 'low',
        },
        {
          section: 'High Priority Section',
          suggestedContent: 'High priority content',
          reason: 'Test',
          priority: 'high',
        },
      ]

      const result = generateCompleteReadme({
        currentReadme: undefined,
        suggestions,
        prTitle: 'Add README',
        prNumber: 1,
      })

      const highIndex = result.content.indexOf('High Priority Section')
      const lowIndex = result.content.indexOf('Low Priority Section')
      
      expect(highIndex).toBeLessThan(lowIndex)
    })
  })
})

