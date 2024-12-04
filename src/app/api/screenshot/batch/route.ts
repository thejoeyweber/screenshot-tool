import { NextResponse } from 'next/server'
import { batchService } from '@/services/batch'
import { validateUrl } from '@/services/url-validation'
import { deviceConfigs } from '@/config/devices'
import type { BatchConfig } from '@/types/batch'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { urls, config } = body

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 })
    }

    // Validate URLs
    const validUrls = await Promise.all(
      urls.map(async (url) => {
        const validation = validateUrl(url)
        return validation.isValid ? validation.normalizedUrl || url : null
      })
    )

    const filteredUrls = validUrls.filter((url): url is string => url !== null)
    if (filteredUrls.length === 0) {
      return NextResponse.json({ error: 'No valid URLs provided' }, { status: 400 })
    }

    // Validate device config
    const deviceConfig = config.deviceConfig ? 
      deviceConfigs[config.deviceConfig as keyof typeof deviceConfigs] :
      deviceConfigs.desktop

    if (!deviceConfig) {
      return NextResponse.json({ error: 'Invalid device configuration' }, { status: 400 })
    }

    // Create batch config
    const batchConfig: BatchConfig = {
      deviceConfig,
      delay: config.delay,
      hideSelectors: config.hideSelectors,
      maxDimension: config.maxDimension,
      quality: config.quality,
      maxFileSize: config.maxFileSize
    }

    // Add job to batch service
    const jobId = await batchService.addJob(filteredUrls, batchConfig)

    return NextResponse.json({
      success: true,
      jobId,
      totalUrls: filteredUrls.length,
      skippedUrls: urls.length - filteredUrls.length
    })
  } catch (error) {
    console.error('Batch processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process batch request' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    const stats = await batchService.getStats()
    return NextResponse.json({ stats })
  }

  const job = await batchService.getJob(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    total: job.urls.length,
    completed: job.results.length,
    error: job.error
  })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
  }

  await batchService.cancelJob(jobId)
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  const action = searchParams.get('action')

  if (!jobId || !action) {
    return NextResponse.json({ error: 'Job ID and action are required' }, { status: 400 })
  }

  switch (action) {
    case 'pause':
      await batchService.pauseJob(jobId)
      break
    case 'resume':
      await batchService.resumeJob(jobId)
      break
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
} 