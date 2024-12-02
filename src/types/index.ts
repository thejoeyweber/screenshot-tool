/**
 * Shared type definitions
 * Common types used across the application
 */

export * from './screenshot'

export type Theme = 'dark' | 'light' | 'system'

export interface BaseProps {
  className?: string
  children?: React.ReactNode
} 