const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const goalService = require('../services/goalService');
const fraudDetectionService = require('../services/fraudDetectionService');
const investmentAdvisorService = require('../services/investmentAdvisorService');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');

// @route   POST /api/ai/analyze
// @desc    Get AI analysis of financial data
// @access  Public
router.post('/analyze', async (req, res) => {
  try {
    // Get all transactions
    const transactions = await Transaction.find().sort({ date: -1 });
    
    // Calculate summary
    const summary = calculateSummary(transactions);
    
    // Get AI analysis
    const analysis = await aiService.analyzeFinancialData(transactions, summary);
    
    res.json({
      success: true,
      data: {
        analysis,
        summary,
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing financial data',
      error: error.message
    });
  }
});

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant
// @access  Public
router.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }
    
    // Get recent transactions for context
    const transactions = await Transaction.find().sort({ date: -1 }).limit(50);
    const summary = calculateSummary(transactions);
    
    // Get AI response
    const response = await aiService.answerFinancialQuestion(question, transactions, summary);
    
    res.json({
      success: true,
      data: {
        question,
        response,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat request',
      error: error.message
    });
  }
});

// @route   POST /api/ai/recommendations
// @desc    Get AI recommendations
// @access  Public
router.post('/recommendations', async (req, res) => {
  try {
    // Get all transactions
    const transactions = await Transaction.find().sort({ date: -1 });
    const summary = calculateSummary(transactions);
    
    // Get AI recommendations
    const recommendations = await aiService.generateRecommendations(transactions, summary);
    
    res.json({
      success: true,
      data: {
        recommendations,
        summary,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message
    });
  }
});

// @route   POST /api/ai/categorize
// @desc    Auto-categorize a transaction
// @access  Public
router.post('/categorize', async (req, res) => {
  try {
    const { name, amount, description } = req.body;
    
    if (!name || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Transaction name and amount are required'
      });
    }
    
    // Get AI categorization
    const categorization = await aiService.categorizeTransaction(name, amount, description);
    
    res.json({
      success: true,
      data: categorization
    });
  } catch (error) {
    console.error('AI Categorization Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error categorizing transaction',
      error: error.message
    });
  }
});

// @route   GET /api/ai/insights
// @desc    Get quick financial insights
// @access  Public
router.get('/insights', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 }).limit(100);
    const summary = calculateSummary(transactions);
    
    // Generate quick insights
    const insights = generateQuickInsights(transactions, summary);
    
    res.json({
      success: true,
      data: {
        insights,
        summary,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('AI Insights Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating insights',
      error: error.message
    });
  }
});

// Helper function to calculate financial summary
function calculateSummary(transactions) {
  const summary = {
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    transactionCount: transactions.length,
    categories: {},
    recentTransactions: transactions.slice(0, 5)
  };
  
  transactions.forEach(transaction => {
    if (transaction.type === 'income') {
      summary.totalIncome += Math.abs(transaction.amount);
      summary.balance += Math.abs(transaction.amount);
    } else {
      summary.totalExpenses += Math.abs(transaction.amount);
      summary.balance -= Math.abs(transaction.amount);
    }
    
    // Category breakdown
    const category = transaction.category || 'Other';
    if (!summary.categories[category]) {
      summary.categories[category] = { income: 0, expense: 0, count: 0 };
    }
    
    if (transaction.type === 'income') {
      summary.categories[category].income += Math.abs(transaction.amount);
    } else {
      summary.categories[category].expense += Math.abs(transaction.amount);
    }
    summary.categories[category].count++;
  });
  
  return summary;
}

// Helper function to generate quick insights
function generateQuickInsights(transactions, summary) {
  const insights = [];
  
  // Balance insight
  if (summary.balance > 1000) {
    insights.push({
      type: 'positive',
      title: 'Healthy Balance',
      message: `Great job! You have a positive balance of ₹${summary.balance.toFixed(2)}.`,
      icon: '💰'
    });
  } else if (summary.balance < 0) {
    insights.push({
      type: 'warning',
      title: 'Negative Balance',
      message: `Your balance is ₹${summary.balance.toFixed(2)}. Consider reviewing your expenses.`,
      icon: '⚠️'
    });
  }
  
  // Spending pattern insight
  if (summary.totalExpenses > summary.totalIncome && summary.totalIncome > 0) {
    insights.push({
      type: 'warning',
      title: 'Spending Alert',
      message: `You're spending more than you earn. Expenses: ₹${summary.totalExpenses.toFixed(2)}, Income: ₹${summary.totalIncome.toFixed(2)}.`,
      icon: '📊'
    });
  }
  
  // Top category insight
  const topExpenseCategory = Object.entries(summary.categories)
    .filter(([_, data]) => data.expense > 0)
    .sort(([_, a], [__, b]) => b.expense - a.expense)[0];
    
  if (topExpenseCategory) {
    insights.push({
      type: 'info',
      title: 'Top Spending Category',
      message: `Your highest spending category is ${topExpenseCategory[0]} with ₹${topExpenseCategory[1].expense.toFixed(2)}.`,
      icon: '📈'
    });
  }
  
  // Transaction frequency insight
  if (summary.transactionCount > 50) {
    insights.push({
      type: 'info',
      title: 'Active Spender',
      message: `You've made ${summary.transactionCount} transactions. Consider consolidating similar purchases.`,
      icon: '🔄'
    });
  }
  
  return insights;
}

// ===== GOAL ACHIEVEMENT AGENT ROUTES =====

// @route   POST /api/ai/goals/analyze
// @desc    Analyze goal progress with AI insights
// @access  Public
router.post('/goals/analyze/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;
    const analysis = await goalService.analyzeGoalProgress(goalId);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Goal analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing goal progress',
      error: error.message
    });
  }
});

// @route   POST /api/ai/goals/suggestions
// @desc    Get AI goal suggestions based on spending patterns
// @access  Public
router.post('/goals/suggestions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 }).limit(100);
    const suggestions = await goalService.generateGoalSuggestions(transactions);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Goal suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating goal suggestions',
      error: error.message
    });
  }
});

// @route   GET /api/ai/goals/dashboard
// @desc    Get goals dashboard with AI insights
// @access  Public
router.get('/goals/dashboard', async (req, res) => {
  try {
    const dashboard = await goalService.getGoalsDashboard();

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Goals dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching goals dashboard',
      error: error.message
    });
  }
});

// ===== FRAUD DETECTION AGENT ROUTES =====

// @route   POST /api/ai/fraud/analyze
// @desc    Analyze transaction for fraud patterns
// @access  Public
router.post('/fraud/analyze', async (req, res) => {
  try {
    const { transaction } = req.body;

    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction data is required'
      });
    }

    // Get user's transaction history for context
    const userTransactions = await Transaction.find().sort({ date: -1 }).limit(100);

    const analysis = await fraudDetectionService.analyzeTransaction(transaction, userTransactions);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Fraud analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing transaction for fraud',
      error: error.message
    });
  }
});

// @route   GET /api/ai/fraud/dashboard
// @desc    Get fraud detection dashboard
// @access  Public
router.get('/fraud/dashboard', async (req, res) => {
  try {
    const dashboard = await fraudDetectionService.getFraudDashboard();

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Fraud dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fraud dashboard',
      error: error.message
    });
  }
});

// ===== INVESTMENT ADVISOR AGENT ROUTES =====

// @route   POST /api/ai/investment/analyze
// @desc    Analyze financial profile for investment recommendations
// @access  Public
router.post('/investment/analyze', async (req, res) => {
  try {
    const { userAge, monthlyIncome } = req.body;

    const transactions = await Transaction.find().sort({ date: -1 });
    const analysis = await investmentAdvisorService.analyzeFinancialProfile(
      transactions,
      userAge || 30,
      monthlyIncome || 0
    );

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Investment analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing investment profile',
      error: error.message
    });
  }
});

// @route   POST /api/ai/investment/insights
// @desc    Get investment insights and recommendations
// @access  Public
router.post('/investment/insights', async (req, res) => {
  try {
    const { investments } = req.body;

    const transactions = await Transaction.find().sort({ date: -1 });
    const insights = await investmentAdvisorService.generateInvestmentInsights(
      transactions,
      investments || []
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Investment insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating investment insights',
      error: error.message
    });
  }
});

module.exports = router;
