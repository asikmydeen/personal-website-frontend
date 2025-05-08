# Mock API Setup for Frontend Development

This project uses `json-server` to provide a mock API for frontend development before the backend is fully implemented.

## Setup

The mock API has already been configured with the following files:
- `db.json`: Contains all the mock data
- `routes.json`: Maps API endpoints to the appropriate data in db.json

## Running the Mock API Server

To start the mock API server, run:

```bash
npm run mock-api
```

This will start the server at http://localhost:3001 with all the API routes configured.

## Available API Endpoints

The mock API provides these endpoints that match the expected backend API structure:

### Authentication
- `POST /api/v1/auth/login`: For user authentication
- `POST /api/v1/auth/register`: For user registration
- `POST /api/v1/auth/logout`: For logging out
- `POST /api/v1/auth/password-reset`: For requesting password reset
- `POST /api/v1/auth/password-reset/:token`: For resetting password with a token
- `POST /api/v1/auth/verify-token`: For verifying auth tokens

### User Management
- `GET /api/v1/users/profile`: Get user profile
- `PUT /api/v1/users/profile`: Update user profile
- `PUT /api/v1/users/settings`: Update user settings

### Notes
- `GET /api/v1/notes`: List all notes
- `GET /api/v1/notes/:id`: Get a specific note
- `POST /api/v1/notes`: Create a new note
- `PUT /api/v1/notes/:id`: Update a note
- `DELETE /api/v1/notes/:id`: Delete a note
- `GET /api/v1/notes/search`: Search notes
- `GET /api/v1/notes/tags`: Get notes by tag

### Bookmarks
- `GET /api/v1/bookmarks`: List all bookmarks
- `GET /api/v1/bookmarks/:id`: Get a specific bookmark
- `POST /api/v1/bookmarks`: Create a new bookmark
- `PUT /api/v1/bookmarks/:id`: Update a bookmark
- `DELETE /api/v1/bookmarks/:id`: Delete a bookmark
- `GET /api/v1/bookmarks/search`: Search bookmarks
- `GET /api/v1/bookmarks/tags`: Get bookmarks by tag

## Development Workflow

1. Start the mock API server: `npm run mock-api`
2. In a separate terminal, start the frontend application: `npm run dev`
3. The frontend will now communicate with the mock API server

## Using with the Frontend

The frontend services have been configured to use the mock API endpoints. The main integration is through:

1. `src/services/apiService.js`: A centralized API service that handles all HTTP requests
2. Individual service modules (notesService.js, bookmarkService.js, etc.) that use the central apiService
3. The Zustand store (useStore.js) which has been updated to work with the API responses

## Login Credentials

For testing, you can use the following credentials:
- Email: `user@example.com`
- Password: `$2a$10$encrypted_password_hash` (this is what's in the database, but the authentication is mocked)

## Customizing Mock Data

If you need to add more mock data or modify existing data, simply edit the `db.json` file. The changes will be reflected immediately in the API responses.

## Adding New Routes

If you need to add new API routes, update the `routes.json` file with the new mappings and restart the mock API server.
