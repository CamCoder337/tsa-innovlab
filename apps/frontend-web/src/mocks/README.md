# Mock Data Documentation

## Tracking Mock Data

This directory contains mock data for development and testing of the tracking feature.

### Available Mock Shipments

The `trackingData.ts` file provides several pre-configured mock shipments:

#### 1. `TSA2025001234` - In Transit (Default)

- **Status**: `in_transit`
- **Route**: Douala → Yaoundé
- **Progress**: 59% complete
- **Current Location**: Near Edéa (Route Nationale N3)
- **Driver**: Jean-Paul Mbarga (Rating: 4.7)
- **Package**: 25.5 kg, Electronics equipment worth 450,000 FCFA

#### 2. `TSA2025001235` - Delivered

- **Status**: `delivered`
- **Progress**: 100% complete
- **Location**: At destination (Centre Commercial Bastos, Yaoundé)

#### 3. `TSA2025001236` - Delayed

- **Status**: `delayed`
- **Progress**: 95% complete
- **Location**: Near Bastos, Yaoundé (5km remaining)

#### 4. `TSA2025001237` - Exception

- **Status**: `exception`
- **Alerts**: Critical issue requiring support contact

### Usage

The tracking store automatically uses this mock data when fetching shipment information:

```typescript
import { useTracking } from '@/stores/trackingStore';

// Use with a pre-configured tracking number
const { tracking, isLoading, error } = useTracking('TSA2025001234');

// Or generate a new mock shipment with any tracking number
const { tracking, isLoading, error } = useTracking('TSA2025999999');
```

### Data Structure

The mock data follows the `ShipmentDetails` interface which includes:

- **Basic Information**: Tracking number, status, origin, destination
- **Location Data**: Current position with coordinates, historical tracking points
- **Route Information**: Segments with distance, duration, weather conditions
- **Alerts**: Real-time notifications about delays, checkpoints, etc.
- **Package Details**: Weight, dimensions, contents, and declared value
- **Carrier Information**: Driver details, vehicle type, contact information
- **Progress Metrics**: Distance traveled/remaining, estimated delivery, completion percentage

### Customization

To add more mock shipments, edit `trackingData.ts`:

```typescript
export const mockShipmentsDatabase: Record<string, ShipmentDetails> = {
  YOUR_TRACKING_NUMBER: generateMockShipment('YOUR_TRACKING_NUMBER', 'in_transit'),
  // ... other shipments
};
```

### Notes

- Mock data simulates a 1-second network delay
- All coordinates are for real locations in Cameroon (Douala to Yaoundé route)
- Package values are in FCFA (Central African Franc)
- The `generateMockShipment` function creates dynamic shipments for any tracking number not in the database
