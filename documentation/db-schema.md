
# Database Schema Design

## 1. Users
- **Purpose**: Stores individual user accounts.
- **Fields**:
  - `user_id` (PK): Unique identifier.
  - `organization_id` (FK, nullable): Links to `Organizations` (optional).
  - `email`: Email address.
  - `password_hash`: Encrypted password.
  - `created_at`, `updated_at`: Timestamps.

---

## 2. Organizations
- **Purpose**: Represents a team or entity that can have multiple users and projects.
- **Fields**:
  - `organization_id` (PK): Unique identifier.
  - `name`: Name of the organization.
  - `created_at`, `updated_at`: Timestamps.

---

## 3. Projects
- **Purpose**: Tracks projects created by users or organizations.
- **Fields**:
  - `project_id` (PK): Unique identifier.
  - `user_id` (FK, nullable): Links to `Users` (for individual users).
  - `organization_id` (FK, nullable): Links to `Organizations` (for teams).
  - `project_name`: Name of the project.
  - `created_at`, `updated_at`: Timestamps.

---

## 4. Media
- **Purpose**: Stores all media types (e.g., websites, animated ads, videos, emails).
- **Fields**:
  - `media_id` (PK): Unique identifier.
  - `project_id` (FK): Links to `Projects`.
  - `media_type`: Type of media (`website`, `animated_ad`, `video`, `email`).
  - `metadata` (JSONB): Media-specific details (e.g., URL, ad sizes, email variables).
  - `created_at`, `updated_at`: Timestamps.

---

## 5. Screenshots
- **Purpose**: Centralized storage of screenshots for any media type.
- **Fields**:
  - `screenshot_id` (PK): Unique identifier.
  - `media_id` (FK): Links to `Media`.
  - `screenshot_type`: Purpose of the screenshot (`key_frame`, `size_variant`, etc.).
  - `metadata` (JSONB): Attributes like resolution, size, or frame timestamp.
  - `file_path`: File storage path.
  - `created_at`, `updated_at`: Timestamps.

---

## 6. Sources (Optional for Polymorphism)
- **Purpose**: Abstracts origins of media content (e.g., pages, frames).
- **Fields**:
  - `source_id` (PK): Unique identifier.
  - `media_id` (FK): Links to `Media`.
  - `source_type`: Type of source (`page`, `frame`, etc.).
  - `metadata` (JSONB): Details about the source (e.g., URL, frame description).
  - `created_at`, `updated_at`: Timestamps.

---

## Relationships

- **Users ↔ Organizations**: A user can belong to one organization; optional for individual users.
- **Organizations ↔ Projects**: An organization can have multiple projects.
- **Projects ↔ Media**: A project can have multiple media entries.
- **Media ↔ Screenshots**: Each media entry can have multiple screenshots.
- **Media ↔ Sources**: Each media entry can optionally link to multiple sources.

---

## Indexes

- `organization_id` in `Users` and `Projects` for fast lookups.
- `project_id` in `Media` for quick media retrieval.
- `media_id` in `Screenshots` for screenshot lookups.
- `media_type` and `screenshot_type` for filtering.

---

## Scalability Features

1. **JSONB Fields**:
   - `metadata` in `Media`, `Screenshots`, and `Sources` for flexible data storage.
2. **Future-Proof Relationships**:
   - `Sources` table for polymorphism and extensibility.
