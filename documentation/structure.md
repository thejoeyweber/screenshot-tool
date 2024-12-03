# Project Structure

## Core Directories

### `/src`
- **`/app`** - Next.js App Router pages and layouts
  - `/api` - API routes
    - `/validate-url` - Domain validation endpoint
    - `/robots` - Robots.txt fetching endpoint
    - `/sitemap` - Sitemap XML processing endpoint
    - `/fetch-sitemaps` - Sitemap discovery endpoint
  - `/sitemap` - Sitemap processing page
  
- **`/components`** - React components
  - `/sitemap` - Sitemap-related components
    - `UrlTree.tsx` - URL tree visualization
  - `/ui` - Reusable UI components
  - `/url-input` - URL input and processing components

- **`/services`** - Business logic and data processing
  - `sitemap.ts` - Sitemap discovery and processing service

- **`/utils`** - Utility functions
  - `website-utils.ts` - Web scraping and URL processing utilities

- **`/types`** - TypeScript type definitions
  - `api.ts` - API response types
  - `sitemap.ts` - Sitemap-related types

### `/documentation`
- **`/feature`** - Feature documentation
  - `1-mvp-web-screencapture.md` - MVP feature specification
- `structure.md` - Project structure documentation
- `project-log.md` - Development activity log

## Key Features

### Sitemap Processing
- Domain resolution with www/non-www handling
- Robots.txt parsing for sitemap discovery
- XML sitemap validation and parsing
- URL deduplication and organization

### API Routes
- URL validation and domain resolution
- Robots.txt fetching and parsing
- Sitemap XML processing
- Error handling and status codes

### Frontend
- URL input and validation
- Sitemap discovery and processing
- URL tree visualization
- Error handling and loading states

## Development Guidelines

### Code Organization
- Feature-based component organization
- Shared utilities in `/utils`
- Business logic in `/services`
- API routes in `/app/api`

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