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

## Priority Implementation Tasks

### 1. Complete Batch Processing System
```typescript
// Existing foundation in src/types/batch.ts and src/services/batch.ts
// Need to implement:
interface BatchQueueManager {
  addJob(job: BatchJob): Promise<string>
  processQueue(): Promise<void>
  pauseJob(jobId: string): Promise<void>
  resumeJob(jobId: string): Promise<void>
  getStatus(jobId: string): Promise<BatchJobStatus>
}

interface ResourceMonitor {
  checkDiskSpace(): Promise<number>
  monitorMemory(): Promise<void>
  cleanup(): Promise<void>
}
```

### 2. User Flow Integration
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
// - /generate: Batch Process UI
// - /customize: Results Preview
// - /download: Export Options
```

### 3. Resource Management
```typescript
// Disk Management
interface StorageManager {
  checkSpace(): Promise<number>
  cleanup(age: number): Promise<void>
  getUsage(): Promise<{used: number, available: number}>
}

// Process Management
interface ProcessManager {
  maxConcurrent: number
  activeProcesses: number
  queueProcess(job: BatchJob): Promise<void>
  monitorResources(): Promise<void>
}
```

## Implementation Order
1. Complete user flow route structure
2. Implement session state management
3. Build remaining page components
4. Finish batch processing system
5. Add resource management
6. Implement error handling
7. Add progress tracking
8. Test end-to-end flow

## Testing Criteria
- Complete flow from URL input to download works
- Session state persists between routes
- Batch processing handles large jobs
- Resource usage stays within limits
- Errors are properly handled and reported