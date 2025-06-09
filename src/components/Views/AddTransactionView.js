import React from 'react';
import TransactionForm from '../TransactionForm/TransactionForm';

const AddTransactionView = ({ editTransaction, onClose }) => {
  return (
    <div className="view-container">
      <div className="view-card">
        <TransactionForm 
          editTransaction={editTransaction}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default AddTransactionView;
