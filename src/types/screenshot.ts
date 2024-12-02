/**
 * Type definitions for screenshot functionality
 * Contains interfaces and types for screenshot related features
 */

export interface Screenshot {
  id: string
  url: string
  createdAt: Date
  annotations?: Annotation[]
}

export interface Annotation {
  id: string
  type: 'text' | 'arrow' | 'rectangle' | 'highlight'
  position: { x: number; y: number }
  // Additional properties will be added based on annotation type
} 