import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '../../contexts/AIContext';
import './AIChat.css';

const AIChat = ({ isOpen, onClose }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const {
    chatHistory,
    isLoading,
    sendChatMessage,
    quickActions,
    clearChatHistory
  } = useAI();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage;
    setInputMessage('');
    await sendChatMessage(message);
  };

  const handleQuickAction = async (action) => {
    await sendChatMessage(action.query);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-overlay">
      <div className="ai-chat-container">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <div className="ai-avatar">🤖</div>
            <div>
              <h3>SpendSmart AI</h3>
              <span className="ai-status">
                {isLoading ? 'Thinking...' : 'Online'}
              </span>
            </div>
          </div>
          <div className="ai-chat-actions">
            <button 
              className="ai-action-btn"
              onClick={clearChatHistory}
              title="Clear Chat"
            >
              🗑️
            </button>
            <button 
              className="ai-close-btn"
              onClick={onClose}
              title="Close Chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {chatHistory.map((message) => (
            <div 
              key={message.id} 
              className={`ai-message ${message.type} ${message.isError ? 'error' : ''}`}
            >
              <div className="message-avatar">
                {message.type === 'ai' ? '🤖' : '👤'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.message}
                </div>
                <div className="message-time">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="ai-message ai typing">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="ai-quick-actions">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className="quick-action-btn"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <form className="ai-chat-input" onSubmit={handleSendMessage}>
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about your finances..."
              disabled={isLoading}
              className="message-input"
            />
            <button 
              type="submit" 
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
