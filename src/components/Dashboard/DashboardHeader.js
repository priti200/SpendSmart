import React from 'react';
import { formatCurrency } from '../../utils/helpers';
import { useTransactions } from '../../contexts/TransactionContext';
import './DashboardHeader.css';

const DashboardHeader = () => {
  const { summary, loading } = useTransactions();

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'neutral';
  };

  const formatBalance = (amount) => {
    const formatted = formatCurrency(amount);
    return {
      main: formatted.split('.')[0],
      decimal: '.' + formatted.split('.')[1]
    };
  };

  const balanceDisplay = formatBalance(summary.balance);

  return (
    <div className="dashboard-header">
      <div className="balance-section">
        <div className="balance-label">Total Balance</div>
        <div className={`balance-amount ${getBalanceColor(summary.balance)}`}>
          {loading ? (
            <div className="balance-skeleton">
              <div className="skeleton-text large"></div>
            </div>
          ) : (
            <>
              <span className="main-amount">{balanceDisplay.main}</span>
              <span className="decimal-amount">{balanceDisplay.decimal}</span>
            </>
          )}
        </div>
        <div className="balance-subtitle">
          {summary.transactionCount} transactions this period
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card income">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-label">Income</div>
            <div className="card-amount">
              {loading ? (
                <div className="skeleton-text medium"></div>
              ) : (
                formatCurrency(summary.totalIncome)
              )}
            </div>
          </div>
        </div>

        <div className="summary-card expense">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <div className="card-label">Expenses</div>
            <div className="card-amount">
              {loading ? (
                <div className="skeleton-text medium"></div>
              ) : (
                formatCurrency(summary.totalExpenses)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
