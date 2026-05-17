import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faMagic } from '@fortawesome/free-solid-svg-icons';
import { useConnections } from '../hooks/useConnections';
import { mqttService } from '../services/mqttService';
import { useToast } from './Toast';
import { QoS } from '../types';

export function PublishPanel() {
  const { getActiveConnection } = useConnections();
  const { showToast } = useToast();

  const [topic, setTopic] = useState('');
  const [payload, setPayload] = useState('');
  const [qos, setQos] = useState<QoS>(0);
  const [retained, setRetained] = useState(false);
  const [isJsonMode, setIsJsonMode] = useState(false);

  const activeConnection = getActiveConnection();

  const isValidJson = (str: string) => {
    if (!str.trim()) return false;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleBeautify = () => {
    if (isValidJson(payload)) {
      try {
        const formatted = JSON.stringify(JSON.parse(payload), null, 2);
        setPayload(formatted);
      } catch {
        // ignore
      }
    }
  };

  const handlePayloadChange = (value: string) => {
    setPayload(value);
    setIsJsonMode(isValidJson(value));
  };

  const handlePublish = async () => {
    if (!activeConnection) {
      showToast('error', '请先连接到一个 Broker');
      return;
    }

    if (!topic.trim()) {
      showToast('error', '主题不能为空');
      return;
    }

    if (topic.includes('#') || topic.includes('+')) {
      showToast('error', '发布主题不能包含通配符');
      return;
    }

    if (!payload.trim()) {
      showToast('error', '载荷不能为空');
      return;
    }

    const success = await mqttService.publish(activeConnection.id, topic.trim(), payload, qos, retained);
    if (success) {
      showToast('success', '消息已发送');
    } else {
      showToast('error', '发送失败');
    }
  };

  const isConnected = activeConnection?.status === 'connected';

  return (
    <div className="publish-panel">
      {/* 配置行：Topic + QoS + Retained */}
      <div className="publish-config-row">
        <label className="publish-label">Topic:</label>
        <input
          type="text"
          className="publish-topic-input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={!isConnected}
          placeholder="输入主题"
        />
        <label className="publish-label">QoS:</label>
        <select
          className="publish-qos-select"
          value={qos}
          onChange={(e) => setQos(parseInt(e.target.value) as QoS)}
          disabled={!isConnected}
        >
          <option value={0}>0</option>
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>
        <label className="publish-retained-label">
          <input
            type="checkbox"
            checked={retained}
            onChange={(e) => setRetained(e.target.checked)}
            disabled={!isConnected}
          />
          Retained
        </label>
        {isJsonMode && (
          <button
            onClick={handleBeautify}
            title="格式化 JSON"
            className="publish-beautify-btn"
          >
            <FontAwesomeIcon icon={faMagic} />
          </button>
        )}
      </div>

      {/* 载荷行 */}
      <div className="publish-payload-row">
        <label className="publish-label">Payload:</label>
        <textarea
          className="publish-payload-textarea"
          value={payload}
          onChange={(e) => handlePayloadChange(e.target.value)}
          disabled={!isConnected}
          placeholder={isConnected ? '输入消息内容' : '请先连接到一个 Broker'}
          rows={3}
        />
      </div>

      {/* 发送按钮行 */}
      <div className="publish-action-row">
        <button
          className="primary publish-send-btn"
          onClick={handlePublish}
          disabled={!isConnected || !topic.trim() || !payload.trim()}
        >
          <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '4px' }} />
          发送
        </button>
      </div>
    </div>
  );
}