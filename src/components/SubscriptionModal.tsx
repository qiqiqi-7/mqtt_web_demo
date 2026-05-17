import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { SubscriptionFormData } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubscriptionFormData) => void;
  existingTopics?: string[];
}

const defaultFormData: SubscriptionFormData = {
  topic: '',
  qos: 0,
};

export function SubscriptionModal({ isOpen, onClose, onSave, existingTopics = [] }: SubscriptionModalProps) {
  const [formData, setFormData] = useState<SubscriptionFormData>(defaultFormData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultFormData);
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    const topic = formData.topic.trim();

    if (!topic) {
      setError('主题不能为空');
      return;
    }

    // Check for invalid characters (wildcards are allowed)
    if (topic.includes('#') && topic !== '#' && !topic.endsWith('#') && !topic.includes('/#')) {
      setError('# 通配符只能在主题末尾使用');
      return;
    }

    if (topic.includes('+') && (topic.includes('#') || topic.split('+').length > 2)) {
      setError('+ 通配符使用不正确');
      return;
    }

    // Check for duplicate
    if (existingTopics.includes(topic)) {
      setError('该主题已被订阅');
      return;
    }

    onSave({ ...formData, topic });
    onClose();
  };

  const footer = (
    <>
      <button onClick={onClose}>取消</button>
      <button className="primary" onClick={handleSave}>
        保存
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="添加订阅"
      footer={footer}
    >
      <div className="form-group">
        <label className="form-label">主题 *</label>
        <input
          type="text"
          className="form-input"
          value={formData.topic}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, topic: e.target.value }));
            setError('');
          }}
          placeholder="devices/+/temperature 或 sensor/#"
        />
        {error && <div className="form-error">{error}</div>}
        <div className="form-label" style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
          支持通配符：# (多级) 和 + (单级)
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">QoS</label>
        <select
          className="form-input"
          value={formData.qos}
          onChange={(e) => setFormData((prev) => ({ ...prev, qos: parseInt(e.target.value) as 0 | 1 | 2 }))}
        >
          <option value={0}>QoS 0 - 最多一次</option>
          <option value={1}>QoS 1 - 至少一次</option>
          <option value={2}>QoS 2 - 恰好一次</option>
        </select>
      </div>
    </Modal>
  );
}