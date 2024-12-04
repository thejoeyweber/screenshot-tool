/**
 * Screenshot Capture API Route
 * 
 * Purpose: Handles screenshot capture requests
 * Functionality: Takes screenshots with specified settings
 */
import { NextResponse } from 'next/server'
import { captureScreen } from '@/services/screenshot'
import { deviceConfigs } from '@/config/devices'
import { headers } from 'next/headers'
import { validateUrl } from '@/services/url-validation'
import type { DeviceConfig } from '@/types/screenshot'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const deviceName = searchParams.get('device') || 'Desktop'
  const delay = parseInt(searchParams.get('delay') || '1000', 10)
  const hideSelectors = searchParams.get('hideSelectors')?.split(',').filter(Boolean) || []

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // Validate URL
    const validation = validateUrl(url)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid URL',
        details: validation.error
      }, { status: 400 })
    }

    // Get device config
    const deviceConfig = Object.entries(deviceConfigs)
      .find(([_, config]) => config.name === deviceName)?.[1]

    if (!deviceConfig) {
      return NextResponse.json({ error: 'Invalid device' }, { status: 400 })
    }

    // Get site profile
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    
    const profileUrl = `${protocol}://${host}/api/profile-url?url=${encodeURIComponent(validation.normalizedUrl || url)}`
    const profileResponse = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const profile = profileResponse.ok ? await profileResponse.json() : null

    // Take screenshot
    const screenshot = await captureScreen({
      url: validation.normalizedUrl || url,
      deviceConfig,
      delay,
      hideSelectors,
      profile
    })

    // Return image with metadata headers
    return new NextResponse(screenshot.imageData, {
      headers: new Headers({
        'Content-Type': 'image/jpeg',
        'Content-Length': screenshot.imageData.length.toString(),
        'X-Screenshot-ID': screenshot.id,
        'X-Session-ID': screenshot.metadata.sessionId || '',
        ...(screenshot.metadata.storagePath && {
          'X-Storage-Path': screenshot.metadata.storagePath
        })
      })
    })
  } catch (error) {
    console.error('Screenshot error:', error instanceof Error ? error.stack : error)
    return NextResponse.json({ 
      error: 'Failed to capture screenshot',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 