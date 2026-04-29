import type { FileChunkMessage } from '../types';
import { CHUNK_SIZE } from '../types';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[:<>"\/\\|?*]/g, '_');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function chunkFile(
  file: File,
  transferId: string,
  chunkSize: number = CHUNK_SIZE,
): Promise<FileChunkMessage[]> {
  const buffer = await file.arrayBuffer();
  const totalChunks = Math.ceil(buffer.byteLength / chunkSize);
  const chunks: FileChunkMessage[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, buffer.byteLength);
    const slice = buffer.slice(start, end);
    const chunkData = arrayBufferToBase64(slice);

    chunks.push({
      type: 'FILE_CHUNK',
      transferId,
      chunkIndex: i,
      totalChunks,
      fileName: file.name,
      fileType: file.type,
      chunkData,
    });
  }

  return chunks;
}

export function reassembleFile(
  chunks: Map<number, string>,
  fileType: string,
): Blob {
  const chunksList: { index: number; data: string }[] = [];
  chunks.forEach((data, index) => chunksList.push({ index, data }));
  chunksList.sort((a, b) => a.index - b.index);

  const totalSize = chunksList.reduce(
    (sum, c) => sum + atob(c.data).length,
    0,
  );
  const result = new Uint8Array(totalSize);
  let offset = 0;

  for (const { data } of chunksList) {
    const bytes = base64ToArrayBuffer(data);
    result.set(bytes, offset);
    offset += bytes.length;
  }

  return new Blob([result], { type: fileType });
}
