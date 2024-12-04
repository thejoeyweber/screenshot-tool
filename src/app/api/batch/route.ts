import { NextResponse } from 'next/server'
import { batchService } from '@/services/batch'
import { deviceConfigs } from '@/config/devices'
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
  
  return {
    ...job,
    results: job.results?.map((result: any) => ({
      ...result,
      imageData: result.imageData ? `[Binary data: ${result.imageData.length} bytes]` : undefined
    }))
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
    
    const validated = createBatchSchema.parse(body)
    const jobId = await batchService.addJob(validated.urls, validated.config)
    
    return NextResponse.json({ jobId })
  } catch (error) {
    console.error('Batch creation error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    )
  }

  const job = await batchService.getJob(jobId)
  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(sanitizeJob(job))
} 