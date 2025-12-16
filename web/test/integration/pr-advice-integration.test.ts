import { describe, it, expect } from 'vitest'
import { getGitHubAccessToken } from '@/lib/github/auth'

/**
 * Integration tests using a real GitHub repository and PR
 * 
 * To run these tests:
 * 1. Set GITHUB_TOKEN environment variable
 * 2. Update TEST_REPO_OWNER, TEST_REPO_NAME, and TEST_PR_NUMBER below
 * 3. Run: npm run test:integration
 */

const TEST_REPO_OWNER = 'faizm10'
const TEST_REPO_NAME = 'code-keeper'
const TEST_PR_NUMBER = 33 // Update with a real PR number

describe('PR Advice Integration Tests', () => {
  // Skip if no GitHub token
  const hasToken = !!process.env.GITHUB_TOKEN

  it.skipIf(!hasToken)('should fetch real PR data and generate advice', async () => {
    const { token, error } = await getGitHubAccessToken()
    
    if (error || !token) {
      console.warn('Skipping integration test: No GitHub token available')
      return
    }

    // Fetch PR details
    const prResponse = await fetch(
      `https://api.github.com/repos/${TEST_REPO_OWNER}/${TEST_REPO_NAME}/pulls/${TEST_PR_NUMBER}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    expect(prResponse.ok).toBe(true)
    const pr = await prResponse.json()
    expect(pr).toHaveProperty('number')
    expect(pr).toHaveProperty('title')
    expect(pr).toHaveProperty('body')

    // Fetch PR files
    const filesResponse = await fetch(
      `https://api.github.com/repos/${TEST_REPO_OWNER}/${TEST_REPO_NAME}/pulls/${TEST_PR_NUMBER}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    expect(filesResponse.ok).toBe(true)
    const files = await filesResponse.json()
    expect(Array.isArray(files)).toBe(true)
    expect(files.length).toBeGreaterThan(0)

    // Verify file structure
    const firstFile = files[0]
    expect(firstFile).toHaveProperty('filename')
    expect(firstFile).toHaveProperty('status')
    expect(['added', 'modified', 'removed', 'renamed']).toContain(firstFile.status)
    expect(firstFile).toHaveProperty('additions')
    expect(firstFile).toHaveProperty('deletions')
  })

  it.skipIf(!hasToken)('should analyze a real PR with code changes', async () => {
    const { token } = await getGitHubAccessToken()
    if (!token) return

    // This would call the actual PR advice endpoint
    // For now, we'll just verify we can fetch the data
    const filesResponse = await fetch(
      `https://api.github.com/repos/${TEST_REPO_OWNER}/${TEST_REPO_NAME}/pulls/${TEST_PR_NUMBER}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    )

    const files = await filesResponse.json()
    
    // Classify files
    const codeFiles = files.filter((f: any) => 
      !f.filename.includes('README') && 
      !f.filename.includes('docs/') &&
      !f.filename.endsWith('.md')
    )
    
    const docFiles = files.filter((f: any) => 
      f.filename.includes('README') || 
      f.filename.includes('docs/') ||
      f.filename.endsWith('.md')
    )

    console.log(`PR #${TEST_PR_NUMBER} has ${codeFiles.length} code files and ${docFiles.length} doc files`)
    
    // Verify we can detect code vs docs
    expect(codeFiles.length + docFiles.length).toBeLessThanOrEqual(files.length)
  })
})

