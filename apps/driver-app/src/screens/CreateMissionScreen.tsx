import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { PlaceAutocomplete } from '../components/PlaceAutocomplete';
import {
  getPlaceDetails,
  PlacePrediction,
} from '../services/googlePlacesService';

interface CreateMissionScreenProps {
  navigation: any;
}

export const CreateMissionScreen: React.FC<CreateMissionScreenProps> = ({
  navigation,
}) => {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [pickup, setPickup] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    placeId?: string;
  } | null>(null);

  const [delivery, setDelivery] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    placeId?: string;
  } | null>(null);

  const [missionDescription, setMissionDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Obtenir la position actuelle au chargement (pour référence)
  useEffect(() => {
    (async () => {
      try {
        console.log('Vérification des permissions de localisation...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Permission de localisation refusée');
          Alert.alert(
            'Permission refusée',
            'La géolocalisation est nécessaire pour créer une mission. Veuillez activer la localisation dans les paramètres de votre appareil.'
          );
          return;
        }

        console.log('Récupération de la position actuelle...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!location || !location.coords) {
          throw new Error('Impossible de récupérer les coordonnées GPS');
        }

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        console.log('Position actuelle récupérée:', coords);
        setCurrentLocation(coords);
        
        // Si l'utilisateur a coché la case pour utiliser la position actuelle
        if (useCurrentLocation) {
          setPickup({
            ...coords,
            address: 'Ma position actuelle'
          });
        }
      } catch (error) {
        console.error('Erreur de géolocalisation:', error);
        Alert.alert(
          'Erreur de localisation', 
          'Impossible de récupérer votre position. Vérifiez que le GPS est activé et que vous avez une bonne réception.'
        );
      }
    })();
  }, [useCurrentLocation]);

  const handlePickupSelected = async (prediction: PlacePrediction) => {
    setLoading(true);
    try {
      const details = await getPlaceDetails(prediction.place_id);
      if (details) {
        setPickup({
          latitude: details.latitude,
          longitude: details.longitude,
          address: details.address,
          placeId: prediction.place_id,
        });
        setUseCurrentLocation(false);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du lieu:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les détails du lieu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySelected = async (prediction: PlacePrediction) => {
    setLoading(true);
    try {
      const details = await getPlaceDetails(prediction.place_id);
      if (details) {
        setDelivery({
          latitude: details.latitude,
          longitude: details.longitude,
          address: details.address,
          placeId: prediction.place_id,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du lieu:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les détails du lieu.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (currentLocation) {
      setLoading(true);
      try {
        const addresses = await Location.reverseGeocodeAsync(currentLocation);
        const address = addresses[0];
        const formattedAddress = address
          ? `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`
          : 'Position actuelle';

        setPickup({
          ...currentLocation,
          address: formattedAddress,
        });
        setUseCurrentLocation(true);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartMission = () => {
    if (!pickup) {
      Alert.alert('Erreur', 'Veuillez sélectionner un point de départ');
      return;
    }

    if (!delivery) {
      Alert.alert('Erreur', 'Veuillez sélectionner une destination');
      return;
    }

    // Créer la mission et naviguer vers le suivi GPS
    const newMission = {
      id: 'live-' + Date.now(),
      missionNumber: 'TSA-GPS-' + Date.now(),
      description: missionDescription || 'Suivi GPS en temps réel',
      pickup: {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        address: pickup.address || 'Point de départ',
        city: pickup.address ? (pickup.address.split(',')[1]?.trim() || 'Départ') : 'Départ',
      },
      delivery: {
        latitude: delivery.latitude,
        longitude: delivery.longitude,
        address: delivery.address || 'Destination',
        city: delivery.address ? (delivery.address.split(',')[1]?.trim() || 'Destination') : 'Destination',
      },
      isLiveTracking: true,
      autoStart: true, // Démarrer automatiquement le suivi
    };

    navigation.navigate('LiveTracking', { mission: newMission });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer une Mission GPS</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoEmoji}>🗺️</Text>
            <Text style={styles.infoText}>
              Utilisez Google Maps pour choisir votre départ et destination, puis
              suivez votre trajet en temps réel.
            </Text>
          </View>

          {/* Point de départ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Point de départ</Text>

            {!pickup ? (
              <View style={styles.choiceContainer}>
                {/* Bouton pour utiliser la position actuelle */}
                <TouchableOpacity
                  style={styles.currentLocationButton}
                  onPress={handleUseCurrentLocation}
                  disabled={!currentLocation || loading}
                >
                  <Text style={styles.currentLocationIcon}>📍</Text>
                  <Text style={styles.currentLocationText}>
                    Utiliser ma position actuelle
                  </Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OU</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Autocomplete pour chercher une adresse */}
                <PlaceAutocomplete
                  placeholder="Rechercher une adresse de départ..."
                  onPlaceSelected={handlePickupSelected}
                  currentLocation={currentLocation || undefined}
                  initialValue=""
                />
              </View>
            ) : (
              <View>
                <View style={styles.locationCard}>
                  <View style={styles.locationIcon}>
                    <Text style={styles.locationEmoji}>
                      {useCurrentLocation ? '🚩' : '📍'}
                    </Text>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>
                      {useCurrentLocation
                        ? 'Position actuelle'
                        : 'Point de départ'}
                    </Text>
                    <Text style={styles.locationAddress}>{pickup.address}</Text>
                    <Text style={styles.locationCoords}>
                      {pickup.latitude.toFixed(6)}, {pickup.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
                {/* Bouton pour changer le point de départ */}
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => {
                    setPickup(null);
                    setUseCurrentLocation(false);
                  }}
                >
                  <Text style={styles.changeButtonText}>
                    Changer le point de départ
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Destination */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Destination</Text>

            {!delivery ? (
              <PlaceAutocomplete
                placeholder="Rechercher une destination..."
                onPlaceSelected={handleDeliverySelected}
                currentLocation={currentLocation || undefined}
                initialValue=""
              />
            ) : (
              <View>
                <View style={styles.locationCard}>
                  <View style={styles.locationIcon}>
                    <Text style={styles.locationEmoji}>🎯</Text>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Destination sélectionnée</Text>
                    <Text style={styles.locationAddress}>{delivery.address}</Text>
                    <Text style={styles.locationCoords}>
                      {delivery.latitude.toFixed(6)}, {delivery.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
                {/* Bouton pour changer la destination */}
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => setDelivery(null)}
                >
                  <Text style={styles.changeButtonText}>
                    Changer la destination
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (optionnelle)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Livraison urgente au bureau"
              value={missionDescription}
              onChangeText={setMissionDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>📋 Instructions</Text>
            <Text style={styles.instructionItem}>
              1. Choisissez votre point de départ (ou utilisez votre position)
            </Text>
            <Text style={styles.instructionItem}>
              2. Sélectionnez une destination avec l'autocomplete
            </Text>
            <Text style={styles.instructionItem}>
              3. Le suivi GPS démarrera automatiquement
            </Text>
            <Text style={styles.instructionItem}>
              4. Déplacez-vous vers la destination et observez
            </Text>
          </View>

          {/* Bouton de création */}
          <TouchableOpacity
            style={[
              styles.createButton,
              (!pickup || !delivery || loading) && styles.createButtonDisabled,
            ]}
            onPress={handleStartMission}
            disabled={!pickup || !delivery || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.createButtonText}>
                🚀 Démarrer le suivi GPS
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.text.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  choiceContainer: {
    gap: 16,
  },
  currentLocationButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentLocationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  changeButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    alignItems: 'center',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationEmoji: {
    fontSize: 24,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  instructionsBox: {
    backgroundColor: Colors.success + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 13,
    color: Colors.text.primary,
    marginBottom: 6,
    paddingLeft: 8,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
