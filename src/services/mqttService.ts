import mqtt from 'mqtt';
import { Connection, Subscription, Message, QoS, ConnectionStatus } from '../types';

// MQTT 客户端实例
let client: mqtt.MqttClient | null = null;

// 事件回调
type StatusCallback = (status: ConnectionStatus, error?: string) => void;
type MessageCallback = (message: Message) => void;

let onStatusChange: StatusCallback | null = null;
let onMessageReceived: MessageCallback | null = null;
let currentConnectionId: string | null = null;

// 设置消息回调（可在连接后设置）
export function setMessageCallback(callback: MessageCallback | null): void {
  console.log('[mqttService] setMessageCallback called, hasCallback:', !!callback);
  onMessageReceived = callback;
}

const generateClientId = (): string => {
  return `mqtt_web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const mqttService = {
  // 设置事件回调（仅状态回调，消息回调由 setMessageCallback 单独处理）
  setCallbacks(statusCallback: StatusCallback): void {
    console.log('[mqttService] setCallbacks called, statusCallback:', !!statusCallback);
    onStatusChange = statusCallback;
  },

  // 连接
  async connect(connection: Connection, connectionId: string): Promise<boolean> {
    try {
      // 如果已有连接，先断开
      if (client) {
        await this.disconnect();
      }

      // 保存当前 connectionId
      currentConnectionId = connectionId;

      const protocol = connection.protocol;
      const host = connection.host;
      const port = connection.port;
      const url = `${protocol}://${host}:${port}`;

      const clientId = connection.clientId || generateClientId();

      const options: mqtt.IClientOptions = {
        clientId,
        keepalive: connection.keepalive,
        reconnectPeriod: 0, // 禁用自动重连，切换连接时手动控制
        clean: connection.cleanSession,
        protocolVersion: connection.protocolVersion === '5.1' ? 5 : 4,
      };

      // 认证
      if (connection.auth === 'password' && connection.username) {
        options.username = connection.username;
        options.password = connection.password || undefined;
      }

      // TLS
      if (connection.auth === 'tls' && connection.tlsCaCert) {
        options.ca = connection.tlsCaCert;
      }

      // Last Will
      if (connection.lastWill && connection.lastWill.topic) {
        options.will = {
          topic: connection.lastWill.topic,
          payload: connection.lastWill.payload || '',
          qos: connection.lastWill.qos,
          retain: connection.lastWill.retained,
        };
      }

      return new Promise((resolve) => {
        onStatusChange?.('connecting');

        client = mqtt.connect(url, options);

        client.on('connect', () => {
          console.log('[mqttService] Connected to broker');
          onStatusChange?.('connected');
          resolve(true);
        });

        client.on('error', (error) => {
          console.error('MQTT error:', error);
          onStatusChange?.('error', error.message);
          resolve(false);
        });

        client.on('close', () => {
          onStatusChange?.('disconnected');
        });

        client.on('reconnect', () => {
          onStatusChange?.('reconnecting');
        });

        client.on('message', (_topic, payload) => {
          console.log('[mqttService] Message received:', _topic, payload.toString());
          const message: Message = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            connectionId: currentConnectionId || '',
            direction: 'in',
            topic: _topic,
            qos: 0,
            retained: false,
            payload: payload.toString(),
            timestamp: Date.now(),
          };
          console.log('[mqttService] Calling onMessageReceived, callback exists:', !!onMessageReceived);
          onMessageReceived?.(message);
        });
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      onStatusChange?.('error', (error as Error).message);
      return false;
    }
  },

  // 断开连接
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (client) {
        // 强制断开，不自动重连
        const force = true;
        client.end(force, {}, () => {
          client = null;
          onStatusChange?.('disconnected');
          resolve();
        });
      } else {
        resolve();
      }
    });
  },

  // 订阅主题
  async subscribe(subscription: Subscription): Promise<boolean> {
    return new Promise((resolve) => {
      if (!client) {
        resolve(false);
        return;
      }

      client.subscribe(
        subscription.topic,
        { qos: subscription.qos as 0 | 1 | 2 },
        (error) => {
          if (error) {
            console.error('Subscribe error:', error);
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );
    });
  },

  // 取消订阅
  async unsubscribe(topic: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!client) {
        resolve(false);
        return;
      }

      client.unsubscribe(topic, (error) => {
        if (error) {
          console.error('Unsubscribe error:', error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },

  // 发布消息
  async publish(
    connectionId: string,
    topic: string,
    payload: string,
    qos: QoS,
    retained: boolean
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (!client) {
        resolve(false);
        return;
      }

      client.publish(
        topic,
        payload,
        { qos: qos as 0 | 1 | 2, retain: retained },
        (error) => {
          if (error) {
            console.error('Publish error:', error);
            resolve(false);
          } else {
            // 发布成功，记录到消息流
            console.log('MQTT publish success:', topic, payload);
            const message: Message = {
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              connectionId,
              direction: 'out',
              topic,
              qos,
              retained,
              payload,
              timestamp: Date.now(),
            };
            onMessageReceived?.(message);
            resolve(true);
          }
        }
      );
    });
  },

  // 检查是否已连接
  isConnected(): boolean {
    return client?.connected ?? false;
  },

  // 恢复订阅
  async restoreSubscriptions(subscriptions: Subscription[]): Promise<void> {
    if (!client || !client.connected) return;

    for (const sub of subscriptions) {
      await new Promise<void>((resolve) => {
        client?.subscribe(sub.topic, { qos: sub.qos as 0 | 1 | 2 }, () => {
          resolve();
        });
      });
    }
  },
};