import { useReducer, useRef, useCallback, useEffect } from 'react';
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
  RELAY_SERVER_URL,
  type AppState,
} from '../types';
import { handleIncomingMessage } from '../utils/fileTransfer';
import { generateCode, isCollisionError } from '../utils/code';
import { RelayClient } from '../utils/relayClient';
import { loadSettings } from '../utils/storage';

function createPeerOptions(signalingConfig: NonNullable<AppState['signalingConfig']> | null) {
  const cfg = signalingConfig ?? {
    host: SIGNALING_SERVER,
    port: SIGNALING_PORT,
    secure: SIGNALING_SECURE,
    path: import.meta.env.VITE_SIGNALING_PATH || '/',
  };
  return {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    path: cfg.path,
    debug: import.meta.env.DEV ? 2 : 0,
  };
}

export function PeerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(peerReducer, initialState, () => {
    const stored = loadSettings();
    return {
      ...initialState,
      signalingConfig: stored.signalingHost
        ? {
            host: stored.signalingHost,
            port: stored.signalingPort ?? SIGNALING_PORT,
            secure: stored.signalingSecure ?? SIGNALING_SECURE,
            path: stored.signalingPath ?? '/',
          }
        : null,
    };
  });
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const relayClientRef = useRef<RelayClient | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearConnectionTimeout() {
    if (connectionTimeoutRef.current !== null) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }

  function setupConnection(conn: DataConnection) {
    connRef.current = conn;
    dispatch({
      type: 'CONNECTION_CONNECTING',
      payload: { remotePeerId: conn.peer },
    });

    conn.on('open', () => {
      clearConnectionTimeout();
      dispatch({
        type: 'CONNECTION_OPEN',
        payload: { remotePeerId: conn.peer },
      });
      dispatch({
        type: 'SET_TRANSPORT_MODE',
        payload: { mode: 'p2p' },
      });
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
        ? new Peer(peerId, createPeerOptions(state.signalingConfig))
        : new Peer(createPeerOptions(state.signalingConfig));
      peerRef.current = peer;

      peer.on('open', (id: string) => {
        if (sender && state.mode === 'sender') {
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
        // PeerJS may reconnect automatically
      });
    },
    [state.mode, state.signalingConfig],
  );

  const createPeer = useCallback(
    (options: { sender: boolean; code?: string }) => {
      // Clean up existing peer, connection, and relay
      if (relayClientRef.current) {
        relayClientRef.current.disconnect();
        relayClientRef.current = null;
      }
      dispatch({ type: 'RELAY_CLOSED' });
      dispatch({ type: 'SET_TRANSPORT_MODE', payload: { mode: null } });

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

  const connectRelay = useCallback(
    (room: string, role: 'sender' | 'receiver') => {
      // Clean up any existing peer/connection
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (connRef.current) {
        connRef.current.close();
        connRef.current = null;
      }

      dispatch({ type: 'RELAY_CONNECTING' });
      dispatch({ type: 'SET_TRANSPORT_MODE', payload: { mode: 'relay' } });

      const relayUrl = loadSettings().relayUrl || RELAY_SERVER_URL;
      if (!relayUrl) {
        dispatch({ type: 'RELAY_ERROR', payload: { error: '未配置中继服务器地址' } });
        return;
      }
      const client = new RelayClient();
      relayClientRef.current = client;

      client.connect(relayUrl, room, role, {
        onOpen: () => {
          dispatch({ type: 'RELAY_OPEN' });
          dispatch({
            type: 'CONNECTION_OPEN',
            payload: { remotePeerId: `relay:${room}` },
          });
        },
        onMessage: (data: unknown) => {
          handleIncomingMessage(data, `relay:${room}`, dispatch);
        },
        onClose: () => {
          dispatch({ type: 'RELAY_CLOSED' });
          dispatch({ type: 'CONNECTION_CLOSED' });
          relayClientRef.current = null;
        },
        onError: (error: string) => {
          dispatch({ type: 'RELAY_ERROR', payload: { error } });
        },
      });
    },
    [],
  );

  const disconnectRelay = useCallback(() => {
    if (relayClientRef.current) {
      relayClientRef.current.disconnect();
      relayClientRef.current = null;
    }
    dispatch({ type: 'RELAY_CLOSED' });
    dispatch({ type: 'SET_TRANSPORT_MODE', payload: { mode: null } });
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    if (relayClientRef.current) {
      relayClientRef.current.send(message);
    } else if (connRef.current) {
      connRef.current.send(message);
    }
  }, []);

  const resetAll = useCallback(() => {
    clearConnectionTimeout();
    if (relayClientRef.current) {
      relayClientRef.current.disconnect();
      relayClientRef.current = null;
    }
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

  useEffect(() => {
    return () => {
      clearConnectionTimeout();
      relayClientRef.current?.disconnect();
    };
  }, []);

  const value: PeerContextValue = {
    state,
    dispatch,
    createPeer,
    connectToPeer,
    sendMessage,
    resetAll,
    connectRelay,
    disconnectRelay,
  };

  return (
    <PeerContext.Provider value={value}>{children}</PeerContext.Provider>
  );
}
