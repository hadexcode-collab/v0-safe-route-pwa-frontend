'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { useSafeHub } from '@/lib/safehub-context';

export interface PersonLockedCompassState {
  isLocked: boolean;
  targetPersonId: string | null;
  targetPersonName: string | null;
  bearingToTarget: number | null;
  distanceToTarget: number | null;
  signalFreshness: 'fresh' | 'stale' | 'unknown'; // fresh: < 1 min, stale: >= 1 min
  lastUpdateTime: Date | null;
  lockCompass: (personId: string, name?: string) => void;
  unlockCompass: () => void;
  isWarningActive: boolean; // Show warning when SafeHub connection lost
}

/**
 * Hook for person-locked compass mode
 * Locks compass bearing toward a specific person's last known location
 * Automatically unlocks if SafeHub connection is lost
 */
export function usePersonLockedCompass(): PersonLockedCompassState {
  const { trackedPeople, updatePersonLocation, userLocation } = useEmergency();
  const { appMode, isConnectedToSafeHub } = useSafeHub();

  const [isLocked, setIsLocked] = useState(false);
  const [targetPersonId, setTargetPersonId] = useState<string | null>(null);
  const [targetPersonName, setTargetPersonName] = useState<string | null>(null);
  const [bearingToTarget, setBearingToTarget] = useState<number | null>(null);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isWarningActive, setIsWarningActive] = useState(false);

  // Haversine formula to calculate distance and bearing between two points
  const calculateBearingAndDistance = useCallback(
    (
      userLat: number,
      userLng: number,
      targetLat: number,
      targetLng: number
    ) => {
      const R = 6371; // Earth radius in km

      const lat1 = (userLat * Math.PI) / 180;
      const lat2 = (targetLat * Math.PI) / 180;
      const dLng = ((targetLng - userLng) * Math.PI) / 180;

      // Calculate bearing
      const y = Math.sin(dLng) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
      const bearing = (Math.atan2(y, x) * 180) / Math.PI;
      const normalizedBearing = (bearing + 360) % 360;

      // Calculate distance
      const dLat = lat2 - lat1;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
                Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return { bearing: normalizedBearing, distance };
    },
    []
  );

  // Lock compass to a person
  const lockCompass = useCallback(
    (personId: string, name?: string) => {
      if (appMode !== 'awareness') {
        console.warn('[v0] Person-locked compass requires SafeHub connection');
        return;
      }
      setIsLocked(true);
      setTargetPersonId(personId);
      setTargetPersonName(name || personId);
      setIsWarningActive(false);
    },
    [appMode]
  );

  // Unlock compass
  const unlockCompass = useCallback(() => {
    setIsLocked(false);
    setTargetPersonId(null);
    setTargetPersonName(null);
    setBearingToTarget(null);
    setDistanceToTarget(null);
    setIsWarningActive(false);
  }, []);

  // Check SafeHub connection and auto-unlock if disconnected
  useEffect(() => {
    if (isLocked && !isConnectedToSafeHub && appMode === 'survival') {
      console.log('[v0] SafeHub connection lost - unlocking compass');
      setIsWarningActive(true);
      // Auto-unlock after 5 seconds to allow user to see warning
      const timeout = setTimeout(() => {
        unlockCompass();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isLocked, isConnectedToSafeHub, appMode, unlockCompass]);

  // Calculate bearing and distance to target person
  useEffect(() => {
    if (!isLocked || !targetPersonId || !userLocation) {
      return;
    }

    const targetPerson = trackedPeople.find((p) => p.uniqueId === targetPersonId);
    if (!targetPerson || !targetPerson.lastKnownLocation) {
      setBearingToTarget(null);
      setDistanceToTarget(null);
      return;
    }

    const { bearing, distance } = calculateBearingAndDistance(
      userLocation.latitude,
      userLocation.longitude,
      targetPerson.lastKnownLocation.latitude,
      targetPerson.lastKnownLocation.longitude
    );

    setBearingToTarget(Math.round(bearing));
    setDistanceToTarget(Math.round(distance * 1000)); // Convert to meters
    setLastUpdateTime(targetPerson.lastUpdateTime);
  }, [isLocked, targetPersonId, userLocation, trackedPeople, calculateBearingAndDistance]);

  // Determine signal freshness
  const signalFreshness: 'fresh' | 'stale' | 'unknown' = (() => {
    if (!lastUpdateTime) return 'unknown';
    const ageMs = Date.now() - lastUpdateTime.getTime();
    const ageMinutes = ageMs / (1000 * 60);
    return ageMinutes < 1 ? 'fresh' : 'stale';
  })();

  return {
    isLocked,
    targetPersonId,
    targetPersonName,
    bearingToTarget,
    distanceToTarget,
    signalFreshness,
    lastUpdateTime,
    lockCompass,
    unlockCompass,
    isWarningActive,
  };
}
