import { Box, Typography, Button, Stack } from '@mui/material';
import { Send as SendIcon, Download as DownloadIcon } from '@mui/icons-material';
import { usePeer } from '../hooks/usePeer';

export function StartScreen() {
  const { dispatch } = usePeer();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        py: 8,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          P2Portal
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          P2P 文件传输工具
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ width: '100%', maxWidth: 400 }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<SendIcon />}
          onClick={() => dispatch({ type: 'SET_MODE', payload: { mode: 'sender' } })}
          sx={{ flex: 1, py: 2 }}
        >
          发送文件
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<DownloadIcon />}
          onClick={() => dispatch({ type: 'SET_MODE', payload: { mode: 'receiver' } })}
          sx={{ flex: 1, py: 2 }}
        >
          接收文件
        </Button>
      </Stack>
    </Box>
  );
}
