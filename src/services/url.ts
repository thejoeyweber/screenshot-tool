/**
 * URL Service
 * 
 * Purpose: URL validation, normalization, and management
 */

export interface UrlValidationResult {
  isValid: boolean
  error?: string
  originalUrl: string
  normalizedUrl?: string
}

export function normalizeUrl(url: string): string {
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }

    const parsed = new URL(url)
    
    // Add www if not present and is a domain
    if (!parsed.hostname.startsWith('www.') && !parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      parsed.hostname = `www.${parsed.hostname}`
    }

    // Remove trailing slash
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return url
  }
}

export function validateUrl(url: string): UrlValidationResult {
  try {
    const originalUrl = url
    const normalizedUrl = normalizeUrl(url)
    
    // Validate URL format
    new URL(normalizedUrl)

    // Basic validation checks
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      return {
        isValid: false,
        error: 'URL must start with http:// or https://',
        originalUrl
      }
    }

    return {
      isValid: true,
      originalUrl,
      normalizedUrl
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
      originalUrl: url
    }
  }
}

export function isSameUrl(url1: string, url2: string): boolean {
  try {
    const normalized1 = normalizeUrl(url1)
    const normalized2 = normalizeUrl(url2)
    return normalized1 === normalized2
  } catch {
    return false
  }
}

export function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url))
    return `${parsed.protocol}//${parsed.hostname}`
  } catch {
    return url
  }
} 