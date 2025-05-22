// backend/src/handlers/wallet/walletCardHandlers.js
const {
  createWalletCard,
  getWalletCards,
  getWalletCardById,
  updateWalletCard,
  deleteWalletCard,
} = require('../../controllers/walletCardController');
const { createHandler } = require('../handlerUtils');

/**
 * @function handleCreateWalletCard
 * @description Handles the request to create a new wallet card.
 */
exports.handleCreateWalletCard = createHandler(createWalletCard);

/**
 * @function handleGetWalletCards
 * @description Handles the request to get all wallet cards.
 */
exports.handleGetWalletCards = createHandler(getWalletCards);

/**
 * @function handleGetWalletCardById
 * @description Handles the request to get a single wallet card by its ID.
 */
exports.handleGetWalletCardById = createHandler(getWalletCardById);

/**
 * @function handleUpdateWalletCard
 * @description Handles the request to update an existing wallet card.
 */
exports.handleUpdateWalletCard = createHandler(updateWalletCard);

/**
 * @function handleDeleteWalletCard
 * @description Handles the request to delete a wallet card.
 */
exports.handleDeleteWalletCard = createHandler(deleteWalletCard);
