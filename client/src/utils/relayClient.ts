export type RelayRole = 'sender' | 'receiver';

export interface RelayClientCallbacks {
  onOpen: () => void;
  onMessage: (data: unknown) => void;
  onClose: () => void;
  onError: (error: string) => void;
}

export class RelayClient {
  private ws: WebSocket | null = null;

  connect(url: string, room: string, role: RelayRole, callbacks: RelayClientCallbacks): void {
    this.disconnect();

    const wsUrl = `${url.replace(/\/+$/, '')}/ws?room=${encodeURIComponent(room)}&role=${role}`;

    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        callbacks.onOpen();
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          callbacks.onMessage(data);
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        if (this.ws === ws) {
          this.ws = null;
          callbacks.onClose();
        }
      };

      ws.onerror = () => {
        callbacks.onError('WebSocket connection failed');
      };
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : 'Failed to create WebSocket');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close(1000);
      this.ws = null;
    }
  }

  send(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}
