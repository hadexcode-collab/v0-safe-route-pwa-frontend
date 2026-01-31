'use client';

import React from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { useSafeHub } from '@/lib/safehub-context';
import { TsunamiIntelligence } from '@/components/disaster-intelligence/tsunami-intelligence';
import { CycloneIntelligence } from '@/components/disaster-intelligence/cyclone-intelligence';
import { EarthquakeIntelligence } from '@/components/disaster-intelligence/earthquake-intelligence';
import { cn } from '@/lib/utils';

interface SafeHubSituationScreenProps {
  onClose?: () => void;
}

export function SafeHubSituationScreen({ onClose }: SafeHubSituationScreenProps) {
  const { disasterType } = useEmergency();
  const { appMode, safeHubName } = useSafeHub();

  // Only show this screen in Awareness Mode at SafeHub
  if (appMode !== 'awareness') {
    return null;
  }

  const getSituationSummary = (): string => {
    switch (disasterType) {
      case 'tsunami':
        return 'Monitor coastal water levels. High ground areas marked green. Avoid all coastal navigation.';
      case 'cyclone':
        return 'Storm tracking active. Check exit safety status before movement. Infrastructure status updated.';
      case 'earthquake':
        return 'Post-quake monitoring active. Monitor aftershock alerts. Structural safety status by area.';
      case 'flood':
        return 'Flood situation awareness active. Monitor water levels and road status.';
      default:
        return 'Situation awareness active at SafeHub.';
    }
  };

  return (
    <div className="w-full min-h-screen bg-background p-4 space-y-4 overflow-y-auto pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">SITUATION DASHBOARD</div>
            <div className="text-xl font-bold text-foreground">What's Happening Outside</div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-muted text-foreground rounded font-bold text-sm hover:brightness-110"
            >
              Back
            </button>
          )}
        </div>
        {safeHubName && (
          <div className="text-xs text-safe bg-safe/20 border-2 border-safe rounded px-2 py-1 inline-block">
            Connected to: {safeHubName}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-card border-2 border-border rounded-lg p-4">
        <div className="text-sm text-foreground">{getSituationSummary()}</div>
      </div>

      {/* Disaster-specific Intelligence */}
      {disasterType === 'tsunami' && (
        <div className="space-y-4">
          <div className="text-sm font-bold text-foreground">Tsunami Intelligence</div>
          <TsunamiIntelligence />
        </div>
      )}

      {disasterType === 'cyclone' && (
        <div className="space-y-4">
          <div className="text-sm font-bold text-foreground">Cyclone Intelligence</div>
          <CycloneIntelligence />
        </div>
      )}

      {disasterType === 'earthquake' && (
        <div className="space-y-4">
          <div className="text-sm font-bold text-foreground">Earthquake Intelligence</div>
          <EarthquakeIntelligence />
        </div>
      )}

      {/* Data freshness indicator */}
      <div className="bg-card border-2 border-border rounded-lg p-3">
        <div className="text-xs text-muted-foreground text-center">
          Data last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
