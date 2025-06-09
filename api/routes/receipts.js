const express = require('express');
const multer = require('multer');
const receiptOCRService = require('../services/receiptOCRService');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/receipts/upload
// @desc    Upload and process receipt image
// @access  Public
router.post('/upload', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt image provided'
      });
    }

    // Extract text from receipt
    const textResult = await receiptOCRService.extractTextFromImage(req.file.buffer);
    
    if (!textResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from receipt',
        error: textResult.error
      });
    }

    // Parse receipt data
    const parseResult = receiptOCRService.parseReceiptText(textResult.text);
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse receipt data',
        error: parseResult.error
      });
    }

    res.json({
      success: true,
      data: {
        extractedText: textResult.text,
        transaction: parseResult.transaction,
        confidence: textResult.confidence
      }
    });

  } catch (error) {
    console.error('Receipt upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing receipt',
      error: error.message
    });
  }
});

// @route   POST /api/receipts/upload-and-save
// @desc    Upload receipt and automatically save as transaction
// @access  Public
router.post('/upload-and-save', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt image provided'
      });
    }

    // Extract and parse receipt
    const textResult = await receiptOCRService.extractTextFromImage(req.file.buffer);
    
    if (!textResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from receipt'
      });
    }

    const parseResult = receiptOCRService.parseReceiptText(textResult.text);
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse receipt data'
      });
    }

    // Create transaction from receipt data
    const transactionData = parseResult.transaction;
    
    // Allow manual overrides from request body
    if (req.body.name) transactionData.name = req.body.name;
    if (req.body.amount) transactionData.amount = parseFloat(req.body.amount);
    if (req.body.category) transactionData.category = req.body.category;
    if (req.body.description) transactionData.description = req.body.description;

    const transaction = new Transaction(transactionData);
    await transaction.save();

    res.json({
      success: true,
      data: {
        transaction: transaction,
        extractedText: textResult.text,
        confidence: textResult.confidence
      }
    });

  } catch (error) {
    console.error('Receipt save error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving receipt transaction',
      error: error.message
    });
  }
});

// @route   POST /api/receipts/batch-upload
// @desc    Upload multiple receipts at once
// @access  Public
router.post('/batch-upload', upload.array('receipts', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No receipt images provided'
      });
    }

    const imageBuffers = req.files.map(file => file.buffer);
    const results = await receiptOCRService.processBatchReceipts(imageBuffers);

    // Separate successful and failed results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      data: {
        processed: results.length,
        successful: successful.length,
        failed: failed.length,
        transactions: successful.map(r => r.transaction),
        errors: failed.map(r => r.error)
      }
    });

  } catch (error) {
    console.error('Batch receipt upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing batch receipts',
      error: error.message
    });
  }
});

// @route   POST /api/receipts/validate-transaction
// @desc    Validate and correct OCR-extracted transaction data
// @access  Public
router.post('/validate-transaction', async (req, res) => {
  try {
    const { extractedData, corrections } = req.body;

    if (!extractedData) {
      return res.status(400).json({
        success: false,
        message: 'No extracted data provided'
      });
    }

    // Apply corrections to extracted data
    const correctedData = {
      ...extractedData,
      ...corrections
    };

    // Validate the corrected data
    const validation = {
      isValid: true,
      errors: []
    };

    if (!correctedData.name || correctedData.name.trim().length === 0) {
      validation.isValid = false;
      validation.errors.push('Transaction name is required');
    }

    if (!correctedData.amount || correctedData.amount <= 0) {
      validation.isValid = false;
      validation.errors.push('Valid amount is required');
    }

    if (!correctedData.category) {
      validation.isValid = false;
      validation.errors.push('Category is required');
    }

    res.json({
      success: true,
      data: {
        correctedData,
        validation,
        readyToSave: validation.isValid
      }
    });

  } catch (error) {
    console.error('Transaction validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating transaction data',
      error: error.message
    });
  }
});

// @route   GET /api/receipts/stats
// @desc    Get receipt processing statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    // Get transactions created from receipts
    const receiptTransactions = await Transaction.find({ source: 'receipt_ocr' });
    
    const stats = {
      totalReceiptTransactions: receiptTransactions.length,
      totalAmount: receiptTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      categoriesUsed: [...new Set(receiptTransactions.map(t => t.category))],
      averageAmount: receiptTransactions.length > 0 
        ? receiptTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / receiptTransactions.length 
        : 0,
      recentReceipts: receiptTransactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Receipt stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receipt statistics',
      error: error.message
    });
  }
});

module.exports = router;
