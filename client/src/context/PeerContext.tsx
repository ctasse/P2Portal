import { useReducer, useRef, useCallback } from 'react';
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
  MAX_COLLISION_RETRIES,
} from '../types';
import { handleIncomingMessage } from '../utils/fileTransfer';
import { generateCode, isCollisionError } from '../utils/code';

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
  const connRef = useRef<DataConnection | null>(null);

  function setupConnection(conn: DataConnection) {
    connRef.current = conn;

    conn.on('open', () => {
      dispatch({
        type: 'CONNECTION_OPEN',
        payload: { remotePeerId: conn.peer },
      });
      // Auto-send queued files happens in SenderView via state.connection.status change
    });

    conn.on('data', (data: unknown) => {
      handleIncomingMessage(data, conn.peer, dispatch);
    });

    conn.on('close', () => {
      dispatch({ type: 'CONNECTION_CLOSED' });
      connRef.current = null;
    });

    conn.on('error', (err) => {
      dispatch({
        type: 'CONNECTION_ERROR',
        payload: { error: err.message },
      });
    });
  }

  const attemptCreatePeer = useCallback(
    (sender: boolean, code?: string, retriesLeft = MAX_COLLISION_RETRIES) => {
      const peerId = sender ? (code ?? generateCode()) : undefined;

      const peer = peerId
        ? new Peer(peerId, createPeerOptions())
        : new Peer(createPeerOptions());
      peerRef.current = peer;

      peer.on('open', (id: string) => {
        if (sender && state.mode === 'sender') {
          // Store the actual code being used
          dispatch({ type: 'PEER_READY', payload: { id } });
        } else if (!sender) {
          dispatch({ type: 'PEER_READY', payload: { id } });
        }
      });

      peer.on('connection', (conn: DataConnection) => {
        setupConnection(conn);
      });

      peer.on('error', (err) => {
        if (sender && isCollisionError(err) && retriesLeft > 0) {
          peer.destroy();
          dispatch({ type: 'PEER_COLLISION' });
          const newCode = generateCode();
          // Update code in state via SET_MODE so UI shows the new code
          dispatch({
            type: 'SET_MODE',
            payload: { mode: 'sender', code: newCode },
          });
          attemptCreatePeer(sender, newCode, retriesLeft - 1);
        } else {
          dispatch({
            type: 'PEER_ERROR',
            payload: { error: err.message },
          });
        }
      });

      peer.on('disconnected', () => {
        // PeerJS may reconnect automatically; if it doesn't, we'll get an error
      });
    },
    [state.mode],
  );

  const createPeer = useCallback(
    (options: { sender: boolean; code?: string }) => {
      // Clean up existing peer if any
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (connRef.current) {
        connRef.current.close();
        connRef.current = null;
      }

      if (options.sender) {
        const code = options.code ?? generateCode();
        if (!state.code) {
          dispatch({
            type: 'SET_MODE',
            payload: { mode: 'sender', code },
          });
        }
        attemptCreatePeer(true, code);
      } else {
        attemptCreatePeer(false);
      }
    },
    [attemptCreatePeer, state.code],
  );

  const connectToPeer = useCallback(
    (remoteId: string) => {
      if (!peerRef.current || !remoteId.trim()) return;

      const trimmed = remoteId.trim();
      dispatch({
        type: 'CONNECTION_CONNECTING',
        payload: { remotePeerId: trimmed },
      });

      const conn = peerRef.current.connect(trimmed, { reliable: true });
      setupConnection(conn);
    },
    [],
  );

  const sendMessage = useCallback((message: unknown) => {
    if (connRef.current) {
      connRef.current.send(message);
    }
  }, []);

  const resetAll = useCallback(() => {
    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    dispatch({ type: 'RESET' });
  }, []);

  const value: PeerContextValue = {
    state,
    dispatch,
    createPeer,
    connectToPeer,
    sendMessage,
    resetAll,
  };

  return (
    <PeerContext.Provider value={value}>{children}</PeerContext.Provider>
  );
}
