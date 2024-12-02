/**
 * Monitoring Configuration
 * Sets up error tracking and performance monitoring
 */

interface ErrorWithContext extends Error {
  context?: Record<string, unknown>
}

class Monitoring {
  private static instance: Monitoring

  private constructor() {
    // Initialize monitoring service
  }

  public static getInstance(): Monitoring {
    if (!Monitoring.instance) {
      Monitoring.instance = new Monitoring()
    }
    return Monitoring.instance
  }

  public captureError(error: ErrorWithContext): void {
    // TODO: Implement error tracking
    console.error('Error captured:', error, error.context)
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error'): void {
    // TODO: Implement message tracking
    console.log(`[${level}]`, message)
  }

  public startSpan(name: string): () => void {
    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      console.log(`Span ${name} completed in ${duration}ms`)
    }
  }
}

export const monitoring = Monitoring.getInstance() 