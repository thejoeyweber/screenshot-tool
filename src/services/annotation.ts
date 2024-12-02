/**
 * Annotation service
 * Handles annotation operations and persistence
 */
import type { Annotation } from '@/types/screenshot'

export async function saveAnnotations(screenshotId: string, annotations: Annotation[]): Promise<void> {
  // Implementation will be added
  throw new Error('Not implemented')
}

export async function loadAnnotations(screenshotId: string): Promise<Annotation[]> {
  // Implementation will be added
  throw new Error('Not implemented')
}

export async function deleteAnnotation(screenshotId: string, annotationId: string): Promise<void> {
  // Implementation will be added
  throw new Error('Not implemented')
} 