/**
 * Device Configurations
 * 
 * Purpose: Defines device presets for screenshot capture
 * Note: This file is safe for client-side imports
 */

import type { DeviceConfig } from '@/types/screenshot'

export const deviceConfigs = {
  desktop: {
    name: 'Desktop',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false
  },
  tablet: {
    name: 'Tablet',
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    isMobile: true
  },
  mobile: {
    name: 'Mobile',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true
  }
} as const

export type DeviceName = keyof typeof deviceConfigs 