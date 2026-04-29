import { usePeer } from '../hooks/usePeer';
import { StatusBadge } from './StatusBadge';
import styles from './Header.module.css';

export function Header() {
  const { state, isConnected } = usePeer();

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>P2Portal</h1>
      <div className={styles.info}>
        {state.peer.id && (
          <span className={styles.peerId}>
            ID: <code>{state.peer.id}</code>
          </span>
        )}
        <StatusBadge
          status={isConnected ? 'connected' : state.peer.status}
          error={state.peer.error}
        />
      </div>
    </header>
  );
}
