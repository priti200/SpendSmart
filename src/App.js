import React, { useState } from 'react';
import { TransactionProvider } from './contexts/TransactionContext';
import { BudgetProvider } from './contexts/BudgetContext';
import { AIProvider } from './contexts/AIContext';
import Sidebar from './components/Sidebar/Sidebar';
import MainContent from './components/MainContent/MainContent';
import AIChatButton from './components/AI/AIChatButton';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <TransactionProvider>
      <BudgetProvider>
        <AIProvider>
        <div className="app desktop-layout">
          <Sidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            onToggle={handleSidebarToggle}
          />
          <MainContent
            activeView={activeView}
            onViewChange={handleViewChange}
            sidebarCollapsed={sidebarCollapsed}
          />

          {/* AI Chat Button */}
          <AIChatButton />
        </div>
        </AIProvider>
      </BudgetProvider>
    </TransactionProvider>
  );
}

export default App;
