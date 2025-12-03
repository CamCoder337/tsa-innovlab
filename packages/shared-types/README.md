# @tsa/shared-types

Shared TypeScript types for TSA Logistics platform.

## Installation

This package is used internally across the monorepo.

### In driver-app

```typescript
import { LocationUpdate, MissionDetails } from '@tsa/shared-types';
```

### In frontend-web

```typescript
import { DriverPosition, RouteInfo } from '@tsa/shared-types';
```

## Available Types

### Tracking Types

- `LocationCoordinates` - Basic lat/lng coordinates
- `LocationUpdate` - GPS position update with metadata
- `DriverPosition` - Real-time driver position
- `Address` - Address with coordinates
- `MissionAddress` - Mission-specific address
- `MissionIssue` - Issue reported during mission
- `MissionDetails` - Complete mission information
- `TrackingCredentials` - Token + PIN for vehicle tracking
- `RouteInfo` - Route distance, duration, and ETA

### Enums

- `IssueType` - Type of issue (breakdown, delay, etc.)
- `IssueStatus` - Issue status (reported, acknowledged, resolved)
- `MissionStatus` - Mission workflow status

## Development

```bash
# Type check
npm run typecheck
```

## License

MIT
