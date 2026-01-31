'use client';

import { useState, useEffect } from 'react';

const DEVICE_ID_KEY = 'saferoute-device-id';

/**
 * Generate a random 8-character device ID
 */
function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Hook to get or create a unique device ID
 * Stores in localStorage for persistence across reloads
 */
export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    // Check if ID already exists in localStorage
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      
      if (!id) {
        // Generate new ID if it doesn't exist
        id = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      
      setDeviceId(id);
    }
  }, []);

  return deviceId;
}
