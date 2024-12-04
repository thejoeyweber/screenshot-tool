import { captureScreen, deviceConfigs } from '@/services/screenshot'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const screenshot = await captureScreen({
      url,
      deviceConfig: deviceConfigs.desktop,
    })

    // Serve the image directly with proper headers
    return new NextResponse(screenshot.imageData, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': screenshot.imageData.length.toString(),
      },
    })
  } catch (error) {
    console.error('Screenshot error:', error)
    return NextResponse.json({ error: 'Failed to capture screenshot' }, { status: 500 })
  }
} 