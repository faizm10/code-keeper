import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzePullRequestWithGemini } from '@/lib/gemini/pr-advice'
import type { PRFileForGemini } from '@/lib/gemini/pr-advice'

// Mock the Gemini model
vi.mock('@/lib/gemini/config', () => ({
  model: {
    generateContent: vi.fn(),
  },
}))

describe('PR Advice', () => {
  const mockFiles: PRFileForGemini[] = [
    {
      path: 'src/index.ts',
      status: 'added',
      additions: 50,
      deletions: 0,
      changes: 50,
      patch: `+export function hello() {
+  return 'Hello, World!'
+}`,
    },
    {
      path: 'README.md',
      status: 'modified',
      additions: 10,
      deletions: 5,
      changes: 15,
      patch: `+## New Feature
+This PR adds a new hello function.
-## Old Content
`,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzePullRequestWithGemini', () => {
    it('should analyze PR with code and documentation changes', async () => {
      const { model } = await import('@/lib/gemini/config')
      
      // Mock Gemini response
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            zones: ['code'],
            events: ['new-feature'],
            obligations: [],
            docsTouched: true,
            docFilesTouched: ['README.md'],
            missingDocs: [],
            shouldWarn: false,
            reasoning: 'Documentation was updated along with code',
            summary: 'Added new hello function',
            comment: 'Great work! Documentation was updated.',
            fileSummaries: [
              {
                path: 'src/index.ts',
                status: 'added',
                summary: 'Added hello function',
              },
              {
                path: 'README.md',
                status: 'modified',
                summary: 'Updated documentation',
              },
            ],
            confidence: 'high',
          }),
        },
      }

      vi.mocked(model.generateContent).mockResolvedValue(mockResponse as any)

      const result = await analyzePullRequestWithGemini({
        prTitle: 'Add hello function',
        prNumber: 1,
        prBody: 'This PR adds a new hello function',
        files: mockFiles,
        docFilesTouched: ['README.md'],
      })

      expect(result).toBeDefined()
      expect(result?.docsTouched).toBe(true)
      expect(result?.shouldWarn).toBe(false)
      expect(result?.fileSummaries).toHaveLength(2)
    })

    it('should detect missing documentation', async () => {
      const { model } = await import('@/lib/gemini/config')
      
      const codeOnlyFiles: PRFileForGemini[] = [
        {
          path: 'src/index.ts',
          status: 'added',
          additions: 50,
          deletions: 0,
          changes: 50,
          patch: `+export function hello() {
+  return 'Hello, World!'
+}`,
        },
      ]

      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            zones: ['code'],
            events: ['new-feature'],
            obligations: ['documentation'],
            docsTouched: false,
            docFilesTouched: [],
            missingDocs: ['README.md'],
            shouldWarn: true,
            reasoning: 'Code changed but no documentation updated',
            summary: 'Added new hello function',
            comment: 'Consider updating documentation',
            fileSummaries: [
              {
                path: 'src/index.ts',
                status: 'added',
                summary: 'Added hello function',
              },
            ],
            confidence: 'high',
          }),
        },
      }

      vi.mocked(model.generateContent).mockResolvedValue(mockResponse as any)

      const result = await analyzePullRequestWithGemini({
        prTitle: 'Add hello function',
        prNumber: 1,
        prBody: 'This PR adds a new hello function',
        files: codeOnlyFiles,
        docFilesTouched: [],
      })

      expect(result).toBeDefined()
      expect(result?.docsTouched).toBe(false)
      expect(result?.shouldWarn).toBe(true)
      expect(result?.missingDocs).toContain('README.md')
    })

    it('should handle large PRs with many files', async () => {
      const { model } = await import('@/lib/gemini/config')
      
      const manyFiles: PRFileForGemini[] = Array.from({ length: 20 }, (_, i) => ({
        path: `src/file${i}.ts`,
        status: 'modified' as const,
        additions: 10,
        deletions: 5,
        changes: 15,
        patch: `+// Changes in file ${i}`,
      }))

      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            zones: ['code'],
            events: ['refactor'],
            obligations: [],
            docsTouched: false,
            docFilesTouched: [],
            missingDocs: [],
            shouldWarn: false,
            reasoning: 'Large refactor',
            summary: 'Refactored multiple files',
            comment: 'Large PR with many changes',
            fileSummaries: manyFiles.map(f => ({
              path: f.path,
              status: f.status,
              summary: `Modified ${f.path}`,
            })),
            confidence: 'medium',
          }),
        },
      }

      vi.mocked(model.generateContent).mockResolvedValue(mockResponse as any)

      const result = await analyzePullRequestWithGemini({
        prTitle: 'Large refactor',
        prNumber: 2,
        prBody: 'Refactoring multiple files',
        files: manyFiles,
        docFilesTouched: [],
      })

      expect(result).toBeDefined()
      expect(result?.fileSummaries).toHaveLength(20)
    })
  })
})

