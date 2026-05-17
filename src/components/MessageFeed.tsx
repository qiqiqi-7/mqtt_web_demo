import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowDown, faArrowUp, faStar, faCopy, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Virtuoso } from 'react-virtuoso';
import { useConnections } from '../hooks/useConnections';
import { useMessages } from '../hooks/useMessages';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useToast } from './Toast';
import { Message } from '../types';

export function MessageFeed() {
  // 使用两次 hook 获取不同数据
  const { filter, setFilter, clearFilter, getFilteredMessages, deleteMessage, messages: allMessages } = useMessages();
  const { getActiveConnection } = useConnections();
  const { getSubscriptionsByConnection } = useSubscriptions();
  const { showToast } = useToast();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const virtuosoRef = useRef<any>(null);

  const activeConnection = getActiveConnection();
  const messages = getFilteredMessages(activeConnection?.id || null);
  const subscriptions = activeConnection ? getSubscriptionsByConnection(activeConnection.id) : [];
  const uniqueTopics = [...new Set(subscriptions.map((s) => s.topic))];

  // 当消息变化时，滚动到底部
  useEffect(() => {
    if (virtuosoRef.current && messages.length > 0) {
      // 延迟确保渲染完成
      const timer = setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: messages.length - 1,
          behavior: 'smooth',
          align: 'end'
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  // 完整时间格式（用于导出）
  const formatFullTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const isValidJson = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const formatJson = (payload: string) => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  };

  const handleCopyPayload = (e: React.MouseEvent, payload: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(payload).then(() => {
      showToast('success', '已复制到剪贴板');
    }).catch(() => {
      showToast('error', '复制失败');
    });
  };

  // 导出消息为 JSON
  const handleExport = () => {
    if (!activeConnection) {
      showToast('error', '请先选择一个连接');
      return;
    }

    // 获取该连接的所有消息（不过滤）
    const connectionMessages = allMessages.filter(msg => msg.connectionId === activeConnection.id);

    if (connectionMessages.length === 0) {
      showToast('error', '没有可导出的消息');
      return;
    }

    const exportData = {
      exportInfo: {
        connectionName: activeConnection.name,
        connectionUrl: `${activeConnection.protocol}://${activeConnection.host}:${activeConnection.port}`,
        exportTime: formatFullTime(Date.now()),
        messageCount: connectionMessages.length
      },
      messages: connectionMessages.map((msg: Message) => ({
        time: formatFullTime(msg.timestamp),
        direction: msg.direction === 'in' ? 'Receive' : 'Publish',
        topic: msg.topic,
        qos: msg.qos,
        retained: msg.retained,
        payload: msg.payload
      }))
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mqtt_messages_${activeConnection.name}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('success', `已导出 ${connectionMessages.length} 条消息`);
  };

  return (
    <div className="panel" style={{ flex: 1, borderRight: 'none', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div className="message-toolbar">
        <input
          type="text"
          className="message-search"
          placeholder="搜索主题或载荷..."
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value })}
        />

        <select
          value={filter.direction}
          onChange={(e) => setFilter({ direction: e.target.value as 'all' | 'in' | 'out' })}
          style={{ width: '100px' }}
        >
          <option value="all">全部</option>
          <option value="in">入站</option>
          <option value="out">出站</option>
        </select>

        <select
          value={filter.topic || ''}
          onChange={(e) => setFilter({ topic: e.target.value || null })}
          style={{ width: '150px' }}
        >
          <option value="">所有主题</option>
          {uniqueTopics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>

        <button onClick={clearFilter} title="清除筛选">
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <button onClick={handleExport} title="导出消息" className="export-btn">
          <FontAwesomeIcon icon={faDownload} />
          <span>导出</span>
        </button>
      </div>

      {/* Message List with Virtuoso - supports dynamic height */}
      <div className="message-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">
              {activeConnection ? '暂无消息' : '请先连接到一个 Broker'}
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%' }}
            data={messages}
            itemContent={(_, message) => {
              const isExpanded = expandedId === message.id;
              const isIncoming = message.direction === 'in';

              return (
                <div
                  className={`message-row chat-bubble-row ${isIncoming ? 'incoming' : 'outgoing'}`}
                  style={{ padding: '0 var(--space-md) var(--space-sm)' }}
                >
                  <div
                    className={`chat-bubble ${isIncoming ? 'incoming' : 'outgoing'}`}
                    onClick={() => setExpandedId(isExpanded ? null : message.id)}
                  >
                    <div className="chat-bubble-header">
                      <span className={`direction-badge ${message.direction}`}>
                        {isIncoming ? (
                          <><FontAwesomeIcon icon={faArrowDown} /> 收到</>
                        ) : (
                          <><FontAwesomeIcon icon={faArrowUp} /> 发送</>
                        )}
                      </span>
                      <span className="topic">{message.topic}</span>
                      <span className={`qos-badge qos-${message.qos}`}>{message.qos}</span>
                      {message.retained && (
                        <span className="retained-icon" title="Retained 消息">
                          <FontAwesomeIcon icon={faStar} />
                        </span>
                      )}
                      <span className="time">{formatTime(message.timestamp)}</span>
                    </div>
                    <div className="chat-bubble-content">
                      {isExpanded ? (
                        <>
                          <pre className="payload-expanded">{isValidJson(message.payload) ? formatJson(message.payload) : message.payload}</pre>
                          <button
                            className="copy-btn"
                            onClick={(e) => handleCopyPayload(e, message.payload)}
                            title="复制内容"
                          >
                            <FontAwesomeIcon icon={faCopy} />
                          </button>
                        </>
                      ) : (
                        <span className="payload-preview">{message.payload}</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(message.id);
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}