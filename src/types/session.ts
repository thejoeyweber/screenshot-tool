/**
 * Session Types
 * 
 * Purpose: Type definitions for URL sessions and project metadata
 */

import type { Screenshot } from '@/types/screenshot'
import type { Annotation } from './screenshot'

export interface ProjectMetadata {
  name: string
  description?: string
  template: string
  saveProject: boolean
}

export interface UrlSession {
  baseUrl: string
  urls: string[]
  timestamp: number
  metadata?: ProjectMetadata
  config?: {
    deviceConfig?: string
    delay?: number
    hideSelectors?: string[]
    maxDimension?: number
    quality?: number
    maxFileSize?: number
  }
  results?: {
    order?: string[]
    screenshots?: Screenshot[]
    annotations?: Record<string, Annotation[]>
  }
  currentJobId?: string
}

export interface SitemapUrl {
  loc: string
  lastmod?: string
  priority?: number
  changefreq?: string
}

export interface SitemapResult {
  urls: SitemapUrl[]
  error?: string
  errorType?: string
  availableSitemaps?: string[]
  hasMoreOptions?: boolean
} 