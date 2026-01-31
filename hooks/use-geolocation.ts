'use client';

import { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationState {
  location: Location | null;
  isActive: boolean;
  isPermissionDenied: boolean;
  error: string | null;
}

/**
 * Hook to track live geolocation using watchPosition
 * Continuously updates as device moves
 * Handles permission requests and errors gracefully
 */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    isActive: false,
    isPermissionDenied: false,
    error: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState({
        location: null,
        isActive: false,
        isPermissionDenied: false,
        error: 'Geolocation not available in this browser',
      });
      return;
    }

    let isMounted = true;
    let watchId: number | null = null;

    const startWatching = () => {
      try {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (isMounted) {
              setState({
                location: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                },
                isActive: true,
                isPermissionDenied: false,
                error: null,
              });
            }
          },
          (error) => {
            if (isMounted) {
              let errorMsg = 'Unknown error';
              let isPermDenied = false;

              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMsg = 'Location permission denied';
                  isPermDenied = true;
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMsg = 'Location position unavailable';
                  break;
                case error.TIMEOUT:
                  errorMsg = 'Location request timeout';
                  break;
              }

              setState({
                location: null,
                isActive: false,
                isPermissionDenied: isPermDenied,
                error: errorMsg,
              });
            }
          },
          {
            enableHighAccuracy: true, // Request high accuracy for navigation
            timeout: 10000, // 10 second timeout
            maximumAge: 1000, // Use cached position if less than 1 second old
          }
        );
      } catch (err) {
        if (isMounted) {
          setState({
            location: null,
            isActive: false,
            isPermissionDenied: false,
            error: err instanceof Error ? err.message : 'Failed to start geolocation',
          });
        }
      }
    };

    startWatching();

    return () => {
      isMounted = false;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return state;
}
