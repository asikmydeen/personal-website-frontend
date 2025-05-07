# Personal Website Frontend Architecture

This project contains the scaffolded frontend architecture for the Personal Website, as per the provided system design document. It is built using React and designed to integrate with a backend API (placeholder API calls are included in the service modules).

## Project Structure

- **/public**: Contains static assets and the main `index.html` file.
- **/src**: Contains all the React application code.
  - **/components**: Reusable UI components.
    - **/layout**: Main layout components (e.g., `Layout.jsx` with sidebar and header).
    - **/ui**: General UI elements (e.g., buttons, inputs - to be added as needed).
  - **/contexts**: React context for global state management (to be added as needed).
  - **/pages**: Top-level components representing different pages/views of the application (placeholders created in `App.jsx`, actual files to be created).
  - **/services**: Modules responsible for API interactions. Each service (e.g., `authService.js`, `photoService.js`) contains placeholder functions that simulate API calls and define the expected request/response schemas.
  - **/utils**: Utility functions (to be added as needed).
  - `App.jsx`: Main application component, sets up routing and layout.
  - `index.js`: Entry point of the React application.
  - `reportWebVitals.js`, `setupTests.js`: Standard Create React App files.
- `todo.md`: A detailed checklist of the frontend architecture components and their status.
- `package.json`: Project dependencies and scripts.

## Key Features Implemented (Scaffolding & Placeholder API Schemas)

- **User Authentication**: Login, registration, password reset, profile management.
- **Photo Management**: Album creation, photo uploads, tagging, searching, sharing.
- **File and Text Storage**: File uploads/downloads, text note creation/editing, bookmarking.
- **Resume Management**: Editable resume, PDF export, versioning.
- **Password Management**: Secure password storage, generator, audit trails.
- **Digital Wallet**: Encrypted card storage, expiry alerts.
- **Voice Memos**: Recording, playback, transcription.
- **Secure Sharing**: Link generation, access control, analytics.
- **Collaborative Access**: User invites, role management.

## Getting Started

1.  **Install Dependencies**:
    Navigate to the project root (`/home/ubuntu/personal-website-frontend`) and run:
    ```bash
    pnpm install
    ```

2.  **Run the Development Server**:
    ```bash
    pnpm run dev
    ```
    This will start the development server, typically on `http://localhost:3000`.

## Next Steps

1.  **Implement UI Components**: Flesh out the UI components for each page and feature based on the design requirements (e.g., using Tailwind CSS for styling).
2.  **Connect to Backend**: Replace the placeholder API calls in the `/src/services/` modules with actual calls to your backend API endpoints once they are developed.
3.  **State Management**: Implement state management (e.g., using React Context or a library like Redux/Zustand) as needed for application-wide data and UI state.
4.  **Testing**: Write unit and integration tests for components and services.

This architecture provides a solid foundation for building the full-featured personal website.
