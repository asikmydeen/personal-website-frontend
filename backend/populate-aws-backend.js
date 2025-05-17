/**
 * Script to populate the AWS backend with data from db.json
 * 
 * This script will:
 * 1. Register users
 * 2. Create notes
 * 3. Create bookmarks and bookmark folders
 * 4. Create passwords
 * 5. Create wallet cards
 * 6. Create voice memos
 * 7. Create files and folders
 * 8. Create photos and albums
 * 9. Create resumes
 * 10. Create sharing links and permissions
 * 11. Create comments
 * 12. Create notifications
 * 13. Create tags
 * 14. Create activities
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// API URL - Replace with your actual API Gateway URL
const API_URL = 'https://1lhwq5uq57.execute-api.us-east-1.amazonaws.com/dev';

// Load data from db.json
const dbData = require('../db.json');

// Store tokens for authenticated requests
const tokens = {};

// Helper function for authenticated requests
const authRequest = async (userId, method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens[userId]}`
      }
    };

    if (data && (method === 'post' || method === 'put')) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error with ${method.toUpperCase()} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// 1. Register users and get tokens
const registerUsers = async () => {
  console.log('Registering users...');
  
  for (const user of dbData.users) {
    try {
      // Create a simplified password for testing
      const password = 'Password123!';
      
      const userData = {
        email: user.email,
        password,
        name: user.name
      };
      
      console.log(`Registering user: ${user.email}`);
      const response = await axios.post(`${API_URL}/api/v1/auth/register`, userData);
      
      // Store token for authenticated requests
      tokens[user.id] = response.data.data.token;
      console.log(`User ${user.email} registered with ID: ${response.data.data.user.id}`);
      
      // Update user profile with additional information
      await authRequest(user.id, 'put', '/api/v1/users/profile', {
        bio: user.bio,
        profilePicture: user.profilePicture
      });
      
      // Update user settings
      await authRequest(user.id, 'put', '/api/v1/users/settings', user.settings);
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('already exists')) {
        console.log(`User ${user.email} already exists, logging in...`);
        
        // Login instead
        const loginResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
          email: user.email,
          password: 'Password123!'
        });
        
        tokens[user.id] = loginResponse.data.data.token;
      } else {
        console.error(`Failed to register user ${user.email}:`, error.message);
      }
    }
  }
  
  console.log('User registration complete.');
};

// 2. Create notes
const createNotes = async () => {
  console.log('Creating notes...');
  
  for (const note of dbData.notes) {
    try {
      if (!tokens[note.userId]) {
        console.log(`Skipping note for user ${note.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating note: ${note.title}`);
      await authRequest(note.userId, 'post', '/api/v1/notes', {
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        color: note.color || '#FFFFFF',
        isPinned: note.isPinned || false
      });
    } catch (error) {
      console.error(`Failed to create note ${note.title}:`, error.message);
    }
  }
  
  console.log('Notes creation complete.');
};

// 3. Create bookmarks and bookmark folders
const createBookmarksAndFolders = async () => {
  console.log('Creating bookmark folders...');
  
  // Create folders first
  for (const folder of dbData.bookmarkFolders) {
    try {
      if (!tokens[folder.userId]) {
        console.log(`Skipping bookmark folder for user ${folder.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating bookmark folder: ${folder.name}`);
      await authRequest(folder.userId, 'post', '/api/v1/bookmark-folders', {
        name: folder.name,
        description: folder.description,
        parentFolderId: folder.parentFolderId,
        color: folder.color
      });
    } catch (error) {
      console.error(`Failed to create bookmark folder ${folder.name}:`, error.message);
    }
  }
  
  console.log('Creating bookmarks...');
  
  // Then create bookmarks
  for (const bookmark of dbData.bookmarks) {
    try {
      if (!tokens[bookmark.userId]) {
        console.log(`Skipping bookmark for user ${bookmark.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating bookmark: ${bookmark.title}`);
      await authRequest(bookmark.userId, 'post', '/api/v1/bookmarks', {
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description || '',
        favicon: bookmark.favicon || '',
        tags: bookmark.tags || [],
        category: bookmark.category || 'General'
      });
    } catch (error) {
      console.error(`Failed to create bookmark ${bookmark.title}:`, error.message);
    }
  }
  
  console.log('Bookmarks and folders creation complete.');
};

// 4. Create passwords
const createPasswords = async () => {
  console.log('Creating passwords...');
  
  for (const pwd of dbData.passwords) {
    try {
      if (!tokens[pwd.userId]) {
        console.log(`Skipping password for user ${pwd.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating password entry: ${pwd.name || pwd.serviceName}`);
      await authRequest(pwd.userId, 'post', '/api/v1/passwords', {
        name: pwd.name || pwd.serviceName,
        username: pwd.username,
        password: 'TestPassword123!', // Use a test password instead of the encrypted one
        website: pwd.website,
        notes: pwd.notes || '',
        category: pwd.category || 'Other',
        isFavorite: pwd.isFavorite || false
      });
    } catch (error) {
      console.error(`Failed to create password ${pwd.name || pwd.serviceName}:`, error.message);
    }
  }
  
  console.log('Passwords creation complete.');
};

// 5. Create wallet cards
const createWalletCards = async () => {
  console.log('Creating wallet cards...');
  
  for (const card of dbData.walletCards) {
    try {
      if (!tokens[card.userId]) {
        console.log(`Skipping wallet card for user ${card.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating wallet card: ${card.name}`);
      await authRequest(card.userId, 'post', '/api/v1/wallet/cards', {
        type: card.type,
        issuer: card.issuer,
        name: card.name,
        cardNumber: '4111111111111111', // Use a test card number
        cardholderName: card.cardholderName,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        cvv: '123', // Use a test CVV
        billingAddress: card.billingAddress || {
          line1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'United States'
        },
        color: card.color || '#FF5722',
        isFavorite: card.isFavorite || false
      });
    } catch (error) {
      console.error(`Failed to create wallet card ${card.name}:`, error.message);
    }
  }
  
  console.log('Wallet cards creation complete.');
};

// 6. Create voice memos
const createVoiceMemos = async () => {
  console.log('Creating voice memos...');
  
  for (const memo of dbData.voiceMemos) {
    try {
      if (!tokens[memo.userId]) {
        console.log(`Skipping voice memo for user ${memo.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating voice memo: ${memo.title}`);
      await authRequest(memo.userId, 'post', '/api/v1/voice-memos', {
        title: memo.title,
        description: memo.description,
        fileUrl: memo.fileUrl,
        duration: memo.duration,
        transcription: memo.transcription,
        tags: memo.tags || []
      });
    } catch (error) {
      console.error(`Failed to create voice memo ${memo.title}:`, error.message);
    }
  }
  
  console.log('Voice memos creation complete.');
};

// 7. Create folders and files
const createFoldersAndFiles = async () => {
  console.log('Creating folders...');
  
  // Create folders first
  for (const folder of dbData.folders) {
    try {
      if (!tokens[folder.userId]) {
        console.log(`Skipping folder for user ${folder.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating folder: ${folder.name}`);
      await authRequest(folder.userId, 'post', '/api/v1/folders', {
        name: folder.name,
        description: folder.description,
        parentFolderId: folder.parentFolderId,
        color: folder.color
      });
    } catch (error) {
      console.error(`Failed to create folder ${folder.name}:`, error.message);
    }
  }
  
  console.log('Creating files...');
  
  // Then create files
  for (const file of dbData.files) {
    try {
      if (!tokens[file.userId]) {
        console.log(`Skipping file for user ${file.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating file: ${file.name}`);
      await authRequest(file.userId, 'post', '/api/v1/files', {
        name: file.name,
        type: file.type,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
        thumbnailUrl: file.thumbnailUrl,
        folderId: file.folderId,
        tags: file.tags || [],
        isFavorite: file.isFavorite || false,
        isArchived: file.isArchived || false
      });
    } catch (error) {
      console.error(`Failed to create file ${file.name}:`, error.message);
    }
  }
  
  console.log('Folders and files creation complete.');
};

// 8. Create albums and photos
const createAlbumsAndPhotos = async () => {
  console.log('Creating albums...');
  
  // Create albums first
  for (const album of dbData.albums) {
    try {
      if (!tokens[album.userId]) {
        console.log(`Skipping album for user ${album.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating album: ${album.name}`);
      await authRequest(album.userId, 'post', '/api/v1/albums', {
        name: album.name,
        description: album.description,
        coverPhotoId: album.coverPhotoId
      });
    } catch (error) {
      console.error(`Failed to create album ${album.name}:`, error.message);
    }
  }
  
  console.log('Creating photos...');
  
  // Then create photos
  for (const photo of dbData.photos) {
    try {
      if (!tokens[photo.userId]) {
        console.log(`Skipping photo for user ${photo.userId} - no token available`);
        continue;
      }
      
      if (!photo.title) {
        console.log(`Skipping photo with no title`);
        continue;
      }
      
      console.log(`Creating photo: ${photo.title}`);
      await authRequest(photo.userId, 'post', '/api/v1/photos', {
        title: photo.title,
        description: photo.description || '',
        url: photo.url || 'https://via.placeholder.com/1920x1080',
        thumbnailUrl: photo.thumbnailUrl || 'https://via.placeholder.com/300x200',
        albumId: photo.albumId,
        width: photo.width || 1920,
        height: photo.height || 1080,
        size: photo.size || 1000000,
        mimeType: photo.mimeType || 'image/jpeg',
        tags: photo.tags || [],
        location: photo.location,
        isFavorite: photo.isFavorite || false
      });
    } catch (error) {
      console.error(`Failed to create photo ${photo.title}:`, error.message);
    }
  }
  
  console.log('Albums and photos creation complete.');
};

// 9. Create resumes
const createResumes = async () => {
  console.log('Creating resumes...');
  
  for (const resume of dbData.resume) {
    try {
      if (!resume.userId && !tokens['user1']) {
        console.log(`Skipping resume for unknown user - no token available`);
        continue;
      }
      
      const userId = resume.userId || 'user1';
      
      if (!tokens[userId]) {
        console.log(`Skipping resume for user ${userId} - no token available`);
        continue;
      }
      
      console.log(`Creating resume: ${resume.name}`);
      await authRequest(userId, 'post', '/api/v1/resume', resume);
    } catch (error) {
      console.error(`Failed to create resume ${resume.name}:`, error.message);
    }
  }
  
  console.log('Resumes creation complete.');
};

// 10. Create tags
const createTags = async () => {
  console.log('Creating tags...');
  
  for (const tag of dbData.tags) {
    try {
      if (!tokens[tag.userId]) {
        console.log(`Skipping tag for user ${tag.userId} - no token available`);
        continue;
      }
      
      console.log(`Creating tag: ${tag.name}`);
      await authRequest(tag.userId, 'post', '/api/v1/tags', {
        name: tag.name,
        color: tag.color
      });
    } catch (error) {
      console.error(`Failed to create tag ${tag.name}:`, error.message);
    }
  }
  
  console.log('Tags creation complete.');
};

// Main function to run the population script
const populateBackend = async () => {
  try {
    console.log('Starting backend population...');
    console.log(`Using API URL: ${API_URL}`);
    
    // Execute the population steps in sequence
    await registerUsers();
    await createTags(); // Create tags first as they might be referenced by other entities
    await createNotes();
    await createBookmarksAndFolders();
    await createPasswords();
    await createWalletCards();
    await createVoiceMemos();
    await createFoldersAndFiles();
    await createAlbumsAndPhotos();
    await createResumes();
    
    console.log('Backend population complete!');
  } catch (error) {
    console.error('Error during backend population:', error);
  }
};

// Run the script
populateBackend();