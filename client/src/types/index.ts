// ===== App Mode =====

export type AppMode = 'sender' | 'receiver' | null;

// ===== Peer & Connection =====

export interface PeerState {
  id: string | null;
  status: 'idle' | 'ready' | 'error';
  error: string | null;
  collisionRetries: number;
}

export interface ConnectionState {
  status: 'idle' | 'connecting' | 'open' | 'closed' | 'error';
  remotePeerId: string | null;
  error: string | null;
}

// ===== File Transfer =====

export type TransferDirection = 'upload' | 'download';
export type TransferStatus = 'pending' | 'transferring' | 'complete' | 'error';

export interface TransferState {
  transferId: string;
  direction: TransferDirection;
  fileName: string;
  fileType: string;
  fileSize: number;
  totalChunks: number;
  receivedChunks: number;
  status: TransferStatus;
  error: string | null;
  remotePeerId: string;
  fileBlob?: Blob;
  objectUrl?: string;
}

// ===== Chunk Protocol =====

export type ChunkMessage =
  | FileInfoMessage
  | FileChunkMessage
  | FileAckMessage
  | FileErrorMessage;

export interface FileInfoMessage {
  type: 'FILE_INFO';
  transferId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  totalChunks: number;
}

export interface FileChunkMessage {
  type: 'FILE_CHUNK';
  transferId: string;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
  fileType: string;
  chunkData: string;
}

export interface FileAckMessage {
  type: 'FILE_ACK';
  transferId: string;
}

export interface FileErrorMessage {
  type: 'FILE_ERROR';
  transferId: string;
  error: string;
}

// ===== App State =====

export interface AppState {
  mode: AppMode;
  code: string | null;
  peer: PeerState;
  connection: ConnectionState;
  transfers: Record<string, TransferState>;
}

// ===== Actions =====

export type AppAction =
  | { type: 'SET_MODE'; payload: { mode: 'sender' | 'receiver'; code?: string } }
  | { type: 'PEER_READY'; payload: { id: string } }
  | { type: 'PEER_ERROR'; payload: { error: string } }
  | { type: 'PEER_COLLISION' }
  | { type: 'CONNECTION_CONNECTING'; payload: { remotePeerId: string } }
  | { type: 'CONNECTION_OPEN'; payload: { remotePeerId: string } }
  | { type: 'CONNECTION_CLOSED' }
  | { type: 'CONNECTION_ERROR'; payload: { error: string } }
  | { type: 'TRANSFER_INIT'; payload: TransferState }
  | { type: 'TRANSFER_PROGRESS'; payload: { transferId: string; receivedChunks: number } }
  | { type: 'TRANSFER_COMPLETE'; payload: { transferId: string; fileBlob: Blob; objectUrl: string } }
  | { type: 'TRANSFER_ERROR'; payload: { transferId: string; error: string } }
  | { type: 'RESET' };

// ===== Constants =====

export const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || '0.peerjs.com';
export const SIGNALING_PORT = Number(import.meta.env.VITE_SIGNALING_PORT) || 443;
export const SIGNALING_SECURE = import.meta.env.VITE_SIGNALING_SECURE !== 'false';

export const CHUNK_SIZE = 12 * 1024;
export const MAX_FILE_SIZE = 500 * 1024 * 1024;

export const CODE_MIN = 100000;
export const CODE_MAX = 999999;
export const MAX_COLLISION_RETRIES = 5;
