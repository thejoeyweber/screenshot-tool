# Project Structure

## Core Directories

### `/src`
- **`/app`** - Next.js App Router pages and layouts
  - `/api` - API routes
    - `/export` - Export functionality
      - `/[format]` - Dynamic format handling (PDF/ZIP)
    - `/screenshot` - Screenshot capture endpoints
      - `/capture` - Screenshot capture handler
    - `/batch` - Batch processing endpoints
      - `/[jobId]/control` - Job control endpoint
    - `/test` - Testing endpoints
      - `/batch` - Batch processing test page
      - `/storage` - Storage testing endpoint
      - `/screenshot` - Screenshot testing endpoint

- **`/services`** - Business logic and data processing
  - `batch.ts` - Batch processing service with parallel execution
  - `resource.ts` - Resource monitoring and management
  - `storage.ts` - File storage with singleton pattern
  - `screenshot.ts` - Screenshot capture and optimization
  - `export.ts` - Export functionality for PDF and ZIP

### Key Features

### Export System
- PDF generation with cover page
- ZIP archive with metadata
- Session-based file access
- Image quality preservation
- Progress tracking
- Error handling

### Batch Processing
- Parallel processing with chunk size of 3
- Job status tracking and control
- Resource monitoring and management
- Progress visualization
- Error handling and recovery
- Session-based storage

### Storage System
- Singleton pattern implementation
- Directory caching and optimization
- Session-based organization
- Automatic cleanup
- File metadata tracking
- Stats and monitoring

### Resource Management
- Disk space monitoring
- Memory usage tracking
- Automatic cleanup
- Development mode handling
- Production safeguards

### Frontend
- Modern UI with animations
- Real-time status updates
- Progress visualization
- Concurrent processing indicators
- Error handling and loading states
- Download page with export options

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