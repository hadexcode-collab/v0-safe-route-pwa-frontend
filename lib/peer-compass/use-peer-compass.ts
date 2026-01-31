'use client';

/**
 * usePeerCompass Hook
 * 
 * This hook manages peer-to-peer compass discovery and direction hints.
 * It handles:
 * - Device orientation tracking (heading)
 * - Geolocation (latitude/longitude)
 * - WebRTC peer connection
 * - Bearing calculations
 * 
 * Usage:
 * const { status, directionHint, distanceEstimate } = usePeerCompass();
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCPeer, PeerData, PeerCompassState } from './webrtc-peer';
import {
  calculateBearing,
  calculateDistance,
  getDirectionHint,
  formatDistance,
} from './bearing';

export interface UsePeerCompassResult {
  // Connection status
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
  
  // Direction hint for user
  directionHint: 'facing-each-other' | 'turn-left' | 'turn-right' | 'not-aligned' | null;
  
  // Distance estimate to peer
  distanceEstimate: string | null;
  
  // Error message if any
  error: string | null;
  
  // Local device data
  localHeading: number | null;
  
  // Remote peer data
  remotePeerData: PeerData | null;
  
  // Actions
  initiateSession: (roomId: string) => Promise<void>;
  joinSession: (roomId: string, offerDescription: RTCSessionDescriptionInit) => Promise<void>;
  disconnect: () => void;
}

export function usePeerCompass(): UsePeerCompassResult {
  const peerRef = useRef<WebRTCPeer | null>(null);
  const orientationListenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  const geoWatchRef = useRef<number | null>(null);

  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
  const [directionHint, setDirectionHint] = useState<'facing-each-other' | 'turn-left' | 'turn-right' | 'not-aligned' | null>(null);
  const [distanceEstimate, setDistanceEstimate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localHeading, setLocalHeading] = useState<number | null>(null);
  const [remotePeerData, setRemotePeerData] = useState<PeerData | null>(null);

  const [localLocation, setLocalLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Fallback simulated heading/location for demo purposes
  const simulatedHeadingRef = useRef<number>(0);
  const simulatedLocationRef = useRef<{ latitude: number; longitude: number }>({
    latitude: 40.7128 + Math.random() * 0.01,
    longitude: -74.006 + Math.random() * 0.01,
  });

  /**
   * Set up device orientation tracking
   * Fallback to simulated heading if DeviceOrientationEvent unavailable
   */
  useEffect(() => {
    // Try to use DeviceOrientationEvent first
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      // webkitCompassHeading is iOS, alpha is standard
      const heading = event.webkitCompassHeading ?? event.alpha ?? 0;
      setLocalHeading(heading);
      simulatedHeadingRef.current = heading;
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      try {
        // Some browsers require user permission
        if ('requestPermission' in DeviceOrientationEvent) {
          DeviceOrientationEvent.requestPermission()
            .then((permission) => {
              if (permission === 'granted') {
                window.addEventListener('deviceorientation', handleDeviceOrientation);
                orientationListenerRef.current = handleDeviceOrientation;
              } else {
                console.warn('[Peer Compass] Device orientation permission denied, using simulated heading');
                startSimulatedHeading();
              }
            })
            .catch((err) => {
              console.warn('[Peer Compass] Failed to request device orientation permission:', err);
              startSimulatedHeading();
            });
        } else {
          // No permission required (Android, older browsers)
          window.addEventListener('deviceorientation', handleDeviceOrientation);
          orientationListenerRef.current = handleDeviceOrientation;
        }
      } catch (err) {
        console.warn('[Peer Compass] DeviceOrientationEvent not available, using simulated heading:', err);
        startSimulatedHeading();
      }
    } else {
      console.warn('[Peer Compass] DeviceOrientationEvent not supported, using simulated heading');
      startSimulatedHeading();
    }

    return () => {
      if (orientationListenerRef.current) {
        window.removeEventListener('deviceorientation', orientationListenerRef.current);
        orientationListenerRef.current = null;
      }
    };
  }, []);

  /**
   * Start simulated heading rotation for demo/fallback
   */
  const startSimulatedHeading = useCallback(() => {
    const interval = setInterval(() => {
      simulatedHeadingRef.current = (simulatedHeadingRef.current + 0.5) % 360;
      setLocalHeading(simulatedHeadingRef.current);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  /**
   * Set up geolocation tracking
   * Fallback to simulated location if GPS unavailable
   */
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        geoWatchRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocalLocation({ latitude, longitude });
            simulatedLocationRef.current = { latitude, longitude };
          },
          (err) => {
            console.warn('[Peer Compass] Geolocation error, using simulated location:', err.message);
            setLocalLocation(simulatedLocationRef.current);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        );
      } catch (err) {
        console.warn('[Peer Compass] Geolocation not available:', err);
        setLocalLocation(simulatedLocationRef.current);
      }
    } else {
      console.warn('[Peer Compass] Geolocation not supported');
      setLocalLocation(simulatedLocationRef.current);
    }

    return () => {
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
    };
  }, []);

  /**
   * Update peer data and send to remote peer
   */
  useEffect(() => {
    if (!peerRef.current || localHeading === null || !localLocation) return;

    // Create local peer data
    const peerData: PeerData = {
      heading: localHeading,
      latitude: localLocation.latitude,
      longitude: localLocation.longitude,
      timestamp: Date.now(),
      deviceId: 'local-device',
    };

    // Send to remote peer periodically
    const interval = setInterval(() => {
      peerData.timestamp = Date.now();
      peerRef.current?.sendPeerData(peerData);
    }, 1000); // Send every second

    return () => clearInterval(interval);
  }, [localHeading, localLocation]);

  /**
   * Update direction hint and distance based on peer data
   */
  useEffect(() => {
    if (!localHeading || !localLocation || !remotePeerData) {
      setDirectionHint(null);
      setDistanceEstimate(null);
      return;
    }

    // Calculate bearing from local to remote
    const bearing = calculateBearing(
      localLocation.latitude,
      localLocation.longitude,
      remotePeerData.latitude,
      remotePeerData.longitude
    );

    // Calculate distance
    const distance = calculateDistance(
      localLocation.latitude,
      localLocation.longitude,
      remotePeerData.latitude,
      remotePeerData.longitude
    );

    // Get direction hint
    const hint = getDirectionHint(localHeading, bearing);
    setDirectionHint(hint);

    // Format distance
    setDistanceEstimate(formatDistance(distance));
  }, [localHeading, localLocation, remotePeerData]);

  /**
   * Subscribe to peer state changes
   */
  useEffect(() => {
    if (!peerRef.current) return;

    const unsubscribe = peerRef.current.subscribe((peerState: PeerCompassState) => {
      setStatus(peerState.status);
      setRemotePeerData(peerState.remotePeerData);
      setError(peerState.error);
    });

    return unsubscribe;
  }, []);

  /**
   * Initiate a new peer session as initiator
   */
  const initiateSession = useCallback(async (roomId: string) => {
    try {
      if (!peerRef.current) {
        peerRef.current = new WebRTCPeer();
      }
      await peerRef.current.initiateConnection(roomId);
    } catch (err) {
      setError(`Failed to initiate session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  /**
   * Join an existing peer session
   */
  const joinSession = useCallback(
    async (roomId: string, offerDescription: RTCSessionDescriptionInit) => {
      try {
        if (!peerRef.current) {
          peerRef.current = new WebRTCPeer();
        }
        await peerRef.current.joinConnection(roomId, offerDescription);
      } catch (err) {
        setError(`Failed to join session: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    []
  );

  /**
   * Disconnect from peer
   */
  const disconnect = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.disconnect();
    }
    setDirectionHint(null);
    setDistanceEstimate(null);
    setRemotePeerData(null);
  }, []);

  return {
    status,
    directionHint,
    distanceEstimate,
    error,
    localHeading,
    remotePeerData,
    initiateSession,
    joinSession,
    disconnect,
  };
}
