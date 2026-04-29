import { useRef } from 'react';
import { useFileTransfer } from '../hooks/useFileTransfer';
import { usePeer } from '../hooks/usePeer';
import { TransferItem } from './TransferItem';
import styles from './TransferPanel.module.css';

export function TransferPanel() {
  const { transfers, sendFiles, clearTransfers } = useFileTransfer();
  const { isConnected } = usePeer();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      sendFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>发送文件</h2>
        <div className={styles.sendArea}>
          <button
            className={styles.selectBtn}
            disabled={!isConnected}
            title={!isConnected ? '请先连接到 Peer' : undefined}
            onClick={() => fileInputRef.current?.click()}
          >
            选择文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className={styles.fileInput}
            onChange={handleFileSelect}
            disabled={!isConnected}
          />
          {!isConnected && (
            <p className={styles.hint}>请先连接到一个 Peer 后再发送文件</p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.transferHeader}>
          <h2 className={styles.sectionTitle}>传输列表</h2>
          {transfers.some(
            (t) => t.status === 'complete' || t.status === 'error',
          ) && (
            <button className={styles.clearBtn} onClick={clearTransfers}>
              清除已完成
            </button>
          )}
        </div>

        {transfers.length === 0 ? (
          <p className={styles.empty}>
            暂无传输记录。选择文件开始传输。
          </p>
        ) : (
          <div className={styles.transferList}>
            {transfers.map((t) => (
              <TransferItem key={t.transferId} transfer={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
