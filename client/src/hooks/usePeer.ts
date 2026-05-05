import { useContext } from 'react';
import { PeerContext } from '../context/reducer';

export function usePeer() {
  const ctx = useContext(PeerContext);
  if (!ctx) throw new Error('usePeer must be used within PeerProvider');

  const { state, dispatch, createPeer, connectToPeer, sendMessage, resetAll, connectRelay, disconnectRelay } = ctx;

  const isConnected = state.connection.status === 'open' || state.relay.status === 'open';

  return {
    state,
    dispatch,
    createPeer,
    connectToPeer,
    sendMessage,
    resetAll,
    connectRelay,
    disconnectRelay,
    isConnected,
  };
}
