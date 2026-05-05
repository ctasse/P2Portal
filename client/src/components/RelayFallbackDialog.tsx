import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  WifiOff as WifiOffIcon,
  Router as RouterIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { RELAY_MAX_SIZE } from '../types';

interface RelayFallbackDialogProps {
  open: boolean;
  code: string | null;
  role: 'sender' | 'receiver';
  onUseRelay: () => void;
  onRetryP2P: () => void;
  onCancel: () => void;
}

export function RelayFallbackDialog({
  open,
  code,
  role,
  onUseRelay,
  onRetryP2P,
  onCancel,
}: RelayFallbackDialogProps) {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WifiOffIcon color="warning" />
          <span>无法建立直连</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography>
            由于防火墙或 NAT 限制，无法与对方建立直接的 P2P 连接。
          </Typography>
          <Box
            sx={{
              bgcolor: 'warning.light',
              color: 'warning.contrastText',
              borderRadius: 1,
              p: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              中继模式说明：
            </Typography>
            <Typography variant="body2">
              - 文件将通过服务器中转传输，不是直接连接
            </Typography>
            <Typography variant="body2">
              - 单次传输大小限制为 {RELAY_MAX_SIZE / 1024 / 1024}MB
            </Typography>
            <Typography variant="body2">
              - 发送方和接收方都需切换到中继模式并使用相同的验证码
            </Typography>
          </Box>
          {code && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontFamily: 'monospace' }}>
              当前验证码: {code}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<RouterIcon />}
          onClick={onUseRelay}
          sx={{ flex: 1 }}
        >
          使用中继模式
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRetryP2P}
        >
          重试 P2P
        </Button>
        <Button
          color="inherit"
          startIcon={<HomeIcon />}
          onClick={onCancel}
        >
          返回首页
        </Button>
      </DialogActions>
    </Dialog>
  );
}
