import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Connection, ConnectionFormData, ProtocolVersion, Protocol, AuthType, LastWill } from '../types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ConnectionFormData) => void;
  editingConnection?: Connection | null;
}

type TabType = 'basic' | 'advanced' | 'lastWill';

const defaultFormData: ConnectionFormData = {
  name: '',
  protocolVersion: '5.1',
  protocol: 'wss',
  host: '',
  port: 8084,
  clientId: '',
  auth: 'none',
  username: '',
  password: '',
  tlsCaCert: '',
  keepalive: 60,
  autoReconnect: true,
  cleanSession: true,
  lastWill: null,
};

export function ConnectionModal({ isOpen, onClose, onSave, editingConnection }: ConnectionModalProps) {
  const [formData, setFormData] = useState<ConnectionFormData>(defaultFormData);
  const [showLastWill, setShowLastWill] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  useEffect(() => {
    if (editingConnection) {
      setFormData({
        name: editingConnection.name,
        protocolVersion: editingConnection.protocolVersion,
        protocol: editingConnection.protocol,
        host: editingConnection.host,
        port: editingConnection.port,
        clientId: editingConnection.clientId,
        auth: editingConnection.auth,
        username: editingConnection.username || '',
        password: editingConnection.password || '',
        tlsCaCert: editingConnection.tlsCaCert || '',
        keepalive: editingConnection.keepalive,
        autoReconnect: editingConnection.autoReconnect,
        cleanSession: editingConnection.cleanSession,
        lastWill: editingConnection.lastWill,
      });
      setShowLastWill(!!editingConnection.lastWill?.topic);
    } else {
      setFormData(defaultFormData);
      setShowLastWill(false);
    }
  }, [editingConnection, isOpen]);

  const handleProtocolChange = (protocol: Protocol) => {
    setFormData((prev) => ({
      ...prev,
      protocol,
      port: protocol === 'wss' ? 8084 : 8083,
    }));
  };

  const handleAuthChange = (auth: AuthType) => {
    setFormData((prev) => ({ ...prev, auth }));
  };

  const handleLastWillToggle = () => {
    setShowLastWill(!showLastWill);
    if (!showLastWill) {
      setFormData((prev) => ({
        ...prev,
        lastWill: {
          topic: '',
          qos: 0,
          retained: false,
          payload: '',
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, lastWill: null }));
    }
  };

  const handleLastWillChange = (field: keyof LastWill, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      lastWill: prev.lastWill
        ? { ...prev.lastWill, [field]: value }
        : null,
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.host) {
      return;
    }
    onSave(formData);
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
    <Modal isOpen={isOpen} onClose={onClose} title={editingConnection ? '编辑连接' : '添加连接'} footer={footer}>
      {/* Tab 导航 */}
      <div className="modal-tabs">
        <button
          className={`modal-tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          基础配置
        </button>
        <button
          className={`modal-tab ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          高级配置
        </button>
        <button
          className={`modal-tab ${activeTab === 'lastWill' ? 'active' : ''}`}
          onClick={() => setActiveTab('lastWill')}
        >
          Last Will
        </button>
      </div>

      {/* Tab 内容 */}
      <div className="modal-tab-content">
        {activeTab === 'basic' && (
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">连接名称 *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="My Broker"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">协议版本</label>
                <select
                  className="form-input"
                  value={formData.protocolVersion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, protocolVersion: e.target.value as ProtocolVersion }))}
                >
                  <option value="3.1.1">MQTT 3.1.1</option>
                  <option value="5.1">MQTT 5.1</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">协议</label>
                <select
                  className="form-input"
                  value={formData.protocol}
                  onChange={(e) => handleProtocolChange(e.target.value as Protocol)}
                >
                  <option value="ws">ws://</option>
                  <option value="wss">wss://</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Broker 地址 *</label>
              <input
                type="text"
                className="form-input"
                value={formData.host}
                onChange={(e) => setFormData((prev) => ({ ...prev, host: e.target.value }))}
                placeholder="broker.emqx.io"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">端口</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.port}
                  onChange={(e) => setFormData((prev) => ({ ...prev, port: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Client ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.clientId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
                  placeholder="留空自动生成"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">认证方式</label>
              <select
                className="form-input"
                value={formData.auth}
                onChange={(e) => handleAuthChange(e.target.value as AuthType)}
              >
                <option value="none">无</option>
                <option value="password">用户名 + 密码</option>
                <option value="tls">TLS 证书</option>
              </select>
            </div>

            {formData.auth === 'password' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">用户名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">密码</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {formData.auth === 'tls' && (
              <div className="form-group">
                <label className="form-label">TLS CA 证书</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setFormData((prev) => ({ ...prev, tlsCaCert: reader.result as string }));
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Keepalive (秒)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.keepalive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, keepalive: parseInt(e.target.value) || 60 }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.autoReconnect}
                  onChange={(e) => setFormData((prev) => ({ ...prev, autoReconnect: e.target.checked }))}
                />
                自动重连
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.cleanSession}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cleanSession: e.target.checked }))}
                />
                Clean Session
              </label>
            </div>
          </div>
        )}

        {activeTab === 'lastWill' && (
          <div className="form-section">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={showLastWill}
                  onChange={handleLastWillToggle}
                />
                启用遗嘱消息
              </label>
            </div>

            {showLastWill && formData.lastWill && (
              <>
                <div className="form-group">
                  <label className="form-label">遗嘱主题</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.lastWill.topic || ''}
                    onChange={(e) => handleLastWillChange('topic', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">QoS</label>
                    <select
                      className="form-input"
                      value={formData.lastWill.qos}
                      onChange={(e) => handleLastWillChange('qos', parseInt(e.target.value) as 0 | 1 | 2)}
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Retained</label>
                    <select
                      className="form-input"
                      value={formData.lastWill.retained ? 'true' : 'false'}
                      onChange={(e) => handleLastWillChange('retained', e.target.value === 'true')}
                    >
                      <option value="false">否</option>
                      <option value="true">是</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">遗嘱载荷</label>
                  <textarea
                    className="form-input"
                    value={formData.lastWill.payload || ''}
                    onChange={(e) => handleLastWillChange('payload', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}