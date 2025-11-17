import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Mission, MissionStatus } from '../types/mission.types';
import { updateMissionStatus } from '../services/missionService';
import SignaturePad from '../components/SignaturePad';
import Modal from 'react-native-modal';

interface Styles {
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  backButtonText: TextStyle;
  headerTitle: TextStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  missionInfoText: TextStyle;
  required: TextStyle;
  input: TextStyle;
  textArea: TextStyle;
  photoContainer: ViewStyle;
  photoImage: ImageStyle;
  takePhotoButton: ViewStyle;
  takePhotoIcon: TextStyle;
  takePhotoText: TextStyle;
  retakeButton: ViewStyle;
  retakeButtonText: TextStyle;
  signatureContainer: ViewStyle;
  loadingContainer: ViewStyle;
  signatureConfirm: ViewStyle;
  signatureConfirmText: TextStyle;
  submitButton: ViewStyle;
  submitButtonText: TextStyle;
  submitButtonDisabled: ViewStyle;
  photoPreview: ViewStyle;
  modalSignatureContainer: ViewStyle;
  signaturePreview: ImageStyle;
  signaturePlaceholder: ViewStyle;
  signaturePlaceholderText: TextStyle;
}

interface ProofOfDeliveryScreenProps {
  route: {
    params: {
      mission: Mission;
      onGoBack?: (updatedMission: Mission) => void;
    };
  };
  navigation: {
    goBack: () => void;
  };
}

export const ProofOfDeliveryScreen: React.FC<ProofOfDeliveryScreenProps> = ({
  route,
  navigation,
}) => {
  // Convertir les dates de chaînes en objets Date si nécessaire
  const mission = React.useMemo(() => ({
    ...route.params.mission,
    pickupTime: route.params.mission.pickupTime instanceof Date 
      ? route.params.mission.pickupTime 
      : new Date(route.params.mission.pickupTime),
    // Ajoutez d'autres champs de date si nécessaire
  }), [route.params.mission]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Gestion de la prise de photo
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra pour prendre une photo.');
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
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo :', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la prise de photo.');
    }
  };

  const removePhoto = () => {
    setPhoto(null);
  };

  const handleOpenSignatureModal = () => {
    setIsSignatureModalVisible(true);
  };

  const handleCloseSignatureModal = () => {
    setIsSignatureModalVisible(false);
  };

  const handleSignatureSave = useCallback((signatureData: string) => {
    console.log('Signature sauvegardée:', !!signatureData);
    setSignature(signatureData);
    // Le modal SignaturePad se ferme lui-même après validation
    setIsSignatureModalVisible(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    console.log('Tentative de soumission avec:', { 
      photo: !!photo, 
      signature: !!signature, 
      recipientName: recipientName.trim() 
    });
    
    if (!photo || !signature || !recipientName.trim()) {
      Alert.alert('Erreur', 'Veuillez compléter tous les champs requis.');
      return;
    }

    setLoading(true);

    try {
      // Mise à jour du statut de la mission
      const updatedMission = updateMissionStatus(mission.id, MissionStatus.DELIVERED);
      
      if (updatedMission) {
        // Mise à jour des données supplémentaires
        const missionWithDeliveryData = {
          ...updatedMission,
          recipientName: recipientName.trim(),
          comments: notes,
          signature,
          photo,
          status: MissionStatus.DELIVERED,
          updatedAt: new Date().toISOString()
        };
        
        // Mettre à jour la mission avec les données complètes
        // Note: Dans une application réelle, vous devriez avoir une fonction updateMission
        // qui prend un objet Mission complet, pas seulement l'ID et le statut
        
        if (route.params?.onGoBack) {
          route.params.onGoBack(missionWithDeliveryData);
        }

        navigation.goBack();
      } else {
        throw new Error('Échec de la mise à jour du statut de la mission');
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation de la livraison :', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la confirmation de la livraison.');
    } finally {
      setLoading(false);
    }
  }, [photo, signature, recipientName, notes, mission.id, route.params, navigation]);

  // Gestion du défilement
  const handleScroll = useCallback(() => {
    // Logique de défilement si nécessaire
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Preuve de livraison</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Mission Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mission #{mission.id}</Text>
            <Text style={styles.missionInfoText}>
              {mission.delivery?.address || 'Adresse non spécifiée'}
            </Text>
          </View>

          {/* Preuve photo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Preuve photo <Text style={styles.required}>*</Text>
            </Text>
            
            <View style={styles.photoContainer}>
              {photo ? (
                <>
                  <Image 
                    source={{ uri: photo }} 
                    style={styles.photoImage} 
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={styles.retakeButton} 
                    onPress={removePhoto}
                  >
                    <Text style={styles.retakeButtonText}>Reprendre</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={styles.takePhotoButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.takePhotoIcon}>📷</Text>
                  <Text style={styles.takePhotoText}>Prendre une photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Recipient Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Nom du destinataire <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nom et prénom du destinataire"
              value={recipientName}
              onChangeText={setRecipientName}
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          {/* Signature Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Signature du destinataire <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity 
              style={styles.signatureContainer} 
              onPress={handleOpenSignatureModal}
              activeOpacity={0.9}
            >
              {signature ? (
                <Image 
                  source={{ uri: signature }} 
                  style={styles.signaturePreview}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.signaturePlaceholder}>
                  <Ionicons name="pencil" size={24} color={Colors.text.secondary} />
                  <Text style={styles.signaturePlaceholderText}>
                    Appuyez pour signer
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ajoutez des notes supplémentaires..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              (!photo || !signature || !recipientName.trim()) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading || !photo || !signature || !recipientName.trim()}
            activeOpacity={0.7}
            onLayout={() => {
              console.log('Bouton rendu avec état:', {
                loading,
                hasPhoto: !!photo,
                hasSignature: !!signature,
                hasRecipientName: !!recipientName.trim()
              });
            }}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                ✓ Confirmer la livraison
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Modal de signature plein écran */}
        <Modal
          isVisible={isSignatureModalVisible}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          onBackdropPress={handleCloseSignatureModal}
          onBackButtonPress={handleCloseSignatureModal}
          style={{ margin: 0 }}
        >
          <SignaturePad
            onSave={handleSignatureSave}
            onClose={handleCloseSignatureModal}
            fullScreen
          />
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  missionInfoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  required: {
    color: Colors.danger,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 16,
    minHeight: 56, // Hauteur minimale pour une meilleure zone de clic
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoContainer: {
    height: 200,
    backgroundColor: Colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  takePhotoButton: {
    padding: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  takePhotoIcon: {
    color: Colors.white,
    fontSize: 20,
    marginRight: 8,
  },
  takePhotoText: {
    color: Colors.white,
    fontWeight: '600',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
  },
  retakeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  signatureContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signaturePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  signaturePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  signaturePlaceholderText: {
    marginTop: 8,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    opacity: 1,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.text.secondary,
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  modalSignatureContainer: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  signatureConfirm: {
    backgroundColor: Colors.primary,
    padding: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signatureConfirmText: {
    color: Colors.white,
    fontWeight: '600',
  },
  photoPreview: {
    flex: 1,
    borderRadius: 8,
  },
});
