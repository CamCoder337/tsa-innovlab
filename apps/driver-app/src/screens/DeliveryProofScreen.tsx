import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface ProofOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export default function DeliveryProofScreen() {
  const navigation = useNavigation();

  const handlePhotoCapture = () => {
    Alert.alert(
      'Prendre une photo',
      'Cette fonctionnalité permettra de photographier le bon de livraison.',
      [{ text: 'OK' }]
    );
    // TODO: Implémenter la capture photo avec expo-image-picker
  };

  const handleSignatureCapture = () => {
    Alert.alert(
      'Obtenir la signature',
      'Cette fonctionnalité permettra au client de signer électroniquement.',
      [{ text: 'OK' }]
    );
    // TODO: Implémenter la signature avec react-native-signature-canvas
  };

  const handleQRCodeScan = () => {
    Alert.alert(
      'Scanner le QR Code',
      'Cette fonctionnalité permettra de scanner le QR code de confirmation.',
      [{ text: 'OK' }]
    );
    // TODO: Implémenter le scan QR avec expo-barcode-scanner
  };

  const proofOptions: ProofOption[] = [
    {
      id: 'photo',
      title: 'Prendre une photo',
      description: 'Photographier le bon de livraison signé',
      icon: 'camera',
      color: '#3B82F6',
      onPress: handlePhotoCapture,
    },
    {
      id: 'signature',
      title: 'Obtenir la signature',
      description: 'Faire signer le client sur l écran',
      icon: 'create',
      color: '#8B5CF6',
      onPress: handleSignatureCapture,
    },
    {
      id: 'qrcode',
      title: 'Scanner le QR Code',
      description: 'Scanner le code de confirmation du client',
      icon: 'qr-code',
      color: '#10B981',
      onPress: handleQRCodeScan,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preuves de Livraison</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.instructionContainer}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.instructionText}>
            Choisissez une méthode pour confirmer la livraison
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {proofOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={40} color={option.color} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.footerNoteText}>
            Toutes les preuves sont sécurisées et horodatées
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerNoteText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
});
