import {
  List,
  ListItem,
  LinearProgress,
  Chip,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import type { TransferState } from '../types';

function formatSize(bytes: number): string {
  if (bytes === 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function StatusChip({ status }: { status: TransferState['status'] }) {
  switch (status) {
    case 'pending':
      return <Chip label="等待中" size="small" color="default" />;
    case 'transferring':
      return <Chip label="传输中" size="small" color="primary" />;
    case 'complete':
      return <Chip label="完成" size="small" color="success" />;
    case 'error':
      return <Chip label="错误" size="small" color="error" />;
  }
}

interface TransferListProps {
  transfers: TransferState[];
}

export function TransferList({ transfers }: TransferListProps) {
  if (transfers.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
        暂无传输记录
      </Typography>
    );
  }

  return (
    <List disablePadding>
      {transfers.map((t) => {
        const progress =
          t.totalChunks > 0 ? Math.round((t.receivedChunks / t.totalChunks) * 100) : 0;

        return (
          <ListItem
            key={t.transferId}
            sx={{
              flexDirection: 'column',
              alignItems: 'stretch',
              border: 1,
              borderColor:
                t.status === 'complete'
                  ? 'success.main'
                  : t.status === 'error'
                    ? 'error.main'
                    : 'divider',
              borderRadius: 2,
              mb: 1,
              py: 1.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.5,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap title={t.fileName}>
                  {t.direction === 'upload' ? '↑ ' : '↓ '}
                  {t.fileName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t.fileSize > 0 ? formatSize(t.fileSize) : '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                <StatusChip status={t.status} />
                {t.status === 'complete' && t.objectUrl && (
                  <IconButton
                    size="small"
                    color="primary"
                    component="a"
                    href={t.objectUrl}
                    download={t.fileName}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>

            {(t.status === 'transferring' || t.status === 'complete') && t.totalChunks > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant={t.status === 'complete' ? 'determinate' : 'determinate'}
                  value={progress}
                  color={t.status === 'complete' ? 'success' : 'primary'}
                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36 }}>
                  {progress}%
                </Typography>
              </Box>
            )}

            {t.status === 'error' && t.error && (
              <Typography variant="caption" color="error">
                {t.error}
              </Typography>
            )}
          </ListItem>
        );
      })}
    </List>
  );
}
