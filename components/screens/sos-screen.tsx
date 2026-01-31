'use client';

import React, { useState, useEffect } from 'react';
import { useEmergency } from '@/lib/emergency-context';
import { cn } from '@/lib/utils';

interface SOSScreenProps {
  onClose?: () => void;
}

export function SOSScreen({ onClose }: SOSScreenProps) {
  const { sosActive, triggerSOS, clearSOS, uiMode, soundEnabled } = useEmergency();
  const [sosTriggered, setSOSTriggered] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);

  // Hold-to-trigger countdown
  useEffect(() => {
    if (!countdownActive) return;

    const timer = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          triggerSOS();
          setSOSTriggered(true);
          setCountdownActive(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownActive, triggerSOS]);

  const handleSOSPress = () => {
    setCountdownActive(true);
  };

  const handleSOSRelease = () => {
    setCountdownActive(false);
    setCountdownSeconds(5);
  };

  const handleDismiss = () => {
    setSOSTriggered(false);
    clearSOS();
    onClose?.();
  };

  // SOS Triggered - Show confirmation
  if (sosTriggered || sosActive) {
    return (
      <div className="fixed inset-0 bg-danger/90 flex flex-col items-center justify-center p-4 z-50">
        <div className="animate-pulse text-6xl mb-4">🆘</div>
        
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-danger-foreground">SOS SENT</h1>
          <p className="text-2xl text-danger-foreground">
            Emergency services notified
          </p>

          <div className="mt-8 space-y-3 text-lg text-danger-foreground">
            <div>Your location: <span className="font-bold">Shared</span></div>
            <div>Status: <span className="font-bold">Broadcasting</span></div>
            <div>Services contacted: <span className="font-bold">Emergency</span></div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className={cn(
            'mt-12 px-8 py-4 rounded-lg font-bold text-xl',
            'bg-danger-foreground text-danger hover:brightness-90',
            'transition-all active:scale-95'
          )}
        >
          Dismiss
        </button>

        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-xs text-danger-foreground/70">
            Keep this screen visible. Emergency personnel have your location.
          </p>
        </div>
      </div>
    );
  }

  // SOS Trigger Interface - Hold to Send
  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-background p-4">
      {/* Header */}
      <div className="w-full text-center">
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          ✕
        </button>
        <h1 className="text-3xl font-bold text-danger">Emergency SOS</h1>
        <p className="text-muted-foreground mt-2">Hold button to trigger emergency alert</p>
      </div>

      {/* Main SOS Button - Large Hold-to-Trigger */}
      <div className="flex flex-col items-center gap-8">
        {/* Countdown Circle */}
        {countdownActive && (
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 rounded-full border-4 border-danger bg-danger/10 flex items-center justify-center">
              <div className="text-6xl font-bold text-danger">{countdownSeconds}</div>
            </div>
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-danger border-r-danger animate-spin"
              style={{
                animationDuration: '1s',
              }}
            />
          </div>
        )}

        {/* SOS Button */}
        <button
          onMouseDown={handleSOSPress}
          onMouseUp={handleSOSRelease}
          onTouchStart={handleSOSPress}
          onTouchEnd={handleSOSRelease}
          className={cn(
            'w-32 h-32 rounded-full font-bold text-5xl transition-all',
            'flex items-center justify-center',
            'focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-danger',
            countdownActive
              ? 'bg-danger text-danger-foreground scale-95'
              : 'bg-danger hover:brightness-110 text-danger-foreground active:scale-95'
          )}
        >
          🆘
        </button>

        {/* Status Text */}
        {countdownActive && (
          <div className="text-center">
            <p className="text-danger font-bold text-lg">Release to cancel</p>
            <p className="text-muted-foreground text-sm">Sending in {countdownSeconds}s</p>
          </div>
        )}

        {!countdownActive && (
          <div className="text-center">
            <p className="text-foreground font-bold text-lg">Hold for {5} seconds</p>
            <p className="text-muted-foreground text-sm">to send emergency alert</p>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="w-full space-y-4">
        <div className="bg-danger/20 border-2 border-danger rounded-lg p-4 space-y-2">
          <h3 className="font-bold text-danger-foreground">What happens:</h3>
          <ul className="text-sm text-danger-foreground space-y-1">
            <li>✓ Your location is broadcast</li>
            <li>✓ Emergency services notified</li>
            <li>✓ Family contacts alerted</li>
            <li>✓ Continuous broadcasting active</li>
          </ul>
        </div>

        <div className="bg-caution/20 border-2 border-caution rounded-lg p-4">
          <p className="text-sm text-caution-foreground">
            Only trigger SOS in life-threatening situations. False alarms waste emergency resources.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-card border-2 border-foreground rounded-lg text-foreground font-bold hover:brightness-110 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
