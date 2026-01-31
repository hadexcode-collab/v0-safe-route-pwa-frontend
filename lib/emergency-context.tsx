'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type UIMode = 'normal' | 'emergency' | 'critical';
export type DisasterType = 'flood' | 'cyclone' | 'earthquake' | 'tsunami' | null;
export type ConnectivityStatus = 'online' | 'degraded' | 'offline';

interface Shelter {
  id: string;
  name: string;
  distance: number;
  bearing: number;
  capacity: number;
  availableSpaces: number;
  type: 'high-ground' | 'indoor' | 'open-space' | 'underground';
  lastUpdated: Date;
}

interface FamilyMember {
  id: string;
  name: string;
  distance: number;
  bearing: number;
  lastSeen: Date;
  status: 'safe' | 'unknown' | 'help-needed';
}

interface EmergencyContextType {
  // UI State
  uiMode: UIMode;
  setUIMode: (mode: UIMode) => void;
  
  // Disaster Context
  disasterType: DisasterType;
  setDisasterType: (type: DisasterType) => void;
  
  // Connectivity
  connectivity: ConnectivityStatus;
  setConnectivity: (status: ConnectivityStatus) => void;
  
  // Data
  shelters: Shelter[];
  setShelters: (shelters: Shelter[]) => void;
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
  
  // User Location
  userLocation: { latitude: number; longitude: number } | null;
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
  
  // GPS Status
  gpsActive: boolean;
  setGPSActive: (active: boolean) => void;
  
  // Emergency triggered
  sosActive: boolean;
  triggerSOS: () => void;
  clearSOS: () => void;
  
  // Accessibility
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  highContrast: boolean;
  textSize: 'normal' | 'large' | 'extra-large';
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
  const [uiMode, setUIMode] = useState<UIMode>('normal');
  const [disasterType, setDisasterType] = useState<DisasterType>(null);
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>('online');
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsActive, setGPSActive] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(true);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'extra-large'>('large');

  const triggerSOS = useCallback(() => {
    setSosActive(true);
    setUIMode('critical');
    
    // Vibrate pattern for SOS (3-3-3 pattern)
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([100, 100, 100, 100, 100, 100, 100, 100, 100]);
    }
  }, [vibrationEnabled]);

  const clearSOS = useCallback(() => {
    setSosActive(false);
  }, []);

  const value: EmergencyContextType = {
    uiMode,
    setUIMode,
    disasterType,
    setDisasterType,
    connectivity,
    setConnectivity,
    shelters,
    setShelters,
    familyMembers,
    setFamilyMembers,
    userLocation,
    setUserLocation,
    gpsActive,
    setGPSActive,
    sosActive,
    triggerSOS,
    clearSOS,
    vibrationEnabled,
    soundEnabled,
    highContrast,
    textSize,
  };

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error('useEmergency must be used within EmergencyProvider');
  }
  return context;
}
