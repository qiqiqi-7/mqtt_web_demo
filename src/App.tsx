import { ConnectionProvider } from './hooks/useConnections';
import { SubscriptionProvider } from './hooks/useSubscriptions';
import { MessageProvider } from './hooks/useMessages';
import { ToastProvider } from './components/Toast';
import { ConnectionManager } from './components/ConnectionManager';
import { SubscriptionManager } from './components/SubscriptionManager';
import { MessageFeed } from './components/MessageFeed';
import { PublishPanel } from './components/PublishPanel';
import { useConnections } from './hooks/useConnections';
import { useMessages } from './hooks/useMessages';
import { useMqttIntegration } from './hooks/useMqttIntegration';

function AppContent() {
  const { getActiveConnection } = useConnections();
  const { getMessageCount } = useMessages();

  // Initialize MQTT integration (sets up message callbacks)
  useMqttIntegration();

  const activeConnection = getActiveConnection();
  const messageCount = getMessageCount();

  const getStatusDisplay = () => {
    if (!activeConnection) {
      return { status: 'disconnected', label: '未连接' };
    }
    switch (activeConnection.status) {
      case 'connected':
        return { status: 'connected', label: '已连接' };
      case 'connecting':
        return { status: 'connecting', label: '连接中...' };
      case 'reconnecting':
        return { status: 'reconnecting', label: '重连中...' };
      case 'error':
        return { status: 'error', label: '错误' };
      default:
        return { status: 'disconnected', label: '未连接' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="logo">MQTT Broker Manage</span>
        </div>
        <div className="header-right">
          <div className="status" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`status-dot ${statusDisplay.status}`} />
            <span>{statusDisplay.label}</span>
          </div>
          {activeConnection && (
            <span style={{ color: 'var(--text-secondary)' }}>
              {activeConnection.name}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <ConnectionManager />
        <SubscriptionManager />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <MessageFeed />
          <PublishPanel />
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>消息数: {messageCount}</span>
        <span>v1.0.0</span>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <ConnectionProvider>
        <SubscriptionProvider>
          <MessageProvider>
            <AppContent />
          </MessageProvider>
        </SubscriptionProvider>
      </ConnectionProvider>
    </ToastProvider>
  );
}

export default App;