'use client'

import { useState, useRef, useEffect } from 'react'
import type { Screenshot } from '@/types/screenshot'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import Image from 'next/image'

interface ImagePreviewProps {
  screenshot: Screenshot
  onClose?: () => void
  controls?: {
    zoom?: boolean
    pan?: boolean
    fullscreen?: boolean
  }
  onPrevious?: () => void
  onNext?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
}

export function ImagePreview({ 
  screenshot, 
  onClose, 
  controls = {}, 
  onPrevious,
  onNext,
  hasNext,
  hasPrevious
}: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [maxWidth, setMaxWidth] = useState<string>('100%')

  useEffect(() => {
    const updateMaxWidth = () => {
      if (!imageRef.current || !isFullscreen) {
        setMaxWidth('100%')
        return
      }

      const naturalWidth = imageRef.current.naturalWidth
      const screenWidth = window.innerWidth
      if (naturalWidth < screenWidth) {
        setMaxWidth(`${naturalWidth}px`)
      } else {
        setMaxWidth('100vw')
      }
    }

    updateMaxWidth()
    window.addEventListener('resize', updateMaxWidth)
    return () => window.removeEventListener('resize', updateMaxWidth)
  }, [isFullscreen])

  const handleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Get the image path from the screenshot
  const imagePath = screenshot.metadata?.sessionId && screenshot.id
    ? `/api/screenshot?id=${screenshot.id}&sessionId=${screenshot.metadata.sessionId}`
    : null

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black/5 rounded-lg ${
        isFullscreen ? 'w-screen h-screen flex items-start justify-center' : 'w-full h-full'
      }`}
    >
      <div 
        className="relative h-full"
        style={{ width: maxWidth }}
      >
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
          centerOnInit={false}
          alignmentAnimation={{ disabled: true }}
          wheel={{ 
            disabled: true // Disable wheel zoom to allow natural scrolling
          }}
          doubleClick={{ 
            disabled: false,
            mode: "zoomIn"
          }}
          panning={{ disabled: false }}
        >
          {({ zoomIn, zoomOut, resetTransform, instance }) => (
            <>
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {/* Navigation Controls */}
                {(onPrevious || onNext) && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`${!hasPrevious ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={onPrevious}
                      disabled={!hasPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`${!hasNext ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={onNext}
                      disabled={!hasNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Zoom Controls */}
                {controls.zoom && (
                  <>
                    <Button variant="outline" size="icon" onClick={() => zoomOut()}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => zoomIn()}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => resetTransform()}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    {controls.fullscreen && (
                      <Button variant="outline" size="icon" onClick={handleFullscreen}>
                        {isFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                  overflow: instance.transformState.scale === 1 ? "auto" : "hidden"
                }}
              >
                <div className="min-h-full flex flex-col items-center">
                  {imagePath ? (
                    <Image
                      ref={imageRef as React.RefObject<HTMLImageElement>}
                      src={imagePath}
                      alt={screenshot.title || screenshot.url}
                      className="w-full h-auto object-contain"
                      draggable={false}
                      style={{ 
                        maxWidth: '100%',
                        alignSelf: 'flex-start'
                      }}
                      width={1920}
                      height={1080}
                      priority
                      unoptimized // Since we're dealing with dynamic screenshots
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image available
                    </div>
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  )
} 