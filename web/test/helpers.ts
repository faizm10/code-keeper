/**
 * Test helpers and utilities
 */

import type { ReadmeSuggestion } from '@/lib/gemini/readme-suggestions'
import type { PRFileForGemini } from '@/lib/gemini/pr-advice'

/**
 * Create mock README suggestions for testing
 */
export function createMockSuggestions(count = 3): ReadmeSuggestion[] {
  const sections = ['Description', 'Getting Started', 'Features', 'Configuration', 'API', 'Usage']
  return Array.from({ length: count }, (_, i) => ({
    section: sections[i % sections.length],
    suggestedContent: `Content for ${sections[i % sections.length]}`,
    reason: `Test reason ${i + 1}`,
    priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
  }))
}

/**
 * Create mock PR files for testing
 */
export function createMockPRFiles(count = 3): PRFileForGemini[] {
  const statuses: Array<'added' | 'modified' | 'removed'> = ['added', 'modified', 'removed']
  return Array.from({ length: count }, (_, i) => ({
    path: `src/file${i}.ts`,
    status: statuses[i % statuses.length],
    additions: (i + 1) * 10,
    deletions: i * 5,
    changes: (i + 1) * 15,
    patch: `+// Changes in file ${i}\n+export function test${i}() {}`,
  }))
}

/**
 * Wait for a specified amount of time (useful for async tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

