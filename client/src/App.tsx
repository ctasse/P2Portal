import { PeerProvider } from './context/PeerContext';
import { Header } from './components/Header';
import { ConnectionPanel } from './components/ConnectionPanel';
import { TransferPanel } from './components/TransferPanel';
import styles from './App.module.css';

function AppContent() {
  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <ConnectionPanel />
        <TransferPanel />
      </main>
    </div>
  );
}

function App() {
  return (
    <PeerProvider>
      <AppContent />
    </PeerProvider>
  );
}

export default App;
