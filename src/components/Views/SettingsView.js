import React from 'react';

const SettingsView = () => {
  return (
    <div className="view-container">
      <div className="view-grid">
        <div className="view-card">
          <div className="view-card-header">
            <h3 className="view-card-title">App Settings</h3>
            <span className="view-card-subtitle">Customize your experience</span>
          </div>
          <div className="view-card-body">
            <div className="settings-section">
              <h4>Appearance</h4>
              <div className="setting-item">
                <label>Theme</label>
                <select>
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                </select>
              </div>
            </div>

            <div className="settings-section">
              <h4>Currency</h4>
              <div className="setting-item">
                <label>Default Currency</label>
                <select>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            <div className="settings-section">
              <h4>Data</h4>
              <div className="setting-item">
                <button className="settings-btn">Export Data</button>
                <button className="settings-btn danger">Clear All Data</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
