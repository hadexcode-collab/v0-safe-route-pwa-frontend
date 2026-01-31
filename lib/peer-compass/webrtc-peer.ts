'use client';

/**
 * WebRTC Peer Connection for Compass Feature
 * 
 * This module handles P2P communication between two devices using WebRTC DataChannel.
 * One device acts as the initiator (creates the offer), the other joins via room ID.
 * 
 * Data Exchange:
 * - Device orientation (heading from DeviceOrientationEvent or simulated)
 * - Approximate position (lat/lng from Geolocation API or simulated)
 * - Timestamp for coordination
 * 
 * Limitations:
 * - No native RF/hardware access; uses Web APIs only
 * - Accuracy depends on device sensors and GPS availability
 * - This is a proof-of-concept demonstration
 */

export interface PeerData {
  heading: number; // 0-360 degrees (0 = North)
  latitude: number;
  longitude: number;
  timestamp: number;
  deviceId: string;
}

export interface PeerCompassState {
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
  remotePeerData: PeerData | null;
  localPeerData: PeerData | null;
  error: string | null;
}

type PeerEventListener = (state: PeerCompassState) => void;

export class WebRTCPeer {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private roomId: string = '';
  private isInitiator: boolean = false;
  private deviceId: string = '';
  private listeners: Set<PeerEventListener> = new Set();
  private state: PeerCompassState = {
    status: 'idle',
    remotePeerData: null,
    localPeerData: null,
    error: null,
  };

  constructor() {
    this.deviceId = `device-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: PeerEventListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Initialize peer as initiator (creates offer)
   */
  async initiateConnection(roomId: string): Promise<void> {
    try {
      this.roomId = roomId;
      this.isInitiator = true;
      this.state.status = 'connecting';
      this.notifyListeners();

      // Create RTCPeerConnection with STUN servers for NAT traversal
      const config: RTCConfiguration = {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] },
          { urls: ['stun:stun1.l.google.com:19302'] },
        ],
      };

      this.peerConnection = new RTCPeerConnection(config);

      // Create data channel for communication
      this.dataChannel = this.peerConnection.createDataChannel('compass', {
        ordered: true,
      });
      this.setupDataChannel();

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // In production, send ICE candidate to signaling server
          console.log('[Peer Compass] ICE candidate (initiator):', event.candidate.candidate);
        }
      };

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('[Peer Compass] Created offer for room:', roomId);
    } catch (error) {
      this.state.status = 'error';
      this.state.error = `Failed to initiate connection: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Join existing peer connection (creates answer)
   */
  async joinConnection(roomId: string, offerDescription: RTCSessionDescriptionInit): Promise<void> {
    try {
      this.roomId = roomId;
      this.isInitiator = false;
      this.state.status = 'connecting';
      this.notifyListeners();

      const config: RTCConfiguration = {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] },
          { urls: ['stun:stun1.l.google.com:19302'] },
        ],
      };

      this.peerConnection = new RTCPeerConnection(config);

      // Handle incoming data channel
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel();
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[Peer Compass] ICE candidate (joiner):', event.candidate.candidate);
        }
      };

      // Set remote description and create answer
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offerDescription)
      );
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('[Peer Compass] Created answer for room:', roomId);
    } catch (error) {
      this.state.status = 'error';
      this.state.error = `Failed to join connection: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Set up data channel handlers
   */
  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('[Peer Compass] Data channel opened');
      this.state.status = 'connected';
      this.notifyListeners();
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const remotePeerData: PeerData = JSON.parse(event.data);
        this.state.remotePeerData = remotePeerData;
        console.log('[Peer Compass] Received peer data:', remotePeerData);
        this.notifyListeners();
      } catch (error) {
        console.error('[Peer Compass] Failed to parse peer data:', error);
      }
    };

    this.dataChannel.onclose = () => {
      console.log('[Peer Compass] Data channel closed');
      this.state.status = 'disconnected';
      this.state.remotePeerData = null;
      this.notifyListeners();
    };

    this.dataChannel.onerror = (event) => {
      console.error('[Peer Compass] Data channel error:', event);
      this.state.status = 'error';
      this.state.error = `Data channel error: ${event}`;
      this.notifyListeners();
    };
  }

  /**
   * Send local peer data to remote peer
   */
  sendPeerData(peerData: PeerData): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.state.localPeerData = peerData;
        this.dataChannel.send(JSON.stringify(peerData));
        this.notifyListeners();
      } catch (error) {
        console.error('[Peer Compass] Failed to send peer data:', error);
      }
    } else {
      console.warn('[Peer Compass] Data channel not ready. State:', this.dataChannel?.readyState);
    }
  }

  /**
   * Get current state
   */
  getState(): PeerCompassState {
    return { ...this.state };
  }

  /**
   * Disconnect and clean up
   */
  disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.state.status = 'idle';
    this.state.remotePeerData = null;
    this.state.localPeerData = null;
    this.notifyListeners();
  }

  /**
   * Set SDP (Session Description Protocol) for completing handshake
   * In production, this would come from a signaling server
   */
  setRemoteAnswer(answerDescription: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      return Promise.reject(new Error('Peer connection not initialized'));
    }
    return this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(answerDescription)
    );
  }

  /**
   * Add ICE candidate for NAT traversal
   */
  addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      return Promise.reject(new Error('Peer connection not initialized'));
    }
    return this.peerConnection.addIceCandidate(candidate);
  }

  /**
   * Get local description (offer or answer)
   */
  getLocalDescription(): RTCSessionDescription | null {
    return this.peerConnection?.localDescription || null;
  }
}
