import React, { useState, useEffect, useCallback } from 'react';
import { listCards, deleteCard } from '../../services/digitalWalletService';
import AddEditCardComponent from '../../components/wallet/AddEditCardComponent';
import { Button, Card, Col, Row, Typography, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const WalletDashboardPage = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listCards();
      if (response.success && response.data.cards) {
        setCards(response.data.cards);
      } else {
        setError(response.error || 'Failed to load cards.');
        setCards([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching cards.');
      console.error('Fetch cards error:', err);
      setCards([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleAddCard = () => {
    setSelectedCard(null);
    setShowAddEditModal(true);
  };

  const handleEditCard = (card) => {
    setSelectedCard(card);
    setShowAddEditModal(true);
  };

  const handleDeleteCard = (cardId, cardName) => {
    Modal.confirm({
      title: `Are you sure you want to delete the card "${cardName}"?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        setLoading(true);
        try {
          const response = await deleteCard(cardId);
          if (response.success) {
            message.success('Card deleted successfully');
            fetchCards();
          } else {
            message.error(response.error || 'Failed to delete card.');
          }
        } catch (err) {
          message.error('An unexpected error occurred during deletion.');
          console.error('Delete card error:', err);
        }
        setLoading(false);
      },
    });
  };

  const handleSaveSuccess = () => {
    setShowAddEditModal(false);
    fetchCards();
  };

  const getCardType = (cardNumber) => {
    if (!cardNumber) return 'unknown';
    if (/^4/.test(cardNumber)) return 'visa';
    if (/^5[1-5]/.test(cardNumber)) return 'mastercard';
    if (/^3[47]/.test(cardNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cardNumber)) return 'discover';
    return 'other';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Digital Wallet</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCard}>
          Add New Card
        </Button>
      </div>

      {error && <Text type="danger">{error}</Text>}

      {showAddEditModal && (
        <AddEditCardComponent
          cardData={selectedCard}
          onClose={() => setShowAddEditModal(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {cards.length > 0 ? (
        <Row gutter={[16, 16]}>
          {cards.map((card) => {
            const cardType = getCardType(card.cardNumber);
            let cardBgColor = '#4a5568'; // gray-700
            if (cardType === 'visa') cardBgColor = '#3182ce'; // blue-600
            if (cardType === 'mastercard') cardBgColor = '#e53e3e'; // red-600
            if (cardType === 'amex') cardBgColor = '#38a169'; // green-600
            if (cardType === 'discover') cardBgColor = '#dd6b20'; // orange-500

            return (
              <Col xs={24} sm={12} lg={8} key={card.id}>
                <Card
                  style={{ backgroundColor: cardBgColor, color: 'white' }}
                  bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 200 }}
                  hoverable
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <Title level={4} style={{ color: 'white', margin: 0, textTransform: 'uppercase' }}>
                        {card.cardholderName || 'Cardholder Name'}
                      </Title>
                      <Text style={{ fontFamily: 'monospace', fontStyle: 'italic', color: 'white', fontSize: 16 }}>
                        {cardType.toUpperCase()}
                      </Text>
                    </div>
                    <Text style={{ fontSize: 24, fontFamily: 'monospace', letterSpacing: 4, color: 'white' }}>
                      •••• •••• •••• {card.last4Digits || 'XXXX'}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <Text style={{ textTransform: 'uppercase', opacity: 0.7, fontSize: 12 }}>Expires</Text>
                      <Title level={5} style={{ color: 'white', margin: 0 }}>
                        {card.expiryDate || 'MM/YY'}
                      </Title>
                    </div>
                    <div>
                      <Button size="small" icon={<EditOutlined />} onClick={() => handleEditCard(card)} style={{ marginRight: 8 }}>
                        Edit
                      </Button>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCard(card.id, card.cardholderName || 'this card')}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        !loading && <Text style={{ display: 'block', textAlign: 'center', padding: 40, fontSize: 16, color: '#718096' }}>Your wallet is empty. Add a card to get started!</Text>
      )}
    </div>
  );
};
