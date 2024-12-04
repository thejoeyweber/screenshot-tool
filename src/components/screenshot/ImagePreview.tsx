'use client'

import { useState } from 'react'
import type { Screenshot } from '@/types/screenshot'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

interface ImagePreviewProps {
  screenshot: Screenshot
  onClose?: () => void
  controls?: {
    zoom?: boolean
    pan?: boolean
    fullscreen?: boolean
  }
}

export function ImagePreview({ screenshot, onClose, controls = {} }: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black/5 rounded-lg">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit
        wheel={{ disabled: !controls.zoom }}
        panning={{ disabled: !controls.pan }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {controls.zoom && (
              <div className="absolute bottom-2 right-2 z-10 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => zoomOut()}>
                  Zoom Out
                </Button>
                <Button variant="ghost" size="sm" onClick={() => zoomIn()}>
                  Zoom In
                </Button>
                <Button variant="ghost" size="sm" onClick={() => resetTransform()}>
                  Reset
                </Button>
                {controls.fullscreen && (
                  <Button variant="ghost" size="sm" onClick={handleFullscreen}>
                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  </Button>
                )}
              </div>
            )}
            <TransformComponent>
              <img
                src={`data:image/jpeg;base64,${screenshot.imageData.toString('base64')}`}
                alt={screenshot.title || screenshot.url}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  )
} 