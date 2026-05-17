// 连接状态类型
export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'reconnecting'
  | 'error';

// 协议版本
export type ProtocolVersion = '3.1.1' | '5.1';

// 协议类型
export type Protocol = 'ws' | 'wss';

// 认证方式
export type AuthType = 'none' | 'password' | 'tls';

// QoS 等级
export type QoS = 0 | 1 | 2;

// 消息方向
export type MessageDirection = 'in' | 'out';

// Last Will 配置
export interface LastWill {
  topic: string | null;
  qos: QoS;
  retained: boolean;
  payload: string | null;
}

// 连接配置
export interface Connection {
  id: string;
  name: string;
  protocolVersion: ProtocolVersion;
  protocol: Protocol;
  host: string;
  port: number;
  clientId: string;
  auth: AuthType;
  username: string | null;
  password: string | null; // 加密存储
  tlsCaCert: string | null; // Base64 编码
  keepalive: number; // 秒
  autoReconnect: boolean;
  cleanSession: boolean;
  lastWill: LastWill | null;
  status: ConnectionStatus;
  error?: string;
}

// 订阅
export interface Subscription {
  id: string;
  connectionId: string;
  topic: string;
  qos: QoS;
}

// 消息
export interface Message {
  id: string;
  connectionId: string;
  direction: MessageDirection;
  topic: string;
  qos: QoS;
  retained: boolean;
  payload: string;
  timestamp: number; // Unix 时间戳 ms
}

// 发布预设
export interface PublishPreset {
  id: string;
  connectionId: string;
  name: string;
  topic: string;
  payload: string;
  qos: QoS;
  retained: boolean;
}

// Toast 类型
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// 连接表单数据（用于添加/编辑弹窗）
export interface ConnectionFormData {
  name: string;
  protocolVersion: ProtocolVersion;
  protocol: Protocol;
  host: string;
  port: number;
  clientId: string;
  auth: AuthType;
  username: string;
  password: string;
  tlsCaCert: string;
  keepalive: number;
  autoReconnect: boolean;
  cleanSession: boolean;
  lastWill: LastWill | null;
}

// 订阅表单数据
export interface SubscriptionFormData {
  topic: string;
  qos: QoS;
}

// 消息筛选
export interface MessageFilter {
  search: string;
  direction: 'all' | 'in' | 'out';
  topic: string | null;
}