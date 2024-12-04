/**
 * Screenshot Capture Page
 * 
 * Purpose: Main page for configuring and capturing screenshots
 * Functionality: Device selection, capture settings, preview, and batch processing
 */
'use client'

import { useState } from 'react'
import { ImagePreview } from '@/components/screenshot/ImagePreview'
import { CaptureSettings } from '@/components/screenshot/CaptureSettings'
import { ElementHider } from '@/components/screenshot/ElementHider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { deviceConfigs } from '@/config/devices'
import type { Screenshot, DeviceConfig } from '@/types/screenshot'
import { Camera, Loader2 } from 'lucide-react'
import { validateUrl } from '@/services/url-validation'

export default function ScreenshotPage() {
  // Capture settings state
  const [url, setUrl] = useState('')
  const [device, setDevice] = useState<DeviceConfig>(deviceConfigs.desktop)
  const [delay, setDelay] = useState(1000)
  const [hideSelectors, setHideSelectors] = useState<string[]>([])
  
  // Processing state
  const [isCapturing, setIsCapturing] = useState(false)
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const captureScreenshot = async () => {
    if (!url) return
    
    setIsCapturing(true)
    setError(null)
    
    try {
      // Validate URL first
      const validation = validateUrl(url)
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid URL')
      }

      const normalizedUrl = validation.normalizedUrl || url
      
      const params = new URLSearchParams({
        url: normalizedUrl,
        device: device.name,
        delay: delay.toString(),
        ...(hideSelectors.length > 0 && { 
          hideSelectors: hideSelectors.join(',')
        })
      })
      
      const response = await fetch(`/api/screenshot/capture?${params}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to capture screenshot')
      }
      
      // Get headers for metadata
      const id = response.headers.get('X-Screenshot-ID')
      const sessionId = response.headers.get('X-Session-ID')
      const storagePath = response.headers.get('X-Storage-Path')
      
      // Get image data
      const buffer = await response.arrayBuffer()
      const imageData = Buffer.from(buffer)
      
      setScreenshot({
        id: id || Date.now().toString(),
        url: normalizedUrl,
        title: normalizedUrl,
        createdAt: new Date(),
        imageData,
        metadata: {
          device: device.name,
          viewport: {
            width: device.width,
            height: device.height
          },
          storagePath: storagePath || undefined,
          sessionId: sessionId || undefined
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Screenshot error:', err)
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <main className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center">
      <div className="container py-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Screenshot Capture</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCapturing) {
                      e.preventDefault()
                      captureScreenshot()
                    }
                  }}
                />
                <Button
                  onClick={captureScreenshot}
                  disabled={!url || isCapturing}
                >
                  {isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <span className="ml-2">Capture</span>
                </Button>
              </div>
            </div>

            <Separator />

            <CaptureSettings
              device={device}
              delay={delay}
              onDeviceChange={setDevice}
              onDelayChange={setDelay}
            />

            <Separator />

            <ElementHider
              selectors={hideSelectors}
              onSelectorsChange={setHideSelectors}
            />

            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
          </Card>

          {/* Preview Panel */}
          <Card className="p-6">
            {screenshot ? (
              <ImagePreview
                screenshot={screenshot}
                onClose={() => setScreenshot(null)}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                No screenshot captured yet
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
} 