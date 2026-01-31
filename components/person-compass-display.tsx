'use client';

import React, { useEffect, useState } from 'react';
import { usePersonLockedCompass } from '@/hooks/use-person-locked-compass';
import { useEmergency } from '@/lib/emergency-context';
import { cn } from '@/lib/utils';

export function PersonCompassDisplay() {
  const {
    isLocked,
    targetPersonName,
    bearingToTarget,
    distanceToTarget,
    signalFreshness,
    lastUpdateTime,
    unlockCompass,
    isWarningActive,
  } = usePersonLockedCompass();

  const [deviceBearing, setDeviceBearing] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Track device compass heading
  useEffect(() => {
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (typeof event.alpha === 'number') {
        const heading = Math.round(((event.alpha % 360) + 360) % 360);
        setDeviceBearing(heading);
      }
    };

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permission: string) => {
          if (permission === 'granted') {
            window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
          }
        });
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
    };
  }, []);

  // Calculate relative bearing from device orientation
  useEffect(() => {
    if (bearingToTarget === null) return;
    const relative = (bearingToTarget - deviceBearing + 360) % 360;
    setRotationAngle(relative);
  }, [bearingToTarget, deviceBearing]);

  if (!isLocked) {
    return null;
  }

  const formatDistance = (meters: number | null) => {
    if (meters === null) return 'calculating...';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'unknown';
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (diffMins === 0) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      {/* Warning banner */}
      {isWarningActive && (
        <div className="fixed top-0 left-0 right-0 px-4 py-3 bg-danger text-danger-foreground font-bold text-center">
          SafeHub connection lost - Compass will unlock in 5 seconds
        </div>
      )}

      <div className="max-w-md w-full space-y-4">
        {/* Person header */}
        <div className="bg-card border-4 border-safe rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground">Tracking Person</div>
          <div className="text-2xl font-bold text-safe mt-1">{targetPersonName}</div>
        </div>

        {/* Compass arrow visualization */}
        <div className="flex justify-center">
          <div className="relative w-48 h-48 rounded-full border-4 border-foreground bg-card flex items-center justify-center overflow-hidden">
            {/* Direction markers */}
            <div className="absolute top-2 text-xs font-bold">N</div>
            <div className="absolute right-2 text-xs font-bold">E</div>
            <div className="absolute bottom-2 text-xs font-bold">S</div>
            <div className="absolute left-2 text-xs font-bold">W</div>

            {/* Center circle */}
            <div className="absolute w-6 h-6 bg-safe rounded-full z-10" />

            {/* Arrow pointing to target */}
            {bearingToTarget !== null && (
              <div
                className="absolute w-2 h-32 bg-gradient-to-t from-transparent to-safe rounded-full origin-bottom transition-transform"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                }}
              />
            )}
          </div>
        </div>

        {/* Distance and signal info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border-2 border-foreground rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Distance</div>
            <div className="text-lg font-bold text-foreground">{formatDistance(distanceToTarget)}</div>
          </div>
          <div className={cn(
            'rounded-lg p-3 text-center font-bold border-2',
            signalFreshness === 'fresh'
              ? 'bg-safe/20 border-safe text-safe'
              : 'bg-caution/20 border-caution text-caution'
          )}>
            <div className="text-xs mb-1">{signalFreshness === 'fresh' ? 'Fresh' : 'Stale'}</div>
            <div className="text-sm">{formatTime(lastUpdateTime)}</div>
          </div>
        </div>

        {/* Unlock button */}
        <button
          onClick={unlockCompass}
          className="w-full px-4 py-3 bg-danger text-danger-foreground rounded-lg font-bold text-lg hover:brightness-110 transition-all"
        >
          Unlock Compass
        </button>
      </div>
    </div>
  );
}
