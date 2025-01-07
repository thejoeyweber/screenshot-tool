# Changelog

## [Unreleased]

## [2025-01-07]
- Refactored client-side components to use SearchParamsProvider for better Next.js 14 compatibility
- Updated sitemap API route to use Next.js 14 API patterns with force-dynamic export
- Fixed ESLint configuration and TypeScript types across the application
- Downgraded Next.js from 15.0.3 to 14.1.0 for improved stability
- Added proper type definitions for search params handling in all page components

## [2025-01-07]
- Added link capture in screenshot.ts, storing link data in Screenshot metadata.
- Updated export.ts to optionally include discovered links in PDF exports.
- Provided a new link metadata structure in screenshot.ts and screenshot interface in types.