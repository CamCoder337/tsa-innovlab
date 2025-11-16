import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Colors } from '../constants/colors';
import { getMissionById } from '../data/mockMissions';
import { MissionStatus } from '../types/mission.types';
import { StatusBadge } from '../components/StatusBadge';
import { SOSButton } from '../components/SOSButton';
import {
  RouteSimulator,
  RouteSimulationState,
  formatETA,
  calculateETA,
} from '../utils/routeSimulation';

interface MapScreenProps {
  route: any;
  navigation: any;
}

export const MapScreenWithSimulation: React.FC<MapScreenProps> = ({
  route,
  navigation,
}) => {
  const { missionId } = route.params;
  const mission = getMissionById(missionId);
  const mapRef = useRef<MapView>(null);
  const simulatorRef = useRef<RouteSimulator | null>(null);

  // État de la simulation
  const [simulationState, setSimulationState] =
    useState<RouteSimulationState>({
      currentPosition: mission
        ? {
            latitude: mission.pickup.latitude,
            longitude: mission.pickup.longitude,
          }
        : { latitude: 0, longitude: 0 },
      progress: 0,
      remainingDistance: mission?.distance || 0,
      eta: mission ? calculateETA(mission.distance) : 0,
      isRunning: false,
    });

  if (!mission) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Mission introuvable</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Centre initial de la carte sur la mission
  const initialRegion = {
    latitude: mission.pickup.latitude,
    longitude: mission.pickup.longitude,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  };

  // Auto-centrer la carte sur la mission au chargement
  useEffect(() => {
    if (mission && mapRef.current) {
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
          latitudeDelta: Math.max(latDelta, 0.5),
          longitudeDelta: Math.max(lngDelta, 0.5),
        });
      }, 500);
    }
  }, [mission]);

  // Initialiser le simulateur
  useEffect(() => {
    if (mission) {
      try {
        simulatorRef.current = new RouteSimulator(
          mission,
          (state) => {
            setSimulationState(state);

            // Centrer la carte sur la position actuelle
            if (mapRef.current && state.isRunning) {
              mapRef.current.animateToRegion(
                {
                  latitude: state.currentPosition.latitude,
                  longitude: state.currentPosition.longitude,
                  latitudeDelta: 0.5,
                  longitudeDelta: 0.5,
                },
                500
              );
            }

            // Notification de fin de simulation
            if (state.progress === 100 && !state.isRunning) {
              Alert.alert(
                'Mission terminée',
                `La livraison à ${mission.delivery.city} a été effectuée avec succès!`,
                [{ text: 'OK' }]
              );
            }
          },
          3 // 3 points par seconde pour une simulation plus rapide
        );
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du simulateur:', error);
      }

      return () => {
        if (simulatorRef.current) {
          simulatorRef.current.stop();
        }
      };
    }
  }, [mission]);

  // Gérer les contrôles de simulation
  const handleStartSimulation = () => {
    if (!simulatorRef.current) return;

    Alert.alert(
      'Démarrer la simulation',
      'Cette simulation va suivre le trajet de la mission en temps réel.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Démarrer',
          onPress: () => {
            simulatorRef.current?.start();
          },
        },
      ]
    );
  };

  const handlePauseSimulation = () => {
    simulatorRef.current?.pause();
  };

  const handleResetSimulation = () => {
    simulatorRef.current?.reset();
  };

  const handleMissionCardPress = () => {
    navigation.navigate('MissionDetails', { missionId: mission.id });
  };

  const handleSOSAlert = (type: string, description: string) => {
    console.log('SOS Alert:', type, description);
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
      >
        {/* Marqueur de ramassage (pickup) */}
        <Marker
          coordinate={{
            latitude: mission.pickup.latitude,
            longitude: mission.pickup.longitude,
          }}
          title={`Ramassage - ${mission.missionNumber}`}
          description={mission.pickup.address}
          pinColor={Colors.primary}
        />

        {/* Marqueur de livraison (delivery) */}
        <Marker
          coordinate={{
            latitude: mission.delivery.latitude,
            longitude: mission.delivery.longitude,
          }}
          title={`Livraison - ${mission.missionNumber}`}
          description={mission.delivery.address}
          pinColor={Colors.success}
        />

        {/* Ligne entre pickup et delivery */}
        <Polyline
          coordinates={[
            {
              latitude: mission.pickup.latitude,
              longitude: mission.pickup.longitude,
            },
            {
              latitude: mission.delivery.latitude,
              longitude: mission.delivery.longitude,
            },
          ]}
          strokeColor={
            mission.status === MissionStatus.IN_PROGRESS
              ? Colors.primary
              : Colors.gray[400]
          }
          strokeWidth={4}
          lineDashPattern={[1, 0]}
        />

        {/* Position actuelle (simulation) */}
        {simulationState.progress > 0 && simulationState.progress < 100 && (
          <Marker
            coordinate={simulationState.currentPosition}
            title="Position actuelle"
            description={`${mission.missionNumber} - ${simulationState.progress}%`}
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{mission.missionNumber}</Text>
          <Text style={styles.headerSubtitle}>
            {mission.pickup.city} → {mission.delivery.city}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Panneau de simulation */}
      <View style={styles.simulationPanel}>
        <View style={styles.simulationStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Progression</Text>
            <Text style={styles.statValue}>{simulationState.progress}%</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance restante</Text>
            <Text style={styles.statValue}>
              {simulationState.remainingDistance.toFixed(1)} km
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ETA</Text>
            <Text style={styles.statValue}>
              {formatETA(simulationState.eta)}
            </Text>
          </View>
        </View>

        {/* Contrôles de simulation */}
        <View style={styles.simulationControls}>
          {!simulationState.isRunning ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={handleStartSimulation}
            >
              <Text style={styles.controlButtonText}>
                {simulationState.progress === 0
                  ? '▶ Démarrer simulation'
                  : '▶ Reprendre'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton]}
              onPress={handlePauseSimulation}
            >
              <Text style={styles.controlButtonText}>⏸ Pause</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={handleResetSimulation}
          >
            <Text style={styles.controlButtonText}>⟲ Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mission info - Carte en bas */}
      <View style={styles.bottomSheet}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.missionCardsContainer}
        >
          <TouchableOpacity
            style={styles.missionCard}
            onPress={handleMissionCardPress}
            activeOpacity={0.9}
          >
            <View style={styles.missionHeader}>
              <View style={styles.missionHeaderLeft}>
                <Text style={styles.missionNumber}>{mission.description}</Text>
                <Text style={styles.cargoType}>{mission.cargoType}</Text>
              </View>
              <StatusBadge status={mission.status} />
            </View>

            <View style={styles.route}>
              <View style={styles.routePoint}>
                <View
                  style={[styles.dot, { backgroundColor: Colors.primary }]}
                />
                <Text style={styles.cityText}>{mission.pickup.city}</Text>
              </View>
              <View style={styles.routeArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
              <View style={styles.routePoint}>
                <View
                  style={[styles.dot, { backgroundColor: Colors.success }]}
                />
                <Text style={styles.cityText}>{mission.delivery.city}</Text>
              </View>
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{mission.distance} km</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{mission.weight} kg</Text>
              </View>
            </View>

            <View style={styles.cta}>
              <Text style={styles.ctaText}>
                Appuyez pour voir les détails
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bouton SOS flottant */}
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
  simulationPanel: {
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
  simulationStats: {
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
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  simulationControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: Colors.primary,
  },
  pauseButton: {
    backgroundColor: Colors.warning,
  },
  resetButton: {
    backgroundColor: Colors.gray[400],
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: 120,
  },
  missionCardsContainer: {
    paddingHorizontal: 20,
  },
  missionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: 320,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  missionHeaderLeft: {
    flex: 1,
  },
  missionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  cargoType: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  cityText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  routeArrow: {
    marginHorizontal: 12,
  },
  arrowText: {
    fontSize: 20,
    color: Colors.text.secondary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  cta: {
    backgroundColor: Colors.primary + '10',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
