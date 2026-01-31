'use client';

import React, { useState } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { useNearestSafehouse } from '@/hooks/use-nearest-safehouse';
import { useGroupSession } from '@/hooks/use-group-session';
import { CompassNavigation } from '@/components/compass-navigation';
import { formatDistance } from '@/lib/utils/geo';
import { cn } from '@/lib/utils';

interface SafehouseCompassScreenProps {
  onClose?: () => void;
}

export function SafehouseCompassScreen({ onClose }: SafehouseCompassScreenProps) {
  const { userLocation, uiMode, disasterType } = useEmergency();
  const { result, loading, error } = useNearestSafehouse(
    userLocation?.latitude ?? null,
    userLocation?.longitude ?? null
  );
  const { sessionId, copySessionId } = useGroupSession();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySession = async () => {
    const success = await copySessionId();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b-2 border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">Nearest Safe House</h1>
          <button
            onClick={onClose}
            className="px-2 py-1 bg-muted rounded text-xs font-bold hover:brightness-110"
          >
            Back
          </button>
        </div>
        {disasterType && (
          <div className="text-xs text-muted-foreground">Disaster: {disasterType.toUpperCase()}</div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {loading && (
          <div className="text-center">
            <div className="text-lg font-bold mb-2">Finding nearest safe house...</div>
            <div className="text-muted-foreground">Using your location</div>
          </div>
        )}

        {error && (
          <div className="bg-danger text-danger-foreground rounded-lg p-4 text-center">
            <div className="font-bold mb-2">Location Error</div>
            <div className="text-sm">{error}</div>
          </div>
        )}

        {result && result.nearest && (
          <div className="w-full space-y-6">
            {/* Compass */}
            <div className="flex justify-center">
              <CompassNavigation
                bearing={result.nearest.bearing}
                distance={result.nearest.distance}
                destination={result.nearest.name}
                isActive={true}
              />
            </div>

            {/* Safehouse Info */}
            <div className="bg-card border-2 border-safe rounded-lg p-4 space-y-3">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Target Shelter</div>
                <div className="text-2xl font-bold text-safe">{result.nearest.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Distance</div>
                  <div className="text-lg font-bold">{formatDistance(result.nearest.distance)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Bearing</div>
                  <div className="text-lg font-bold">{Math.round(result.nearest.bearing)}°</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Type</div>
                <div className="text-sm font-semibold capitalize">{result.nearest.type}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Capacity</div>
                <div className="text-sm font-semibold">{result.nearest.capacity} people</div>
              </div>

              <div className="text-sm text-foreground">{result.nearest.description}</div>
            </div>

            {/* Group Session */}
            <div className="bg-card border-2 border-caution rounded-lg p-3 space-y-2">
              <div className="text-xs text-muted-foreground uppercase font-bold">Group Session ID</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-input border border-caution rounded px-3 py-2">
                  <div className="font-mono text-sm break-all">{sessionId || 'Loading...'}</div>
                </div>
                <button
                  onClick={handleCopySession}
                  className={cn(
                    'px-3 py-2 rounded font-bold text-xs whitespace-nowrap transition-all',
                    copied
                      ? 'bg-safe text-safe-foreground'
                      : 'bg-caution text-caution-foreground hover:brightness-110'
                  )}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                Share this ID to coordinate with family members. Works offline only.
              </div>
            </div>

            {/* Alternatives */}
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="w-full px-4 py-2 bg-muted text-foreground rounded font-bold text-sm hover:brightness-110"
                >
                  {showAlternatives ? 'Hide' : 'Show'} Alternative Shelters ({result.alternatives.length})
                </button>

                {showAlternatives && (
                  <div className="space-y-2">
                    {result.alternatives.map((alt, idx) => (
                      <div key={alt.id} className="bg-card border border-border rounded-lg p-3">
                        <div className="font-bold text-sm mb-1">{idx + 2}. {alt.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistance(alt.distance)} away • {Math.round(alt.bearing)}°
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {userLocation && (
        <div className="bg-card border-t-2 border-border px-4 py-2 text-xs text-muted-foreground text-center">
          Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </div>
      )}
    </div>
  );
}
