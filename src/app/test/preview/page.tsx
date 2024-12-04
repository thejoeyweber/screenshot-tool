'use client'

import { useState, useEffect } from 'react'
import { ImagePreview } from '@/components/screenshot/ImagePreview'
import { deviceConfigs } from '@/config/devices'
import type { Screenshot } from '@/types/screenshot'

export default function TestPreview() {
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null)

  useEffect(() => {
    // Get a test screenshot
    fetch('/api/screenshot/capture?url=https://example.com')
      .then(res => {
        const id = res.headers.get('X-Screenshot-ID')
        const sessionId = res.headers.get('X-Session-ID')
        return res.arrayBuffer().then(buffer => ({
          buffer,
          id,
          sessionId: sessionId || undefined
        }))
      })
      .then(({ buffer, id, sessionId }) => {
        setScreenshot({
          id: id || 'test',
          url: 'https://example.com',
          title: 'Test Screenshot',
          createdAt: new Date(),
          imageData: Buffer.from(buffer),
          metadata: {
            device: deviceConfigs.desktop.name,
            viewport: {
              width: deviceConfigs.desktop.width,
              height: deviceConfigs.desktop.height
            },
            sessionId
          }
        })
      })
  }, [])

  if (!screenshot) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="p-4 h-[600px]">
      <ImagePreview
        screenshot={screenshot}
        controls={{
          zoom: true,
          pan: true,
          fullscreen: true
        }}
      />
    </div>
  )
} 