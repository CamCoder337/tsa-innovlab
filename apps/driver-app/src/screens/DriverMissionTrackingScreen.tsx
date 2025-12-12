import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import driverTrackingService, { type MissionDetails } from '../services/driverTrackingService';
import googleMapsService from '../services/googleMapsService';
import QRCodeScanner from '../components/QRCodeScanner';
import { Colors } from '../constants/colors';
import { useTranslation } from '../hooks/useTranslation';

interface DriverMissionTrackingScreenProps {
  navigation: any;
  route: {
    params: {
      mission: MissionDetails;
    };
  };
}

export const DriverMissionTrackingScreen: React.FC<DriverMissionTrackingScreenProps> = ({
  navigation,
  route,
}) => {
  const { mission } = route.params;
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);

  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPath, setLocationPath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeToPickup, setRouteToPickup] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routePickupToDelivery, setRoutePickupToDelivery] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeToCurrentDestination, setRouteToCurrentDestination] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);
  const [isNearDestination, setIsNearDestination] = useState(false);

  // Determine if cargo has been picked up based on mission status
  const isCargoPickedUp = ['loaded', 'en_route_delivery', 'arrived_delivery', 'delivered'].includes(
    mission.status.toLowerCase()
  );

  // Effect to start and stop tracking
  useEffect(() => {
    const start = async () => {
      try {
        console.log('Starting location tracking on screen mount');
        await driverTrackingService.startLocationTracking(
          (location) => {
            setCurrentLocation(location);
            setLocationPath(prev => [...prev, { latitude: location.coords.latitude, longitude: location.coords.longitude }]);
          },
          (error) => {
            Alert.alert(t('tracking.gpsError', 'GPS Error'), error);
          }
        );
      } catch (error: any) {
        Alert.alert(t('common.error', 'Error'), error.message);
      }
    };

    start();

    return () => {
      console.log('Stopping location tracking on screen unmount');
      driverTrackingService.stopLocationTracking();
    };
  }, []);

  // Effect to handle location updates and calculate all routes
  useEffect(() => {
    if (!currentLocation || !mapRef.current) return;

    // Animate camera to current position and heading
    mapRef.current.animateCamera({
      center: currentLocation.coords,
      heading: currentLocation.coords.heading ?? 0,
      pitch: 45,
      zoom: 16,
    }, { duration: 1000 });

    // Calculate all routes
    const calculateAllRoutes = async () => {
      const driverPosition = { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude };
      const pickupPoint = { latitude: mission.departureAddress.latitude, longitude: mission.departureAddress.longitude };
      const deliveryPoint = { latitude: mission.arrivalAddress.latitude, longitude: mission.arrivalAddress.longitude };

      try {
        // 1. Route from driver to pickup (always show if cargo not picked up)
        if (!isCargoPickedUp) {
          const routeToPickupPoints = await googleMapsService.getDirections(driverPosition, pickupPoint);
          setRouteToPickup(routeToPickupPoints);
          
          // Calculate distance to pickup for display
          const distToPickup = googleMapsService.calculateDistance(driverPosition, pickupPoint) / 1000;
          setDistanceToDestination(distToPickup);
          setIsNearDestination(distToPickup < 0.2);
        } else {
          // If cargo picked up, clear pickup route and calculate distance to delivery
          setRouteToPickup([]);
          const distToDelivery = googleMapsService.calculateDistance(driverPosition, deliveryPoint) / 1000;
          setDistanceToDestination(distToDelivery);
          setIsNearDestination(distToDelivery < 0.2);
        }

        // 2. Route from pickup to delivery (always show for mission planning)
        const routePickupDeliveryPoints = await googleMapsService.getDirections(pickupPoint, deliveryPoint);
        setRoutePickupToDelivery(routePickupDeliveryPoints);

        // 3. Current route to active destination
        const targetDestination = !isCargoPickedUp ? pickupPoint : deliveryPoint;
        const currentRoutePoints = await googleMapsService.getDirections(driverPosition, targetDestination);
        setRouteToCurrentDestination(currentRoutePoints);

      } catch (error) {
        console.error('Could not calculate routes:', error);
      }
    };

    calculateAllRoutes();

  }, [currentLocation, isCargoPickedUp]);



  const handleRecenterMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera({
        center: currentLocation.coords,
        heading: currentLocation.coords.heading ?? 0,
        pitch: 45,
        zoom: 16,
      }, { duration: 1000 });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType="standard"
        showsUserLocation={false} // We use a custom marker
        showsPointsOfInterest={false}
        initialRegion={{
          latitude: mission.departureAddress.latitude,
          longitude: mission.departureAddress.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Pickup/Depot Marker - Always show */}
        {mission.departureAddress && (
          <Marker
            coordinate={{ latitude: mission.departureAddress.latitude, longitude: mission.departureAddress.longitude }}
            title={t('tracking.pickup', 'Dépôt (Pickup)')}
            pinColor="green"
          />
        )}

        {/* Destination Marker - Always show */}
        {mission.arrivalAddress && (
          <Marker
            coordinate={{ latitude: mission.arrivalAddress.latitude, longitude: mission.arrivalAddress.longitude }}
            title={t('tracking.arrival', 'Destination')}
            pinColor="red"
          />
        )}

        {/* Traveled Path - Actual path taken by driver */}
        {locationPath.length > 1 && (
          <Polyline 
            coordinates={locationPath} 
            strokeColor="#666666" 
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Route from Driver to Pickup (Orange - only if cargo not picked up) */}
        {!isCargoPickedUp && routeToPickup.length > 0 && (
          <Polyline 
            coordinates={routeToPickup} 
            strokeColor="#FF8C00" 
            strokeWidth={6}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Route from Pickup to Delivery (Green dashed - mission plan) */}
        {routePickupToDelivery.length > 0 && (
          <Polyline 
            coordinates={routePickupToDelivery} 
            strokeColor="#32CD32" 
            strokeWidth={5}
            lineDashPattern={[15, 10]}
          />
        )}

        {/* Current Active Route (Blue solid - to current destination) */}
        {routeToCurrentDestination.length > 0 && (
          <Polyline 
            coordinates={routeToCurrentDestination} 
            strokeColor={Colors.primary} 
            strokeWidth={7}
            lineDashPattern={[0]}
          />
        )}

        {/* Driver's Marker */}
        {currentLocation && (
          <Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={currentLocation.coords} style={{ transform: [{ rotate: `${currentLocation.coords.heading || 0}deg` }] }}>
            <Ionicons name="navigate-circle" size={40} color={Colors.primary} />
          </Marker>
        )}
      </MapView>

      {/* Info Panel */}
      <View style={styles.infoCard}>
        {distanceToDestination !== null ? (
          <Text style={styles.distanceText}>{distanceToDestination.toFixed(1)} km</Text>
        ) : (
          <ActivityIndicator color={Colors.primary} />
        )}
        <Text style={styles.addressText}>
          {!isCargoPickedUp
            ? `${t('tracking.toPickup', 'Vers dépôt:')} ${mission.departureAddress.city}`
            : `${t('tracking.to', 'Vers:')} ${mission.arrivalAddress.city}`
          }
        </Text>
      </View>

      {/* Route Legend */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Itinéraires</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Route active</Text>
        </View>
        {!isCargoPickedUp && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#FF8C00' }]} />
            <Text style={styles.legendText}>Vers dépôt</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#32CD32' }]} />
          <Text style={styles.legendText}>Plan mission</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#666666' }]} />
          <Text style={styles.legendText}>Trajet parcouru</Text>
        </View>
      </View>

      {/* Actions Panel */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.deliveryButton}
          onPress={() => navigation.navigate('DeliveryProof', {
            missionId: mission.id,
            currentLocation: currentLocation?.coords
          })}
        >
          <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
          <Text style={styles.actionButtonText}>{t('tracking.finalizeDelivery', 'Finaliser la Livraison')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportButton} onPress={() => navigation.navigate('DriverReportIssue', { currentLocation: currentLocation?.coords })}>
          <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Map Recentering FAB */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenterMap}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  infoCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    alignItems: 'center',
  },
  distanceText: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  addressText: { fontSize: 16, color: Colors.textSecondary, marginTop: 4 },
  legendCard: {
    position: 'absolute',
    top: 160,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minWidth: 140,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.success,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    marginRight: 10,
  },
  reportButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  actionButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white', marginLeft: 10 },
  buttonDisabled: { backgroundColor: Colors.disabled, elevation: 2 },
  recenterButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
