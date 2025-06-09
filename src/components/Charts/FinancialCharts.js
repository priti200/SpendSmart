import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { useTransactions } from '../../contexts/TransactionContext';
import { formatCurrency } from '../../utils/helpers';
import './FinancialCharts.css';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

const FinancialCharts = () => {
  const { transactions, categoryData } = useTransactions();

  // Prepare data for charts
  const prepareMonthlyData = () => {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(transaction.amount);
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const prepareCategoryPieData = () => {
    return categoryData
      .filter(cat => cat._id !== 'Income')
      .map((cat, index) => ({
        name: cat._id,
        value: cat.totalAmount,
        color: COLORS[index % COLORS.length]
      }));
  };

  const prepareWeeklyTrend = () => {
    const weeklyData = {};
    const now = new Date();
    
    // Get last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekKey = `Week ${8 - i}`;
      weeklyData[weekKey] = { week: weekKey, amount: 0 };
    }
    
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const daysDiff = Math.floor((now - transactionDate) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysDiff / 7);
      
      if (weekIndex < 8) {
        const weekKey = `Week ${8 - weekIndex}`;
        if (weeklyData[weekKey]) {
          weeklyData[weekKey].amount += Math.abs(transaction.amount);
        }
      }
    });
    
    return Object.values(weeklyData);
  };

  const monthlyData = prepareMonthlyData();
  const categoryPieData = prepareCategoryPieData();
  const weeklyTrendData = prepareWeeklyTrend();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p style={{ color: payload[0].payload.color }}>
            Amount: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="financial-charts">
      {/* Monthly Income vs Expenses */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>Monthly Income vs Expenses</h3>
          <p>Track your financial flow over time</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Spending Pie Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>Spending by Category</h3>
          <p>Where your money goes</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryPieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryPieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Spending Trend */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>Weekly Spending Trend</h3>
          <p>Your spending pattern over the last 8 weeks</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="week" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#6366f1" 
              strokeWidth={3}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
              name="Spending"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialCharts;
