import React, { useState } from 'react';
import { useBudgets } from '../../contexts/BudgetContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';
import './BudgetManager.css';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Other'
];

const BudgetManager = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, loading, error } = useBudgets();
  const { transactions } = useTransactions();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  });

  // Calculate spending for each budget
  const calculateSpending = (budget) => {
    const now = new Date();
    let startDate;
    
    if (budget.period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (budget.period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }
    
    return transactions
      .filter(t => 
        t.category === budget.category &&
        t.type === 'expense' &&
        new Date(t.date) >= startDate
      )
      .reduce((total, t) => total + Math.abs(t.amount), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, formData);
      } else {
        await addBudget(formData);
      }
      
      setFormData({ category: '', amount: '', period: 'monthly' });
      setShowForm(false);
      setEditingBudget(null);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id);
    }
  };

  const getBudgetStatus = (budget, spent) => {
    const percentage = (spent / budget.amount) * 100;
    
    if (percentage >= 100) return 'over';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const getProgressWidth = (budget, spent) => {
    return Math.min((spent / budget.amount) * 100, 100);
  };

  return (
    <div className="budget-manager">
      <div className="budget-header">
        <div>
          <h2>Budget Management</h2>
          <p>Set spending limits and track your progress</p>
        </div>
        <button 
          className="add-budget-btn"
          onClick={() => setShowForm(true)}
        >
          + Add Budget
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="budget-form-overlay">
          <div className="budget-form-container">
            <form className="budget-form" onSubmit={handleSubmit}>
              <div className="form-header">
                <h3>{editingBudget ? 'Edit Budget' : 'Add New Budget'}</h3>
                <button 
                  type="button" 
                  className="close-btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBudget(null);
                    setFormData({ category: '', amount: '', period: 'monthly' });
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {getCategoryIcon(category)} {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Budget Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Period</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Saving...' : (editingBudget ? 'Update Budget' : 'Add Budget')}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="budgets-grid">
        {budgets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No budgets set</h3>
            <p>Create your first budget to start tracking your spending limits</p>
          </div>
        ) : (
          budgets.map(budget => {
            const spent = calculateSpending(budget);
            const status = getBudgetStatus(budget, spent);
            const progressWidth = getProgressWidth(budget, spent);
            
            return (
              <div key={budget.id} className={`budget-card ${status}`}>
                <div className="budget-card-header">
                  <div className="budget-category">
                    <span className="category-icon">
                      {getCategoryIcon(budget.category)}
                    </span>
                    <div>
                      <h4>{budget.category}</h4>
                      <span className="budget-period">{budget.period}</span>
                    </div>
                  </div>
                  <div className="budget-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(budget)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(budget.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="budget-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progressWidth}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    <span>{formatCurrency(spent)} spent</span>
                    <span>of {formatCurrency(budget.amount)}</span>
                  </div>
                </div>

                <div className="budget-status">
                  {status === 'over' && (
                    <span className="status-text over">
                      ⚠️ Over budget by {formatCurrency(spent - budget.amount)}
                    </span>
                  )}
                  {status === 'warning' && (
                    <span className="status-text warning">
                      ⚡ {formatCurrency(budget.amount - spent)} remaining
                    </span>
                  )}
                  {status === 'good' && (
                    <span className="status-text good">
                      ✅ {formatCurrency(budget.amount - spent)} remaining
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BudgetManager;
