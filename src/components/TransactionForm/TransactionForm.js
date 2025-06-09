import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../contexts/TransactionContext';
import { validateTransaction, formatDateForInput, parseAmount, getCategoryIcon } from '../../utils/helpers';
import './TransactionForm.css';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Income',
  'Investment',
  'Other'
];

const TransactionForm = ({ editTransaction, onClose }) => {
  const { addTransaction, updateTransaction, loading, error, clearError } = useTransactions();
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    description: '',
    category: 'Other',
    date: formatDateForInput(new Date()),
    type: 'expense'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (editTransaction) {
      setFormData({
        name: editTransaction.name || '',
        amount: Math.abs(editTransaction.amount).toString(),
        description: editTransaction.description || '',
        category: editTransaction.category || 'Other',
        date: formatDateForInput(new Date(editTransaction.date)),
        type: editTransaction.type || (editTransaction.amount >= 0 ? 'income' : 'expense')
      });
    }
  }, [editTransaction]);

  // Clear error when form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, error, clearError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: type === 'income' ? 'Income' : 'Other'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const amount = parseAmount(formData.amount);
    const transactionData = {
      ...formData,
      amount
    };
    
    const validation = validateTransaction(transactionData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editTransaction) {
        await updateTransaction(editTransaction._id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      
      // Reset form
      setFormData({
        name: '',
        amount: '',
        description: '',
        category: 'Other',
        date: formatDateForInput(new Date()),
        type: 'expense'
      });

      // Always close the form after successful submission
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error submitting transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="transaction-form-container">
      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>{editTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h2>
          {onClose && (
            <button type="button" className="close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Transaction Type Toggle */}
        <div className="type-toggle">
          <button
            type="button"
            className={`type-btn ${formData.type === 'expense' ? 'active' : ''}`}
            onClick={() => handleTypeChange('expense')}
          >
            📉 Expense
          </button>
          <button
            type="button"
            className={`type-btn ${formData.type === 'income' ? 'active' : ''}`}
            onClick={() => handleTypeChange('income')}
          >
            📈 Income
          </button>
        </div>

        {/* Amount and Name Row */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.amount ? 'error' : ''}
              />
            </div>
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="name">Description</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Lunch at restaurant"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
        </div>

        {/* Category and Date Row */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <div className="select-wrapper">
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {category}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && <span className="field-error">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="date">Date & Time</label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="field-error">{errors.date}</span>}
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Additional Notes (Optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Add any additional details..."
            rows="3"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`submit-btn ${formData.type}`}
          disabled={isSubmitting || loading}
        >
          {isSubmitting || loading ? (
            <span className="loading-spinner"></span>
          ) : (
            editTransaction ? 'Update Transaction' : 'Add Transaction'
          )}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
