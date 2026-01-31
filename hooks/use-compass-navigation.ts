'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDeviceId } from './use-device-id';
import { useDeviceOrientation } from './use-device-orientation';
import { useGeolocation } from './use-geolocation';
import { useLocalPeerDiscovery, type PeerDevice } from './use-local-peer-discovery';
import {
  calculateBearing,
  calculateDistance,
  formatDistance,
  getBearingName,
} from '@/lib/peer-compass/bearing';

export interface CompassNavigationData {
  // Device state
  deviceId: string;
  
  // Current device heading and location
  currentHeading: number | null;
  currentLocation: { latitude: number; longitude: number } | null;
  
  // Target device
  targetDeviceId: string | null;
  targetPeer: PeerDevice | null;
  targetBearing: number | null;
  targetDistance: string | null;
  relativeBearing: number | null;
  
  // Discovered peers
  availablePeers: PeerDevice[];
  
  // Status indicators
  compassActive: boolean;
  locationActive: boolean;
  targetConnected: boolean;
  orientationError: string | null;
  locationError: string | null;
  
  // Actions
  setTargetDeviceId: (deviceId: string | null) => void;
}

/**
 * Main compass navigation hook
 * Combines device sensors, peer discovery, and bearing calculations
 */
export function useCompassNavigation(): CompassNavigationData {
  const deviceId = useDeviceId();
  const orientation = useDeviceOrientation();
  const geo = useGeolocation();
  const peerDiscovery = useLocalPeerDiscovery(deviceId, orientation.heading, geo.location ? {
    latitude: geo.location.latitude,
    longitude: geo.location.longitude,
  } : null);

  const [targetDeviceId, setTargetDeviceId] = useState<string | null>(null);

  // Calculate bearing and distance to target peer
  const { targetPeer, targetBearing, targetDistance, relativeBearing, targetConnected } =
    useMemo(() => {
      if (!targetDeviceId || !geo.location || !orientation.heading) {
        return {
          targetPeer: null,
          targetBearing: null,
          targetDistance: null,
          relativeBearing: null,
          targetConnected: false,
        };
      }

      const peer = peerDiscovery.peers.get(targetDeviceId);
      if (!peer || peer.latitude === null || peer.longitude === null) {
        return {
          targetPeer: null,
          targetBearing: null,
          targetDistance: null,
          relativeBearing: null,
          targetConnected: false,
        };
      }

      // Calculate bearing to target device
      const bearing = calculateBearing(
        geo.location.latitude,
        geo.location.longitude,
        peer.latitude,
        peer.longitude
      );

      // Calculate distance to target device
      const distance = calculateDistance(
        geo.location.latitude,
        geo.location.longitude,
        peer.latitude,
        peer.longitude
      );

      // Calculate relative bearing (compensate for device heading)
      let relative = bearing - orientation.heading;
      if (relative > 180) relative -= 360;
      if (relative < -180) relative += 360;

      return {
        targetPeer: peer,
        targetBearing: bearing,
        targetDistance: formatDistance(distance),
        relativeBearing: relative,
        targetConnected: true,
      };
    }, [targetDeviceId, geo.location, orientation.heading, peerDiscovery.peers]);

  // Get all available peers except ourselves
  const availablePeers = useMemo(() => {
    return Array.from(peerDiscovery.peers.values()).filter((peer) => peer.deviceId !== deviceId);
  }, [peerDiscovery.peers, deviceId]);

  return {
    // Device state
    deviceId,

    // Current device
    currentHeading: orientation.heading,
    currentLocation: geo.location,

    // Target device
    targetDeviceId,
    targetPeer,
    targetBearing,
    targetDistance,
    relativeBearing,

    // Available peers
    availablePeers,

    // Status
    compassActive: orientation.isActive && !orientation.isPermissionDenied,
    locationActive: geo.isActive && !geo.isPermissionDenied,
    targetConnected,
    orientationError: orientation.error,
    locationError: geo.error,

    // Actions
    setTargetDeviceId,
  };
}
