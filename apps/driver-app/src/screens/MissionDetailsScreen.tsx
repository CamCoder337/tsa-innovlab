import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { StatusBadge } from '../components/StatusBadge';
import { SOSButton } from '../components/SOSButton';
import { MissionStatus } from '../types/mission.types';
import * as ImagePicker from 'expo-image-picker';
import { getMission, updateMissionStatus } from '../services/missionService';
import { Mission } from '../types/mission.types';

interface MissionDetailsScreenProps {
  route: any;
  navigation: any;
}

export const MissionDetailsScreen: React.FC<MissionDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { missionId } = route.params;
  const [mission, setMission] = React.useState<Mission | undefined>();

  // Charger la mission au montage du composant
  React.useEffect(() => {
    const loadMission = async () => {
      const loadedMission = await getMission(missionId);
      setMission(loadedMission);
    };
    loadMission();
  }, [missionId]);

  // Mettre à jour la mission si elle change dans les paramètres de navigation
  React.useEffect(() => {
    if (route.params?.updatedMission) {
      setMission(route.params.updatedMission);
    }
  }, [route.params]);

  // Recharger la mission à chaque fois que l'écran reçoit le focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const updatedMission = await getMission(missionId);
      if (updatedMission) {
        setMission(updatedMission);
      }
    });

    return unsubscribe;
  }, [navigation, missionId]);

  if (!mission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mission introuvable</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleStartMission = () => {
    if (!mission) return;

    Alert.alert('Démarrer la mission', 'Êtes-vous prêt à commencer cette mission ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Démarrer',
        onPress: async () => {
          try {
            const updatedMission = await updateMissionStatus(mission.id, MissionStatus.ACCEPTED);
            if (updatedMission) {
              setMission(updatedMission);
              Alert.alert('Mission démarrée', 'La mission a été démarrée avec succès.');
            } else {
              throw new Error('Impossible de démarrer la mission');
            }
          } catch (error) {
            console.error('Erreur lors du démarrage de la mission:', error);
            Alert.alert('Erreur', 'Impossible de démarrer la mission. Veuillez réessayer.');
          }
        },
      },
    ]);
  };

  const handleCompleteMission = async () => {
    if (!mission) return;

    try {
      // Vérifier les permissions de la caméra
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert(
          'Permission requise',
          "L'accès à la caméra est nécessaire pour prendre une photo de preuve de livraison."
        );
        return;
      }

      // Vérifier les permissions du stockage
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!mediaPermission.granted) {
        Alert.alert(
          'Permission requise',
          "L'accès au stockage est nécessaire pour enregistrer la preuve de livraison."
        );
        return;
      }

      // Mettre à jour le statut de la mission
      const updatedMission = await updateMissionStatus(mission.id, MissionStatus.EN_ROUTE_DELIVERY);

      if (updatedMission) {
        // Naviguer vers l'écran de preuve de livraison
        navigation.navigate('ProofOfDelivery', {
          mission: updatedMission,
          onGoBack: (updatedMission: Mission) => {
            // Mettre à jour la mission dans l'écran actuel
            setMission(updatedMission);

            // Afficher un message de succès
            Alert.alert('Mission terminée', 'La mission a été marquée comme terminée avec succès.');
          },
        });
      } else {
        throw new Error('Impossible de mettre à jour le statut de la mission');
      }
    } catch (error) {
      console.error('Erreur lors de la préparation de la preuve de livraison:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la préparation de la preuve de livraison. Veuillez réessayer.'
      );
    }
  };

  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSOSAlert = (type: string, description: string) => {
    console.log('SOS Alert:', type, description);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la mission</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Mission Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.missionNumber}>{mission.missionNumber}</Text>
              <Text style={styles.cargoType}>{mission.cargoType}</Text>
            </View>
            <StatusBadge status={mission.status} />
          </View>

          {mission.progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${mission.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{mission.progress}%</Text>
            </View>
          )}
        </View>

        {/* Route Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Itinéraire</Text>

          {/* Pickup */}
          <View style={styles.routeItem}>
            <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>Point de ramassage</Text>
              <Text style={styles.routeCity}>{mission.pickup.city}</Text>
              <Text style={styles.routeAddress}>{mission.pickup.address}</Text>
              <Text style={styles.routeTime}>{formatDateTime(mission.pickupTime)}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          {/* Delivery */}
          <View style={styles.routeItem}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>Point de livraison</Text>
              <Text style={styles.routeCity}>{mission.delivery.city}</Text>
              <Text style={styles.routeAddress}>{mission.delivery.address}</Text>
              <Text style={styles.routeTime}>{formatDateTime(mission.deliveryTime)}</Text>
            </View>
          </View>
        </View>

        {/* Mission Stats */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{mission.distance} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Poids</Text>
              <Text style={styles.statValue}>{mission.weight} kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Durée estimée</Text>
              <Text style={styles.statValue}>
                {Math.floor(mission.estimatedDuration / 60)}h{mission.estimatedDuration % 60}
              </Text>
            </View>
          </View>

          {mission.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{mission.description}</Text>
            </View>
          )}

          {mission.specialInstructions && (
            <View style={styles.specialInstructionsContainer}>
              <Text style={styles.specialInstructionsLabel}>⚠️ Instructions spéciales</Text>
              <Text style={styles.specialInstructionsText}>{mission.specialInstructions}</Text>
            </View>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contacts</Text>

          {/* Shipper */}
          <View style={styles.contactItem}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactLabel}>Expéditeur</Text>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(mission.shipper.phone)}
              >
                <Text style={styles.callButtonText}>📞 Appeler</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.contactName}>{mission.shipper.name}</Text>
            <Text style={styles.contactCompany}>{mission.shipper.company}</Text>
            <Text style={styles.contactPhone}>{mission.shipper.phone}</Text>
          </View>

          <View style={styles.divider} />

          {/* Recipient */}
          <View style={styles.contactItem}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactLabel}>Destinataire</Text>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(mission.recipient.phone)}
              >
                <Text style={styles.callButtonText}>📞 Appeler</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.contactName}>{mission.recipient.name}</Text>
            <Text style={styles.contactPhone}>{mission.recipient.phone}</Text>
          </View>
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Action Buttons */}
      {mission.status === MissionStatus.ASSIGNED && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={handleStartMission}
          >
            <Text style={styles.actionButtonText}>Accepter la mission</Text>
          </TouchableOpacity>
        </View>
      )}

      {[
        MissionStatus.ACCEPTED,
        MissionStatus.EN_ROUTE_PICKUP,
        MissionStatus.ARRIVED_PICKUP,
        MissionStatus.LOADED,
        MissionStatus.EN_ROUTE_DELIVERY,
        MissionStatus.ARRIVED_DELIVERY,
      ].includes(mission.status) && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor:
                  mission.status === MissionStatus.ARRIVED_DELIVERY
                    ? Colors.success
                    : Colors.primary,
              },
            ]}
            onPress={handleCompleteMission}
          >
            <Text style={styles.actionButtonText}>
              {mission.status === MissionStatus.ARRIVED_DELIVERY
                ? 'Confirmer la livraison'
                : 'Marquer comme terminée'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton SOS */}
      <SOSButton onSOSAlert={handleSOSAlert} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  missionNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  cargoType: {
    fontSize: 15,
    color: Colors.text.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    width: 40,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
  },
  routeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  routeCity: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  routeTime: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  routeLine: {
    width: 2,
    height: 32,
    backgroundColor: Colors.gray[200],
    marginLeft: 7,
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    marginHorizontal: 4,
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
  descriptionContainer: {
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  specialInstructionsContainer: {
    backgroundColor: Colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  specialInstructionsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.warning,
    marginBottom: 6,
  },
  specialInstructionsText: {
    fontSize: 13,
    color: Colors.text.primary,
    lineHeight: 18,
  },
  contactItem: {
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  callButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  contactCompany: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 120, // Au-dessus du bouton SOS
    left: 20,
    right: 20,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
