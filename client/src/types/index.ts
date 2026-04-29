// ===== Peer & Connection =====

export type PeerStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface PeerState {
  id: string | null;
  status: PeerStatus;
  error: string | null;
}

export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

export interface ConnectionState {
  remotePeerId: string;
  status: ConnectionStatus;
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

// ===== State / Actions =====

export interface AppState {
  peer: PeerState;
  connections: ConnectionState[];
  transfers: Record<string, TransferState>;
}

export type PeerAction =
  | { type: 'PEER_INIT'; payload: { id: string } }
  | { type: 'PEER_STATUS'; payload: { status: PeerStatus; error?: string } }
  | { type: 'PEER_ERROR'; payload: { error: string } }
  | { type: 'CONNECTION_REQUESTED'; payload: { remotePeerId: string } }
  | { type: 'CONNECTION_OPEN'; payload: { remotePeerId: string } }
  | { type: 'CONNECTION_CLOSED'; payload: { remotePeerId: string; error?: string } }
  | { type: 'CONNECTION_ERROR'; payload: { remotePeerId: string; error: string } }
  | { type: 'TRANSFER_INIT'; payload: TransferState }
  | { type: 'TRANSFER_PROGRESS'; payload: { transferId: string; receivedChunks: number } }
  | { type: 'TRANSFER_COMPLETE'; payload: { transferId: string; fileBlob: Blob; objectUrl: string } }
  | { type: 'TRANSFER_ERROR'; payload: { transferId: string; error: string } }
  | { type: 'RESET' };

// ===== Constants =====

export const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || '0.peerjs.com';
export const SIGNALING_PORT = Number(import.meta.env.VITE_SIGNALING_PORT) || 443;
export const SIGNALING_SECURE = import.meta.env.VITE_SIGNALING_SECURE !== 'false';

export const CHUNK_SIZE = 12 * 1024; // 12KB raw -> ~16KB base64

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
