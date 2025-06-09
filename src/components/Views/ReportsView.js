import React, { useState } from 'react';
import FinancialCharts from '../Charts/FinancialCharts';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency, exportToCSV } from '../../utils/helpers';

const ReportsView = () => {
  const { transactions, summary } = useTransactions();
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const filename = `spendsmart-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(transactions, filename);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const generateMonthlyReport = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income: monthlyIncome,
      expenses: monthlyExpenses,
      net: monthlyIncome - monthlyExpenses,
      transactionCount: monthlyTransactions.length
    };
  };

  const monthlyReport = generateMonthlyReport();

  return (
    <div className="view-container">
      {/* Summary Cards */}
      <div className="view-grid three-column">
        <div className="view-card">
          <div className="view-card-header">
            <h3 className="view-card-title">This Month</h3>
            <span className="view-card-subtitle">Current month summary</span>
          </div>
          <div className="view-card-body">
            <div className="report-stats">
              <div className="stat-item">
                <span className="stat-label">Income</span>
                <span className="stat-value income">{formatCurrency(monthlyReport.income)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Expenses</span>
                <span className="stat-value expense">{formatCurrency(monthlyReport.expenses)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Net</span>
                <span className={`stat-value ${monthlyReport.net >= 0 ? 'income' : 'expense'}`}>
                  {formatCurrency(monthlyReport.net)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="view-card">
          <div className="view-card-header">
            <h3 className="view-card-title">All Time</h3>
            <span className="view-card-subtitle">Total summary</span>
          </div>
          <div className="view-card-body">
            <div className="report-stats">
              <div className="stat-item">
                <span className="stat-label">Total Income</span>
                <span className="stat-value income">{formatCurrency(summary.totalIncome)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Expenses</span>
                <span className="stat-value expense">{formatCurrency(summary.totalExpenses)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Balance</span>
                <span className={`stat-value ${summary.balance >= 0 ? 'income' : 'expense'}`}>
                  {formatCurrency(summary.balance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="view-card">
          <div className="view-card-header">
            <h3 className="view-card-title">Export Data</h3>
            <span className="view-card-subtitle">Download your data</span>
          </div>
          <div className="view-card-body">
            <div className="export-section">
              <p>Export all your transactions to CSV format for external analysis.</p>
              <button
                className="export-btn"
                onClick={handleExportCSV}
                disabled={exportLoading || transactions.length === 0}
              >
                {exportLoading ? 'Exporting...' : '📥 Export CSV'}
              </button>
              <p className="export-info">
                {transactions.length} transactions available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="view-card">
        <div className="view-card-header">
          <h3 className="view-card-title">Financial Analytics</h3>
          <span className="view-card-subtitle">Visual insights into your spending patterns</span>
        </div>
        <div className="view-card-body">
          {transactions.length > 0 ? (
            <FinancialCharts />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No Data Available</h3>
              <p>Add some transactions to see beautiful charts and analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
