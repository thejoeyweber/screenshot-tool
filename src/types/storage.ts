export interface StorageMetadata {
  title?: string
  description?: string
  contentType?: string
  dimensions?: {
    width: number
    height: number
  }
  [key: string]: unknown
}

export interface StorageConfig {
  basePath: string
  maxAge: number  // in milliseconds
  maxSize: number // in bytes
}

export interface StorageSession {
  id: string
  createdAt: Date
  expiresAt: Date
  path: string
}

export interface StorageFile {
  filename: string
  path: string
  size: number
  createdAt: Date
  expiresAt: Date
  sessionId: string
  metadata?: StorageMetadata
}

export interface StorageStats {
  totalSize: number
  fileCount: number
  sessionCount: number
  oldestFile?: Date
  newestFile?: Date
} 