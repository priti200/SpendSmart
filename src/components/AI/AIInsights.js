import React, { useEffect, useState } from 'react';
import { useAI } from '../../contexts/AIContext';
import './AIInsights.css';

const AIInsights = () => {
  const { insights, getInsights, isLoading } = useAI();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load insights on component mount
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setRefreshing(true);
    await getInsights();
    setRefreshing(false);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'tip': return '💡';
      default: return '📊';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return '#28a745';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      case 'tip': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  if (isLoading && insights.length === 0) {
    return (
      <div className="ai-insights-container">
        <div className="insights-header">
          <h3>🧠 AI Insights</h3>
        </div>
        <div className="insights-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-insights-container">
      <div className="insights-header">
        <h3>🧠 AI Insights</h3>
        <button 
          className="refresh-btn"
          onClick={loadInsights}
          disabled={refreshing}
          title="Refresh Insights"
        >
          {refreshing ? '⏳' : '🔄'}
        </button>
      </div>

      <div className="insights-content">
        {insights.length === 0 ? (
          <div className="no-insights">
            <div className="no-insights-icon">🤖</div>
            <h4>No insights yet</h4>
            <p>Add some transactions to get AI-powered insights about your spending patterns.</p>
          </div>
        ) : (
          <div className="insights-list">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className={`insight-card ${insight.type}`}
                style={{ borderLeftColor: getInsightColor(insight.type) }}
              >
                <div className="insight-header">
                  <span className="insight-icon">
                    {insight.icon || getInsightIcon(insight.type)}
                  </span>
                  <h4 className="insight-title">{insight.title}</h4>
                </div>
                <p className="insight-message">{insight.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="insights-footer">
        <p className="insights-note">
          💡 Insights are generated based on your transaction history and updated automatically.
        </p>
      </div>
    </div>
  );
};

export default AIInsights;
