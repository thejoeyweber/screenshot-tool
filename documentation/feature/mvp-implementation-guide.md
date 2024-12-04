# MVP Web Screenshot Tool - Implementation Guide

> This document provides detailed technical guidance for implementing MVP features. For a quick overview of feature completion status, see `/docs/mvp-feature-checklist.md`.

## Current Progress

### Completed Features
- Basic screenshot capture with Puppeteer ✓
- Device emulation profiles ✓
- Element hiding via CSS selectors ✓
- Dynamic content delays ✓
- Image optimization and processing ✓
- URL validation and sitemap processing ✓
- Basic batch processing types and structure ✓
- Parallel processing with chunk size of 3 ✓
- Resource monitoring and management ✓
- Storage service with singleton pattern ✓
- Directory caching and optimization ✓
- Modern UI with real-time updates ✓

## Priority Implementation Tasks

### 1. Complete User Flow Integration
```typescript
// Required State Management
interface SessionState {
  sessionId: string
  currentStep: 'sitemap' | 'setup' | 'config' | 'generate' | 'customize' | 'download'
  urls: string[]
  config: BatchConfig
  results?: Screenshot[]
}

// Route Structure
const routes = {
  home: '/',
  sitemap: '/sitemap?url={url}',
  setup: '/setup?session={session_id}',
  config: '/config',
  generate: '/generate',
  customize: '/customize',
  download: '/download'
}

// Required Components per Route:
// - /sitemap: URL Tree + Selection (✓)
// - /setup: Session Creation + Basic Config
// - /config: Device/Capture Settings
// - /generate: Batch Process UI (✓)
// - /customize: Results Preview
// - /download: Export Options
```

### 2. Error Recovery System
```typescript
interface ErrorRecovery {
  retryStrategy: 'immediate' | 'backoff' | 'manual'
  maxRetries: number
  backoffInterval: number
  onRetry: (error: Error, attempt: number) => Promise<void>
  cleanup: () => Promise<void>
}
```

## Implementation Order
1. Complete user flow route structure
2. Implement session state management
3. Build remaining page components
4. Add error recovery system
5. Test end-to-end flow

## Testing Criteria
- Complete flow from URL input to download works
- Session state persists between routes
- Batch processing handles large jobs ✓
- Resource usage stays within limits ✓
- Errors are properly handled and reported ✓