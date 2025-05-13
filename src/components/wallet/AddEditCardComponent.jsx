import React, { useState, useEffect } from 'react';
import { addCard, updateCard } from '@core/services/digitalWalletService';

const AddEditCardComponent = ({ cardData, onClose, onSaveSuccess, onSubmit, loading: externalLoading }) => {
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardType, setCardType] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cardData && cardData.id) {
      setCardholderName(cardData.cardholderName || '');
      setCardNumber(''); // Don't show sensitive data in edit mode
      setExpiryDate(cardData.expiryDate || '');
      setCvv(''); // Don't show sensitive data in edit mode
      setCardType(cardData.cardType || cardData.issuer || '');
      setBillingAddress(cardData.billingAddress?.line1 || '');
      setNotes(cardData.notes || '');
    } else {
      // Reset fields for new card
      setCardholderName('');
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardType('');
      setBillingAddress('');
      setNotes('');
    }
  }, [cardData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!externalLoading) {
      setLoading(true);
    }
    setError('');

    try {
      // Validate card number format
      if (cardNumber && !/^[0-9\s]{13,19}$/.test(cardNumber)) {
        setError('Invalid card number format');
        setLoading(false);
        return;
      }

      // Validate expiry date format
      if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiryDate)) {
        setError('Expiry date must be in MM/YY format');
        setLoading(false);
        return;
      }

      // Validate CVV format
      if (cvv && !/^[0-9]{3,4}$/.test(cvv)) {
        setError('Invalid CVV/CVC format');
        setLoading(false);
        return;
      }

      const cardDataToSave = {
        cardholderName,
        cardNumber,
        expiryDate,
        cvv,
        cardType,
        billingAddress: { line1: billingAddress },
        notes
      };

      // If onSubmit prop is provided, use it (from parent component)
      if (onSubmit) {
        onSubmit(cardDataToSave);
        return;
      }

      // Legacy flow using direct API calls
      let response;
      if (cardData && cardData.id) {
        response = await updateCard(cardData.id, cardDataToSave);
      } else {
        response = await addCard(cardDataToSave);
      }

      if (response.success && response.data) {
        if (typeof onSaveSuccess === 'function') {
          onSaveSuccess(response.data);
        }
      } else {
        setError(response.error || `Failed to ${cardData && cardData.id ? 'update' : 'add'} card.`);
      }
    } catch (err) {
      setError(`An unexpected error occurred while ${cardData && cardData.id ? 'updating' : 'creating'} the card.`);
      console.error('Save card error:', err);
    } finally {
      if (!externalLoading) {
        setLoading(false);
      }
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">Cardholder Name*</label>
          <input
            type="text"
            id="cardholderName"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            required
            className={inputClass}
            placeholder="John M. Doe"
          />
        </div>

        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Card Number{cardData && cardData.id ? '' : '*'}</label>
          <input
            type="text"
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required={!cardData || !cardData.id}
            className={inputClass}
            placeholder="•••• •••• •••• ••••"
            maxLength={19}
          />
        </div>

        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date (MM/YY)*</label>
          <input
            type="text"
            id="expiryDate"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
            className={inputClass}
            placeholder="MM/YY"
            maxLength={5}
          />
        </div>

        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">CVV/CVC{cardData && cardData.id ? '' : '*'}</label>
          <input
            type="text"
            id="cvv"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            required={!cardData || !cardData.id}
            className={inputClass}
            placeholder="•••"
            maxLength={4}
          />
        </div>

        <div>
          <label htmlFor="cardType" className="block text-sm font-medium text-gray-700">Card Type (Optional)</label>
          <input
            type="text"
            id="cardType"
            value={cardType}
            onChange={(e) => setCardType(e.target.value)}
            className={inputClass}
            placeholder="e.g., Visa, Mastercard"
          />
        </div>

        <div>
          <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">Billing Address (Optional)</label>
          <textarea
            id="billingAddress"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            rows="2"
            className={inputClass}
            placeholder="123 Main St, Anytown, USA"
          ></textarea>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            className={inputClass}
            placeholder="e.g., For online purchases only"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={externalLoading || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {(externalLoading || loading) ? 'Saving...' : (cardData && cardData.id ? 'Save Changes' : 'Add Card')}
          </button>
        </div>
      </form>
    </>
  );
};

export default AddEditCardComponent;
