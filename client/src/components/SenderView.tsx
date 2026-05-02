import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { usePeer } from '../hooks/usePeer';
import { useFileTransfer } from '../hooks/useFileTransfer';
import { TransferList } from './TransferList';

type SenderPhase = 'select' | 'waiting' | 'connected';

export function SenderView() {
  const { state, createPeer, resetAll, isConnected } = usePeer();
  const { transfers, sendFiles, clearTransfers } = useFileTransfer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<SenderPhase>('select');

  const code = state.code;

  useEffect(() => {
    if (isConnected && phase === 'waiting') {
      setPhase('connected');
    }
  }, [isConnected, phase]);

  // When connection opens and we have pending files, send them
  useEffect(() => {
    if (isConnected && selectedFiles.length > 0) {
      sendFiles(selectedFiles);
      setSelectedFiles([]);
    }
  }, [isConnected, selectedFiles, sendFiles]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileList = Array.from(files);
      setSelectedFiles(fileList);
      createPeer({ sender: true });
      setPhase('waiting');
    },
    [createPeer],
  );

  const handleCopy = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }, [code]);

  const handleBack = useCallback(() => {
    resetAll();
    setSelectedFiles([]);
    setPhase('select');
  }, [resetAll]);

  const handleNewTransfer = useCallback(() => {
    clearTransfers();
    setPhase('select');
  }, [clearTransfers]);

  const codeDigits = code ? code.split('') : [];

  const peerError = state.peer.status === 'error';

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={handleBack} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">发送文件</Typography>
      </Box>

      {/* Phase: File Select */}
      {phase === 'select' && (
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
          <UploadIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          <Typography variant="h6" color="text.secondary">
            选择要发送的文件
          </Typography>
          <Typography variant="body2" color="text.secondary">
            支持任意格式，单文件最大 500MB
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => fileInputRef.current?.click()}
            startIcon={<UploadIcon />}
          >
            选择文件
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFileSelect}
          />
        </Box>
      )}

      {/* Phase: Waiting for connection */}
      {phase === 'waiting' && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography variant="subtitle1" color="text.secondary">
            您的传输验证码
          </Typography>

          {/* 6-digit code display - 2x3 grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
            }}
          >
            {codeDigits.map((digit, i) => (
              <Paper
                key={i}
                sx={{
                  width: 56,
                  height: 64,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {digit}
                </Typography>
              </Paper>
            ))}
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={copied ? <CheckIcon /> : <CopyIcon />}
            onClick={handleCopy}
          >
            {copied ? '已复制' : '复制验证码'}
          </Button>

          {peerError ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography color="error" gutterBottom>
                {state.peer.error || '创建连接失败'}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  createPeer({ sender: true });
                }}
              >
                重试
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                等待接收方连接...
              </Typography>
            </Box>
          )}

          {selectedFiles.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, width: '100%', maxWidth: 320 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                已选文件
              </Typography>
              {selectedFiles.map((f, i) => (
                <Typography key={i} variant="body2" noWrap>
                  {f.name}{' '}
                  <Typography component="span" variant="caption" color="text.secondary">
                    ({f.size < 1024 * 1024
                      ? `${(f.size / 1024).toFixed(1)} KB`
                      : `${(f.size / (1024 * 1024)).toFixed(1)} MB`})
                  </Typography>
                </Typography>
              ))}
            </Paper>
          )}
        </Box>
      )}

      {/* Phase: Connected / Transferring */}
      {phase === 'connected' && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon color="success" />
            <Typography color="success.main" sx={{ fontWeight: 500 }}>
              已连接
            </Typography>
          </Box>

          <TransferList transfers={transfers} />

          <Button variant="outlined" onClick={handleNewTransfer} sx={{ mt: 1 }}>
            新建传输
          </Button>
        </Box>
      )}
    </Box>
  );
}
