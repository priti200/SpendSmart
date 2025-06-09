import React from 'react';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';

const CategoriesView = () => {
  const { categoryData, loading } = useTransactions();

  return (
    <div className="view-container">
      <div className="view-card">
        <div className="view-card-header">
          <h3 className="view-card-title">Spending by Category</h3>
          <span className="view-card-subtitle">Analyze your spending patterns</span>
        </div>
        <div className="view-card-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner-large"></div>
            </div>
          ) : categoryData.length > 0 ? (
            <div className="categories-grid">
              {categoryData.map((category, index) => (
                <div key={category._id} className="category-card">
                  <div className="category-header">
                    <span className="category-icon-large">
                      {getCategoryIcon(category._id)}
                    </span>
                    <h4>{category._id}</h4>
                  </div>
                  <div className="category-stats">
                    <div className="category-amount">
                      {formatCurrency(category.totalAmount)}
                    </div>
                    <div className="category-count">
                      {category.count} transactions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏷️</div>
              <h3>No categories yet</h3>
              <p>Start adding transactions to see category breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesView;
