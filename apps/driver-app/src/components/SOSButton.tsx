import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
  Vibration,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { driverTrackingService } from '../services/driverTrackingService';

interface SOSButtonProps {
  onSOSAlert?: (type: string, description: string) => void;
  onSOSSuccess?: (issueId: string, conversationId: number | null) => void;
}

type SOSType = 'accident' | 'breakdown' | 'medical' | 'security';

const SOS_TYPES: { id: SOSType; label: string; icon: string; priority: string }[] = [
  { id: 'accident', label: 'Accident', icon: '💥', priority: 'CRITIQUE' },
  { id: 'medical', label: 'Médical', icon: '🏥', priority: 'CRITIQUE' },
  { id: 'security', label: 'Sécurité', icon: '🚨', priority: 'CRITIQUE' },
  { id: 'breakdown', label: 'Panne', icon: '⚙️', priority: 'HAUTE' },
];

const EMERGENCY_CONTACTS = {
  police: '117',
  samu: '119',
  pompiers: '118',
};

export const SOSButton: React.FC<SOSButtonProps> = ({ onSOSAlert, onSOSSuccess }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<SOSType | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Animation de pulsation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleSOSPress = useCallback(() => {
    // Vibration de feedback
    Vibration.vibrate(100);
    setIsModalVisible(true);
  }, []);

  const handleCallEmergency = useCallback((number: string) => {
    Linking.openURL(`tel:${number}`);
  }, []);

  const handleSendSOS = useCallback(async () => {
    if (!selectedType) {
      Alert.alert('Erreur', "Veuillez sélectionner le type d'urgence");
      return;
    }

    Alert.alert(
      '🚨 Confirmer SOS',
      'Voulez-vous envoyer une alerte SOS ?\n\nL\'administration et l\'affréteur seront notifiés immédiatement.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'ENVOYER SOS',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            Vibration.vibrate([0, 200, 100, 200]); // Pattern de vibration

            try {
              // Appeler le callback legacy si fourni
              if (onSOSAlert) {
                onSOSAlert(selectedType, description);
              }

              // Envoyer le SOS via l'API
              const result = await driverTrackingService.reportSOS(selectedType, description);

              // Callback de succès
              if (onSOSSuccess) {
                onSOSSuccess(result.issueId, result.conversationId);
              }

              // Reset et fermer
              setSelectedType(null);
              setDescription('');
              setIsModalVisible(false);

              // Confirmation avec options d'appel
              Alert.alert(
                '✅ SOS Envoyé',
                'Votre alerte a été transmise.\nUn admin va vous contacter.\n\nAppeler les secours ?',
                [
                  { text: 'Police (117)', onPress: () => handleCallEmergency('117') },
                  { text: 'SAMU (119)', onPress: () => handleCallEmergency('119') },
                  { text: 'OK', style: 'cancel' },
                ]
              );
            } catch (error: any) {
              console.error('SOS Error:', error);
              
              // Afficher les contacts d'urgence même en cas d'erreur
              const contacts = error.emergencyContacts || EMERGENCY_CONTACTS;
              
              Alert.alert(
                '⚠️ Erreur SOS',
                `${error.message || 'Impossible d\'envoyer le SOS'}\n\nAppelez directement les secours :`,
                [
                  { text: `Police (${contacts.police})`, onPress: () => handleCallEmergency(contacts.police) },
                  { text: `SAMU (${contacts.samu})`, onPress: () => handleCallEmergency(contacts.samu) },
                  { text: 'Fermer', style: 'cancel' },
                ]
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [selectedType, description, onSOSAlert, onSOSSuccess, handleCallEmergency]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedType(null);
    setDescription('');
  }, []);

  return (
    <>
      {/* Bouton SOS flottant */}
      <Animated.View style={[styles.sosButton, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.sosButtonInner}
          onPress={handleSOSPress}
          activeOpacity={0.8}
          delayLongPress={500}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de sélection du type d'alerte */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🚨 URGENCE SOS</Text>
                <Text style={styles.modalSubtitle}>Sélectionnez le type d'urgence</Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButtonContainer}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Types d'alerte */}
            <View style={styles.typeGrid}>
              {SOS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && styles.typeCardSelected,
                    type.priority === 'CRITIQUE' && styles.typeCardCritical,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                  disabled={isLoading}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text
                    style={[styles.typeLabel, selectedType === type.id && styles.typeLabelSelected]}
                  >
                    {type.label}
                  </Text>
                  <Text style={[
                    styles.priorityBadge,
                    type.priority === 'CRITIQUE' ? styles.priorityCritical : styles.priorityHigh
                  ]}>
                    {type.priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.inputLabel}>Description (optionnelle) :</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Décrivez brièvement la situation..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              editable={!isLoading}
            />

            {/* Contacts d'urgence rapides */}
            <View style={styles.emergencyContactsContainer}>
              <Text style={styles.emergencyContactsTitle}>Appel direct :</Text>
              <View style={styles.emergencyContactsRow}>
                <TouchableOpacity
                  style={styles.emergencyContactButton}
                  onPress={() => handleCallEmergency('117')}
                >
                  <Text style={styles.emergencyContactText}>🚔 117</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emergencyContactButton}
                  onPress={() => handleCallEmergency('119')}
                >
                  <Text style={styles.emergencyContactText}>🚑 119</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emergencyContactButton}
                  onPress={() => handleCallEmergency('118')}
                >
                  <Text style={styles.emergencyContactText}>🚒 118</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Boutons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={closeModal}
                disabled={isLoading}
              >
                <Text style={styles.buttonCancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSOS, !selectedType && styles.buttonDisabled]}
                onPress={handleSendSOS}
                disabled={!selectedType || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonSOSText}>ENVOYER SOS</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sosButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    zIndex: 1000,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  sosButtonInner: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  sosText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#DC2626',
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  closeButtonContainer: {
    padding: 4,
  },
  closeButton: {
    fontSize: 28,
    color: Colors.text.secondary,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  typeCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  typeCardSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  typeCardCritical: {
    borderColor: '#FCA5A5',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  typeLabelSelected: {
    color: '#DC2626',
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  priorityCritical: {
    backgroundColor: '#DC2626',
    color: Colors.white,
  },
  priorityHigh: {
    backgroundColor: '#F59E0B',
    color: Colors.white,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    marginBottom: 12,
  },
  emergencyContactsContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  emergencyContactsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  emergencyContactsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  emergencyContactButton: {
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  emergencyContactText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: Colors.gray[200],
  },
  buttonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  buttonSOS: {
    backgroundColor: '#DC2626',
  },
  buttonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  buttonSOSText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
});

export default SOSButton;
