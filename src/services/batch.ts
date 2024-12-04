import { nanoid } from 'nanoid'
import { captureScreen, screenshotStorage } from './screenshot'
import type { BatchJob, BatchConfig, BatchJobUpdate } from '@/types/batch'
import type { Screenshot } from '@/types/screenshot'
import { removeDir } from '@/utils/disk'

class BatchService {
  private jobs: Map<string, BatchJob> = new Map()
  private processing: boolean = false
  private currentJobId: string | null = null
  private maxConcurrent: number = 3
  private retryLimit: number = 3

  constructor() {
    // Initialize storage
    screenshotStorage.init().catch(console.error)
  }

  async addJob(urls: string[], config: BatchConfig): Promise<string> {
    const jobId = nanoid()
    const session = await screenshotStorage.createSession()

    const job: BatchJob = {
      id: jobId,
      urls,
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

  private async processJob(job: BatchJob): Promise<void> {
    if (!job.sessionId) {
      throw new Error('No session ID for job')
    }

    let processed = 0
    const total = job.urls.length
    const results: Screenshot[] = []
    let lastError: Error | null = null
    let retryCount = 0

    for (const url of job.urls) {
      try {
        const screenshot = await captureScreen({
          url,
          deviceConfig: job.config.deviceConfig,
          delay: job.config.delay,
          hideSelectors: job.config.hideSelectors,
          sessionId: job.sessionId,
          maxDimension: job.config.maxDimension,
          quality: job.config.quality,
          maxFileSize: job.config.maxFileSize,
          profile: job.profile
        })

        results.push(screenshot)
        processed++

        await this.updateJob(job.id, {
          progress: (processed / total) * 100,
          results
        })
      } catch (error) {
        console.error(`Failed to process ${url}:`, error)
        lastError = error as Error
        
        if (retryCount < this.retryLimit) {
          retryCount++
          processed--
          continue
        }
      }
    }

    await this.updateJob(job.id, {
      status: lastError ? 'failed' : 'completed',
      error: lastError?.message,
      progress: 100,
      results
    })
  }

  async processQueue(): Promise<void> {
    if (this.processing) return

    this.processing = true

    try {
      const queuedJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'queued')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      for (const job of queuedJobs) {
        this.currentJobId = job.id
        await this.updateJob(job.id, { status: 'processing' })

        try {
          await this.processJob(job)
        } catch (error) {
          await this.updateJob(job.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }

        this.currentJobId = null
      }
    } finally {
      this.processing = false
      this.currentJobId = null
    }
  }

  async pauseJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job || job.status !== 'processing') return

    await this.updateJob(jobId, { status: 'queued' })
  }

  async resumeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job || job.status !== 'queued') return

    this.processQueue().catch(console.error)
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) return

    if (job.sessionId) {
      const session = await screenshotStorage.getSession(job.sessionId)
      if (session?.path) {
        await removeDir(session.path)
      }
    }

    this.jobs.delete(jobId)
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
}

// Export singleton instance
export const batchService = new BatchService() 