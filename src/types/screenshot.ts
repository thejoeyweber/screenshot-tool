/**
 * Type definitions for screenshot functionality
 * Contains interfaces and types for screenshot related features
 */

export interface DeviceConfig {
  name: string
  width: number
  height: number
  deviceScaleFactor: number
  isMobile: boolean
}

/**
 * Defines the shape for each link discovered on the webpage
 */
export interface LinkMetadata {
  href: string
  text: string
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface ProfileData {
  name?: string
  description?: string
  settings?: {
    [key: string]: string | number | boolean
  }
}

export interface Screenshot {
  id: string
  url: string
  title: string
  createdAt: Date
  imageData: Buffer
  metadata: {
    device: string
    viewport: {
      width: number
      height: number
    }
    storagePath?: string
    sessionId?: string
    profileData?: ProfileData
    /**
     * Array of link metadata discovered on the webpage
     */
    links?: LinkMetadata[]
  }
  annotations?: Annotation[]
}

export interface Annotation {
  id: string
  type: 'text' | 'arrow' | 'rectangle' | 'highlight'
  position: { x: number; y: number }
  content?: string
  style?: {
    color: string
    size: number
  }
}

export type CaptureStatus = 'pending' | 'processing' | 'success' | 'error'

export interface CaptureProgress {
  status: CaptureStatus
  url: string
  message?: string
  retryCount?: number
  timestamp: Date
}