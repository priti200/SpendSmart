const Transaction = require('../models/Transaction');

class FraudDetectionService {
  constructor() {
    this.isEnabled = true;
    this.riskThresholds = {
      high: 0.8,
      medium: 0.5,
      low: 0.3
    };
  }

  // Analyze transaction for fraud patterns
  async analyzeTransaction(transaction, userTransactions = []) {
    try {
      const riskFactors = [];
      let riskScore = 0;

      // Amount-based analysis
      const amountRisk = this.analyzeAmount(transaction, userTransactions);
      riskScore += amountRisk.score;
      if (amountRisk.factors.length > 0) {
        riskFactors.push(...amountRisk.factors);
      }

      // Time-based analysis
      const timeRisk = this.analyzeTime(transaction, userTransactions);
      riskScore += timeRisk.score;
      if (timeRisk.factors.length > 0) {
        riskFactors.push(...timeRisk.factors);
      }

      // Pattern-based analysis
      const patternRisk = this.analyzePatterns(transaction, userTransactions);
      riskScore += patternRisk.score;
      if (patternRisk.factors.length > 0) {
        riskFactors.push(...patternRisk.factors);
      }

      // Category-based analysis
      const categoryRisk = this.analyzeCategory(transaction, userTransactions);
      riskScore += categoryRisk.score;
      if (categoryRisk.factors.length > 0) {
        riskFactors.push(...categoryRisk.factors);
      }

      // Frequency analysis
      const frequencyRisk = this.analyzeFrequency(transaction, userTransactions);
      riskScore += frequencyRisk.score;
      if (frequencyRisk.factors.length > 0) {
        riskFactors.push(...frequencyRisk.factors);
      }

      // Normalize risk score (0-1)
      riskScore = Math.min(riskScore / 5, 1);

      // Determine risk level
      let riskLevel = 'low';
      if (riskScore >= this.riskThresholds.high) {
        riskLevel = 'high';
      } else if (riskScore >= this.riskThresholds.medium) {
        riskLevel = 'medium';
      }

      return {
        success: true,
        analysis: {
          riskScore: Math.round(riskScore * 100),
          riskLevel,
          riskFactors,
          recommendations: this.generateRecommendations(riskLevel, riskFactors),
          requiresReview: riskLevel === 'high',
          confidence: this.calculateConfidence(riskFactors.length, userTransactions.length)
        }
      };
    } catch (error) {
      console.error('Fraud analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  // Analyze amount anomalies
  analyzeAmount(transaction, userTransactions) {
    const factors = [];
    let score = 0;

    if (userTransactions.length === 0) {
      return { score: 0, factors };
    }

    const amount = Math.abs(transaction.amount);
    const amounts = userTransactions.map(t => Math.abs(t.amount));
    const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);

    // Unusually large amount
    if (amount > avgAmount * 5) {
      factors.push({
        type: 'unusual_amount',
        description: `Transaction amount (₹${amount}) is ${Math.round(amount / avgAmount)}x higher than your average`,
        severity: 'high'
      });
      score += 0.4;
    } else if (amount > avgAmount * 3) {
      factors.push({
        type: 'high_amount',
        description: `Transaction amount is significantly higher than usual`,
        severity: 'medium'
      });
      score += 0.2;
    }

    // Round number amounts (potential fraud indicator)
    if (amount >= 1000 && amount % 1000 === 0) {
      factors.push({
        type: 'round_amount',
        description: 'Round number amounts can indicate fraudulent transactions',
        severity: 'low'
      });
      score += 0.1;
    }

    // Very small amounts (testing fraud)
    if (amount < 10 && transaction.type === 'expense') {
      factors.push({
        type: 'micro_transaction',
        description: 'Very small transactions might be fraud testing',
        severity: 'low'
      });
      score += 0.1;
    }

    return { score, factors };
  }

  // Analyze time-based anomalies
  analyzeTime(transaction, userTransactions) {
    const factors = [];
    let score = 0;

    const transactionTime = new Date(transaction.date);
    const hour = transactionTime.getHours();

    // Unusual time (late night/early morning)
    if (hour < 6 || hour > 23) {
      factors.push({
        type: 'unusual_time',
        description: `Transaction at ${hour}:00 is outside normal hours`,
        severity: 'medium'
      });
      score += 0.2;
    }

    // Weekend transactions for business categories
    const isWeekend = transactionTime.getDay() === 0 || transactionTime.getDay() === 6;
    const businessCategories = ['Bills & Utilities', 'Healthcare', 'Education'];
    
    if (isWeekend && businessCategories.includes(transaction.category)) {
      factors.push({
        type: 'weekend_business',
        description: 'Business transaction on weekend is unusual',
        severity: 'low'
      });
      score += 0.1;
    }

    // Multiple transactions in short time
    const recentTransactions = userTransactions.filter(t => {
      const timeDiff = Math.abs(new Date(t.date) - transactionTime);
      return timeDiff < 5 * 60 * 1000; // 5 minutes
    });

    if (recentTransactions.length > 2) {
      factors.push({
        type: 'rapid_transactions',
        description: `${recentTransactions.length + 1} transactions within 5 minutes`,
        severity: 'high'
      });
      score += 0.3;
    }

    return { score, factors };
  }

  // Analyze spending patterns
  analyzePatterns(transaction, userTransactions) {
    const factors = [];
    let score = 0;

    if (userTransactions.length < 10) {
      return { score: 0, factors };
    }

    // Analyze category spending patterns
    const categoryTransactions = userTransactions.filter(t => t.category === transaction.category);
    const categoryAvg = categoryTransactions.length > 0 
      ? categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / categoryTransactions.length
      : 0;

    if (categoryAvg > 0 && Math.abs(transaction.amount) > categoryAvg * 4) {
      factors.push({
        type: 'category_anomaly',
        description: `Unusual spending amount for ${transaction.category} category`,
        severity: 'medium'
      });
      score += 0.2;
    }

    // Duplicate transaction detection
    const duplicates = userTransactions.filter(t => {
      const timeDiff = Math.abs(new Date(t.date) - new Date(transaction.date));
      return Math.abs(t.amount) === Math.abs(transaction.amount) &&
             t.name.toLowerCase() === transaction.name.toLowerCase() &&
             timeDiff < 24 * 60 * 60 * 1000; // Same day
    });

    if (duplicates.length > 0) {
      factors.push({
        type: 'duplicate_transaction',
        description: 'Potential duplicate transaction detected',
        severity: 'high'
      });
      score += 0.4;
    }

    // Merchant name analysis
    if (this.isSuspiciousMerchantName(transaction.name)) {
      factors.push({
        type: 'suspicious_merchant',
        description: 'Merchant name contains suspicious patterns',
        severity: 'medium'
      });
      score += 0.2;
    }

    return { score, factors };
  }

  // Analyze category-based risks
  analyzeCategory(transaction, userTransactions) {
    const factors = [];
    let score = 0;

    // High-risk categories
    const highRiskCategories = ['Other', 'Entertainment'];
    if (highRiskCategories.includes(transaction.category) && Math.abs(transaction.amount) > 5000) {
      factors.push({
        type: 'high_risk_category',
        description: `Large transaction in ${transaction.category} category`,
        severity: 'medium'
      });
      score += 0.2;
    }

    // Unusual category for user
    const userCategories = [...new Set(userTransactions.map(t => t.category))];
    if (!userCategories.includes(transaction.category) && userTransactions.length > 20) {
      factors.push({
        type: 'new_category',
        description: 'First transaction in this category',
        severity: 'low'
      });
      score += 0.1;
    }

    return { score, factors };
  }

  // Analyze transaction frequency
  analyzeFrequency(transaction, userTransactions) {
    const factors = [];
    let score = 0;

    // Daily transaction count
    const today = new Date(transaction.date);
    const todayTransactions = userTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.toDateString() === today.toDateString();
    });

    if (todayTransactions.length > 10) {
      factors.push({
        type: 'high_frequency',
        description: `${todayTransactions.length + 1} transactions today`,
        severity: 'medium'
      });
      score += 0.2;
    }

    // Same merchant frequency
    const sameMerchantToday = todayTransactions.filter(t => 
      t.name.toLowerCase() === transaction.name.toLowerCase()
    );

    if (sameMerchantToday.length > 2) {
      factors.push({
        type: 'merchant_frequency',
        description: `Multiple transactions with same merchant today`,
        severity: 'high'
      });
      score += 0.3;
    }

    return { score, factors };
  }

  // Check for suspicious merchant names
  isSuspiciousMerchantName(name) {
    const suspiciousPatterns = [
      /^[A-Z]{3,}\d+$/,  // All caps with numbers
      /^\d+[A-Z]+\d+$/,  // Numbers-letters-numbers
      /^[A-Z\d\s]{20,}$/, // Very long all caps
      /TEMP|TEST|UNKNOWN|PENDING/i,
      /^[\d\s\-\*]+$/    // Only numbers and symbols
    ];

    return suspiciousPatterns.some(pattern => pattern.test(name.trim()));
  }

  // Generate recommendations based on risk factors
  generateRecommendations(riskLevel, riskFactors) {
    const recommendations = [];

    if (riskLevel === 'high') {
      recommendations.push('Review this transaction immediately');
      recommendations.push('Verify with your bank or payment provider');
      recommendations.push('Check for unauthorized access to your accounts');
    } else if (riskLevel === 'medium') {
      recommendations.push('Double-check transaction details');
      recommendations.push('Monitor account for similar transactions');
    }

    // Specific recommendations based on risk factors
    riskFactors.forEach(factor => {
      switch (factor.type) {
        case 'unusual_amount':
          recommendations.push('Verify the transaction amount is correct');
          break;
        case 'duplicate_transaction':
          recommendations.push('Check if this is a duplicate charge');
          break;
        case 'suspicious_merchant':
          recommendations.push('Verify the merchant name and legitimacy');
          break;
        case 'rapid_transactions':
          recommendations.push('Review all recent transactions for accuracy');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Calculate confidence level
  calculateConfidence(factorCount, transactionHistoryLength) {
    let confidence = 50; // Base confidence

    // More transaction history = higher confidence
    if (transactionHistoryLength > 100) {
      confidence += 30;
    } else if (transactionHistoryLength > 50) {
      confidence += 20;
    } else if (transactionHistoryLength > 20) {
      confidence += 10;
    }

    // More risk factors = higher confidence in detection
    confidence += Math.min(factorCount * 5, 20);

    return Math.min(confidence, 95);
  }

  // Batch analyze multiple transactions
  async batchAnalyzeTransactions(transactions) {
    const results = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const previousTransactions = transactions.slice(0, i);
      
      const analysis = await this.analyzeTransaction(transaction, previousTransactions);
      results.push({
        transactionId: transaction._id,
        ...analysis
      });
    }

    return {
      success: true,
      results,
      summary: {
        total: results.length,
        highRisk: results.filter(r => r.analysis?.riskLevel === 'high').length,
        mediumRisk: results.filter(r => r.analysis?.riskLevel === 'medium').length,
        lowRisk: results.filter(r => r.analysis?.riskLevel === 'low').length
      }
    };
  }

  // Get fraud detection dashboard
  async getFraudDashboard() {
    try {
      const recentTransactions = await Transaction.find()
        .sort({ date: -1 })
        .limit(100);

      const batchAnalysis = await this.batchAnalyzeTransactions(recentTransactions);
      
      const alerts = batchAnalysis.results
        .filter(r => r.analysis?.riskLevel === 'high')
        .slice(0, 10);

      const trends = this.calculateFraudTrends(batchAnalysis.results);

      return {
        success: true,
        data: {
          summary: batchAnalysis.summary,
          alerts,
          trends,
          recentAnalysis: batchAnalysis.results.slice(0, 20)
        }
      };
    } catch (error) {
      console.error('Fraud dashboard error:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate fraud trends
  calculateFraudTrends(results) {
    const last30Days = results.filter(r => {
      const transactionDate = new Date(r.date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return transactionDate >= thirtyDaysAgo;
    });

    const riskDistribution = {
      high: last30Days.filter(r => r.analysis?.riskLevel === 'high').length,
      medium: last30Days.filter(r => r.analysis?.riskLevel === 'medium').length,
      low: last30Days.filter(r => r.analysis?.riskLevel === 'low').length
    };

    const commonRiskFactors = {};
    last30Days.forEach(r => {
      if (r.analysis?.riskFactors) {
        r.analysis.riskFactors.forEach(factor => {
          commonRiskFactors[factor.type] = (commonRiskFactors[factor.type] || 0) + 1;
        });
      }
    });

    return {
      riskDistribution,
      commonRiskFactors: Object.entries(commonRiskFactors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      totalAnalyzed: last30Days.length,
      averageRiskScore: last30Days.length > 0 
        ? Math.round(last30Days.reduce((sum, r) => sum + (r.analysis?.riskScore || 0), 0) / last30Days.length)
        : 0
    };
  }
}

module.exports = new FraudDetectionService();
