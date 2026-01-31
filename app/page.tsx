'use client';

import React, { useState, useEffect } from 'react';
import { EmergencyProvider, useEmergency } from '@/lib/emergency-context';
import { SafeHubProvider, useSafeHub } from '@/lib/safehub-context';
import { setupConnectivityMonitoring, OfflineCacheManager, MOCK_SHELTERS } from '@/lib/offline-cache';
import { EmergencyHome } from '@/components/screens/emergency-home';
import { ShelterScreen } from '@/components/screens/shelter-screen';
import { CompassScreen } from '@/components/screens/compass-screen';
import { FamilyLocatorScreen } from '@/components/screens/family-locator-screen';
import { SOSScreen } from '@/components/screens/sos-screen';
import { SafeHubConfirmation } from '@/components/safehub-confirmation';
import { SafeHubSituationScreen } from '@/components/screens/safehub-situation-screen';
import { cn } from '@/lib/utils';

type Screen = 'home' | 'shelter' | 'compass' | 'family' | 'sos' | 'situation';

function SafeRouteApp() {
  const {
    connectivity,
    setConnectivity,
    shelters,
    setShelters,
    setUserLocation,
  } = useEmergency();

  const { appMode, isConnectedToSafeHub } = useSafeHub();

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [mounted, setMounted] = useState(false);
  const [showSafeHubPrompt, setShowSafeHubPrompt] = useState(false);

  // Initialize offline cache and connectivity monitoring
  useEffect(() => {
    // Initialize cache
    OfflineCacheManager.initializeCache().then(() => {
      console.log('[v0] Offline cache initialized');
    });

    // Setup connectivity monitoring
    const unsubscribe = setupConnectivityMonitoring((status) => {
      setConnectivity(status);
      console.log('[v0] Connectivity status:', status);
    });

    // Load cached shelters on startup
    OfflineCacheManager.getShelters().then((cachedShelters) => {
      if (cachedShelters.length > 0) {
        setShelters(cachedShelters);
        console.log('[v0] Loaded cached shelters:', cachedShelters.length);
      } else {
        // Use mock data if no cache
        setShelters(MOCK_SHELTERS);
        OfflineCacheManager.cacheShelters(MOCK_SHELTERS);
      }
    });

    // Request GPS permission and start tracking
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          console.log('[v0] Location updated:', position.coords);
        },
        (error) => {
          console.warn('[v0] Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }

    setMounted(true);

    return unsubscribe;
  }, [setConnectivity, setShelters, setUserLocation]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4">SafeRoute</div>
          <div className="text-muted-foreground">Initializing...</div>
        </div>
      </div>
    );
  }

  // Screen routing
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <EmergencyHome
            onNavigateToShelter={() => setCurrentScreen('shelter')}
            onNavigateToCompass={() => setCurrentScreen('compass')}
            onNavigateToFamily={() => setCurrentScreen('family')}
            onNavigateToSOS={() => setCurrentScreen('sos')}
          />
        );
      case 'shelter':
        return (
          <ShelterScreen
            onClose={() => setCurrentScreen('home')}
            onSelectShelter={(shelterId) => {
              console.log('[v0] Selected shelter:', shelterId);
            }}
          />
        );
      case 'compass':
        return (
          <CompassScreen
            onClose={() => setCurrentScreen('home')}
            destination="Selected Shelter"
            bearing={45}
            distance={1.2}
          />
        );
      case 'family':
        return (
          <FamilyLocatorScreen onClose={() => setCurrentScreen('home')} />
        );
      case 'sos':
        return (
          <SOSScreen onClose={() => setCurrentScreen('home')} />
        );
      case 'situation':
        return (
          <SafeHubSituationScreen onClose={() => setCurrentScreen('home')} />
        );
      default:
        return <EmergencyHome />;
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-background">
      {/* Mode indicator banner */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 text-xs font-bold',
          appMode === 'awareness'
            ? 'bg-safe text-safe-foreground'
            : 'bg-caution text-caution-foreground'
        )}
      >
        <span>{appMode === 'awareness' ? 'SafeHub Connected' : 'Survival Mode'}</span>
        <div className="flex gap-2">
          {appMode === 'awareness' && (
            <button
              onClick={() => setCurrentScreen('situation')}
              className="px-2 py-1 bg-safe-foreground text-safe rounded text-xs font-bold hover:brightness-110"
            >
              Situation
            </button>
          )}
          {appMode === 'survival' && (
            <button
              onClick={() => setShowSafeHubPrompt(true)}
              className="px-2 py-1 bg-safe text-safe-foreground rounded text-xs font-bold hover:brightness-110"
            >
              At SafeHub?
            </button>
          )}
        </div>
      </div>

      {renderScreen()}

      {/* SafeHub confirmation dialog */}
      <SafeHubConfirmation
        isOpen={showSafeHubPrompt}
        onOpenChange={setShowSafeHubPrompt}
      />
    </div>
  );
}

export default function Page() {
  return (
    <SafeHubProvider>
      <EmergencyProvider>
        <SafeRouteApp />
      </EmergencyProvider>
    </SafeHubProvider>
  );
}
