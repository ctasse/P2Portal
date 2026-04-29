import { useContext, useCallback, useRef } from 'react';
import { PeerContext } from '../context/reducer';
import { chunkFile, generateId, sanitizeFileName } from '../utils/chunking';
import { MAX_FILE_SIZE } from '../types';
import type { FileInfoMessage } from '../types';

export function useFileTransfer() {
  const ctx = useContext(PeerContext);
  if (!ctx) throw new Error('useFileTransfer must be used within PeerProvider');

  const { state, dispatch, connectionsRef } = ctx;
  const activeTransfers = useRef<Map<string, boolean>>(new Map());

  const sendFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = 'length' in files ? Array.from(files) : [files];
      const firstConn = connectionsRef.current.values().next().value;
      if (!firstConn) return;

      for (const file of fileArray) {
        if (file.size > MAX_FILE_SIZE) {
          dispatch({
            type: 'TRANSFER_ERROR',
            payload: {
              transferId: generateId(),
              error: `File "${file.name}" exceeds 500MB limit`,
            },
          });
          continue;
        }

        const transferId = generateId();
        const fileName = sanitizeFileName(file.name);

        dispatch({
          type: 'TRANSFER_INIT',
          payload: {
            transferId,
            direction: 'upload',
            fileName,
            fileType: file.type,
            fileSize: file.size,
            totalChunks: Math.ceil(file.size / (12 * 1024)),
            receivedChunks: 0,
            status: 'pending',
            error: null,
            remotePeerId: firstConn.peer,
          },
        });

        try {
          dispatch({
            type: 'TRANSFER_INIT',
            payload: {
              transferId,
              direction: 'upload',
              fileName,
              fileType: file.type,
              fileSize: file.size,
              totalChunks: Math.ceil(file.size / (12 * 1024)),
              receivedChunks: 0,
              status: 'transferring',
              error: null,
              remotePeerId: firstConn.peer,
            },
          });

          const info: FileInfoMessage = {
            type: 'FILE_INFO',
            transferId,
            fileName,
            fileType: file.type,
            fileSize: file.size,
            totalChunks: Math.ceil(file.size / (12 * 1024)),
          };
          firstConn.send(info);

          const chunks = await chunkFile(file, transferId);
          activeTransfers.current.set(transferId, true);

          for (let i = 0; i < chunks.length; i++) {
            if (!activeTransfers.current.get(transferId)) break;
            firstConn.send(chunks[i]);
            if (i % 10 === 0 || i === chunks.length - 1) {
              dispatch({
                type: 'TRANSFER_PROGRESS',
                payload: { transferId, receivedChunks: i + 1 },
              });
            }
            await new Promise((r) => setTimeout(r, 0));
          }

          if (activeTransfers.current.get(transferId)) {
            dispatch({
              type: 'TRANSFER_COMPLETE',
              payload: {
                transferId,
                fileBlob: new Blob(),
                objectUrl: '',
              },
            });
          }
        } catch (err) {
          dispatch({
            type: 'TRANSFER_ERROR',
            payload: {
              transferId,
              error:
                err instanceof Error ? err.message : 'Failed to send file',
            },
          });
        } finally {
          activeTransfers.current.delete(transferId);
        }
      }
    },
    [connectionsRef, dispatch],
  );

  const clearTransfers = useCallback(() => {
    for (const t of Object.values(state.transfers)) {
      if (t.objectUrl) URL.revokeObjectURL(t.objectUrl);
    }
    dispatch({ type: 'RESET' });
  }, [state.transfers, dispatch]);

  const transfers = Object.values(state.transfers).sort(
    (a, b) => a.transferId.localeCompare(b.transferId),
  );

  return { transfers, sendFiles, clearTransfers };
}
