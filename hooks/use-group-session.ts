'use client';

import { useState, useEffect } from 'react';

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function useGroupSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get or create session ID from localStorage (client-side only)
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('saferoute_session_id');
    if (stored) {
      setSessionId(stored);
    } else {
      const newId = generateSessionId();
      localStorage.setItem('saferoute_session_id', newId);
      setSessionId(newId);
    }
  }, []);

  const resetSession = () => {
    if (typeof window === 'undefined') return;
    const newId = generateSessionId();
    localStorage.setItem('saferoute_session_id', newId);
    setSessionId(newId);
  };

  const copySessionId = async () => {
    if (!sessionId) return false;
    try {
      await navigator.clipboard.writeText(sessionId);
      return true;
    } catch {
      return false;
    }
  };

  return {
    sessionId,
    resetSession,
    copySessionId,
  };
}
