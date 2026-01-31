import type { SafeHouseResult } from '@/app/api/safehouses/route';
import { SAFEHOUSES } from '@/lib/data/safehouses';
import { calculateDistance, calculateBearing } from '@/lib/utils/geo';

const DB_NAME = 'SafeRouteDB';
const STORE_NAME = 'safehouses';

export class SafehouseCacheManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        console.error('[v0] IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async cacheSafehouses(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put(SAFEHOUSES, 'safehouses');

      request.onerror = () => {
        console.error('[v0] Cache error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('[v0] Safehouses cached successfully');
        resolve();
      };
    });
  }

  async getCachedSafehouses(): Promise<typeof SAFEHOUSES | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('safehouses');

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          console.warn('[v0] Failed to get cached safehouses');
          resolve(null);
        };
      } catch (error) {
        console.warn('[v0] IndexedDB not available:', error);
        resolve(null);
      }
    });
  }

  async getNearestSafehouse(lat: number, lon: number): Promise<SafeHouseResult | null> {
    const safehouses = await this.getCachedSafehouses();
    if (!safehouses) return null;

    const safehousesWithDistance = safehouses.map((safehouse) => ({
      ...safehouse,
      distance: calculateDistance(lat, lon, safehouse.latitude, safehouse.longitude),
      bearing: calculateBearing(lat, lon, safehouse.latitude, safehouse.longitude),
    }));

    safehousesWithDistance.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.distance - b.distance;
    });

    const nearest = safehousesWithDistance[0];
    const alternatives = safehousesWithDistance.slice(1, 4);

    return {
      nearest,
      alternatives,
    };
  }
}

export const cacheManager = new SafehouseCacheManager();
