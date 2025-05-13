// /src/services/digitalWalletService.js

import { get, post, put, del } from './apiService';

/**
 * List stored credit/debit cards
 * @param {object} filters (optional, e.g., search term)
 * @returns {Promise<object>} - { success: boolean, data: [] | error: string }
 */
export const listCards = async (filters = {}) => {
  console.log("[DigitalWalletService] Listing cards with filters:", filters);

  // Convert filters to query parameters if needed
  const queryParams = {};

  if (filters.query) {
    queryParams.q = filters.query;
  }

  try {
    const response = await get('wallet/cards', queryParams);

    if (response.success) {
      return {
        success: true,
        data: {
          cards: response.data
        }
      };
    }
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch cards"
    };
  }
};

/**
 * Add a new card
 * @param {object} cardData - { cardNumber, expiryDate, cvv, cardholderName, cardType }
 * @param {string} masterPasswordOrToken - For encryption key derivation
 * @returns {Promise<object>} - { success: boolean, data: { card: {} } | error: string }
 */
export const addCard = async (cardData, masterPasswordOrToken) => {
  console.log("[DigitalWalletService] Adding card for:", cardData.cardholderName);

  // Extract last four digits from card number for display purposes
  const lastFourDigits = cardData.cardNumber.slice(-4);

  // In a real app, sensitive data would be encrypted
  // For our mock API, we'll format the data as needed by the DB schema
  const payload = {
    userId: 'user1', // Default user for demo
    type: cardData.cardType?.toLowerCase() || 'credit',
    issuer: cardData.cardType || 'Card',
    name: cardData.name || `${cardData.cardType || ''} Card`,
    cardNumber: `encrypted_${cardData.cardNumber}`, // In real app would be encrypted
    cardholderName: cardData.cardholderName,
    expiryMonth: parseInt(cardData.expiryDate?.split('/')[0]) || 12,
    expiryYear: 2000 + parseInt(cardData.expiryDate?.split('/')[1]) || 2025,
    cvv: `encrypted_${cardData.cvv}`, // In real app would be encrypted
    color: cardData.color || "#FF5722",
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (cardData.billingAddress) {
    payload.billingAddress = {
      line1: cardData.billingAddress,
      city: "Unknown",
      state: "Unknown",
      postalCode: "00000",
      country: "United States"
    };
  }

  try {
    const response = await post('wallet/cards', payload);

    if (response.success) {
      // Format the response to match the expected format in the UI
      return {
        success: true,
        data: {
          card: {
            id: response.data.id,
            cardType: response.data.issuer,
            lastFourDigits: lastFourDigits,
            expiryDate: cardData.expiryDate,
            cardholderName: response.data.cardholderName
          }
        }
      };
    }
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to add card"
    };
  }
};

/**
 * Update an existing card
 * @param {string} cardId
 * @param {object} updateData - { expiryDate (optional), cardholderName (optional) }
 * @param {string} masterPasswordOrToken - For re-encryption if sensitive data changes
 * @returns {Promise<object>} - { success: boolean, data: { card: {} } | error: string }
 */
export const updateCard = async (cardId, updateData, masterPasswordOrToken) => {
  console.log("[DigitalWalletService] Updating card:", cardId, "Data:", updateData);

  // Format update data for API
  const payload = {
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  // Handle expiry date conversion if provided
  if (updateData.expiryDate) {
    payload.expiryMonth = parseInt(updateData.expiryDate.split('/')[0]) || 12;
    payload.expiryYear = 2000 + parseInt(updateData.expiryDate.split('/')[1]) || 2025;
  }

  // If new card number is provided, encrypt it (simulated) and extract last four
  let lastFourDigits;
  if (updateData.cardNumber) {
    lastFourDigits = updateData.cardNumber.slice(-4);
    payload.cardNumber = `encrypted_${updateData.cardNumber}`;
  }

  // If new CVV is provided, encrypt it (simulated)
  if (updateData.cvv) {
    payload.cvv = `encrypted_${updateData.cvv}`;
  }

  try {
    const response = await put(`wallet/cards/${cardId}`, payload);

    // Get updated card data to return to UI
    if (response.success) {
      try {
        const cardResponse = await get(`wallet/cards/${cardId}`);

        if (cardResponse.success) {
          return {
            success: true,
            data: {
              card: {
                id: cardResponse.data.id,
                cardType: cardResponse.data.issuer,
                lastFourDigits: lastFourDigits || cardResponse.data.cardNumber.slice(-4),
                expiryDate: updateData.expiryDate || `${cardResponse.data.expiryMonth}/${cardResponse.data.expiryYear.toString().slice(-2)}`,
                cardholderName: cardResponse.data.cardholderName
              }
            }
          };
        }
      } catch (getError) {
        // If we can't get the updated card, at least indicate success
        return {
          success: true,
          data: {
            card: {
              id: cardId,
              ...updateData
            }
          }
        };
      }
    }
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update card"
    };
  }
};

/**
 * Delete a card
 * @param {string} cardId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deleteCard = async (cardId) => {
  console.log("[DigitalWalletService] Deleting card:", cardId);
  return del(`wallet/cards/${cardId}`);
};

/**
 * Get full card details (requires strong auth, e.g., master password)
 * This would be a highly sensitive operation.
 * @param {string} cardId
 * @param {string} masterPasswordOrToken - For decryption key derivation
 * @returns {Promise<object>} - { success: boolean, data: { cardDetails: {} } | error: string }
 */
export const getCardDetails = async (cardId, masterPasswordOrToken) => {
  console.log("[DigitalWalletService] Getting details for card:", cardId);

  // In a real app, the master password would be sent to server for decryption
  // For demo, we'll simulate the "decryption" with the correct password
  if (masterPasswordOrToken === "correct-master-password") {
    try {
      const response = await get(`wallet/cards/${cardId}`);

      if (response.success) {
        // Format expiry date as MM/YY for UI
        const expiryMonth = String(response.data.expiryMonth).padStart(2, '0');
        const expiryYear = response.data.expiryYear.toString().slice(-2);
        const expiryDate = `${expiryMonth}/${expiryYear}`;

        // "Decrypt" the card number (simulate - in real app this would be done server-side)
        // Just take the raw stored value and return formatted with last 4 visible
        const cardNumber = response.data.cardNumber.replace('encrypted_', '');

        return {
          success: true,
          data: {
            cardDetails: {
              id: response.data.id,
              cardType: response.data.issuer,
              cardNumber: cardNumber, // In a real app, this would be the decrypted value
              expiryDate: expiryDate,
              cvv: response.data.cvv.replace('encrypted_', ''), // In a real app, this would be decrypted
              cardholderName: response.data.cardholderName
            }
          }
        };
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to retrieve card details"
      };
    }
  }

  return {
    success: false,
    error: "Decryption failed or invalid master password"
  };
};
