const { v4: uuidv4 } = require('uuid');
const { dynamoDB, getTableName } = require('../config/aws');
const { AppError } = require('../middleware/errorHandler');

// In-memory store for development mode
const devMode = process.env.NODE_ENV === 'development';
const devStore = {
  notes: {},
  notesByUser: {}
};

/**
 * Create a new note
 */
const createNote = async (userId, noteData) => {
  const { title, content, tags = [], color = '#FFFFFF', isPinned = false } = noteData;

  const timestamp = new Date().toISOString();
  
  const note = {
    id: uuidv4(),
    userId,
    title,
    content,
    tags,
    color,
    isPinned,
    isTrashed: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  try {
    if (devMode) {
      // Store in memory for development
      devStore.notes[note.id] = note;
      
      // Add to user's notes
      devStore.notesByUser[userId] = devStore.notesByUser[userId] || [];
      devStore.notesByUser[userId].push(note.id);
    } else {
      // Save to DynamoDB
      await dynamoDB.put({
        TableName: getTableName('notes'),
        Item: note
      }).promise();
    }

    return note;
  } catch (error) {
    console.error('Error creating note:', error);
    throw new AppError('Error creating note', 500);
  }
};

/**
 * Get all notes for a user
 */
const getNotes = async (userId, options = {}) => {
  const { isPinned, isTrashed, limit = 100, lastEvaluatedKey } = options;

  try {
    if (devMode) {
      // Get from memory for development
      const userNoteIds = devStore.notesByUser[userId] || [];
      let notes = userNoteIds.map(id => devStore.notes[id]).filter(note => note !== undefined);
      
      // Apply filters
      if (isPinned !== undefined) {
        notes = notes.filter(note => note.isPinned === isPinned);
      }
      
      if (isTrashed !== undefined) {
        notes = notes.filter(note => note.isTrashed === isTrashed);
      }
      
      // Sort by updatedAt (newest first)
      notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      // Apply pagination
      const startIndex = lastEvaluatedKey ? parseInt(lastEvaluatedKey) : 0;
      const endIndex = startIndex + limit;
      const paginatedNotes = notes.slice(startIndex, endIndex);
      
      // Generate next token
      const nextToken = endIndex < notes.length ? endIndex.toString() : null;
      
      return {
        notes: paginatedNotes,
        nextToken
      };
    } else {
      // Get from DynamoDB
      let params = {
        TableName: getTableName('notes'),
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        Limit: limit
      };

      // Add filter for pinned/trashed if specified
      if (isPinned !== undefined || isTrashed !== undefined) {
        let filterExpressions = [];
        
        if (isPinned !== undefined) {
          filterExpressions.push('isPinned = :isPinned');
          params.ExpressionAttributeValues[':isPinned'] = isPinned;
        }
        
        if (isTrashed !== undefined) {
          filterExpressions.push('isTrashed = :isTrashed');
          params.ExpressionAttributeValues[':isTrashed'] = isTrashed;
        }
        
        params.FilterExpression = filterExpressions.join(' AND ');
      }

      // Add pagination if lastEvaluatedKey is provided
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString());
      }

      const result = await dynamoDB.query(params).promise();

      // Format pagination token for next request
      let nextToken = null;
      if (result.LastEvaluatedKey) {
        nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
      }

      return {
        notes: result.Items,
        nextToken
      };
    }
  } catch (error) {
    console.error('Error getting notes:', error);
    throw new AppError('Error retrieving notes', 500);
  }
};

/**
 * Get a note by ID
 */
const getNoteById = async (noteId, userId) => {
  try {
    if (devMode) {
      // Get from memory for development
      const note = devStore.notes[noteId];
      
      if (!note) {
        return null;
      }
      
      // Check if the note belongs to the user
      if (note.userId !== userId) {
        throw new AppError('Not authorized to access this note', 403);
      }
      
      return note;
    } else {
      // Get from DynamoDB
      const result = await dynamoDB.get({
        TableName: getTableName('notes'),
        Key: { id: noteId }
      }).promise();

      if (!result.Item) {
        return null;
      }

      // Check if the note belongs to the user
      if (result.Item.userId !== userId) {
        throw new AppError('Not authorized to access this note', 403);
      }

      return result.Item;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error getting note by ID:', error);
    throw new AppError('Error retrieving note', 500);
  }
};

/**
 * Update a note
 */
const updateNote = async (noteId, userId, updateData) => {
  try {
    // Check if note exists and belongs to user
    const note = await getNoteById(noteId, userId);
    
    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // Don't allow updating userId or id
    const { userId: _, id: __, ...allowedUpdates } = updateData;

    if (devMode) {
      // Update in memory for development
      const updatedNote = {
        ...note,
        ...allowedUpdates,
        updatedAt: new Date().toISOString()
      };
      
      devStore.notes[noteId] = updatedNote;
      return updatedNote;
    } else {
      // Build update expression
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.entries(allowedUpdates).forEach(([key, value]) => {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      });

      // Add updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const updateExpression = `SET ${updateExpressions.join(', ')}`;

      const result = await dynamoDB.update({
        TableName: getTableName('notes'),
        Key: { id: noteId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }).promise();

      return result.Attributes;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error updating note:', error);
    throw new AppError('Error updating note', 500);
  }
};

/**
 * Delete a note (move to trash)
 */
const trashNote = async (noteId, userId) => {
  try {
    // Check if note exists and belongs to user
    const note = await getNoteById(noteId, userId);
    
    if (!note) {
      throw new AppError('Note not found', 404);
    }

    if (devMode) {
      // Update in memory for development
      devStore.notes[noteId] = {
        ...note,
        isTrashed: true,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Move to trash in DynamoDB
      await dynamoDB.update({
        TableName: getTableName('notes'),
        Key: { id: noteId },
        UpdateExpression: 'SET isTrashed = :isTrashed, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isTrashed': true,
          ':updatedAt': new Date().toISOString()
        }
      }).promise();
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error trashing note:', error);
    throw new AppError('Error moving note to trash', 500);
  }
};

/**
 * Permanently delete a note
 */
const deleteNote = async (noteId, userId) => {
  try {
    // Check if note exists and belongs to user
    const note = await getNoteById(noteId, userId);
    
    if (!note) {
      throw new AppError('Note not found', 404);
    }

    if (devMode) {
      // Delete from memory for development
      delete devStore.notes[noteId];
      
      // Remove from user's notes
      if (devStore.notesByUser[userId]) {
        devStore.notesByUser[userId] = devStore.notesByUser[userId].filter(id => id !== noteId);
      }
    } else {
      // Delete from DynamoDB
      await dynamoDB.delete({
        TableName: getTableName('notes'),
        Key: { id: noteId }
      }).promise();
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error deleting note:', error);
    throw new AppError('Error deleting note', 500);
  }
};

/**
 * Restore a note from trash
 */
const restoreNote = async (noteId, userId) => {
  try {
    // Check if note exists and belongs to user
    const note = await getNoteById(noteId, userId);
    
    if (!note) {
      throw new AppError('Note not found', 404);
    }

    if (devMode) {
      // Update in memory for development
      devStore.notes[noteId] = {
        ...note,
        isTrashed: false,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Restore from trash in DynamoDB
      await dynamoDB.update({
        TableName: getTableName('notes'),
        Key: { id: noteId },
        UpdateExpression: 'SET isTrashed = :isTrashed, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isTrashed': false,
          ':updatedAt': new Date().toISOString()
        }
      }).promise();
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error restoring note:', error);
    throw new AppError('Error restoring note from trash', 500);
  }
};

/**
 * Search notes by query
 */
const searchNotes = async (userId, query, options = {}) => {
  const { isTrashed = false, limit = 100, lastEvaluatedKey } = options;

  try {
    if (devMode) {
      // Search in memory for development
      const userNoteIds = devStore.notesByUser[userId] || [];
      let notes = userNoteIds.map(id => devStore.notes[id]).filter(note => note !== undefined);
      
      // Filter by trashed status
      notes = notes.filter(note => note.isTrashed === isTrashed);
      
      // Filter by query
      const lowerQuery = query.toLowerCase();
      notes = notes.filter(note => 
        note.title.toLowerCase().includes(lowerQuery) || 
        note.content.toLowerCase().includes(lowerQuery)
      );
      
      // Sort by updatedAt (newest first)
      notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      // Apply pagination
      const startIndex = lastEvaluatedKey ? parseInt(lastEvaluatedKey) : 0;
      const endIndex = startIndex + limit;
      const paginatedNotes = notes.slice(startIndex, endIndex);
      
      // Generate next token
      const nextToken = endIndex < notes.length ? endIndex.toString() : null;
      
      return {
        notes: paginatedNotes,
        nextToken
      };
    } else {
      // DynamoDB doesn't support full-text search, so we'll scan and filter
      // In a production environment, consider using Elasticsearch or another search service
      let params = {
        TableName: getTableName('notes'),
        FilterExpression: 'userId = :userId AND isTrashed = :isTrashed AND (contains(#title, :query) OR contains(#content, :query))',
        ExpressionAttributeNames: {
          '#title': 'title',
          '#content': 'content'
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':isTrashed': isTrashed,
          ':query': query
        },
        Limit: limit
      };

      // Add pagination if lastEvaluatedKey is provided
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString());
      }

      const result = await dynamoDB.scan(params).promise();

      // Format pagination token for next request
      let nextToken = null;
      if (result.LastEvaluatedKey) {
        nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
      }

      return {
        notes: result.Items,
        nextToken
      };
    }
  } catch (error) {
    console.error('Error searching notes:', error);
    throw new AppError('Error searching notes', 500);
  }
};

/**
 * Get notes by tag
 */
const getNotesByTag = async (userId, tag, options = {}) => {
  const { isTrashed = false, limit = 100, lastEvaluatedKey } = options;

  try {
    if (devMode) {
      // Search in memory for development
      const userNoteIds = devStore.notesByUser[userId] || [];
      let notes = userNoteIds.map(id => devStore.notes[id]).filter(note => note !== undefined);
      
      // Filter by trashed status
      notes = notes.filter(note => note.isTrashed === isTrashed);
      
      // Filter by tag
      notes = notes.filter(note => note.tags && note.tags.includes(tag));
      
      // Sort by updatedAt (newest first)
      notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      // Apply pagination
      const startIndex = lastEvaluatedKey ? parseInt(lastEvaluatedKey) : 0;
      const endIndex = startIndex + limit;
      const paginatedNotes = notes.slice(startIndex, endIndex);
      
      // Generate next token
      const nextToken = endIndex < notes.length ? endIndex.toString() : null;
      
      return {
        notes: paginatedNotes,
        nextToken
      };
    } else {
      let params = {
        TableName: getTableName('notes'),
        FilterExpression: 'userId = :userId AND isTrashed = :isTrashed AND contains(#tags, :tag)',
        ExpressionAttributeNames: {
          '#tags': 'tags'
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':isTrashed': isTrashed,
          ':tag': tag
        },
        Limit: limit
      };

      // Add pagination if lastEvaluatedKey is provided
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = JSON.parse(Buffer.from(lastEvaluatedKey, 'base64').toString());
      }

      const result = await dynamoDB.scan(params).promise();

      // Format pagination token for next request
      let nextToken = null;
      if (result.LastEvaluatedKey) {
        nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
      }

      return {
        notes: result.Items,
        nextToken
      };
    }
  } catch (error) {
    console.error('Error getting notes by tag:', error);
    throw new AppError('Error retrieving notes by tag', 500);
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  trashNote,
  deleteNote,
  restoreNote,
  searchNotes,
  getNotesByTag
};