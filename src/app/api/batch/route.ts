import { NextResponse } from 'next/server'
import { batchService } from '@/services/batch'
import { deviceConfigs } from '@/config/devices'
import { validateUrl } from '@/services/url-validation'
import { z } from 'zod'

// Validation schemas
const createBatchSchema = z.object({
  urls: z.array(z.string().url()),
  config: z.object({
    deviceConfig: z.object({
      name: z.enum(['Desktop', 'Tablet', 'Mobile']),
      width: z.number(),
      height: z.number(),
      deviceScaleFactor: z.number(),
      isMobile: z.boolean()
    }),
    delay: z.number().optional(),
    hideSelectors: z.array(z.string()).optional(),
    maxDimension: z.number().optional(),
    quality: z.number().optional(),
    maxFileSize: z.number().optional()
  })
})

// Strip binary data from response
function sanitizeJob(job: any) {
  if (!job) return null
  
  // Ensure we return the complete job state
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    urls: job.urls || [],
    results: (job.results || []).map((result: any) => ({
      id: result.id,
      url: result.url,
      title: result.title,
      error: result.error,
      metadata: result.metadata
    })),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Set default device config if not provided
    if (!body.config?.deviceConfig?.name) {
      body.config = {
        ...body.config,
        deviceConfig: deviceConfigs.desktop
      }
    }

    // Validate URLs
    const validUrls = await Promise.all(
      body.urls.map(async (url: string) => {
        const validation = validateUrl(url)
        return validation.isValid ? validation.normalizedUrl || url : null
      })
    )

    const filteredUrls = validUrls.filter((url): url is string => url !== null)
    if (filteredUrls.length === 0) {
      return NextResponse.json({ error: 'No valid URLs provided' }, { status: 400 })
    }

    // Update body with validated URLs
    body.urls = filteredUrls
    
    const validated = createBatchSchema.parse(body)
    const jobId = await batchService.addJob(validated.urls, validated.config)
    
    return NextResponse.json({
      success: true,
      jobId,
      totalUrls: filteredUrls.length,
      skippedUrls: body.urls.length - filteredUrls.length
    })
  } catch (error) {
    console.error('Batch creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request data' },
      { status: 400 }
    )
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    const stats = await batchService.getStats()
    return NextResponse.json({ stats })
  }

  const job = await batchService.getJob(jobId)
  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    )
  }

  // Add debug logging
  console.log('Job state:', {
    id: job.id,
    status: job.status,
    progress: job.progress,
    resultsCount: job.results?.length,
    totalUrls: job.urls?.length,
    error: job.error
  })

  return NextResponse.json(sanitizeJob(job))
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