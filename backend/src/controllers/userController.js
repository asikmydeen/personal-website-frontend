const { getUserById, updateUser, updatePassword } = require('../services/userService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, bio, profilePicture } = req.body;
  
  // Only allow certain fields to be updated
  const updateData = {};
  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (profilePicture) updateData.profilePicture = profilePicture;

  const updatedUser = await updateUser(req.user.id, updateData);

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

/**
 * @desc    Get user settings
 * @route   GET /api/v1/users/settings
 * @access  Private
 */
const getUserSettings = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user.settings || {}
  });
});

/**
 * @desc    Update user settings
 * @route   PUT /api/v1/users/settings
 * @access  Private
 */
const updateUserSettings = asyncHandler(async (req, res) => {
  const { theme, notifications, twoFactorEnabled } = req.body;
  
  // Only allow certain settings to be updated
  const settings = {};
  if (theme) settings.theme = theme;
  if (notifications !== undefined) settings.notifications = notifications;
  if (twoFactorEnabled !== undefined) settings.twoFactorEnabled = twoFactorEnabled;

  const updatedUser = await updateUser(req.user.id, { settings });

  res.status(200).json({
    success: true,
    data: updatedUser.settings
  });
});

/**
 * @desc    Change user password
 * @route   PUT /api/v1/users/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current password and new password', 400);
  }

  const result = await updatePassword(req.user.id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserSettings,
  updateUserSettings,
  changePassword
};