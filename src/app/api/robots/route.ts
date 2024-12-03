import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    const robotsUrl = new URL('/robots.txt', url).toString()
    const response = await fetch(robotsUrl)
    const data = await response.text()
    return NextResponse.json({ data })
  } catch (error) {
    // Check if it's a CORS error
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch robots.txt'
    const isCorsError = errorMessage.toLowerCase().includes('cors')
    
    return NextResponse.json(
      { error: isCorsError ? 'CORS policy blocked access' : errorMessage },
      { status: isCorsError ? 403 : 500 }
    )
  }
} 