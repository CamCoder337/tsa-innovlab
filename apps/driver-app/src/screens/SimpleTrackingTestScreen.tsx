import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
// DEPRECATED: backendTrackingService has been replaced by the centralized env config system
// import { backendTrackingService } from '../services/backendTrackingService';

export const SimpleTrackingTestScreen: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [tracking, setTracking] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Démarrer le tracking automatiquement au montage
  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, []);

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La géolocalisation est nécessaire pour le tracking.');
        return;
      }

      setTracking(true);
      setUpdateCount(0);

      // Obtenir et envoyer la position immédiatement
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);

      // DEPRECATED: backendTrackingService removed
      console.log('📍 Position update:', {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
        speed: currentLocation.coords.speed,
        heading: currentLocation.coords.heading,
      });

      // Suivre la position en temps réel
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 3000, // Toutes les 3 secondes
          distanceInterval: 10, // Ou tous les 10 mètres
        },
        (newLocation) => {
          setLocation(newLocation);
          setUpdateCount((prev) => prev + 1);
          setLastUpdate(new Date());

          // DEPRECATED: backendTrackingService removed
          console.log('📍 Position update:', {
            lat: newLocation.coords.latitude,
            lng: newLocation.coords.longitude,
          });
        }
      );

      console.log('📍 Tracking started (test mode - no backend service)');
      Alert.alert(
        'Tracking Démarré',
        'Test mode - positions sont loggées en console.'
      );
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Erreur', `Impossible de démarrer le tracking: ${error}`);
      setTracking(false);
    }
  };

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    console.log('⏹️ Tracking stopped');
    setTracking(false);

    Alert.alert('Tracking Arrêté', 'Le tracking GPS a été arrêté');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚗 Test GPS Tracking</Text>
        <Text style={styles.subtitle}>Liaison App Mobile → Dashboard Web</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Test Mode:</Text>
        <Text style={styles.infoValue}>Local GPS Testing</Text>
      </View>

      <View style={styles.statusBox}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, tracking ? styles.activeDot : styles.inactiveDot]} />
            <Text style={[styles.statusText, tracking ? styles.activeText : styles.inactiveText]}>
              {tracking ? 'Tracking Actif' : 'Arrêté'}
            </Text>
          </View>
        </View>

        {tracking && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Updates envoyées:</Text>
              <Text style={styles.statusValue}>{updateCount}</Text>
            </View>

            {lastUpdate && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Dernière MAJ:</Text>
                <Text style={styles.statusValue}>{lastUpdate.toLocaleTimeString()}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {location && (
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>📍 Position Actuelle</Text>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>Latitude:</Text>
            <Text style={styles.coordValue}>{location.coords.latitude.toFixed(6)}</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>Longitude:</Text>
            <Text style={styles.coordValue}>{location.coords.longitude.toFixed(6)}</Text>
          </View>
          {location.coords.altitude !== null && (
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>Altitude:</Text>
              <Text style={styles.coordValue}>{location.coords.altitude.toFixed(1)} m</Text>
            </View>
          )}
          {location.coords.speed !== null && (
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>Vitesse:</Text>
              <Text style={styles.coordValue}>
                {(location.coords.speed * 3.6).toFixed(1)} km/h
              </Text>
            </View>
          )}
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>Précision:</Text>
            <Text style={styles.coordValue}>±{location.coords.accuracy?.toFixed(0)} m</Text>
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>ℹ️ Instructions</Text>
        <Text style={styles.infoCardText}>
          1. Le tracking démarre automatiquement{'\n'}
          2. Vos positions sont envoyées toutes les 5 secondes{'\n'}
          3. Ouvrez le dashboard transporteur sur le web{'\n'}
          4. Allez dans l'onglet "Chauffeurs GPS"{'\n'}
          5. Vous devriez voir votre position en temps réel !
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {!tracking ? (
          <TouchableOpacity style={[styles.button, styles.startButton]} onPress={startTracking}>
            <Text style={styles.buttonText}>▶️ Démarrer le Tracking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopTracking}>
            <Text style={styles.buttonText}>⏹️ Arrêter le Tracking</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Intervalle: 5 secondes</Text>
        <Text style={styles.footerTextSmall}>
          Vérifiez les logs pour l'URL backend utilisée
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: '#28a745',
  },
  inactiveDot: {
    backgroundColor: '#dc3545',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#28a745',
  },
  inactiveText: {
    color: '#dc3545',
  },
  locationBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1976d2',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  coordLabel: {
    fontSize: 14,
    color: '#555',
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoCard: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    marginVertical: 2,
  },
  footerTextSmall: {
    fontSize: 10,
    color: '#bbb',
    marginVertical: 2,
    fontStyle: 'italic',
  },
});
