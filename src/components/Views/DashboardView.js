import React from 'react';
import DashboardHeader from '../Dashboard/DashboardHeader';
import TransactionList from '../TransactionList/TransactionList';
import AIInsights from '../AI/AIInsights';
import AITest from '../AI/AITest';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';

const DashboardView = ({ onEditTransaction, onViewChange }) => {
  const { transactions, summary, categoryData, loading } = useTransactions();

  const handleQuickAction = (action) => {
    if (onViewChange) {
      switch (action) {
        case 'add-income':
        case 'add-expense':
          onViewChange('add-transaction');
          break;
        case 'view-reports':
          onViewChange('reports');
          break;
        case 'set-budget':
          onViewChange('budgets');
          break;
        default:
          break;
      }
    }
  };

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Get top spending categories
  const topCategories = categoryData
    .filter(cat => cat._id !== 'Income')
    .slice(0, 4);

  return (
    <div className="view-container" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="view-grid">
        {/* Balance Overview */}
        <div className="dashboard-overview">
          <DashboardHeader />
        </div>

        {/* AI Insights */}
        <div className="ai-insights-section">
          <AIInsights />
        </div>

        {/* AI Test Component */}
        <AITest />

        {/* Quick Stats Grid */}
        <div className="view-grid three-column">
          {/* Recent Transactions Card */}
          <div className="view-card">
            <div className="view-card-header">
              <h3 className="view-card-title">Recent Transactions</h3>
              <span className="view-card-subtitle">
                {recentTransactions.length} of {transactions.length}
              </span>
            </div>
            <div className="view-card-body">
              <TransactionList
                onEditTransaction={onEditTransaction}
                onViewChange={onViewChange}
                compact={true}
              />
            </div>
          </div>

          {/* Top Categories Card */}
          <div className="view-card">
            <div className="view-card-header">
              <h3 className="view-card-title">Top Categories</h3>
              <span className="view-card-subtitle">This month</span>
            </div>
            <div className="view-card-body">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner-large"></div>
                </div>
              ) : topCategories.length > 0 ? (
                <div className="categories-list">
                  {topCategories.map((category, index) => (
                    <div key={category._id} className="category-item">
                      <div className="category-rank">#{index + 1}</div>
                      <div className="category-icon">
                        {getCategoryIcon(category._id)}
                      </div>
                      <div className="category-info">
                        <div className="category-name">{category._id}</div>
                        <div className="category-count">{category.count} transactions</div>
                      </div>
                      <div className="category-amount">
                        {formatCurrency(category.totalAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🏷️</div>
                  <p>No categories yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="view-card">
            <div className="view-card-header">
              <h3 className="view-card-title">Quick Actions</h3>
            </div>
            <div className="view-card-body">
              <div className="quick-actions">
                <button
                  className="quick-action-btn income"
                  onClick={() => handleQuickAction('add-income')}
                >
                  <span className="action-icon">💰</span>
                  <span className="action-label">Add Income</span>
                </button>
                <button
                  className="quick-action-btn expense"
                  onClick={() => handleQuickAction('add-expense')}
                >
                  <span className="action-icon">💸</span>
                  <span className="action-label">Add Expense</span>
                </button>
                <button
                  className="quick-action-btn neutral"
                  onClick={() => handleQuickAction('view-reports')}
                >
                  <span className="action-icon">📊</span>
                  <span className="action-label">View Reports</span>
                </button>
                <button
                  className="quick-action-btn neutral"
                  onClick={() => handleQuickAction('set-budget')}
                >
                  <span className="action-icon">🎯</span>
                  <span className="action-label">Set Budget</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full Transaction List */}
        {transactions.length > 5 && (
          <div className="view-card">
            <div className="view-card-header">
              <h3 className="view-card-title">All Transactions</h3>
              <span className="view-card-subtitle">
                Showing all {transactions.length} transactions
              </span>
            </div>
            <div className="view-card-body">
              <TransactionList onEditTransaction={onEditTransaction} onViewChange={onViewChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
