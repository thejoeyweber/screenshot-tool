import { NextResponse } from 'next/server'
import { batchService } from '@/services/batch'
import { z } from 'zod'

const controlSchema = z.object({
  action: z.enum(['pause', 'resume', 'cancel'])
})

export async function POST(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = await Promise.resolve(params.jobId)
    const body = await req.json()
    const { action } = controlSchema.parse(body)

    switch (action) {
      case 'pause':
        await batchService.pauseJob(jobId)
        break
      case 'resume':
        await batchService.resumeJob(jobId)
        break
      case 'cancel':
        await batchService.cancelJob(jobId)
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Batch control error:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
} 