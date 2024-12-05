import { nanoid } from 'nanoid'
import { captureScreen, screenshotStorage } from './screenshot'
import { resourceService } from './resource'
import type { BatchJob, BatchConfig, BatchJobUpdate } from '@/types/batch'
import type { Screenshot } from '@/types/screenshot'
import { removeDir } from '@/utils/disk'
import { normalizeUrl } from './url'

class BatchService {
  private jobs: Map<string, BatchJob> = new Map()
  private processing: boolean = false
  private activeJobs: Set<string> = new Set()
  private maxConcurrent: number = 3
  private retryLimit: number = 3
  private shouldStop: Set<string> = new Set() // Track jobs that should stop

  constructor() {
    // Initialize storage only
    screenshotStorage.init().catch(console.error)
  }

  async addJob(urls: string[], config: BatchConfig): Promise<string> {
    // Normalize URLs before processing
    const normalizedUrls = urls.map(url => normalizeUrl(url))
    
    const jobId = nanoid()
    const session = await screenshotStorage.createSession()

    const job: BatchJob = {
      id: jobId,
      urls: normalizedUrls,
      config,
      sessionId: session.id,
      status: 'queued',
      progress: 0,
      results: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.jobs.set(jobId, job)
    this.processQueue().catch(console.error)
    return jobId
  }

  async getJob(jobId: string): Promise<BatchJob | null> {
    return this.jobs.get(jobId) || null
  }

  private async updateJob(jobId: string, update: BatchJobUpdate) {
    const job = this.jobs.get(jobId)
    if (!job) return

    Object.assign(job, {
      ...update,
      updatedAt: new Date()
    })

    this.jobs.set(jobId, job)
  }

  private async processUrl(
    url: string,
    job: BatchJob,
    processed: number,
    total: number
  ): Promise<Screenshot | null> {
    // Check if job should stop
    if (this.shouldStop.has(job.id)) {
      throw new Error('Job paused or cancelled')
    }

    // Skip resource check in development
    if (process.env.NODE_ENV === 'production') {
      const resourcesOk = await resourceService.checkResources()
      if (!resourcesOk) {
        throw new Error('Insufficient resources to process URL')
      }
    }

    try {
      console.log(`Processing URL: ${url}`)
      const screenshot = await captureScreen({
        url: normalizeUrl(url), // Normalize URL before capture
        deviceConfig: job.config.deviceConfig,
        delay: job.config.delay,
        hideSelectors: job.config.hideSelectors,
        sessionId: job.sessionId!,
        maxDimension: job.config.maxDimension,
        quality: job.config.quality,
        maxFileSize: job.config.maxFileSize,
        profile: job.profile
      })
      console.log(`Successfully captured: ${url}`)
      return screenshot
    } catch (error) {
      console.error(`Failed to process ${url}:`, error)
      return null
    }
  }

  private async processJob(job: BatchJob): Promise<void> {
    if (!job.sessionId) {
      throw new Error('No session ID for job')
    }

    // Start monitoring in production only when processing starts
    if (process.env.NODE_ENV === 'production') {
      resourceService.startMonitoring(300000) // 5 minutes
    }

    const total = job.urls.length
    const results: Screenshot[] = []
    let processed = 0
    let errors = 0
    let consecutiveErrors = 0
    let retryAttempts = 0
    const MAX_RETRIES = 3
    const MAX_CONSECUTIVE_ERRORS = 3

    try {
      // Skip initial resource check in development
      if (process.env.NODE_ENV === 'production') {
        const initialResources = await resourceService.checkResources()
        if (!initialResources) {
          console.log('Insufficient resources to start job, waiting...')
          await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10s
        }
      }

      // Process URLs in chunks
      for (let i = 0; i < job.urls.length && retryAttempts < MAX_RETRIES;) {
        // Check if job should stop
        if (this.shouldStop.has(job.id)) {
          console.log('Job stopped by request:', job.id)
          return
        }

        // Check resources before processing chunk
        const resourcesOk = await resourceService.checkResources()
        if (!resourcesOk) {
          console.log('Insufficient resources, waiting before retry...')
          await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10s before retry
          retryAttempts++
          if (retryAttempts >= MAX_RETRIES) {
            throw new Error('Max retry attempts reached due to insufficient resources')
          }
          continue
        }

        const chunk = job.urls.slice(i, i + this.maxConcurrent)
        console.log(`Processing chunk of ${chunk.length} URLs (${i + 1}-${Math.min(i + this.maxConcurrent, job.urls.length)} of ${job.urls.length})`)
        
        try {
          const chunkPromises = chunk.map(url => 
            this.processUrl(url, job, processed, total)
          )

          const chunkResults = await Promise.all(chunkPromises)
          
          // Filter out failures and update progress
          const validResults = chunkResults.filter((r): r is Screenshot => r !== null)
          results.push(...validResults)
          processed += chunk.length
          const chunkErrors = chunk.length - validResults.length
          errors += chunkErrors

          if (chunkErrors > 0) {
            consecutiveErrors++
            console.log(`Chunk had ${chunkErrors} errors. Consecutive error count: ${consecutiveErrors}`)
          } else {
            consecutiveErrors = 0
            retryAttempts = 0 // Reset retry attempts on success
          }

          // Update progress (ensure it's between 0-100)
          const progress = Math.min(100, Math.round((processed / total) * 100))
          await this.updateJob(job.id, {
            progress,
            results
          })

          // If too many consecutive errors, pause for recovery
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.log('Too many consecutive errors, cooling down...')
            await new Promise(resolve => setTimeout(resolve, 10000)) // 10s cooldown
            consecutiveErrors = 0
            retryAttempts++
            if (retryAttempts >= MAX_RETRIES) {
              throw new Error('Max retry attempts reached due to consecutive errors')
            }
            continue
          }

          // If too many total errors, abort
          if (errors > total * 0.3) { // 30% error threshold
            throw new Error(`Too many failures (${errors} of ${total}), aborting batch`)
          }

          // Only increment i if we successfully processed the chunk
          i += this.maxConcurrent
        } catch (chunkError) {
          console.error('Chunk processing error:', chunkError)
          retryAttempts++
          if (retryAttempts >= MAX_RETRIES) {
            throw chunkError
          }
          await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5s before retry
          continue
        }
      }

      // Check if we completed due to max retries
      if (retryAttempts >= MAX_RETRIES) {
        throw new Error('Job terminated due to max retry attempts')
      }

      const finalStatus = errors > 0 ? 'completed_with_errors' : 'completed'
      await this.updateJob(job.id, {
        status: finalStatus,
        error: errors > 0 ? `${errors} URLs failed to process` : undefined,
        progress: 100,
        results
      })
    } catch (error) {
      console.error('Job processing error:', error)
      // Ensure job is marked as failed
      await this.updateJob(job.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: (processed / total) * 100,
        results
      })
      throw error
    } finally {
      // Stop monitoring when job is done
      if (process.env.NODE_ENV === 'production') {
        resourceService.stopMonitoring()
      }
    }
  }

  async processQueue(): Promise<void> {
    if (this.processing) {
      console.log('Queue already processing, skipping')
      return
    }

    this.processing = true
    console.log('Starting queue processing')

    try {
      const queuedJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'queued')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      for (const job of queuedJobs) {
        if (this.shouldStop.has(job.id)) {
          console.log('Skipping job due to stop request:', job.id)
          continue
        }

        this.activeJobs.add(job.id)
        await this.updateJob(job.id, { status: 'processing' })

        try {
          await this.processJob(job)
        } catch (error) {
          console.error(`Job ${job.id} failed:`, error)
          await this.updateJob(job.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        } finally {
          this.activeJobs.delete(job.id)
        }
      }
    } finally {
      this.processing = false
      console.log('Queue processing completed')
    }
  }

  async pauseJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job || job.status !== 'processing') return

    console.log('Pausing job:', jobId)
    this.shouldStop.add(jobId)
    await this.updateJob(jobId, { status: 'queued' })
  }

  async resumeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job || job.status !== 'queued') return

    console.log('Resuming job:', jobId)
    this.shouldStop.delete(jobId)
    this.processQueue().catch(console.error)
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) return

    console.log('Cancelling job:', jobId)
    this.shouldStop.add(jobId)

    if (job.sessionId) {
      const session = await screenshotStorage.getSession(job.sessionId)
      if (session?.path) {
        await removeDir(session.path)
      }
    }

    this.jobs.delete(jobId)
    this.shouldStop.delete(jobId)
  }

  async getStats(): Promise<{
    total: number
    queued: number
    processing: number
    completed: number
    failed: number
  }> {
    const jobs = Array.from(this.jobs.values())
    return {
      total: jobs.length,
      queued: jobs.filter(j => j.status === 'queued').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    }
  }

  async getJobErrors(jobId: string): Promise<Array<{ url: string, error: string }>> {
    const job = this.jobs.get(jobId)
    if (!job) return []

    const processedUrls = new Set(job.results.map(r => r.url))
    return job.urls
      .filter(url => !processedUrls.has(url))
      .map(url => ({
        url,
        error: 'Failed to capture screenshot'
      }))
  }

  async cleanup(): Promise<void> {
    // Stop accepting new jobs
    this.processing = true

    try {
      // Cancel all queued jobs
      const queuedJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'queued')
      
      for (const job of queuedJobs) {
        await this.cancelJob(job.id)
      }

      // Trigger resource cleanup
      await resourceService.cleanup()
    } finally {
      this.processing = false
    }
  }
}

// Export singleton instance
export const batchService = new BatchService() 