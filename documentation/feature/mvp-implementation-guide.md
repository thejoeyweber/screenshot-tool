# MVP Web Screenshot Tool - Implementation Guide

> This document provides detailed technical guidance for implementing MVP features. For a quick overview of feature completion status, see `/docs/mvp-feature-checklist.md`.

## Completed Features

### Screenshot Service
- Basic screenshot capture with Puppeteer ✓
- Device emulation profiles ✓
- Element hiding via CSS selectors ✓
- Dynamic content delays ✓
- Image optimization and processing ✓

### Storage Service
- Local filesystem storage ✓
- Session-based organization ✓
- Automatic cleanup ✓
- File metadata tracking ✓

### Frontend Components
- Device configuration UI ✓
- Delay settings UI ✓
- Element hiding UI ✓
- Basic image preview ✓

### API Routes
- Screenshot capture endpoint ✓
- URL profiling endpoint ✓
- Storage management endpoints ✓
- Test endpoints ✓

## Next Implementation Steps

### 1. Batch Processing
```typescript
// Types to Add (src/types/batch.ts):
interface BatchJob {
  urls: string[]
  config: {
    device: DeviceConfig
    delay: number
    hideSelectors: string[]
  }
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  results: Screenshot[]
}

// Service to Create (src/services/batch.ts):
class BatchService {
  queue: BatchJob[]
  processing: boolean
  
  async addJob(job: BatchJob): Promise<string>
  async processQueue(): Promise<void>
  async pauseProcessing(): Promise<void>
  async resumeProcessing(): Promise<void>
  async cancelJob(jobId: string): Promise<void>
}
```

### 2. Image Preview Enhancements
```typescript
// Components to Update:
// src/components/screenshot/ImagePreview.tsx
interface ImagePreviewProps {
  screenshot: Screenshot
  onClose?: () => void
  controls?: {
    zoom?: boolean
    pan?: boolean
    fullscreen?: boolean
  }
}
```

### 3. Error Recovery System
```typescript
// Types to Add (src/types/error.ts):
interface ErrorLog {
  id: string
  timestamp: Date
  type: 'capture' | 'storage' | 'processing'
  details: any
  retryCount: number
  resolved: boolean
}

// Service to Create (src/services/error-handling.ts):
class ErrorHandlingService {
  async logError(error: Error): Promise<ErrorLog>
  async retryOperation(errorId: string): Promise<void>
  async getErrorLogs(): Promise<ErrorLog[]>
}
```

## Development Guidelines

### Code Organization & Style
- Preserve existing page layouts and UI structure ✓
- Utilize shadcn components from `/components/ui/` ✓
- Never modify files in `/components/ui/` directory ✓
- Include clear file headers ✓

### Testing & Quality
- Write tests for new functionality
- Include error case handling ✓
- Add loading states ✓
- Ensure responsive design ✓
- Follow accessibility guidelines
- Test across different devices/browsers

## Overview
This document outlines the step-by-step implementation plan for the core screenshot capture functionality, focusing on the initial user flow from URL submission to download.

## Current State
- Basic Next.js 14 application structure
- Shadcn UI components integrated
- Layout system implemented
- Route structure established
- Database schema defined

## Data Flow

### URL Parameters & State Management
```typescript
// URL Flow
/ -> /?url=https://example.com
-> /sitemap?project=proj_123 
-> /setup?project=proj_123 
-> /config?project=proj_123 
-> /generate?project=proj_123 
-> /customize?project=proj_123 
-> /download?project=proj_123
```

### Database Operations
```typescript
// Initial Project Creation
interface ProjectCreation {
  project_id: string      // Generated with nanoid
  project_name: string    // "{domain} screenshots - {date}"
  user_id?: string       // Optional for MVP
  created_at: Date
}

// Media Entry for Website
interface WebsiteMedia {
  media_id: string
  project_id: string
  media_type: 'website'
  metadata: {
    url: string
    domain: string
    sitemap_urls: string[]
    selected_urls: string[]
    device_configs: {
      desktop?: DeviceConfig
      tablet?: DeviceConfig
      mobile?: DeviceConfig
    }
  }
}

// Screenshot Entries
interface ScreenshotEntry {
  screenshot_id: string
  media_id: string
  screenshot_type: 'size_variant'
  metadata: {
    url: string
    resolution: Resolution
    device: string
    capture_status: 'pending' | 'success' | 'error'
    error_message?: string
    retry_count?: number
  }
  file_path: string
}
```

## Implementation Plan

### Phase 1: URL Input & Sitemap Extraction

1. **Homepage URL Input (`/app/page.tsx`)**
   - Create URL input form component
   - Add URL validation
   - Implement basic error handling
   - Store URL in global state (Zustand)
   
   ```typescript
   // Components to Create:
   // - src/components/url-input/UrlForm.tsx
   // - src/components/url-input/UrlValidation.tsx
   
   // Services to Create:
   // - src/services/url-validation.ts
   // - src/services/project.ts
   ```

2. **Sitemap Processing**
   - Create sitemap service
   - Implement XML sitemap fetching
   - Add robots.txt parsing
   - Create URL extraction logic
   - Handle recursive sitemap processing
   - Store sitemap data in global state
   
   ```typescript
   // Services to Create:
   // - src/services/sitemap.ts
   // - src/services/robots.ts
   
   // Types to Add (src/types/sitemap.ts):
   interface SitemapData {
     urls: string[]
     lastmod?: string[]
     priority?: number[]
   }
   ```

3. **URL Tree Structure (`/app/sitemap/page.tsx`)**
   - Implement URL organization logic
   - Create tree view component
   - Add selection/deselection functionality
   - Store selected URLs in global state
   
   ```typescript
   // Components to Create:
   // - src/components/sitemap/UrlTree.tsx
   // - src/components/sitemap/UrlNode.tsx
   // - src/components/sitemap/SelectionControls.tsx
   
   // Hooks to Create:
   // - src/hooks/useUrlTree.ts
   ```

### Phase 2: Project Setup & Configuration

1. **Project Creation (`/app/setup/page.tsx`)**
   - Implement project naming logic
   - Add description field
   - Create project storage service
   - Add project metadata handling
   
   ```typescript
   // Components to Create:
   // - src/components/project/ProjectForm.tsx
   // - src/components/project/MetadataFields.tsx
   
   // Database Operations:
   // - src/db/queries/projects.ts
   // - src/db/queries/media.ts
   ```

2. **Device Configuration (`/app/config/page.tsx`)**
   - Create device selection component
   - Implement device config storage
   - Add validation for selected options
   - Create configuration service
   
   ```typescript
   // Components to Create:
   // - src/components/config/DeviceSelector.tsx
   // - src/components/config/ConfigForm.tsx
   
   // Types to Add (src/types/config.ts):
   interface DeviceConfig {
     width: number
     height: number
     deviceScaleFactor: number
     isMobile: boolean
   }
   ```

### Phase 3: Screenshot Generation

1. **Screenshot Service**
   - Implement Puppeteer/Playwright integration
   - Create screenshot capture logic
   - Add progress tracking
   - Implement error handling
   - Create retry mechanism
   
   ```typescript
   // Services to Create:
   // - src/services/puppeteer.ts
   // - src/services/screenshot.ts
   // - src/services/queue.ts
   
   // Types to Add (src/types/capture.ts):
   interface CaptureJob {
     url: string
     config: DeviceConfig
     retryCount: number
   }
   ```

2. **Progress Tracking (`/app/generate/page.tsx`)**
   - Create progress component
   - Implement real-time status updates
   - Add error display
   - Create completion notification
   
   ```typescript
   // Components to Create:
   // - src/components/capture/ProgressTracker.tsx
   // - src/components/capture/ErrorDisplay.tsx
   // - src/components/capture/StatusIndicator.tsx
   
   // Hooks to Create:
   // - src/hooks/useCapture.ts
   ```

### Phase 4: Organization & Export

1. **Page Organization (`/app/customize/page.tsx`)**
   - Create drag-and-drop interface
   - Implement order persistence
   - Add bulk reordering options
   
   ```typescript
   // Components to Create:
   // - src/components/organize/DragDropList.tsx
   // - src/components/organize/ThumbnailView.tsx
   
   // Hooks to Create:
   // - src/hooks/useSortable.ts
   ```

2. **Export Options (`/app/download/page.tsx`)**
   - Implement PDF compilation
   - Create ZIP file generation
   - Add download service
   - Implement export progress tracking
   
   ```typescript
   // Components to Create:
   // - src/components/export/ExportOptions.tsx
   // - src/components/export/ProgressBar.tsx
   
   // Services to Create:
   // - src/services/pdf.ts
   // - src/services/zip.ts
   ```

## State Management

### Zustand Store Structure
```typescript
// src/store/screenshot-store.ts
interface ScreenshotStore {
  // Project State
  project: Project | null
  setProject: (project: Project) => void
  
  // URL State
  urls: UrlNode[]
  selectedUrls: string[]
  setUrls: (urls: UrlNode[]) => void
  toggleUrl: (url: string) => void
  
  // Configuration State
  config: CaptureConfig
  setConfig: (config: CaptureConfig) => void
  
  // Progress State
  progress: CaptureProgress
  updateProgress: (progress: Partial<CaptureProgress>) => void
  
  // Export State
  exportConfig: ExportConfig
  setExportConfig: (config: ExportConfig) => void
}
```

## API Routes

```typescript
// src/app/api/projects/route.ts
POST /api/projects - Create new project
GET /api/projects/:id - Get project details

// src/app/api/sitemap/route.ts
POST /api/sitemap - Process URL and extract sitemap

// src/app/api/screenshots/route.ts
POST /api/screenshots - Start screenshot capture
GET /api/screenshots/:id - Get screenshot status

// src/app/api/export/route.ts
POST /api/export - Generate export file
```

## Database Queries

```typescript
// src/db/queries/projects.ts
createProject(data: NewProject): Promise<Project>
updateProject(id: string, data: Partial<Project>): Promise<Project>

// src/db/queries/media.ts
createMedia(data: NewMedia): Promise<Media>
updateMediaMetadata(id: string, metadata: any): Promise<Media>

// src/db/queries/screenshots.ts
createScreenshot(data: NewScreenshot): Promise<Screenshot>
updateScreenshotStatus(id: string, status: CaptureStatus): Promise<Screenshot>
```

## Implementation Sequence

1. **Week 1: Foundation**
   - Set up services structure
   - Implement URL input
   - Create basic sitemap fetching

2. **Week 2: URL Processing**
   - Complete sitemap processing
   - Implement URL tree structure
   - Add selection functionality

3. **Week 3: Configuration**
   - Build project setup flow
   - Implement device configuration
   - Create configuration storage

4. **Week 4: Capture Logic**
   - Implement screenshot service
   - Add progress tracking
   - Create error handling

5. **Week 5: Organization**
   - Build page organization UI
   - Implement ordering logic
   - Add bulk actions

6. **Week 6: Export**
   - Create PDF compilation
   - Implement ZIP generation
   - Add download functionality

## Testing Strategy

1. **Unit Tests**
   - URL validation
   - Sitemap processing
   - Tree structure organization

2. **Integration Tests**
   - Sitemap fetching
   - Screenshot capture
   - Export generation

3. **E2E Tests**
   - Complete user flow
   - Error scenarios
   - Large sitemap handling

## Success Criteria
- Successfully process sitemaps with 100+ URLs
- Generate screenshots for multiple devices
- Handle common error cases gracefully
- Complete capture process within reasonable time
- Generate properly formatted exports
