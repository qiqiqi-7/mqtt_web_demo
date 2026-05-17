import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEthernet, faPlug, faPlugCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { Connection } from '../types';
import { useConnections } from '../hooks/useConnections';
import { ConnectionModal } from './ConnectionModal';
import { ConnectionFormData } from '../types';

export function ConnectionManager() {
  const { state, addConnection, updateConnection, deleteConnection, connectToBroker, disconnectFromBroker } = useConnections();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; connection: Connection } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleAddClick = () => {
    setEditingConnection(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (connection: Connection) => {
    setEditingConnection(connection);
    setIsModalOpen(true);
    setContextMenu(null);
  };

  const handleDeleteClick = () => {
    if (contextMenu) {
      const confirmed = window.confirm(`确定删除连接 "${contextMenu.connection.name}"？`);
      if (confirmed) {
        // If this connection is active and connected, disconnect first
        if (state.activeConnectionId === contextMenu.connection.id && contextMenu.connection.status === 'connected') {
          disconnectFromBroker();
        }
        deleteConnection(contextMenu.connection.id);
      }
      setContextMenu(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, connection: Connection) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, connection });
  };

  const handleConnect = async (connection: Connection) => {
    if (connection.status !== 'connected') {
      await connectToBroker(connection.id);
    }
  };

  const handleDisconnect = async (connection: Connection) => {
    if (connection.status === 'connected') {
      await disconnectFromBroker();
    }
  };

  const handleSave = (data: ConnectionFormData) => {
    if (editingConnection) {
      updateConnection(editingConnection.id, data);
    } else {
      addConnection(data);
    }
  };

  const getStatusLabel = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return '已连接';
      case 'disconnected':
        return '未连接';
      case 'connecting':
        return '连接中...';
      case 'reconnecting':
        return '重连中...';
      case 'error':
        return '错误';
    }
  };

  return (
    <div className="panel connection-panel" style={{ width: '250px' }}>
      <div className="panel-header">
        <span className="panel-title">连接管理</span>
        <button onClick={handleAddClick} title="添加连接">
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      <div className="panel-content">
        {state.connections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FontAwesomeIcon icon={faEthernet} />
            </div>
            <div className="empty-state-text">暂无连接<br />点击 + 添加一个连接</div>
          </div>
        ) : (
          <div className="connection-list">
            {state.connections.map((connection) => (
              <div
                key={connection.id}
                className={`connection-card ${state.activeConnectionId === connection.id ? 'active' : ''}`}
                onClick={() => handleContextMenu({ preventDefault: () => {} } as React.MouseEvent, connection)}
                onContextMenu={(e) => handleContextMenu(e, connection)}
              >
                <div className="info">
                  <div className="name">{connection.name}</div>
                  <div className="url">
                    {connection.protocol}://{connection.host}:{connection.port}
                  </div>
                </div>
                <div className="status">
                  <span className={`status-dot ${connection.status}`} />
                  <span>{getStatusLabel(connection.status)}</span>
                </div>
                {/* Action buttons */}
                <div className="connection-actions" onClick={(e) => e.stopPropagation()}>
                  {connection.status === 'connected' ? (
                    <button
                      className="disconnect-btn"
                      onClick={() => handleDisconnect(connection)}
                      title="断开连接"
                    >
                      <FontAwesomeIcon icon={faPlugCircleXmark} />
                    </button>
                  ) : (
                    <button
                      className="connect-btn"
                      onClick={() => handleConnect(connection)}
                      title="连接"
                    >
                      <FontAwesomeIcon icon={faPlug} />
                    </button>
                  )}
                  <button
                    className="edit-btn"
                    onClick={() => handleEditClick(connection)}
                    title="编辑"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.connection.status === 'connected' ? (
            <div className="context-menu-item" onClick={() => handleDisconnect(contextMenu.connection)}>
              <FontAwesomeIcon icon={faPlugCircleXmark} />
              <span>断开连接</span>
            </div>
          ) : (
            <div className="context-menu-item" onClick={() => handleConnect(contextMenu.connection)}>
              <FontAwesomeIcon icon={faPlug} />
              <span>连接</span>
            </div>
          )}
          <div className="context-menu-item" onClick={() => handleEditClick(contextMenu.connection)}>
            <FontAwesomeIcon icon={faEdit} />
            <span>编辑</span>
          </div>
          <div className="context-menu-item danger" onClick={handleDeleteClick}>
            <FontAwesomeIcon icon={faTrash} />
            <span>删除</span>
          </div>
        </div>
      )}

      {/* Modal */}
      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingConnection={editingConnection}
      />
    </div>
  );
}