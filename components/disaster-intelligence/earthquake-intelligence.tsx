'use client';

import React, { useEffect, useState } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { useSafeHub } from '@/lib/safehub-context';
import { cn } from '@/lib/utils';

export function EarthquakeIntelligence() {
  const { earthquakeData } = useEmergency();
  const { appMode } = useSafeHub();
  const [pulseAnimation, setPulseAnimation] = useState(0);

  useEffect(() => {
    // Animate epicenter pulse
    const interval = setInterval(() => {
      setPulseAnimation((prev) => (prev + 4) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (!earthquakeData || appMode !== 'awareness') {
    return null;
  }

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude < 3) return 'text-safe';
    if (magnitude < 5) return 'text-caution';
    if (magnitude < 7) return 'text-danger';
    return 'text-danger';
  };

  const getIntensityBar = (intensity: number) => {
    const percentage = (intensity / 10) * 100;
    return percentage;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'unsafe':
        return 'bg-danger/20 border-danger text-danger';
      case 'needs-inspection':
        return 'bg-caution/20 border-caution text-caution';
      case 'low-risk':
        return 'bg-safe/20 border-safe text-safe';
      default:
        return 'bg-card border-border text-foreground';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Magnitude and intensity */}
      <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
        <div className="text-sm font-bold text-foreground">Earthquake Parameters</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-input rounded p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Magnitude</div>
            <div className={cn('text-2xl font-bold', getMagnitudeColor(earthquakeData.magnitude))}>
              {earthquakeData.magnitude.toFixed(1)}
            </div>
          </div>
          <div className="bg-input rounded p-3">
            <div className="text-xs text-muted-foreground mb-2">Intensity</div>
            <div className="relative w-full h-6 bg-background rounded border border-foreground overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-safe to-danger transition-all"
                style={{ width: `${getIntensityBar(earthquakeData.intensity)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">{earthquakeData.intensity}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Epicenter visualization */}
      {earthquakeData.epicenterLocation && (
        <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
          <div className="text-sm font-bold text-foreground">Epicenter</div>

          <div className="flex justify-center">
            <div className="relative w-48 h-48 rounded-full border-2 border-danger bg-gradient-to-br from-danger/10 to-danger/5 flex items-center justify-center">
              {/* Intensity rings */}
              {[1, 2, 3, 4, 5].map((ring) => (
                <div
                  key={ring}
                  className="absolute border-2 border-danger/40 rounded-full"
                  style={{
                    width: `${20 + ring * 16}px`,
                    height: `${20 + ring * 16}px`,
                  }}
                />
              ))}

              {/* Epicenter pulse */}
              <div
                className="absolute w-2 h-2 bg-danger rounded-full"
                style={{
                  boxShadow: `0 0 ${20 + pulseAnimation * 0.5}px rgba(var(--danger), ${1 - pulseAnimation / 100})`,
                }}
              />

              {/* Center dot */}
              <div className="absolute w-3 h-3 bg-danger rounded-full z-10" />
            </div>
          </div>

          <div className="bg-input rounded p-2 text-sm">
            <div className="text-xs text-muted-foreground mb-1">Location</div>
            <div className="text-foreground font-mono">
              {earthquakeData.epicenterLocation.latitude.toFixed(4)}, {earthquakeData.epicenterLocation.longitude.toFixed(4)}
            </div>
          </div>
        </div>
      )}

      {/* Aftershocks feed */}
      <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
        <div className="text-sm font-bold text-foreground">Recent Aftershocks ({earthquakeData.aftershocks.length})</div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {earthquakeData.aftershocks.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">No aftershocks detected</div>
          ) : (
            earthquakeData.aftershocks.map((aftershock, idx) => (
              <div key={idx} className="bg-input rounded p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-danger">M {aftershock.magnitude.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(aftershock.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Probability: {Math.round(aftershock.probability * 100)}%
                </div>
                <div className="relative w-full h-2 bg-background rounded border border-foreground overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-danger transition-all"
                    style={{ width: `${aftershock.probability * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Structural risk zones */}
      <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
        <div className="text-sm font-bold text-foreground">Structural Risk Zones ({earthquakeData.structuralRiskZones.length})</div>

        <div className="space-y-2">
          {earthquakeData.structuralRiskZones.map((zone, idx) => (
            <div
              key={idx}
              className={cn('border-2 rounded-lg p-3 space-y-1', getRiskColor(zone.riskLevel))}
            >
              <div className="font-bold text-sm">{zone.zone}</div>
              <div className="text-xs">
                Risk: <span className="font-bold uppercase">{zone.riskLevel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Restricted roads */}
      {earthquakeData.restrictedRoads.length > 0 && (
        <div className="bg-danger/20 border-2 border-danger rounded-lg p-4 space-y-2">
          <div className="text-sm font-bold text-danger">Restricted Roads</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {earthquakeData.restrictedRoads.map((road, idx) => (
              <div key={idx} className="text-xs text-danger flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  {road.road} ({road.reason})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Survival mode notice */}
      {appMode === 'survival' && (
        <div className="bg-caution/20 border-2 border-caution rounded-lg p-3 text-sm text-caution font-bold">
          Connect to SafeHub to see detailed earthquake tracking and aftershock predictions
        </div>
      )}
    </div>
  );
}
