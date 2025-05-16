# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Start mock API server (in a separate terminal)
npm run mock-api

# Build the project
npm run build

# Run linter
npm run lint

# Preview the production build
npm run preview

# Mobile development commands
npm run sync:mobile  # Sync web code to mobile platforms
npm run open:ios     # Open iOS project in Xcode
npm run open:android # Open Android project in Android Studio
```

## Project Architecture

### Overview

This is a personal website/productivity app frontend built with React, Vite, and TypeScript. It supports both web and mobile platforms using Capacitor. The application includes features like notes, bookmarks, file management, photos, passwords, wallet cards, voice memos, and resume management.

### Tech Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + some custom CSS
- **UI Components**: Radix UI components + custom components
- **Routing**: React Router v7
- **State Management**: Zustand
- **Mobile Integration**: Capacitor (iOS/Android)
- **API Communication**: Custom fetch wrapper
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text Editing**: TipTap
- **Animation**: Framer Motion

### Core Architecture Components

1. **Platform Detection**: The `platform.ts` module provides utilities to detect if the app is running in a native environment (iOS/Android) or web browser, allowing for platform-specific code.

2. **API Integration**: The app can switch between a mock API (json-server) and a real AWS backend API through `backendIntegration.js`.

3. **Authentication**: Uses JWT tokens with the `AuthProvider.jsx` provider that wraps the application.

4. **Theming**: Supports light/dark mode through the `ThemeProvider.jsx`.

5. **Service Modules**: Features are organized into service modules (e.g., `notesService.js`, `bookmarkService.js`) that handle API calls.

6. **State Management**: Uses Zustand for global state management through `useStore.js`.

## File Structure

```
src/
├── App.jsx                # Main application component with routes
├── components/            # Reusable UI components
│   ├── animated/          # Animation components
│   ├── layout/            # Layout components
│   ├── ui/                # UI component library (based on Radix)
│   └── [feature]/         # Feature-specific components
├── core/
│   ├── hooks/             # Custom hooks
│   ├── platform.ts        # Platform detection utilities
│   ├── services/          # API services
│   ├── storage/           # Storage interfaces
│   └── store/             # Zustand store
├── pages/                 # Page components
│   └── [feature]/         # Feature-specific pages
├── providers/             # Context providers
├── styles/                # Global styles
└── lib/                   # Utility functions
```

## Backend Integration

The application can work with two backends:

1. **Mock API**: Uses json-server to simulate API calls during development
2. **AWS Backend**: Real serverless backend with AWS Lambda, API Gateway, DynamoDB, etc.

The backend integration is handled through `src/core/services/backendIntegration.js` which provides a common interface for making API requests to either backend.

## Mobile Development

The project uses Capacitor to target iOS and Android platforms:

1. Web code is built using Vite
2. Capacitor syncs the web code to mobile platforms
3. Platform-specific code in `platform.ts` helps detect and adapt to different environments

## Deployment

Deployment to AWS is handled through the `deploy.sh` script which:

1. Builds the project
2. Creates/updates necessary AWS resources (S3, CloudFront, etc.)
3. Deploys the application with proper configuration

## Important Notes

- Local development uses port 5173 for the Vite dev server and port 3001 for the mock API server
- Authentication is handled via JWT tokens stored in localStorage
- The app is designed to work offline with appropriate storage strategies
- Mobile builds require proper setup of the iOS and Android environments