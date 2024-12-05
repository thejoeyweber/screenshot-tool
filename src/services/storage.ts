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
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = DEFAULT_CONFIG;
    console.log('Storage service created')
    console.log('Project root:', process.cwd())
    console.log('Base path:', this.config.basePath)
    console.log('Session max age:', this.formatDuration(this.config.maxAge))
    
    // Start periodic cleanup
    this.startCleanupInterval();
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    if (minutes > 0) return `${minutes} minutes`;
    return `${seconds} seconds`;
  }

  private startCleanupInterval(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch(console.error);
    }, 60 * 60 * 1000);
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
    
    // Load existing sessions from disk
    try {
      const sessionDirs = await fs.readdir(this.config.basePath);
      for (const sessionId of sessionDirs) {
        const sessionPath = path.join(this.config.basePath, sessionId);
        const stats = await fs.stat(sessionPath);
        
        if (stats.isDirectory()) {
          // Calculate expiration based on creation time and max age
          const createdAt = stats.birthtime;
          const expiresAt = new Date(createdAt.getTime() + this.config.maxAge);
          
          // Only add if not expired
          if (expiresAt.getTime() > Date.now()) {
            this.sessions.set(sessionId, {
              id: sessionId,
              path: sessionPath,
              createdAt,
              expiresAt
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing sessions:', error);
    }

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
    if (!this.initialized) {
      await this.init();
    }

    console.log('Getting file:', { sessionId, filename });
    console.log('Available sessions:', Array.from(this.sessions.keys()));
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.log('Session not found in memory:', sessionId);
      // Check if directory exists anyway
      const sessionPath = path.join(this.config.basePath, sessionId);
      try {
        const stats = await fs.stat(sessionPath);
        if (stats.isDirectory()) {
          console.log('Session directory exists but not in memory, recreating session');
          const createdAt = stats.birthtime;
          const expiresAt = new Date(createdAt.getTime() + this.config.maxAge);
          
          const recreatedSession = {
            id: sessionId,
            path: sessionPath,
            createdAt,
            expiresAt
          };
          this.sessions.set(sessionId, recreatedSession);
          
          // Now try to get the file
          const filePath = path.join(sessionPath, filename);
          return fs.readFile(filePath);
        }
      } catch (error) {
        console.error('Error checking session directory:', error);
      }
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
    console.log('Running storage cleanup...');
    const now = Date.now();
    let cleanedCount = 0;
    let expiredCount = 0;

    // Remove expired sessions from memory and disk
    for (const [id, session] of this.sessions) {
      if (session.expiresAt.getTime() < now) {
        try {
          await fs.rm(session.path, { recursive: true, force: true });
          this.sessions.delete(id);
          cleanedCount++;
        } catch (error) {
          console.error(`Error cleaning up session ${id}:`, error);
        }
        expiredCount++;
      }
    }

    // Clean up orphaned directories
    try {
      const dirs = await fs.readdir(this.config.basePath);
      for (const dir of dirs) {
        const dirPath = path.join(this.config.basePath, dir);
        const stats = await fs.stat(dirPath);
        
        if (stats.isDirectory() && !this.sessions.has(dir)) {
          const age = now - stats.birthtime.getTime();
          if (age > this.config.maxAge) {
            await fs.rm(dirPath, { recursive: true, force: true });
            cleanedCount++;
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning orphaned directories:', error);
    }

    console.log(`Cleanup complete: ${expiredCount} sessions expired, ${cleanedCount} directories removed`);
    console.log(`Active sessions: ${this.sessions.size}`);
  }

  async getStats(): Promise<StorageStats> {
    return getStorageStats(this.config.basePath);
  }

  async getSession(sessionId: string): Promise<StorageSession | null> {
    if (!this.initialized) {
      await this.init();
    }

    console.log('Getting session:', sessionId);
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      console.log('Session not found in memory, checking filesystem...');
      const sessionPath = path.join(this.config.basePath, sessionId);
      
      try {
        const stats = await fs.stat(sessionPath);
        if (stats.isDirectory()) {
          console.log('Found session directory, recreating session object');
          const createdAt = stats.birthtime;
          const expiresAt = new Date(createdAt.getTime() + this.config.maxAge);
          
          session = {
            id: sessionId,
            path: sessionPath,
            createdAt,
            expiresAt
          };
          
          // Add to memory cache
          this.sessions.set(sessionId, session);
          return session;
        }
      } catch (error) {
        // Directory doesn't exist, create it
        console.log('Session directory not found, creating new session');
        try {
          await this.ensureDirectoryExists(sessionPath);
          const now = new Date();
          session = {
            id: sessionId,
            path: sessionPath,
            createdAt: now,
            expiresAt: new Date(now.getTime() + this.config.maxAge)
          };
          this.sessions.set(sessionId, session);
          return session;
        } catch (createError) {
          console.error('Error creating session directory:', createError);
          return null;
        }
      }
    }

    // Convert undefined to null to match return type
    return session || null;
  }

  async getSessionFiles(sessionId: string): Promise<StorageFile[]> {
    if (!this.initialized) {
      await this.init();
    }

    console.log('Getting files for session:', sessionId);
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.log('Session not found in memory:', sessionId);
      // Check if directory exists anyway
      const sessionPath = path.join(this.config.basePath, sessionId);
      try {
        const stats = await fs.stat(sessionPath);
        if (stats.isDirectory()) {
          console.log('Session directory exists but not in memory, recreating session');
          const createdAt = stats.birthtime;
          const expiresAt = new Date(createdAt.getTime() + this.config.maxAge);
          
          const recreatedSession = {
            id: sessionId,
            path: sessionPath,
            createdAt,
            expiresAt
          };
          this.sessions.set(sessionId, recreatedSession);
          
          // Now get the files
          const files = await fs.readdir(sessionPath);
          const result: StorageFile[] = [];
          
          for (const filename of files) {
            if (filename.endsWith('.jpg')) {
              const filePath = path.join(sessionPath, filename);
              const fileStats = await fs.stat(filePath);
              
              result.push({
                filename,
                path: filePath,
                size: fileStats.size,
                createdAt: fileStats.birthtime,
                expiresAt,
                sessionId,
                metadata: {}
              });
            }
          }
          
          console.log(`Found ${result.length} files in session directory`);
          return result;
        }
      } catch (error) {
        console.error('Error checking session directory:', error);
      }
      throw new Error('Session not found');
    }

    const files = await fs.readdir(session.path);
    const result: StorageFile[] = [];
    
    for (const filename of files) {
      if (filename.endsWith('.jpg')) {
        const filePath = path.join(session.path, filename);
        const stats = await fs.stat(filePath);
        
        result.push({
          filename,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime,
          expiresAt: session.expiresAt,
          sessionId,
          metadata: {}
        });
      }
    }
    
    console.log(`Found ${result.length} files in session`);
    return result;
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance(); 