'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Screenshot } from '@/types/screenshot'

export default function TestExport() {
  const [loading, setLoading] = useState(false)

  const getTestScreenshots = async () => {
    const urls = ['https://example.com', 'https://example.org']
    const screenshots: Screenshot[] = []

    for (const url of urls) {
      const response = await fetch(`/api/screenshot/capture?url=${url}`)
      const buffer = await response.arrayBuffer()
      const id = response.headers.get('X-Screenshot-ID')
      const sessionId = response.headers.get('X-Session-ID')

      screenshots.push({
        id: id || 'test',
        url,
        title: `Screenshot of ${url}`,
        createdAt: new Date(),
        imageData: Buffer.from(buffer),
        metadata: {
          device: 'desktop',
          viewport: {
            width: 1920,
            height: 1080
          },
          sessionId: sessionId || undefined
        }
      })
    }

    return screenshots
  }

  const handleExport = async (format: 'pdf' | 'zip') => {
    setLoading(true)
    try {
      const screenshots = await getTestScreenshots()
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          screenshots: screenshots.map(s => ({
            ...s,
            imageData: s.imageData.toString('base64')
          })),
          options: {
            format,
            metadata: true
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Get the blob and filename from response
      const blob = await response.blob()
      const disposition = response.headers.get('Content-Disposition')
      let filename = `screenshots.${format}`
      
      // Try to get filename from Content-Disposition
      if (disposition) {
        const matches = /filename=(.+)$/.exec(disposition)
        if (matches?.[1]) {
          filename = matches[1].replace(/["']/g, '')
        }
      }
      
      // Download the file
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-2">
        <Button onClick={() => handleExport('pdf')} disabled={loading}>
          Export as PDF
        </Button>
        <Button onClick={() => handleExport('zip')} disabled={loading}>
          Export as ZIP
        </Button>
      </div>
      
      {loading && (
        <div className="text-sm">Processing...</div>
      )}
    </div>
  )
} 