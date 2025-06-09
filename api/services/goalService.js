const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');

class GoalService {
  constructor() {
    this.isEnabled = true;
  }

  // Analyze goal progress and provide AI insights
  async analyzeGoalProgress(goalId) {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal) {
        return { success: false, error: 'Goal not found' };
      }

      const analysis = {
        currentProgress: goal.progressPercentage,
        daysRemaining: goal.daysRemaining,
        requiredDailyContribution: goal.requiredDailyContribution,
        requiredMonthlyContribution: goal.requiredMonthlyContribution,
        projectedCompletion: goal.calculateProjectedCompletion(),
        recommendations: await this.generateRecommendations(goal),
        successProbability: this.calculateSuccessProbability(goal),
        milestoneStatus: this.analyzeMilestones(goal)
      };

      // Update AI insights in goal
      goal.aiInsights.lastAnalysis = new Date();
      goal.aiInsights.recommendations = analysis.recommendations;
      goal.aiInsights.projectedCompletion = analysis.projectedCompletion;
      goal.aiInsights.successProbability = analysis.successProbability;
      await goal.save();

      return {
        success: true,
        analysis
      };
    } catch (error) {
      console.error('Goal analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate AI recommendations for goal achievement
  async generateRecommendations(goal) {
    const recommendations = [];
    const progress = goal.progressPercentage;
    const daysRemaining = goal.daysRemaining;
    const requiredDaily = goal.requiredDailyContribution;

    // Progress-based recommendations
    if (progress < 25 && daysRemaining < 90) {
      recommendations.push({
        text: `You're behind schedule. Consider increasing your daily contribution to ₹${Math.ceil(requiredDaily)} to stay on track.`,
        type: 'increase_contribution',
        priority: 'high'
      });
    }

    if (progress >= 75) {
      recommendations.push({
        text: `Great progress! You're ${progress}% complete. Keep up the momentum to reach your goal.`,
        type: 'motivation',
        priority: 'medium'
      });
    }

    // Timeline-based recommendations
    if (daysRemaining < 30 && progress < 80) {
      recommendations.push({
        text: `Only ${daysRemaining} days left! Consider extending your deadline or making a larger contribution.`,
        type: 'adjust_timeline',
        priority: 'high'
      });
    }

    // Contribution pattern analysis
    const recentContributions = goal.contributions
      .filter(c => c.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .length;

    if (recentContributions === 0) {
      recommendations.push({
        text: `No contributions in the last 30 days. Set up automatic contributions to stay consistent.`,
        type: 'increase_contribution',
        priority: 'high'
      });
    }

    // Goal type specific recommendations
    if (goal.type === 'expense_reduction') {
      recommendations.push({
        text: `Track your ${goal.category} expenses daily and look for areas to cut back.`,
        type: 'reduce_expenses',
        priority: 'medium'
      });
    }

    if (goal.type === 'emergency_fund' && progress < 50) {
      recommendations.push({
        text: `Emergency funds are crucial. Consider allocating any windfalls or bonuses directly to this goal.`,
        type: 'increase_contribution',
        priority: 'high'
      });
    }

    return recommendations;
  }

  // Calculate success probability based on current progress and trends
  calculateSuccessProbability(goal) {
    const progress = goal.progressPercentage;
    const daysRemaining = goal.daysRemaining;
    const requiredDaily = goal.requiredDailyContribution;

    // Base probability on current progress
    let probability = Math.min(progress * 0.8, 80);

    // Adjust based on time remaining
    if (daysRemaining > 365) {
      probability += 10; // More time = higher chance
    } else if (daysRemaining < 30) {
      probability -= 20; // Less time = lower chance
    }

    // Adjust based on required contribution feasibility
    if (requiredDaily > 1000) {
      probability -= 30; // Very high daily requirement
    } else if (requiredDaily < 100) {
      probability += 10; // Reasonable daily requirement
    }

    // Adjust based on contribution consistency
    const recentContributions = goal.contributions
      .filter(c => c.date >= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
    
    if (recentContributions.length > 4) {
      probability += 15; // Consistent contributions
    } else if (recentContributions.length === 0) {
      probability -= 25; // No recent contributions
    }

    return Math.max(0, Math.min(100, Math.round(probability)));
  }

  // Analyze milestone progress
  analyzeMilestones(goal) {
    const milestones = goal.milestones.sort((a, b) => a.percentage - b.percentage);
    const currentProgress = goal.progressPercentage;
    
    return {
      total: milestones.length,
      achieved: milestones.filter(m => m.achieved).length,
      next: milestones.find(m => !m.achieved && m.percentage > currentProgress),
      recent: milestones
        .filter(m => m.achieved && m.achievedDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .length
    };
  }

  // Auto-link transactions to goals based on category and patterns
  async autoLinkTransactions(goalId) {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal) {
        return { success: false, error: 'Goal not found' };
      }

      // Find relevant transactions based on goal type and category
      let query = {};
      
      if (goal.type === 'expense_reduction') {
        query = {
          type: 'expense',
          category: goal.category,
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        };
      } else if (goal.type === 'income_increase') {
        query = {
          type: 'income',
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        };
      }

      const transactions = await Transaction.find(query);
      const linkedCount = transactions.length;

      // Add transactions to goal's linked transactions
      goal.linkedTransactions = [
        ...goal.linkedTransactions,
        ...transactions.map(t => t._id).filter(id => !goal.linkedTransactions.includes(id))
      ];

      await goal.save();

      return {
        success: true,
        linkedCount,
        message: `Linked ${linkedCount} transactions to goal`
      };
    } catch (error) {
      console.error('Auto-link transactions error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate goal suggestions based on spending patterns
  async generateGoalSuggestions(transactions) {
    try {
      const suggestions = [];
      
      // Analyze spending patterns
      const categorySpending = {};
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          const category = t.category;
          categorySpending[category] = (categorySpending[category] || 0) + Math.abs(t.amount);
          return sum + Math.abs(t.amount);
        }, 0);

      // Suggest expense reduction goals for high-spending categories
      Object.entries(categorySpending)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([category, amount]) => {
          if (amount > totalExpenses * 0.15) { // More than 15% of total expenses
            suggestions.push({
              type: 'expense_reduction',
              title: `Reduce ${category} Expenses`,
              description: `You spent ₹${amount.toFixed(2)} on ${category} this month. Try reducing it by 20%.`,
              targetAmount: amount * 0.2,
              category: category,
              priority: 'medium',
              estimatedSavings: amount * 0.2
            });
          }
        });

      // Suggest emergency fund if not exists
      const emergencyFundGoals = await Goal.find({ 
        type: 'emergency_fund', 
        status: { $in: ['active', 'completed'] } 
      });
      
      if (emergencyFundGoals.length === 0) {
        const monthlyExpenses = totalExpenses;
        suggestions.push({
          type: 'emergency_fund',
          title: 'Build Emergency Fund',
          description: 'Create a safety net with 6 months of expenses.',
          targetAmount: monthlyExpenses * 6,
          category: 'Emergency Fund',
          priority: 'high',
          estimatedMonths: 12
        });
      }

      // Suggest savings goals based on income
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      if (totalIncome > totalExpenses) {
        const surplus = totalIncome - totalExpenses;
        suggestions.push({
          type: 'savings',
          title: 'Monthly Savings Goal',
          description: `You have a surplus of ₹${surplus.toFixed(2)}. Start a savings goal!`,
          targetAmount: surplus * 12, // Annual savings
          category: 'Investment',
          priority: 'medium',
          estimatedMonths: 12
        });
      }

      return {
        success: true,
        suggestions: suggestions.slice(0, 5) // Limit to top 5 suggestions
      };
    } catch (error) {
      console.error('Goal suggestions error:', error);
      return { success: false, error: error.message };
    }
  }

  // Process automatic contributions
  async processAutoContributions() {
    try {
      const goalsWithAuto = await Goal.find({
        'autoContribute.enabled': true,
        status: 'active',
        'autoContribute.nextContribution': { $lte: new Date() }
      });

      const results = [];

      for (const goal of goalsWithAuto) {
        try {
          await goal.addContribution(
            goal.autoContribute.amount,
            'Automatic contribution',
            'auto'
          );

          // Calculate next contribution date
          const nextDate = new Date();
          switch (goal.autoContribute.frequency) {
            case 'daily':
              nextDate.setDate(nextDate.getDate() + 1);
              break;
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
          }

          goal.autoContribute.nextContribution = nextDate;
          await goal.save();

          results.push({
            goalId: goal._id,
            amount: goal.autoContribute.amount,
            success: true
          });
        } catch (error) {
          results.push({
            goalId: goal._id,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        processed: results.length,
        results
      };
    } catch (error) {
      console.error('Auto contributions error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get goal insights dashboard data
  async getGoalsDashboard() {
    try {
      const goals = await Goal.find({ isArchived: false }).sort({ createdAt: -1 });
      const summary = await Goal.getSummary();

      // Calculate trends
      const completedThisMonth = goals.filter(g => 
        g.status === 'completed' && 
        g.updatedAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      ).length;

      const urgentGoals = goals.filter(g => 
        g.status === 'active' && 
        g.daysRemaining < 30
      );

      const highProgressGoals = goals.filter(g => 
        g.status === 'active' && 
        g.progressPercentage >= 75
      );

      return {
        success: true,
        data: {
          summary,
          completedThisMonth,
          urgentGoals: urgentGoals.length,
          highProgressGoals: highProgressGoals.length,
          recentGoals: goals.slice(0, 5),
          upcomingMilestones: this.getUpcomingMilestones(goals)
        }
      };
    } catch (error) {
      console.error('Goals dashboard error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get upcoming milestones across all goals
  getUpcomingMilestones(goals) {
    const milestones = [];
    
    goals.forEach(goal => {
      goal.milestones.forEach(milestone => {
        if (!milestone.achieved && goal.progressPercentage < milestone.percentage) {
          milestones.push({
            goalId: goal._id,
            goalTitle: goal.title,
            percentage: milestone.percentage,
            amount: milestone.amount,
            reward: milestone.reward,
            remainingAmount: milestone.amount - goal.currentAmount
          });
        }
      });
    });

    return milestones
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5);
  }
}

module.exports = new GoalService();
