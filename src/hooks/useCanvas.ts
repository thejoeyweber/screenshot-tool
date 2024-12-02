/**
 * Canvas hook
 * Manages canvas operations and state
 */
import { useRef, useCallback } from 'react'

interface CanvasOptions {
  width?: number
  height?: number
}

export function useCanvas(options: CanvasOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = options.width || canvas.offsetWidth
    canvas.height = options.height || canvas.offsetHeight

    contextRef.current = ctx
  }, [options.width, options.height])

  const clearCanvas = useCallback(() => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  return {
    canvasRef,
    contextRef,
    initCanvas,
    clearCanvas,
  }
} 