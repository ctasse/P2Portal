import type { TransferState } from '../types';
import styles from './TransferItem.module.css';

export function TransferItem({
  transfer,
}: {
  transfer: TransferState;
}) {
  const progress =
    transfer.totalChunks > 0
      ? Math.round((transfer.receivedChunks / transfer.totalChunks) * 100)
      : 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '?';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`${styles.item} ${styles[transfer.status]}`}>
      <div className={styles.header}>
        <span className={styles.icon}>
          {transfer.direction === 'upload' ? '↑' : '↓'}
        </span>
        <span className={styles.name}>{transfer.fileName}</span>
        <span className={styles.size}>({formatSize(transfer.fileSize)})</span>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.footer}>
        {transfer.status === 'pending' && (
          <span className={styles.statusText}>等待中...</span>
        )}
        {transfer.status === 'transferring' && (
          <span className={styles.statusText}>
            传输中... {transfer.receivedChunks}/{transfer.totalChunks} 块
            ({progress}%)
          </span>
        )}
        {transfer.status === 'complete' && (
          <span className={styles.completeText}>完成</span>
        )}
        {transfer.status === 'error' && (
          <span className={styles.errorText}>
            错误: {transfer.error}
          </span>
        )}

        {transfer.status === 'complete' &&
          transfer.direction === 'download' &&
          transfer.objectUrl && (
            <a
              className={styles.downloadBtn}
              href={transfer.objectUrl}
              download={transfer.fileName}
            >
              下载
            </a>
          )}
      </div>
    </div>
  );
}
