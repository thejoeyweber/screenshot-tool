/**
 * Screenshot service
 * Handles screenshot capture and manipulation operations using Puppeteer
 */
import puppeteer from 'puppeteer'
import type { Screenshot, DeviceConfig } from '@/types/screenshot'
import type { SiteProfile } from '@/types/site-profile'

interface CaptureOptions {
  url: string
  deviceConfig: DeviceConfig
  delay?: number
  hideSelectors?: string[]
  profile?: SiteProfile
}

export async function captureScreen({ 
  url, 
  deviceConfig,
  delay = 1000,
  hideSelectors = [],
  profile
}: CaptureOptions): Promise<Screenshot> {
  console.log('Starting screenshot capture:', { url, deviceConfig, delay })
  
  if (profile) {
    delay = profile.recommendations.suggestedDelay
    console.log('Using profile recommendations:', profile.recommendations)
    
    if (profile.features.hasCookieConsent) {
      hideSelectors = [
        ...hideSelectors,
        '.cookie-banner',
        '#cookie-notice',
        '[class*="cookie"]',
        '[class*="consent"]',
        '[id*="cookie"]',
        '[id*="consent"]'
      ]
    }

    if (profile.recommendations.needsAuthentication) {
      console.warn('Page requires authentication, capture may be incomplete')
    }
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  }).catch(error => {
    console.error('Browser launch failed:', error)
    throw error
  })
  
  console.log('Browser launched')
  
  const page = await browser.newPage()
  console.log('New page created')

  try {
    const viewportHeight = profile?.metrics?.initialHeight || deviceConfig.height
    console.log('Setting viewport:', { ...deviceConfig, height: viewportHeight })
    await page.setViewport({
      width: deviceConfig.width,
      height: viewportHeight,
      deviceScaleFactor: deviceConfig.deviceScaleFactor,
      isMobile: deviceConfig.isMobile,
    })
    
    console.log('Setting headers')
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    await page.setUserAgent(userAgent)
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    })

    console.log('Navigating to URL:', url)
    const response = await page.goto(url, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: profile?.metrics?.scripts ? Math.max(30000, profile.metrics.scripts * 500) : 30000
    }).catch(error => {
      console.error('Navigation failed:', error)
      throw error
    })
    
    console.log('Navigation complete. Status:', response?.status())
    
    console.log('Waiting for content to load')
    await Promise.all([
      new Promise(resolve => setTimeout(resolve, delay)),
      page.waitForSelector('img', { timeout: delay })
        .catch(() => console.log('No images found')),
      page.waitForFunction(() => {
        const docElement = document.documentElement;
        return docElement.scrollHeight > 0 && docElement.scrollWidth > 0;
      }, { timeout: delay })
        .catch(() => console.log('Document size check failed')),
      ...(profile?.metrics?.scripts && profile.metrics.scripts > 20 ? [
        page.waitForFunction(() => {
          return document.readyState === 'complete' && 
                 !document.querySelector('script[src]:not([loaded])')
        }, { timeout: delay })
          .catch(() => console.log('Script load check failed'))
      ] : [])
    ])

    if (hideSelectors.length > 0) {
      console.log('Hiding elements:', hideSelectors)
      await Promise.all(hideSelectors.map(selector => 
        page.evaluate((sel: string) => {
          document.querySelectorAll(sel).forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.visibility = 'hidden'
            }
          })
        }, selector)
      ))
    }

    console.log('Taking screenshot')
    const buffer = await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 90
    }) as Buffer
    console.log('Screenshot taken, buffer size:', buffer.length)

    const title = await page.title()
    console.log('Page title:', title)
    const timestamp = new Date()

    const screenshot = {
      id: `${timestamp.getTime()}-${url.replace(/[^a-z0-9]/gi, '-')}`,
      url,
      title,
      createdAt: timestamp,
      imageData: buffer,
      metadata: {
        device: deviceConfig.name,
        viewport: {
          width: deviceConfig.width,
          height: deviceConfig.height
        },
        ...(profile && { profileData: profile })
      }
    }
    console.log('Screenshot object created:', { 
      id: screenshot.id, 
      url: screenshot.url,
      bufferSize: screenshot.imageData.length,
      metadata: screenshot.metadata
    })

    return screenshot
  } catch (error) {
    console.error('Screenshot capture error:', error)
    throw error
  } finally {
    console.log('Closing browser')
    await browser.close()
  }
}

export async function saveScreenshot(screenshot: Screenshot): Promise<void> {
  // Implementation will be added when we set up storage
  throw new Error('Not implemented')
}

// Predefined device configurations
export const deviceConfigs = {
  desktop: {
    name: 'Desktop',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false
  },
  tablet: {
    name: 'Tablet',
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    isMobile: true
  },
  mobile: {
    name: 'Mobile',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true
  }
} as const 