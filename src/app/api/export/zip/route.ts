import { NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(request: Request) {
  try {
    const { screenshots, options } = await request.json()
    console.log('ZIP export request received:', { screenshotCount: screenshots.length })
    
    const timestamp = new Date().toISOString().split('T')[0]
    const zip = new JSZip()
    
    // Add a single metadata.json with all screenshots info
    const metadata = screenshots.map((screenshot: any, index: number) => ({
      id: screenshot.id,
      url: screenshot.url,
      title: screenshot.title,
      createdAt: screenshot.createdAt,
      device: screenshot.metadata.device,
      viewport: screenshot.metadata.viewport,
      filename: `screenshot-${index + 1}.jpg`
    }))
    
    // Add screenshots
    screenshots.forEach((screenshot: any, index: number) => {
      const filename = `screenshot-${index + 1}.jpg`
      zip.file(filename, Buffer.from(screenshot.imageData, 'base64'))
    })

    // Add single metadata file
    if (options.metadata) {
      zip.file('metadata.json', JSON.stringify({
        exportDate: new Date().toISOString(),
        totalScreenshots: screenshots.length,
        screenshots: metadata
      }, null, 2))
    }

    console.log('Generating ZIP file...')
    const blob = await zip.generateAsync({ type: 'nodebuffer' })
    console.log('ZIP file generated, size:', blob.length)
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=screenshots-${timestamp}.zip`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
} 