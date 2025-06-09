import React from 'react';

const HelpView = () => {
  return (
    <div className="view-container">
      <div className="view-grid">
        <div className="view-card">
          <div className="view-card-header">
            <h3 className="view-card-title">Help & Support</h3>
            <span className="view-card-subtitle">Get help using SpendSmart</span>
          </div>
          <div className="view-card-body">
            <div className="help-section">
              <h4>Getting Started</h4>
              <ul>
                <li>Add your first transaction using the "Add Transaction" page</li>
                <li>View your balance and recent activity on the Dashboard</li>
                <li>Organize transactions by categories for better insights</li>
                <li>Track your spending patterns in the Categories section</li>
              </ul>
            </div>

            <div className="help-section">
              <h4>Features</h4>
              <ul>
                <li><strong>Dashboard:</strong> Overview of your financial status</li>
                <li><strong>Transactions:</strong> View and manage all transactions</li>
                <li><strong>Categories:</strong> Analyze spending by category</li>
                <li><strong>Reports:</strong> Detailed financial reports (coming soon)</li>
                <li><strong>Budgets:</strong> Set spending limits (coming soon)</li>
              </ul>
            </div>

            <div className="help-section">
              <h4>Contact Support</h4>
              <p>Need help? Contact us at support@spendsmart.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpView;
