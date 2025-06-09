import React, { useState } from 'react';
import AIChat from './AIChat';
import './AIChatButton.css';

const AIChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        className={`ai-chat-button ${isChatOpen ? 'active' : ''}`}
        onClick={toggleChat}
        title="Chat with AI Assistant"
      >
        <div className="chat-button-icon">
          {isChatOpen ? '✕' : '🤖'}
        </div>
        <div className="chat-button-pulse"></div>
      </button>

      {/* Chat Interface */}
      <AIChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
};

export default AIChatButton;
