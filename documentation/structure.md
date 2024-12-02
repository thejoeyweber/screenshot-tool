# Screenshot Tool Project Structure

## Overview
This document outlines the organization and purpose of each directory and key file in the Screenshot Tool project.

## Directory Structure

### `src/`
Main source directory containing all application code.

#### `app/`
Next.js 14 app router directory.
- **`(auth)/`** - Authentication routes
  - `layout.tsx` - Auth pages layout
  - `login/page.tsx` - Login page
  - `register/page.tsx` - Registration page
- **`(dashboard)/`** - Protected dashboard routes
  - `layout.tsx` - Dashboard layout with auth check
  - `projects/` - Project management
    - `page.tsx` - Projects list
    - `[projectId]/page.tsx` - Project details
  - `organization/` - Organization management
    - `page.tsx` - Organization details
    - `settings/page.tsx` - Organization settings
- **`api/`** - API routes
  - `screenshots/route.ts` - Screenshot operations
  - `projects/route.ts` - Project operations
  - `webhooks/route.ts` - External service webhooks
- `layout.tsx` - Root layout with providers
- `page.tsx` - Home page
- `globals.css` - Global styles

#### `components/`
React components organized by purpose.
- **`ui/`** - Reusable UI components and shadcn-ui components
  - `screenshot-canvas.tsx` - Canvas component
  - Various shadcn-ui components
- **`layout/`** - Layout components
  - `Header.tsx` - Navigation header
  - `Footer.tsx` - Status and controls
  - `Sidebar.tsx` - Tools sidebar
  - `MainLayout.tsx` - Main layout
- **`providers/`** - Context providers
  - `theme-provider.tsx` - Theme context
- **`screenshot/`** - Screenshot components
  - `ToolBar.tsx` - Annotation tools
  - `ColorPicker.tsx` - Color selection
  - `AnnotationLayer.tsx` - Annotation canvas

#### `db/`
Database configuration and schemas.
- **`schema/`** - Table definitions
  - `users.ts` - Users table
  - `organizations.ts` - Organizations table
  - `projects.ts` - Projects table
  - `media.ts` - Media table
  - `screenshots.ts` - Screenshots table
- **`queries/`** - Database operations
  - `users.ts` - User operations
  - `organizations.ts` - Organization operations
  - `projects.ts` - Project operations
- **`migrations/`** - Schema migrations

#### `lib/`
Core utilities and shared libraries.
- `utils.ts` - Common utilities
- `fonts.ts` - Font configuration

#### `hooks/`
Custom React hooks.
- `useScreenshot.ts` - Screenshot management
- `useHotkeys.ts` - Keyboard shortcuts
- `useAnnotation.ts` - Annotation state
- `useCanvas.ts` - Canvas operations

#### `types/`
TypeScript type definitions.
- `index.ts` - Shared types
- `screenshot.ts` - Screenshot types
- `env.d.ts` - Environment variables

#### `store/`
State management using Zustand.
- `screenshot-store.ts` - Screenshot state

#### `services/`
Business logic and integrations.
- `screenshot.ts` - Screenshot operations
- `annotation.ts` - Annotation handling
- `export.ts` - Export functionality
- `storage.ts` - Storage operations

#### `config/`
Configuration files.
- `constants.ts` - App constants
- `supabase.ts` - Supabase client
- `clerk.ts` - Auth configuration
- `api.ts` - API configuration

### Root Files
- `middleware.ts` - Auth protection
- `.env.local` - Environment variables
- `drizzle.config.ts` - Database config

## Key Design Decisions

### Route Organization
- Auth routes in `(auth)` group
- Protected routes in `(dashboard)` group
- API routes follow REST conventions

### Database Design
- Schemas using Drizzle ORM
- Type-safe queries with Zod validation
- Migrations for version control

### Authentication
- Clerk for auth management
- Protected routes via middleware
- Auth state in layout components

### State Management
- Zustand for global state
- React Query for server state
- Local state with hooks

### API Structure
- Route handlers in `api/`
- Service layer for business logic
- Type-safe requests and responses

## File Naming Conventions
- React components: PascalCase
- Utilities and hooks: camelCase
- Configuration: kebab-case
- All TypeScript: `.ts` or `.tsx`

## Import Conventions
- Alias imports from `@/`
- Group by: React, external, internal
- Relative for closely related