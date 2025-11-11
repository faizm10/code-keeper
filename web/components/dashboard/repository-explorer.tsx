'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ExternalLink, GitPullRequest, Loader2, StickyNote } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import '@/styles/prism-coldark-dark.css'

import type { RepositoryTreeNode } from '@/components/dashboard/repository-tree'
import { RepositoryTree } from '@/components/dashboard/repository-tree'
import { Badge } from '@/components/ui/badge'

type FileContentState =
  | { status: 'idle' }
  | { status: 'loading'; path: string }
  | {
      status: 'loaded'
      path: string
      name: string
      content: string
      language: string | null
      htmlUrl: string | null
      size?: number
    }
  | { status: 'error'; path: string; message: string }

type PullRequestSummary = {
  id: number
  number: number
  title: string
  state: string
  draft: boolean
  mergedAt: string | null
  createdAt: string
  updatedAt: string
  htmlUrl: string
  author: {
    login: string
    avatarUrl: string
    profileUrl: string
  }
}

type RepositoryExplorerProps = {
  owner: string
  repo: string
  defaultBranch: string
  repositoryHtmlUrl: string
  treeNodes: RepositoryTreeNode[]
  treeTruncated: boolean
  pullRequests: PullRequestSummary[]
}

function formatBytes(bytes?: number) {
  if (!bytes || Number.isNaN(bytes)) return null
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`
}

export function RepositoryExplorer({
  owner,
  repo,
  defaultBranch,
  repositoryHtmlUrl,
  treeNodes,
  treeTruncated,
  pullRequests,
}: RepositoryExplorerProps) {
  const [fileState, setFileState] = useState<FileContentState>({ status: 'idle' })
  const fetchControllerRef = useRef<AbortController | null>(null)

  const selectedPath = fileState.status === 'idle' ? null : fileState.path
  const loadingPath = fileState.status === 'loading' ? fileState.path : null
  const isLoading = fileState.status === 'loading'

  const handleSelectFile = useCallback(
    async (node: RepositoryTreeNode) => {
      if (node.type !== 'blob') return
      const path = node.path

      fetchControllerRef.current?.abort()
      const abortController = new AbortController()
      fetchControllerRef.current = abortController
      setFileState({ status: 'loading', path })

      try {
        const response = await fetch(
          `/api/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(
            repo,
          )}/content?path=${encodeURIComponent(path)}&ref=${encodeURIComponent(defaultBranch)}`,
          { signal: abortController.signal },
        )

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          const message =
            typeof errorBody?.error === 'string'
              ? errorBody.error
              : 'Failed to load file contents from GitHub.'
          setFileState({ status: 'error', path, message })
          return
        }

        const text = await response.text()
        const fileNameHeader = response.headers.get('X-GitHub-File-Name')
        const fileName = fileNameHeader ? decodeURIComponent(fileNameHeader) : node.name
        const htmlUrlHeader = response.headers.get('X-GitHub-File-Url')
        const sizeHeader = response.headers.get('X-GitHub-File-Size')
        const size = sizeHeader ? Number.parseInt(sizeHeader, 10) : undefined

        const language = detectLanguage(fileName)
        setFileState({
          status: 'loaded',
          path,
          name: fileName,
          content: text,
          language,
          htmlUrl: htmlUrlHeader ? decodeURIComponent(htmlUrlHeader) : null,
          size: Number.isFinite(size) ? size : undefined,
        })
        if (fetchControllerRef.current === abortController) {
          fetchControllerRef.current = null
        }
      } catch (error) {
        if ((error as DOMException).name === 'AbortError' || abortController.signal.aborted) {
          if (fetchControllerRef.current === abortController) {
            fetchControllerRef.current = null
          }
          return
        }
        console.error('Failed to fetch file contents', error)
        setFileState({
          status: 'error',
          path,
          message: 'Unexpected error while loading file contents.',
        })
      }
    },
    [defaultBranch, owner, repo],
  )

  const fileInfo = useMemo(() => {
    if (fileState.status === 'loaded') {
      return {
        name: fileState.name,
        path: fileState.path,
        content: fileState.content,
        language: fileState.language,
        htmlUrl: fileState.htmlUrl,
        size: fileState.size,
      }
    }
    return null
  }, [fileState])

  useEffect(
    () => () => {
      fetchControllerRef.current?.abort()
    },
    [],
  )

  useEffect(() => {
    if (fileInfo?.content) {
      // Delay syntax highlight to next tick to ensure DOM updates
      const timeout = setTimeout(() => Prism.highlightAll(), 0)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [fileInfo?.content, fileInfo?.language])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)]">
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Repository structure</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {treeTruncated ? 'Showing first 200 entries (truncated)' : 'Showing full tree'}
            </span>
          </div>
          <div className="mt-4">
            <RepositoryTree
              nodes={treeNodes}
              repositoryUrl={repositoryHtmlUrl}
              defaultBranch={defaultBranch}
              onSelectFile={handleSelectFile}
              selectedPath={selectedPath}
          loadingPath={loadingPath}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Pull requests</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Latest {Math.min(pullRequests.length, 10)}
            </span>
          </div>
          {pullRequests.length === 0 ? (
            <div className="rounded-md border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              No pull requests found for this repository yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {pullRequests.slice(0, 10).map((pr) => (
                <li key={pr.id} className="rounded-md border border-border bg-background/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      #{pr.number} {pr.title}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {pr.state.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {new Date(pr.createdAt).toLocaleString()} by {pr.author.login}
                    {pr.mergedAt && ` • merged ${new Date(pr.mergedAt).toLocaleString()}`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <Link
                      href={pr.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      View on GitHub
                    </Link>
                    <span className="text-muted-foreground">
                      Updated {new Date(pr.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">File preview</h2>
            {fileInfo && (
              <p className="text-xs text-muted-foreground">
                {fileInfo.path}
                {fileInfo.size ? ` • ${formatBytes(fileInfo.size)}` : ''}
              </p>
            )}
          </div>
          {fileInfo?.htmlUrl && (
            <Link
              href={fileInfo.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open on GitHub
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        <div className="relative px-6 py-4">
          {fileState.status === 'idle' && (
            <div className="flex min-h-[8rem] items-center justify-center text-sm text-muted-foreground">
              Select a file from the tree to preview its contents.
            </div>
          )}
          {fileState.status === 'error' && (
          <div className="flex min-h-[8rem] flex-col items-center justify-center gap-3 text-center text-sm text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{fileState.message}</p>
            </div>
          )}
          {fileState.status === 'loaded' && (
          <div className="overflow-hidden rounded-md border border-border bg-muted/40">
            <pre className="max-h-[60vh] overflow-auto p-4">
                <code
                  className={`language-${fileInfo?.language ?? 'typescript'} block`}
                  style={{ whiteSpace: 'pre' }}
                >
                  {fileInfo?.content}
                </code>
              </pre>
            </div>
          )}
        {fileState.status === 'loading' && (
          <div className="min-h-[8rem] rounded-md border border-dashed border-border/60 bg-muted/20" />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading file contents...</span>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

function detectLanguage(filename: string): string | null {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.ts') || lower.endsWith('.cts') || lower.endsWith('.mts')) {
    return 'typescript'
  }
  if (lower.endsWith('.tsx')) {
    return 'tsx'
  }
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) {
    return 'javascript'
  }
  if (lower.endsWith('.jsx')) {
    return 'jsx'
  }
  return null
}



