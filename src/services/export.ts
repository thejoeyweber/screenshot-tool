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
        viewport: screenshot.metadata.viewport
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
      doc.addPage({
        size: [
          screenshot.metadata.viewport.width,
          screenshot.metadata.viewport.height
        ]
      })

      // Add screenshot
      doc.image(screenshot.imageData, 0, 0, {
        fit: [
          screenshot.metadata.viewport.width,
          screenshot.metadata.viewport.height
        ]
      })

      // Add metadata if requested
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