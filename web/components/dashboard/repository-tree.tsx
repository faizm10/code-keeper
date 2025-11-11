'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, FileText, Folder, Loader2 } from 'lucide-react'

export type RepositoryTreeNode = {
  name: string
  path: string
  type: 'blob' | 'tree'
  size?: number
  children?: RepositoryTreeNode[]
}

type RepositoryTreeProps = {
  nodes: RepositoryTreeNode[]
  repositoryUrl: string
  defaultBranch: string
  onSelectFile?: (node: RepositoryTreeNode) => void
  selectedPath?: string | null
  loadingPath?: string | null
}

export function RepositoryTree({
  nodes,
  repositoryUrl,
  defaultBranch,
  onSelectFile,
  selectedPath,
  loadingPath,
}: RepositoryTreeProps) {
  const initialExpanded = useMemo(() => {
    const topLevelDirectories = nodes
      .filter((node) => node.type === 'tree')
      .map((node) => node.path)
    return topLevelDirectories
  }, [nodes])

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(initialExpanded),
  )

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  useEffect(() => {
    if (!selectedPath) return
    const segments = selectedPath.split('/').slice(0, -1)
    if (segments.length === 0) return
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      segments.forEach((_segment, index) => {
        const path = segments.slice(0, index + 1).join('/')
        next.add(path)
      })
      return next
    })
  }, [selectedPath])

  const renderNodes = (treeNodes: RepositoryTreeNode[], depth = 0) => {
    return treeNodes.map((node) => {
      const isDirectory = node.type === 'tree'
      const isExpanded = isDirectory ? expandedPaths.has(node.path) : false
      const isSelected = !isDirectory && selectedPath === node.path
      const isLoading = !isDirectory && loadingPath === node.path
      const paddingLeft = depth * 1.25

      return (
        <li
          key={node.path}
          className="border-b border-border/60 last:border-none"
          data-type={node.type}
        >
          <div
            className={[
              'flex items-center justify-between px-4 py-2 text-sm font-mono transition-colors',
              isDirectory ? 'text-muted-foreground hover:bg-muted/40' : '',
              isSelected ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/40',
            ].join(' ')}
            style={{ paddingLeft: `${paddingLeft}rem` }}
          >
            <div className="flex items-center gap-2">
              {isDirectory ? (
                <button
                  type="button"
                  onClick={() => togglePath(node.path)}
                  className="flex items-center gap-1 text-foreground hover:text-primary focus:outline-none"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-none" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-none" />
                  )}
                  <Folder className="h-4 w-4 flex-none text-primary" />
                  <span className="font-semibold">{node.name}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectFile?.(node)}
                    className="flex items-center gap-2 text-left text-current hover:text-primary focus:outline-none"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 flex-none animate-spin text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 flex-none text-muted-foreground/70" />
                    )}
                    <span className={isLoading ? 'font-medium text-primary' : undefined}>
                      {node.name}
                    </span>
                  </button>
                </>
              )}
            </div>
            {!isDirectory && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {typeof node.size === 'number' && <span>{node.size} B</span>}
                <Link
                  href={`${repositoryUrl}/blob/${encodeURIComponent(defaultBranch)}/${node.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  View
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
          {isDirectory && node.children && node.children.length > 0 && isExpanded && (
            <ul>{renderNodes(node.children, depth + 1)}</ul>
          )}
          {isDirectory && (!node.children || node.children.length === 0) && isExpanded && (
            <div
              className="px-4 py-2 text-xs italic text-muted-foreground/80"
              style={{ paddingLeft: `${(depth + 1) * 1.25}rem` }}
            >
              (empty)
            </div>
          )}
        </li>
      )
    })
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-muted/30">
      {renderNodes(nodes)}
    </ul>
  )
}


