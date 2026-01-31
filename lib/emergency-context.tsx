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

interface Person {
  uniqueId: string;
  name?: string;
  lastKnownLocation: { latitude: number; longitude: number } | null;
  lastUpdateTime: Date;
}

interface TsunamiData {
  waterLevel: number; // meters
  waterLevelTimestamp: Date;
  coastalWaterDepth: Record<string, number>; // zone -> depth
  crowdReports: Array<{ location: { lat: number; lng: number }; level: number; timestamp: Date }>;
  safeZones: Array<{ name: string; location: { latitude: number; longitude: number }; altitude: number }>;
}

interface CycloneData {
  eyeLocation: { latitude: number; longitude: number } | null;
  windIntensity: number; // km/h
  windDirection: number; // degrees
  safeExitStatus: 'do-not-move' | 'prepare' | 'safe-to-exit';
  infrastructureStatus: {
    powerGrid: 'operational' | 'partial' | 'down';
    network: 'operational' | 'partial' | 'down';
    floodedRoads: Array<{ road: string; location: { latitude: number; longitude: number } }>;
  };
}

interface EarthquakeData {
  epicenterLocation: { latitude: number; longitude: number } | null;
  magnitude: number;
  intensity: number; // 1-10 scale
  aftershocks: Array<{
    magnitude: number;
    location: { latitude: number; longitude: number };
    timestamp: Date;
    probability: number; // 0-1
  }>;
  structuralRiskZones: Array<{
    zone: string;
    location: { latitude: number; longitude: number };
    riskLevel: 'unsafe' | 'needs-inspection' | 'low-risk';
  }>;
  restrictedRoads: Array<{ road: string; reason: 'debris' | 'cracks' | 'structural' }>;
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
  
  // Disaster Intelligence (NEW)
  // Person tracking
  trackedPeople: Person[];
  addTrackedPerson: (uniqueId: string, name?: string) => void;
  removeTrackedPerson: (uniqueId: string) => void;
  updatePersonLocation: (uniqueId: string, location: { latitude: number; longitude: number }) => void;
  
  // Tsunami intelligence
  tsunamiData: TsunamiData | null;
  setTsunamiData: (data: TsunamiData) => void;
  
  // Cyclone intelligence
  cycloneData: CycloneData | null;
  setCycloneData: (data: CycloneData) => void;
  
  // Earthquake intelligence
  earthquakeData: EarthquakeData | null;
  setEarthquakeData: (data: EarthquakeData) => void;
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
  
  // Disaster intelligence state
  const [trackedPeople, setTrackedPeople] = useState<Person[]>([]);
  const [tsunamiData, setTsunamiData] = useState<TsunamiData | null>(null);
  const [cycloneData, setCycloneData] = useState<CycloneData | null>(null);
  const [earthquakeData, setEarthquakeData] = useState<EarthquakeData | null>(null);

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

  // Disaster intelligence handlers
  const addTrackedPerson = useCallback((uniqueId: string, name?: string) => {
    setTrackedPeople((prev) => {
      if (prev.find((p) => p.uniqueId === uniqueId)) return prev;
      return [
        ...prev,
        {
          uniqueId,
          name,
          lastKnownLocation: null,
          lastUpdateTime: new Date(),
        },
      ];
    });
  }, []);

  const removeTrackedPerson = useCallback((uniqueId: string) => {
    setTrackedPeople((prev) => prev.filter((p) => p.uniqueId !== uniqueId));
  }, []);

  const updatePersonLocation = useCallback((uniqueId: string, location: { latitude: number; longitude: number }) => {
    setTrackedPeople((prev) =>
      prev.map((p) =>
        p.uniqueId === uniqueId
          ? {
              ...p,
              lastKnownLocation: location,
              lastUpdateTime: new Date(),
            }
          : p
      )
    );
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
    trackedPeople,
    addTrackedPerson,
    removeTrackedPerson,
    updatePersonLocation,
    tsunamiData,
    setTsunamiData,
    cycloneData,
    setCycloneData,
    earthquakeData,
    setEarthquakeData,
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
