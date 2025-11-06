// Shared types and utilities for Codekeeper

export interface Job {
  id: string
  type: 'analyze' | 'docgen' | 'codemod' | 'test'
  repository: string
  branch: string
  commit: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export interface AnalysisResult {
  changes: string[]
  apiSurface: Record<string, unknown>
  affectedFiles: string[]
}

// Add more shared types as needed

