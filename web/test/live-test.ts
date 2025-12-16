#!/usr/bin/env tsx
/**
 * Live Testing Tool
 * 
 * Interactive tool to test README generator and PR advice with real GitHub PRs
 * 
 * Usage:
 *   npm run test:live
 *   or
 *   tsx test/live-test.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createInterface } from 'readline'
import { analyzePullRequestWithGemini } from '@/lib/gemini/pr-advice'
import { generateCompleteReadme } from '@/lib/gemini/readme-generator'
import { generateReadmeSuggestions } from '@/lib/gemini/readme-suggestions'
import { classifyFile } from '@/lib/pr/file-classification'

// Load environment variables from .env files
// Try .env.local first (highest priority), then .env
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
]

for (const envPath of envPaths) {
  config({ path: envPath })
}

type GitHubPRFile = {
  filename: string
  status: 'added' | 'modified' | 'removed' | 'renamed'
  additions: number
  deletions: number
  changes: number
  patch?: string
}

type GitHubPR = {
  number: number
  title: string
  state: string
  body?: string | null
  base: {
    sha: string
    ref: string
  }
  head: {
    sha: string
    ref: string
  }
  user: {
    login: string
  }
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function fetchPRData(owner: string, repo: string, prNumber: number, token: string) {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // First, verify the repository exists
  console.log(`\n📡 Verifying repository ${owner}/${repo}...`)
  const repoResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers, cache: 'no-store' }
  )

  if (!repoResponse.ok) {
    if (repoResponse.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found. Please check:\n   - Repository name is correct\n   - Repository exists and is accessible\n   - Your token has access to this repository`)
    } else if (repoResponse.status === 403) {
      throw new Error(`Access denied to ${owner}/${repo}. Your token may not have permission to access this repository.`)
    } else {
      throw new Error(`Failed to access repository: ${repoResponse.status} ${repoResponse.statusText}`)
    }
  }

  const repoData = await repoResponse.json()
  console.log(`✅ Repository found: ${repoData.full_name} (${repoData.private ? 'private' : 'public'})`)

  // Fetch PR details
  console.log(`📡 Fetching PR #${prNumber}...`)
  const prResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    { headers, cache: 'no-store' }
  )

  if (!prResponse.ok) {
    if (prResponse.status === 404) {
      const errorBody = await prResponse.text()
      throw new Error(`PR #${prNumber} not found in ${owner}/${repo}.\n   Please check:\n   - PR number is correct\n   - PR exists in this repository\n   - PR is not in a different repository`)
    } else if (prResponse.status === 403) {
      throw new Error(`Access denied to PR #${prNumber}. Your token may not have permission.`)
    } else {
      const errorBody = await prResponse.text().catch(() => '')
      throw new Error(`Failed to fetch PR: ${prResponse.status} ${prResponse.statusText}${errorBody ? `\n   ${errorBody.substring(0, 200)}` : ''}`)
    }
  }

  const pr = (await prResponse.json()) as GitHubPR
  console.log(`✅ PR fetched: "${pr.title}"`)

  // Fetch PR files
  console.log(`📡 Fetching PR files...`)
  const filesResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    { headers, cache: 'no-store' }
  )

  if (!filesResponse.ok) {
    throw new Error(`Failed to fetch PR files: ${filesResponse.status}`)
  }

  const files = (await filesResponse.json()) as GitHubPRFile[]
  console.log(`✅ Found ${files.length} changed files\n`)

  return { pr, files }
}

async function analyzePR(pr: GitHubPR, files: GitHubPRFile[]) {
  console.log('🔍 Analyzing PR with Gemini AI...\n')
  
  const filesForGemini = files.map((file) => ({
    path: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch,
  }))

  const docFiles = files
    .filter((file) => classifyFile(file.filename) === 'docs')
    .map((file) => file.filename)

  try {
    const analysis = await analyzePullRequestWithGemini({
      prTitle: pr.title,
      prNumber: pr.number,
      prBody: pr.body ?? '',
      files: filesForGemini,
      docFilesTouched: docFiles,
    })

    return analysis
  } catch (error: any) {
    console.error('❌ Error analyzing PR:', error?.message || error)
    if (error?.message?.includes('JSON parse error')) {
      console.log('\n💡 This might be due to:')
      console.log('   - Large PR with many files (try a smaller PR)')
      console.log('   - Malformed JSON response from Gemini')
      console.log('   - Response was truncated')
      console.log('   The system will continue with partial analysis if possible.\n')
    }
    return null
  }
}

async function generateDocumentation(
  owner: string,
  repo: string,
  pr: GitHubPR,
  files: GitHubPRFile[],
  analysis: any,
  token: string
) {
  console.log('📝 Generating documentation suggestions...\n')

  // Prepare code changes
  const codeChanges = files.map((file) => ({
    path: file.filename,
    status: file.status as 'added' | 'modified' | 'removed',
    summary: `${file.status}: ${file.filename} (+${file.additions} -${file.deletions})`,
    additions: file.additions,
    deletions: file.deletions,
  }))

  try {
    // Try to fetch current README
    let currentReadme: string | undefined
    try {
      const readmeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      )
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json()
        if (readmeData.content) {
          currentReadme = Buffer.from(readmeData.content, 'base64').toString('utf-8')
        }
      }
    } catch (error) {
      // README might not exist, that's okay
      console.log('   (No existing README found)')
    }

    // Generate README suggestions
    const suggestions = await generateReadmeSuggestions({
      prTitle: pr.title,
      prNumber: pr.number,
      codeChanges,
      currentReadme,
      detectedEvents: analysis?.events || [],
      missingDocs: analysis?.missingDocs || [],
    })

    return suggestions
  } catch (error) {
    console.error('❌ Error generating suggestions:', error)
    return null
  }
}

function displayResults(pr: GitHubPR, files: GitHubPRFile[], analysis: any, suggestions: any) {
  console.log('\n' + '='.repeat(80))
  console.log('📊 ANALYSIS RESULTS')
  console.log('='.repeat(80) + '\n')

  // PR Summary
  console.log('📋 PR Summary:')
  console.log(`   Title: ${pr.title}`)
  console.log(`   Number: #${pr.number}`)
  console.log(`   State: ${pr.state}`)
  console.log(`   Author: ${pr.user.login}`)
  console.log(`   Files Changed: ${files.length}`)
  console.log(`   Total Changes: +${files.reduce((sum, f) => sum + f.additions, 0)} -${files.reduce((sum, f) => sum + f.deletions, 0)}`)
  console.log()

  // File Classification
  const codeFiles = files.filter(f => classifyFile(f.filename) === 'code')
  const docFiles = files.filter(f => classifyFile(f.filename) === 'docs')
  const configFiles = files.filter(f => classifyFile(f.filename) === 'other')
  
  console.log('📁 File Classification:')
  console.log(`   Code Files: ${codeFiles.length}`)
  console.log(`   Doc Files: ${docFiles.length}`)
  console.log(`   Config Files: ${configFiles.length}`)
  console.log()

  // Gemini Analysis
  if (analysis) {
    console.log('🤖 Gemini AI Analysis:')
    console.log(`   Zones: ${analysis.zones?.join(', ') || 'None'}`)
    console.log(`   Events: ${analysis.events?.join(', ') || 'None'}`)
    console.log(`   Missing Docs: ${analysis.missingDocs?.join(', ') || 'None'}`)
    console.log(`   Should Warn: ${analysis.shouldWarn ? 'Yes' : 'No'}`)
    console.log(`   Confidence: ${analysis.confidence || 'Unknown'}`)
    if (analysis.reasoning) {
      console.log(`   Reasoning: ${analysis.reasoning}`)
    }
    console.log()
  }

  // README Suggestions
  if (suggestions) {
    console.log('📝 README Suggestions:')
    console.log(`   Total Suggestions: ${suggestions.suggestions?.length || 0}`)
    console.log(`   Confidence: ${suggestions.confidence || 'Unknown'}`)
    if (suggestions.summary) {
      console.log(`   Summary: ${suggestions.summary}`)
    }
    console.log()

    if (suggestions.suggestions && suggestions.suggestions.length > 0) {
      console.log('   Suggestions by Section:')
      suggestions.suggestions.forEach((s: any, i: number) => {
        console.log(`   ${i + 1}. ${s.section} (${s.priority} priority)`)
        console.log(`      Reason: ${s.reason}`)
        console.log(`      Preview: ${s.suggestedContent.substring(0, 100)}...`)
        console.log()
      })
    }
  }

  // Generated README Preview
  if (suggestions?.suggestions) {
    console.log('📄 Generated README Preview:')
    console.log('-'.repeat(80))
    const readmeResult = generateCompleteReadme({
      currentReadme: undefined,
      suggestions: suggestions.suggestions,
      prTitle: pr.title,
      prNumber: pr.number,
    })
    console.log(readmeResult.content.substring(0, 1000))
    if (readmeResult.content.length > 1000) {
      console.log('\n... (truncated)')
    }
    console.log('-'.repeat(80))
  }

  console.log('\n' + '='.repeat(80) + '\n')
}

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 Code Keeper Live Testing Tool')
  console.log('='.repeat(80) + '\n')

  try {
    // Get GitHub token - try .env file first, then environment variable, then prompt
    let token: string | null = null
    
    // Check for token in .env file or environment variable
    // Try common variable names
    token = process.env.GITHUB_TOKEN || 
            process.env.GH_TOKEN || 
            process.env.GITHUB_ACCESS_TOKEN ||
            process.env.GH_ACCESS_TOKEN ||
            null
    
    if (token) {
      const source = process.env.GITHUB_TOKEN ? '.env file or GITHUB_TOKEN variable' :
                     process.env.GH_TOKEN ? '.env file or GH_TOKEN variable' :
                     process.env.GITHUB_ACCESS_TOKEN ? '.env file or GITHUB_ACCESS_TOKEN variable' :
                     '.env file or GH_ACCESS_TOKEN variable'
      console.log(`✅ Using GitHub token from ${source}\n`)
    } else {
      console.log('🔑 GitHub authentication required')
      console.log('   Note: This tool needs a GitHub Personal Access Token')
      console.log('   You can:')
      console.log('   1. Add GITHUB_TOKEN to your .env or .env.local file')
      console.log('   2. Set environment variable: export GITHUB_TOKEN=your-token')
      console.log('   3. Enter token when prompted below')
      console.log('   4. Create token at: https://github.com/settings/tokens\n')
      
      // Prompt for token
      const tokenInput = await question('Enter GitHub Personal Access Token: ')
      
      if (tokenInput.trim()) {
        token = tokenInput.trim()
        console.log('✅ Using provided GitHub token\n')
      } else {
        console.error('❌ No GitHub token provided')
        console.log('\n💡 To create a GitHub token:')
        console.log('   1. Go to https://github.com/settings/tokens')
        console.log('   2. Click "Generate new token (classic)"')
        console.log('   3. Select scopes: repo (for private repos) or public_repo (for public repos)')
        console.log('   4. Copy the token and add to .env file:')
        console.log('      GITHUB_TOKEN=your-token-here')
        console.log('   Or set as environment variable: export GITHUB_TOKEN=your-token')
        process.exit(1)
      }
    }
    
    if (!token) {
      console.error('❌ No GitHub token available')
      process.exit(1)
    }

    // Get repository info
    const repoInput = await question('Enter repository (owner/repo): ')
    const [owner, repo] = repoInput.split('/').map(s => s.trim())
    
    if (!owner || !repo) {
      console.error('❌ Invalid repository format. Use: owner/repo')
      console.log('   Example: faizm10/code-keeper')
      process.exit(1)
    }

    // Remove .git suffix if present
    const cleanRepo = repo.replace(/\.git$/, '')

    // Get PR number
    const prNumberInput = await question('Enter PR number: ')
    const prNumber = parseInt(prNumberInput, 10)
    
    if (isNaN(prNumber) || prNumber <= 0) {
      console.error('❌ Invalid PR number')
      process.exit(1)
    }

    // Ask what to test
    console.log('\nWhat would you like to test?')
    console.log('1. PR Advice Analysis')
    console.log('2. README Generation')
    console.log('3. Both (Full Analysis)')
    const testChoice = await question('\nEnter choice (1-3, default: 3): ') || '3'

    // Fetch PR data
    const { pr, files } = await fetchPRData(owner, cleanRepo, prNumber, token)

    // Run analysis based on choice
    let analysis = null
    let suggestions = null

    if (testChoice === '1' || testChoice === '3') {
      analysis = await analyzePR(pr, files)
    }

    if (testChoice === '2' || testChoice === '3') {
      suggestions = await generateDocumentation(owner, repo, pr, files, analysis, token)
    }

    // Display results
    displayResults(pr, files, analysis, suggestions)

    // Ask if user wants to test another PR
    const again = await question('\nTest another PR? (y/n): ')
    if (again.toLowerCase() === 'y' || again.toLowerCase() === 'yes') {
      rl.close()
      main()
    } else {
      console.log('\n👋 Thanks for testing!')
      rl.close()
      process.exit(0)
    }
  } catch (error) {
    console.error('\n❌ Error:', error)
    rl.close()
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { main }

