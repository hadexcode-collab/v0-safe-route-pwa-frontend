'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CompassNavigationProps {
  bearing?: number;
  distance?: number;
  destination?: string;
  direction?: string;
  isActive?: boolean;
}

export function CompassNavigation({
  bearing = 0,
  distance = 0,
  destination = 'Safety Zone',
  direction = 'N',
  isActive = false,
}: CompassNavigationProps) {
  const [deviceBearing, setDeviceBearing] = useState(0);
  const [compassActive, setCompassActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (typeof event.alpha === 'number') {
        setDeviceBearing(Math.round(event.alpha));
      }
    };

    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permission: string) => {
          if (permission === 'granted') {
            setCompassActive(true);
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        })
        .catch(() => setCompassActive(false));
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      setCompassActive(true);
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [isActive]);

  const getCompassDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getTextDirection = (bearing: number): string => {
    if (bearing >= 337.5 || bearing < 22.5) return 'North';
    if (bearing >= 22.5 && bearing < 67.5) return 'North-East';
    if (bearing >= 67.5 && bearing < 112.5) return 'East';
    if (bearing >= 112.5 && bearing < 157.5) return 'South-East';
    if (bearing >= 157.5 && bearing < 202.5) return 'South';
    if (bearing >= 202.5 && bearing < 247.5) return 'South-West';
    if (bearing >= 247.5 && bearing < 292.5) return 'West';
    return 'North-West';
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full">
      {/* Compass Ring */}
      <div className="relative w-48 h-48 rounded-full border-4 border-foreground bg-card flex items-center justify-center">
        {/* Cardinal Directions */}
        <div className="absolute top-4 text-2xl font-bold text-danger">N</div>
        <div className="absolute bottom-4 text-2xl font-bold text-foreground">S</div>
        <div className="absolute left-4 text-2xl font-bold text-foreground">W</div>
        <div className="absolute right-4 text-2xl font-bold text-foreground">E</div>

        {/* Arrow pointing to destination */}
        <div
          className="absolute w-1 h-20 bg-safe rounded-full transition-transform"
          style={{
            transform: `rotate(${bearing}deg)`,
            transformOrigin: 'bottom center',
            bottom: '50%',
          }}
        />

        {/* Center dot */}
        <div className="w-6 h-6 bg-primary rounded-full" />

        {/* Device bearing indicator (subtle background) */}
        {compassActive && (
          <div
            className="absolute inset-0 rounded-full border-2 border-muted opacity-30 transition-transform"
            style={{
              transform: `rotate(${deviceBearing}deg)`,
            }}
          />
        )}
      </div>

      {/* Bearing Text */}
      <div className="text-center">
        <div className="text-5xl font-bold text-safe">
          {Math.round(bearing)}°
        </div>
        <div className="text-2xl font-bold text-foreground mt-2">
          {getTextDirection(bearing)}
        </div>
      </div>

      {/* Distance */}
      {distance > 0 && (
        <div className="text-3xl font-bold text-caution">
          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
        </div>
      )}

      {/* Destination Label */}
      <div className="text-xl text-foreground">
        to <span className="font-bold">{destination}</span>
      </div>

      {/* Navigation Instructions */}
      <div className="bg-card border-2 border-foreground rounded-lg p-4 text-center w-full">
        <div className="text-sm text-muted-foreground">Step-by-step:</div>
        <div className="text-2xl font-bold text-foreground mt-2">
          Go <span className="text-safe">{getTextDirection(bearing)}</span> for{' '}
          <span className="text-caution">
            {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
          </span>
        </div>
      </div>

      {/* GPS Status */}
      <div className="text-sm text-muted-foreground">
        {compassActive ? (
          <span className="text-safe">✓ Compass Active</span>
        ) : (
          <span className="text-caution">⚠ Compass Unavailable</span>
        )}
      </div>
    </div>
  );
}
