/**
 * Compass Bearing Calculations
 * 
 * This module performs geodetic calculations to determine relative bearing
 * between two geographic points and compare with device heading.
 * 
 * Mathematics:
 * - Initial bearing: Uses spherical trigonometry (haversine-derived formulas)
 * - Distance: Haversine formula for great-circle distance
 * - Relative heading: Comparison between calculated bearing and device heading
 * 
 * Limitations:
 * - Assumes Earth is a sphere (actually an oblate spheroid)
 * - Device heading from sensors is affected by magnetic interference
 * - GPS accuracy varies by location and atmospheric conditions
 */

const EARTH_RADIUS_M = 6371000; // Earth's mean radius in meters

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Calculate initial bearing from point A to point B
 * Using spherical trigonometry
 * 
 * @param lat1 Latitude of point A (degrees)
 * @param lon1 Longitude of point A (degrees)
 * @param lat2 Latitude of point B (degrees)
 * @param lon2 Longitude of point B (degrees)
 * @returns Bearing in degrees (0-360, where 0 is North)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const dLon = toRadians(lon2 - lon1);

  // Spherical trigonometry formula for initial bearing
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return normalizeAngle(bearing);
}

/**
 * Calculate great-circle distance between two points
 * Using Haversine formula
 * 
 * @param lat1 Latitude of point A (degrees)
 * @param lon1 Longitude of point A (degrees)
 * @param lat2 Latitude of point B (degrees)
 * @param lon2 Longitude of point B (degrees)
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Determine direction hint based on heading vs bearing to peer
 * 
 * @param deviceHeading Current device heading (0-360, 0 = North)
 * @param bearingToPeer Bearing to remote peer (0-360)
 * @returns Direction hint
 */
export function getDirectionHint(
  deviceHeading: number,
  bearingToPeer: number
): 'facing-each-other' | 'turn-left' | 'turn-right' | 'not-aligned' {
  const normalizedHeading = normalizeAngle(deviceHeading);
  const normalizedBearing = normalizeAngle(bearingToPeer);

  // Calculate angular difference (shortest path around the circle)
  let diff = normalizedBearing - normalizedHeading;
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }

  // Determine direction hint based on angular difference
  // Tolerance of ±30 degrees for "facing each other"
  const tolerance = 30;

  if (Math.abs(diff) <= tolerance) {
    return 'facing-each-other';
  } else if (Math.abs(diff) <= 180) {
    // Determine if we need to turn left or right
    return diff > 0 ? 'turn-right' : 'turn-left';
  }

  return 'not-aligned';
}

/**
 * Check if two devices are roughly facing each other
 * Takes into account both bearings
 * 
 * @param heading1 Device 1 heading (degrees)
 * @param heading2 Device 2 heading (degrees)
 * @param bearingFromDevice1To2 Bearing from device 1 to device 2
 * @param tolerance Angular tolerance in degrees (default: 45)
 * @returns true if devices are facing each other within tolerance
 */
export function areDevicesFacingEachOther(
  heading1: number,
  heading2: number,
  bearingFromDevice1To2: number,
  tolerance: number = 45
): boolean {
  // Device 1 should face toward device 2
  const bearing1TowardDevice2 = normalizeAngle(bearingFromDevice1To2);
  let diff1 = normalizeAngle(bearing1TowardDevice2 - normalizeAngle(heading1));
  if (diff1 > 180) diff1 -= 360;

  // Device 2 should face toward device 1 (opposite direction)
  const bearing2TowardDevice1 = normalizeAngle(bearingFromDevice1To2 + 180);
  let diff2 = normalizeAngle(bearing2TowardDevice1 - normalizeAngle(heading2));
  if (diff2 > 180) diff2 -= 360;

  return Math.abs(diff1) <= tolerance && Math.abs(diff2) <= tolerance;
}

/**
 * Format distance for display
 * 
 * @param distanceM Distance in meters
 * @returns Formatted string (e.g., "125 m", "1.2 km")
 */
export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) {
    return `${Math.round(distanceM)} m`;
  }
  return `${(distanceM / 1000).toFixed(1)} km`;
}

/**
 * Get compass direction name from bearing
 * 
 * @param bearing Bearing in degrees (0-360)
 * @returns Cardinal/intercardinal direction name
 */
export function getBearingName(bearing: number): string {
  const normalized = normalizeAngle(bearing);
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}
