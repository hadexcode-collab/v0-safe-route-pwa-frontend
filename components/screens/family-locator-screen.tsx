'use client';

import React, { useState } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { FamilyLocator } from '@/components/family-locator';
import { CompassNavigation } from '@/components/compass-navigation';
import { cn } from '@/lib/utils';

interface FamilyLocatorScreenProps {
  onClose?: () => void;
}

export function FamilyLocatorScreen({ onClose }: FamilyLocatorScreenProps) {
  const { familyMembers, connectivity, uiMode } = useEmergency();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const selectedMember = familyMembers.find(m => m.id === selectedMemberId);

  // Member detail view
  if (selectedMember) {
    return (
      <div className="flex flex-col items-center justify-between min-h-screen bg-background p-4">
        {/* Header */}
        <div className="w-full">
          <button
            onClick={() => setSelectedMemberId(null)}
            className={cn(
              'px-4 py-2 rounded-lg font-bold mb-4',
              'bg-card border-2 border-foreground text-foreground',
              'hover:brightness-110 transition-all'
            )}
          >
            ← Back to List
          </button>
          <h1 className="text-2xl font-bold text-foreground">{selectedMember.name}</h1>
          <div className={cn(
            'inline-block mt-2 px-3 py-1 rounded font-bold text-sm',
            selectedMember.status === 'safe' && 'bg-safe text-safe-foreground',
            selectedMember.status === 'unknown' && 'bg-caution text-caution-foreground',
            selectedMember.status === 'help-needed' && 'bg-danger text-danger-foreground',
          )}>
            {selectedMember.status === 'safe' && 'Safe'}
            {selectedMember.status === 'unknown' && 'Unknown'}
            {selectedMember.status === 'help-needed' && 'Needs Help'}
          </div>
        </div>

        {/* Navigation Compass */}
        <div className="flex-1 flex items-center justify-center w-full">
          <CompassNavigation
            bearing={selectedMember.bearing}
            distance={selectedMember.distance}
            destination={selectedMember.name}
            isActive={true}
          />
        </div>

        {/* Member Details */}
        <div className="w-full space-y-3">
          <div className="bg-card border-2 border-foreground rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <span className={cn(
                'font-bold',
                selectedMember.status === 'safe' && 'text-safe',
                selectedMember.status === 'unknown' && 'text-caution',
                selectedMember.status === 'help-needed' && 'text-danger',
              )}>
                {selectedMember.status === 'safe' && 'Safe'}
                {selectedMember.status === 'unknown' && 'Unknown'}
                {selectedMember.status === 'help-needed' && 'Needs Assistance'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Last Seen:</span>
              <span className="font-bold text-foreground">
                {selectedMember.lastSeen.toLocaleTimeString()}
              </span>
            </div>
            {connectivity !== 'online' && (
              <div className="text-xs text-caution-foreground pt-2 border-t border-border">
                Last updated from cached data
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setSelectedMemberId(null)}
              className="w-full px-4 py-3 bg-safe text-safe-foreground rounded-lg font-bold hover:brightness-110 transition-all"
            >
              Start Navigation
            </button>
            {selectedMember.status === 'help-needed' && (
              <button
                className="w-full px-4 py-3 bg-danger text-danger-foreground rounded-lg font-bold hover:brightness-110 transition-all"
              >
                Alert Rescue
              </button>
            )}
          </div>
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
            Family Locator
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {connectivity === 'offline' && (
          <div className="mb-4 p-3 bg-caution/20 border-2 border-caution rounded-lg text-sm text-caution-foreground">
            ⚠ Offline - using last known locations
          </div>
        )}

        <FamilyLocator
          familyMembers={familyMembers}
          onSelectMember={(member) => setSelectedMemberId(member.id)}
          uiMode={uiMode}
        />

        {familyMembers.length === 0 && (
          <div className="p-4 bg-card border-2 border-border rounded-lg text-center space-y-3">
            <p className="text-muted-foreground">No family members in your network</p>
            <p className="text-xs text-muted-foreground">
              Family members need to share their location through the SafeRoute app to appear here.
            </p>
          </div>
        )}

        {/* Family Members By Status */}
        {familyMembers.length > 0 && uiMode !== 'critical' && (
          <div className="mt-6 p-4 bg-card rounded-lg border-2 border-border space-y-3">
            <div className="font-bold text-foreground">Status Overview:</div>
            <div className="grid grid-cols-3 gap-2 text-sm text-center">
              <div className="p-2 bg-safe/20 rounded">
                <div className="font-bold text-safe">{familyMembers.filter(m => m.status === 'safe').length}</div>
                <div className="text-xs text-muted-foreground">Safe</div>
              </div>
              <div className="p-2 bg-caution/20 rounded">
                <div className="font-bold text-caution">{familyMembers.filter(m => m.status === 'unknown').length}</div>
                <div className="text-xs text-muted-foreground">Unknown</div>
              </div>
              <div className="p-2 bg-danger/20 rounded">
                <div className="font-bold text-danger">{familyMembers.filter(m => m.status === 'help-needed').length}</div>
                <div className="text-xs text-muted-foreground">Needs Help</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
