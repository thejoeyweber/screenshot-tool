/**
 * Annotation hook
 * Manages annotation state and operations
 */
import { useState, useCallback } from 'react'
import type { Annotation } from '@/types/screenshot'

export function useAnnotation() {
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation])
  }, [])

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ))
  }, [])

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id))
  }, [])

  return {
    annotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
  }
} 