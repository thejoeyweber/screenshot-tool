import { NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/utils/website-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Simple fetch with basic headers
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/xml, application/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapFetcher/1.0)'
      }
    })

    // Handle 404s separately from other errors
    if (response.status === 404) {
      return NextResponse.json({ error: 'Sitemap not found' }, { status: 404 })
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    
    // Basic validation that it's a sitemap
    if (!text.includes('<urlset') && !text.includes('<sitemapindex')) {
      return NextResponse.json({ error: 'Not a valid sitemap' }, { status: 422 })
    }

    return NextResponse.json({ data: text })
  } catch (error) {
    console.error('Sitemap fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sitemap' },
      { status: 500 }
    )
  }
} 