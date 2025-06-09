const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// @route   GET /api/transactions
// @desc    Get all transactions
// @access  Public (will be protected later)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      type, 
      startDate, 
      endDate,
      search 
    } = req.query;

    // Build query object
    let query = {};
    
    if (category) query.category = category;
    if (type) query.type = type;
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Search in name and description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// @route   GET /api/transactions/summary
// @desc    Get transaction summary (balance, income, expenses)
// @access  Public
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Aggregate data
    const summary = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          totalExpenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, { $abs: '$amount' }, 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const result = summary[0] || { totalIncome: 0, totalExpenses: 0, transactionCount: 0 };
    result.balance = result.totalIncome - result.totalExpenses;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching summary'
    });
  }
});

// @route   GET /api/transactions/categories
// @desc    Get spending by category
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    const categoryData = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: { $abs: '$amount' } },
          count: { $sum: 1 },
          type: { $first: '$type' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('Error fetching category data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category data'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, amount, description, category, date, type } = req.body;

    // Use provided type or determine from amount
    let transactionType = type;
    if (!transactionType) {
      transactionType = amount >= 0 ? 'income' : 'expense';
    }

    // Ensure amount sign matches type
    let finalAmount = Math.abs(amount);
    if (transactionType === 'expense') {
      finalAmount = -finalAmount;
    }

    const transaction = new Transaction({
      name,
      amount: finalAmount,
      description,
      category,
      type: transactionType,
      date: date || new Date()
    });

    const savedTransaction = await transaction.save();

    res.status(201).json({
      success: true,
      data: savedTransaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { name, amount, description, category, date, type } = req.body;

    // Use provided type or determine from amount
    let transactionType = type;
    if (!transactionType) {
      transactionType = amount >= 0 ? 'income' : 'expense';
    }

    // Ensure amount sign matches type
    let finalAmount = Math.abs(amount);
    if (transactionType === 'expense') {
      finalAmount = -finalAmount;
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        name,
        amount: finalAmount,
        description,
        category,
        type: transactionType,
        date
      },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating transaction'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction'
    });
  }
});

module.exports = router;
