# Project Structure

## Core Directories

### `/src`
- **`/app`** - Next.js App Router pages and layouts
  - `/api` - API routes
    - `/validate-url` - Domain validation endpoint
    - `/robots` - Robots.txt fetching endpoint
    - `/sitemap` - Sitemap XML processing endpoint
    - `/fetch-sitemaps` - Sitemap discovery endpoint
    - `/profile-url` - URL profiling endpoint
    - `/screenshot` - Screenshot-related endpoints
      - `/capture` - Screenshot capture endpoint
    - `/test` - Testing endpoints
      - `/storage` - Storage testing endpoint
      - `/screenshot` - Screenshot testing endpoint
  - `/sitemap` - Sitemap processing page
  - `/screenshot` - Screenshot capture and configuration page
  
- **`/components`** - React components
  - `/sitemap` - Sitemap-related components
    - `UrlTree.tsx` - URL tree visualization
  - `/screenshot` - Screenshot-related components
    - `ImagePreview.tsx` - Screenshot preview with zoom/pan
    - `CaptureSettings.tsx` - Device and delay settings
    - `ElementHider.tsx` - CSS selector management
    - `AnnotationLayer.tsx` - Screenshot annotations
    - `ColorPicker.tsx` - Annotation color selection
    - `ToolBar.tsx` - Screenshot toolbar
  - `/ui` - Reusable UI components (shadcn)
  - `/url-input` - URL input and processing components
  - `/layout` - Layout components
  - `/error` - Error handling components
  - `/providers` - Context providers

- **`/config`** - Configuration files
  - `devices.ts` - Device presets for screenshots

- **`/services`** - Business logic and data processing
  - `sitemap.ts` - Sitemap discovery and processing
  - `screenshot.ts` - Screenshot capture and optimization
  - `storage.ts` - File storage management
  - `annotation.ts` - Screenshot annotation handling
  - `export.ts` - Screenshot export utilities

- **`/utils`** - Utility functions
  - `website-utils.ts` - Web scraping and URL processing
  - `disk.ts` - Filesystem operations

- **`/types`** - TypeScript type definitions
  - `api.ts` - API response types
  - `sitemap.ts` - Sitemap-related types
  - `screenshot.ts` - Screenshot and device types
  - `storage.ts` - Storage-related types
  - `site-profile.ts` - Website profiling types

- **`/hooks`** - React custom hooks

- **`/db`** - Database configuration and models

- **`/lib`** - Third-party library configurations

- **`/styles`** - Global styles and CSS modules

- **`/store`** - State management

### `/docs`
- `mvp-feature-checklist.md` - Feature completion tracking

### `/documentation`
- **`/feature`** - Feature documentation
  - `mvp-implementation-guide.md` - Implementation details
- `structure.md` - Project structure documentation
- `project-log.md` - Development activity log
- `techstack.md` - Technology stack details

## Key Features

### Sitemap Processing
- Domain resolution with www/non-www handling
- Robots.txt parsing for sitemap discovery
- XML sitemap validation and parsing
- URL deduplication and organization

### Screenshot Capture
- Multiple device configurations
- Element hiding via CSS selectors
- Image optimization and processing
- Storage management with sessions
- Preview with zoom/pan controls

### Storage System
- Session-based organization
- Automatic cleanup
- File metadata tracking
- Stats and monitoring

### API Routes
- URL validation and domain resolution
- Robots.txt fetching and parsing
- Sitemap XML processing
- Screenshot capture and configuration
- Storage management
- Error handling and status codes

### Frontend
- URL input and validation
- Sitemap discovery and processing
- URL tree visualization
- Screenshot capture interface
- Image preview and controls
- Error handling and loading states

## Development Guidelines

### Code Organization
- Feature-based component organization
- Shared utilities in `/utils`
- Business logic in `/services`
- API routes in `/app/api`
- shadcn components in `/components/ui`

### TypeScript
- Strict type checking enabled
- Interface-first development
- Proper null handling
- Type-safe API responses

### Error Handling
- Consistent error response format
- Proper HTTP status codes
- Detailed error logging
- User-friendly error messages

### Testing
- Unit tests for utilities
- Integration tests for services
- API endpoint testing
- Component testing
- Storage validation

### Documentation
- Feature tracking in `/docs`
- Implementation details in `/documentation/feature`
- Structure and setup in root `/documentation`
- Clear component and service headers