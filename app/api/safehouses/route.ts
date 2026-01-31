import { SAFEHOUSES, type SafeHouse } from '@/lib/data/safehouses';
import { calculateDistance, calculateBearing } from '@/lib/utils/geo';

export interface SafeHouseResult {
  nearest: SafeHouse & { distance: number; bearing: number };
  alternatives: Array<SafeHouse & { distance: number; bearing: number }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lon = parseFloat(searchParams.get('lon') || '0');

  // Validate coordinates
  if (isNaN(lat) || isNaN(lon)) {
    return Response.json(
      { error: 'Invalid latitude or longitude' },
      { status: 400 }
    );
  }

  // Calculate distance and bearing for each safe house
  const safehousesWithDistance = SAFEHOUSES.map((safehouse) => ({
    ...safehouse,
    distance: calculateDistance(lat, lon, safehouse.latitude, safehouse.longitude),
    bearing: calculateBearing(lat, lon, safehouse.latitude, safehouse.longitude),
  }));

  // Sort by priority first, then by distance
  safehousesWithDistance.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.distance - b.distance;
  });

  // Get nearest and top 3 alternatives
  const nearest = safehousesWithDistance[0];
  const alternatives = safehousesWithDistance.slice(1, 4);

  const result: SafeHouseResult = {
    nearest,
    alternatives,
  };

  return Response.json(result);
}
