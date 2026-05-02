import { ThemeProvider, CssBaseline, Container } from '@mui/material';
import { theme } from './theme';
import { PeerProvider } from './context/PeerContext';
import { StartScreen } from './components/StartScreen';
import { SenderView } from './components/SenderView';
import { ReceiverView } from './components/ReceiverView';
import { usePeer } from './hooks/usePeer';

function AppContent() {
  const { state } = usePeer();
  const { mode } = state;

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
