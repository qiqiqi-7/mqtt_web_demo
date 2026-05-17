import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Message, MessageFilter } from '../types';

// State
interface MessageState {
  messages: Message[];
  filter: MessageFilter;
}

// Actions
type MessageAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'CLEAR_MESSAGES'; payload?: string } // 可选参数：connectionId
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'SET_FILTER'; payload: Partial<MessageFilter> }
  | { type: 'CLEAR_FILTER' };

// Reducer
function messageReducer(state: MessageState, action: MessageAction): MessageState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'CLEAR_MESSAGES':
      // 如果指定了 connectionId，只清除该连接的消息；否则清除所有
      if (action.payload) {
        return {
          ...state,
          messages: state.messages.filter((msg) => msg.connectionId !== action.payload),
        };
      }
      return { ...state, messages: [] };
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter((msg) => msg.id !== action.payload),
      };
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };
    case 'CLEAR_FILTER':
      return { ...state, filter: { search: '', direction: 'all', topic: null } };
    default:
      return state;
  }
}

// Initial state
const initialState: MessageState = {
  messages: [],
  filter: {
    search: '',
    direction: 'all',
    topic: null,
  },
};

// Context
interface MessageContextValue {
  messages: Message[];
  filter: MessageFilter;
  addMessage: (message: Message) => void;
  clearMessages: (connectionId?: string) => void;
  deleteMessage: (id: string) => void;
  setFilter: (filter: Partial<MessageFilter>) => void;
  clearFilter: () => void;
  getFilteredMessages: (connectionId: string | null) => Message[];
  getMessageCount: (connectionId?: string) => number;
}

const MessageContext = createContext<MessageContextValue | null>(null);

// Provider
export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(messageReducer, initialState);

  // 添加消息
  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  // 清除消息
  const clearMessages = useCallback((connectionId?: string) => {
    dispatch({ type: 'CLEAR_MESSAGES', payload: connectionId });
  }, []);

  // 删除消息
  const deleteMessage = useCallback((id: string) => {
    dispatch({ type: 'DELETE_MESSAGE', payload: id });
  }, []);

  // 设置筛选器
  const setFilter = useCallback((filter: Partial<MessageFilter>) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  // 清除筛选器
  const clearFilter = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTER' });
  }, []);

  // 获取筛选后的消息
  const getFilteredMessages = useCallback((connectionId: string | null): Message[] => {
    let filtered = state.messages;

    // 按连接过滤
    if (connectionId) {
      filtered = filtered.filter((msg) => msg.connectionId === connectionId);
    }

    // 方向筛选
    if (state.filter.direction !== 'all') {
      filtered = filtered.filter((msg) => msg.direction === state.filter.direction);
    }

    // 主题筛选
    if (state.filter.topic) {
      filtered = filtered.filter((msg) => msg.topic === state.filter.topic);
    }

    // 搜索筛选
    if (state.filter.search) {
      const searchLower = state.filter.search.toLowerCase();
      filtered = filtered.filter(
        (msg) =>
          msg.topic.toLowerCase().includes(searchLower) ||
          msg.payload.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [state.messages, state.filter]);

  // 获取消息数量
  const getMessageCount = useCallback((connectionId?: string): number => {
    if (connectionId) {
      return state.messages.filter((msg) => msg.connectionId === connectionId).length;
    }
    return state.messages.length;
  }, [state.messages]);

  const value: MessageContextValue = {
    messages: state.messages,
    filter: state.filter,
    addMessage,
    clearMessages,
    deleteMessage,
    setFilter,
    clearFilter,
    getFilteredMessages,
    getMessageCount,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}

// Hook
export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within MessageProvider');
  }
  return context;
}