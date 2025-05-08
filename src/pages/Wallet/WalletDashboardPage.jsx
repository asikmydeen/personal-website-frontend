import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import {
  CreditCard, Eye, EyeOff, Plus, Trash2, Edit, Copy, Key, Search
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { addCard, deleteCard, getCardDetails, updateCard } from '../../services/digitalWalletService';
import AddEditCardComponent from '../../components/wallet/AddEditCardComponent';

const WalletDashboardPage = () => {
  const { cards, fetchCards, setCards } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [cardDetails, setCardDetails] = useState(null);
  const [revealCVV, setRevealCVV] = useState(false);
  const [revealCardNumber, setRevealCardNumber] = useState(false);
  const [copied, setCopied] = useState(false);

  // Master password for demo purposes
  const demoMasterPassword = 'correct-master-password';

  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      try {
        await fetchCards();
      } catch (err) {
        setError('Failed to load cards. Please try again.');
        console.error('Error fetching cards:', err);
      }
      setLoading(false);
    };

    loadCards();
  }, [fetchCards]);

  const handleViewCardDetails = async (cardId) => {
    setSelectedCard(cardId);
    setIsViewDialogOpen(true);
    setMasterPassword('');
    setCardDetails(null);
    setError('');
    setRevealCVV(false);
    setRevealCardNumber(false);
  };

  const handleCardReveal = async () => {
    setLoading(true);
    try {
      const response = await getCardDetails(selectedCard, masterPassword);
      if (response.success) {
        setCardDetails(response.data.cardDetails);
        setError('');
      } else {
        setError('Invalid master password or decryption failed.');
        setCardDetails(null);
      }
    } catch (err) {
      setError('An error occurred while retrieving card details.');
      console.error('View card error:', err);
    }
    setLoading(false);
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      setLoading(true);
      try {
        const response = await deleteCard(cardId);
        if (response.success) {
          setCards(cards.filter(c => c.id !== cardId));
        } else {
          setError('Failed to delete card: ' + response.error);
        }
      } catch (err) {
        setError('An error occurred while deleting the card.');
        console.error('Delete card error:', err);
      }
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddEditCard = async (formData, isEdit = false) => {
    setLoading(true);
    try {
      let response;
      if (isEdit && selectedCard) {
        response = await updateCard(selectedCard, formData, demoMasterPassword);
      } else {
        response = await addCard(formData, demoMasterPassword);
      }

      if (response.success) {
        if (isEdit) {
          setCards(cards.map(c =>
            c.id === selectedCard ? response.data.card : c
          ));
          setIsEditDialogOpen(false);
        } else {
          setCards([...cards, response.data.card]);
          setIsAddDialogOpen(false);
        }
      } else {
        setError(`Failed to ${isEdit ? 'update' : 'add'} card: ${response.error}`);
      }
    } catch (err) {
      setError(`An error occurred while ${isEdit ? 'updating' : 'adding'} the card.`);
      console.error(`${isEdit ? 'Update' : 'Add'} card error:`, err);
    }
    setLoading(false);
  };

  // Filter cards based on search
  const filteredCards = cards.filter(card =>
    !searchQuery ||
    card.cardholderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.cardType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to get card brand icon/color
  const getCardTypeStyles = (cardType) => {
    const cardTypes = {
      'Visa': { color: 'bg-blue-500', icon: '💳' },
      'Mastercard': { color: 'bg-red-500', icon: '💳' },
      'American Express': { color: 'bg-green-500', icon: '💳' },
      'Discover': { color: 'bg-orange-500', icon: '💳' }
    };

    return cardTypes[cardType] || { color: 'bg-gray-500', icon: '💳' };
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Digital Wallet</h1>
          <p className="text-gray-600 mt-1">Securely store your payment cards</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus size={16} />
          Add New Card
        </Button>
      </div>

      {/* Search bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cards by name or type..."
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Cards grid */}
      {loading && cards.length === 0 ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading cards...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'No cards match your search.' : 'No cards yet.'}
          </p>
          <Button
            variant="outline"
            className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add your first card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map(card => {
            const { color, icon } = getCardTypeStyles(card.cardType);
            return (
              <Card
                key={card.id}
                className="relative overflow-hidden group hover:shadow-lg transition-shadow"
              >
                <div className={`absolute inset-0 ${color} opacity-10`}></div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold">{card.cardholderName}</CardTitle>
                      <CardDescription>{card.cardType}</CardDescription>
                    </div>
                    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white`}>
                      {icon}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-700">Card Number:</span>
                      <span className="font-mono">•••• •••• •••• {card.lastFourDigits}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-gray-700">Expires:</span>
                      <span>{card.expiryDate}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2">
                  <div className="absolute right-2 bottom-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="p-2 rounded-full bg-white shadow-sm text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCardDetails(card.id);
                      }}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-full bg-white shadow-sm text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCard(card.id);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-full bg-white shadow-sm text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Card Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>View Card Details</DialogTitle>
          </DialogHeader>

          {cardDetails ? (
            <div className="py-4">
              <div className="space-y-4">
                {/* Card Preview */}
                <div className={`rounded-xl p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-br
                  ${cardDetails.cardType === 'Visa' ? 'from-blue-500 to-blue-700' :
                    cardDetails.cardType === 'Mastercard' ? 'from-red-500 to-red-700' :
                    'from-gray-700 to-gray-900'}`}
                >
                  <div className="absolute top-4 right-4 text-2xl">
                    {cardDetails.cardType === 'Visa' ? '💳' :
                     cardDetails.cardType === 'Mastercard' ? '💳' : '💳'}
                  </div>

                  <div className="mb-6 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm opacity-80">Card Number</div>
                        <div className="font-mono text-lg tracking-wider mt-1 flex items-center">
                          {revealCardNumber ? (
                            <span>{cardDetails.cardNumber}</span>
                          ) : (
                            <span>xxxx-xxxx-xxxx-{cardDetails.cardNumber.slice(-4)}</span>
                          )}
                          <button
                            onClick={() => setRevealCardNumber(!revealCardNumber)}
                            className="ml-2 p-1 rounded-full bg-white/20 hover:bg-white/30"
                          >
                            {revealCardNumber ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => handleCopyToClipboard(cardDetails.cardNumber)}
                            className={`ml-1 p-1 rounded-full ${copied ? 'bg-green-500/50' : 'bg-white/20 hover:bg-white/30'}`}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-mono text-sm opacity-80">Cardholder</div>
                      <div className="font-mono tracking-wide mt-1">{cardDetails.cardholderName}</div>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <div className="font-mono text-sm opacity-80">Expires</div>
                        <div className="font-mono tracking-wide mt-1">{cardDetails.expiryDate}</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm opacity-80">CVV</div>
                        <div className="font-mono tracking-wide mt-1 flex items-center">
                          {revealCVV ? (
                            <span>{cardDetails.cvv}</span>
                          ) : (
                            <span>•••</span>
                          )}
                          <button
                            onClick={() => setRevealCVV(!revealCVV)}
                            className="ml-1 p-1 rounded-full bg-white/20 hover:bg-white/30"
                          >
                            {revealCVV ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="text-center mb-4">
                <CreditCard className="h-12 w-12 text-indigo-500 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Master Password Required</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your master password to view the encrypted card details
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="masterPassword">Master Password</Label>
                  <Input
                    id="masterPassword"
                    type="password"
                    placeholder="Enter master password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    For demo purposes, use: correct-master-password
                  </p>
                </div>
                <Button
                  className="w-full"
                  disabled={loading || !masterPassword}
                  onClick={handleCardReveal}
                >
                  {loading ? 'Decrypting...' : 'View Card'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AddEditCardComponent
              onSubmit={(formData) => handleAddEditCard(formData, false)}
              loading={loading}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AddEditCardComponent
              onSubmit={(formData) => handleAddEditCard(formData, true)}
              loading={loading}
              initialData={cards.find(c => c.id === selectedCard)}
              isEdit={true}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletDashboardPage;
