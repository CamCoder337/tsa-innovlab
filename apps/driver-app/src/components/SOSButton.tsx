import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Colors } from '../constants/colors';

interface SOSButtonProps {
  onSOSAlert?: (_type: string, _description: string) => void;
}

const SOS_TYPES = [
  { id: 'accident', label: 'Accident', icon: '🚨' },
  { id: 'breakdown', label: 'Panne', icon: '⚙️' },
  { id: 'security', label: 'Sécurité', icon: '🛡️' },
  { id: 'other', label: 'Autre', icon: '❓' },
];

export const SOSButton: React.FC<SOSButtonProps> = ({ onSOSAlert }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));

  // Animation de pulsation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleSOSPress = () => {
    setIsModalVisible(true);
  };

  const handleSendSOS = () => {
    if (!selectedType) {
      Alert.alert('Erreur', "Veuillez sélectionner le type d'alerte");
      return;
    }

    Alert.alert(
      "Confirmer l'alerte SOS",
      'Voulez-vous vraiment envoyer une alerte SOS ? Les autorités et votre entreprise seront notifiées immédiatement.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Envoyer',
          style: 'destructive',
          onPress: () => {
            // Envoyer l'alerte SOS
            if (onSOSAlert) {
              onSOSAlert(selectedType, description);
            }

            // Reset et fermer
            setSelectedType(null);
            setDescription('');
            setIsModalVisible(false);

            // Confirmation
            Alert.alert(
              'Alerte SOS envoyée',
              'Votre alerte a été transmise. Des secours vont être dépêchés à votre position.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  return (
    <>
      {/* Bouton SOS flottant */}
      <Animated.View style={[styles.sosButton, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.sosButtonInner}
          onPress={handleSOSPress}
          activeOpacity={0.8}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de sélection du type d'alerte */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alerte SOS</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedType(null);
                  setDescription('');
                }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Sélectionnez le type d'urgence :</Text>

            {/* Types d'alerte */}
            <View style={styles.typeGrid}>
              {SOS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeCard, selectedType === type.id && styles.typeCardSelected]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text
                    style={[styles.typeLabel, selectedType === type.id && styles.typeLabelSelected]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.inputLabel}>Description (optionnelle) :</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Décrivez la situation..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Boutons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedType(null);
                  setDescription('');
                }}
              >
                <Text style={styles.buttonCancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.buttonSOS]} onPress={handleSendSOS}>
                <Text style={styles.buttonSOSText}>Envoyer SOS</Text>
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.sos,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  sosText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.sos,
  },
  closeButton: {
    fontSize: 28,
    color: Colors.text.secondary,
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  typeCardSelected: {
    borderColor: Colors.sos,
    backgroundColor: '#FEE2E2',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  typeLabelSelected: {
    color: Colors.sos,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
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
    backgroundColor: Colors.sos,
  },
  buttonSOSText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
