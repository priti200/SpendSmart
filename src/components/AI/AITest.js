import React, { useState } from 'react';
import axios from 'axios';

const AITest = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAI = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      console.log('Testing AI with message:', message);
      const result = await axios.post('http://localhost:3002/api/ai/chat', {
        question: message.trim()
      });

      console.log('AI Response:', result.data);
      
      if (result.data.success) {
        setResponse(result.data.data.response.answer);
      } else {
        setError(result.data.message || 'Failed to get response');
      }
    } catch (err) {
      console.error('AI Test Error:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      margin: '20px',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🧪 AI Test Component</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask AI a question..."
          style={{ 
            width: '300px', 
            padding: '8px',
            marginRight: '10px'
          }}
          onKeyPress={(e) => e.key === 'Enter' && testAI()}
        />
        <button 
          onClick={testAI}
          disabled={loading || !message.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test AI'}
        </button>
      </div>

      {loading && (
        <div style={{ color: '#007bff', marginBottom: '10px' }}>
          🤖 AI is thinking...
        </div>
      )}

      {response && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <strong>✅ AI Response:</strong> {response}
        </div>
      )}

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p><strong>API URL:</strong> http://localhost:3002/api/ai/chat</p>
        <p><strong>Test Questions:</strong></p>
        <ul>
          <li>What is my balance?</li>
          <li>How much did I spend?</li>
          <li>Give me insights</li>
        </ul>
      </div>
    </div>
  );
};

export default AITest;
