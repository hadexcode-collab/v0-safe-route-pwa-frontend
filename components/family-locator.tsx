'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FamilyMember {
  id: string;
  name: string;
  distance: number;
  bearing: number;
  lastSeen: Date;
  status: 'safe' | 'unknown' | 'help-needed';
}

interface FamilyLocatorProps {
  familyMembers: FamilyMember[];
  onSelectMember?: (member: FamilyMember) => void;
  uiMode?: 'normal' | 'emergency' | 'critical';
}

export function FamilyLocator({
  familyMembers,
  onSelectMember,
  uiMode = 'normal',
}: FamilyLocatorProps) {
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

  const getStatusColor = (status: FamilyMember['status']) => {
    return {
      safe: 'bg-safe text-safe-foreground',
      unknown: 'bg-caution text-caution-foreground',
      'help-needed': 'bg-danger text-danger-foreground',
    }[status];
  };

  const getStatusIcon = (status: FamilyMember['status']) => {
    return {
      safe: '✓',
      unknown: '?',
      'help-needed': '!',
    }[status];
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.round(diff / 60000);
    const hours = Math.round(diff / 3600000);
    const days = Math.round(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (familyMembers.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <div className="text-muted-foreground text-lg">No family members tracked</div>
        <div className="text-sm text-muted-foreground mt-2">Add family members to track their location</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {familyMembers.map((member) => {
        const direction = getDirectionText(member.bearing);
        const distance = member.distance < 1 ? `${Math.round(member.distance * 1000)}m` : `${member.distance.toFixed(1)}km`;
        const timeAgo = formatTime(member.lastSeen);

        return (
          <button
            key={member.id}
            onClick={() => onSelectMember?.(member)}
            className={cn(
              'w-full p-4 rounded-lg border-2 border-foreground transition-all active:scale-95',
              'text-left flex items-center justify-between gap-4',
              'bg-card hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2'
            )}
          >
            {/* Left Section - Member Info */}
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-foreground flex items-center gap-2">
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    getStatusColor(member.status)
                  )}
                >
                  {getStatusIcon(member.status)}
                </span>
                <span className="truncate">{member.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Seen {timeAgo}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {member.status === 'safe' && 'Status: Safe'}
                {member.status === 'unknown' && 'Status: Unknown'}
                {member.status === 'help-needed' && 'Status: Needs Help'}
              </div>
            </div>

            {/* Right Section - Direction & Distance */}
            <div className="flex flex-col items-center gap-2">
              {/* Compass */}
              <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center relative">
                {/* Arrow pointing to member */}
                <div
                  className="absolute w-0.5 h-6 bg-foreground rounded-full transition-transform"
                  style={{
                    transform: `rotate(${member.bearing}deg)`,
                    transformOrigin: 'bottom center',
                    bottom: '50%',
                  }}
                />
                {/* Center dot */}
                <div className="w-3 h-3 bg-foreground rounded-full" />
              </div>

              {/* Distance */}
              <div className="text-center">
                <div className="text-lg font-bold text-safe">
                  {direction}
                </div>
                <div className="text-sm font-bold text-foreground">
                  {distance}
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Status Legend */}
      {uiMode !== 'critical' && (
        <div className="mt-6 p-4 bg-card rounded-lg border border-border">
          <div className="text-sm font-bold text-muted-foreground mb-2">Status Legend:</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-safe rounded-full" />
              <span className="text-muted-foreground">Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-caution rounded-full" />
              <span className="text-muted-foreground">Unknown</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-danger rounded-full" />
              <span className="text-muted-foreground">Needs Help</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
