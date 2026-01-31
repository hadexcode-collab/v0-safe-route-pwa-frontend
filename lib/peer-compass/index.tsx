'use client';

/**
 * Peer Compass Module - P2P Device Orientation Alignment
 * 
 * This module provides a proof-of-concept peer-to-peer compass feature
 * using WebRTC and browser APIs to help two devices determine if they
 * are pointing toward each other.
 * 
 * Main Exports:
 * - usePeerCompass: React hook for using the feature
 * - WebRTCPeer: Low-level P2P connection class
 * - Bearing calculations: calculateBearing, calculateDistance, getDirectionHint
 * 
 * Example Usage:
 * 
 *   import { usePeerCompass } from '@/lib/peer-compass';
 * 
 *   function MyComponent() {
 *     const { status, directionHint, distanceEstimate, initiateSession } = usePeerCompass();
 * 
 *     const handleStart = async () => {
 *       await initiateSession('demo-room-123');
 *     };
 * 
 *     return (
 *       <div>
 *         <button onClick={handleStart}>Start Session</button>
 *         <p>Status: {status}</p>
 *         <p>Direction: {directionHint}</p>
 *         <p>Distance: {distanceEstimate}</p>
 *       </div>
 *     );
 *   }
 */

export { usePeerCompass, type UsePeerCompassResult } from './use-peer-compass';
export { WebRTCPeer, type PeerData, type PeerCompassState } from './webrtc-peer';
export {
  calculateBearing,
  calculateDistance,
  getDirectionHint,
  areDevicesFacingEachOther,
  formatDistance,
  getBearingName,
} from './bearing';
