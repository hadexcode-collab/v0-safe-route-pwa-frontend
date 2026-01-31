/**
 * WebSocket Client for Peer Communication
 * Connects to ws://10.144.1.141:8080 relay server
 * Handles P2P data exchange (heading, location, timestamp)
 */

export interface PeerDeviceData {
  heading: number;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
}

type OnDataCallback = (data: PeerDeviceData) => void;

export class WSClient {
  private ws: WebSocket | null = null;
  private url: string = 'ws://10.144.1.141:8080';
  private onDataCallback: OnDataCallback | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 1000;
  private messageQueue: unknown[] = [];
  private isConnecting: boolean = false;

  /**
   * Connect to WebSocket relay server
   */
  public connectPeer(onData: OnDataCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.onDataCallback = onData;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[v0] WebSocket connected to relay server');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (this.isValidPeerData(data)) {
              this.onDataCallback?.(data);
            }
          } catch (err) {
            console.warn('[v0] Failed to parse peer data:', err);
          }
        };

        this.ws.onerror = (err) => {
          console.error('[v0] WebSocket error:', err);
          this.isConnecting = false;
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = () => {
          console.log('[v0] WebSocket disconnected');
          this.isConnecting = false;
          this.ws = null;
          this.attemptReconnect();
        };

        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
            this.ws?.close();
          }
        }, 5000);
      } catch (err) {
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  /**
   * Send peer data to remote device via relay server
   */
  public sendPeer(data: PeerDeviceData): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(data);
      return;
    }

    try {
      this.ws.send(JSON.stringify(data));
    } catch (err) {
      console.warn('[v0] Failed to send peer data:', err);
      this.messageQueue.push(data);
    }
  }

  /**
   * Disconnect from relay server
   */
  public disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Validate incoming peer data structure
   */
  private isValidPeerData(data: unknown): data is PeerDeviceData {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.heading === 'number' &&
      typeof obj.timestamp === 'number' &&
      obj.location &&
      typeof (obj.location as Record<string, unknown>).latitude === 'number' &&
      typeof (obj.location as Record<string, unknown>).longitude === 'number'
    );
  }

  /**
   * Attempt to reconnect after disconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[v0] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[v0] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (this.onDataCallback) {
        this.connectPeer(this.onDataCallback).catch((err) => {
          console.warn('[v0] Reconnection failed:', err);
        });
      }
    }, delay);
  }

  /**
   * Flush queued messages when connection is established
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      try {
        this.ws.send(JSON.stringify(message));
      } catch (err) {
        console.warn('[v0] Failed to flush queued message:', err);
        break;
      }
    }
  }

  /**
   * Get current connection status
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WSClient();
