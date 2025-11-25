import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import { Mission, MissionStatus } from '../types/mission.types';
import {
  getActionButtonText,
  getNextStatus,
  makePhoneCall,
  promptNavigationChoice,
} from '../utils/missionHelpers';

interface MissionActionsProps {
  mission: Mission;
  onStatusChange: (_newStatus: MissionStatus) => void;
  onProofOfDelivery: () => void;
}

export const MissionActions: React.FC<MissionActionsProps> = ({
  mission,
  onStatusChange,
  onProofOfDelivery,
}) => {
  const handleStatusChange = () => {
    const nextStatus = getNextStatus(mission.status);

    if (!nextStatus) return;

    // Si on arrive à destination, demander la preuve de livraison
    if (mission.status === MissionStatus.ARRIVED_DELIVERY) {
      onProofOfDelivery();
      return;
    }

    onStatusChange(nextStatus);
  };

  const handleCallRecipient = () => {
    if (mission.recipient?.phone) {
      makePhoneCall(mission.recipient.phone);
    } else {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible.');
    }
  };

  const handleNavigation = () => {
    // Naviguer vers le pickup ou la livraison selon le statut
    const destination =
      mission.status === MissionStatus.ACCEPTED || mission.status === MissionStatus.EN_ROUTE_PICKUP
        ? mission.pickup
        : mission.delivery;

    promptNavigationChoice(destination.latitude, destination.longitude, destination.address);
  };

  const actionButtonText = getActionButtonText(mission.status);

  // Ne pas afficher d'actions pour les missions terminées
  if (
    mission.status === MissionStatus.DELIVERED ||
    mission.status === MissionStatus.FAILED ||
    mission.status === MissionStatus.CANCELLED
  ) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Bouton d'action principal */}
      {actionButtonText && (
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleStatusChange}
        >
          <Text style={styles.primaryButtonText}>{actionButtonText}</Text>
        </TouchableOpacity>
      )}

      {/* Actions secondaires */}
      <View style={styles.secondaryActions}>
        {/* Appeler le destinataire */}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleCallRecipient}>
          <Text style={styles.secondaryButtonIcon}>📞</Text>
          <Text style={styles.secondaryButtonText}>Appeler</Text>
        </TouchableOpacity>

        {/* Navigation */}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleNavigation}>
          <Text style={styles.secondaryButtonIcon}>🧭</Text>
          <Text style={styles.secondaryButtonText}>Navigation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
