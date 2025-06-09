import React from 'react';
import TransactionList from '../TransactionList/TransactionList';

const TransactionsView = ({ onEditTransaction }) => {
  return (
    <div className="view-container">
      <div className="view-card">
        <div className="view-card-header">
          <h3 className="view-card-title">All Transactions</h3>
          <span className="view-card-subtitle">Manage your financial records</span>
        </div>
        <div className="view-card-body">
          <TransactionList onEditTransaction={onEditTransaction} />
        </div>
      </div>
    </div>
  );
};

export default TransactionsView;
