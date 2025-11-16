import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { SOSButton } from '../components/SOSButton';
import {
  getDirections,
  decodePolyline,
  formatDuration,
  DirectionsResult,
} from '../services/googleMapsService';
import { formatDistance } from '../utils/missionSimulator';

interface LiveTrackingScreenProps {
  route: any;
  navigation: any;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({
  route,
  navigation,
}) => {
  const { mission } = route.params;
  const mapRef = useRef<MapView>(null);

  const [routeCoordinates, setRouteCoordinates] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [directionsData, setDirectionsData] = useState<DirectionsResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [tracking, setTracking] = useState(false);
  const [traveledPath, setTraveledPath] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<
    string | null
  >(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );
  const startTime = useRef<number | null>(null);

  // Charger les directions
  useEffect(() => {
    const loadDirections = async () => {
      try {
        setLoading(true);
        const directions = await getDirections(
          mission.pickup,
          mission.delivery
        );

        if (directions) {
          setDirectionsData(directions);
          const coordinates = decodePolyline(directions.polyline);
          setRouteCoordinates(coordinates);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des directions:', error);
        Alert.alert(
          'Erreur',
          'Impossible de charger l\'itinéraire. Vérifiez votre connexion.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDirections();
  }, [mission]);

  // Centrer la carte au chargement
  useEffect(() => {
    if (mapRef.current && !loading && routeCoordinates.length > 0) {
      const centerLat =
        (mission.pickup.latitude + mission.delivery.latitude) / 2;
      const centerLng =
        (mission.pickup.longitude + mission.delivery.longitude) / 2;
      const latDelta =
        Math.abs(mission.pickup.latitude - mission.delivery.latitude) * 1.5;
      const lngDelta =
        Math.abs(mission.pickup.longitude - mission.delivery.longitude) * 1.5;

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

  // Calculer la distance entre deux points
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
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
        Alert.alert(
          'Permission refusée',
          'La géolocalisation est nécessaire pour le suivi.'
        );
        return;
      }

      setTracking(true);
      setTraveledPath([mission.pickup]);
      startTime.current = Date.now();

      // Initialiser l'ETA avec le temps de Google Maps
      if (directionsData) {
        setEstimatedTimeRemaining(formatDuration(directionsData.duration));
      }

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
              Alert.alert(
                '🎉 Mission accomplie!',
                `Vous êtes arrivé à destination!\n\nDistance parcourue: ${formatDistance(distanceTraveled)}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
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
    setTracking(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const handleSOSAlert = (type: string, description: string) => {
    console.log('SOS Alert:', type, description);
  };

  const initialRegion = {
    latitude: mission.pickup.latitude,
    longitude: mission.pickup.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      {/* Maps */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        followsUserLocation={tracking}
      >
        {/* Marqueur de départ */}
        <Marker
          coordinate={mission.pickup}
          title="Départ"
          description={mission.pickup.address}
          pinColor={Colors.primary}
        />

        {/* Marqueur d'arrivée */}
        <Marker
          coordinate={mission.delivery}
          title="Destination"
          description={mission.delivery.address}
          pinColor={Colors.success}
        />

        {/* Route complète (bleu foncé) */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}

        {/* Chemin parcouru (gris) */}
        {traveledPath.length > 1 && (
          <Polyline
            coordinates={traveledPath}
            strokeColor={Colors.gray[300]}
            strokeWidth={6}
          />
        )}

        {/* Position actuelle */}
        {currentPosition && (
          <Marker coordinate={currentPosition} title="Vous êtes ici">
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Indicateur de chargement */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Chargement de l'itinéraire...
            </Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (tracking) {
              Alert.alert(
                'Arrêter le suivi ?',
                'Voulez-vous vraiment arrêter le suivi GPS ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Arrêter',
                    style: 'destructive',
                    onPress: () => {
                      stopTracking();
                      navigation.goBack();
                    },
                  },
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{mission.missionNumber}</Text>
          <Text style={styles.headerSubtitle}>Suivi GPS en temps réel</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Panneau de statistiques */}
      {directionsData && !loading && (
        <View style={styles.statsPanel}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Progression</Text>
              <Text style={styles.statValue}>{progress}%</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distance totale</Text>
              <Text style={styles.statValue}>
                {formatDistance(directionsData.distance)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Parcourue</Text>
              <Text style={styles.statValue}>
                {formatDistance(distanceTraveled)}
              </Text>
            </View>
          </View>

          {/* ETA */}
          {estimatedTimeRemaining && tracking && (
            <View style={styles.etaContainer}>
              <Text style={styles.etaLabel}>⏱️ Temps restant estimé</Text>
              <Text style={styles.etaValue}>{estimatedTimeRemaining}</Text>
            </View>
          )}

          {/* Bouton de contrôle */}
          {!tracking ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={startTracking}
            >
              <Text style={styles.controlButtonText}>
                📍 Démarrer le suivi GPS
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={stopTracking}
            >
              <Text style={styles.controlButtonText}>⏹ Arrêter le suivi</Text>
            </TouchableOpacity>
          )}

          {tracking && (
            <Text style={styles.trackingStatus}>
              🔴 Suivi GPS actif - Déplacez-vous vers la destination
            </Text>
          )}
        </View>
      )}

      {/* Bouton SOS */}
      <SOSButton onSOSAlert={handleSOSAlert} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.text.primary,
  },
  currentLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  statsPanel: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  etaContainer: {
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
