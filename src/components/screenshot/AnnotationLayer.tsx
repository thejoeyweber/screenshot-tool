/**
 * Annotation layer component
 * Manages and renders annotations over the screenshot
 */
'use client'

import { useEffect, useRef } from 'react'
import type { Annotation } from '@/types/screenshot'

interface AnnotationLayerProps {
  annotations: Annotation[]
  onAnnotationChange?: (annotations: Annotation[]) => void
}

export function AnnotationLayer({ annotations, onAnnotationChange }: AnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Canvas initialization and annotation rendering will be added here
  }, [annotations])

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
    />
  )
} 