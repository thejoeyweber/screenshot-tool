import { screenshotStorage } from './screenshot'
import type { StorageStats } from '@/types/storage'
import os from 'os'

export interface ResourceStats {
  diskSpace: {
    available: number  // in bytes
    total: number     // in bytes
    used: number      // in bytes
  }
  memory: {
    available: number // in bytes
    total: number    // in bytes
    used: number     // in bytes
  }
  sessions: StorageStats
}

class ResourceService {
  private readonly MIN_DISK_SPACE = 1024 * 1024 * 1024 // 1GB
  private readonly MAX_MEMORY_USAGE = 0.8 // 80% of available memory
  private readonly CLEANUP_AGE = 24 * 60 * 60 * 1000 // 24 hours

  private static instance: ResourceService | null = null
  private isMonitoring: boolean = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private lastCheck: number = 0
  private readonly CHECK_INTERVAL = 5000 // 5 seconds between checks

  private constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance(): ResourceService {
    if (!ResourceService.instance) {
      ResourceService.instance = new ResourceService()
    }
    return ResourceService.instance
  }

  private getDiskSpace(): { available: number, total: number, used: number } {
    try {
      // For development, return generous values
      if (process.env.NODE_ENV === 'development') {
        return {
          available: 10 * 1024 * 1024 * 1024, // 10GB
          total: 100 * 1024 * 1024 * 1024,    // 100GB
          used: 90 * 1024 * 1024 * 1024       // 90GB
        }
      }

      // In production, use actual system metrics
      const totalMemory = os.totalmem()
      const freeMemory = os.freemem()
      
      return {
        available: freeMemory,
        total: totalMemory,
        used: totalMemory - freeMemory
      }
    } catch (error) {
      console.error('Failed to get disk space:', error)
      return {
        available: 0,
        total: 0,
        used: 0
      }
    }
  }

  async getStats(): Promise<ResourceStats> {
    const memory = process.memoryUsage()
    
    try {
      const diskSpace = this.getDiskSpace()
      const sessions = await screenshotStorage.getStats()

      return {
        diskSpace,
        memory: {
          available: memory.heapTotal - memory.heapUsed,
          total: memory.heapTotal,
          used: memory.heapUsed
        },
        sessions
      }
    } catch (error) {
      console.error('Failed to get resource stats:', error)
      return {
        diskSpace: { available: 0, total: 0, used: 0 },
        memory: {
          available: memory.heapTotal - memory.heapUsed,
          total: memory.heapTotal,
          used: memory.heapUsed
        },
        sessions: {
          totalSize: 0,
          fileCount: 0,
          sessionCount: 0
        }
      }
    }
  }

  async checkResources(): Promise<boolean> {
    // In development, always return true
    if (process.env.NODE_ENV === 'development') {
      return true
    }

    // Rate limit checks
    const now = Date.now()
    if (now - this.lastCheck < this.CHECK_INTERVAL) {
      return true // Skip check if too soon
    }
    this.lastCheck = now

    const stats = await this.getStats()
    let needsCleanup = false
    
    // Check disk space
    if (stats.diskSpace.available < this.MIN_DISK_SPACE) {
      needsCleanup = true
    }

    // Check memory usage
    if (stats.memory.used / stats.memory.total > this.MAX_MEMORY_USAGE) {
      needsCleanup = true
    }

    if (needsCleanup) {
      await this.cleanup()
      return false
    }

    return true
  }

  async cleanup(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      return // Skip cleanup in development
    }
    await screenshotStorage.cleanup()
  }

  startMonitoring(interval: number = 300000): void { // Default 5 minutes
    // In development, don't start monitoring
    if (process.env.NODE_ENV === 'development') {
      return
    }

    if (this.isMonitoring) {
      return
    }

    this.isMonitoring = true
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkResources()
      } catch (error) {
        console.error('Resource monitoring error:', error)
      }
    }, interval)
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      this.isMonitoring = false
    }
  }
}

// Export singleton instance
export const resourceService = ResourceService.getInstance() 