import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '../constants/colors';
import { getMissionById } from '../data/mockMissions';
import { Mission, MissionStatus } from '../types/mission.types';
import { StatusBadge } from '../components/StatusBadge';
import { SOSButton } from '../components/SOSButton';

interface MapScreenProps {
  route: any;
  navigation: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ route, navigation }) => {
  const { missionId } = route.params;
  const mission = getMissionById(missionId);
  const mapRef = useRef<MapView>(null);

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
      // Calculer le centre entre pickup et delivery
      const centerLat = (mission.pickup.latitude + mission.delivery.latitude) / 2;
      const centerLng = (mission.pickup.longitude + mission.delivery.longitude) / 2;

      // Calculer le delta pour inclure les deux points
      const latDelta = Math.abs(mission.pickup.latitude - mission.delivery.latitude) * 1.5;
      const lngDelta = Math.abs(mission.pickup.longitude - mission.delivery.longitude) * 1.5;

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

  const handleMissionCardPress = () => {
    navigation.navigate('MissionDetails', { missionId: mission.id });
  };

  const handleSOSAlert = (type: string, description: string) => {
    console.log('SOS Alert:', type, description);
    // TODO: Implémenter l'envoi d'alerte SOS au backend
  };

  return (
    <View style={styles.container}>
      {/* Google Maps */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
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

        {/* Position actuelle pour missions en cours */}
        {mission.currentLocation && (
          <Marker
            coordinate={{
              latitude: mission.currentLocation.latitude,
              longitude: mission.currentLocation.longitude,
            }}
            title="Position actuelle"
            description={`${mission.missionNumber} - ${mission.progress}%`}
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

      {/* Mission info - Carte en bas */}
      {mission && (
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
              {/* Header */}
              <View style={styles.missionHeader}>
                <View style={styles.missionHeaderLeft}>
                  <Text style={styles.missionNumber}>
                    {mission.description}
                  </Text>
                  <Text style={styles.cargoType}>
                    {mission.cargoType}
                  </Text>
                </View>
                <StatusBadge status={mission.status} />
              </View>

              {/* Route */}
              <View style={styles.route}>
                <View style={styles.routePoint}>
                  <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                  <Text style={styles.cityText}>{mission.pickup.city}</Text>
                </View>
                <View style={styles.routeArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <View style={styles.routePoint}>
                  <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.cityText}>{mission.delivery.city}</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{mission.distance} km</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{mission.weight} kg</Text>
                </View>
              </View>

              {/* Call to action */}
              <View style={styles.cta}>
                <Text style={styles.ctaText}>Appuyez pour voir les détails</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

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
  listButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listButtonText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '600',
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: 120, // Espace pour le bouton SOS
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
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
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
