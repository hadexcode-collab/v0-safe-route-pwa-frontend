'use client';

import React, { useState } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { useSafeHub } from '@/lib/safehub-context';
import { usePersonLockedCompass } from '@/hooks/use-person-locked-compass';
import { cn } from '@/lib/utils';

export function FamilyFinderEnhanced() {
  const {
    trackedPeople,
    addTrackedPerson,
    removeTrackedPerson,
    updatePersonLocation,
  } = useEmergency();

  const { isConnectedToSafeHub, appMode } = useSafeHub();
  const { lockCompass, isLocked: isCompassLocked } = usePersonLockedCompass();

  const [newPersonId, setNewPersonId] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersonId.trim()) {
      addTrackedPerson(newPersonId.trim().toUpperCase(), newPersonName || undefined);
      setNewPersonId('');
      setNewPersonName('');
      setShowAddForm(false);
    }
  };

  const handleLockCompass = (personId: string, name?: string) => {
    if (appMode !== 'awareness') {
      alert('Person-locked compass requires SafeHub connection');
      return;
    }
    lockCompass(personId, name);
  };

  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins === 0) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="bg-card border-2 border-border rounded-lg p-4">
        <div className="font-bold text-foreground text-lg mb-2">Family Finder</div>
        <div className="text-sm text-muted-foreground">
          Track family members using their Unique Person ID
        </div>
      </div>

      {/* Add person form */}
      {showAddForm ? (
        <form onSubmit={handleAddPerson} className="bg-card border-2 border-foreground rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Person ID (required)</label>
            <input
              type="text"
              value={newPersonId}
              onChange={(e) => setNewPersonId(e.target.value.toUpperCase())}
              placeholder="e.g., MOM-12345"
              maxLength="20"
              className="w-full px-3 py-2 bg-input border-2 border-foreground rounded text-foreground font-bold"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Name (optional)</label>
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="e.g., Mom"
              maxLength="30"
              className="w-full px-3 py-2 bg-input border-2 border-border rounded text-foreground"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded font-bold hover:brightness-110"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newPersonId.trim()}
              className="flex-1 px-3 py-2 bg-safe text-safe-foreground rounded font-bold hover:brightness-110 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-4 py-3 bg-safe text-safe-foreground rounded-lg font-bold hover:brightness-110"
        >
          Add Family Member
        </button>
      )}

      {/* Tracked people list */}
      {trackedPeople.length === 0 ? (
        <div className="bg-card border-2 border-border rounded-lg p-6 text-center text-muted-foreground">
          No family members added yet
        </div>
      ) : (
        <div className="space-y-3">
          {trackedPeople.map((person) => (
            <div
              key={person.uniqueId}
              className="bg-card border-2 border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-foreground text-lg">
                    {person.name || person.uniqueId}
                  </div>
                  <div className="text-xs text-muted-foreground">{person.uniqueId}</div>
                </div>
                <button
                  onClick={() => removeTrackedPerson(person.uniqueId)}
                  className="px-2 py-1 bg-danger/20 text-danger rounded text-xs font-bold hover:brightness-110"
                >
                  Remove
                </button>
              </div>

              {/* Location status */}
              {person.lastKnownLocation ? (
                <div className="bg-input rounded p-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last location:</span>
                    <span className="text-foreground font-mono">
                      {person.lastKnownLocation.latitude.toFixed(4)},
                      {person.lastKnownLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="text-foreground">{formatTimestamp(person.lastUpdateTime)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-caution/20 border border-caution rounded p-2 text-sm text-caution font-bold">
                  No location data yet
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {appMode === 'awareness' && person.lastKnownLocation && !isCompassLocked && (
                  <button
                    onClick={() => handleLockCompass(person.uniqueId, person.name || person.uniqueId)}
                    className="flex-1 px-3 py-2 bg-safe text-safe-foreground rounded font-bold text-sm hover:brightness-110"
                  >
                    Track with Compass
                  </button>
                )}
                {isConnectedToSafeHub && (
                  <button
                    onClick={() => {
                      // Simulate receiving updated location from SafeHub
                      // In real scenario, this would come from a server/SafeHub
                      const randomLat = 40 + Math.random() * 0.01;
                      const randomLng = -74 + Math.random() * 0.01;
                      updatePersonLocation(person.uniqueId, {
                        latitude: randomLat,
                        longitude: randomLng,
                      });
                    }}
                    className="flex-1 px-3 py-2 bg-caution text-caution-foreground rounded font-bold text-sm hover:brightness-110"
                  >
                    Refresh
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SafeHub notice */}
      {appMode === 'survival' && trackedPeople.length > 0 && (
        <div className="bg-caution/20 border-2 border-caution rounded-lg p-3 text-sm text-caution font-bold">
          Connect to SafeHub to see real-time family member locations and track with compass
        </div>
      )}
    </div>
  );
}
