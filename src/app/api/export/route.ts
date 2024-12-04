import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import PDFDocument from 'pdfkit'

export async function POST(request: Request) {
  try {
    const { screenshots, options } = await request.json()
    console.log('Export request received:', { 
      format: options.format, 
      screenshotCount: screenshots.length 
    })
    
    const timestamp = new Date().toISOString().split('T')[0]
    
    if (options.format === 'zip') {
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
    } else {
      console.log('Starting PDF generation...')
      const doc = new PDFDocument({ 
        autoFirstPage: false,
        size: 'A4',
        margin: 50,
        bufferPages: true
      })
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => {
          console.log('PDF generation completed')
          const pdfBuffer = Buffer.concat(chunks)
          console.log('PDF size:', pdfBuffer.length)
          resolve(new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=screenshots-${timestamp}.pdf`
            }
          }))
        })
        doc.on('error', (err) => {
          console.error('PDF generation error:', err)
          reject(err instanceof Error ? err : new Error('PDF generation failed'))
        })

        try {
          console.log('Adding cover page...')
          // Add cover page
          doc.addPage()
          doc.fontSize(24).text('Screenshot Report', { align: 'center' })
          doc.moveDown()
          doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' })
          doc.moveDown()
          doc.text(`Total Screenshots: ${screenshots.length}`, { align: 'center' })
          doc.moveDown(2)

          console.log('Processing screenshots...')
          // Add screenshots
          screenshots.forEach((screenshot: any, index: number) => {
            try {
              console.log(`Processing screenshot ${index + 1}...`)
              // Validate image data
              if (!screenshot.imageData) {
                throw new Error('Missing image data')
              }
              
              // Calculate dimensions to fit on A4
              const maxWidth = 500 // A4 width minus margins
              const maxHeight = 700 // A4 height minus margins
              const scale = Math.min(
                maxWidth / screenshot.metadata.viewport.width,
                maxHeight / screenshot.metadata.viewport.height
              )
              const width = screenshot.metadata.viewport.width * scale
              const height = screenshot.metadata.viewport.height * scale

              console.log(`Adding screenshot ${index + 1} to PDF...`)
              // Add screenshot
              doc.addPage()
              const imageBuffer = Buffer.from(screenshot.imageData, 'base64')
              doc.image(imageBuffer, {
                fit: [width, height],
                align: 'center',
                valign: 'center'
              })

              // Add metadata if requested
              if (options.metadata) {
                doc.moveDown()
                doc.fontSize(14).text(`Screenshot ${index + 1} Details`, { align: 'center' })
                doc.moveDown()
                doc.fontSize(10)
                doc.text(`URL: ${screenshot.url}`)
                doc.text(`Title: ${screenshot.title}`)
                doc.text(`Captured: ${new Date(screenshot.createdAt).toLocaleString()}`)
                doc.text(`Device: ${screenshot.metadata.device}`)
                doc.text(`Viewport: ${screenshot.metadata.viewport.width}x${screenshot.metadata.viewport.height}`)
              }
              
              console.log(`Screenshot ${index + 1} added successfully`)
            } catch (err: unknown) {
              console.error(`Error processing screenshot ${index + 1}:`, err)
              doc.text(`Error processing screenshot ${index + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
          })

          console.log('Finalizing PDF...')
          doc.end()
        } catch (err: unknown) {
          console.error('Error in PDF generation:', err)
          reject(err instanceof Error ? err : new Error('Unknown error in PDF generation'))
        }
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
} 