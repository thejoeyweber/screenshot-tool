/**
 * Test Screenshot API Route
 * 
 * Purpose: Testing endpoint for screenshot functionality
 * Note: This endpoint is for development/testing only
 */
import { captureScreen, screenshotStorage } from '@/services/screenshot'
import { deviceConfigs } from '@/config/devices'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { validateUrl } from '@/services/url-validation'

async function getProfile(url: string) {
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  
  const profileUrl = `${protocol}://${host}/api/profile-url?url=${encodeURIComponent(url)}`
  console.log('Fetching profile from:', profileUrl)
  
  const response = await fetch(profileUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  
  if (!response.ok) {
    const text = await response.text()
    console.error('Profile fetch failed:', {
      status: response.status,
      statusText: response.statusText,
      body: text
    })
    return null
  }
  
  return await response.json()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

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

    // Initialize storage
    await screenshotStorage.init()
    
    // Create a new session
    const session = await screenshotStorage.createSession()
    console.log('Created storage session:', session.id)

    // Get site profile
    const profile = await getProfile(validation.normalizedUrl || url)
    console.log('Site profile:', profile)

    // Take screenshot with storage session
    const screenshot = await captureScreen({
      url: validation.normalizedUrl || url,
      deviceConfig: deviceConfigs.desktop,
      profile,
      sessionId: session.id
    })

    // Get storage stats
    const stats = await screenshotStorage.getStats()
    console.log('Storage stats:', stats)

    // Return image with metadata headers
    return new NextResponse(screenshot.imageData, {
      headers: new Headers({
        'Content-Type': 'image/jpeg',
        'Content-Length': screenshot.imageData.length.toString(),
        'X-Screenshot-ID': screenshot.id,
        'X-Session-ID': session.id,
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