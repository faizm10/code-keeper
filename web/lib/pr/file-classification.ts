type BasicClassification = 'code' | 'docs' | 'other'
export type RepoZone = 'code' | 'docs' | 'infra' | 'db' | 'ci' | 'config' | 'other'

const CODE_PATTERNS = [
  /^src\//,
  /^app\//,
  /^lib\//,
  /^server\//,
  /^components\//,
  /^pages\//,
]

const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',
  '.go', '.py', '.java', '.cpp', '.c',
  '.rs', '.rb', '.php', '.swift', '.kt',
]

const DOC_PATTERNS = [/^docs\//, /^documentation\//]

const INFRA_PATTERNS = [
  /^docker\//,
  /^infra\//,
  /^k8s\//,
  /^helm\//,
  /^terraform\//,
  /^pulumi\//,
  /^ops\//,
]

const DB_PATTERNS = [
  /^prisma\//,
  /^migrations\//,
  /^db\//,
  /^sql\//,
  /^supabase\//,
  /^drizzle\//,
]

const CI_PATTERNS = [
  /^\.github\//,
  /^\.gitlab\//,
  /^\.circleci\//,
  /^\.azure-pipelines\//,
  /^\.buildkite\//,
  /^\.github\/workflows\//,
  /^\.gitlab-ci\.yml$/,
]

const CONFIG_PATTERNS = [/^config\//, /^settings\//]

function toLower(filename: string) {
  return filename.toLowerCase()
}

export function shouldIgnoreFile(filename: string): boolean {
  const lower = toLower(filename)

  if (
    filename.includes('__tests__/') ||
    filename.includes('/__tests__/') ||
    filename.includes('/test/') ||
    filename.includes('/tests/') ||
    lower.endsWith('.test.ts') ||
    lower.endsWith('.test.tsx') ||
    lower.endsWith('.test.js') ||
    lower.endsWith('.test.jsx') ||
    lower.endsWith('.spec.ts') ||
    lower.endsWith('.spec.tsx') ||
    lower.endsWith('.spec.js') ||
    lower.endsWith('.spec.jsx')
  ) {
    return true
  }

  if (
    lower.endsWith('.stories.tsx') ||
    lower.endsWith('.stories.ts') ||
    lower.endsWith('.stories.jsx') ||
    lower.endsWith('.stories.js') ||
    filename.includes('.story.')
  ) {
    return true
  }

  if (
    filename.includes('/generated/') ||
    filename.includes('/.generated/') ||
    filename.startsWith('generated/') ||
    filename.includes('/node_modules/') ||
    filename.includes('/dist/') ||
    filename.includes('/build/') ||
    filename.includes('/.next/')
  ) {
    return true
  }

  return false
}

export function classifyFile(filename: string): BasicClassification {
  if (shouldIgnoreFile(filename)) {
    return 'other'
  }

  const lower = toLower(filename)

  const isCodePath = CODE_PATTERNS.some((pattern) => pattern.test(filename))
  const isCodeExtension = CODE_EXTENSIONS.some((ext) => lower.endsWith(ext))

  if (isCodePath || isCodeExtension) {
    return 'code'
  }

  const isDocPath = DOC_PATTERNS.some((pattern) => pattern.test(filename))
  const isMarkdown = lower.endsWith('.md')
  const isDocFile =
    lower === 'readme.md' ||
    lower === 'changelog.md' ||
    lower.startsWith('readme') ||
    lower.startsWith('changelog')

  if (isDocPath || (isMarkdown && isDocFile) || isMarkdown) {
    return 'docs'
  }

  return 'other'
}

export function detectRepoZone(filename: string): RepoZone {
  if (shouldIgnoreFile(filename)) {
    return 'other'
  }

  const lower = toLower(filename)
  const basic = classifyFile(filename)

  if (basic === 'docs') {
    return 'docs'
  }

  if (basic === 'code') {
    return 'code'
  }

  if (
    lower.includes('dockerfile') ||
    lower.includes('docker-compose') ||
    INFRA_PATTERNS.some((pattern) => pattern.test(filename)) ||
    lower.endsWith('.tf') ||
    lower.endsWith('.tfvars') ||
    lower.endsWith('.helm') ||
    lower.endsWith('.yaml') ||
    lower.endsWith('.yml')
  ) {
    if (
      lower.includes('.github/workflows') ||
      lower.includes('.gitlab') ||
      lower.includes('workflow') ||
      lower.includes('pipelines')
    ) {
      return 'ci'
    }

    if (
      lower.includes('k8s') ||
      lower.includes('helm') ||
      lower.includes('terraform') ||
      lower.includes('pulumi') ||
      lower.includes('infra') ||
      lower.includes('docker')
    ) {
      return 'infra'
    }
  }

  if (DB_PATTERNS.some((pattern) => pattern.test(filename)) || lower.includes('schema.prisma')) {
    return 'db'
  }

  if (
    CI_PATTERNS.some((pattern) => pattern.test(filename)) ||
    lower.endsWith('.gitlab-ci.yml') ||
    lower.includes('/workflows/')
  ) {
    return 'ci'
  }

  if (
    lower.endsWith('.env.example') ||
    lower.endsWith('.env.sample') ||
    lower.endsWith('.env.template') ||
    CONFIG_PATTERNS.some((pattern) => pattern.test(filename))
  ) {
    return 'config'
  }

  return 'other'
}


