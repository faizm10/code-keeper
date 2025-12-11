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
  zones: RepoZone[]
  events: string[]
  obligations: string[]
  docsTouched: boolean
  docFilesTouched: string[]
  missingDocs: string[]
  shouldWarn: boolean
  reasoning: string
  summary: string
  comment: string
  fileSummaries: Array<{
    path: string
    status?: 'added' | 'modified' | 'removed' | 'renamed'
    changeMagnitude?: 'minor' | 'moderate' | 'significant'
    summary: string
    conciseSummary?: string
  }>
  tone?: string
  confidence?: 'high' | 'medium' | 'low'
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

  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed)
  }

  const fenced = trimmed.match(/```json([\s\S]*?)```/i)
  if (fenced && fenced[1]) {
    return JSON.parse(fenced[1])
  }

  const fallback = trimmed.match(/```([\s\S]*?)```/i)
  if (fallback && fallback[1]) {
    return JSON.parse(fallback[1])
  }

  return JSON.parse(trimmed)
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
  }
}


