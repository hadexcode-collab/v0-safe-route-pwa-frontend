'use client';

import { useState, useEffect } from 'react';

interface DeviceOrientationState {
  heading: number | null; // 0-360 degrees, null if unavailable
  isActive: boolean;
  isPermissionDenied: boolean;
  error: string | null;
}

/**
 * Hook to track live device orientation (compass heading)
 * Uses deviceorientationabsolute for absolute compass heading
 * Falls back to deviceorientation if needed
 * Handles iOS permission requests
 */
export function useDeviceOrientation(): DeviceOrientationState {
  const [state, setState] = useState<DeviceOrientationState>({
    heading: null,
    isActive: false,
    isPermissionDenied: false,
    error: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let watchId: number | null = null;

    const startListening = async () => {
      try {
        // Request permission on iOS 13+
        if (
          typeof DeviceOrientationEvent !== 'undefined' &&
          typeof (DeviceOrientationEvent as any).requestPermission === 'function'
        ) {
          try {
            const permission = await (DeviceOrientationEvent as any).requestPermission();
            if (permission !== 'granted') {
              if (isMounted) {
                setState({
                  heading: null,
                  isActive: false,
                  isPermissionDenied: true,
                  error: 'Device orientation permission denied',
                });
              }
              return;
            }
          } catch (err) {
            if (isMounted) {
              setState({
                heading: null,
                isActive: false,
                isPermissionDenied: true,
                error: 'Failed to request permission',
              });
            }
            return;
          }
        }

        // Try deviceorientationabsolute first (absolute compass heading)
        const handleAbsoluteOrientation = (event: DeviceOrientationEvent) => {
          if (typeof event.alpha === 'number') {
            // alpha is the Z axis rotation (0-360)
            // Normalize to 0-360 range
            const heading = ((event.alpha % 360) + 360) % 360;
            if (isMounted) {
              setState({
                heading,
                isActive: true,
                isPermissionDenied: false,
                error: null,
              });
            }
          }
        };

        // Try the standard deviceorientation event (relative to Earth's magnetic field)
        const handleRelativeOrientation = (event: DeviceOrientationEvent) => {
          if (typeof event.alpha === 'number') {
            const heading = ((event.alpha % 360) + 360) % 360;
            if (isMounted) {
              setState({
                heading,
                isActive: true,
                isPermissionDenied: false,
                error: null,
              });
            }
          }
        };

        // Prefer absolute orientation if available
        if (window.addEventListener) {
          // First try absolute
          window.addEventListener('deviceorientationabsolute', handleAbsoluteOrientation, true);
          
          // Fallback to relative
          const checkAbsoluteSupport = setTimeout(() => {
            // If we haven't received an event, try relative
            if (state.heading === null && isMounted) {
              window.removeEventListener('deviceorientationabsolute', handleAbsoluteOrientation, true);
              window.addEventListener('deviceorientation', handleRelativeOrientation, true);
            }
          }, 500);

          // Cleanup timeout on unmount
          return () => {
            clearTimeout(checkAbsoluteSupport);
            window.removeEventListener('deviceorientationabsolute', handleAbsoluteOrientation, true);
            window.removeEventListener('deviceorientation', handleRelativeOrientation, true);
          };
        }
      } catch (err) {
        if (isMounted) {
          setState({
            heading: null,
            isActive: false,
            isPermissionDenied: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    };

    startListening();

    return () => {
      isMounted = false;
      if (watchId !== null) {
        clearInterval(watchId);
      }
    };
  }, []);

  return state;
}
