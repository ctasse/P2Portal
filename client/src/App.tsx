import { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Container } from '@mui/material';
import { animate } from 'animejs';
import { theme } from './theme';
import { PeerProvider } from './context/PeerContext';
import { StartScreen } from './components/StartScreen';
import { SenderView } from './components/SenderView';
import { ReceiverView } from './components/ReceiverView';
import { SettingsPanel } from './components/SettingsPanel';
import { usePeer } from './hooks/usePeer';

function AppContent() {
  const { state } = usePeer();
  const { mode } = state;

  useEffect(() => {
    animate('.view-container', {
      opacity: [0, 1],
      translateY: [16, 0],
      easing: 'easeOutCubic',
      duration: 400,
    });
  }, [mode]);

  return (
    <Container
      maxWidth="sm"
      sx={{
        py: 3,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {mode === null && <StartScreen />}
      {mode === 'sender' && <SenderView />}
      {mode === 'receiver' && <ReceiverView />}
      {state.settingsOpen && <SettingsPanel />}
    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PeerProvider>
        <AppContent />
      </PeerProvider>
    </ThemeProvider>
  );
}

export default App;
