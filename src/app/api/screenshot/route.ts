import { NextResponse } from 'next/server'
import { captureScreen, deviceConfigs } from '@/services/screenshot'
import type { DeviceConfig } from '@/types/screenshot'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, device = 'desktop', delay, hideSelectors } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Get device config
    const deviceConfig = deviceConfigs[device as keyof typeof deviceConfigs]
    if (!deviceConfig) {
      return NextResponse.json({ error: 'Invalid device type' }, { status: 400 })
    }

    const screenshot = await captureScreen({
      url,
      deviceConfig,
      delay,
      hideSelectors
    })

    return NextResponse.json({
      success: true,
      data: {
        id: screenshot.id,
        url: screenshot.url,
        title: screenshot.title,
        createdAt: screenshot.createdAt,
        metadata: screenshot.metadata,
        // Convert Buffer to base64 for transmission
        imageData: screenshot.imageData.toString('base64')
      }
    })
  } catch (error) {
    console.error('Screenshot capture error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture screenshot' },
      { status: 500 }
    )
  }
} 