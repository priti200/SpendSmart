import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'ai',
      message: "👋 Hi! I'm your SpendSmart AI assistant. I can help you analyze your spending, answer questions about your finances, and provide personalized recommendations. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

  // Send a chat message to AI
  const sendChatMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    console.log('🤖 Sending chat message:', message);
    console.log('🔗 API URL:', `${API_BASE_URL}/ai/chat`);

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: message.trim(),
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/ai/chat`, {
        question: message.trim()
      });

      console.log('✅ AI Response:', response.data);

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          message: response.data.data.response.answer,
          timestamp: new Date(),
          metadata: response.data.data.response
        };

        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.data.message || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      console.error('❌ Error details:', error.response?.data);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: `Sorry, I'm having trouble connecting to the AI service. Error: ${error.message}`,
        timestamp: new Date(),
        isError: true
      };

      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  // Get AI insights
  const getInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/ai/insights`);
      
      if (response.data.success) {
        setInsights(response.data.data.insights);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get insights');
      }
    } catch (error) {
      console.error('Insights error:', error);
      setInsights([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  // Get AI recommendations
  const getRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/recommendations`);
      
      if (response.data.success) {
        setRecommendations(response.data.data.recommendations.recommendations || []);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Recommendations error:', error);
      setRecommendations([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  // Analyze financial data
  const analyzeFinancialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/analyze`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to analyze data');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  // Auto-categorize transaction
  const categorizeTransaction = useCallback(async (name, amount, description = '') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/categorize`, {
        name,
        amount,
        description
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to categorize');
      }
    } catch (error) {
      console.error('Categorization error:', error);
      return { success: false, category: 'Other', confidence: 0 };
    }
  }, [API_BASE_URL]);

  // Clear chat history
  const clearChatHistory = useCallback(() => {
    setChatHistory([
      {
        id: 1,
        type: 'ai',
        message: "👋 Hi! I'm your SpendSmart AI assistant. How can I help you today?",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Quick actions for common queries
  const quickActions = [
    {
      id: 'balance',
      label: 'Check Balance',
      icon: '💰',
      query: 'What is my current balance?'
    },
    {
      id: 'expenses',
      label: 'Monthly Expenses',
      icon: '📊',
      query: 'How much did I spend this month?'
    },
    {
      id: 'categories',
      label: 'Top Categories',
      icon: '📈',
      query: 'What are my top spending categories?'
    },
    {
      id: 'insights',
      label: 'Get Insights',
      icon: '🧠',
      query: 'Give me insights about my spending patterns'
    },
    {
      id: 'recommendations',
      label: 'Money Tips',
      icon: '💡',
      query: 'Give me recommendations to improve my finances'
    }
  ];

  const value = {
    // State
    isLoading,
    chatHistory,
    insights,
    recommendations,
    quickActions,

    // Actions
    sendChatMessage,
    getInsights,
    getRecommendations,
    analyzeFinancialData,
    categorizeTransaction,
    clearChatHistory
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};
