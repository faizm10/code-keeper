import { model } from './config'
import { buildPRAnalysisPrompt } from './prompts'
import { DEFAULT_MAX_FILES, DEFAULT_MAX_PATCH_CHARS, GEMINI_MODEL_CONFIG } from '@/lib/config/gemini'
import { detectRepoZone, RepoZone } from '@/lib/pr/file-classification'

export type PRFileForGemini = {
  path: string
  status: 'added' | 'modified' | 'removed' | 'renamed'
  additions: number
  deletions: number
  changes: number
  patch?: string
}

export type GeminiPRAnalysis = {
  // Legacy fields (for backward compatibility)
  zones?: RepoZone[]
  events?: string[]
  obligations?: string[]
  docsTouched?: boolean
  docFilesTouched?: string[]
  missingDocs?: string[]
  shouldWarn?: boolean
  reasoning?: string
  summary?: string
  comment?: string
  fileSummaries?: Array<{
    path: string
    status?: 'added' | 'modified' | 'removed' | 'renamed'
    changeMagnitude?: 'minor' | 'moderate' | 'significant'
    summary: string
    conciseSummary?: string
  }>
  tone?: string
  confidence?: 'high' | 'medium' | 'low'
  
  // New comprehensive structure
  executiveSummary?: string
  category?: 'feature' | 'refactor' | 'bugfix' | 'performance' | 'security' | 'infrastructure' | 'chore'
  whatChanged?: {
    headline: string
    details: string[]
  }
  technicalApproach?: {
    overview: string
    designPatterns: string[]
    libraries: Array<{
      name: string
      version?: string
      purpose: string
    }>
    architecture?: string
  }
  implementationDetails?: {
    configuration: string[]
    dataFlow: string
    entryPoints: string[]
    integration: string[]
    storage: string[]
  }
  fileBreakdown?: Array<{
    path: string
    purpose: string
    keyComponents: string[]
    complexity: 'low' | 'medium' | 'high' | 'very-high'
    importance: 'low' | 'medium' | 'high' | 'critical'
  }>
  keyInsights?: string[]
  developerImpact?: {
    newAPIs: Array<{
      name: string
      location: string
      usage: string
      description: string
    }>
    breakingChanges?: string[]
    migrationSteps?: string[]
  }
  setupRequirements?: {
    environmentVariables: Array<{
      name: string
      required: boolean
      default?: string
      description: string
    }>
    dependencies?: string[]
    infrastructure?: string[]
    commands?: string[]
  }
  qualityAssessment?: {
    strengths: string[]
    concerns: string[]
    testCoverage: {
      status: 'excellent' | 'good' | 'partial' | 'minimal' | 'none'
      details: string
    }
    security: {
      considerations: string[]
      risks: string[]
    }
  }
  documentation?: {
    docsUpdated: boolean
    quality: 'excellent' | 'good' | 'adequate' | 'poor' | 'missing'
    suggestions: string[]
    inlineComments?: string
  }
  recommendations?: {
    beforeMerge: string[]
    afterMerge: string[]
    teamCommunication: string[]
  }
  prComment?: {
    tone: 'positive' | 'neutral' | 'concerned'
    message: string
  }
  metadata?: {
    confidence: 'high' | 'medium' | 'low'
    complexity: 'low' | 'medium' | 'high' | 'very-high'
    impactScope: 'isolated' | 'moderate' | 'widespread' | 'critical'
    estimatedReviewTime?: string
  }
}

type PromptOptions = {
  prTitle: string
  prNumber: number
  prBody?: string | null
  files: PRFileForGemini[]
  docFilesTouched: string[]
  maxFiles?: number
  maxPatchChars?: number
}

// Constants moved to @/lib/config/gemini

function truncateText(value: string, maxChars: number) {
  if (!value) return ''
  if (value.length <= maxChars) {
    return value
  }
  return `${value.slice(0, maxChars)}\n...truncated (${value.length - maxChars} more chars)`
}

function buildFileContext(
  files: PRFileForGemini[],
  maxFiles: number,
  maxPatchChars: number
) {
  const limited = files.slice(0, maxFiles)
  const omitted = files.length - limited.length

  const entries = limited.map((file) => {
    const zone = detectRepoZone(file.path)
    const trimmedPatch =
      file.patch && !file.patch.includes('Binary file')
        ? truncateText(file.patch, maxPatchChars)
        : ''

    return [
      `File: ${file.path}`,
      `Status: ${file.status}`,
      `Zone: ${zone}`,
      `Summary: +${file.additions} / -${file.deletions}`,
      trimmedPatch ? `Patch:\n${trimmedPatch}` : 'Patch: (omitted or binary)',
    ].join('\n')
  })

  if (omitted > 0) {
    entries.push(
      `...${omitted} more files omitted from detailed context. Their paths are:\n${files
        .slice(limited.length)
        .map((f) => `- ${f.path}`)
        .join('\n')}`
    )
  }

  return entries.join('\n\n')
}

function coalesceResponseText(response: any) {
  const direct = typeof response.text === 'function' ? response.text() : ''
  if (direct && direct.trim()) {
    return direct
  }

  const parts = response?.candidates?.flatMap((candidate: any) =>
    candidate?.content?.parts?.map((part: any) => part?.text).filter(Boolean) ?? []
  )

  const assembled = Array.isArray(parts) ? parts.join('\n') : ''
  if (assembled && assembled.trim()) {
    return assembled
  }

  const raw = response?.candidates ? JSON.stringify(response.candidates) : ''
  return raw
}

function extractJsonResponse(raw: string) {
  const trimmed = raw?.trim?.() ?? ''

  if (!trimmed) {
    throw new Error('Empty response from Gemini')
  }

  // Helper to safely parse JSON with better error handling
  const tryParse = (jsonStr: string, context: string): any => {
    try {
      return JSON.parse(jsonStr)
    } catch (error: any) {
      const errorMsg = error.message || String(error)
      const position = errorMsg.match(/position (\d+)/)?.[1]
      
      // Try to fix common JSON issues
      let fixed = jsonStr
      
      // Try to find and close unclosed strings
      if (errorMsg.includes('Unterminated string')) {
        // Find the last complete object/array before the error
        const errorPos = position ? parseInt(position, 10) : jsonStr.length
        const beforeError = jsonStr.substring(0, errorPos)
        
        // Try to find the last complete JSON object
        let lastBrace = beforeError.lastIndexOf('}')
        let lastBracket = beforeError.lastIndexOf(']')
        const lastComplete = Math.max(lastBrace, lastBracket)
        
        if (lastComplete > 0) {
          // Try parsing just the complete part
          try {
            const partial = jsonStr.substring(0, lastComplete + 1)
            return JSON.parse(partial)
          } catch {
            // If that fails, try to close the JSON structure
            fixed = beforeError
            // Count open braces/brackets
            const openBraces = (fixed.match(/{/g) || []).length
            const closeBraces = (fixed.match(/}/g) || []).length
            const openBrackets = (fixed.match(/\[/g) || []).length
            const closeBrackets = (fixed.match(/\]/g) || []).length
            
            // Close unclosed structures
            fixed += '}'.repeat(Math.max(0, openBraces - closeBraces))
            fixed += ']'.repeat(Math.max(0, openBrackets - closeBrackets))
            
            try {
              return JSON.parse(fixed)
            } catch {
              // If still fails, throw with more context
              throw new Error(
                `JSON parse error in ${context}: ${errorMsg}\n` +
                `Response length: ${jsonStr.length}, Error position: ${position}\n` +
                `First 500 chars: ${jsonStr.substring(0, 500)}\n` +
                `Around error: ${jsonStr.substring(Math.max(0, (parseInt(position || '0', 10) - 100)), parseInt(position || '0', 10) + 100)}`
              )
            }
          }
        }
      }
      
      // If we can't fix it, throw with context
      throw new Error(
        `JSON parse error in ${context}: ${errorMsg}\n` +
        `Response length: ${jsonStr.length}${position ? `, Error position: ${position}` : ''}\n` +
        `First 500 chars: ${jsonStr.substring(0, 500)}`
      )
    }
  }

  // Try parsing as direct JSON first
  if (trimmed.startsWith('{')) {
    return tryParse(trimmed, 'direct JSON')
  }

  // Try extracting from code fences
  const fenced = trimmed.match(/```json([\s\S]*?)```/i)
  if (fenced && fenced[1]) {
    return tryParse(fenced[1].trim(), 'fenced JSON block')
  }

  const fallback = trimmed.match(/```([\s\S]*?)```/i)
  if (fallback && fallback[1]) {
    return tryParse(fallback[1].trim(), 'fenced code block')
  }

  // Try to find JSON object in the text
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (jsonMatch && jsonMatch[0]) {
    return tryParse(jsonMatch[0], 'extracted JSON object')
  }

  // Last resort: try parsing the whole thing
  return tryParse(trimmed, 'full response')
}

export async function analyzePullRequestWithGemini(
  options: PromptOptions
): Promise<GeminiPRAnalysis> {
  const {
    prTitle,
    prNumber,
    prBody = '',
    files,
    docFilesTouched,
    maxFiles = DEFAULT_MAX_FILES,
    maxPatchChars = DEFAULT_MAX_PATCH_CHARS,
  } = options

  if (!files.length) {
    throw new Error('No files provided for Gemini analysis')
  }

  const filesContext = buildFileContext(files, maxFiles, maxPatchChars)

  const prompt = buildPRAnalysisPrompt({
    prTitle,
    prNumber,
    docFilesTouched,
    files: files.map((file) => ({
      path: file.path,
      status: file.status,
    })),
    filesContext,
  })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: GEMINI_MODEL_CONFIG,
  })

  const response = await result.response
  const text = coalesceResponseText(response)
  const parsed = extractJsonResponse(text) as Partial<GeminiPRAnalysis>

  return {
    // Legacy fields (for backward compatibility)
    zones: parsed.zones ?? [],
    events: parsed.events ?? [],
    obligations: parsed.obligations ?? [],
    docsTouched: parsed.docsTouched ?? false,
    docFilesTouched: parsed.docFilesTouched ?? docFilesTouched,
    missingDocs: parsed.missingDocs ?? [],
    shouldWarn: parsed.shouldWarn ?? false,
    reasoning: parsed.reasoning ?? '',
    summary: parsed.summary ?? '',
    comment: parsed.comment ?? '',
    fileSummaries: parsed.fileSummaries ?? [],
    tone: parsed.tone,
    confidence: parsed.confidence,
    // New comprehensive structure
    executiveSummary: parsed.executiveSummary,
    category: parsed.category,
    whatChanged: parsed.whatChanged,
    technicalApproach: parsed.technicalApproach,
    implementationDetails: parsed.implementationDetails,
    fileBreakdown: parsed.fileBreakdown,
    keyInsights: parsed.keyInsights,
    developerImpact: parsed.developerImpact,
    setupRequirements: parsed.setupRequirements,
    qualityAssessment: parsed.qualityAssessment,
    documentation: parsed.documentation,
    recommendations: parsed.recommendations,
    prComment: parsed.prComment,
    metadata: parsed.metadata,
  }
}


