import { createContext } from 'react';
import type { DataConnection } from 'peerjs';
import type { AppState, PeerAction } from '../types';

export type ReactSet = React.Dispatch<PeerAction>;

export interface PeerContextValue {
  state: AppState;
  dispatch: ReactSet;
  connectToPeer: (remoteId: string) => void;
  disconnectPeer: (remoteId: string) => void;
  connectionsRef: React.MutableRefObject<Map<string, DataConnection>>;
}

export const PeerContext = createContext<PeerContextValue | null>(null);

export const initialState: AppState = {
  peer: { id: null, status: 'idle', error: null },
  connections: [],
  transfers: {},
};

export function peerReducer(state: AppState, action: PeerAction): AppState {
  switch (action.type) {
    case 'PEER_INIT':
      return {
        ...state,
        peer: { id: action.payload.id, status: 'connected', error: null },
      };
    case 'PEER_STATUS':
      return {
        ...state,
        peer: {
          ...state.peer,
          status: action.payload.status,
          error: action.payload.error ?? null,
        },
      };
    case 'PEER_ERROR':
      return {
        ...state,
        peer: { ...state.peer, status: 'error', error: action.payload.error },
      };
    case 'CONNECTION_REQUESTED':
      return {
        ...state,
        connections: [
          ...state.connections,
          {
            remotePeerId: action.payload.remotePeerId,
            status: 'connecting',
            error: null,
          },
        ],
      };
    case 'CONNECTION_OPEN': {
      const exists = state.connections.some(
        (c) => c.remotePeerId === action.payload.remotePeerId,
      );
      const connections = exists
        ? state.connections.map((c) =>
            c.remotePeerId === action.payload.remotePeerId
              ? { ...c, status: 'open' as const, error: null }
              : c,
          )
        : [
            ...state.connections,
            {
              remotePeerId: action.payload.remotePeerId,
              status: 'open' as const,
              error: null,
            },
          ];
      return { ...state, connections };
    }
    case 'CONNECTION_CLOSED':
      return {
        ...state,
        connections: action.payload.error
          ? state.connections.map((c) =>
              c.remotePeerId === action.payload.remotePeerId
                ? { ...c, status: 'error', error: action.payload.error ?? null }
                : c,
            )
          : state.connections.filter(
              (c) => c.remotePeerId !== action.payload.remotePeerId,
            ),
      };
    case 'CONNECTION_ERROR':
      return {
        ...state,
        connections: state.connections.map((c) =>
          c.remotePeerId === action.payload.remotePeerId
            ? { ...c, status: 'error' as const, error: action.payload.error }
            : c,
        ),
      };
    case 'TRANSFER_INIT':
      return {
        ...state,
        transfers: {
          ...state.transfers,
          [action.payload.transferId]: action.payload,
        },
      };
    case 'TRANSFER_PROGRESS':
      return {
        ...state,
        transfers: {
          ...state.transfers,
          [action.payload.transferId]: {
            ...state.transfers[action.payload.transferId],
            status: 'transferring',
            receivedChunks: action.payload.receivedChunks,
          },
        },
      };
    case 'TRANSFER_COMPLETE': {
      const existing = state.transfers[action.payload.transferId];
      return {
        ...state,
        transfers: {
          ...state.transfers,
          [action.payload.transferId]: {
            ...existing,
            status: 'complete',
            fileBlob: action.payload.fileBlob,
            objectUrl: action.payload.objectUrl,
          },
        },
      };
    }
    case 'TRANSFER_ERROR':
      return {
        ...state,
        transfers: {
          ...state.transfers,
          [action.payload.transferId]: {
            ...state.transfers[action.payload.transferId],
            status: 'error',
            error: action.payload.error,
          },
        },
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}
