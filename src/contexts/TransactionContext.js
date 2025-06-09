import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Initial state
const initialState = {
  transactions: [],
  summary: {
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    transactionCount: 0
  },
  categoryData: [],
  loading: false,
  error: null,
  filters: {
    category: '',
    type: '',
    startDate: '',
    endDate: '',
    search: ''
  }
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  SET_SUMMARY: 'SET_SUMMARY',
  SET_CATEGORY_DATA: 'SET_CATEGORY_DATA',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
const transactionReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case actionTypes.SET_TRANSACTIONS:
      return { ...state, transactions: action.payload, loading: false };
    
    case actionTypes.SET_SUMMARY:
      return { ...state, summary: action.payload };
    
    case actionTypes.SET_CATEGORY_DATA:
      return { ...state, categoryData: action.payload };
    
    case actionTypes.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        loading: false
      };
    
    case actionTypes.UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t._id === action.payload._id ? action.payload : t
        ),
        loading: false
      };
    
    case actionTypes.DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter(t => t._id !== action.payload),
        loading: false
      };
    
    case actionTypes.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    default:
      return state;
  }
};

// Create context
const TransactionContext = createContext();

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// Provider component
export const TransactionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState);

  // API functions
  const api = {
    // Fetch all transactions
    fetchTransactions: async (filters = {}) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
        
        const response = await axios.get(`${API_URL}/transactions?${queryParams}`);
        dispatch({ type: actionTypes.SET_TRANSACTIONS, payload: response.data.data });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.response?.data?.message || 'Failed to fetch transactions' });
      }
    },

    // Fetch summary
    fetchSummary: async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        
        const response = await axios.get(`${API_URL}/transactions/summary?${queryParams}`);
        dispatch({ type: actionTypes.SET_SUMMARY, payload: response.data.data });
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    },

    // Fetch category data
    fetchCategoryData: async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        
        const response = await axios.get(`${API_URL}/transactions/categories?${queryParams}`);
        dispatch({ type: actionTypes.SET_CATEGORY_DATA, payload: response.data.data });
      } catch (error) {
        console.error('Error fetching category data:', error);
      }
    },

    // Add transaction
    addTransaction: async (transactionData) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const response = await axios.post(`${API_URL}/transactions`, transactionData);
        dispatch({ type: actionTypes.ADD_TRANSACTION, payload: response.data.data });
        
        // Refresh summary and category data
        api.fetchSummary();
        api.fetchCategoryData();
        
        return response.data;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.response?.data?.message || 'Failed to add transaction' });
        throw error;
      }
    },

    // Update transaction
    updateTransaction: async (id, transactionData) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const response = await axios.put(`${API_URL}/transactions/${id}`, transactionData);
        dispatch({ type: actionTypes.UPDATE_TRANSACTION, payload: response.data.data });
        
        // Refresh summary and category data
        api.fetchSummary();
        api.fetchCategoryData();
        
        return response.data;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.response?.data?.message || 'Failed to update transaction' });
        throw error;
      }
    },

    // Delete transaction
    deleteTransaction: async (id) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        await axios.delete(`${API_URL}/transactions/${id}`);
        dispatch({ type: actionTypes.DELETE_TRANSACTION, payload: id });
        
        // Refresh summary and category data
        api.fetchSummary();
        api.fetchCategoryData();
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.response?.data?.message || 'Failed to delete transaction' });
        throw error;
      }
    },

    // Set filters
    setFilters: (filters) => {
      dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
    },

    // Clear error
    clearError: () => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    }
  };

  // Load initial data
  useEffect(() => {
    api.fetchTransactions();
    api.fetchSummary();
    api.fetchCategoryData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch data when filters change
  useEffect(() => {
    const { category, type, startDate, endDate, search } = state.filters;
    const filters = { category, type, startDate, endDate, search };

    api.fetchTransactions(filters);
    api.fetchSummary({ startDate, endDate });
    api.fetchCategoryData({ startDate, endDate });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.filters]);

  return (
    <TransactionContext.Provider value={{ ...state, ...api }}>
      {children}
    </TransactionContext.Provider>
  );
};

// Custom hook to use the context
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export default TransactionContext;
