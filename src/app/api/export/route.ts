import { NextRequest, NextResponse } from 'next/server'
import { StorageService } from '@/services/storage'
import type { StorageFile } from '@/types/storage'
import PDFDocument from 'pdfkit'
import JSZip from 'jszip'
import sharp from 'sharp'

const VALID_FORMATS = ['pdf', 'zip'] as const
type ExportFormat = typeof VALID_FORMATS[number]

function isValidFormat(format: unknown): format is ExportFormat {
  return typeof format === 'string' && VALID_FORMATS.includes(format as ExportFormat)
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  console.log('Export route handler starting...')
  
  try {
    const format = request.nextUrl.searchParams.get('format')
    console.log('Format parameter:', format)

    if (!format || !isValidFormat(format)) {
      console.log('Invalid format detected')
      return NextResponse.json(
        { error: `Invalid format: ${format}. Must be one of: ${VALID_FORMATS.join(', ')}` },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    const { sessionId, options = {} } = body

    const storage = await StorageService.getInstance()
    const session = await storage.getSession(sessionId)
    
    if (!session) {
      console.log('Session not found:', sessionId)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const files = await storage.getSessionFiles(sessionId)
    console.log(`Processing ${files.length} files for ${format} export`)
    console.log('Files to process:', files.map(f => ({ filename: f.filename, size: f.size })))

    let response: NextResponse
    if (format === 'pdf') {
      console.log('Starting PDF export process')
      response = await handlePdfExport(files, storage, sessionId)
    } else {
      console.log('Starting ZIP export process')
      response = await handleZipExport(files, storage, sessionId, options)
    }

    console.log('Export completed successfully')
    return response
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

async function handlePdfExport(files: StorageFile[], storage: StorageService, sessionId: string) {
  console.log('PDF export: Initializing...')
  const timestamp = new Date().toISOString().split('T')[0]
  const doc = new PDFDocument({ 
    autoFirstPage: false,
    compress: true
  })
  
  try {
    console.log('PDF export: Setting up document')
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => {
        console.log('PDF export: Document generation completed')
        resolve(Buffer.concat(chunks))
      })
      doc.on('error', (err) => {
        console.error('PDF export: Document generation error', err)
        reject(err)
      })

      // Add cover page
      console.log('PDF export: Adding cover page')
      doc.addPage({ size: 'A4', margin: 50 })
      doc.fontSize(24).text('Screenshot Report', { align: 'center' })
      doc.moveDown()
      doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' })
      doc.moveDown()

      // Process files
      console.log('PDF export: Processing files')
      const processFiles = async () => {
        for (const file of files) {
          try {
            console.log(`PDF export: Processing file ${file.filename}`)
            const imageBuffer = await storage.getFile(sessionId, file.filename)
            
            // Get image dimensions from metadata or measure the buffer
            const dimensions = await sharp(imageBuffer).metadata()
            const width = dimensions.width || 1920
            const height = dimensions.height || 1080

            // Add a new page with exact screenshot dimensions
            doc.addPage({
              size: [width, height],
              margin: 0
            })

            // Render image at full size without any scaling
            doc.image(imageBuffer, 0, 0, {
              width,
              height,
              align: 'center',
              valign: 'center'
            })

            console.log(`PDF export: File ${file.filename} processed successfully`)
          } catch (err) {
            console.error(`PDF export: Error processing file ${file.filename}:`, err)
          }
        }
        console.log('PDF export: All files processed, finalizing document')
        doc.end()
      }

      processFiles().catch(err => {
        console.error('PDF export: Error in file processing:', err)
        reject(err)
      })
    })

    console.log('PDF export: Awaiting document generation')
    const pdfBuffer = await pdfPromise
    console.log('PDF export: Document generated, size:', pdfBuffer.length)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="screenshots-${timestamp}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('PDF export: Fatal error:', error)
    throw error
  }
}

interface ExportMetadata {
  filename: string
  createdAt: Date
  metadata: Record<string, unknown>
}

async function handleZipExport(files: StorageFile[], storage: StorageService, sessionId: string, options: { metadata?: boolean }) {
  console.log('ZIP export: Initializing...')
  const timestamp = new Date().toISOString().split('T')[0]
  const zip = new JSZip()
  
  try {
    const metadata: ExportMetadata[] = []
    console.log('ZIP export: Processing files')
    for (const file of files) {
      try {
        console.log(`ZIP export: Processing file ${file.filename}`)
        const imageBuffer = await storage.getFile(sessionId, file.filename)
        zip.file(file.filename, imageBuffer)
        metadata.push({
          filename: file.filename,
          createdAt: file.createdAt,
          metadata: file.metadata || {}
        })
        console.log(`ZIP export: File ${file.filename} processed successfully`)
      } catch (err) {
        console.error(`ZIP export: Error processing file ${file.filename}:`, err)
      }
    }

    if (options.metadata) {
      console.log('ZIP export: Adding metadata file')
      zip.file('metadata.json', JSON.stringify({
        exportDate: new Date().toISOString(),
        sessionId,
        totalScreenshots: files.length,
        screenshots: metadata
      }, null, 2))
    }

    console.log('ZIP export: Generating final archive')
    const blob = await zip.generateAsync({ type: 'nodebuffer' })
    console.log('ZIP export: Archive generated, size:', blob.length)

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="screenshots-${timestamp}.zip"`,
        'Content-Length': blob.length.toString()
      }
    })
  } catch (error) {
    console.error('ZIP export: Fatal error:', error)
    throw error
  }
} 