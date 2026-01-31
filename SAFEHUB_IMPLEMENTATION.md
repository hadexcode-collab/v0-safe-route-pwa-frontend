# SafeRoute: Calamity-Aware Disaster Intelligence System

## Overview

SafeRoute has been extended into a comprehensive disaster intelligence system that operates in two automatic modes: **Survival Mode** and **Awareness Mode**. All existing features are preserved and fully backward-compatible.

## Core Architecture

### Two Operating Modes

**1. Survival Mode** (Outside SafeHub)
- Low bandwidth usage
- Offline-first behavior
- Sensor-driven navigation
- Minimal UI
- Escape and safety focused
- All existing SafeRoute features work

**2. Awareness Mode** (Inside SafeHub)
- Connected to SafeHub Wi-Fi
- Rich maps and live updates
- Situation monitoring
- High-bandwidth features allowed
- Advanced disaster intelligence enabled

### Automatic Mode Switching

The app automatically detects SafeHub connection and switches modes without user action:
- Users can manually confirm SafeHub presence via UI prompt
- Confirmation persists for 24 hours
- SafeHub connection loss triggers automatic revert to Survival Mode
- Mode indicator banner shows current state

## Implemented Features

### 1. SafeHub Detection & Management (`/lib/safehub-context.tsx`)

**Key Functions:**
- `useSafeHub()` - Access SafeHub connection state
- `confirmSafeHub(ssid, name)` - Manually confirm SafeHub presence
- `clearSafeHubConfirmation()` - Clear SafeHub connection
- `appMode` - Returns 'survival' or 'awareness'

**Component:**
- `SafeHubConfirmation` - Dialog to confirm SafeHub location with common SafeHub list

**Features:**
- Wi-Fi SSID detection fallback to manual confirmation
- 24-hour persistence in localStorage
- Mode indicator banner at app top

### 2. Person-Locked Compass (`/hooks/use-person-locked-compass.ts`)

**Key Hook:**
- `usePersonLockedCompass()` - Lock compass direction toward a specific person

**Features:**
- Locks compass bearing to tracked person's last known location
- Calculates real-time distance using Haversine formula
- Tracks signal freshness (fresh < 1min, stale >= 1min)
- Auto-unlocks when SafeHub connection lost
- Shows clear warning banner when connection lost

**Component:**
- `PersonCompassDisplay` - Full-screen compass overlay showing target person

### 3. Family Finder with Person IDs (`/components/family-finder-enhanced.tsx`)

**Tracked Data:**
- Unique Person ID (e.g., "MOM-12345")
- Optional name for display
- Last known location (latitude, longitude)
- Last update timestamp
- Status tracking (safe/moving/unreachable)

**Features:**
- Add/remove family members by Person ID
- Display last known location with timestamp
- Refresh location data when connected to SafeHub
- Lock compass to track specific family member
- Crowd reports aggregation (Tsunami mode)
- Offline-first caching

### 4. Tsunami Intelligence (`/components/disaster-intelligence/tsunami-intelligence.tsx`)

**Awareness Mode Only Features:**
- Coastal water depth heatmap with color coding
- Safe zones visualization with altitude
- Crowd-sourced water level reporting (verified by SafeHub)
- Water recession timeline with DO NOT RETURN warning
- Navigation restrictions into active danger areas

**Crowd Reports:**
- Users can report observed water levels
- Reports aggregated and verified via SafeHub
- Clear timestamps and location tracking

### 5. Cyclone Intelligence (`/components/disaster-intelligence/cyclone-intelligence.tsx`)

**Awareness Mode Features:**
- Live cyclone eye visualization with animated wind vectors
- Wind intensity rings and directional indicators
- Infrastructure status:
  - Power grid (operational/partial/down)
  - Network availability
  - Flooded roads list
- **Safe Exit Indicator** (large, bold, panic-proof):
  - "DO NOT MOVE" (cyclone approaching)
  - "PREPARE" (impact imminent)
  - "SAFE TO EXIT" (cyclone passed)

### 6. Earthquake Intelligence (`/components/disaster-intelligence/earthquake-intelligence.tsx`)

**Awareness Mode Features:**
- Epicenter visualization with intensity rings
- Magnitude display (color-coded by severity)
- Intensity bar (0-10 scale)
- Aftershock pulse animation
- Real-time aftershock probability feed
- Structural risk zones mapping:
  - Unsafe
  - Needs inspection
  - Low risk
- Restricted roads with reason (debris/cracks/structural)

## Data Storage & Persistence

### Emergency Context Extensions (`/lib/emergency-context.tsx`)

**New State Added:**
```typescript
// Person tracking
trackedPeople: Person[]
addTrackedPerson(uniqueId, name?)
removeTrackedPerson(uniqueId)
updatePersonLocation(uniqueId, location)

// Disaster intelligence
tsunamiData: TsunamiData | null
setTsunamiData(data)

cycloneData: CycloneData | null
setCycloneData(data)

earthquakeData: EarthquakeData | null
setEarthquakeData(data)
```

### Offline Cache

Existing offline-first architecture preserved:
- Shelters cached in IndexedDB
- Family member data persists offline
- Disaster intelligence available when cached
- Automatic sync when connection restored

## Integration Points

### App Layout (`/app/page.tsx`)

- SafeHubProvider wraps EmergencyProvider
- Mode indicator banner at top
- SafeHub confirmation dialog
- All existing screens work unchanged

### Usage Example

```typescript
const { trackedPeople, addTrackedPerson } = useEmergency();
const { appMode } = useSafeHub();
const { lockCompass } = usePersonLockedCompass();

// Add family member
addTrackedPerson('DAD-54321', 'Dad');

// Lock compass when in Awareness Mode
if (appMode === 'awareness') {
  lockCompass('DAD-54321', 'Dad');
}
```

## Backward Compatibility

All existing features remain unchanged:
- Compass navigation screen
- Shelter finder
- Family locator screen
- SOS emergency mode
- Accessibility settings
- Offline support
- Disaster type selection

No breaking changes to:
- Component props
- Context API
- Routing
- UI behavior
- Performance

## Network-Aware Behavior

**No Internet:**
- Offline Survival Mode
- Uses cached data
- Sensor-based navigation only

**Mobile Data:**
- Limited updates
- Essential information only
- Battery-efficient

**SafeHub Wi-Fi:**
- Full Awareness Mode features
- Real-time updates
- High-bandwidth content allowed

## Disaster-Specific UI

Each disaster type has:
- Specific color theme (already implemented)
- Large tap targets (existing)
- One-hand usability (existing)
- Minimal text in Survival Mode
- Information-rich in Awareness Mode

## Testing Checklist

- [ ] SafeHub detection and manual confirmation
- [ ] Mode switching on SafeHub connect/disconnect
- [ ] Person-locked compass functionality
- [ ] Family member tracking and storage
- [ ] Person ID input and validation
- [ ] Compass auto-unlock on connection loss
- [ ] Tsunami water level reporting
- [ ] Cyclone status visualization
- [ ] Earthquake aftershock display
- [ ] Offline data persistence
- [ ] All existing features still work

## Optional Enhancements (Future)

- Voice-based guidance commands
- AI-generated situation summaries
- Digital breadcrumb trails for rescuers
- Real-time SafeHub server integration
- Push notifications for disaster updates
- Multi-language support

## File Structure

```
lib/
  safehub-context.tsx              # SafeHub detection & mode switching
  emergency-context.tsx             # Extended with disaster intelligence
  peer-compass/                     # Existing peer compass logic
  peer/                             # Existing peer communication

components/
  safehub-confirmation.tsx          # SafeHub confirmation dialog
  person-compass-display.tsx        # Person-locked compass UI
  family-finder-enhanced.tsx        # Person ID-based family finder
  disaster-intelligence/
    tsunami-intelligence.tsx        # Tsunami data & reporting
    cyclone-intelligence.tsx        # Cyclone tracking & status
    earthquake-intelligence.tsx     # Earthquake & aftershock data

hooks/
  use-person-locked-compass.ts      # Person-locked compass hook
  (existing hooks preserved)
```

## Product Goal

**"SafeRoute guides users to safety, then tells them when it is safe to return."**

This implementation achieves that goal through:
1. **Guidance** - All existing SafeRoute navigation features
2. **Safety** - Person tracking, disaster intelligence, SafeHub awareness
3. **Return Indicators** - Cyclone safe-exit status, tsunami recession timelines, earthquake aftershock probabilities
