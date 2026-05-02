import type { ChunkMessage, FileChunkMessage, FileInfoMessage } from '../types';
import type { AppAction } from '../types';
import { reassembleFile } from './chunking';

export const chunksCache = new Map<string, Map<number, string>>();

export function handleIncomingMessage(
  data: unknown,
  remotePeerId: string,
  dispatch: React.Dispatch<AppAction>,
): void {
  const msg = data as ChunkMessage;
  if (!msg || !msg.type) return;

  switch (msg.type) {
    case 'FILE_INFO':
      handleFileInfo(msg, remotePeerId, dispatch);
      break;
    case 'FILE_CHUNK':
      handleFileChunk(msg, remotePeerId, dispatch);
      break;
    case 'FILE_ACK':
      break;
    case 'FILE_ERROR':
      dispatch({
        type: 'TRANSFER_ERROR',
        payload: { transferId: msg.transferId, error: msg.error },
      });
      break;
  }
}

function handleFileInfo(
  msg: FileInfoMessage,
  remotePeerId: string,
  dispatch: React.Dispatch<AppAction>,
): void {
  dispatch({
    type: 'TRANSFER_INIT',
    payload: {
      transferId: msg.transferId,
      direction: 'download',
      fileName: msg.fileName,
      fileType: msg.fileType,
      fileSize: msg.fileSize,
      totalChunks: msg.totalChunks,
      receivedChunks: 0,
      status: 'pending',
      error: null,
      remotePeerId,
    },
  });
  chunksCache.set(msg.transferId, new Map());
}

function handleFileChunk(
  msg: FileChunkMessage,
  remotePeerId: string,
  dispatch: React.Dispatch<AppAction>,
): void {
  let chunks = chunksCache.get(msg.transferId);
  if (!chunks) {
    chunks = new Map();
    chunksCache.set(msg.transferId, chunks);
    dispatch({
      type: 'TRANSFER_INIT',
      payload: {
        transferId: msg.transferId,
        direction: 'download',
        fileName: msg.fileName,
        fileType: msg.fileType,
        fileSize: 0,
        totalChunks: msg.totalChunks,
        receivedChunks: 0,
        status: 'transferring',
        error: null,
        remotePeerId,
      },
    });
  }
  chunks.set(msg.chunkIndex, msg.chunkData);
  dispatch({
    type: 'TRANSFER_PROGRESS',
    payload: { transferId: msg.transferId, receivedChunks: chunks.size },
  });

  if (chunks.size === msg.totalChunks) {
    try {
      const blob = reassembleFile(chunks, msg.fileType);
      const objectUrl = URL.createObjectURL(blob);
      dispatch({
        type: 'TRANSFER_COMPLETE',
        payload: { transferId: msg.transferId, fileBlob: blob, objectUrl },
      });
      chunksCache.delete(msg.transferId);
    } catch (err) {
      dispatch({
        type: 'TRANSFER_ERROR',
        payload: {
          transferId: msg.transferId,
          error: err instanceof Error ? err.message : 'Failed to reassemble file',
        },
      });
      chunksCache.delete(msg.transferId);
    }
  }
}
