const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const walletRoutes = require('./routes/walletRoutes');
const voiceMemoRoutes = require('./routes/voiceMemoRoutes');
const fileRoutes = require('./routes/fileRoutes');
const photoRoutes = require('./routes/photoRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const sharingRoutes = require('./routes/sharingRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const tagRoutes = require('./routes/tagRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Load environment variables
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/bookmarks', bookmarkRoutes);
app.use('/api/v1/bookmark-folders', require('./routes/bookmarkFolderRoutes'));
app.use('/api/v1/passwords', passwordRoutes);
app.use('/api/v1/wallet/cards', walletRoutes);
app.use('/api/v1/voice-memos', voiceMemoRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/folders', require('./routes/folderRoutes'));
app.use('/api/v1/photos', photoRoutes);
app.use('/api/v1/albums', require('./routes/albumRoutes'));
app.use('/api/v1/resume', resumeRoutes);
app.use('/api/v1/sharing', sharingRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/tags', tagRoutes);
app.use('/api/v1/activities', activityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server if not imported
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For serverless use
module.exports = app;