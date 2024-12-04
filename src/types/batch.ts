import type { Screenshot, DeviceConfig } from './screenshot'
import type { SiteProfile } from './site-profile'

export interface BatchConfig {
  deviceConfig: DeviceConfig
  delay?: number
  hideSelectors?: string[]
  maxDimension?: number
  quality?: number
  maxFileSize?: number
}

export interface BatchJob {
  id: string
  urls: string[]
  config: BatchConfig
  profile?: SiteProfile
  sessionId?: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  results: Screenshot[]
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface BatchJobUpdate {
  status?: BatchJob['status']
  progress?: number
  results?: Screenshot[]
  error?: string
} 