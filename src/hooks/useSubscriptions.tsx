import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Subscription, SubscriptionFormData } from '../types';
import { storageService } from '../services/storageService';

// State
interface SubscriptionState {
  subscriptions: Subscription[];
}

// Actions
type SubscriptionAction =
  | { type: 'SET_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'ADD_SUBSCRIPTION'; payload: Subscription }
  | { type: 'DELETE_SUBSCRIPTION'; payload: string };

// Reducer
function subscriptionReducer(state: SubscriptionState, action: SubscriptionAction): SubscriptionState {
  switch (action.type) {
    case 'SET_SUBSCRIPTIONS':
      return { ...state, subscriptions: action.payload };
    case 'ADD_SUBSCRIPTION':
      return { ...state, subscriptions: [...state.subscriptions, action.payload] };
    case 'DELETE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.filter((sub) => sub.id !== action.payload),
      };
    default:
      return state;
  }
}

// Initial state
const initialState: SubscriptionState = {
  subscriptions: [],
};

// Context
interface SubscriptionContextValue {
  subscriptions: Subscription[];
  addSubscription: (connectionId: string, data: SubscriptionFormData) => Subscription;
  deleteSubscription: (id: string) => void;
  getSubscriptionsByConnection: (connectionId: string) => Subscription[];
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// Provider
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);

  // 加载保存的订阅
  useEffect(() => {
    const saved = storageService.loadSubscriptions();
    if (saved.length > 0) {
      dispatch({ type: 'SET_SUBSCRIPTIONS', payload: saved });
    }
  }, []);

  // 保存到 localStorage
  const saveSubscriptions = useCallback((subs: Subscription[]) => {
    storageService.saveSubscriptions(subs);
  }, []);

  // 生成 UUID
  const generateId = () => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // 添加订阅
  const addSubscription = useCallback((connectionId: string, data: SubscriptionFormData): Subscription => {
    const subscription: Subscription = {
      id: generateId(),
      connectionId,
      topic: data.topic,
      qos: data.qos,
    };

    dispatch({ type: 'ADD_SUBSCRIPTION', payload: subscription });

    // 保存到 localStorage
    const updatedSubscriptions = [...state.subscriptions, subscription];
    saveSubscriptions(updatedSubscriptions);

    return subscription;
  }, [state.subscriptions, saveSubscriptions]);

  // 删除订阅
  const deleteSubscription = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SUBSCRIPTION', payload: id });

    // 从 localStorage 移除
    const updatedSubscriptions = state.subscriptions.filter((sub) => sub.id !== id);
    saveSubscriptions(updatedSubscriptions);
  }, [state.subscriptions, saveSubscriptions]);

  // 获取指定连接的订阅
  const getSubscriptionsByConnection = useCallback((connectionId: string): Subscription[] => {
    return state.subscriptions.filter((sub) => sub.connectionId === connectionId);
  }, [state.subscriptions]);

  const value: SubscriptionContextValue = {
    subscriptions: state.subscriptions,
    addSubscription,
    deleteSubscription,
    getSubscriptionsByConnection,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Hook
export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within SubscriptionProvider');
  }
  return context;
}