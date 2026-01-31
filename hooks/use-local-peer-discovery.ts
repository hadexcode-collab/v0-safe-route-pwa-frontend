'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PeerDevice {
  deviceId: string;
  heading: number | null;
  latitude: number | null;
  longitude: number | null;
  lastSeen: number; // timestamp in ms
}

interface LocalPeerDiscoveryState {
  peers: Map<string, PeerDevice>;
  isAvailable: boolean;
  error: string | null;
}

/**
 * Hook for local peer discovery using BroadcastChannel
 * Devices on the same browser context (same origin) can discover each other
 * Each device broadcasts its location and heading periodically
 */
export function useLocalPeerDiscovery(
  deviceId: string,
  heading: number | null,
  location: { latitude: number; longitude: number } | null
): LocalPeerDiscoveryState {
  const [state, setState] = useState<LocalPeerDiscoveryState>({
    peers: new Map(),
    isAvailable: false,
    error: null,
  });

  const channelRef = useRef<BroadcastChannel | null>(null);
  const broadcastIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const peersRef = useRef<Map<string, PeerDevice>>(new Map());

  // Broadcast local device data
  useEffect(() => {
    if (typeof window === 'undefined' || !deviceId) return;

    // Check if BroadcastChannel is available
    if (typeof BroadcastChannel === 'undefined') {
      setState({
        peers: new Map(),
        isAvailable: false,
        error: 'BroadcastChannel not available',
      });
      return;
    }

    try {
      // Create broadcast channel for peer discovery
      const channel = new BroadcastChannel('saferoute-compass');
      channelRef.current = channel;

      // Handle incoming peer data
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'peer-location') {
          const { deviceId: peerId, heading, latitude, longitude } = event.data;

          // Don't add ourselves
          if (peerId === deviceId) return;

          // Update peer in map
          peersRef.current.set(peerId, {
            deviceId: peerId,
            heading,
            latitude,
            longitude,
            lastSeen: Date.now(),
          });

          setState((prev) => ({
            ...prev,
            peers: new Map(peersRef.current),
          }));
        }
      };

      channel.addEventListener('message', handleMessage);

      setState((prev) => ({
        ...prev,
        isAvailable: true,
        error: null,
      }));

      // Broadcast our location periodically
      broadcastIntervalRef.current = setInterval(() => {
        if (channelRef.current) {
          channelRef.current.postMessage({
            type: 'peer-location',
            deviceId,
            heading,
            latitude: location?.latitude || null,
            longitude: location?.longitude || null,
          });
        }
      }, 1000); // Broadcast every second

      // Clean up stale peers (not seen in 30 seconds)
      cleanupIntervalRef.current = setInterval(() => {
        const now = Date.now();
        let hasChanges = false;

        for (const [peerId, peer] of peersRef.current.entries()) {
          if (now - peer.lastSeen > 30000) {
            peersRef.current.delete(peerId);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          setState((prev) => ({
            ...prev,
            peers: new Map(peersRef.current),
          }));
        }
      }, 5000); // Check every 5 seconds

      return () => {
        if (broadcastIntervalRef.current) {
          clearInterval(broadcastIntervalRef.current);
        }
        if (cleanupIntervalRef.current) {
          clearInterval(cleanupIntervalRef.current);
        }
        channel.removeEventListener('message', handleMessage);
        channel.close();
      };
    } catch (err) {
      setState({
        peers: new Map(),
        isAvailable: false,
        error: err instanceof Error ? err.message : 'Failed to initialize BroadcastChannel',
      });
    }
  }, [deviceId, heading, location]);

  return state;
}
