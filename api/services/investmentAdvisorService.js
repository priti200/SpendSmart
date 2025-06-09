const Transaction = require('../models/Transaction');

class InvestmentAdvisorService {
  constructor() {
    this.isEnabled = true;
    this.riskProfiles = {
      conservative: { equity: 20, debt: 70, gold: 10 },
      moderate: { equity: 50, debt: 40, gold: 10 },
      aggressive: { equity: 70, debt: 20, gold: 10 }
    };
  }

  // Analyze user's financial profile for investment recommendations
  async analyzeFinancialProfile(transactions, userAge = 30, monthlyIncome = 0) {
    try {
      const analysis = {
        cashFlow: this.analyzeCashFlow(transactions),
        spendingPattern: this.analyzeSpendingPattern(transactions),
        riskProfile: this.determineRiskProfile(userAge, monthlyIncome, transactions),
        investmentCapacity: this.calculateInvestmentCapacity(transactions),
        recommendations: []
      };

      // Generate personalized recommendations
      analysis.recommendations = await this.generateInvestmentRecommendations(analysis);

      return {
        success: true,
        analysis
      };
    } catch (error) {
      console.error('Investment analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  // Analyze cash flow patterns
  analyzeCashFlow(transactions) {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(transaction.amount);
      }
    });

    const months = Object.values(monthlyData);
    const avgIncome = months.reduce((sum, m) => sum + m.income, 0) / months.length || 0;
    const avgExpenses = months.reduce((sum, m) => sum + m.expenses, 0) / months.length || 0;
    const avgSurplus = avgIncome - avgExpenses;
    
    return {
      avgMonthlyIncome: avgIncome,
      avgMonthlyExpenses: avgExpenses,
      avgMonthlySurplus: avgSurplus,
      surplusPercentage: avgIncome > 0 ? (avgSurplus / avgIncome) * 100 : 0,
      cashFlowStability: this.calculateStability(months),
      months: months.length
    };
  }

  // Calculate cash flow stability
  calculateStability(monthlyData) {
    if (monthlyData.length < 3) return 'insufficient_data';
    
    const surpluses = monthlyData.map(m => m.income - m.expenses);
    const avgSurplus = surpluses.reduce((sum, s) => sum + s, 0) / surpluses.length;
    const variance = surpluses.reduce((sum, s) => sum + Math.pow(s - avgSurplus, 2), 0) / surpluses.length;
    const stdDev = Math.sqrt(variance);
    
    const stabilityRatio = avgSurplus > 0 ? stdDev / avgSurplus : 1;
    
    if (stabilityRatio < 0.2) return 'very_stable';
    if (stabilityRatio < 0.4) return 'stable';
    if (stabilityRatio < 0.6) return 'moderate';
    return 'volatile';
  }

  // Analyze spending patterns
  analyzeSpendingPattern(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categorySpending = {};
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    expenses.forEach(transaction => {
      const category = transaction.category;
      categorySpending[category] = (categorySpending[category] || 0) + Math.abs(transaction.amount);
    });

    // Calculate percentages
    const categoryPercentages = {};
    Object.entries(categorySpending).forEach(([category, amount]) => {
      categoryPercentages[category] = (amount / totalExpenses) * 100;
    });

    // Identify spending behavior
    const essentialCategories = ['Bills & Utilities', 'Healthcare', 'Food & Dining'];
    const essentialSpending = essentialCategories.reduce((sum, cat) => 
      sum + (categorySpending[cat] || 0), 0);
    const essentialPercentage = (essentialSpending / totalExpenses) * 100;

    let spendingBehavior = 'balanced';
    if (essentialPercentage > 70) spendingBehavior = 'conservative';
    if (essentialPercentage < 50) spendingBehavior = 'lifestyle_focused';

    return {
      totalMonthlyExpenses: totalExpenses,
      categoryBreakdown: categoryPercentages,
      essentialSpendingPercentage: essentialPercentage,
      spendingBehavior,
      topCategories: Object.entries(categoryPercentages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    };
  }

  // Determine risk profile based on age, income, and spending
  determineRiskProfile(age, monthlyIncome, transactions) {
    let riskScore = 50; // Base score

    // Age factor (younger = higher risk tolerance)
    if (age < 30) riskScore += 20;
    else if (age < 40) riskScore += 10;
    else if (age > 50) riskScore -= 10;
    else if (age > 60) riskScore -= 20;

    // Income factor
    if (monthlyIncome > 100000) riskScore += 15;
    else if (monthlyIncome > 50000) riskScore += 10;
    else if (monthlyIncome < 25000) riskScore -= 10;

    // Cash flow stability
    const cashFlow = this.analyzeCashFlow(transactions);
    if (cashFlow.surplusPercentage > 30) riskScore += 15;
    else if (cashFlow.surplusPercentage > 20) riskScore += 10;
    else if (cashFlow.surplusPercentage < 10) riskScore -= 15;

    if (cashFlow.cashFlowStability === 'very_stable') riskScore += 10;
    else if (cashFlow.cashFlowStability === 'volatile') riskScore -= 15;

    // Determine profile
    let profile = 'moderate';
    if (riskScore >= 70) profile = 'aggressive';
    else if (riskScore <= 40) profile = 'conservative';

    return {
      profile,
      score: Math.max(0, Math.min(100, riskScore)),
      factors: {
        age: age,
        income: monthlyIncome,
        cashFlowStability: cashFlow.cashFlowStability,
        surplusPercentage: cashFlow.surplusPercentage
      }
    };
  }

  // Calculate investment capacity
  calculateInvestmentCapacity(transactions) {
    const cashFlow = this.analyzeCashFlow(transactions);
    const monthlySurplus = cashFlow.avgMonthlySurplus;
    
    // Conservative approach: invest 70% of surplus
    const safeInvestmentAmount = monthlySurplus * 0.7;
    
    // Emergency fund requirement (3-6 months expenses)
    const emergencyFundNeeded = cashFlow.avgMonthlyExpenses * 6;
    
    return {
      monthlySurplus: monthlySurplus,
      recommendedMonthlyInvestment: Math.max(0, safeInvestmentAmount),
      emergencyFundNeeded: emergencyFundNeeded,
      canInvest: monthlySurplus > 0,
      investmentPercentage: monthlySurplus > 0 ? (safeInvestmentAmount / monthlySurplus) * 100 : 0
    };
  }

  // Generate personalized investment recommendations
  async generateInvestmentRecommendations(analysis) {
    const recommendations = [];
    const { riskProfile, investmentCapacity, cashFlow } = analysis;

    // Emergency fund recommendation
    if (investmentCapacity.emergencyFundNeeded > 0) {
      recommendations.push({
        type: 'emergency_fund',
        priority: 'high',
        title: 'Build Emergency Fund First',
        description: `Create an emergency fund of ₹${investmentCapacity.emergencyFundNeeded.toFixed(0)} (6 months expenses) before investing.`,
        suggestedAmount: investmentCapacity.emergencyFundNeeded,
        timeframe: '6-12 months',
        riskLevel: 'very_low',
        expectedReturn: '4-6%',
        instruments: ['Savings Account', 'Liquid Funds', 'Fixed Deposits']
      });
    }

    // SIP recommendations based on risk profile
    if (investmentCapacity.recommendedMonthlyInvestment > 1000) {
      const allocation = this.riskProfiles[riskProfile.profile];
      
      recommendations.push({
        type: 'systematic_investment',
        priority: 'high',
        title: 'Start SIP Investment',
        description: `Begin systematic investment with ₹${investmentCapacity.recommendedMonthlyInvestment.toFixed(0)} monthly based on your ${riskProfile.profile} risk profile.`,
        suggestedAmount: investmentCapacity.recommendedMonthlyInvestment,
        timeframe: 'long_term',
        riskLevel: riskProfile.profile,
        expectedReturn: this.getExpectedReturn(riskProfile.profile),
        allocation: allocation,
        instruments: this.getRecommendedInstruments(riskProfile.profile)
      });
    }

    // Tax saving recommendations
    if (cashFlow.avgMonthlyIncome > 25000) {
      recommendations.push({
        type: 'tax_saving',
        priority: 'medium',
        title: '80C Tax Saving Investments',
        description: 'Invest up to ₹1.5 lakh annually in tax-saving instruments to reduce tax liability.',
        suggestedAmount: 150000,
        timeframe: '3+ years',
        riskLevel: 'moderate',
        expectedReturn: '8-12%',
        instruments: ['ELSS Mutual Funds', 'PPF', 'NSC', 'Tax Saver FDs'],
        taxBenefit: 'Up to ₹46,800 tax saving'
      });
    }

    // Goal-based investment recommendations
    recommendations.push({
      type: 'goal_based',
      priority: 'medium',
      title: 'Goal-Based Investment Planning',
      description: 'Create specific investment plans for different life goals with appropriate time horizons.',
      timeframe: 'varies',
      riskLevel: 'varies',
      goals: [
        { goal: 'House Down Payment', timeframe: '5-7 years', riskLevel: 'moderate' },
        { goal: 'Child Education', timeframe: '10-15 years', riskLevel: 'moderate_aggressive' },
        { goal: 'Retirement', timeframe: '20+ years', riskLevel: 'aggressive' }
      ]
    });

    // Diversification recommendations
    if (investmentCapacity.recommendedMonthlyInvestment > 5000) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        title: 'Portfolio Diversification',
        description: 'Diversify across asset classes to reduce risk and optimize returns.',
        allocation: {
          'Equity Mutual Funds': `${allocation.equity}%`,
          'Debt Instruments': `${allocation.debt}%`,
          'Gold/Commodities': `${allocation.gold}%`
        },
        rebalanceFrequency: 'quarterly'
      });
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  // Get expected return based on risk profile
  getExpectedReturn(profile) {
    const returns = {
      conservative: '6-8%',
      moderate: '8-12%',
      aggressive: '10-15%'
    };
    return returns[profile] || '8-12%';
  }

  // Get recommended instruments based on risk profile
  getRecommendedInstruments(profile) {
    const instruments = {
      conservative: ['Debt Mutual Funds', 'Fixed Deposits', 'Government Bonds', 'Liquid Funds'],
      moderate: ['Hybrid Mutual Funds', 'Large Cap Equity Funds', 'Debt Funds', 'Gold ETFs'],
      aggressive: ['Mid Cap Funds', 'Small Cap Funds', 'Sectoral Funds', 'International Funds']
    };
    return instruments[profile] || instruments.moderate;
  }

  // Calculate portfolio performance
  calculatePortfolioPerformance(investments, marketData = {}) {
    // Mock calculation - in real implementation, this would use actual market data
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const currentValue = totalInvested * 1.12; // Assuming 12% growth
    const returns = currentValue - totalInvested;
    const returnPercentage = (returns / totalInvested) * 100;

    return {
      totalInvested,
      currentValue,
      absoluteReturns: returns,
      returnPercentage,
      dayChange: currentValue * 0.02, // Mock 2% daily change
      dayChangePercentage: 2
    };
  }

  // Generate investment insights
  async generateInvestmentInsights(transactions, investments = []) {
    try {
      const profile = await this.analyzeFinancialProfile(transactions);
      const performance = this.calculatePortfolioPerformance(investments);

      const insights = {
        portfolioHealth: this.assessPortfolioHealth(investments, profile.analysis.riskProfile),
        marketOpportunities: this.identifyMarketOpportunities(),
        rebalancingNeeded: this.checkRebalancingNeeds(investments, profile.analysis.riskProfile),
        taxOptimization: this.suggestTaxOptimization(investments),
        performanceAnalysis: performance
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      console.error('Investment insights error:', error);
      return { success: false, error: error.message };
    }
  }

  // Assess portfolio health
  assessPortfolioHealth(investments, riskProfile) {
    if (investments.length === 0) {
      return {
        score: 0,
        status: 'not_started',
        message: 'No investments found. Start your investment journey today!'
      };
    }

    let score = 50;
    const issues = [];
    const strengths = [];

    // Diversification check
    const categories = [...new Set(investments.map(inv => inv.category))];
    if (categories.length >= 3) {
      score += 20;
      strengths.push('Well diversified across asset classes');
    } else {
      score -= 10;
      issues.push('Portfolio needs better diversification');
    }

    // Risk alignment check
    const targetAllocation = this.riskProfiles[riskProfile.profile];
    // Mock allocation check
    score += 10;
    strengths.push('Risk profile alignment is good');

    let status = 'poor';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'average';

    return {
      score,
      status,
      issues,
      strengths,
      message: `Portfolio health score: ${score}/100`
    };
  }

  // Identify market opportunities
  identifyMarketOpportunities() {
    // Mock opportunities - in real implementation, this would use market data APIs
    return [
      {
        type: 'sector_opportunity',
        title: 'Technology Sector Rally',
        description: 'IT and technology stocks showing strong momentum',
        riskLevel: 'moderate',
        timeframe: '6-12 months'
      },
      {
        type: 'market_correction',
        title: 'Market Correction Opportunity',
        description: 'Recent market dip presents buying opportunity for long-term investors',
        riskLevel: 'moderate',
        timeframe: '1-3 years'
      }
    ];
  }

  // Check rebalancing needs
  checkRebalancingNeeds(investments, riskProfile) {
    // Mock rebalancing check
    return {
      needed: false,
      lastRebalance: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      nextRebalance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      recommendations: []
    };
  }

  // Suggest tax optimization
  suggestTaxOptimization(investments) {
    return [
      {
        strategy: 'LTCG Harvesting',
        description: 'Book long-term capital gains up to ₹1 lakh to utilize tax exemption',
        potentialSaving: 'Up to ₹10,000'
      },
      {
        strategy: 'ELSS Investment',
        description: 'Increase ELSS allocation for 80C tax benefits',
        potentialSaving: 'Up to ₹46,800'
      }
    ];
  }
}

module.exports = new InvestmentAdvisorService();
