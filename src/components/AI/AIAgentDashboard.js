import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency } from '../../utils/helpers';
import ReceiptUpload from '../ReceiptUpload/ReceiptUpload';
import './AIAgentDashboard.css';

const AIAgentDashboard = () => {
  const { transactions } = useTransactions();
  const [activeAgent, setActiveAgent] = useState('overview');
  const [agentData, setAgentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);

  // AI Agents configuration
  const agents = [
    {
      id: 'receipt_ocr',
      name: 'Receipt Scanner',
      icon: '📱',
      description: 'Scan receipts and auto-create transactions',
      color: '#6366f1',
      features: ['OCR Text Extraction', 'Auto-categorization', 'Batch Processing']
    },
    {
      id: 'goal_tracker',
      name: 'Goal Achievement',
      icon: '🎯',
      description: 'Smart goal tracking and progress analysis',
      color: '#10b981',
      features: ['Progress Analysis', 'AI Recommendations', 'Milestone Tracking']
    },
    {
      id: 'fraud_detection',
      name: 'Fraud Detection',
      icon: '🚨',
      description: 'Detect suspicious transactions and patterns',
      color: '#ef4444',
      features: ['Pattern Analysis', 'Risk Scoring', 'Real-time Alerts']
    },
    {
      id: 'investment_advisor',
      name: 'Investment Advisor',
      icon: '📈',
      description: 'Personalized investment recommendations',
      color: '#8b5cf6',
      features: ['Risk Profiling', 'Portfolio Analysis', 'Market Insights']
    }
  ];

  // Load agent data based on active selection
  useEffect(() => {
    if (activeAgent !== 'overview') {
      loadAgentData(activeAgent);
    }
  }, [activeAgent, transactions]);

  const loadAgentData = async (agentId) => {
    setLoading(true);
    try {
      let data = {};
      
      switch (agentId) {
        case 'goal_tracker':
          const goalResponse = await fetch('http://localhost:3002/api/ai/goals/dashboard');
          if (goalResponse.ok) {
            const goalResult = await goalResponse.json();
            data = goalResult.data;
          }
          break;

        case 'fraud_detection':
          const fraudResponse = await fetch('http://localhost:3002/api/ai/fraud/dashboard');
          if (fraudResponse.ok) {
            const fraudResult = await fraudResponse.json();
            data = fraudResult.data;
          }
          break;

        case 'investment_advisor':
          const investmentResponse = await fetch('http://localhost:3002/api/ai/investment/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAge: 30, monthlyIncome: 50000 })
          });
          if (investmentResponse.ok) {
            const investmentResult = await investmentResponse.json();
            data = investmentResult.data;
          }
          break;

        case 'receipt_ocr':
          const receiptResponse = await fetch('http://localhost:3002/api/receipts/stats');
          if (receiptResponse.ok) {
            const receiptResult = await receiptResponse.json();
            data = receiptResult.data;
          }
          break;
      }
      
      setAgentData(prev => ({ ...prev, [agentId]: data }));
    } catch (error) {
      console.error(`Error loading ${agentId} data:`, error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="ai-overview">
      <div className="overview-header">
        <h2>🤖 AI Agent Ecosystem</h2>
        <p>Your intelligent financial assistants working 24/7</p>
      </div>
      
      <div className="agents-grid">
        {agents.map(agent => (
          <div 
            key={agent.id} 
            className="agent-card"
            onClick={() => setActiveAgent(agent.id)}
            style={{ borderColor: agent.color }}
          >
            <div className="agent-header">
              <span className="agent-icon">{agent.icon}</span>
              <h3>{agent.name}</h3>
            </div>
            <p className="agent-description">{agent.description}</p>
            <div className="agent-features">
              {agent.features.map((feature, index) => (
                <span key={index} className="feature-tag">{feature}</span>
              ))}
            </div>
            <button 
              className="agent-action-btn"
              style={{ backgroundColor: agent.color }}
            >
              Open Agent
            </button>
          </div>
        ))}
      </div>
      
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-card"
            onClick={() => setShowReceiptUpload(true)}
          >
            <span className="action-icon">📱</span>
            <span>Scan Receipt</span>
          </button>
          <button 
            className="quick-action-card"
            onClick={() => setActiveAgent('fraud_detection')}
          >
            <span className="action-icon">🚨</span>
            <span>Security Check</span>
          </button>
          <button 
            className="quick-action-card"
            onClick={() => setActiveAgent('investment_advisor')}
          >
            <span className="action-icon">📈</span>
            <span>Investment Tips</span>
          </button>
          <button 
            className="quick-action-card"
            onClick={() => setActiveAgent('goal_tracker')}
          >
            <span className="action-icon">🎯</span>
            <span>Track Goals</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAgentDetails = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    const data = agentData[agentId] || {};
    
    return (
      <div className="agent-details">
        <div className="agent-details-header">
          <button 
            className="back-btn"
            onClick={() => setActiveAgent('overview')}
          >
            ← Back
          </button>
          <div className="agent-title">
            <span className="agent-icon-large">{agent.icon}</span>
            <div>
              <h2>{agent.name}</h2>
              <p>{agent.description}</p>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner-large"></div>
            <p>Loading {agent.name} data...</p>
          </div>
        ) : (
          <div className="agent-content">
            {renderAgentSpecificContent(agentId, data)}
          </div>
        )}
      </div>
    );
  };

  const renderAgentSpecificContent = (agentId, data) => {
    switch (agentId) {
      case 'receipt_ocr':
        return (
          <div className="receipt-ocr-content">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Receipts Processed</h3>
                <div className="stat-value">{data.totalReceiptTransactions || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Total Amount</h3>
                <div className="stat-value">{formatCurrency(data.totalAmount || 0)}</div>
              </div>
              <div className="stat-card">
                <h3>Categories Used</h3>
                <div className="stat-value">{data.categoriesUsed?.length || 0}</div>
              </div>
            </div>
            
            <div className="action-section">
              <button 
                className="primary-action-btn"
                onClick={() => setShowReceiptUpload(true)}
              >
                📱 Scan New Receipt
              </button>
            </div>
          </div>
        );
        
      case 'goal_tracker':
        return (
          <div className="goal-tracker-content">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Active Goals</h3>
                <div className="stat-value">{data.data?.summary?.active || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Completed</h3>
                <div className="stat-value">{data.data?.summary?.completed || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Average Progress</h3>
                <div className="stat-value">{Math.round(data.data?.summary?.averageProgress || 0)}%</div>
              </div>
            </div>
            
            <div className="insights-section">
              <h3>🎯 Goal Insights</h3>
              <p>Set up financial goals to track your progress and get AI-powered recommendations.</p>
            </div>
          </div>
        );
        
      case 'fraud_detection':
        return (
          <div className="fraud-detection-content">
            <div className="stats-grid">
              <div className="stat-card alert">
                <h3>High Risk</h3>
                <div className="stat-value">{data.data?.summary?.highRisk || 0}</div>
              </div>
              <div className="stat-card warning">
                <h3>Medium Risk</h3>
                <div className="stat-value">{data.data?.summary?.mediumRisk || 0}</div>
              </div>
              <div className="stat-card safe">
                <h3>Low Risk</h3>
                <div className="stat-value">{data.data?.summary?.lowRisk || 0}</div>
              </div>
            </div>
            
            <div className="security-status">
              <h3>🛡️ Security Status</h3>
              <div className="status-indicator safe">
                <span className="status-dot"></span>
                All transactions appear normal
              </div>
            </div>
          </div>
        );
        
      case 'investment_advisor':
        return (
          <div className="investment-advisor-content">
            <div className="risk-profile">
              <h3>📊 Your Risk Profile</h3>
              <div className="risk-indicator">
                <span className="risk-level">{data.analysis?.riskProfile?.profile || 'Moderate'}</span>
                <div className="risk-score">Score: {data.analysis?.riskProfile?.score || 50}/100</div>
              </div>
            </div>
            
            <div className="investment-capacity">
              <h3>💰 Investment Capacity</h3>
              <div className="capacity-info">
                <p>Monthly Surplus: {formatCurrency(data.analysis?.investmentCapacity?.monthlySurplus || 0)}</p>
                <p>Recommended Investment: {formatCurrency(data.analysis?.investmentCapacity?.recommendedMonthlyInvestment || 0)}</p>
              </div>
            </div>
            
            <div className="recommendations">
              <h3>💡 AI Recommendations</h3>
              {data.analysis?.recommendations?.slice(0, 3).map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <h4>{rec.title}</h4>
                  <p>{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
        
      default:
        return <div>Agent content not available</div>;
    }
  };

  return (
    <div className="ai-agent-dashboard">
      {activeAgent === 'overview' ? renderOverview() : renderAgentDetails(activeAgent)}
      
      {showReceiptUpload && (
        <ReceiptUpload onClose={() => setShowReceiptUpload(false)} />
      )}
    </div>
  );
};

export default AIAgentDashboard;
