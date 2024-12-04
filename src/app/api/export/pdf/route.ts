import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'

export async function POST(request: Request) {
  try {
    const { screenshots, options } = await request.json()
    console.log('PDF export request received:', { screenshotCount: screenshots.length })
    
    const timestamp = new Date().toISOString().split('T')[0]
    const doc = new PDFDocument({ 
      autoFirstPage: false,
      compress: true
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
        // Add A4 cover page
        doc.addPage({
          size: 'A4',
          margin: 50
        })
        
        // Title
        doc.fontSize(24)
        doc.text('Screenshot Report', {
          align: 'center'
        })
        doc.moveDown()
        
        // Subtitle
        doc.fontSize(12)
        doc.text(`Generated on ${new Date().toLocaleString()}`, {
          align: 'center'
        })
        doc.moveDown()
        
        // Count
        doc.text(`Total Screenshots: ${screenshots.length}`, {
          align: 'center'
        })

        console.log('Processing screenshots...')
        // Add screenshots
        screenshots.forEach((screenshot: any, index: number) => {
          try {
            console.log(`Processing screenshot ${index + 1}...`)
            // Validate image data
            if (!screenshot.imageData) {
              throw new Error('Missing image data')
            }

            const { width, height } = screenshot.metadata.viewport

            // Add page with screenshot dimensions
            doc.addPage({
              size: [width, height],
              margin: 0
            })

            // Add screenshot at full size
            const imageBuffer = Buffer.from(screenshot.imageData, 'base64')
            doc.image(imageBuffer, 0, 0, {
              width // Only specify width to maintain aspect ratio
            })
            
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
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
} 