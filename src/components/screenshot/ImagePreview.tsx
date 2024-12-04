import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Screenshot } from '@/types/screenshot'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react'

interface ImagePreviewProps {
  screenshot: Screenshot
  onClose?: () => void
}

export function ImagePreview({ screenshot, onClose }: ImagePreviewProps) {
  const [scale, setScale] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3))
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))
  const toggleFullscreen = () => setIsFullscreen(f => !f)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`relative ${
          isFullscreen ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : 'w-full h-full'
        }`}
      >
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            disabled={scale >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <motion.div
          className={`relative overflow-hidden ${
            isFullscreen ? 'w-screen h-screen' : 'w-full aspect-auto'
          }`}
        >
          <motion.div
            drag
            dragConstraints={{
              top: -200,
              left: -200,
              right: 200,
              bottom: 200
            }}
            dragElastic={0.1}
            style={{ scale }}
            className="relative w-full h-full"
          >
            <img
              src={`data:image/jpeg;base64,${screenshot.imageData.toString('base64')}`}
              alt={screenshot.title}
              className="w-full h-full object-contain"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 