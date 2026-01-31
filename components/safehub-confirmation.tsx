'use client';

import React, { useState } from 'react';
import { useSafeHub } from '@/lib/safehub-context';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SafeHubConfirmationProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SafeHubConfirmation({ isOpen = true, onOpenChange }: SafeHubConfirmationProps) {
  const { isConnectedToSafeHub, confirmSafeHub, clearSafeHubConfirmation } = useSafeHub();
  const [showDialog, setShowDialog] = useState(isOpen && !isConnectedToSafeHub);
  const [safeHubName, setSafeHubName] = useState('');
  const [confirmationMode, setConfirmationMode] = useState<'select' | 'manual'>('select');

  const commonSafeHubs = ['SafeHub-Verified', 'SafeHub-Network', 'Community-Center', 'Hospital-Emergency'];

  const handleConfirm = (name: string) => {
    confirmSafeHub(name, name);
    setShowDialog(false);
    onOpenChange?.(false);
  };

  const handleManualConfirm = () => {
    if (safeHubName.trim()) {
      confirmSafeHub(safeHubName, safeHubName);
      setShowDialog(false);
      setSafeHubName('');
      onOpenChange?.(false);
    }
  };

  if (isConnectedToSafeHub) {
    return null;
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you at a SafeHub?</AlertDialogTitle>
          <AlertDialogDescription>
            SafeHubs are verified safety locations with power and connectivity. Confirming your location enables advanced features.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {confirmationMode === 'select' ? (
          <div className="space-y-3 py-4">
            <div className="text-sm font-bold text-foreground">Common SafeHubs nearby:</div>
            <div className="grid gap-2">
              {commonSafeHubs.map((hub) => (
                <button
                  key={hub}
                  onClick={() => handleConfirm(hub)}
                  className="w-full px-4 py-2 bg-safe text-safe-foreground rounded-lg font-bold hover:brightness-110 transition-all"
                >
                  {hub}
                </button>
              ))}
            </div>
            <button
              onClick={() => setConfirmationMode('manual')}
              className="w-full px-4 py-2 bg-caution text-caution-foreground rounded-lg font-bold hover:brightness-110 transition-all"
            >
              Enter SafeHub Name
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <input
              type="text"
              value={safeHubName}
              onChange={(e) => setSafeHubName(e.target.value)}
              placeholder="SafeHub name or address"
              maxLength={50}
              className="w-full px-4 py-2 bg-input border-2 border-foreground rounded-lg text-foreground font-bold"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmationMode('select')}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-bold hover:brightness-110 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleManualConfirm}
                disabled={!safeHubName.trim()}
                className="flex-1 px-4 py-2 bg-safe text-safe-foreground rounded-lg font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        <AlertDialogCancel className="w-full">Not at SafeHub</AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
}
