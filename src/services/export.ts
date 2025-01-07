/**
 * Export service
 * Handles exporting screenshots with annotations
 */
import type { Screenshot } from '@/types/screenshot'
import JSZip from 'jszip'
import PDFDocument from 'pdfkit'

interface ExportOptions {
  format: 'pdf' | 'zip'
  quality?: number
  metadata?: boolean
}

export async function exportScreenshots(
  screenshots: Screenshot[],
  options: ExportOptions
): Promise<Blob> {
  if (options.format === 'zip') {
    return exportAsZip(screenshots, options)
  } else {
    return exportAsPdf(screenshots, options)
  }
}

async function exportAsZip(
  screenshots: Screenshot[],
  options: ExportOptions
): Promise<Blob> {
  const zip = new JSZip()
  
  screenshots.forEach((screenshot, index) => {
    const filename = `screenshot-${index + 1}.jpg`
    zip.file(filename, screenshot.imageData)

    if (options.metadata) {
      const metadata = {
        url: screenshot.url,
        title: screenshot.title,
        createdAt: screenshot.createdAt,
        device: screenshot.metadata.device,
        viewport: screenshot.metadata.viewport,
        links: screenshot.metadata.links || []
      }
      zip.file(`screenshot-${index + 1}.json`, JSON.stringify(metadata, null, 2))
    }
  })

  return zip.generateAsync({ type: 'blob' })
}

async function exportAsPdf(
  screenshots: Screenshot[],
  options: ExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false })
    const chunks: Buffer[] = []

    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => resolve(new Blob(chunks, { type: 'application/pdf' })))
    doc.on('error', reject)

    // Add cover page
    doc.addPage()
    doc.fontSize(24).text('Screenshot Report', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' })
    doc.moveDown(2)

    // Add screenshots
    screenshots.forEach((screenshot, index) => {
      // First page with the screenshot
      doc.addPage({
        size: [
          screenshot.metadata.viewport.width,
          screenshot.metadata.viewport.height
        ]
      })

      doc.image(screenshot.imageData, 0, 0, {
        fit: [
          screenshot.metadata.viewport.width,
          screenshot.metadata.viewport.height
        ]
      })

      // If metadata is requested, create a separate page summarizing info
      if (options.metadata) {
        doc.addPage()
        doc.fontSize(14).text(`Screenshot ${index + 1} Details`, { align: 'center' })
        doc.moveDown()
        doc.fontSize(12)
        doc.text(`URL: ${screenshot.url}`)
        doc.text(`Title: ${screenshot.title}`)
        doc.text(`Captured: ${screenshot.createdAt.toLocaleString()}`)
        doc.text(`Device: ${screenshot.metadata.device}`)
        doc.text(`Viewport: ${screenshot.metadata.viewport.width}x${screenshot.metadata.viewport.height}`)

        // List out links found on the page
        doc.moveDown()
        doc.fontSize(12).text('Links discovered on page:', { underline: true })
        const foundLinks = screenshot.metadata.links || []
        if (foundLinks.length === 0) {
          doc.text('No links found.')
        } else {
          foundLinks.forEach((linkObj) => {
            // Create clickable link text
            const linkText = `${linkObj.text} (${linkObj.href})`
            const textOptions = {
              underline: true,
              color: 'blue'
            }
            
            // Get the current Y position
            const currentY = doc.y
            
            // Add the text first
            doc.text(linkText, {
              ...textOptions,
              continued: false
            })
            
            // Calculate text width and height
            const textWidth = doc.widthOfString(linkText)
            const textHeight = doc.currentLineHeight()
            
            // Add the link annotation
            doc.link(doc.x, currentY, textWidth, textHeight, linkObj.href)
            
            // Add some spacing
            doc.moveDown(0.5)
          })
        }
      }
    })

    doc.end()
  })
}

export async function exportAsImage(screenshot: Screenshot): Promise<Blob> {
  return new Blob([screenshot.imageData], { type: 'image/jpeg' })
}

export async function exportAsJSON(screenshot: Screenshot): Promise<string> {
  return JSON.stringify({
    url: screenshot.url,
    title: screenshot.title,
    createdAt: screenshot.createdAt,
    metadata: screenshot.metadata
  }, null, 2)
}

export async function shareScreenshot(screenshot: Screenshot): Promise<string> {
  // Implementation will be added
  throw new Error('Not implemented')
}