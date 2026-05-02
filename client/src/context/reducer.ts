import { createContext } from 'react';
import type { AppState, AppAction } from '../types';

export type ReactSet = React.Dispatch<AppAction>;

export interface PeerContextValue {
  state: AppState;
  dispatch: ReactSet;
  createPeer: (options: { sender: boolean; code?: string }) => void;
  connectToPeer: (remoteId: string) => void;
  sendMessage: (message: unknown) => void;
  resetAll: () => void;
}

export const PeerContext = createContext<PeerContextValue | null>(null);

export const initialState: AppState = {
  mode: null,
  code: null,
  peer: { id: null, status: 'idle', error: null, collisionRetries: 0 },
  connection: { status: 'idle', remotePeerId: null, error: null },
  transfers: {},
};

export function peerReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload.mode,
        code: action.payload.code ?? null,
      };

    case 'PEER_READY':
      return {
        ...state,
        peer: { ...state.peer, id: action.payload.id, status: 'ready', error: null },
      };

    case 'PEER_ERROR':
      return {
        ...state,
        peer: { ...state.peer, status: 'error', error: action.payload.error },
      };

    case 'PEER_COLLISION':
      return {
        ...state,
        peer: {
          ...state.peer,
          collisionRetries: state.peer.collisionRetries + 1,
        },
      };

    case 'CONNECTION_CONNECTING':
      return {
        ...state,
        connection: {
          status: 'connecting',
          remotePeerId: action.payload.remotePeerId,
          error: null,
        },
      };

    case 'CONNECTION_OPEN':
      return {
        ...state,
        connection: {
          ...state.connection,
          status: 'open',
          error: null,
        },
      };

    case 'CONNECTION_CLOSED':
      return {
        ...state,
        connection: { status: 'closed', remotePeerId: null, error: null },
      };

    case 'CONNECTION_ERROR':
      return {
        ...state,
        connection: {
          ...state.connection,
          status: 'error',
          error: action.payload.error,
        },
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
