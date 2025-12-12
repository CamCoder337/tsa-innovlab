import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Modal from 'react-native-modal';
import SignaturePad from '../components/SignaturePad';
import QRCodeScanner from '../components/QRCodeScanner';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getMission, updateMissionStatus } from '../services/missionService';
import { Mission, MissionStatus } from '../types/mission.types';
import driverTrackingService from '../services/driverTrackingService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Alert } from 'react-native';

interface ProofOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  completed: boolean;
}

type DeliveryProofRouteProp = RouteProp<RootStackParamList, 'DeliveryProof'>;

export default function DeliveryProofScreen() {
  const navigation = useNavigation();
  const route = useRoute<DeliveryProofRouteProp>();
  const { missionId, currentLocation } = route.params;
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();

  const [mission, setMission] = useState<Mission | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);
  const [isQRScannerVisible, setIsQRScannerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isValidatingQR, setIsValidatingQR] = useState(false);

  // Charger la mission
  useEffect(() => {
    const loadMission = async () => {
      if (missionId) {
        const loadedMission = await getMission(missionId);
        setMission(loadedMission || null);
      }
    };
    loadMission();
  }, [missionId]);

  // Gestion de la prise de photo
  const handlePhotoCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        showError("Vous devez autoriser l'accès à la caméra pour prendre une photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
        showSuccess('Photo capturée avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo :', error);
      showError('Une erreur est survenue lors de la prise de photo.');
    }
  };

  // Gestion de la signature
  const handleSignatureCapture = () => {
    setIsSignatureModalVisible(true);
  };

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    setIsSignatureModalVisible(false);
    showSuccess('Signature enregistrée avec succès');
  };

  const handleSignatureClose = () => {
    setIsSignatureModalVisible(false);
  };

  // Gestion du scan QR code
  const handleQRCodeScan = () => {
    setIsQRScannerVisible(true);
  };

  const handleQRCodeScanned = async (data: { type: string; data: string }) => {
    // Fermer immédiatement le scanner pour éviter les scans multiples
    setIsQRScannerVisible(false);
    
    // Vérifier si on a déjà un QR code validé
    if (qrCodeData) {
      showWarning('Un QR code a déjà été scanné pour cette mission');
      return;
    }

    // Vérifier si une validation est déjà en cours
    if (isValidatingQR) {
      showWarning('Validation en cours, veuillez patienter...');
      return;
    }
    
    setIsValidatingQR(true);
    
    try {
      console.log('🔍 Starting QR code validation for mission:', missionId);
      
      // Valider seulement le QR code (sans finaliser la mission)
      const validation = await driverTrackingService.validateQRCode(
        data.data,
        currentLocation?.latitude,
        currentLocation?.longitude
      );
      
      console.log('✅ QR validation response:', validation);
      
      // Vérifier que le QR code correspond à la mission actuelle
      if (validation.missionId !== missionId) {
        showError('Ce QR code appartient à une autre mission. Vous ne pouvez scanner que le QR code de votre mission actuelle.');
        return;
      }
      
      setQrCodeData(data.data);
      showSuccess('QR code validé avec succès ! Vous pouvez maintenant finaliser la mission.');
    } catch (error: any) {
      console.error('❌ QR validation failed:', error);
      showError(error.message || 'Le QR code est invalide ou a expiré');
    } finally {
      setIsValidatingQR(false);
    }
  };

  const handleQRScannerClose = () => {
    setIsQRScannerVisible(false);
  };

  // Soumettre avec preuves
  const handleSubmitWithProofs = async () => {
    if (!photo && !signature && !qrCodeData) {
      showWarning('Veuillez ajouter au moins une preuve de livraison.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Finaliser la mission via le service de tracking
      if (mission) {
        await driverTrackingService.completeDelivery(mission.id);
        
        showSuccess('Mission terminée avec preuves de livraison');
        // Retourner à l'écran précédent après un délai
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      showError(error.message || 'Une erreur est survenue lors de la confirmation de la livraison.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Terminer la mission sans preuves
  const handleCompleteWithoutProofs = () => {
    Alert.alert(
      'Terminer la mission',
      'Êtes-vous sûr de vouloir terminer cette mission sans preuves de livraison ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: async () => {
            setIsCompleting(true);
            try {
              if (mission) {
                await driverTrackingService.completeDelivery(mission.id);
                
                showSuccess('Mission terminée');
                // Retourner à l'écran précédent après un délai
                setTimeout(() => {
                  navigation.goBack();
                }, 2000);
              }
            } catch (error: any) {
              console.error('Erreur lors de la finalisation:', error);
              showError(error.message || 'Une erreur est survenue lors de la finalisation de la mission.');
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  const proofOptions: ProofOption[] = [
    {
      id: 'photo',
      title: 'Prendre une photo',
      description: 'Photographier le bon de livraison signé',
      icon: 'camera',
      color: '#3B82F6',
      onPress: handlePhotoCapture,
      completed: !!photo,
    },
    {
      id: 'signature',
      title: 'Obtenir la signature',
      description: 'Faire signer le client sur l\'écran',
      icon: 'create',
      color: '#8B5CF6',
      onPress: handleSignatureCapture,
      completed: !!signature,
    },
    {
      id: 'qrcode',
      title: isValidatingQR ? 'Validation en cours...' : qrCodeData ? 'QR Code validé' : 'Scanner le QR Code',
      description: isValidatingQR ? 'Vérification du QR code' : qrCodeData ? 'Preuve de livraison validée' : 'Scanner le code de confirmation du client',
      icon: 'qr-code',
      color: '#10B981',
      onPress: (qrCodeData || isValidatingQR) ? () => {} : handleQRCodeScan, // Désactiver si déjà scanné ou en cours
      completed: !!qrCodeData,
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
        {mission && (
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>Mission: {mission.title}</Text>
            <Text style={styles.missionId}>ID: {mission.id}</Text>
          </View>
        )}

        <View style={styles.instructionContainer}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.instructionText}>
            Choisissez une méthode pour confirmer la livraison (optionnel)
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {proofOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, option.completed && styles.optionCardCompleted]}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                {option.completed ? (
                  <Ionicons name="checkmark-circle" size={40} color={option.color} />
                ) : (
                  <Ionicons name={option.icon} size={40} color={option.color} />
                )}
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
                {option.completed && (
                  <Text style={styles.completedText}>✓ Complété</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Aperçu des preuves */}
        {(photo || signature || qrCodeData) && (
          <View style={styles.proofsPreview}>
            <Text style={styles.proofsPreviewTitle}>Preuves collectées:</Text>
            {photo && (
              <View style={styles.proofItem}>
                <Ionicons name="camera" size={20} color="#3B82F6" />
                <Text style={styles.proofItemText}>Photo</Text>
                <Image source={{ uri: photo }} style={styles.proofThumbnail} />
              </View>
            )}
            {signature && (
              <View style={styles.proofItem}>
                <Ionicons name="create" size={20} color="#8B5CF6" />
                <Text style={styles.proofItemText}>Signature</Text>
                <Image source={{ uri: signature }} style={styles.proofThumbnail} />
              </View>
            )}
            {qrCodeData && (
              <View style={styles.proofItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.proofItemText}>QR Code validé</Text>
                <View style={styles.deliveredBadge}>
                  <Text style={styles.deliveredBadgeText}>✓ VALIDÉ</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          {(photo || signature || qrCodeData) && (
            <TouchableOpacity
              style={[styles.submitButton, styles.submitButtonWithProofs]}
              onPress={handleSubmitWithProofs}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Terminer avec preuves</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitButton, styles.submitButtonWithoutProofs]}
            onPress={handleCompleteWithoutProofs}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Terminer sans preuves</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.footerNoteText}>
            Toutes les preuves sont sécurisées et horodatées
          </Text>
        </View>
      </View>

      {/* Modal de signature */}
      <Modal
        isVisible={isSignatureModalVisible}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        onBackdropPress={handleSignatureClose}
        onBackButtonPress={handleSignatureClose}
        style={{ margin: 0 }}
      >
        <SignaturePad
          onSave={handleSignatureSave}
          onClose={handleSignatureClose}
          fullScreen
        />
      </Modal>

      {/* Modal de scan QR */}
      {isQRScannerVisible && (
        <View style={StyleSheet.absoluteFill}>
          <QRCodeScanner
            onScan={handleQRCodeScanned}
            onClose={handleQRScannerClose}
          />
        </View>
      )}

      {/* Toast notifications */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
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
  missionInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  missionId: {
    fontSize: 12,
    color: '#6B7280',
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
  optionCardCompleted: {
    borderWidth: 2,
    borderColor: '#10B981',
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
  completedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  proofsPreview: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  proofsPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  proofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proofItemText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  proofThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  deliveredBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  actionsContainer: {
    gap: 12,
    marginTop: 24,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonWithProofs: {
    backgroundColor: '#10B981',
  },
  submitButtonWithoutProofs: {
    backgroundColor: '#6B7280',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
