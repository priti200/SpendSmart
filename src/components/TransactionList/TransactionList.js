import React, { useState } from 'react';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency, formatDate, getCategoryIcon, getTransactionColor } from '../../utils/helpers';
import './TransactionList.css';

const TransactionList = ({ onEditTransaction, compact = false, onViewChange }) => {
  const { transactions, loading, deleteTransaction } = useTransactions();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setDeletingId(id);
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEdit = (transaction) => {
    if (onEditTransaction) {
      onEditTransaction(transaction);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="transaction-list">
        <div className="list-header">
          <h2>Recent Transactions</h2>
        </div>
        <div className="loading-skeleton">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="transaction-skeleton">
              <div className="skeleton-content">
                <div className="skeleton-text large"></div>
                <div className="skeleton-text small"></div>
              </div>
              <div className="skeleton-amount"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="transaction-list">
        <div className="list-header">
          <h2>Recent Transactions</h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No transactions yet</h3>
          <p>Start by adding your first transaction above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      <div className="list-header">
        <h2>Recent Transactions</h2>
        <span className="transaction-count">{transactions.length} transactions</span>
      </div>

      <div className="transactions-container">
        {transactions.map((transaction) => (
          <div key={transaction._id} className="transaction-item">
            <div className="transaction-content">
              <div className="transaction-icon">
                {getCategoryIcon(transaction.category)}
              </div>
              
              <div className="transaction-details">
                <div className="transaction-name">{transaction.name}</div>
                <div className="transaction-meta">
                  <span className="transaction-category">{transaction.category}</span>
                  <span className="transaction-date">{formatDate(transaction.date)}</span>
                </div>
                {transaction.description && (
                  <div className="transaction-description">{transaction.description}</div>
                )}
              </div>

              <div className="transaction-amount-section">
                <div 
                  className={`transaction-amount ${transaction.type}`}
                  style={{ color: getTransactionColor(transaction.type, transaction.amount) }}
                >
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(Math.abs(transaction.amount))}
                </div>
                
                <div className="transaction-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEdit(transaction)}
                    title="Edit transaction"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(transaction._id)}
                    disabled={deletingId === transaction._id}
                    title="Delete transaction"
                  >
                    {deletingId === transaction._id ? (
                      <span className="loading-spinner small"></span>
                    ) : (
                      '🗑️'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {compact && transactions.length > 5 && (
        <div className="view-all-link">
          <button
            className="view-all-btn"
            onClick={() => onViewChange && onViewChange('transactions')}
          >
            View all {transactions.length} transactions →
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
