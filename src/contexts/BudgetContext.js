import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/helpers';

// Initial state
const initialState = {
  budgets: [],
  loading: false,
  error: null
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BUDGETS: 'SET_BUDGETS',
  ADD_BUDGET: 'ADD_BUDGET',
  UPDATE_BUDGET: 'UPDATE_BUDGET',
  DELETE_BUDGET: 'DELETE_BUDGET',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
const budgetReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case actionTypes.SET_BUDGETS:
      return { ...state, budgets: action.payload, loading: false };
    
    case actionTypes.ADD_BUDGET:
      return {
        ...state,
        budgets: [...state.budgets, action.payload],
        loading: false
      };
    
    case actionTypes.UPDATE_BUDGET:
      return {
        ...state,
        budgets: state.budgets.map(b =>
          b.id === action.payload.id ? action.payload : b
        ),
        loading: false
      };
    
    case actionTypes.DELETE_BUDGET:
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload),
        loading: false
      };
    
    default:
      return state;
  }
};

// Create context
const BudgetContext = createContext();

// Provider component
export const BudgetProvider = ({ children }) => {
  const [state, dispatch] = useReducer(budgetReducer, initialState);

  // Load budgets from localStorage
  const loadBudgets = () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const savedBudgets = storage.get('budgets', []);
      dispatch({ type: actionTypes.SET_BUDGETS, payload: savedBudgets });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: 'Failed to load budgets' });
    }
  };

  // Save budgets to localStorage
  const saveBudgets = (budgets) => {
    storage.set('budgets', budgets);
  };

  // API functions
  const api = {
    // Add budget
    addBudget: (budgetData) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        
        const newBudget = {
          id: Date.now().toString(),
          ...budgetData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const updatedBudgets = [...state.budgets, newBudget];
        saveBudgets(updatedBudgets);
        dispatch({ type: actionTypes.ADD_BUDGET, payload: newBudget });
        
        return newBudget;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: 'Failed to add budget' });
        throw error;
      }
    },

    // Update budget
    updateBudget: (id, budgetData) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        
        const updatedBudget = {
          ...budgetData,
          id,
          updatedAt: new Date().toISOString()
        };
        
        const updatedBudgets = state.budgets.map(b =>
          b.id === id ? updatedBudget : b
        );
        
        saveBudgets(updatedBudgets);
        dispatch({ type: actionTypes.UPDATE_BUDGET, payload: updatedBudget });
        
        return updatedBudget;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: 'Failed to update budget' });
        throw error;
      }
    },

    // Delete budget
    deleteBudget: (id) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        
        const updatedBudgets = state.budgets.filter(b => b.id !== id);
        saveBudgets(updatedBudgets);
        dispatch({ type: actionTypes.DELETE_BUDGET, payload: id });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: 'Failed to delete budget' });
        throw error;
      }
    },

    // Clear error
    clearError: () => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    }
  };

  // Load initial data
  useEffect(() => {
    loadBudgets();
  }, []);

  return (
    <BudgetContext.Provider value={{ ...state, ...api }}>
      {children}
    </BudgetContext.Provider>
  );
};

// Custom hook to use the context
export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
};

export default BudgetContext;
