import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { MissionDetails } from '../services/driverTrackingService';
import googleMapsService from '../services/googleMapsService';
import { Colors } from '../constants/colors';
import { useTranslation } from '../hooks/useTranslation';

interface DriverMissionStartScreenProps {
  navigation: any;
  route: {
    params: {
      mission: MissionDetails;
    };
  };
}

export const DriverMissionStartScreen: React.FC<DriverMissionStartScreenProps> = ({
  navigation,
  route,
}) => {
  const { mission } = route.params;
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);

  const [missionRouteCoordinates, setMissionRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    fetchMissionRoute();
  }, []);

  const fetchMissionRoute = async () => {
    if (mission.departureAddress && mission.arrivalAddress) {
      try {
        const route = await googleMapsService.getDirections(
          {
            latitude: mission.departureAddress.latitude,
            longitude: mission.departureAddress.longitude,
          },
          {
            latitude: mission.arrivalAddress.latitude,
            longitude: mission.arrivalAddress.longitude,
          }
        );
        setMissionRouteCoordinates(route);
      } catch (error) {
        console.error("Failed to fetch mission route:", error);
        Alert.alert(t('common.error'), 'Failed to load mission route.');
      }
    }
  };

  const handleStartMission = () => {
    // Replace this screen with the tracking screen
    navigation.replace('DriverMissionTracking', { mission });
  };

  const getInitialRegion = () => {
    if (mission.departureAddress?.latitude && mission.departureAddress?.longitude) {
      return {
        latitude: mission.departureAddress.latitude,
        longitude: mission.departureAddress.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    // Default to Douala, Cameroon if no address
    return {
      latitude: 4.0511,
      longitude: 9.7679,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('mission.missionBriefing', 'Briefing de la Mission')}</Text>
        <Text style={styles.subtitle}>{mission.title}</Text>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={getInitialRegion()}
        onMapReady={() => {
          if (mission.departureAddress && mission.arrivalAddress && mapRef.current) {
            // Fit map to route markers
            setTimeout(() => {
              mapRef.current?.fitToCoordinates([
                { latitude: mission.departureAddress.latitude, longitude: mission.departureAddress.longitude },
                { latitude: mission.arrivalAddress.latitude, longitude: mission.arrivalAddress.longitude },
              ], {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }, 500);
          }
        }}
      >
        {mission.departureAddress && (
          <Marker
            coordinate={{
              latitude: mission.departureAddress.latitude,
              longitude: mission.departureAddress.longitude,
            }}
            title={t('tracking.departure', 'Départ')}
            description={mission.departureAddress.city}
            pinColor="green"
          />
        )}
        {mission.arrivalAddress && (
          <Marker
            coordinate={{
              latitude: mission.arrivalAddress.latitude,
              longitude: mission.arrivalAddress.longitude,
            }}
            title={t('tracking.arrival', 'Arrivée')}
            description={mission.arrivalAddress.city}
            pinColor="red"
          />
        )}
        {missionRouteCoordinates.length > 0 && (
          <Polyline
            coordinates={missionRouteCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={5}
          />
        )}
      </MapView>

      <View style={styles.detailsContainer}>
        <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>{t('tracking.departure', 'Adresse de départ')}</Text>
            <Text style={styles.addressText}>{mission.departureAddress?.fullAddress || mission.departureAddress?.city}</Text>
        </View>
        <Ionicons name="arrow-down" size={24} color={Colors.primary} style={styles.arrowIcon} />
        <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>{t('tracking.arrival', 'Adresse de destination')}</Text>
            <Text style={styles.addressText}>{mission.arrivalAddress?.fullAddress || mission.arrivalAddress?.city}</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartMission}>
          <Ionicons name="play-circle-outline" size={24} color={Colors.white} />
          <Text style={styles.startButtonText}>{t('mission.startMission', 'DÉMARRER LA MISSION')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.backButtonText}>{t('common.back', 'Retour')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  detailsContainer: {
    backgroundColor: Colors.white,
    padding: 20,
    paddingTop: 10,
  },
  addressBox: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.background,
  },
  addressLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  arrowIcon: {
      alignSelf: 'center',
      marginVertical: 8,
  },
  actions: {
    padding: 16,
    paddingTop: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: Colors.success,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 10,
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
});
