import { CODEKEEPER_PROMPT, model } from './config'
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
    summary: string
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

const DEFAULT_MAX_FILES = 18
const DEFAULT_MAX_PATCH_CHARS = 2000

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
  const docList = docFilesTouched.length
    ? docFilesTouched.map((doc) => `- ${doc}`).join('\n')
    : '- None'

  const prompt = `
${CODEKEEPER_PROMPT}

You are reviewing a GitHub pull request to detect documentation-impacting events across these zones:
1. Code (\`src/**\`, \`app/**\`, \`lib/**\`, etc.)
2. Docs (\`README.md\`, \`docs/**\`, \`*.md\`, \`CHANGELOG.md\`)
3. Infra / Runtime (Dockerfile, docker-compose.yml, \`k8s/**\`, \`helm/**\`, \`infra/**\`, \`terraform/**\`, \`pulumi/**\`, \`config/*.yml\`)
4. DB / Data (\`prisma/schema.prisma\`, \`migrations/**\`, \`db/**\`, \`sql/**\`, \`supabase/**\`, \`drizzle/**\`)
5. CI / Automation (\`.github/workflows/**\`, \`.gitlab-ci.yml\`, other CI configs)

For each pull request you must:
1. Identify the zones touched.
2. Detect notable events (e.g., NewEndpoint, NewPublicFunction, DbSchemaChanged, NewMigrationFile, DockerfileChanged, DockerComposeChanged, NewEnvVar, WorkflowChanged).
3. Map each event to the documentation areas that usually need updates (API docs, DB/schema docs, setup/env docs, changelog, infra docs, runbooks, etc.).
4. Decide if documentation already covers the change by looking at the doc files that changed.
5. Decide if Code Keeper should leave a reminder (meaningful events happened but matching docs were not updated). If docs are already updated, respond positively instead of warning.
6. Craft a concise, friendly Markdown comment tailored to this PR and repo. Reference specific events and files, call out missing docs, or praise the author. Keep it actionable and avoid boilerplate.
7. **MANDATORY:** For every file listed below (added/modified/renamed), write a single-sentence summary of what changed. Populate \`fileSummaries\` with **exactly the same number of entries as there are files**. Include those sentences verbatim in the final comment (for example, under a "File snapshots" heading). If a patch is truncated/binary or lacks context, clearly state that.

Return JSON with this shape:
{
  "zones": string[],           // zones touched (code, docs, infra, db, ci, config)
  "events": string[],          // detected event names
  "obligations": string[],     // doc areas that should be updated
  "docsTouched": boolean,      // true if relevant docs were edited
  "docFilesTouched": string[], // subset of doc files that changed
  "missingDocs": string[],     // doc areas still missing
  "shouldWarn": boolean,       // true if Code Keeper should flag missing docs
  "summary": string,           // 1-2 sentence summary for the PR comment
  "reasoning": string,         // short explanation of your decision
  "tone": string,              // short description of the tone you used
  "comment": string,           // full Markdown comment, no code fences, do NOT include the comment marker
  "fileSummaries": [
    { "path": string, "status": "added"|"modified"|"removed"|"renamed", "summary": string }
  ],
  "confidence": "high" | "medium" | "low"
}

Always fill every field. Use the event names described above when possible.

PR Title: ${prTitle}
PR Number: ${prNumber}
Doc files touched:
${docList}

All changed files (must summarize each one):
${files.map((file) => `- ${file.status.toUpperCase()}: ${file.path}`).join('\n')}

Files changed:
${filesContext}
`

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.15,
      topK: 32,
      topP: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
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


