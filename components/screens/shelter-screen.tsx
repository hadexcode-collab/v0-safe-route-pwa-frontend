'use client';

import React, { useState } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { ShelterList } from '@/components/shelter-list';
import { CompassNavigation } from '@/components/compass-navigation';
import { cn } from '@/lib/utils';

interface ShelterScreenProps {
  onClose?: () => void;
  onSelectShelter?: (shelterId: string) => void;
}

export function ShelterScreen({ onClose, onSelectShelter }: ShelterScreenProps) {
  const { shelters, disasterType, connectivity, uiMode } = useEmergency();
  const [selectedShelter, setSelectedShelter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'compass'>('list');

  const shelter = shelters.find(s => s.id === selectedShelter);

  const handleSelectShelter = (shelterData: any) => {
    setSelectedShelter(shelterData.id);
    onSelectShelter?.(shelterData.id);
  };

  // Compass navigation view for selected shelter
  if (selectedShelter && shelter) {
    return (
      <div className="flex flex-col items-center justify-between min-h-screen bg-background p-4">
        {/* Header */}
        <div className="w-full">
          <button
            onClick={() => setSelectedShelter(null)}
            className={cn(
              'px-4 py-2 rounded-lg font-bold mb-4',
              'bg-card border-2 border-foreground text-foreground',
              'hover:brightness-110 transition-all'
            )}
          >
            ← Back to List
          </button>
          <h1 className="text-2xl font-bold text-foreground">{shelter.name}</h1>
          <p className="text-muted-foreground">{shelter.type.replace('-', ' ').toUpperCase()}</p>
        </div>

        {/* Compass Navigation */}
        <div className="flex-1 flex items-center justify-center w-full">
          <CompassNavigation
            bearing={shelter.bearing}
            distance={shelter.distance}
            destination={shelter.name}
            isActive={true}
          />
        </div>

        {/* Shelter Details */}
        <div className="w-full space-y-3">
          <div className="bg-card border-2 border-foreground rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Capacity:</span>
              <span className="font-bold text-foreground">
                {shelter.availableSpaces} / {shelter.capacity}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 h-2 rounded',
                    i * (shelter.capacity / 5) < shelter.availableSpaces
                      ? 'bg-safe'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(shelter.lastUpdated).toLocaleTimeString()}
            </div>
          </div>

          {connectivity !== 'online' && (
            <div className="bg-caution/20 border-2 border-caution rounded-lg p-3 text-sm text-caution-foreground">
              Using cached shelter data - may not be up to date
            </div>
          )}

          <button
            onClick={() => setSelectedShelter(null)}
            className="w-full px-4 py-3 bg-safe text-safe-foreground rounded-lg font-bold hover:brightness-110 transition-all"
          >
            Start Navigation
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg font-bold',
              'bg-card border-2 border-foreground text-foreground',
              'hover:brightness-110 transition-all'
            )}
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-foreground text-center flex-1">
            Nearby Shelters
          </h1>
        </div>

        {/* View Mode Toggle */}
        {uiMode !== 'critical' && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg font-bold transition-all',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border-2 border-foreground text-foreground'
              )}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('compass')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg font-bold transition-all',
                viewMode === 'compass'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border-2 border-foreground text-foreground'
              )}
            >
              Map
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {connectivity === 'offline' && (
          <div className="mb-4 p-3 bg-caution/20 border-2 border-caution rounded-lg text-sm text-caution-foreground">
            ⚠ Offline - using cached shelter locations
          </div>
        )}

        <ShelterList
          shelters={shelters}
          onSelectShelter={handleSelectShelter}
          disasterType={disasterType || 'unknown'}
          uiMode={uiMode}
        />

        {shelters.length === 0 && connectivity !== 'online' && (
          <div className="p-4 bg-card border-2 border-border rounded-lg text-center">
            <p className="text-muted-foreground">
              No cached shelter data available. Go online for current shelter information.
            </p>
          </div>
        )}
      </div>

      {/* Disaster-Specific Info */}
      {disasterType && uiMode !== 'critical' && (
        <div className="p-4 border-t border-border bg-card/50">
          <div className="text-xs text-muted-foreground mb-2">
            {disasterType === 'flood' && '🌊 Showing high-ground shelters and elevated areas'}
            {disasterType === 'cyclone' && '🌪️ Showing reinforced indoor and underground shelters'}
            {disasterType === 'earthquake' && '🏚️ Showing open spaces away from structures'}
            {disasterType === 'tsunami' && '🌊 Showing evacuation routes and safe zones'}
          </div>
        </div>
      )}
    </div>
  );
}
