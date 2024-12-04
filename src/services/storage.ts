/**
 * Storage service
 * Handles local storage operations for screenshots and settings
 */
import path from 'path'
import crypto from 'crypto'
import fs from 'fs/promises'
import { cleanupExpired, getStorageStats } from '@/utils/disk'
import type { StorageConfig, StorageSession, StorageFile, StorageStats } from '@/types/storage'

const DEFAULT_CONFIG: StorageConfig = {
  basePath: path.join(process.cwd(), 'tmp', 'screenshots'),
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 1024 * 1024 * 1024 // 1GB
}

export class StorageService {
  private static instance: StorageService | null = null;
  private initialized: boolean = false;
  private directoryCache: Map<string, boolean> = new Map();
  private sessions: Map<string, StorageSession> = new Map();
  private config: StorageConfig;

  private constructor() {
    this.config = DEFAULT_CONFIG;
    console.log('Storage service created')
    console.log('Project root:', process.cwd())
    console.log('Base path:', this.config.basePath)
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    // Check cache first
    if (this.directoryCache.get(dirPath)) {
      return;
    }

    try {
      await fs.access(dirPath);
      this.directoryCache.set(dirPath, true);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      this.directoryCache.set(dirPath, true);
    }
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.ensureDirectoryExists(this.config.basePath);
    await this.cleanup(); // Initial cleanup of expired files
    this.initialized = true;
  }

  async createSession(): Promise<StorageSession> {
    if (!this.initialized) {
      await this.init();
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    const sessionPath = path.join(this.config.basePath, sessionId);
    const now = new Date();
    
    const session: StorageSession = {
      id: sessionId,
      path: sessionPath,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.config.maxAge)
    };

    await this.ensureDirectoryExists(sessionPath);
    this.sessions.set(sessionId, session);
    
    return session;
  }

  async saveFile(
    sessionId: string,
    data: Buffer,
    metadata?: Record<string, any>
  ): Promise<StorageFile> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const filename = `${Date.now()}.jpg`;
    const filePath = path.join(session.path, filename);
    
    await fs.writeFile(filePath, data);
    
    return {
      filename,
      path: filePath,
      size: data.length,
      metadata,
      createdAt: new Date(),
      expiresAt: session.expiresAt,
      sessionId
    };
  }

  async getFile(sessionId: string, filename: string): Promise<Buffer> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const filePath = path.join(session.path, filename);
    return fs.readFile(filePath);
  }

  async deleteFile(sessionId: string, filename: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const filePath = path.join(session.path, filename);
    await fs.unlink(filePath);
  }

  async cleanup(): Promise<void> {
    await cleanupExpired(this.config.basePath, this.config.maxAge);
    
    // Remove expired sessions from memory
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.expiresAt.getTime() < now) {
        this.sessions.delete(id);
      }
    }
  }

  async getStats(): Promise<StorageStats> {
    return getStorageStats(this.config.basePath);
  }

  async getSession(id: string): Promise<StorageSession | null> {
    if (!id) {
      return null;
    }

    const session = this.sessions.get(id);
    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(id);
      return null;
    }

    return session;
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance(); 