// Offline Cache Manager for SafeRoute PWA
// Handles caching of critical emergency data for offline access

export interface CachedData {
  shelters: any[];
  familyMembers: any[];
  evacuationInstructions: Record<string, string>;
  lastUpdated: Record<string, number>;
}

const CACHE_VERSION = 'saferoute-v1';
const DATA_STORE = 'saferoute-data';

export class OfflineCacheManager {
  static async initializeCache() {
    if (!('indexedDB' in window)) {
      console.warn('[v0] IndexedDB not available, using memory cache');
      return false;
    }

    try {
      const db = await this.getDatabase();
      return true;
    } catch (error) {
      console.error('[v0] Failed to initialize IndexedDB:', error);
      return false;
    }
  }

  private static getDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DATA_STORE)) {
          db.createObjectStore(DATA_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  static async cacheShelters(shelters: any[]): Promise<void> {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([DATA_STORE], 'readwrite');
      const store = transaction.objectStore(DATA_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          key: 'shelters',
          data: shelters,
          timestamp: Date.now(),
        });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });

      console.log('[v0] Shelters cached for offline access:', shelters.length);
    } catch (error) {
      console.warn('[v0] Failed to cache shelters:', error);
    }
  }

  static async getShelters(): Promise<any[]> {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([DATA_STORE], 'readonly');
      const store = transaction.objectStore(DATA_STORE);

      return new Promise((resolve, reject) => {
        const request = store.get('shelters');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : []);
        };
      });
    } catch (error) {
      console.warn('[v0] Failed to retrieve cached shelters:', error);
      return [];
    }
  }

  static async cacheEvacuationInstructions(
    instructions: Record<string, string>
  ): Promise<void> {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([DATA_STORE], 'readwrite');
      const store = transaction.objectStore(DATA_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          key: 'evacuationInstructions',
          data: instructions,
          timestamp: Date.now(),
        });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });

      console.log('[v0] Evacuation instructions cached for offline access');
    } catch (error) {
      console.warn('[v0] Failed to cache evacuation instructions:', error);
    }
  }

  static async getEvacuationInstructions(): Promise<Record<string, string>> {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([DATA_STORE], 'readonly');
      const store = transaction.objectStore(DATA_STORE);

      return new Promise((resolve, reject) => {
        const request = store.get('evacuationInstructions');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : {});
        };
      });
    } catch (error) {
      console.warn('[v0] Failed to retrieve cached evacuation instructions:', error);
      return {};
    }
  }

  static async cacheUserSettings(settings: any): Promise<void> {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([DATA_STORE], 'readwrite');
      const store = transaction.objectStore(DATA_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          key: 'userSettings',
          data: settings,
          timestamp: Date.now(),
        });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('[v0] Failed to cache user settings:', error);
    }
  }

  static async getUserSettings(): Promise<any> {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([DATA_STORE], 'readonly');
      const store = transaction.objectStore(DATA_STORE);

      return new Promise((resolve, reject) => {
        const request = store.get('userSettings');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
      });
    } catch (error) {
      console.warn('[v0] Failed to retrieve cached user settings:', error);
      return null;
    }
  }

  static async clearCache(): Promise<void> {
    try {
      const db = await this.getDatabase();
      const transaction = db.transaction([DATA_STORE], 'readwrite');
      const store = transaction.objectStore(DATA_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });

      console.log('[v0] Cache cleared');
    } catch (error) {
      console.warn('[v0] Failed to clear cache:', error);
    }
  }
}

// Monitor connectivity changes
export function setupConnectivityMonitoring(
  onStatusChange: (status: 'online' | 'degraded' | 'offline') => void
) {
  const updateStatus = () => {
    if (!navigator.onLine) {
      onStatusChange('offline');
    } else {
      // Check connection quality
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType) {
          if (connection.effectiveType === '4g') {
            onStatusChange('online');
          } else {
            onStatusChange('degraded');
          }
        } else {
          onStatusChange('online');
        }
      } else {
        onStatusChange('online');
      }
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  if ('connection' in navigator) {
    (navigator as any).connection?.addEventListener('change', updateStatus);
  }

  updateStatus();

  return () => {
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
  };
}

// Mock sample data for offline mode
export const MOCK_SHELTERS = [
  {
    id: '1',
    name: 'Central High School',
    distance: 0.8,
    bearing: 45,
    capacity: 500,
    availableSpaces: 250,
    type: 'indoor' as const,
    lastUpdated: new Date(),
  },
  {
    id: '2',
    name: 'Mountain Peak Park',
    distance: 1.2,
    bearing: 135,
    capacity: 300,
    availableSpaces: 200,
    type: 'open-space' as const,
    lastUpdated: new Date(),
  },
  {
    id: '3',
    name: 'Underground Parking - Civic Center',
    distance: 0.5,
    bearing: 270,
    capacity: 400,
    availableSpaces: 50,
    type: 'underground' as const,
    lastUpdated: new Date(),
  },
  {
    id: '4',
    name: 'Hospital Complex - 4th Floor',
    distance: 1.5,
    bearing: 315,
    capacity: 200,
    availableSpaces: 100,
    type: 'indoor' as const,
    lastUpdated: new Date(),
  },
];

export const MOCK_EVACUATION_INSTRUCTIONS = {
  flood: 'Move to high ground immediately. Avoid standing water. Do not attempt to cross flooded areas. Listen to emergency broadcasts for updates.',
  cyclone:
    'Seek shelter in a reinforced building away from windows. Stay inside until all-clear is given. Avoid using elevators. Do not go outside.',
  earthquake:
    'Drop, cover, and hold on. If outside, move away from buildings and power lines. Do not use elevators. Wait for aftershocks to subside before moving.',
  tsunami:
    'Move inland and to higher ground immediately if you feel earthquake or see ocean acting strangely. Do not wait for warnings. Do not return until official all-clear.',
};
