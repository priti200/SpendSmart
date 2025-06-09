const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Goal title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['savings', 'expense_reduction', 'income_increase', 'debt_payoff', 'investment', 'emergency_fund'],
    default: 'savings'
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0, 'Target amount must be positive']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Target date must be in the future'
    }
  },
  category: {
    type: String,
    enum: [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Travel',
      'Investment',
      'Emergency Fund',
      'Other'
    ],
    default: 'Other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'one_time'],
    default: 'monthly'
  },
  autoContribute: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Auto-contribute amount must be positive']
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'monthly'
    },
    nextContribution: {
      type: Date
    }
  },
  milestones: [{
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true
    },
    achieved: {
      type: Boolean,
      default: false
    },
    achievedDate: {
      type: Date
    },
    reward: {
      type: String,
      maxlength: [200, 'Reward description cannot exceed 200 characters']
    }
  }],
  contributions: [{
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      maxlength: [200, 'Note cannot exceed 200 characters']
    },
    source: {
      type: String,
      enum: ['manual', 'auto', 'transaction_link'],
      default: 'manual'
    }
  }],
  linkedTransactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  aiInsights: {
    lastAnalysis: {
      type: Date
    },
    recommendations: [{
      text: String,
      type: {
        type: String,
        enum: ['increase_contribution', 'adjust_timeline', 'reduce_expenses', 'find_income']
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    projectedCompletion: {
      type: Date
    },
    successProbability: {
      type: Number,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
goalSchema.index({ status: 1 });
goalSchema.index({ type: 1 });
goalSchema.index({ targetDate: 1 });
goalSchema.index({ priority: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min(Math.round((this.currentAmount / this.targetAmount) * 100), 100);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for required daily contribution
goalSchema.virtual('requiredDailyContribution').get(function() {
  const daysRemaining = this.daysRemaining;
  if (daysRemaining <= 0) return 0;
  return this.remainingAmount / daysRemaining;
});

// Virtual for required monthly contribution
goalSchema.virtual('requiredMonthlyContribution').get(function() {
  const daysRemaining = this.daysRemaining;
  if (daysRemaining <= 0) return 0;
  const monthsRemaining = daysRemaining / 30.44; // Average days per month
  return this.remainingAmount / monthsRemaining;
});

// Virtual for status color
goalSchema.virtual('statusColor').get(function() {
  const progress = this.progressPercentage;
  const daysRemaining = this.daysRemaining;
  
  if (this.status === 'completed') return 'green';
  if (this.status === 'cancelled') return 'red';
  if (this.status === 'paused') return 'orange';
  
  if (progress >= 100) return 'green';
  if (progress >= 75) return 'blue';
  if (progress >= 50) return 'yellow';
  if (daysRemaining < 30) return 'orange';
  if (daysRemaining < 7) return 'red';
  
  return 'gray';
});

// Method to add contribution
goalSchema.methods.addContribution = function(amount, note = '', source = 'manual') {
  this.contributions.push({
    amount,
    note,
    source,
    date: new Date()
  });
  
  this.currentAmount += amount;
  
  // Check if goal is completed
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
  }
  
  // Check milestones
  this.checkMilestones();
  
  return this.save();
};

// Method to check and update milestones
goalSchema.methods.checkMilestones = function() {
  const currentProgress = this.progressPercentage;
  
  this.milestones.forEach(milestone => {
    if (!milestone.achieved && currentProgress >= milestone.percentage) {
      milestone.achieved = true;
      milestone.achievedDate = new Date();
    }
  });
};

// Method to calculate projected completion date
goalSchema.methods.calculateProjectedCompletion = function() {
  if (this.currentAmount >= this.targetAmount) {
    return new Date(); // Already completed
  }
  
  // Calculate based on recent contribution trend
  const recentContributions = this.contributions
    .filter(c => c.date >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // Last 90 days
    .sort((a, b) => b.date - a.date);
  
  if (recentContributions.length === 0) {
    return null; // No recent contributions to base projection on
  }
  
  const totalRecentContributions = recentContributions.reduce((sum, c) => sum + c.amount, 0);
  const avgDailyContribution = totalRecentContributions / 90;
  
  if (avgDailyContribution <= 0) {
    return null; // No positive contribution trend
  }
  
  const remainingAmount = this.remainingAmount;
  const daysToCompletion = remainingAmount / avgDailyContribution;
  
  return new Date(Date.now() + daysToCompletion * 24 * 60 * 60 * 1000);
};

// Static method to get goals summary
goalSchema.statics.getSummary = async function() {
  const goals = await this.find({ isArchived: false });
  
  return {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    paused: goals.filter(g => g.status === 'paused').length,
    totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    averageProgress: goals.length > 0 
      ? goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length 
      : 0
  };
};

module.exports = mongoose.model('Goal', goalSchema);
