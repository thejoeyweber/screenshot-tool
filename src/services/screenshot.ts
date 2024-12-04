/**
 * Screenshot service
 * Handles screenshot capture and manipulation operations using Puppeteer
 */
import puppeteer from 'puppeteer'
import type { Screenshot, DeviceConfig } from '@/types/screenshot'

interface CaptureOptions {
  url: string
  deviceConfig: DeviceConfig
  delay?: number
  hideSelectors?: string[]
}

export async function captureScreen({ 
  url, 
  deviceConfig,
  delay = 1000,
  hideSelectors = []
}: CaptureOptions): Promise<Screenshot> {
  console.log('Starting screenshot capture:', { url, deviceConfig, delay })
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  console.log('Browser launched')
  
  const page = await browser.newPage()
  console.log('New page created')

  try {
    // Configure viewport
    console.log('Setting viewport:', deviceConfig)
    await page.setViewport({
      width: deviceConfig.width,
      height: deviceConfig.height,
      deviceScaleFactor: deviceConfig.deviceScaleFactor,
      isMobile: deviceConfig.isMobile,
    })
    
    // Set user agent and headers
    console.log('Setting headers')
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache'
    })

    // Navigate and wait for network idle
    console.log('Navigating to URL:', url)
    const response = await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    console.log('Navigation complete. Status:', response?.status())
    
    // Wait for specified delay
    console.log('Waiting for delay:', delay)
    await new Promise(resolve => setTimeout(resolve, delay))

    // Hide specified elements
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

    // Take full page screenshot
    console.log('Taking screenshot')
    const buffer = await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 90
    }) as Buffer
    console.log('Screenshot taken, buffer size:', buffer.length)

    // Generate screenshot metadata
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
        }
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