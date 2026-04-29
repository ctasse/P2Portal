import { useContext, useMemo } from 'react';
import { PeerContext } from '../context/reducer';

export function usePeer() {
  const ctx = useContext(PeerContext);
  if (!ctx) throw new Error('usePeer must be used within PeerProvider');

  const { state, connectToPeer, disconnectPeer } = ctx;

  const isConnected = useMemo(
    () =>
      state.peer.status === 'connected' &&
      state.connections.some((c) => c.status === 'open'),
    [state.peer.status, state.connections],
  );

  return {
    state,
    connectToPeer,
    disconnectPeer,
    isConnected,
  };
}
