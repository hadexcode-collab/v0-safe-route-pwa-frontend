'use client';

import React from 'react';
import { cn } from '@/lib/utils';

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

interface ShelterListProps {
  shelters: Shelter[];
  onSelectShelter?: (shelter: Shelter) => void;
  disasterType?: string;
  uiMode?: 'normal' | 'emergency' | 'critical';
}

export function ShelterList({
  shelters,
  onSelectShelter,
  disasterType = 'unknown',
  uiMode = 'normal',
}: ShelterListProps) {
  const getCapacityStatus = (available: number, capacity: number): 'safe' | 'caution' | 'danger' => {
    const percentage = (available / capacity) * 100;
    if (percentage > 50) return 'safe';
    if (percentage > 20) return 'caution';
    return 'danger';
  };

  const getDirectionText = (bearing: number): string => {
    if (bearing >= 337.5 || bearing < 22.5) return 'N';
    if (bearing >= 22.5 && bearing < 67.5) return 'NE';
    if (bearing >= 67.5 && bearing < 112.5) return 'E';
    if (bearing >= 112.5 && bearing < 157.5) return 'SE';
    if (bearing >= 157.5 && bearing < 202.5) return 'S';
    if (bearing >= 202.5 && bearing < 247.5) return 'SW';
    if (bearing >= 247.5 && bearing < 292.5) return 'W';
    return 'NW';
  };

  const getBgColor = (status: 'safe' | 'caution' | 'danger') => {
    return {
      safe: 'bg-safe/20 border-safe',
      caution: 'bg-caution/20 border-caution',
      danger: 'bg-danger/20 border-danger',
    }[status];
  };

  if (shelters.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <div className="text-muted-foreground text-lg">No shelters available</div>
        <div className="text-sm text-muted-foreground mt-2">Searching for nearby shelter locations...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {shelters.map((shelter) => {
        const capacityStatus = getCapacityStatus(shelter.availableSpaces, shelter.capacity);
        const direction = getDirectionText(shelter.bearing);
        const distance = shelter.distance < 1 ? `${Math.round(shelter.distance * 1000)}m` : `${shelter.distance.toFixed(1)}km`;

        return (
          <button
            key={shelter.id}
            onClick={() => onSelectShelter?.(shelter)}
            className={cn(
              'w-full p-4 rounded-lg border-2 transition-all active:scale-95',
              'text-left flex items-center justify-between gap-4',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              getBgColor(capacityStatus)
            )}
          >
            {/* Left Section - Shelter Info */}
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-foreground truncate">
                {shelter.name}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {shelter.type === 'high-ground' && '⬆ High Ground'}
                {shelter.type === 'indoor' && '🏠 Indoor'}
                {shelter.type === 'open-space' && '🌳 Open Space'}
                {shelter.type === 'underground' && '🔽 Underground'}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {`${shelter.availableSpaces} / ${shelter.capacity} spaces`}
              </div>
            </div>

            {/* Right Section - Direction & Distance */}
            <div className="flex flex-col items-end gap-2">
              {/* Distance & Direction */}
              <div className="text-center">
                <div className="text-2xl font-bold text-safe">
                  {direction}
                </div>
                <div className="text-sm font-bold text-foreground">
                  {distance}
                </div>
              </div>

              {/* Capacity Indicator */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-6 rounded',
                      i * (shelter.capacity / 5) < shelter.availableSpaces
                        ? 'bg-safe'
                        : 'bg-muted'
                    )}
                  />
                ))}
              </div>
            </div>
          </button>
        );
      })}

      {/* Legend */}
      {uiMode !== 'critical' && (
        <div className="mt-6 p-4 bg-card rounded-lg border border-border">
          <div className="text-sm font-bold text-muted-foreground mb-2">Shelter Status:</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>🟢 Green = Capacity available</div>
            <div>🟡 Yellow = Limited capacity</div>
            <div>🔴 Red = Full / No spaces</div>
          </div>
        </div>
      )}
    </div>
  );
}
