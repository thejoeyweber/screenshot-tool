/**
 * Screenshot service
 * Handles screenshot capture and manipulation operations using Puppeteer
 */
import puppeteer from 'puppeteer'
import type { Screenshot, DeviceConfig } from '@/types/screenshot'
import type { SiteProfile } from '@/types/site-profile'
import { storageService } from './storage'
import sharp from 'sharp'
import { deviceConfigs } from '@/config/devices'

interface CaptureOptions {
  url: string
  deviceConfig: DeviceConfig
  delay?: number
  hideSelectors?: string[]
  profile?: SiteProfile
  sessionId?: string
  maxDimension?: number
  quality?: number
  maxFileSize?: number
}

const DEFAULT_OPTIONS = {
  maxDimension: 10000,  // 10000px max dimension
  quality: 90,          // 90% JPEG quality
  maxFileSize: 10 * 1024 * 1024  // 10MB
} as const

/**
 * Process image buffer with optimizations
 */
async function processImage(
  buffer: Buffer,
  options: { maxDimension: number; quality: number; maxFileSize: number }
): Promise<Buffer> {
  let image = sharp(buffer)
  const metadata = await image.metadata()
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image dimensions')
  }

  // Check if dimensions exceed max
  if (metadata.width > options.maxDimension || metadata.height > options.maxDimension) {
    const aspectRatio = metadata.width / metadata.height
    
    if (metadata.width > metadata.height) {
      image = image.resize(options.maxDimension, Math.round(options.maxDimension / aspectRatio))
    } else {
      image = image.resize(Math.round(options.maxDimension * aspectRatio), options.maxDimension)
    }
  }

  // Convert to JPEG with quality setting
  let processedBuffer = await image
    .jpeg({ quality: options.quality })
    .toBuffer()

  // If still too large, reduce quality incrementally
  let currentQuality = options.quality
  while (processedBuffer.length > options.maxFileSize && currentQuality > 50) {
    currentQuality -= 10
    processedBuffer = await image
      .jpeg({ quality: currentQuality })
      .toBuffer()
  }

  if (processedBuffer.length > options.maxFileSize) {
    throw new Error(`Image file size (${processedBuffer.length}) exceeds maximum allowed (${options.maxFileSize})`)
  }

  return processedBuffer
}

export async function captureScreen({ 
  url, 
  deviceConfig,
  delay = 1000,
  hideSelectors = [],
  profile,
  sessionId,
  maxDimension = DEFAULT_OPTIONS.maxDimension,
  quality = DEFAULT_OPTIONS.quality,
  maxFileSize = DEFAULT_OPTIONS.maxFileSize
}: CaptureOptions): Promise<Screenshot> {
  console.log('Starting screenshot capture:', { url, deviceConfig, delay })
  
  // Initialize storage if needed
  await storageService.init()
  
  // Create session if needed
  if (!sessionId) {
    const session = await storageService.createSession()
    sessionId = session.id
  }

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    })
    
    console.log('Browser launched')
    
    const page = await browser.newPage()
    console.log('New page created')

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
    })
    
    if (!response) {
      throw new Error('Failed to get page response')
    }
    
    if (!response.ok()) {
      throw new Error(`Page responded with status ${response.status()}: ${response.statusText()}`)
    }
    
    console.log('Navigation complete. Status:', response.status())
    
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

    // Hide any elements specified in hideSelectors
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

    /**
     * Extract link data, including bounding rectangle
     */
    console.log('Collecting links...')
    const links = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a'))
      return elements.map(el => {
        const rect = el.getBoundingClientRect()
        return {
          href: el.href,
          text: el.innerText,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        }
      })
    })
    console.log('Captured links:', JSON.stringify(links, null, 2))

    // Take screenshot
    console.log('Taking screenshot')
    const rawBuffer = await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 100 // Capture at max quality, then optimize
    }) as Buffer
    console.log('Screenshot taken, raw buffer size:', rawBuffer.length)

    // Process and optimize image
    console.log('Processing image...')
    const processedBuffer = await processImage(rawBuffer, {
      maxDimension,
      quality,
      maxFileSize
    })
    console.log('Image processed, final size:', processedBuffer.length)

    // Save to storage
    console.log('Saving to storage...')
    const file = await storageService.saveFile(sessionId, processedBuffer, {
      url,
      title: await page.title(),
      deviceConfig,
      timestamp: new Date().toISOString(),
      dimensions: await sharp(processedBuffer).metadata(),
      links, // <--- storing captured link data
      ...(profile && { profileData: profile })
    })
    console.log('Saved to storage:', file.path)

    const screenshot: Screenshot = {
      id: file.filename.replace('.jpg', ''),
      url,
      title: await page.title(),
      createdAt: file.createdAt,
      imageData: processedBuffer,
      metadata: {
        device: deviceConfig.name,
        viewport: {
          width: deviceConfig.width,
          height: deviceConfig.height
        },
        storagePath: file.path,
        sessionId: sessionId,
        links, // <--- placing it in Screenshot's metadata
        ...(profile && { 
          profileData: {
            name: profile.url,
            description: `Response: ${profile.response.status}, Resources: ${profile.metrics.totalResources}`,
            settings: {
              needsAuthentication: profile.recommendations.needsAuthentication,
              needsCookieHandling: profile.recommendations.needsCookieHandling,
              suggestedDelay: profile.recommendations.suggestedDelay
            }
          }
        })
      }
    }

    return screenshot
  } catch (error) {
    console.error('Screenshot capture error:', error)
    throw error
  } finally {
    if (browser) {
      console.log('Closing browser')
      await browser.close()
    }
  }
}

// Export storage service for direct access if needed
export const screenshotStorage = storageService