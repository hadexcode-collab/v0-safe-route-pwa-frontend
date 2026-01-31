'use client';

import { useState, useEffect } from 'react';
import { cacheManager } from '@/lib/offline/safehouse-cache';
import type { SafeHouseResult } from '@/app/api/safehouses/route';

export function useNearestSafehouse(latitude: number | null, longitude: number | null) {
  const [result, setResult] = useState<SafeHouseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (latitude === null || longitude === null) {
      setError('Location not available');
      return;
    }

    const fetchSafehouse = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to fetch from API first
        const response = await fetch(
          `/api/safehouses?lat=${latitude}&lon=${longitude}`,
          { cache: 'no-store' }
        );

        if (response.ok) {
          const data = (await response.json()) as SafeHouseResult;
          setResult(data);
          return;
        }
      } catch (err) {
        console.warn('[v0] API fetch failed, falling back to cache:', err);
      }

      // Fallback to cache if offline or API fails
      try {
        const cachedResult = await cacheManager.getNearestSafehouse(latitude, longitude);
        if (cachedResult) {
          setResult(cachedResult);
        } else {
          setError('No cached safehouses available');
        }
      } catch (err) {
        setError('Failed to get nearest safehouse');
        console.error('[v0] Safehouse lookup error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSafehouse();
  }, [latitude, longitude]);

  return { result, loading, error };
}
