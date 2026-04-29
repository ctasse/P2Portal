import type { PeerStatus } from '../types';
import type { ConnectionStatus } from '../types';
import styles from './StatusBadge.module.css';

type BadgeStatus = PeerStatus | ConnectionStatus;

const statusConfig: Record<
  BadgeStatus,
  { color: string; label: string }
> = {
  idle: { color: '#9ca3af', label: '初始化中...' },
  connecting: { color: '#ca8a04', label: '连接中...' },
  connected: { color: '#16a34a', label: '已连接' },
  open: { color: '#16a34a', label: '已连接' },
  disconnected: { color: '#9ca3af', label: '已断开' },
  closed: { color: '#9ca3af', label: '已关闭' },
  error: { color: '#dc2626', label: '错误' },
};

export function StatusBadge({
  status,
  error,
}: {
  status: BadgeStatus;
  error?: string | null;
}) {
  const cfg = statusConfig[status] || statusConfig.idle;
  return (
    <span
      className={styles.badge}
      title={error ?? cfg.label}
    >
      <span
        className={styles.dot}
        style={{ backgroundColor: cfg.color }}
      />
      <span className={styles.label}>{cfg.label}</span>
    </span>
  );
}
