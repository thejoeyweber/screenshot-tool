/**
 * Storage service
 * Handles local storage operations for screenshots and settings
 */
import type { Screenshot } from '@/types/screenshot'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { StorageConfig, StorageSession, StorageFile, StorageStats } from '@/types/storage'
import { ensureDir, getStorageStats, cleanupExpired } from '@/utils/disk'

// Get absolute path to project root
const PROJECT_ROOT = process.cwd()

// Ensure Windows-compatible paths
const DEFAULT_CONFIG: StorageConfig = {
  basePath: path.resolve(PROJECT_ROOT, 'tmp', 'screenshots'),
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 1024 * 1024 * 1024  // 1GB
}

export class StorageService {
  private config: StorageConfig
  private sessions: Map<string, StorageSession>
  private initialized: boolean = false

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessions = new Map()
    
    console.log('Storage service created')
    console.log('Project root:', PROJECT_ROOT)
    console.log('Base path:', this.config.basePath)
    
    // Ensure directory exists at startup
    this.createStorageDirectory().catch(error => {
      console.error('Failed to create storage directory:', error)
    })
  }

  /**
   * Create storage directory
   */
  private async createStorageDirectory(): Promise<void> {
    try {
      // First check if directory exists
      try {
        await fs.access(this.config.basePath)
        console.log('Storage directory exists at:', this.config.basePath)
      } catch {
        // Directory doesn't exist, create it
        console.log('Creating storage directory at:', this.config.basePath)
        await fs.mkdir(this.config.basePath, { recursive: true })
        console.log('Storage directory created successfully')
      }
    } catch (error) {
      console.error('Error creating storage directory:', error)
      throw error
    }
  }

  /**
   * Initialize storage
   */
  async init(): Promise<void> {
    if (this.initialized) {
      console.log('Storage already initialized')
      return
    }

    console.log('Initializing storage at:', this.config.basePath)
    
    try {
      await this.createStorageDirectory()
      await this.cleanup() // Initial cleanup of expired files
      
      this.initialized = true
      console.log('Storage initialized successfully')
    } catch (error) {
      console.error('Storage initialization failed:', error)
      throw error
    }
  }

  /**
   * Create a new session
   */
  async createSession(): Promise<StorageSession> {
    if (!this.initialized) {
      await this.init()
    }

    const id = crypto.randomBytes(16).toString('hex')
    const now = new Date()
    const sessionPath = path.resolve(this.config.basePath, id)
    
    console.log('Creating new session directory at:', sessionPath)
    
    const session: StorageSession = {
      id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.config.maxAge),
      path: sessionPath
    }

    try {
      await fs.mkdir(sessionPath, { recursive: true })
      this.sessions.set(id, session)
      console.log('Session directory created:', sessionPath)
      return session
    } catch (error) {
      console.error('Failed to create session directory:', error)
      throw error
    }
  }

  /**
   * Save a file to storage
   */
  async saveFile(
    sessionId: string,
    buffer: Buffer,
    metadata?: Record<string, any>
  ): Promise<StorageFile> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const filename = `${Date.now()}.jpg`
    const filePath = path.join(session.path, filename)

    await fs.writeFile(filePath, buffer)
    
    const file: StorageFile = {
      filename,
      path: filePath,
      size: buffer.length,
      createdAt: new Date(),
      expiresAt: session.expiresAt,
      sessionId,
      metadata
    }

    return file
  }

  /**
   * Get a file from storage
   */
  async getFile(sessionId: string, filename: string): Promise<Buffer> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const filePath = path.join(session.path, filename)
    return fs.readFile(filePath)
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(sessionId: string, filename: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const filePath = path.join(session.path, filename)
    await fs.unlink(filePath)
  }

  /**
   * Clean up expired files and sessions
   */
  async cleanup(): Promise<void> {
    await cleanupExpired(this.config.basePath, this.config.maxAge)
    
    // Remove expired sessions from memory
    const now = Date.now()
    for (const [id, session] of this.sessions) {
      if (session.expiresAt.getTime() < now) {
        this.sessions.delete(id)
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    return getStorageStats(this.config.basePath)
  }

  /**
   * Schedule regular cleanup
   */
  scheduleCleanup(interval = 60 * 60 * 1000): NodeJS.Timer { // Default 1 hour
    return setInterval(() => {
      this.cleanup().catch(error => {
        console.error('Cleanup error:', error)
      })
    }, interval)
  }

  /**
   * Get a session by ID
   */
  async getSession(id: string): Promise<StorageSession | null> {
    if (!this.initialized) {
      await this.init()
    }

    const session = this.sessions.get(id)
    if (!session) {
      return null
    }

    // Check if session has expired
    if (session.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(id)
      return null
    }

    return session
  }
} 