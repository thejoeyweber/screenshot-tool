import { NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/utils/website-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    console.log('Fetching sitemap from:', url)
    // Simple fetch with basic headers
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/xml, application/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapFetcher/1.0)',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

    // Handle 404s separately from other errors
    if (response.status === 404) {
      console.log('Sitemap not found (404)')
      return NextResponse.json({ error: 'Sitemap not found' }, { 
        status: 404,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
    }

    if (!response.ok) {
      console.log('Sitemap fetch failed:', response.status, response.statusText)
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    console.log('Content-Type:', contentType)

    const text = await response.text()
    console.log('Sitemap content length:', text.length)
    console.log('Sitemap content preview:', text.substring(0, 500))
    
    // More thorough XML validation
    const cleanXml = text.trim()
    if (!cleanXml.startsWith('<?xml') && !cleanXml.startsWith('<urlset') && !cleanXml.startsWith('<sitemapindex')) {
      console.log('Invalid sitemap format - does not start with XML declaration or sitemap tags')
      return NextResponse.json({ error: 'Not a valid sitemap' }, { 
        status: 422,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
    }

    return NextResponse.json({ data: cleanXml }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Sitemap fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sitemap' },
      { status: 500 }
    )
  }
} 