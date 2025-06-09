import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ activeView, onViewChange, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Overview & Analytics'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: '💳',
      description: 'View & Manage'
    },
    {
      id: 'add-transaction',
      label: 'Add Transaction',
      icon: '➕',
      description: 'New Entry'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: '🏷️',
      description: 'Spending Analysis'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📈',
      description: 'Financial Reports'
    },
    {
      id: 'budgets',
      label: 'Budgets',
      icon: '🎯',
      description: 'Budget Planning'
    },
    {
      id: 'ai-agents',
      label: 'AI Agents',
      icon: '🤖',
      description: 'Smart Assistants'
    }
  ];

  const bottomMenuItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'App Settings'
    },
    {
      id: 'help',
      label: 'Help',
      icon: '❓',
      description: 'Support & FAQ'
    }
  ];

  const handleMenuClick = (itemId) => {
    onViewChange(itemId);
  };

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onToggle) {
      onToggle(newCollapsed);
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="app-logo">
          <span className="logo-icon">💰</span>
          {!isCollapsed && (
            <div className="logo-text">
              <h2>SpendSmart</h2>
              <p>Finance Manager</p>
            </div>
          )}
        </div>
        <button 
          className="collapse-btn"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '▶️' : '◀️'}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">
            {!isCollapsed && 'Main'}
          </div>
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <button
                  className={`nav-link ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item.id)}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Navigation */}
        <div className="nav-section nav-bottom">
          <ul className="nav-list">
            {bottomMenuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <button
                  className={`nav-link ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item.id)}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User Profile Section */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <div className="user-name">John Doe</div>
              <div className="user-email">john@example.com</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
