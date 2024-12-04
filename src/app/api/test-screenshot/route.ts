import { captureScreen, deviceConfigs } from '@/services/screenshot'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

async function getProfile(url: string) {
  // Get the host from the request headers
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  
  // Construct absolute URL for internal API
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
    // Get site profile first
    const profile = await getProfile(url)
    console.log('Site profile:', profile)

    if (!profile) {
      console.error('Failed to get site profile')
      return NextResponse.json({ error: 'Failed to get site profile' }, { status: 500 })
    }

    // Take screenshot with profile-informed settings
    const screenshot = await captureScreen({
      url,
      deviceConfig: deviceConfigs.desktop,
      profile
    })

    // Serve the image directly with proper headers
    return new NextResponse(screenshot.imageData, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': screenshot.imageData.length.toString(),
      },
    })
  } catch (error) {
    console.error('Screenshot error:', error instanceof Error ? error.stack : error)
    return NextResponse.json({ 
      error: 'Failed to capture screenshot',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 