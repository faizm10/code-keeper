/**
 * Documentation Discovery
 * 
 * Discovers all documentation files in a repository, prioritizing docs/ folder
 * and other .md files over root README.md
 */

type DocumentationFile = {
  path: string
  type: 'docs' | 'documentation' | 'readme' | 'changelog' | 'contributing' | 'api' | 'other'
  priority: number // Lower number = higher priority
  content: string
  size: number
}

type DocumentationDiscoveryResult = {
  files: DocumentationFile[]
  hasPrimaryDocs: boolean // True if docs/ or documentation/ exists
  hasRootReadme: boolean
  totalFiles: number
}

/**
 * Discover all documentation files in a repository
 * Priority: docs/ > documentation/ > other .md files > README.md
 */
export async function discoverDocumentationFiles(
  owner: string,
  repo: string,
  token: string,
  ref: string = 'main'
): Promise<DocumentationDiscoveryResult> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const discoveredFiles: DocumentationFile[] = []
  let hasPrimaryDocs = false
  let hasRootReadme = false

  try {
    // 1. Get repository tree (recursive to get all files)
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
      { headers, cache: 'no-store' }
    )

    if (!treeResponse.ok) {
      throw new Error(`Failed to fetch repository tree: ${treeResponse.statusText}`)
    }

    const treeData = await treeResponse.json()
    const allFiles = treeData.tree || []

    // 2. Filter for documentation files and categorize
    const docFiles: Array<{ path: string; type: string; priority: number }> = []

    for (const file of allFiles) {
      if (file.type !== 'blob') continue

      const path = file.path
      const lowerPath = path.toLowerCase()

      // Priority 1: docs/ directory (PRIMARY)
      if (lowerPath.startsWith('docs/') && lowerPath.endsWith('.md')) {
        docFiles.push({ path, type: 'docs', priority: 1 })
        hasPrimaryDocs = true
      }
      // Priority 2: documentation/ directory
      else if (lowerPath.startsWith('documentation/') && lowerPath.endsWith('.md')) {
        docFiles.push({ path, type: 'documentation', priority: 2 })
        hasPrimaryDocs = true
      }
      // Priority 3: Other .md files in root (not README.md)
      else if (
        !path.includes('/') &&
        lowerPath.endsWith('.md') &&
        !lowerPath.startsWith('readme')
      ) {
        let type: DocumentationFile['type'] = 'other'
        if (lowerPath.includes('changelog')) type = 'changelog'
        else if (lowerPath.includes('contributing')) type = 'contributing'
        else if (lowerPath.includes('api')) type = 'api'
        else if (lowerPath.includes('guide') || lowerPath.includes('tutorial')) type = 'docs'

        docFiles.push({ path, type, priority: 3 })
      }
      // Priority 4: README.md in root (SECONDARY)
      else if (path === 'README.md' || path === 'readme.md') {
        docFiles.push({ path, type: 'readme', priority: 4 })
        hasRootReadme = true
      }
    }

    // 3. Sort by priority (lower number = higher priority)
    docFiles.sort((a, b) => a.priority - b.priority)

    // 4. Fetch content for each file (limit to reasonable size, e.g., 100KB per file)
    for (const docFile of docFiles) {
      try {
        const contentResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${docFile.path}?ref=${ref}`,
          { headers, cache: 'no-store' }
        )

        if (contentResponse.ok) {
          const contentData = await contentResponse.json()
          if (contentData.content && contentData.encoding === 'base64') {
            const content = Buffer.from(contentData.content, 'base64').toString('utf-8')
            const size = content.length

            // Skip files that are too large (over 100KB)
            if (size > 100 * 1024) {
              console.warn(`Skipping large file: ${docFile.path} (${size} bytes)`)
              continue
            }

            discoveredFiles.push({
              path: docFile.path,
              type: docFile.type as DocumentationFile['type'],
              priority: docFile.priority,
              content,
              size,
            })
          }
        }
      } catch (error) {
        console.error(`Failed to fetch content for ${docFile.path}:`, error)
        // Continue with other files even if one fails
      }
    }
  } catch (error) {
    console.error('Error discovering documentation files:', error)
    throw error
  }

  return {
    files: discoveredFiles,
    hasPrimaryDocs,
    hasRootReadme,
    totalFiles: discoveredFiles.length,
  }
}

/**
 * Get the primary documentation file(s) - docs/ folder files take precedence
 */
export function getPrimaryDocumentationFiles(files: DocumentationFile[]): DocumentationFile[] {
  // Filter for docs/ and documentation/ files first
  const primaryFiles = files.filter((f) => f.type === 'docs' || f.type === 'documentation')
  if (primaryFiles.length > 0) {
    return primaryFiles
  }

  // Fallback to other .md files (excluding README)
  const otherFiles = files.filter((f) => f.type !== 'readme' && f.priority < 4)
  if (otherFiles.length > 0) {
    return otherFiles
  }

  // Last resort: README.md
  return files.filter((f) => f.type === 'readme')
}

/**
 * Check if repository has any documentation
 */
export function hasDocumentation(result: DocumentationDiscoveryResult): boolean {
  return result.totalFiles > 0
}

/**
 * Check if repository needs documentation creation
 */
export function needsDocumentation(result: DocumentationDiscoveryResult): boolean {
  return result.totalFiles === 0 || (!result.hasPrimaryDocs && result.hasRootReadme)
}


