import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export type DocMetadata = {
  title: string
  description: string
}

export type DocContent = {
  metadata: DocMetadata
  content: string
  slug: string
}

const docsDirectory = path.join(process.cwd(), 'content/docs')

/**
 * Extract headings from markdown content for scroll spy
 */
export function extractHeadings(content: string): Array<{ id: string; title: string; level: number }> {
  // Match markdown headings (## Title format)
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: Array<{ id: string; title: string; level: number }> = []
  
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const title = match[2].trim()
    // Generate a URL-friendly ID from the title
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    headings.push({ id, title, level })
  }
  
  return headings
}

/**
 * Generate an ID from a heading title
 */
export function generateHeadingId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Get a single doc by slug
 */
export function getDocBySlug(slug: string): DocContent | null {
  try {
    const fullPath = path.join(docsDirectory, `${slug === 'index' ? 'index' : slug}.md`)
    
    if (!fs.existsSync(fullPath)) {
      return null
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    
    return {
      slug,
      metadata: {
        title: data.title || 'Documentation',
        description: data.description || '',
      },
      content,
    }
  } catch (error) {
    console.error(`Error reading doc ${slug}:`, error)
    return null
  }
}

/**
 * Get all available doc slugs
 */
export function getAllDocSlugs(): string[] {
  try {
    const files = fs.readdirSync(docsDirectory)
    return files
      .filter((file) => file.endsWith('.md'))
      .map((file) => file.replace(/\.md$/, ''))
      .map((slug) => (slug === 'index' ? '' : slug))
  } catch (error) {
    console.error('Error reading docs directory:', error)
    return []
  }
}

