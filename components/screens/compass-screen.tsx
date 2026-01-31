'use client';

import React, { useState, useEffect } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { CompassNavigation } from '@/components/compass-navigation';
import { cn } from '@/lib/utils';

interface CompassScreenProps {
  onClose?: () => void;
  destination?: string;
  bearing?: number;
  distance?: number;
}

export function CompassScreen({
  onClose,
  destination = 'Safety Zone',
  bearing = 0,
  distance = 0,
}: CompassScreenProps) {
  const { disasterType, connectivity, uiMode } = useEmergency();
  const [manualBearing, setManualBearing] = useState(bearing);
  const [manualDistance, setManualDistance] = useState(distance);
  const [useManual, setUseManual] = useState(false);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-background p-4">
      {/* Header */}
      <div className="w-full">
        <button
          onClick={onClose}
          className={cn(
            'px-4 py-2 rounded-lg font-bold mb-4',
            'bg-card border-2 border-foreground text-foreground',
            'hover:brightness-110 transition-all'
          )}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-foreground">Navigation Compass</h1>
        <p className="text-muted-foreground">{destination}</p>
      </div>

      {/* Compass */}
      <div className="flex-1 flex items-center justify-center w-full">
        <CompassNavigation
          bearing={useManual ? manualBearing : bearing}
          distance={useManual ? manualDistance : distance}
          destination={destination}
          isActive={!useManual}
        />
      </div>

      {/* Controls */}
      {uiMode !== 'critical' && (
        <div className="w-full space-y-4">
          {/* Manual Entry Option */}
          {connectivity === 'offline' && (
            <div className="bg-caution/20 border-2 border-caution rounded-lg p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useManual}
                  onChange={(e) => setUseManual(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-caution-foreground font-bold">Manual Entry</span>
              </label>

              {useManual && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-caution-foreground block mb-1">
                      Direction (0-360°)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={manualBearing}
                      onChange={(e) => setManualBearing(Math.min(360, Math.max(0, Number(e.target.value))))}
                      className="w-full px-3 py-2 bg-input border-2 border-caution rounded text-caution-foreground font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-caution-foreground block mb-1">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={manualDistance}
                      onChange={(e) => setManualDistance(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-input border-2 border-caution rounded text-caution-foreground font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GPS Status */}
          <div className="bg-card border-2 border-border rounded-lg p-3 text-sm text-muted-foreground">
            {connectivity === 'offline' && '📍 Offline - using manual input or last known location'}
            {connectivity === 'degraded' && '📡 Weak connection - compass may be less accurate'}
            {connectivity === 'online' && '✓ GPS active and accurate'}
          </div>

          {/* Instructions */}
          <div className="bg-card border-2 border-foreground rounded-lg p-3 space-y-2">
            <div className="font-bold text-foreground text-sm">How to navigate:</div>
            <ol className="text-xs text-muted-foreground space-y-1">
              <li>1. Face the direction shown by the arrow</li>
              <li>2. Walk straight in that direction</li>
              <li>3. Keep the device level for best accuracy</li>
              <li>4. Distance decreases as you get closer</li>
            </ol>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-safe text-safe-foreground rounded-lg font-bold hover:brightness-110 transition-all"
          >
            Done
          </button>
        </div>
      )}

      {/* Critical Mode - Minimal */}
      {uiMode === 'critical' && (
        <button
          onClick={onClose}
          className="px-8 py-4 bg-danger text-danger-foreground rounded-lg font-bold text-lg hover:brightness-110 transition-all"
        >
          Return to Home
        </button>
      )}
    </div>
  );
}
