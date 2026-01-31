'use client';

import React, { useState } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { useSafeHub } from '@/lib/safehub-context';
import { cn } from '@/lib/utils';

export function TsunamiIntelligence() {
  const { tsunamiData, setTsunamiData } = useEmergency();
  const { appMode } = useSafeHub();
  const [reportedLevel, setReportedLevel] = useState<number>(0);
  const [showReportForm, setShowReportForm] = useState(false);

  if (!tsunamiData) {
    return null;
  }

  const handleSubmitReport = () => {
    if (reportedLevel === 0) return;

    const newReport = {
      location: { lat: 0, lng: 0 }, // Would be actual device location
      level: reportedLevel,
      timestamp: new Date(),
    };

    setTsunamiData({
      ...tsunamiData,
      crowdReports: [...tsunamiData.crowdReports, newReport],
    });

    setReportedLevel(0);
    setShowReportForm(false);
  };

  const getWaterDepthColor = (depth: number) => {
    if (depth < 1) return 'bg-blue-300';
    if (depth < 3) return 'bg-blue-500';
    if (depth < 5) return 'bg-blue-700';
    return 'bg-blue-900';
  };

  return (
    <div className="w-full space-y-4">
      {/* Header with warning */}
      <div className="bg-danger/20 border-2 border-danger rounded-lg p-4">
        <div className="font-bold text-danger text-lg">Tsunami Alert</div>
        <div className="text-sm text-danger mt-1">
          Current water level: {tsunamiData.waterLevel}m
        </div>
      </div>

      {/* Water level visualization */}
      <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
        <div className="text-sm font-bold text-foreground">Coastal Water Depth Heatmap</div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(tsunamiData.coastalWaterDepth).map(([zone, depth]) => (
            <div
              key={zone}
              className={cn('rounded-lg p-3 text-center text-xs font-bold text-white', getWaterDepthColor(depth))}
            >
              <div className="font-bold">{zone}</div>
              <div>{depth}m</div>
            </div>
          ))}
        </div>
      </div>

      {/* Safe zones */}
      <div className="bg-safe/20 border-2 border-safe rounded-lg p-4 space-y-3">
        <div className="text-sm font-bold text-safe">Safe Zones (High Ground)</div>
        <div className="space-y-2">
          {tsunamiData.safeZones.map((zone, idx) => (
            <div key={idx} className="bg-card rounded p-2 text-sm">
              <div className="font-bold text-foreground">{zone.name}</div>
              <div className="text-xs text-muted-foreground">
                Altitude: {zone.altitude}m | {zone.location.latitude.toFixed(2)}, {zone.location.longitude.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crowd reports */}
      <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-foreground">Water Level Reports ({tsunamiData.crowdReports.length})</div>
          {appMode === 'awareness' && (
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="px-2 py-1 bg-caution text-caution-foreground rounded text-xs font-bold hover:brightness-110"
            >
              {showReportForm ? 'Cancel' : 'Report'}
            </button>
          )}
        </div>

        {showReportForm && appMode === 'awareness' && (
          <div className="bg-input rounded p-3 space-y-2">
            <label className="text-xs text-muted-foreground block">Observed water level (meters)</label>
            <div className="flex gap-2">
              {[0.5, 1, 2, 3, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setReportedLevel(level)}
                  className={cn(
                    'flex-1 px-2 py-1 rounded text-xs font-bold',
                    reportedLevel === level
                      ? 'bg-danger text-danger-foreground'
                      : 'bg-card border border-foreground text-foreground'
                  )}
                >
                  {level}m
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmitReport}
              disabled={reportedLevel === 0}
              className="w-full px-2 py-1 bg-safe text-safe-foreground rounded text-xs font-bold hover:brightness-110 disabled:opacity-50"
            >
              Submit Report
            </button>
          </div>
        )}

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {tsunamiData.crowdReports.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">No reports yet</div>
          ) : (
            tsunamiData.crowdReports.map((report, idx) => (
              <div key={idx} className="bg-card rounded p-2 text-xs">
                <div className="font-bold text-danger">{report.level}m reported</div>
                <div className="text-muted-foreground">
                  {new Date(report.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DO NOT RETURN warning */}
      <div className="bg-danger border-4 border-danger rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-danger-foreground mb-2">DO NOT RETURN</div>
        <div className="text-sm text-danger-foreground">
          Water recession timelines are unpredictable. Wait for all-clear from authorities.
        </div>
      </div>

      {/* Navigation restriction (Survival mode only) */}
      {appMode === 'survival' && (
        <div className="bg-caution/20 border-2 border-caution rounded-lg p-3 text-sm text-caution font-bold">
          Navigation into active tsunami danger areas is blocked
        </div>
      )}
    </div>
  );
}
