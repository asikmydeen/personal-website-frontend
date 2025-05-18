# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a personal website frontend built with React, Vite, and TypeScript. The application has both web and mobile support using Capacitor. It provides various personal productivity features including notes, bookmarks, passwords, photos, files, voice memos, and resume management.

## Commands

### Development

```bash
# Start development server
npm run dev

# Build for web
npm run build 
# or
npm run build:web

# Preview the build
npm run preview

# Lint code
npm run lint
```

### Mobile Development

```bash
# Sync changes to mobile projects
npm run sync:mobile

# Open iOS project
npm run open:ios

# Open Android project
npm run open:android
```

### Deployment

```bash
# Deploy to AWS (S3, CloudFront, Route53)
./deploy.sh
```

## Architecture

### Frontend

The frontend is a React SPA built with:
- React Router for navigation
- Zustand for state management
- Radix UI and Tailwind CSS for styling
- Framer Motion for animations
- Capacitor for mobile (iOS/Android) support
- TypeScript for type safety

#### Key Directories:

- `/src/components` - Reusable UI components
- `/src/pages` - Page components
- `/src/core/services` - API services
- `/src/core/store` - Zustand state management
- `/src/core/hooks` - Custom React hooks
- `/src/styles` - Global CSS styles
- `/src/lib` - Utility functions
- `/src/providers` - Context providers (Auth, Theme)

### Backend

The backend is deployed to AWS using the Serverless Framework:
- API Gateway for handling HTTP requests
- Lambda functions for serverless execution
- DynamoDB for data storage
- S3 for file storage
- CloudFront for content delivery
- Cognito for authentication

#### API Structure

The API follows RESTful conventions with endpoints organized by resource:
- `/api/v1/auth/*` - Authentication
- `/api/v1/users/*` - User management
- `/api/v1/notes/*` - Notes management
- `/api/v1/bookmarks/*` - Bookmarks management
- `/api/v1/photos/*` - Photos management
- `/api/v1/files/*` - Files management
- `/api/v1/voice-memos/*` - Voice memos management
- `/api/v1/resume/*` - Resume management
- `/api/v1/sharing/*` - Sharing functionality

## API Integration

The application can work with both a real AWS backend and a mock API (json-server). The backend integration is configured in `src/core/services/backendIntegration.js`.

Current configuration:
- `USE_REAL_BACKEND = true`
- Real API base URL: `https://1lhwq5uq57.execute-api.us-east-1.amazonaws.com/dev`

## Authentication Flow

1. User registers or logs in
2. Backend returns JWT token
3. Token is stored in localStorage
4. Token is included in API request headers
5. Token is verified on protected routes
6. On logout, token is invalidated on server and removed from localStorage

## Mobile Support

The application supports both web and mobile platforms using Capacitor:
- iOS and Android configurations
- Platform-specific functionality detection
- Responsive UI designed for mobile
- Native features access through Capacitor plugins

## Deployment

The frontend is deployed to AWS S3 with CloudFront distribution using the `deploy.sh` script. The backend is deployed using the Serverless Framework from the `backend` directory.

### Frontend Deployment

The `deploy.sh` script handles:
1. Building the project
2. Creating/using an S3 bucket
3. Setting up CloudFront distribution
4. Configuring SSL certificate
5. Setting up DNS with Route53

### Backend Deployment

From the backend directory:
```bash
cd backend
./deploy.sh [env]  # where env is dev or prod
```

## Reference Documentation

For more details, refer to:
- `DEPLOY-README.md` - Frontend deployment instructions
- `AWS-SETUP-README.md` - Backend integration guide
- `backend/ARCHITECTURE.md` - Backend architecture documentation
- `backend/AWS-DEPLOYMENT-GUIDE.md` - Backend deployment guide
- `MOBILE-PARITY-REPORT.md` - Mobile feature parity status