import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { SignaturePad } from '../components/SignaturePad';

interface ProofOfDeliveryScreenProps {
  route: any;
  navigation: any;
}

export const ProofOfDeliveryScreen: React.FC<ProofOfDeliveryScreenProps> = ({
  route,
  navigation,
}) => {
  const { mission } = route.params;

  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'L\'accès à la caméra est nécessaire pour prendre une photo.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSignatureSave = (sig: string) => {
    setSignature(sig);
  };

  const handleSubmit = async () => {
    if (!photo) {
      Alert.alert('Photo requise', 'Veuillez prendre une photo de la livraison.');
      return;
    }

    if (!signature) {
      Alert.alert(
        'Signature requise',
        'Veuillez obtenir la signature du destinataire.'
      );
      return;
    }

    if (!recipientName.trim()) {
      Alert.alert('Nom requis', 'Veuillez entrer le nom du destinataire.');
      return;
    }

    setLoading(true);

    // Simuler un envoi au backend
    setTimeout(() => {
      setLoading(false);

      const proofOfDelivery = {
        photo,
        signature,
        recipientName,
        notes,
        deliveredAt: new Date(),
      };

      Alert.alert(
        'Livraison confirmée',
        'La preuve de livraison a été enregistrée avec succès.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('MissionList', {
                proofOfDelivery,
                missionId: mission.id,
              }),
          },
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        <View style={styles.missionInfo}>
          <Text style={styles.missionNumber}>{mission.missionNumber}</Text>
          <Text style={styles.missionAddress}>{mission.delivery.address}</Text>
        </View>

        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            1. Photo de livraison <Text style={styles.required}>*</Text>
          </Text>

          {photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleTakePhoto}
              >
                <Text style={styles.retakeButtonText}>Reprendre</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.takePhotoButton}
              onPress={handleTakePhoto}
            >
              <Text style={styles.takePhotoIcon}>📸</Text>
              <Text style={styles.takePhotoText}>Prendre une photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recipient Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Nom du destinataire <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Entrez le nom complet"
            value={recipientName}
            onChangeText={setRecipientName}
            placeholderTextColor={Colors.text.secondary}
          />
        </View>

        {/* Signature Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Signature du destinataire <Text style={styles.required}>*</Text>
          </Text>
          <SignaturePad
            onSave={handleSignatureSave}
            onClear={() => setSignature(null)}
          />
          {signature && (
            <View style={styles.signatureConfirm}>
              <Text style={styles.signatureConfirmText}>✓ Signature capturée</Text>
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Notes (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ajoutez des notes sur la livraison..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={Colors.text.secondary}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!photo || !signature || !recipientName.trim() || loading) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!photo || !signature || !recipientName.trim() || loading}
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
  scrollContent: {
    paddingBottom: 40,
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
  missionInfo: {
    backgroundColor: Colors.primary + '10',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
  },
  missionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  missionAddress: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  required: {
    color: Colors.danger,
  },
  takePhotoButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 24,
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
  takePhotoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  takePhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  photoPreview: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  retakeButton: {
    backgroundColor: Colors.gray[100],
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 8,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  signatureConfirm: {
    backgroundColor: Colors.success + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  signatureConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  submitButton: {
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
