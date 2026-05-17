import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Connection, ConnectionStatus, ConnectionFormData } from '../types';
import { storageService } from '../services/storageService';
import { mqttService } from '../services/mqttService';

// State
interface ConnectionState {
  connections: Connection[];
  activeConnectionId: string | null;
}

// Actions
type ConnectionAction =
  | { type: 'SET_CONNECTIONS'; payload: Connection[] }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'UPDATE_CONNECTION'; payload: Connection }
  | { type: 'DELETE_CONNECTION'; payload: string }
  | { type: 'SET_ACTIVE_CONNECTION'; payload: string | null }
  | { type: 'UPDATE_CONNECTION_STATUS'; payload: { id: string; status: ConnectionStatus; error?: string } };

// Reducer
function connectionReducer(state: ConnectionState, action: ConnectionAction): ConnectionState {
  switch (action.type) {
    case 'SET_CONNECTIONS':
      return { ...state, connections: action.payload };
    case 'ADD_CONNECTION':
      return { ...state, connections: [...state.connections, action.payload] };
    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map((conn) =>
          conn.id === action.payload.id ? action.payload : conn
        ),
      };
    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter((conn) => conn.id !== action.payload),
        activeConnectionId: state.activeConnectionId === action.payload ? null : state.activeConnectionId,
      };
    case 'SET_ACTIVE_CONNECTION':
      return { ...state, activeConnectionId: action.payload };
    case 'UPDATE_CONNECTION_STATUS':
      return {
        ...state,
        connections: state.connections.map((conn) =>
          conn.id === action.payload.id
            ? { ...conn, status: action.payload.status, error: action.payload.error }
            : conn
        ),
      };
    default:
      return state;
  }
}

// Initial state
const initialState: ConnectionState = {
  connections: [],
  activeConnectionId: null,
};

// Context
interface ConnectionContextValue {
  state: ConnectionState;
  addConnection: (data: ConnectionFormData) => Connection;
  updateConnection: (id: string, data: ConnectionFormData) => void;
  deleteConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => void;
  connectToBroker: (id: string) => Promise<boolean>;
  disconnectFromBroker: () => Promise<void>;
  getActiveConnection: () => Connection | null;
  restoreSubscriptions: (connectionId: string) => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

// Provider
export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(connectionReducer, initialState);

  // 加载保存的连接
  useEffect(() => {
    const saved = storageService.loadConnections();
    if (saved.length > 0) {
      dispatch({ type: 'SET_CONNECTIONS', payload: saved });
    }
  }, []);

  // 生成 UUID
  const generateId = () => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // 添加连接
  const addConnection = useCallback((data: ConnectionFormData): Connection => {
    const connection: Connection = {
      id: generateId(),
      name: data.name,
      protocolVersion: data.protocolVersion,
      protocol: data.protocol,
      host: data.host,
      port: data.port,
      clientId: data.clientId || `mqtt_web_${Date.now()}`,
      auth: data.auth,
      username: data.username || null,
      password: data.password || null,
      tlsCaCert: data.tlsCaCert || null,
      keepalive: data.keepalive,
      autoReconnect: data.autoReconnect,
      cleanSession: data.cleanSession,
      lastWill: data.lastWill,
      status: 'disconnected',
    };

    dispatch({ type: 'ADD_CONNECTION', payload: connection });

    // 保存到 localStorage
    const updatedConnections = [...state.connections, connection];
    storageService.saveConnections(updatedConnections);

    return connection;
  }, [state.connections]);

  // 更新连接
  const updateConnection = useCallback((id: string, data: ConnectionFormData) => {
    const existing = state.connections.find((c) => c.id === id);
    if (!existing) return;

    const updated: Connection = {
      ...existing,
      name: data.name,
      protocolVersion: data.protocolVersion,
      protocol: data.protocol,
      host: data.host,
      port: data.port,
      clientId: data.clientId || existing.clientId,
      auth: data.auth,
      username: data.username || null,
      password: data.password || null,
      tlsCaCert: data.tlsCaCert || null,
      keepalive: data.keepalive,
      autoReconnect: data.autoReconnect,
      cleanSession: data.cleanSession,
      lastWill: data.lastWill,
    };

    dispatch({ type: 'UPDATE_CONNECTION', payload: updated });

    // 保存到 localStorage
    const updatedConnections = state.connections.map((c) => (c.id === id ? updated : c));
    storageService.saveConnections(updatedConnections);
  }, [state.connections]);

  // 删除连接
  const deleteConnection = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONNECTION', payload: id });

    // 从 localStorage 移除
    const updatedConnections = state.connections.filter((c) => c.id !== id);
    storageService.saveConnections(updatedConnections);
  }, [state.connections]);

  // 设置当前活动的连接
  const setActiveConnection = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: id });
  }, []);

  // 连接到 Broker
  const connectToBroker = useCallback(async (id: string): Promise<boolean> => {
    const connection = state.connections.find((c) => c.id === id);
    if (!connection) return false;

    // 如果已有连接，先断开
    if (state.activeConnectionId && state.activeConnectionId !== id) {
      await mqttService.disconnect();
      dispatch({
        type: 'UPDATE_CONNECTION_STATUS',
        payload: { id: state.activeConnectionId, status: 'disconnected' },
      });
    }

    dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: id });

    // 设置状态回调
    mqttService.setCallbacks((status, error) => {
      dispatch({
        type: 'UPDATE_CONNECTION_STATUS',
        payload: { id, status, error },
      });
    });

    const success = await mqttService.connect(connection, id);
    if (!success) {
      dispatch({
        type: 'UPDATE_CONNECTION_STATUS',
        payload: { id, status: 'error', error: 'Connection failed' },
      });
    }
    return success;
  }, [state.connections, state.activeConnectionId]);

  // 断开连接
  const disconnectFromBroker = useCallback(async () => {
    if (state.activeConnectionId) {
      await mqttService.disconnect();
      dispatch({
        type: 'UPDATE_CONNECTION_STATUS',
        payload: { id: state.activeConnectionId, status: 'disconnected' },
      });
      dispatch({ type: 'SET_ACTIVE_CONNECTION', payload: null });
    }
  }, [state.activeConnectionId]);

  // 获取当前活动的连接
  const getActiveConnection = useCallback((): Connection | null => {
    if (!state.activeConnectionId) return null;
    return state.connections.find((c) => c.id === state.activeConnectionId) || null;
  }, [state.connections, state.activeConnectionId]);

  // 恢复订阅
  const restoreSubscriptions = useCallback(async (_connectionId: string) => {
    // This will be called after connection is established
    // The actual subscription restoration is handled in SubscriptionManager
  }, []);

  const value: ConnectionContextValue = {
    state,
    addConnection,
    updateConnection,
    deleteConnection,
    setActiveConnection,
    connectToBroker,
    disconnectFromBroker,
    getActiveConnection,
    restoreSubscriptions,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

// Hook
export function useConnections() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnections must be used within ConnectionProvider');
  }
  return context;
}