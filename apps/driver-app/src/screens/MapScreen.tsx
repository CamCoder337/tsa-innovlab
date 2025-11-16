import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '../constants/colors';
import { getActiveMissions } from '../data/mockMissions';
import { Mission, MissionStatus } from '../types/mission.types';
import { StatusBadge } from '../components/StatusBadge';
import { SOSButton } from '../components/SOSButton';

interface MapScreenProps {
  navigation: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const mapRef = useRef<MapView>(null);
  const activeMissions = getActiveMissions();

  // Centre initial de la carte (Cameroun - Douala)
  const initialRegion = {
    latitude: 4.0511,
    longitude: 9.7679,
    latitudeDelta: 3,
    longitudeDelta: 3,
  };

  const handleMarkerPress = (mission: Mission) => {
    setSelectedMission(mission);

    // Centrer la carte sur la mission sélectionnée
    mapRef.current?.animateToRegion({
      latitude: mission.pickup.latitude,
      longitude: mission.pickup.longitude,
      latitudeDelta: 1,
      longitudeDelta: 1,
    });
  };

  const handleMissionCardPress = () => {
    if (selectedMission) {
      navigation.navigate('MissionDetails', { missionId: selectedMission.id });
    }
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
        {/* Marqueurs pour chaque mission active */}
        {activeMissions.map((mission) => (
          <React.Fragment key={mission.id}>
            {/* Marqueur de ramassage (pickup) */}
            <Marker
              coordinate={{
                latitude: mission.pickup.latitude,
                longitude: mission.pickup.longitude,
              }}
              title={`Ramassage - ${mission.missionNumber}`}
              description={mission.pickup.address}
              pinColor={Colors.primary}
              onPress={() => handleMarkerPress(mission)}
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
              onPress={() => handleMarkerPress(mission)}
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
              strokeWidth={3}
              lineDashPattern={[5, 5]}
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
          </React.Fragment>
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mes Missions</Text>
          <Text style={styles.headerSubtitle}>
            {activeMissions.length} mission{activeMissions.length > 1 ? 's' : ''} active{activeMissions.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('MissionList')}
        >
          <Text style={styles.listButtonText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Mission sélectionnée - Carte en bas */}
      {selectedMission && (
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
                    {selectedMission.missionNumber}
                  </Text>
                  <Text style={styles.cargoType}>
                    {selectedMission.cargoType}
                  </Text>
                </View>
                <StatusBadge status={selectedMission.status} />
              </View>

              {/* Route */}
              <View style={styles.route}>
                <View style={styles.routePoint}>
                  <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                  <Text style={styles.cityText}>{selectedMission.pickup.city}</Text>
                </View>
                <View style={styles.routeArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <View style={styles.routePoint}>
                  <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.cityText}>{selectedMission.delivery.city}</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{selectedMission.distance} km</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{selectedMission.weight} kg</Text>
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
