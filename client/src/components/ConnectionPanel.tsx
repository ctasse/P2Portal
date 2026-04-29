import { useState } from 'react';
import { usePeer } from '../hooks/usePeer';
import { StatusBadge } from './StatusBadge';
import styles from './ConnectionPanel.module.css';

export function ConnectionPanel() {
  const { state, connectToPeer, disconnectPeer, isConnected } = usePeer();
  const [remoteId, setRemoteId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConnect = () => {
    if (remoteId.trim() && remoteId.trim() !== state.peer.id) {
      connectToPeer(remoteId.trim());
      setRemoteId('');
    }
  };

  const handleCopy = async () => {
    if (state.peer.id) {
      try {
        await navigator.clipboard.writeText(state.peer.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard API not available
      }
    }
  };

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>我的 Peer ID</h2>
        {state.peer.id ? (
          <div className={styles.peerIdBox}>
            <code className={styles.peerId}>{state.peer.id}</code>
            <button
              className={styles.copyBtn}
              onClick={handleCopy}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        ) : (
          <p className={styles.loading}>正在生成 Peer ID...</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>连接到 Peer</h2>
        {isConnected ? (
          <div className={styles.connectedInfo}>
            {state.connections
              .filter((c) => c.status === 'open')
              .map((c) => (
                <div key={c.remotePeerId} className={styles.connectedRow}>
                  <span>已连接到</span>
                  <code className={styles.remoteId}>{c.remotePeerId}</code>
                  <StatusBadge status="open" />
                  <button
                    className={styles.disconnectBtn}
                    onClick={() => disconnectPeer(c.remotePeerId)}
                  >
                    断开
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className={styles.connectForm}>
            <input
              className={styles.input}
              type="text"
              placeholder="输入远程 Peer ID..."
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              disabled={!state.peer.id}
            />
            <button
              className={styles.connectBtn}
              onClick={handleConnect}
              disabled={
                !state.peer.id ||
                !remoteId.trim() ||
                remoteId.trim() === state.peer.id
              }
            >
              连接
            </button>
          </div>
        )}
        {state.peer.error && (
          <p className={styles.error}>错误: {state.peer.error}</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>连接列表</h2>
        {state.connections.length === 0 ? (
          <p className={styles.empty}>暂无连接</p>
        ) : (
          <ul className={styles.connectionList}>
            {state.connections.map((c) => (
              <li key={c.remotePeerId} className={styles.connectionItem}>
                <code className={styles.remoteId}>{c.remotePeerId}</code>
                <StatusBadge status={c.status} error={c.error} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
