
# UI Documentation

## Overarching Rules
1. The user interface must prioritize simplicity and intuitiveness, ensuring all key actions are easily discoverable.
2. Consistency in design must be maintained across all screens, leveraging shared components such as the header, sidebar, and footer.
3. The application should be responsive, adapting seamlessly to desktop, tablet, and mobile devices.
4. Emphasis on accessibility to cater to all users, including keyboard navigation and ARIA labels where necessary.
5. Global elements (e.g., header, sidebar) must support the user's navigation throughout the application without adding cognitive load.

---

## Application Layout (Logged-In Shell)

### Structure Overview
- **Header**: Persistent top bar with navigation and user profile access.
- **Sidebar**: Left-aligned vertical navigation for app sections.
- **Main Content Area**: Central workspace where screen-specific content is displayed.
- **Footer**: Optional bottom bar (if needed) for secondary links or status updates.

### Detailed Components

#### Header
- **Purpose**: Provide global navigation, access to account features, and visibility of key actions.
- **Placement**: Fixed at the top, spanning the full width of the screen.
- **Elements**:
  - **Logo**: Top-left, linked to the dashboard or homepage.
  - **Primary Navigation**:
    - Links to "Dashboard," "Projects," and "Help."
    - Context-sensitive breadcrumb navigation, depending on the screen.
  - **Search Bar** (Optional): Global search capability for quick access to projects, pages, or settings.
  - **User Menu**:
    - Located at the top-right corner.
    - Avatar or initials for quick recognition.
    - Dropdown menu with:
      - "Account Settings."
      - "Logout."
      - "Help & Support."

#### Sidebar
- **Purpose**: Provide easy access to primary app sections.
- **Placement**: Fixed on the left side of the screen.
- **Elements**:
  - Collapsible/Expandable: Default expanded for desktop; collapsible for smaller screens.
  - **Sections**:
    - "Dashboard."
    - "Projects."
    - "Screenshot Settings."
    - "Customization."
    - "Downloads."
  - **Active Indicator**:
    - Highlighted icon or label for the currently active section.
  - **Responsive Behavior**:
    - Automatically hidden on small screens, accessible via a "hamburger menu" icon.

#### Main Content Area
- **Purpose**: Centralized workspace for displaying content specific to the active screen.
- **Placement**: Occupies the largest portion of the layout, dynamically resizing based on sidebar visibility.
- **Elements**:
  - **Title/Header**: Page-specific title or heading at the top.
  - **Content Section**:
    - Flexible grid or column layout to accommodate various screen designs.
    - Scrollable content to ensure all features remain accessible on smaller devices.
  - **Action Buttons**:
    - Context-sensitive buttons at the top-right (e.g., "Save," "Next," "Export").

#### Footer (Optional)
- **Purpose**: Provide secondary navigation or contextual information.
- **Placement**: Fixed at the bottom of the screen, full width.
- **Elements**:
  - Legal links (e.g., "Privacy Policy," "Terms of Service").
  - App version or status indicators (e.g., "Version 1.2.3").
  - Help link for quick troubleshooting.

### Responsive Design
- **Desktop**:
  - Sidebar expanded by default.
  - Header, sidebar, and main content visible simultaneously.
- **Tablet**:
  - Sidebar collapsible or hidden by default.
  - Main content adjusts to fill space.
- **Mobile**:
  - Sidebar hidden, accessible via a "hamburger menu."
  - Header remains visible.
  - Main content adjusts for vertical scrolling.

---

## UI Screens

### 1. Homepage (Non-Logged In)
- **Purpose**: Serve as the entry point for both new and returning users.
- **Elements**:
  - Prominent URL input field with placeholder text (e.g., "Enter your website URL here").
  - Buttons:
    - "Try It Now" for initiating the sitemap extraction process.
    - "Log In/Sign Up" for account management.
  - Brief description of tool benefits below the input field.
- **Actions**:
  - Submit URL to proceed to sitemap extraction.
  - Redirect to login or sign-up flows.

### 2. Sitemap/URL Extraction
- **Purpose**: Process the entered URL and display a hierarchical sitemap.
- **Elements**:
  - Progress indicator for URL processing.
  - Error message with alternatives (manual entry or troubleshooting tips) if sitemap extraction fails.
  - Sitemap displayed as a collapsible tree structure with checkboxes.
  - Breadcrumb navigation for ease of use.
- **Actions**:
  - Select pages for inclusion.
  - Confirm selection to proceed to project setup.

### 3. Project Setup
- **Purpose**: Gather metadata and allow customization for the new project.
- **Elements**:
  - Text fields for:
    - Project name.
    - Project description (optional).
  - Checkbox: "Save project for later editing" (requires login).
  - Call-to-action buttons:
    - "Proceed to Configuration" for screenshot settings.
    - "Log In/Sign Up to Save."
- **Actions**:
  - Save project details.
  - Redirect based on login status.

### 4. Configuration Settings
- **Purpose**: Customize screenshot capture settings at various levels.
- **Elements**:
  - Tabs for Global, Section, and Page-level configurations.
  - Dropdowns for screen size and device type.
  - Input fields for delays, hidden elements, and resolution.
  - Live preview of configured settings.
- **Actions**:
  - Apply settings to different levels.
  - Save and continue to screenshot generation.

### 5. Screenshot Generation
- **Purpose**: Manage and monitor the screenshot process.
- **Elements**:
  - Real-time progress bar and status updates.
  - Success and error logs per page.
  - Retry and manual upload options for failed screenshots.
- **Actions**:
  - Monitor progress.
  - Handle errors and continue.

### 6. PDF Customization
- **Purpose**: Finalize and organize screenshots into a PDF.
- **Elements**:
  - Drag-and-drop interface for rearranging pages.
  - Branding customization options (upload logo, edit cover page text).
  - Metadata review table for verifying page details.
  - PDF preview pane.
- **Actions**:
  - Reorganize pages.
  - Save and download the PDF.

### 7. Project Management
- **Purpose**: Allow users to manage existing projects.
- **Elements**:
  - Project list with search and filter options.
  - Buttons:
    - "Edit" for making changes.
    - "Delete" to remove projects.
    - "Duplicate" for creating similar projects.
- **Actions**:
  - Access and edit saved projects.
  - Manage project lifecycle.

### 8. Content Index & Search
- **Purpose**: Simplify navigation across project content.
- **Elements**:
  - Search bar with filters (e.g., keywords, metadata).
  - Indexed list view of search results.
  - Quick navigation links to content sections.
- **Actions**:
  - Search for content and navigate to results.

### 9. Authentication Handling
- **Purpose**: Enable secure staging site access.
- **Elements**:
  - Input fields for username and password.
  - Status confirmation for valid credentials.
  - Error message for failed authentication.
- **Actions**:
  - Enter and save credentials.

### 10. Final Download
- **Purpose**: Provide final outputs to the user.
- **Elements**:
  - Buttons for downloading:
    - Compiled PDF.
    - Individual screenshots.
  - Summary details of the project.
- **Actions**:
  - Download files.

---
