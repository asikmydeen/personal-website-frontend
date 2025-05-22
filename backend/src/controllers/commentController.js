// backend/src/controllers/commentController.js

/**
 * @async
 * @function getComments
 * @description Stub for getting all comments.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
async function getComments(req, res) {
  // TODO: Implement logic to get all comments
  // Consider filtering by resourceId if applicable (e.g., req.query.resourceId)
  res.status(501).json({ message: "Not Implemented: Get All Comments" });
}

/**
 * @async
 * @function getCommentById
 * @description Stub for getting a single comment by its ID.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
async function getCommentById(req, res) {
  // TODO: Implement logic to get a comment by ID
  const { id } = req.params;
  res.status(501).json({ message: `Not Implemented: Get Comment by ID ${id}` });
}

/**
 * @async
 * @function createComment
 * @description Stub for creating a new comment.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
async function createComment(req, res) {
  // TODO: Implement logic to create a comment
  // Will likely need req.body.resourceId and req.body.content
  res.status(501).json({ message: "Not Implemented: Create Comment" });
}

/**
 * @async
 * @function updateComment
 * @description Stub for updating an existing comment.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
async function updateComment(req, res) {
  // TODO: Implement logic to update a comment
  const { id } = req.params;
  // Will likely need req.body.content
  res.status(501).json({ message: `Not Implemented: Update Comment ${id}` });
}

/**
 * @async
 * @function deleteComment
 * @description Stub for deleting a comment.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
async function deleteComment(req, res) {
  // TODO: Implement logic to delete a comment
  const { id } = req.params;
  res.status(501).json({ message: `Not Implemented: Delete Comment ${id}` });
}

module.exports = {
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
};
