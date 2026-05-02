import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  CloudDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { usePeer } from '../hooks/usePeer';
import { useFileTransfer } from '../hooks/useFileTransfer';
import { TransferList } from './TransferList';
import { isValidCode } from '../utils/code';

type ReceiverPhase = 'entry' | 'connecting' | 'receiving' | 'complete';

export function ReceiverView() {
  const { state, createPeer, connectToPeer, resetAll, isConnected } = usePeer();
  const { transfers, clearTransfers } = useFileTransfer();
  const [codeInput, setCodeInput] = useState('');
  const [phase, setPhase] = useState<ReceiverPhase>('entry');

  const allDone =
    transfers.length > 0 && transfers.every((t) => t.status === 'complete' || t.status === 'error');

  useEffect(() => {
    if (isConnected && phase === 'connecting') {
      setPhase('receiving');
    }
  }, [isConnected, phase]);

  useEffect(() => {
    if (phase === 'receiving' && allDone && transfers.length > 0) {
      setPhase('complete');
    }
  }, [phase, allDone, transfers.length]);

  const handleConnect = useCallback(() => {
    if (!isValidCode(codeInput)) return;
    setPhase('connecting');
    createPeer({ sender: false });
  }, [codeInput, createPeer]);

  // Connect to sender once peer is ready
  useEffect(() => {
    if (
      phase === 'connecting' &&
      state.peer.status === 'ready' &&
      isValidCode(codeInput)
    ) {
      connectToPeer(codeInput);
    }
  }, [phase, state.peer.status, codeInput, connectToPeer]);

  const handleBack = useCallback(() => {
    resetAll();
    setCodeInput('');
    setPhase('entry');
  }, [resetAll]);

  const handleNewTransfer = useCallback(() => {
    clearTransfers();
    setCodeInput('');
    setPhase('entry');
  }, [clearTransfers]);

  const isCodeValid = isValidCode(codeInput);
  const connectionError = state.connection.status === 'error';
  const peerError = state.peer.status === 'error';

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={handleBack} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">接收文件</Typography>
      </Box>

      {/* Phase: Code Entry */}
      {phase === 'entry' && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <DownloadIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          <Typography variant="h6" color="text.secondary">
            输入接收验证码
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请输入发送方提供的 6 位数字验证码
          </Typography>

          <TextField
            value={codeInput}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCodeInput(val);
            }}
            placeholder="000000"
            slotProps={{
              htmlInput: {
                inputMode: 'numeric',
                autoComplete: 'off',
                style: {
                  textAlign: 'center',
                  fontSize: '2rem',
                  letterSpacing: '0.5em',
                  fontFamily: 'monospace',
                },
              },
            }}
            sx={{ maxWidth: 280, width: '100%' }}
            autoFocus
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={!isCodeValid}
            onClick={handleConnect}
            startIcon={<LoginIcon />}
            sx={{ maxWidth: 280 }}
          >
            连接
          </Button>
        </Box>
      )}

      {/* Phase: Connecting */}
      {phase === 'connecting' && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            正在连接到发送方...
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {codeInput}
          </Typography>

          {(connectionError || peerError) && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography color="error" gutterBottom>
                {state.connection.error || state.peer.error || '连接失败，请确认验证码是否正确'}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  handleBack();
                }}
              >
                返回重试
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Phase: Receiving */}
      {phase === 'receiving' && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon color="success" />
            <Typography color="success.main" sx={{ fontWeight: 500 }}>
              已连接 - 接收中
            </Typography>
          </Box>

          <TransferList transfers={transfers} />

          {connectionError && (
            <Typography color="error" variant="body2">
              连接已断开
            </Typography>
          )}
        </Box>
      )}

      {/* Phase: Complete */}
      {phase === 'complete' && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CheckIcon sx={{ fontSize: 64, color: 'success.main' }} />
          <Typography variant="h6" color="success.main">
            传输完成!
          </Typography>

          <TransferList transfers={transfers} />

          <Button variant="outlined" onClick={handleNewTransfer} sx={{ mt: 1 }}>
            新建传输
          </Button>
        </Box>
      )}
    </Box>
  );
}
