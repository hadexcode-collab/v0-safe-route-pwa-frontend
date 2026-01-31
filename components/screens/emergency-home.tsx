'use client';

import React, { useState } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { EmergencyButton } from '@/components/emergency-button';
import { cn } from '@/lib/utils';

interface EmergencyHomeProps {
  onNavigateToShelter?: () => void;
  onNavigateToCompass?: () => void;
  onNavigateToFamily?: () => void;
  onNavigateToSOS?: () => void;
}

export function EmergencyHome({
  onNavigateToShelter,
  onNavigateToCompass,
  onNavigateToFamily,
  onNavigateToSOS,
}: EmergencyHomeProps) {
  const { connectivity, disasterType, setDisasterType, uiMode, setUIMode, gpsActive, setGPSActive } = useEmergency();
  const [showDisasterMenu, setShowDisasterMenu] = useState(false);

  const handleDisasterSelect = (type: 'flood' | 'cyclone' | 'earthquake' | 'tsunami') => {
    setDisasterType(type);
    setUIMode('emergency');
    setShowDisasterMenu(false);
  };

  const getDisasterLabel = (type: string | null) => {
    const labels = {
      flood: 'Flood Alert',
      cyclone: 'Cyclone Alert',
      earthquake: 'Earthquake Alert',
      tsunami: 'Tsunami Alert',
    };
    return labels[type as keyof typeof labels] || 'Emergency Mode';
  };

  const getConnectivityColor = (status: string) => {
    return {
      online: 'bg-safe',
      degraded: 'bg-caution',
      offline: 'bg-danger',
    }[status];
  };

  // Disaster selection menu
  if (showDisasterMenu && !disasterType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Emergency Alert</h1>
          <p className="text-foreground text-lg">Select disaster type:</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <EmergencyButton
            variant="danger"
            size="lg"
            label="Flood"
            onClick={() => handleDisasterSelect('flood')}
          />
          <EmergencyButton
            variant="danger"
            size="lg"
            label="Cyclone"
            onClick={() => handleDisasterSelect('cyclone')}
          />
          <EmergencyButton
            variant="danger"
            size="lg"
            label="Earthquake"
            onClick={() => handleDisasterSelect('earthquake')}
          />
          <EmergencyButton
            variant="danger"
            size="lg"
            label="Tsunami"
            onClick={() => handleDisasterSelect('tsunami')}
          />
        </div>

        <button
          onClick={() => setShowDisasterMenu(false)}
          className="text-muted-foreground underline mt-4"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-background p-4">
      {/* Header with Status */}
      <div className="w-full space-y-3">
        {/* Connectivity Status */}
        <div className="flex items-center justify-between px-4 py-2 bg-card rounded-lg border border-border">
          <span className="text-sm text-muted-foreground">Connection:</span>
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', getConnectivityColor(connectivity))} />
            <span className="text-sm font-bold text-foreground capitalize">{connectivity}</span>
          </div>
        </div>

        {/* Disaster Alert */}
        {disasterType && (
          <div className="px-4 py-3 bg-danger/20 border-2 border-danger rounded-lg">
            <div className="text-sm text-danger-foreground font-bold">
              {getDisasterLabel(disasterType)} Active
            </div>
          </div>
        )}

        {/* GPS Status */}
        <div className="flex items-center justify-between px-4 py-2 bg-card rounded-lg border border-border">
          <span className="text-sm text-muted-foreground">GPS:</span>
          <button
            onClick={() => setGPSActive(!gpsActive)}
            className={cn(
              'px-3 py-1 rounded font-bold text-sm transition-colors',
              gpsActive
                ? 'bg-safe text-safe-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {gpsActive ? 'Active' : 'Off'}
          </button>
        </div>
      </div>

      {/* Main Action Buttons - Emergency Mode */}
      <div className="flex flex-col gap-4 w-full">
        {disasterType && (
          <>
            {/* Emergency Grid */}
            <div className="grid grid-cols-2 gap-4">
              <EmergencyButton
                variant="safe"
                size="xl"
                label="Find Shelter"
                onClick={onNavigateToShelter}
              />
              <EmergencyButton
                variant="primary"
                size="xl"
                label="Compass"
                onClick={onNavigateToCompass}
              />
              <EmergencyButton
                variant="caution"
                size="xl"
                label="Find Family"
                onClick={onNavigateToFamily}
              />
              <EmergencyButton
                variant="danger"
                size="xl"
                label="SOS"
                onClick={onNavigateToSOS}
              />
            </div>

            {/* Secondary Actions */}
            <div className="space-y-2">
              <button
                onClick={() => setDisasterType(null)}
                className="w-full px-4 py-3 bg-card border-2 border-foreground rounded-lg text-foreground font-bold hover:brightness-110 transition-all"
              >
                Clear Emergency
              </button>
              <button
                onClick={() => setShowDisasterMenu(true)}
                className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:brightness-110 transition-all"
              >
                Switch Disaster Type
              </button>
            </div>
          </>
        )}

        {/* Normal Mode - Start Emergency */}
        {!disasterType && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">SafeRoute</h1>
              <p className="text-muted-foreground">Disaster Survival Navigation</p>
            </div>

            <button
              onClick={() => setShowDisasterMenu(true)}
              className={cn(
                'w-full px-8 py-6 rounded-lg font-bold text-2xl transition-all',
                'bg-danger text-danger-foreground hover:brightness-110',
                'focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2'
              )}
            >
              Emergency Alert
            </button>

            <div className="space-y-2 mt-6 p-4 bg-card rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">How to use:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>1. Select disaster type when emergency occurs</li>
                <li>2. Use Find Shelter to locate nearby safety</li>
                <li>3. Use Compass for navigation</li>
                <li>4. Press SOS to trigger emergency alert</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Offline Indicator */}
      <div className="text-center">
        {connectivity === 'offline' && (
          <p className="text-xs text-caution font-bold">
            ⚠ Offline mode - Using cached data
          </p>
        )}
      </div>
    </div>
  );
}
