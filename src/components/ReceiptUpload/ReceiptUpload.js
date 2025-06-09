import React, { useState, useRef } from 'react';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';
import './ReceiptUpload.css';

const ReceiptUpload = ({ onClose }) => {
  const { addTransaction } = useTransactions();
  const fileInputRef = useRef(null);
  
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, processing, review, saving
  const [extractedData, setExtractedData] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  // Handle drag and drop
  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Upload and process receipt
  const processReceipt = async () => {
    if (!selectedFile) {
      setError('Please select a receipt image');
      return;
    }

    setUploadState('uploading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('receipt', selectedFile);

      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setExtractedData(result.data.transaction);
        setExtractedText(result.data.extractedText);
        setConfidence(result.data.confidence);
        setUploadState('review');
      } else {
        setError(result.message || 'Failed to process receipt');
        setUploadState('idle');
      }
    } catch (error) {
      console.error('Receipt processing error:', error);
      setError('Error processing receipt. Please try again.');
      setUploadState('idle');
    }
  };

  // Save transaction
  const saveTransaction = async () => {
    if (!extractedData) return;

    setUploadState('saving');
    
    try {
      await addTransaction(extractedData);
      setUploadState('idle');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError('Failed to save transaction');
      setUploadState('review');
    }
  };

  // Update extracted data
  const updateExtractedData = (field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setExtractedData(null);
    setExtractedText('');
    setConfidence(0);
    setError('');
    setUploadState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="receipt-upload-container">
      <div className="receipt-upload-modal">
        <div className="modal-header">
          <h2>📱 Receipt Scanner</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {uploadState === 'idle' && (
          <div className="upload-section">
            <div 
              className="drop-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Receipt preview" className="receipt-preview" />
                  <div className="preview-overlay">
                    <p>Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="upload-icon">📷</div>
                  <h3>Upload Receipt Image</h3>
                  <p>Drag and drop or click to select</p>
                  <p className="file-types">Supports: JPG, PNG, HEIC</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile && (
              <div className="upload-actions">
                <button className="btn-secondary" onClick={resetForm}>
                  Clear
                </button>
                <button className="btn-primary" onClick={processReceipt}>
                  📱 Scan Receipt
                </button>
              </div>
            )}
          </div>
        )}

        {uploadState === 'uploading' && (
          <div className="processing-section">
            <div className="loading-spinner-large"></div>
            <h3>📸 Scanning Receipt...</h3>
            <p>Extracting text and analyzing data</p>
          </div>
        )}

        {uploadState === 'review' && extractedData && (
          <div className="review-section">
            <div className="review-header">
              <h3>✅ Receipt Processed</h3>
              <div className="confidence-badge">
                Confidence: {Math.round(confidence * 100)}%
              </div>
            </div>

            <div className="extracted-data">
              <div className="form-group">
                <label>Transaction Name</label>
                <input
                  type="text"
                  value={extractedData.name || ''}
                  onChange={(e) => updateExtractedData('name', e.target.value)}
                  placeholder="Enter transaction name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <div className="amount-input-wrapper">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      value={extractedData.amount || ''}
                      onChange={(e) => updateExtractedData('amount', parseFloat(e.target.value))}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={extractedData.category || 'Other'}
                    onChange={(e) => updateExtractedData('category', e.target.value)}
                  >
                    {['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
                      'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other'].map(cat => (
                      <option key={cat} value={cat}>
                        {getCategoryIcon(cat)} {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={extractedData.description || ''}
                  onChange={(e) => updateExtractedData('description', e.target.value)}
                  placeholder="Additional details..."
                  rows="3"
                />
              </div>

              {extractedText && (
                <details className="extracted-text-details">
                  <summary>View Extracted Text</summary>
                  <pre className="extracted-text">{extractedText}</pre>
                </details>
              )}
            </div>

            <div className="review-actions">
              <button className="btn-secondary" onClick={resetForm}>
                Scan Another
              </button>
              <button 
                className="btn-primary" 
                onClick={saveTransaction}
                disabled={!extractedData.name || !extractedData.amount}
              >
                💾 Save Transaction
              </button>
            </div>
          </div>
        )}

        {uploadState === 'saving' && (
          <div className="processing-section">
            <div className="loading-spinner-large"></div>
            <h3>💾 Saving Transaction...</h3>
            <p>Adding to your expense tracker</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptUpload;
