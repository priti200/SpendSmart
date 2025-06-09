const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Transaction name is required'],
    trim: true,
    maxlength: [100, 'Transaction name cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    validate: {
      validator: function(value) {
        return value !== 0;
      },
      message: 'Amount cannot be zero'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Travel',
      'Income',
      'Investment',
      'Other'
    ],
    default: 'Other'
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better query performance
transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ type: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return Math.abs(this.amount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR'
  });
});

// Virtual for transaction display color
transactionSchema.virtual('displayColor').get(function() {
  return this.type === 'income' ? 'green' : 'red';
});

// Ensure virtual fields are serialized
transactionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Transaction', transactionSchema);
