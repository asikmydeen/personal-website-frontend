# Personal Website Backend

This is the AWS-based backend for the personal website application. It provides a serverless API using AWS Lambda, API Gateway, DynamoDB, S3, and other AWS services.

## Architecture

The backend uses a serverless architecture with the following components:

- **API Gateway**: Handles HTTP requests and routes them to the appropriate Lambda functions
- **Lambda**: Serverless functions that execute the business logic
- **DynamoDB**: NoSQL database for storing user data, notes, bookmarks, etc.
- **S3**: Object storage for files, photos, and other media
- **Cognito**: User authentication and authorization
- **SES**: Email sending for password resets and notifications
- **CloudWatch**: Monitoring and logging
- **IAM**: Access control and permissions

## Directory Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Middleware functions
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration
│   └── index.js         # Entry point
├── serverless.yml       # AWS infrastructure as code
└── package.json         # Dependencies
```

## API Endpoints

The API follows RESTful conventions and is organized into the following resources:

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get token
- `POST /api/v1/auth/logout` - Logout and invalidate token
- `POST /api/v1/auth/password-reset` - Request password reset
- `POST /api/v1/auth/password-reset/:token` - Reset password with token
- `POST /api/v1/auth/verify-token` - Verify JWT token

### Users

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/settings` - Get user settings
- `PUT /api/v1/users/settings` - Update user settings
- `PUT /api/v1/users/password` - Change password

### Notes

- `POST /api/v1/notes` - Create a new note
- `GET /api/v1/notes` - Get all notes
- `GET /api/v1/notes/:id` - Get a specific note
- `PUT /api/v1/notes/:id` - Update a note
- `DELETE /api/v1/notes/:id` - Move a note to trash
- `DELETE /api/v1/notes/:id/permanent` - Permanently delete a note
- `PUT /api/v1/notes/:id/restore` - Restore a note from trash
- `GET /api/v1/notes/search` - Search notes
- `GET /api/v1/notes/tags` - Get notes by tag

### Bookmarks

- `POST /api/v1/bookmarks` - Create a new bookmark
- `GET /api/v1/bookmarks` - Get all bookmarks
- `GET /api/v1/bookmarks/:id` - Get a specific bookmark
- `PUT /api/v1/bookmarks/:id` - Update a bookmark
- `DELETE /api/v1/bookmarks/:id` - Delete a bookmark
- `GET /api/v1/bookmarks/search` - Search bookmarks
- `GET /api/v1/bookmarks/tags` - Get bookmarks by tag

### Bookmark Folders

- `POST /api/v1/bookmark-folders` - Create a new bookmark folder
- `GET /api/v1/bookmark-folders` - Get all bookmark folders
- `GET /api/v1/bookmark-folders/:id` - Get a specific bookmark folder
- `PUT /api/v1/bookmark-folders/:id` - Update a bookmark folder
- `DELETE /api/v1/bookmark-folders/:id` - Delete a bookmark folder
- `GET /api/v1/bookmark-folders/:id/bookmarks` - Get bookmarks in a folder

### Passwords

- `POST /api/v1/passwords` - Create a new password entry
- `GET /api/v1/passwords` - Get all password entries
- `GET /api/v1/passwords/:id` - Get a specific password entry
- `PUT /api/v1/passwords/:id` - Update a password entry
- `DELETE /api/v1/passwords/:id` - Delete a password entry
- `GET /api/v1/passwords/search` - Search password entries
- `GET /api/v1/passwords/category/:category` - Get passwords by category

### Wallet Cards

- `POST /api/v1/wallet/cards` - Create a new wallet card
- `GET /api/v1/wallet/cards` - Get all wallet cards
- `GET /api/v1/wallet/cards/:id` - Get a specific wallet card
- `PUT /api/v1/wallet/cards/:id` - Update a wallet card
- `DELETE /api/v1/wallet/cards/:id` - Delete a wallet card

### Voice Memos

- `POST /api/v1/voice-memos` - Create a new voice memo
- `GET /api/v1/voice-memos` - Get all voice memos
- `GET /api/v1/voice-memos/:id` - Get a specific voice memo
- `PUT /api/v1/voice-memos/:id` - Update a voice memo
- `DELETE /api/v1/voice-memos/:id` - Delete a voice memo
- `GET /api/v1/voice-memos/search` - Search voice memos
- `GET /api/v1/voice-memos/tags` - Get voice memos by tag

### Files

- `POST /api/v1/files` - Upload a new file
- `GET /api/v1/files` - Get all files
- `GET /api/v1/files/:id` - Get a specific file
- `PUT /api/v1/files/:id` - Update file metadata
- `DELETE /api/v1/files/:id` - Delete a file
- `GET /api/v1/files/search` - Search files
- `GET /api/v1/files/tags` - Get files by tag

### Folders

- `POST /api/v1/folders` - Create a new folder
- `GET /api/v1/folders` - Get all folders
- `GET /api/v1/folders/:id` - Get a specific folder
- `PUT /api/v1/folders/:id` - Update a folder
- `DELETE /api/v1/folders/:id` - Delete a folder
- `GET /api/v1/folders/:id/files` - Get files in a folder

### Photos

- `POST /api/v1/photos` - Upload a new photo
- `GET /api/v1/photos` - Get all photos
- `GET /api/v1/photos/:id` - Get a specific photo
- `PUT /api/v1/photos/:id` - Update photo metadata
- `DELETE /api/v1/photos/:id` - Delete a photo
- `GET /api/v1/photos/search` - Search photos
- `GET /api/v1/photos/tags` - Get photos by tag

### Albums

- `POST /api/v1/albums` - Create a new album
- `GET /api/v1/albums` - Get all albums
- `GET /api/v1/albums/:id` - Get a specific album
- `PUT /api/v1/albums/:id` - Update an album
- `DELETE /api/v1/albums/:id` - Delete an album
- `GET /api/v1/albums/:id/photos` - Get photos in an album

### Resume

- `GET /api/v1/resume` - Get all resumes
- `GET /api/v1/resume/:id` - Get a specific resume
- `POST /api/v1/resume` - Create a new resume
- `PUT /api/v1/resume/:id` - Update a resume
- `DELETE /api/v1/resume/:id` - Delete a resume

### Sharing

- `POST /api/v1/sharing/links` - Create a sharing link
- `GET /api/v1/sharing/links` - Get all sharing links
- `GET /api/v1/sharing/links/:token` - Get a specific sharing link
- `DELETE /api/v1/sharing/links/:id` - Delete a sharing link
- `POST /api/v1/sharing/permissions` - Create a permission
- `GET /api/v1/sharing/permissions` - Get all permissions
- `GET /api/v1/sharing/permissions/:id` - Get a specific permission
- `DELETE /api/v1/sharing/permissions/:id` - Delete a permission

### Comments

- `POST /api/v1/comments` - Create a comment
- `GET /api/v1/comments` - Get all comments
- `GET /api/v1/comments/:id` - Get a specific comment
- `PUT /api/v1/comments/:id` - Update a comment
- `DELETE /api/v1/comments/:id` - Delete a comment
- `GET /api/v1/comments/resource/:type/:id` - Get comments for a resource

### Notifications

- `GET /api/v1/notifications` - Get all notifications
- `GET /api/v1/notifications/:id` - Get a specific notification
- `PUT /api/v1/notifications/:id` - Update a notification
- `DELETE /api/v1/notifications/:id` - Delete a notification
- `GET /api/v1/notifications/unread` - Get unread notifications

### Tags

- `POST /api/v1/tags` - Create a tag
- `GET /api/v1/tags` - Get all tags
- `GET /api/v1/tags/:id` - Get a specific tag
- `PUT /api/v1/tags/:id` - Update a tag
- `DELETE /api/v1/tags/:id` - Delete a tag

### Activities

- `GET /api/v1/activities` - Get all activities
- `GET /api/v1/activities/user/:userId` - Get activities for a user

## Setup and Deployment

### Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate credentials
- Serverless Framework

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret
   AWS_REGION=us-east-1
   ```

3. Run the server locally:
   ```
   npm run dev
   ```

### Deployment

1. Deploy to AWS:
   ```
   npm run deploy
   ```

2. Deploy to a specific stage:
   ```
   npm run deploy -- --stage production
   ```

## Security

- All API endpoints (except authentication) require a valid JWT token
- Passwords are hashed using bcrypt
- Sensitive data in DynamoDB is encrypted
- S3 objects are encrypted at rest
- API Gateway uses HTTPS
- IAM roles follow the principle of least privilege

## Monitoring and Logging

- CloudWatch Logs for Lambda functions
- CloudWatch Metrics for API Gateway and Lambda
- X-Ray for tracing requests

## Future Improvements

- Add unit and integration tests
- Implement CI/CD pipeline
- Add rate limiting
- Implement WebSockets for real-time features
- Add caching layer with ElastiCache