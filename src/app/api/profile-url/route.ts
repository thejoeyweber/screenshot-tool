import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

interface SiteProfile {
  url: string
  finalUrl: string
  timing: {
    fetchStart: number
    fetchEnd: number
    totalTime: number
  }
  response: {
    status: number
    headers: Record<string, string>
    isHtml: boolean
    contentLength?: number
  }
  security: {
    hasCSP: boolean
    hasCORS: boolean
    hasXFrameOptions: boolean
  }
  features: {
    hasCookieConsent: boolean
    hasAuthentication: boolean
    hasServiceWorker: boolean
    hasAds: boolean
    hasAnalytics: boolean
  }
  metrics: {
    initialHeight?: number
    initialWidth?: number
    scripts: number
    images: number
    fonts: number
    totalResources: number
  }
  recommendations: {
    suggestedDelay: number
    needsAuthentication: boolean
    needsCookieHandling: boolean
    isComplexPage: boolean
    warnings: string[]
  }
}

interface PageMetrics {
  initialHeight?: number
  initialWidth?: number
  scripts: number
  images: number
  fonts: number
  hasCookieConsent: boolean
  hasAnalytics: boolean
  hasAds: boolean
  hasAuthentication: boolean
}

async function profileUrl(url: string): Promise<SiteProfile> {
  console.log('Profiling URL:', url)
  const fetchStart = Date.now()
  
  // First do a basic fetch to check response/headers
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  })
  
  const fetchEnd = Date.now()

  // Get response headers
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })

  // Quick check with puppeteer for dynamic content
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  try {
    // Collect console messages and network requests
    const requests = new Set<string>()
    page.on('request', request => requests.add(request.resourceType()))
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    })

    // Quick DOM checks
    const metrics = await page.evaluate(() => {
      const cookiePatterns = [
        'cookie',
        'gdpr',
        'consent',
        'privacy-banner',
        'cookie-banner'
      ]
      
      const analyticsPatterns = [
        'google-analytics',
        'gtag',
        'analytics',
        'hotjar',
        'mixpanel',
        'segment'
      ]

      const adPatterns = [
        'ad-',
        'advertisement',
        'banner',
        'adsense',
        'doubleclick'
      ]

      const scripts = document.getElementsByTagName('script')
      const scriptSources = Array.from(scripts).map(s => s.src || s.innerHTML)

      return {
        initialHeight: document.documentElement.scrollHeight,
        initialWidth: document.documentElement.scrollWidth,
        scripts: scripts.length,
        images: document.getElementsByTagName('img').length,
        fonts: document.styleSheets.length,
        hasCookieConsent: cookiePatterns.some(pattern => 
          document.body.innerHTML.toLowerCase().includes(pattern)
        ),
        hasAnalytics: analyticsPatterns.some(pattern =>
          scriptSources.some(src => src.toLowerCase().includes(pattern))
        ),
        hasAds: adPatterns.some(pattern =>
          document.body.innerHTML.toLowerCase().includes(pattern)
        ),
        hasAuthentication: document.body.innerHTML.toLowerCase().includes('login') ||
          document.body.innerHTML.toLowerCase().includes('sign in')
      }
    })

    // Build profile
    const profile: SiteProfile = {
      url,
      finalUrl: response.url,
      timing: {
        fetchStart,
        fetchEnd,
        totalTime: fetchEnd - fetchStart
      },
      response: {
        status: response.status,
        headers,
        isHtml: headers['content-type']?.includes('text/html') ?? false,
        contentLength: parseInt(headers['content-length'] || '0')
      },
      security: {
        hasCSP: !!headers['content-security-policy'],
        hasCORS: !!headers['access-control-allow-origin'],
        hasXFrameOptions: !!headers['x-frame-options']
      },
      features: {
        hasCookieConsent: metrics.hasCookieConsent,
        hasAuthentication: metrics.hasAuthentication,
        hasServiceWorker: requests.has('service_worker'),
        hasAds: metrics.hasAds,
        hasAnalytics: metrics.hasAnalytics
      },
      metrics: {
        initialHeight: metrics.initialHeight,
        initialWidth: metrics.initialWidth,
        scripts: metrics.scripts,
        images: metrics.images,
        fonts: metrics.fonts,
        totalResources: requests.size
      },
      recommendations: {
        suggestedDelay: calculateSuggestedDelay(metrics, requests.size),
        needsAuthentication: metrics.hasAuthentication,
        needsCookieHandling: metrics.hasCookieConsent,
        isComplexPage: isComplexPage(metrics, requests.size),
        warnings: generateWarnings(headers, metrics, requests.size)
      }
    }

    return profile
  } finally {
    await browser.close()
  }
}

function calculateSuggestedDelay(
  metrics: PageMetrics,
  resourceCount: number
): number {
  let delay = 1000 // Base delay

  if (metrics.scripts > 20) delay += 1000
  if (metrics.images > 30) delay += 500
  if (resourceCount > 50) delay += 1000
  if (metrics.hasCookieConsent) delay += 500

  return Math.min(delay, 5000) // Cap at 5 seconds
}

function isComplexPage(
  metrics: PageMetrics,
  resourceCount: number
): boolean {
  return (
    metrics.scripts > 30 ||
    metrics.images > 50 ||
    resourceCount > 100 ||
    (metrics.initialHeight || 0) > 5000
  )
}

function generateWarnings(
  headers: Record<string, string>,
  metrics: PageMetrics,
  resourceCount: number
): string[] {
  const warnings: string[] = []

  if (headers['content-security-policy'])
    warnings.push('CSP headers may block screenshot capture')
  
  if (metrics.hasAuthentication)
    warnings.push('Page may require authentication')
  
  if (metrics.hasCookieConsent)
    warnings.push('Cookie consent popup may appear')
  
  if (resourceCount > 100)
    warnings.push('High resource count may impact performance')
  
  if ((metrics.initialHeight || 0) > 10000)
    warnings.push('Very long page may require special handling')

  return warnings
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  try {
    const profile = await profileUrl(url)
    return NextResponse.json(profile)
  } catch (error) {
    console.error('URL profiling error:', error)
    return NextResponse.json(
      { error: 'Failed to profile URL' },
      { status: 500 }
    )
  }
} 