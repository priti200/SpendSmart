import React, { useState } from 'react';
import DashboardView from '../Views/DashboardView';
import TransactionsView from '../Views/TransactionsView';
import AddTransactionView from '../Views/AddTransactionView';
import CategoriesView from '../Views/CategoriesView';
import ReportsView from '../Views/ReportsView';
import BudgetsView from '../Views/BudgetsView';
import SettingsView from '../Views/SettingsView';
import HelpView from '../Views/HelpView';
import AIAgentDashboard from '../AI/AIAgentDashboard';
import './MainContent.css';

const MainContent = ({ activeView, onViewChange, sidebarCollapsed }) => {
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleCloseEdit = () => {
    setEditingTransaction(null);
    // Navigate back to dashboard when closing the form
    onViewChange('dashboard');
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onEditTransaction={handleEditTransaction} onViewChange={onViewChange} />;
      
      case 'transactions':
        return <TransactionsView onEditTransaction={handleEditTransaction} />;
      
      case 'add-transaction':
        return (
          <AddTransactionView 
            editTransaction={editingTransaction}
            onClose={handleCloseEdit}
          />
        );
      
      case 'categories':
        return <CategoriesView />;
      
      case 'reports':
        return <ReportsView />;
      
      case 'budgets':
        return <BudgetsView />;
      
      case 'settings':
        return <SettingsView />;
      
      case 'help':
        return <HelpView />;

      case 'ai-agents':
        return <AIAgentDashboard />;

      default:
        return <DashboardView onEditTransaction={handleEditTransaction} />;
    }
  };

  const getViewTitle = () => {
    const titles = {
      'dashboard': 'Dashboard',
      'transactions': 'Transactions',
      'add-transaction': 'Add Transaction',
      'categories': 'Categories',
      'reports': 'Reports',
      'budgets': 'Budgets',
      'settings': 'Settings',
      'help': 'Help & Support',
      'ai-agents': 'AI Agents'
    };
    return titles[activeView] || 'Dashboard';
  };

  const getViewDescription = () => {
    const descriptions = {
      'dashboard': 'Overview of your financial status and recent activity',
      'transactions': 'View and manage all your transactions',
      'add-transaction': 'Add a new income or expense transaction',
      'categories': 'Analyze spending patterns by category',
      'reports': 'Detailed financial reports and analytics',
      'budgets': 'Set and track your spending budgets',
      'settings': 'Configure your app preferences',
      'help': 'Get help and support for using SpendSmart',
      'ai-agents': 'Intelligent AI assistants for advanced financial management'
    };
    return descriptions[activeView] || '';
  };

  return (
    <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="content-header">
        <div className="header-info">
          <h1 className="view-title">{getViewTitle()}</h1>
          <p className="view-description">{getViewDescription()}</p>
        </div>
        
        <div className="header-actions">
          <div className="current-time">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      <div className="content-body">
        {renderView()}
      </div>
    </div>
  );
};

export default MainContent;
