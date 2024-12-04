/**
 * Screenshot API Route
 * 
 * Purpose: Main screenshot API endpoint for JSON responses
 * Functionality: Takes screenshots and returns JSON data with base64 image
 */
import { NextResponse } from 'next/server'
import { captureScreen } from '@/services/screenshot'
import { deviceConfigs } from '@/config/devices'
import { validateUrl } from '@/services/url-validation'
import type { DeviceConfig } from '@/types/screenshot'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, device = 'desktop', delay, hideSelectors } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    const validation = validateUrl(url)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid URL',
        details: validation.error
      }, { status: 400 })
    }

    // Get device config
    const deviceConfig = deviceConfigs[device as keyof typeof deviceConfigs]
    if (!deviceConfig) {
      return NextResponse.json({ error: 'Invalid device type' }, { status: 400 })
    }

    const screenshot = await captureScreen({
      url: validation.normalizedUrl || url,
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