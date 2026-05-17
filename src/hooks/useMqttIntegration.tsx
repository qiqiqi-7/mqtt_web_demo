import { useEffect, useRef } from 'react';
import { mqttService, setMessageCallback } from '../services/mqttService';
import { useConnections } from './useConnections';
import { useMessages } from './useMessages';
import { useSubscriptions } from './useSubscriptions';

export function useMqttIntegration() {
  const { state: connectionState, getActiveConnection } = useConnections();
  const { addMessage } = useMessages();
  const { getSubscriptionsByConnection } = useSubscriptions();
  const isInitializedRef = useRef(false);

  // Set up MQTT message callback once
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // 直接设置消息回调，不影响状态回调
    setMessageCallback((message) => {
      console.log('[useMqttIntegration] Message callback triggered:', message.topic);
      addMessage(message);
    });
  }, [addMessage]);

  // Restore subscriptions when connection becomes active
  useEffect(() => {
    const activeConnection = getActiveConnection();
    if (activeConnection && activeConnection.status === 'connected') {
      const subs = getSubscriptionsByConnection(activeConnection.id);
      mqttService.restoreSubscriptions(subs);
    }
  }, [connectionState.activeConnectionId, getActiveConnection, getSubscriptionsByConnection]);
}