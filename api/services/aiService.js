const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key'
});

class AIService {
  constructor() {
    this.isEnabled = !!process.env.OPENAI_API_KEY;
  }

  // Analyze user's financial data and provide insights
  async analyzeFinancialData(transactions, summary) {
    if (!this.isEnabled) {
      return this.getMockInsights(transactions, summary);
    }

    try {
      const prompt = this.buildAnalysisPrompt(transactions, summary);
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful financial advisor AI assistant. Analyze the user's spending data and provide clear, actionable insights. Be concise but informative."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return {
        success: true,
        insights: response.choices[0].message.content,
        type: 'analysis'
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return this.getMockInsights(transactions, summary);
    }
  }

  // Answer specific financial questions
  async answerFinancialQuestion(question, transactions, summary) {
    if (!this.isEnabled) {
      return this.getMockAnswer(question, transactions, summary);
    }

    try {
      const context = this.buildContextPrompt(transactions, summary);
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are SpendSmart AI, a personal financial assistant. Answer questions about the user's financial data clearly and helpfully. Use the provided transaction data to give accurate answers."
          },
          {
            role: "user",
            content: `Context: ${context}\n\nQuestion: ${question}`
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      });

      return {
        success: true,
        answer: response.choices[0].message.content,
        type: 'question'
      };
    } catch (error) {
      console.error('AI Question Error:', error);
      return this.getMockAnswer(question, transactions, summary);
    }
  }

  // Generate spending recommendations
  async generateRecommendations(transactions, summary) {
    if (!this.isEnabled) {
      return this.getMockRecommendations(transactions, summary);
    }

    try {
      const prompt = this.buildRecommendationPrompt(transactions, summary);
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a financial advisor. Provide 3-5 specific, actionable recommendations to improve the user's financial health based on their spending data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.6
      });

      return {
        success: true,
        recommendations: response.choices[0].message.content.split('\n').filter(r => r.trim()),
        type: 'recommendations'
      };
    } catch (error) {
      console.error('AI Recommendations Error:', error);
      return this.getMockRecommendations(transactions, summary);
    }
  }

  // Auto-categorize transactions
  async categorizeTransaction(transactionName, amount, description) {
    if (!this.isEnabled) {
      return this.getMockCategory(transactionName, amount, description);
    }

    try {
      const prompt = `Categorize this transaction:
Name: ${transactionName}
Amount: ₹${Math.abs(amount)}
Description: ${description || 'N/A'}

Choose from: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Income, Investment, Other

Return only the category name.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a transaction categorization expert. Categorize transactions accurately based on the name and description."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 0.3
      });

      const category = response.choices[0].message.content.trim();
      
      return {
        success: true,
        category: this.validateCategory(category),
        confidence: 0.9
      };
    } catch (error) {
      console.error('AI Categorization Error:', error);
      return this.getMockCategory(transactionName, amount, description);
    }
  }

  // Build analysis prompt
  buildAnalysisPrompt(transactions, summary) {
    const recentTransactions = transactions.slice(0, 10);
    const categoryBreakdown = this.getCategoryBreakdown(transactions);
    
    return `Analyze this financial data:

Balance: ₹${summary.balance}
Total Income: ₹${summary.totalIncome}
Total Expenses: ₹${summary.totalExpenses}
Transaction Count: ${summary.transactionCount}

Category Breakdown:
${categoryBreakdown}

Recent Transactions:
${recentTransactions.map(t => `- ${t.name}: ₹${Math.abs(t.amount)} (${t.category})`).join('\n')}

Provide insights about spending patterns, financial health, and areas for improvement.`;
  }

  // Build context prompt for questions
  buildContextPrompt(transactions, summary) {
    return `Financial Summary:
- Balance: ₹${summary.balance}
- Income: ₹${summary.totalIncome}
- Expenses: ₹${summary.totalExpenses}
- Transactions: ${summary.transactionCount}

Recent activity: ${transactions.slice(0, 5).map(t => `${t.name} (₹${Math.abs(t.amount)})`).join(', ')}`;
  }

  // Build recommendation prompt
  buildRecommendationPrompt(transactions, summary) {
    const categoryBreakdown = this.getCategoryBreakdown(transactions);
    
    return `Based on this financial data, provide specific recommendations:

Current Financial Status:
- Balance: ₹${summary.balance}
- Monthly Income: ₹${summary.totalIncome}
- Monthly Expenses: ₹${summary.totalExpenses}

Spending by Category:
${categoryBreakdown}

Provide 3-5 actionable recommendations to improve financial health.`;
  }

  // Get category breakdown
  getCategoryBreakdown(transactions) {
    const categories = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
      }
    });
    
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => `- ${cat}: ₹${amount.toFixed(2)}`)
      .join('\n');
  }

  // Validate category
  validateCategory(category) {
    const validCategories = [
      'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
      'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
      'Income', 'Investment', 'Other'
    ];
    
    return validCategories.includes(category) ? category : 'Other';
  }

  // Mock responses for when AI is not available
  getMockInsights(transactions, summary) {
    const insights = [
      `Your current balance is ₹${summary.balance}. ${summary.balance > 0 ? 'Great job maintaining a positive balance!' : 'Consider reviewing your expenses to improve your balance.'}`,
      `You've made ${summary.transactionCount} transactions recently.`,
      `Your expense-to-income ratio is ${summary.totalIncome > 0 ? ((summary.totalExpenses / summary.totalIncome) * 100).toFixed(1) : 'N/A'}%.`
    ];

    return {
      success: true,
      insights: insights.join(' '),
      type: 'analysis'
    };
  }

  getMockAnswer(question, transactions, summary) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('balance')) {
      return {
        success: true,
        answer: `Your current balance is ₹${summary.balance}.`,
        type: 'question'
      };
    }

    if (lowerQuestion.includes('spend') || lowerQuestion.includes('expense')) {
      return {
        success: true,
        answer: `Your total expenses are ₹${summary.totalExpenses}. You've made ${summary.transactionCount} transactions.`,
        type: 'question'
      };
    }
    
    return {
      success: true,
      answer: "I can help you analyze your spending patterns, check your balance, and provide financial insights. Try asking about your expenses or balance!",
      type: 'question'
    };
  }

  getMockRecommendations(transactions, summary) {
    const recommendations = [
      "Track your daily expenses to identify spending patterns",
      "Set up a monthly budget for each category",
      "Consider reducing discretionary spending if expenses exceed income",
      "Build an emergency fund with 3-6 months of expenses",
      "Review and categorize all transactions regularly"
    ];

    return {
      success: true,
      recommendations,
      type: 'recommendations'
    };
  }

  getMockCategory(transactionName, amount, description) {
    const name = transactionName.toLowerCase();
    
    if (name.includes('food') || name.includes('restaurant') || name.includes('cafe')) {
      return { success: true, category: 'Food & Dining', confidence: 0.8 };
    }
    if (name.includes('gas') || name.includes('uber') || name.includes('taxi')) {
      return { success: true, category: 'Transportation', confidence: 0.8 };
    }
    if (name.includes('store') || name.includes('shop') || name.includes('amazon')) {
      return { success: true, category: 'Shopping', confidence: 0.8 };
    }
    
    return { success: true, category: 'Other', confidence: 0.5 };
  }
}

module.exports = new AIService();
