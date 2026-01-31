'use client';

import React, { useEffect, useState } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { useSafeHub } from '@/lib/safehub-context';
import { cn } from '@/lib/utils';

export function CycloneIntelligence() {
  const { cycloneData } = useEmergency();
  const { appMode } = useSafeHub();
  const [windVectorRotation, setWindVectorRotation] = useState(0);

  useEffect(() => {
    // Animate wind vectors
    const interval = setInterval(() => {
      setWindVectorRotation((prev) => (prev + 2) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!cycloneData || appMode !== 'awareness') {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'do-not-move':
        return 'bg-danger';
      case 'prepare':
        return 'bg-caution';
      case 'safe-to-exit':
        return 'bg-safe';
      default:
        return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'do-not-move':
        return 'DO NOT MOVE';
      case 'prepare':
        return 'PREPARE';
      case 'safe-to-exit':
        return 'SAFE TO EXIT';
      default:
        return 'UNKNOWN';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'do-not-move':
        return 'text-danger-foreground';
      case 'prepare':
        return 'text-caution-foreground';
      case 'safe-to-exit':
        return 'text-safe-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getInfrastructureStatus = (status: 'operational' | 'partial' | 'down') => {
    switch (status) {
      case 'operational':
        return { color: 'text-safe', icon: '✓', label: 'Operational' };
      case 'partial':
        return { color: 'text-caution', icon: '!', label: 'Partial' };
      case 'down':
        return { color: 'text-danger', icon: '✕', label: 'Down' };
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Cyclone eye and wind intensity */}
      <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
        <div className="text-sm font-bold text-foreground">Cyclone Status</div>

        {/* Cyclone center visualization */}
        <div className="flex justify-center">
          <div className="relative w-40 h-40 rounded-full border-2 border-foreground flex items-center justify-center overflow-hidden bg-gradient-to-br from-danger/10 to-danger/20">
            {/* Wind rings */}
            {[1, 2, 3].map((ring) => (
              <div
                key={ring}
                className="absolute border-2 border-danger/50 rounded-full"
                style={{
                  width: `${40 + ring * 20}px`,
                  height: `${40 + ring * 20}px`,
                }}
              />
            ))}

            {/* Cyclone eye */}
            {cycloneData.eyeLocation && (
              <div className="absolute w-8 h-8 bg-danger rounded-full flex items-center justify-center z-10">
                <div className="text-xs font-bold text-danger-foreground">Eye</div>
              </div>
            )}

            {/* Wind vectors */}
            {[0, 90, 180, 270].map((angle) => (
              <div
                key={angle}
                className="absolute w-1 h-12 bg-gradient-to-t from-danger to-danger/20 origin-bottom"
                style={{
                  transform: `rotate(${angle + windVectorRotation}deg)`,
                  top: '50%',
                  left: '50%',
                }}
              />
            ))}
          </div>
        </div>

        {/* Wind details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-input rounded p-2">
            <div className="text-xs text-muted-foreground">Wind Speed</div>
            <div className="font-bold text-foreground text-lg">{cycloneData.windIntensity}km/h</div>
          </div>
          <div className="bg-input rounded p-2">
            <div className="text-xs text-muted-foreground">Wind Direction</div>
            <div className="font-bold text-foreground text-lg">{cycloneData.windDirection}°</div>
          </div>
        </div>
      </div>

      {/* Safe exit status - LARGE AND BOLD */}
      <div className={cn(
        'border-4 rounded-lg p-6 text-center',
        getStatusColor(cycloneData.safeExitStatus)
      )}>
        <div className={cn(
          'text-4xl font-bold mb-2',
          getStatusTextColor(cycloneData.safeExitStatus)
        )}>
          {getStatusLabel(cycloneData.safeExitStatus)}
        </div>
        <div className={cn(
          'text-sm',
          getStatusTextColor(cycloneData.safeExitStatus)
        )}>
          {cycloneData.safeExitStatus === 'do-not-move'
            ? 'Eye of cyclone approaching. Stay sheltered.'
            : cycloneData.safeExitStatus === 'prepare'
              ? 'Prepare for impact. Secure loose items.'
              : 'Cyclone has passed. Safe to exit shelter.'}
        </div>
      </div>

      {/* Infrastructure status */}
      <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
        <div className="text-sm font-bold text-foreground">Infrastructure Status</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-input rounded">
            <span className="text-sm">Power Grid</span>
            <span className={cn('font-bold', getInfrastructureStatus(cycloneData.infrastructureStatus.powerGrid).color)}>
              {getInfrastructureStatus(cycloneData.infrastructureStatus.powerGrid).icon}{' '}
              {getInfrastructureStatus(cycloneData.infrastructureStatus.powerGrid).label}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-input rounded">
            <span className="text-sm">Network</span>
            <span className={cn('font-bold', getInfrastructureStatus(cycloneData.infrastructureStatus.network).color)}>
              {getInfrastructureStatus(cycloneData.infrastructureStatus.network).icon}{' '}
              {getInfrastructureStatus(cycloneData.infrastructureStatus.network).label}
            </span>
          </div>
        </div>
      </div>

      {/* Flooded roads warning */}
      {cycloneData.infrastructureStatus.floodedRoads.length > 0 && (
        <div className="bg-danger/20 border-2 border-danger rounded-lg p-4 space-y-2">
          <div className="text-sm font-bold text-danger">Flooded Roads</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {cycloneData.infrastructureStatus.floodedRoads.map((road, idx) => (
              <div key={idx} className="text-xs text-danger">
                - {road.road}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Survival mode notice */}
      {appMode === 'survival' && (
        <div className="bg-caution/20 border-2 border-caution rounded-lg p-3 text-sm text-caution font-bold">
          Connect to SafeHub to see detailed cyclone tracking and infrastructure status
        </div>
      )}
    </div>
  );
}
