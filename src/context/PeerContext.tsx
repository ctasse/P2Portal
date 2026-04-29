import { useReducer, useRef, useEffect, useCallback } from 'react';
import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';
import {
  PeerContext,
  peerReducer,
  initialState,
  type PeerContextValue,
} from './reducer';
import {
  SIGNALING_SERVER,
  SIGNALING_PORT,
  SIGNALING_SECURE,
} from '../types';
import { handleIncomingMessage } from '../utils/fileTransfer';

function createPeerOptions() {
  return {
    host: SIGNALING_SERVER,
    port: SIGNALING_PORT,
    secure: SIGNALING_SECURE,
    path: import.meta.env.VITE_SIGNALING_PATH || '/',
    debug: import.meta.env.DEV ? 2 : 0,
  };
}

export function PeerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(peerReducer, initialState);
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());

  function setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      dispatch({
        type: 'CONNECTION_OPEN',
        payload: { remotePeerId: conn.peer },
      });
    });

    conn.on('data', (data: unknown) => {
      handleIncomingMessage(data, conn.peer, dispatch);
    });

    conn.on('close', () => {
      dispatch({
        type: 'CONNECTION_CLOSED',
        payload: { remotePeerId: conn.peer },
      });
      connectionsRef.current.delete(conn.peer);
    });

    conn.on('error', (err) => {
      dispatch({
        type: 'CONNECTION_ERROR',
        payload: { remotePeerId: conn.peer, error: err.message },
      });
    });
  }

  const connectToPeer = useCallback((remoteId: string) => {
    if (!peerRef.current || !remoteId.trim()) return;
    if (connectionsRef.current.has(remoteId.trim())) return;

    dispatch({
      type: 'CONNECTION_REQUESTED',
      payload: { remotePeerId: remoteId.trim() },
    });

    const conn = peerRef.current.connect(remoteId.trim(), { reliable: true });
    connectionsRef.current.set(remoteId.trim(), conn);
    setupConnection(conn);
  }, []);

  const disconnectPeer = useCallback((remoteId: string) => {
    const conn = connectionsRef.current.get(remoteId);
    if (conn) {
      conn.close();
      connectionsRef.current.delete(remoteId);
      dispatch({
        type: 'CONNECTION_CLOSED',
        payload: { remotePeerId: remoteId },
      });
    }
  }, []);

  useEffect(() => {
    const peer = new Peer(createPeerOptions());
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      dispatch({ type: 'PEER_INIT', payload: { id } });
    });

    peer.on('connection', (conn: DataConnection) => {
      connectionsRef.current.set(conn.peer, conn);
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      dispatch({
        type: 'PEER_ERROR',
        payload: { error: err.message },
      });
    });

    peer.on('disconnected', () => {
      dispatch({
        type: 'PEER_STATUS',
        payload: { status: 'disconnected' },
      });
    });

    return () => {
      connectionsRef.current.forEach((c) => c.close());
      connectionsRef.current.clear();
      peer.destroy();
      peerRef.current = null;
    };
  }, []);

  const value: PeerContextValue = {
    state,
    dispatch,
    connectToPeer,
    disconnectPeer,
    connectionsRef,
  };

  return (
    <PeerContext.Provider value={value}>{children}</PeerContext.Provider>
  );
}
