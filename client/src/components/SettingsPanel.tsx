import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import { usePeer } from '../hooks/usePeer';
import {
  SIGNALING_SERVER,
  SIGNALING_PORT,
  SIGNALING_SECURE,
  RELAY_SERVER_URL,
} from '../types';
import { loadSettings, saveSettings, clearSettings } from '../utils/storage';

export function SettingsPanel() {
  const { state, dispatch } = usePeer();
  const stored = loadSettings();

  const [host, setHost] = useState(
    state.signalingConfig?.host ?? stored.signalingHost ?? SIGNALING_SERVER,
  );
  const [port, setPort] = useState(
    String(state.signalingConfig?.port ?? stored.signalingPort ?? SIGNALING_PORT),
  );
  const [secure, setSecure] = useState(
    state.signalingConfig?.secure ?? stored.signalingSecure ?? SIGNALING_SECURE,
  );
  const [path, setPath] = useState(
    state.signalingConfig?.path ?? stored.signalingPath ?? '/',
  );
  const [relayUrl, setRelayUrl] = useState(
    stored.relayUrl ?? RELAY_SERVER_URL,
  );

  const handleClose = () => {
    dispatch({ type: 'TOGGLE_SETTINGS' });
  };

  const handleSave = () => {
    const config = {
      host,
      port: Number(port) || SIGNALING_PORT,
      secure,
      path,
    };
    saveSettings({
      signalingHost: config.host,
      signalingPort: config.port,
      signalingSecure: config.secure,
      signalingPath: config.path,
      relayUrl,
    });
    dispatch({ type: 'SET_SIGNALING_CONFIG', payload: { config } });
    handleClose();
  };

  const handleReset = () => {
    clearSettings();
    setHost(SIGNALING_SERVER);
    setPort(String(SIGNALING_PORT));
    setSecure(SIGNALING_SECURE);
    setPath('/');
    setRelayUrl(RELAY_SERVER_URL);
    dispatch({
      type: 'SET_SIGNALING_CONFIG',
      payload: {
        config: {
          host: SIGNALING_SERVER,
          port: SIGNALING_PORT,
          secure: SIGNALING_SECURE,
          path: '/',
        },
      },
    });
  };

  return (
    <Dialog open={state.settingsOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>设置</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="subtitle2" color="primary">
            信令服务器
          </Typography>
          <TextField
            label="服务器地址"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            size="small"
            fullWidth
            placeholder="0.peerjs.com"
          />
          <TextField
            label="端口"
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            size="small"
            fullWidth
            placeholder="443"
          />
          <FormControlLabel
            control={
              <Switch
                checked={secure}
                onChange={(e) => setSecure(e.target.checked)}
              />
            }
            label="使用 TLS/SSL (WSS)"
          />
          <TextField
            label="路径"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            size="small"
            fullWidth
            placeholder="/"
          />

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" color="primary">
            中继服务器
          </Typography>
          <TextField
            label="WebSocket 地址"
            value={relayUrl}
            onChange={(e) => setRelayUrl(e.target.value)}
            size="small"
            fullWidth
            placeholder="ws://localhost:8080"
            helperText="用于 P2P 直连失败时的中继传输"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color="warning">
          恢复默认
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose}>取消</Button>
        <Button onClick={handleSave} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
