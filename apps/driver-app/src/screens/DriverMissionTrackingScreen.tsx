import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import driverTrackingService, { type MissionDetails } from '../services/driverTrackingService';
import { Colors } from '../constants/colors';

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

  const [tracking, setTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPath, setLocationPath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestPermissions();
    return () => {
      // Cleanup: arrêter le tracking quand on quitte l'écran
      if (tracking) {
        driverTrackingService.stopLocationTracking();
      }
    };
  }, []);

  const requestPermissions = async () => {
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    const { status: cameraStatus } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(locationStatus === 'granted' && cameraStatus === 'granted');
  };

  const startTracking = async () => {
    try {
      await driverTrackingService.startLocationTracking(
        (location) => {
          setCurrentLocation(location);

          // Ajouter au chemin
          const newPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setLocationPath((prev) => [...prev, newPoint]);

          // Calculer la distance depuis le départ
          if (mission.departureAddress) {
            const dist = driverTrackingService.calculateDistance(
              mission.departureAddress.latitude,
              mission.departureAddress.longitude,
              location.coords.latitude,
              location.coords.longitude
            );
            setDistance(dist / 1000); // Convertir en km
          }

          // Centrer la carte sur la position actuelle
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        },
        (error) => {
          Alert.alert('Erreur GPS', error);
        }
      );

      setTracking(true);
      Alert.alert('Tracking démarré', 'Votre position est maintenant suivie en temps réel');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const stopTracking = () => {
    driverTrackingService.stopLocationTracking();
    setTracking(false);
    Alert.alert('Tracking arrêté', 'Le suivi GPS a été arrêté');
  };

  const openScanner = () => {
    setScanning(true);
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanning(false);

    try {
      const coords = currentLocation?.coords;
      await driverTrackingService.validateDelivery(
        data,
        coords?.latitude,
        coords?.longitude
      );

      Alert.alert(
        'Livraison confirmée !',
        'La mission a été marquée comme livrée avec succès.',
        [
          {
            text: 'OK',
            onPress: () => {
              stopTracking();
              navigation.replace('MissionList');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const reportIssue = () => {
    navigation.navigate('DriverReportIssue', {
      currentLocation: currentLocation?.coords,
    });
  };

  const calculateDistanceToDestination = (): number | null => {
    if (!currentLocation || !mission.arrivalAddress) return null;

    return (
      driverTrackingService.calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        mission.arrivalAddress.latitude,
        mission.arrivalAddress.longitude
      ) / 1000
    ); // km
  };

  const distanceToDestination = calculateDistanceToDestination();
  const isNearDestination = distanceToDestination !== null && distanceToDestination < 0.2; // 200m

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Vérification des permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>Permissions requises</Text>
        <Text style={styles.errorText}>
          Cette fonctionnalité nécessite l'accès à votre position GPS et à la caméra.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Autoriser les permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerText}>Scannez le QR code de livraison</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const initialRegion = {
    latitude: mission.departureAddress?.latitude || 4.0511,
    longitude: mission.departureAddress?.longitude || 9.7679,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={initialRegion}>
          {/* Marker départ */}
          {mission.departureAddress && (
            <Marker
              coordinate={{
                latitude: mission.departureAddress.latitude,
                longitude: mission.departureAddress.longitude,
              }}
              title="Départ"
              description={mission.departureAddress.city}
              pinColor="green"
            />
          )}

          {/* Marker arrivée */}
          {mission.arrivalAddress && (
            <Marker
              coordinate={{
                latitude: mission.arrivalAddress.latitude,
                longitude: mission.arrivalAddress.longitude,
              }}
              title="Arrivée"
              description={mission.arrivalAddress.city}
              pinColor="red"
            />
          )}

          {/* Marker position actuelle */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }}
              title="Ma position"
            >
              <View style={styles.currentLocationMarker}>
                <Ionicons name="navigate" size={24} color={Colors.white} />
              </View>
            </Marker>
          )}

          {/* Polyline du chemin parcouru */}
          {locationPath.length > 1 && (
            <Polyline
              coordinates={locationPath}
              strokeColor={Colors.primary}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.missionTitle}>{mission.title}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              {mission.departureAddress?.city} → {mission.arrivalAddress?.city}
            </Text>
          </View>
          {distanceToDestination !== null && (
            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                Distance restante: {distanceToDestination.toFixed(2)} km
              </Text>
            </View>
          )}
          {distance > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>Distance parcourue: {distance.toFixed(2)} km</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Tracking toggle */}
        <TouchableOpacity
          style={[styles.actionButton, tracking && styles.actionButtonActive]}
          onPress={tracking ? stopTracking : startTracking}
        >
          <Ionicons
            name={tracking ? 'pause' : 'play'}
            size={24}
            color={Colors.white}
          />
          <Text style={styles.actionButtonText}>
            {tracking ? 'Arrêter le tracking' : 'Démarrer le tracking'}
          </Text>
        </TouchableOpacity>

        {/* Scanner QR */}
        {isNearDestination && tracking && (
          <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
            <Ionicons name="qr-code" size={24} color={Colors.white} />
            <Text style={styles.scanButtonText}>Scanner QR Code</Text>
          </TouchableOpacity>
        )}

        {/* Report issue */}
        {tracking && (
          <TouchableOpacity style={styles.reportButton} onPress={reportIssue}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
            <Text style={styles.reportButtonText}>Signaler un problème</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  currentLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  infoCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  actions: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    marginBottom: 12,
  },
  actionButtonActive: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: Colors.success,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    marginBottom: 12,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  reportButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  reportButtonText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 6,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  scannerContainer: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 24,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
