export interface SiteProfile {
  url: string
  finalUrl: string
  timing: {
    fetchStart: number
    fetchEnd: number
    totalTime: number
  }
  response: {
    status: number
    headers: Record<string, string>
    isHtml: boolean
    contentLength?: number
  }
  security: {
    hasCSP: boolean
    hasCORS: boolean
    hasXFrameOptions: boolean
  }
  features: {
    hasCookieConsent: boolean
    hasAuthentication: boolean
    hasServiceWorker: boolean
    hasAds: boolean
    hasAnalytics: boolean
  }
  metrics: {
    initialHeight?: number
    initialWidth?: number
    scripts: number
    images: number
    fonts: number
    totalResources: number
  }
  recommendations: {
    suggestedDelay: number
    needsAuthentication: boolean
    needsCookieHandling: boolean
    isComplexPage: boolean
    warnings: string[]
  }
} 