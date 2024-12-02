/**
 * Analytics Configuration
 * Sets up and exports analytics tracking
 */

type EventName = 'page_view' | 'screenshot_capture' | 'annotation_create' | 'export'
type EventProperties = Record<string, unknown>

class Analytics {
  private static instance: Analytics
  
  private constructor() {
    // Initialize analytics service
  }

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics()
    }
    return Analytics.instance
  }

  public trackEvent(name: EventName, properties?: EventProperties): void {
    // TODO: Implement event tracking
    console.log('Track event:', name, properties)
  }

  public trackPageView(path: string): void {
    this.trackEvent('page_view', { path })
  }
}

export const analytics = Analytics.getInstance() 