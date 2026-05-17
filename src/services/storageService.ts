import { Connection, Subscription, PublishPreset } from '../types';

const STORAGE_KEYS = {
  CONNECTIONS: 'mqtt_connections',
  SUBSCRIPTIONS: 'mqtt_subscriptions',
  PUBLISH_PRESETS: 'mqtt_publish_presets',
};

// 简单加密密钥（Demo 级别，实际项目需要更安全的方案）
const ENCRYPTION_KEY = 'mqtt_web_demo_2024';

export const storageService = {
  // 密码加密
  encryptPassword(password: string): string {
    if (!password) return '';
    const encoded = btoa(encodeURIComponent(password));
    const encrypted = btoa(encoded + ENCRYPTION_KEY);
    return encrypted;
  },

  // 密码解密
  decryptPassword(encrypted: string): string {
    if (!encrypted) return '';
    try {
      const decoded = atob(encrypted);
      const original = decoded.replace(ENCRYPTION_KEY, '');
      return decodeURIComponent(atob(original));
    } catch {
      return '';
    }
  },

  // 连接相关
  saveConnections(connections: Connection[]): void {
    try {
      const data = connections.map((conn) => ({
        ...conn,
        password: conn.password ? this.encryptPassword(conn.password) : null,
      }));
      localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save connections:', error);
    }
  },

  loadConnections(): Connection[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
      if (!data) return [];
      const connections = JSON.parse(data) as Connection[];
      return connections.map((conn) => ({
        ...conn,
        password: conn.password ? this.decryptPassword(conn.password) : null,
        status: 'disconnected' as const,
      }));
    } catch (error) {
      console.error('Failed to load connections:', error);
      return [];
    }
  },

  // 订阅相关
  saveSubscriptions(subscriptions: Subscription[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    } catch (error) {
      console.error('Failed to save subscriptions:', error);
    }
  },

  loadSubscriptions(): Subscription[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      if (!data) return [];
      return JSON.parse(data) as Subscription[];
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      return [];
    }
  },

  // 发布预设相关
  savePublishPresets(presets: PublishPreset[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PUBLISH_PRESETS, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save publish presets:', error);
    }
  },

  loadPublishPresets(): PublishPreset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PUBLISH_PRESETS);
      if (!data) return [];
      return JSON.parse(data) as PublishPreset[];
    } catch (error) {
      console.error('Failed to load publish presets:', error);
      return [];
    }
  },
};