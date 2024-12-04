import fs from 'fs/promises'
import path from 'path'
import { StorageStats } from '@/types/storage'

/**
 * Get directory size recursively
 */
export async function getDirSize(dirPath: string): Promise<number> {
  let size = 0
  const files = await fs.readdir(dirPath)
  
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = await fs.stat(filePath)
    
    if (stats.isDirectory()) {
      size += await getDirSize(filePath)
    } else {
      size += stats.size
    }
  }
  
  return size
}

/**
 * Get storage statistics for a directory
 */
export async function getStorageStats(dirPath: string): Promise<StorageStats> {
  let totalSize = 0
  let fileCount = 0
  let sessionCount = 0
  let oldestFile: Date | undefined
  let newestFile: Date | undefined
  
  try {
    const sessions = await fs.readdir(dirPath)
    sessionCount = sessions.length
    
    for (const session of sessions) {
      const sessionPath = path.join(dirPath, session)
      const stats = await fs.stat(sessionPath)
      
      if (stats.isDirectory()) {
        const files = await fs.readdir(sessionPath)
        fileCount += files.length
        
        for (const file of files) {
          const filePath = path.join(sessionPath, file)
          const fileStats = await fs.stat(filePath)
          
          totalSize += fileStats.size
          
          if (!oldestFile || fileStats.birthtime < oldestFile) {
            oldestFile = fileStats.birthtime
          }
          if (!newestFile || fileStats.birthtime > newestFile) {
            newestFile = fileStats.birthtime
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting storage stats:', error)
  }
  
  return {
    totalSize,
    fileCount,
    sessionCount,
    oldestFile,
    newestFile
  }
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  const normalizedPath = path.resolve(dirPath)
  console.log('Ensuring directory exists:', normalizedPath)
  
  try {
    await fs.access(normalizedPath)
    console.log('Directory already exists')
  } catch {
    console.log('Creating directory...')
    try {
      await fs.mkdir(normalizedPath, { recursive: true })
      console.log('Directory created successfully')
    } catch (error) {
      console.error('Failed to create directory:', error)
      throw error
    }
  }
}

/**
 * Delete directory and contents
 */
export async function removeDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true })
  } catch (error) {
    console.error('Error removing directory:', error)
  }
}

/**
 * Clean up expired files and empty directories
 */
export async function cleanupExpired(dirPath: string, maxAge: number): Promise<void> {
  try {
    const now = Date.now()
    const sessions = await fs.readdir(dirPath)
    
    for (const session of sessions) {
      const sessionPath = path.join(dirPath, session)
      const stats = await fs.stat(sessionPath)
      
      if (stats.isDirectory()) {
        const files = await fs.readdir(sessionPath)
        
        // Remove expired files
        for (const file of files) {
          const filePath = path.join(sessionPath, file)
          const fileStats = await fs.stat(filePath)
          
          if (now - fileStats.birthtime.getTime() > maxAge) {
            await fs.unlink(filePath)
          }
        }
        
        // Remove empty session directories
        const remainingFiles = await fs.readdir(sessionPath)
        if (remainingFiles.length === 0) {
          await fs.rmdir(sessionPath)
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired files:', error)
  }
} 