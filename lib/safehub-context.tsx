'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AppMode = 'survival' | 'awareness';

interface SafeHubContextType {
  // SafeHub connection state
  isConnectedToSafeHub: boolean;
  safeHubSSID: string | null;
  
  // App operating mode
  appMode: AppMode;
  
  // SafeHub data (only available when connected)
  safeHubLocation: { latitude: number; longitude: number } | null;
  safeHubName: string | null;
  
  // Manual SafeHub confirmation
  manuallyConfirmed: boolean;
  confirmSafeHub: (ssid: string, name?: string) => void;
  clearSafeHubConfirmation: () => void;
}

const SafeHubContext = createContext<SafeHubContextType | undefined>(undefined);

export function SafeHubProvider({ children }: { children: React.ReactNode }) {
  const [isConnectedToSafeHub, setIsConnectedToSafeHub] = useState(false);
  const [safeHubSSID, setSafeHubSSID] = useState<string | null>(null);
  const [safeHubLocation, setSafeHubLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [safeHubName, setSafeHubName] = useState<string | null>(null);
  const [manuallyConfirmed, setManuallyConfirmed] = useState(false);

  // List of known SafeHub SSIDs - can be extended
  const SAFEHUB_SSIDS = ['SafeHub-Verified', 'SafeHub-Network', 'SafeHub-Primary'];

  // Check for SafeHub Wi-Fi connection
  useEffect(() => {
    const checkSafeHubConnection = async () => {
      try {
        // Try to get Wi-Fi information (limited support in browsers)
        // This is a progressive enhancement - most browsers don't expose Wi-Fi details
        // We use manual confirmation as the primary method
        
        // Check localStorage for manual confirmation
        const stored = localStorage.getItem('safehub-confirmed');
        if (stored) {
          const { ssid, name, timestamp } = JSON.parse(stored);
          // Consider confirmation valid for 24 hours
          const isStillValid = Date.now() - timestamp < 24 * 60 * 60 * 1000;
          if (isStillValid) {
            setSafeHubSSID(ssid);
            setSafeHubName(name);
            setIsConnectedToSafeHub(true);
          }
        }
      } catch (err) {
        console.warn('[v0] SafeHub detection error:', err);
      }
    };

    checkSafeHubConnection();
    // Check every 30 seconds for changes
    const interval = setInterval(checkSafeHubConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const confirmSafeHub = useCallback((ssid: string, name?: string) => {
    setSafeHubSSID(ssid);
    setSafeHubName(name || ssid);
    setManuallyConfirmed(true);
    setIsConnectedToSafeHub(true);

    // Store confirmation for 24 hours
    localStorage.setItem(
      'safehub-confirmed',
      JSON.stringify({
        ssid,
        name: name || ssid,
        timestamp: Date.now(),
      })
    );

    console.log('[v0] SafeHub confirmed:', ssid);
  }, []);

  const clearSafeHubConfirmation = useCallback(() => {
    setIsConnectedToSafeHub(false);
    setSafeHubSSID(null);
    setSafeHubName(null);
    setManuallyConfirmed(false);
    localStorage.removeItem('safehub-confirmed');
    console.log('[v0] SafeHub confirmation cleared');
  }, []);

  // Determine app mode based on SafeHub connection
  const appMode: AppMode = isConnectedToSafeHub ? 'awareness' : 'survival';

  const value: SafeHubContextType = {
    isConnectedToSafeHub,
    safeHubSSID,
    appMode,
    safeHubLocation,
    safeHubName,
    manuallyConfirmed,
    confirmSafeHub,
    clearSafeHubConfirmation,
  };

  return <SafeHubContext.Provider value={value}>{children}</SafeHubContext.Provider>;
}

export function useSafeHub() {
  const context = useContext(SafeHubContext);
  if (!context) {
    throw new Error('useSafeHub must be used within SafeHubProvider');
  }
  return context;
}
