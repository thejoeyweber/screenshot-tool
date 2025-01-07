/**
 * Screenshot Canvas Component
 * Handles rendering and interaction with screenshots
 */
'use client'

import { useEffect, useRef } from 'react'
import type { Screenshot } from '@/types/screenshot'
import type { Annotation } from '@/types/screenshot'

interface ScreenshotCanvasProps {
  screenshot: Screenshot
  onAnnotate?: (annotation: Annotation) => void
}

export const ScreenshotCanvas = ({ screenshot, onAnnotate }: ScreenshotCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Canvas initialization will be implemented
  }, [screenshot])

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full"
    />
  )
} 