import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faInbox, faCheck, faBan, faCopy } from '@fortawesome/free-solid-svg-icons';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useConnections } from '../hooks/useConnections';
import { useMessages } from '../hooks/useMessages';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionFormData, QoS } from '../types';
import { mqttService } from '../services/mqttService';
import { useToast } from './Toast';

interface SubscriptionItemData {
  id: string;
  topic: string;
  qos: number;
  subscribed: boolean;
}

export function SubscriptionManager() {
  const { getActiveConnection } = useConnections();
  const { addSubscription, deleteSubscription, getSubscriptionsByConnection } = useSubscriptions();
  const { setFilter, filter } = useMessages();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subscribedTopics, setSubscribedTopics] = useState<Set<string>>(new Set());

  const activeConnection = getActiveConnection();
  const connectionSubscriptions = activeConnection
    ? getSubscriptionsByConnection(activeConnection.id)
    : [];

  // 初始化已订阅的主题
  useState(() => {
    const topics = new Set(connectionSubscriptions.map((s) => s.topic));
    setSubscribedTopics(topics);
  });

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleSave = (data: SubscriptionFormData) => {
    if (activeConnection) {
      const subscription = addSubscription(activeConnection.id, data);
      setSubscribedTopics((prev) => new Set(prev).add(subscription.topic));
      // 实际订阅
      mqttService.subscribe(subscription);
    }
  };

  const handleToggle = (topic: string, qos: number) => {
    if (subscribedTopics.has(topic)) {
      // 取消订阅
      mqttService.unsubscribe(topic);
      setSubscribedTopics((prev) => {
        const next = new Set(prev);
        next.delete(topic);
        return next;
      });
    } else {
      // 重新订阅
      mqttService.subscribe({ id: '', topic, qos: qos as QoS, connectionId: activeConnection?.id || '' });
      setSubscribedTopics((prev) => new Set(prev).add(topic));
    }
  };

  const handleTopicClick = (topic: string) => {
    // 如果已经选中了该topic，则取消选择（清除topic过滤）
    if (filter.topic === topic) {
      setFilter({ topic: null, direction: 'in', search: '' });
    } else {
      // 设置过滤器：只显示该主题的接收消息
      setFilter({ topic, direction: 'in' });
    }
  };

  const handleCopyTopic = (e: React.MouseEvent, topic: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(topic).then(() => {
      showToast('success', `已复制: ${topic}`);
    }).catch(() => {
      showToast('error', '复制失败');
    });
  };

  const handleDelete = (id: string, topic: string) => {
    deleteSubscription(id);
    setSubscribedTopics((prev) => {
      const next = new Set(prev);
      next.delete(topic);
      return next;
    });
    // 实际取消订阅
    mqttService.unsubscribe(topic);
  };

  const existingTopics = connectionSubscriptions.map((s) => s.topic);

  const subscriptionItems: SubscriptionItemData[] = connectionSubscriptions.map((sub) => ({
    id: sub.id,
    topic: sub.topic,
    qos: sub.qos,
    subscribed: subscribedTopics.has(sub.topic),
  }));

  return (
    <div className="panel subscription-panel" style={{ width: '250px' }}>
      <div className="panel-header">
        <span className="panel-title">
          {activeConnection ? `订阅 (${activeConnection.name})` : '订阅管理'}
        </span>
        {activeConnection && (
          <button onClick={handleAddClick} title="添加订阅">
            <FontAwesomeIcon icon={faPlus} />
          </button>
        )}
      </div>

      <div className="panel-content">
        {!activeConnection ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FontAwesomeIcon icon={faInbox} />
            </div>
            <div className="empty-state-text">请先选择一个连接</div>
          </div>
        ) : connectionSubscriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FontAwesomeIcon icon={faInbox} />
            </div>
            <div className="empty-state-text">暂无订阅<br />点击 + 添加订阅</div>
          </div>
        ) : (
          <div className="subscription-list">
            {subscriptionItems.map((sub) => (
              <div
                key={sub.id}
                className={`subscription-item clickable ${filter.topic === sub.topic ? 'selected' : ''}`}
                onClick={() => handleTopicClick(sub.topic)}
                title="点击筛选该主题的接收消息"
              >
                <div className="topic">
                  <span className="topic-name">{sub.topic}</span>
                  <span className={`qos-badge qos-${sub.qos}`}>{sub.qos}</span>
                </div>
                <div className="subscription-actions">
                  <button
                    className="copy-btn"
                    onClick={(e) => handleCopyTopic(e, sub.topic)}
                    title="复制 Topic"
                  >
                    <FontAwesomeIcon icon={faCopy} />
                  </button>
                  <button
                    className={`toggle-btn ${sub.subscribed ? 'active' : 'inactive'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(sub.topic, sub.qos);
                    }}
                    title={sub.subscribed ? '取消订阅' : '重新订阅'}
                  >
                    <FontAwesomeIcon icon={sub.subscribed ? faCheck : faBan} />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(sub.id, sub.topic);
                    }}
                    title="删除订阅"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        existingTopics={existingTopics}
      />
    </div>
  );
}