const {
  createWalletCard,
  getWalletCards,
  getWalletCardById,
  updateWalletCard,
  deleteWalletCard,
} = require('../../src/controllers/walletCardController');
const { AppError } = require('../../src/middleware/errorHandler');
const { dynamoDB, getTableName } = require('../../src/config/aws');
const { v4: uuidv4 } = require('uuid');
const encryptionService = require('../../src/services/encryptionService');

// Mock external dependencies
jest.mock('../../src/config/aws', () => ({
  dynamoDB: {
    put: jest.fn(),
    query: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  getTableName: jest.fn((tableName) => `${process.env.STAGE || 'dev'}-${tableName}`),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

jest.mock('../../src/services/encryptionService', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  isKeyConfigured: jest.fn(),
}));

// Helper to generate mock encrypted payload
const mockEncryptedPayload = (fieldBaseName, plainText) => ({
  iv: `${fieldBaseName}_iv_${plainText}`,
  encryptedData: `${fieldBaseName}_encrypted_${plainText}`,
  authTag: `${fieldBaseName}_authTag_${plainText}`,
});

describe('WalletCard Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: 'testUserId' },
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(), 
    };
    mockNext = jest.fn();

    uuidv4.mockReset();
    getTableName.mockClear();
    encryptionService.encrypt.mockReset();
    encryptionService.decrypt.mockReset();
    encryptionService.isKeyConfigured.mockReset();

    const mockPromise = jest.fn().mockResolvedValue({});
    Object.values(dynamoDB).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReturnValue({ promise: mockPromise });
      }
    });
    encryptionService.isKeyConfigured.mockReturnValue(true);
  });

  // --- createWalletCard ---
  describe('createWalletCard', () => {
    const validCardData = {
      cardholderName: 'Test User',
      cardNumber: '1234567890123456',
      expiryDate: '12/25',
      cvv: '123',
      cardType: 'Visa',
      bankName: 'Test Bank',
    };

    beforeEach(() => {
      encryptionService.encrypt.mockImplementation((text) => mockEncryptedPayload('field', text));
      uuidv4.mockReturnValue('new-card-uuid');
      dynamoDB.put.mockReturnValue({ promise: jest.fn().mockResolvedValueOnce({}) });
    });

    it('should create a wallet card successfully', async () => {
      mockReq.body = validCardData;
      await createWalletCard(mockReq, mockRes, mockNext);

      expect(encryptionService.isKeyConfigured).toHaveBeenCalled();
      expect(encryptionService.encrypt).toHaveBeenCalledWith(validCardData.cardholderName);
      expect(encryptionService.encrypt).toHaveBeenCalledWith(validCardData.cardNumber);
      expect(encryptionService.encrypt).toHaveBeenCalledWith(validCardData.expiryDate);
      expect(encryptionService.encrypt).toHaveBeenCalledWith(validCardData.cvv);
      
      expect(dynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.stringContaining('walletCards'),
        Item: expect.objectContaining({
          id: 'new-card-uuid',
          userId: 'testUserId',
          last4Digits: '3456',
          // Check one encrypted field as an example
          ivCardholderName: expect.stringContaining('iv'),
          encryptedCardholderName: expect.stringContaining('encrypted'),
          authTagCardholderName: expect.stringContaining('authTag'),
        }),
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: 'new-card-uuid', last4Digits: '3456' }),
      }));
    });

    it('should return 400 if cardholderName is missing', async () => {
      mockReq.body = { ...validCardData, cardholderName: undefined };
      await createWalletCard(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
    
    it('should return 400 for invalid card number', async () => {
      mockReq.body = { ...validCardData, cardNumber: '123' };
      await createWalletCard(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid card number format/length.');
    });

    it('should return 400 for invalid expiry date', async () => {
      mockReq.body = { ...validCardData, expiryDate: '123/45' };
      await createWalletCard(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid expiry date format. Use MM/YY.');
    });
    
    it('should return 400 for invalid CVV', async () => {
      mockReq.body = { ...validCardData, cvv: '12' };
      await createWalletCard(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid CVV format. Must be 3 or 4 digits.');
    });

    it('should return 500 if encryption key is not configured', async () => {
      encryptionService.isKeyConfigured.mockReturnValueOnce(false);
      mockReq.body = validCardData;
      await createWalletCard(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(500);
    });
  });

  // --- getWalletCards ---
  describe('getWalletCards', () => {
    const mockRawCards = [
      { id: 'card1', userId: 'testUserId', last4Digits: '1111', ivCardNumber: 'ivN1', encryptedCardNumber: 'encN1', authTagCardNumber: 'atN1', /* other encrypted fields */ },
      { id: 'card2', userId: 'testUserId', last4Digits: '2222', ivCardNumber: 'ivN2', encryptedCardNumber: 'encN2', authTagCardNumber: 'atN2', /* other encrypted fields */ },
    ];
    beforeEach(() => {
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: mockRawCards, LastEvaluatedKey: null }) });
      // Mock decrypt to return based on the field name for simplicity in checking
      encryptionService.decrypt.mockImplementation(payload => {
        if (payload.encryptedData.startsWith('encryptedCardholderName')) return 'Decrypted Name';
        if (payload.encryptedData.startsWith('encryptedCardNumber')) return 'Decrypted CardNumber';
        if (payload.encryptedData.startsWith('encryptedExpiryDate')) return 'Decrypted Expiry';
        if (payload.encryptedData.startsWith('encryptedCvv')) return 'Decrypted CVV';
        return `decrypted_${payload.encryptedData}`;
      });
    });

    it('should get and decrypt cards successfully', async () => {
      await getWalletCards(mockReq, mockRes, mockNext);
      expect(dynamoDB.query).toHaveBeenCalled();
      expect(encryptionService.decrypt).toHaveBeenCalledTimes(mockRawCards.length * 4); // 4 fields per card
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'card1', cardNumber: 'Decrypted CardNumber' }),
          expect.objectContaining({ id: 'card2', cardNumber: 'Decrypted CardNumber' }),
        ]),
      }));
    });
    
    it('should handle decryption error for a field in one card', async () => {
      // Make decryption fail for cardNumber of the first card
      encryptionService.decrypt.mockImplementation(payload => {
        if (payload.encryptedData === 'encN1' && payload.ivKey === 'ivCardNumber') throw new Error("Decryption error for card1 number");
        return `decrypted_${payload.encryptedData}`; // Default successful decryption
      });
      
       // Re-setup mock for this specific test case
      const specificMockRawCards = [
        { id: 'card1', userId: 'testUserId', last4Digits: '1111', 
          ivCardholderName: 'ivCN1', encryptedCardholderName: 'encCN1', authTagCardholderName: 'atCN1',
          ivCardNumber: 'ivN1', encryptedCardNumber: 'encN1', authTagCardNumber: 'atN1', 
          ivExpiryDate: 'ivED1', encryptedExpiryDate: 'encED1', authTagExpiryDate: 'atED1',
          ivCvv: 'ivCVV1', encryptedCvv: 'encCVV1', authTagCvv: 'atCVV1'
        },
      ];
      dynamoDB.query.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: specificMockRawCards, LastEvaluatedKey: null }) });


      await getWalletCards(mockReq, mockRes, mockNext);
      const responseData = mockRes.json.mock.calls[0][0].data[0];
      expect(responseData.cardNumber).toBeNull();
      expect(responseData.cardNumberDecryptionError).toBe(true);
      expect(responseData.decryptionError).toBe(true); // Overall flag
    });
  });

  // --- getWalletCardById ---
  describe('getWalletCardById', () => {
    const cardId = 'card-abc';
    const rawCard = { 
      id: cardId, userId: 'testUserId', last4Digits: '4321',
      ivCardholderName: 'ivCN', encryptedCardholderName: 'encCN', authTagCardholderName: 'atCN',
      ivCardNumber: 'ivN', encryptedCardNumber: 'encN', authTagCardNumber: 'atN',
      ivExpiryDate: 'ivED', encryptedExpiryDate: 'encED', authTagExpiryDate: 'atED',
      ivCvv: 'ivCVV', encryptedCvv: 'encCVV', authTagCvv: 'atCVV'
    };

    it('should get and decrypt card by ID successfully', async () => {
      mockReq.params.id = cardId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: rawCard }) });
      encryptionService.decrypt.mockImplementation(p => `dec_${p.encryptedData}`);
      
      await getWalletCardById(mockReq, mockRes, mockNext);
      expect(dynamoDB.get).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: cardId } }));
      expect(encryptionService.decrypt).toHaveBeenCalledTimes(4);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ id: cardId, cardNumber: 'dec_encN' }),
      }));
    });
    
    it('should return 404 if card not found', async () => {
      mockReq.params.id = 'non-existent';
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: null }) });
      await getWalletCardById(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  // --- updateWalletCard ---
  describe('updateWalletCard', () => {
    const cardId = 'card-to-update';
    const existingRawCard = {
      id: cardId, userId: 'testUserId', last4Digits: '1234',
      ivCardholderName: 'ivCN_old', encryptedCardholderName: 'encCN_old', authTagCardholderName: 'atCN_old',
      ivCardNumber: 'ivN_old', encryptedCardNumber: 'encN_old', authTagCardNumber: 'atN_old',
      // other fields
    };
    beforeEach(() => {
      mockReq.params.id = cardId;
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: existingRawCard }) });
      encryptionService.encrypt.mockImplementation((text) => mockEncryptedPayload('updatedField', text));
      // For decrypting the final response
      encryptionService.decrypt.mockImplementation(p => `decrypted_${p.encryptedData}`); 
    });

    it('should update card details (including sensitive fields) successfully', async () => {
      mockReq.body = { cardholderName: 'New Name', cardNumber: '9876543210987654' };
      const updatedAttributes = { 
        ...existingRawCard, 
        ivCardholderName: 'updatedField_iv_New Name', 
        encryptedCardholderName: 'updatedField_encrypted_New Name', 
        authTagCardholderName: 'updatedField_authTag_New Name',
        ivCardNumber: 'updatedField_iv_9876543210987654',
        encryptedCardNumber: 'updatedField_encrypted_9876543210987654',
        authTagCardNumber: 'updatedField_authTag_9876543210987654',
        last4Digits: '7654'
      };
      dynamoDB.update.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Attributes: updatedAttributes }) });

      await updateWalletCard(mockReq, mockRes, mockNext);
      expect(encryptionService.encrypt).toHaveBeenCalledWith('New Name');
      expect(encryptionService.encrypt).toHaveBeenCalledWith('9876543210987654');
      expect(dynamoDB.update).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ cardholderName: 'decrypted_updatedField_encrypted_New Name', last4Digits: '7654' }),
      }));
    });
  });

  // --- deleteWalletCard ---
  describe('deleteWalletCard', () => {
    it('should delete a card successfully', async () => {
      mockReq.params.id = 'card-to-delete';
      dynamoDB.get.mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: { id: 'card-to-delete', userId: 'testUserId' } }) });
      dynamoDB.delete.mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
      
      await deleteWalletCard(mockReq, mockRes, mockNext);
      expect(dynamoDB.delete).toHaveBeenCalledWith(expect.objectContaining({ Key: { id: 'card-to-delete' } }));
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });
});
