import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { LatLng } from 'react-native-maps';
import { SOSButton } from '../components/SOSButton';
import {
  getDirections,
  decodePolyline,
  formatDuration,
  DirectionsResult,
} from '../services/googleMapsService';
import { formatDistance } from '../utils/missionSimulator';
import { backendTrackingService } from '../services/backendTrackingService';

interface LiveTrackingScreenProps {
  route: any;
  navigation: any;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({ route, navigation }) => {
  const { mission } = route.params;
  const mapRef = useRef<MapView>(null);

  const [routeCoordinates, setRouteCoordinates] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [directionsData, setDirectionsData] = useState<DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<LatLng | undefined>(undefined);
  const [tracking, setTracking] = useState(false);
  const [traveledPath, setTraveledPath] = useState<Array<{ latitude: number; longitude: number }>>(
    []
  );
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const startTime = useRef<number | null>(null);

  // Charger les directions
  useEffect(() => {
    const loadDirections = async () => {
      try {
        setLoading(true);
        const directions = await getDirections(mission.pickup, mission.delivery);

        if (directions) {
          setDirectionsData(directions);
          const coordinates = decodePolyline(directions.polyline);
          setRouteCoordinates(coordinates);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des directions:', error);
        Alert.alert('Erreur', "Impossible de charger l'itinéraire. Vérifiez votre connexion.");
      } finally {
        setLoading(false);
      }
    };

    loadDirections();
  }, [mission]);

  // Centrer la carte au chargement
  useEffect(() => {
    if (mapRef.current && !loading && routeCoordinates.length > 0) {
      const centerLat = (mission.pickup.latitude + mission.delivery.latitude) / 2;
      const centerLng = (mission.pickup.longitude + mission.delivery.longitude) / 2;
      const latDelta = Math.abs(mission.pickup.latitude - mission.delivery.latitude) * 1.5;
      const lngDelta = Math.abs(mission.pickup.longitude - mission.delivery.longitude) * 1.5;

      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: Math.max(latDelta, 0.05),
          longitudeDelta: Math.max(lngDelta, 0.05),
        });
      }, 500);
    }
  }, [loading, routeCoordinates]);

  // Démarrer automatiquement le suivi si autoStart est activé
  useEffect(() => {
    if (mission.autoStart && !loading && directionsData && !tracking) {
      // Attendre un peu pour que la carte soit prête
      setTimeout(() => {
        startTracking();
      }, 1000);
    }
  }, [mission.autoStart, loading, directionsData]);

  // Nettoyer le tracking au démontage du composant
  useEffect(() => {
    return () => {
      backendTrackingService.stopAutoTracking();
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Calculer la distance entre deux points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  };

  // Démarrer le suivi GPS
  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La géolocalisation est nécessaire pour le suivi.');
        return;
      }

      // Vérifier que mission.pickup est défini
      if (!mission.pickup || !mission.pickup.latitude || !mission.pickup.longitude) {
        console.error('Point de départ invalide:', mission.pickup);
        Alert.alert('Erreur', 'Impossible de démarrer le suivi: point de départ invalide');
        return;
      }

      setTracking(true);
      setTraveledPath([
        {
          latitude: mission.pickup.latitude,
          longitude: mission.pickup.longitude,
        },
      ]);
      startTime.current = Date.now();

      // Initialiser l'ETA avec le temps de Google Maps
      if (directionsData) {
        setEstimatedTimeRemaining(formatDuration(directionsData.duration));
      }

      // Démarrer l'envoi automatique au backend
      backendTrackingService.startAutoTracking();
      console.log('📍 Backend tracking started for device:', backendTrackingService.getDeviceId());

      // Suivre la position en temps réel
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Mise à jour toutes les 2 secondes
          distanceInterval: 5, // Ou tous les 5 mètres
        },
        (location) => {
          const newPosition = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          setCurrentPosition(newPosition);

          // Mettre à jour la position dans le service de tracking backend
          backendTrackingService.updatePosition(
            location.coords.latitude,
            location.coords.longitude,
            location.coords.speed || undefined,
            location.coords.heading || undefined
          );

          // Ajouter au chemin parcouru
          setTraveledPath((prev) => {
            const lastPos = prev[prev.length - 1];
            const dist = calculateDistance(
              lastPos.latitude,
              lastPos.longitude,
              newPosition.latitude,
              newPosition.longitude
            );

            // Ajouter seulement si on a bougé de plus de 5m
            if (dist > 5) {
              setDistanceTraveled((d) => d + dist);
              return [...prev, newPosition];
            }
            return prev;
          });

          // Calculer la progression et l'ETA
          if (directionsData) {
            const distToDestination = calculateDistance(
              newPosition.latitude,
              newPosition.longitude,
              mission.delivery.latitude,
              mission.delivery.longitude
            );

            // Calculer la progression basée sur la distance parcourue
            const totalDist = directionsData.distance;
            setDistanceTraveled((currentTraveled) => {
              const prog = Math.min(100, (currentTraveled / totalDist) * 100);
              setProgress(Math.round(prog));

              // Calculer l'ETA basé sur la vitesse moyenne
              if (startTime.current && currentTraveled > 100) {
                const elapsedTime = (Date.now() - startTime.current) / 1000; // en secondes
                const averageSpeed = currentTraveled / elapsedTime; // m/s
                const remainingDistance = totalDist - currentTraveled;
                const estimatedSeconds = remainingDistance / averageSpeed;

                if (estimatedSeconds > 0 && isFinite(estimatedSeconds)) {
                  setEstimatedTimeRemaining(formatDuration(estimatedSeconds));
                }
              }

              return currentTraveled;
            });

            // Vérifier si arrivé
            if (distToDestination < 50) {
              // Moins de 50m
              stopTracking();
              navigation.navigate('ProofOfDelivery', {
                mission: {
                  ...mission,
                  status: 'delivered',
                  completedAt: new Date().toISOString(),
                  distanceTraveled,
                },
              });
            }
          }

          // Centrer la carte sur la position actuelle
          if (mapRef.current) {
            mapRef.current.animateCamera({
              center: newPosition,
              zoom: 16,
            });
          }
        }
      );
    } catch (error) {
      console.error('Erreur de suivi GPS:', error);
      Alert.alert('Erreur', 'Impossible de démarrer le suivi GPS.');
      setTracking(false);
    }
  };

  // Arrêter le suivi GPS
  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    // Arrêter l'envoi automatique au backend
    backendTrackingService.stopAutoTracking();
    console.log('⏹️ Backend tracking stopped');

    setTracking(false);
  };

  const _handleSOSAlert = () => {
    // Implémentation du bouton SOS
    Alert.alert('Alerte SOS', 'Une alerte a été envoyée au support avec votre position actuelle.', [
      { text: 'OK' },
    ]);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement de l'itinéraire...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: mission.pickup.latitude,
              longitude: mission.pickup.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={true}
            showsCompass={true}
            toolbarEnabled={true}
            loadingEnabled={true}
            loadingIndicatorColor={Colors.primary}
            loadingBackgroundColor={Colors.background}
            mapType="mutedStandard"
            userInterfaceStyle="dark"
            rotateEnabled={true}
            pitchEnabled={true}
            showsBuildings={true}
            showsTraffic={true}
            showsIndoors={true}
            showsIndoorLevelPicker={true}
            showsScale={true}
          >
            {/* Marqueur de départ */}
            <Marker
              coordinate={mission.pickup}
              title="Point de ramassage"
              description={mission.pickupAddress}
              pinColor={Colors.primary}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.markerPin, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.markerText}>D</Text>
                </View>
                <View style={[styles.markerPointer, { borderTopColor: Colors.primary }]} />
              </View>
            </Marker>

            {/* Marqueur d'arrivée */}
            <Marker
              coordinate={mission.delivery}
              title="Point de livraison"
              description={mission.deliveryAddress}
              pinColor="#FF0000"
            >
              <View style={styles.markerContainer}>
                <View style={[styles.markerPin, { backgroundColor: '#FF0000' }]}>
                  <Text style={styles.markerText}>A</Text>
                </View>
                <View style={[styles.markerPointer, { borderTopColor: '#FF0000' }]} />
              </View>
            </Marker>

            {/* Itinéraire */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={Colors.primary}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
                lineDashPattern={[1]}
              />
            )}

            {/* Chemin parcouru */}
            {traveledPath.length > 1 && (
              <Polyline
                coordinates={traveledPath}
                strokeColor="#1E90FF"
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>

          {/* En-tête avec informations de navigation */}
          <View style={styles.headerContainer}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Vers{' '}
                {mission.delivery?.address ? mission.delivery.address.split(',')[0] : 'Destination'}
              </Text>
              {directionsData && (
                <Text style={styles.headerSubtitle}>
                  {formatDistance(directionsData.distance)} •{' '}
                  {formatDuration(directionsData.duration)}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Panneau d'informations en bas */}
          <View style={styles.bottomPanel}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, progress))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}% du trajet effectué</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDistance(distanceTraveled)}</Text>
                <Text style={styles.statLabel}>Parcouru</Text>
              </View>

              <View style={styles.statSeparator} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {directionsData
                    ? formatDistance(directionsData.distance - distanceTraveled)
                    : '--'}
                </Text>
                <Text style={styles.statLabel}>Restant</Text>
              </View>

              <View style={styles.statSeparator} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{estimatedTimeRemaining || '--'}</Text>
                <Text style={styles.statLabel}>Temps restant</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.navigationButton,
                { backgroundColor: tracking ? Colors.danger : Colors.primary },
              ]}
              onPress={tracking ? stopTracking : startTracking}
            >
              <Text style={styles.navigationButtonText}>
                {tracking ? 'Arrêter la navigation' : 'Démarrer la navigation'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bouton de localisation */}
          <TouchableOpacity
            style={styles.myLocationButton}
            onPress={() => {
              if (mapRef.current && currentPosition) {
                mapRef.current.animateCamera({
                  center: currentPosition,
                  zoom: 16,
                });
              }
            }}
          >
            <Text style={styles.myLocationButtonText}>📍</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Bouton SOS flottant */}
      <View style={styles.sosButtonContainer}>
        <SOSButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Styles de base
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Styles pour les statistiques
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statSeparator: {
    width: 1,
    backgroundColor: '#e0e0e0',
    height: '100%',
  },

  // Bouton de navigation
  navigationButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  navigationButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Bouton de localisation
  myLocationButton: {
    position: 'absolute',
    right: 15,
    bottom: 180,
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  myLocationButtonText: {
    fontSize: 24,
  },

  // Conteneur du bouton SOS
  sosButtonContainer: {
    position: 'absolute',
    right: 20,
    top: 120,
    zIndex: 5,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.text.primary,
    fontSize: 16,
  },

  // Marqueurs personnalisés
  markerContainer: {
    alignItems: 'center',
  },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  markerPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },

  // En-tête
  headerContainer: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  headerInfo: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    marginTop: -2,
  },

  // Panneau du bas
  bottomPanel: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  controlButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  startButton: {
    backgroundColor: Colors.success,
  },
  stopButton: {
    backgroundColor: Colors.danger,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  trackingStatus: {
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
});
