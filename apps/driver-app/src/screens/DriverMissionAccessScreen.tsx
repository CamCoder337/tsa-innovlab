import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import driverTrackingService, { type MissionDetails } from '../services/driverTrackingService';
import { Colors } from '../constants/colors';
import { useTranslation } from '../hooks/useTranslation';

interface DriverMissionAccessScreenProps {
  navigation: any;
}

export const DriverMissionAccessScreen: React.FC<DriverMissionAccessScreenProps> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSavedToken, setCheckingSavedToken] = useState(true);

  useEffect(() => {
    checkSavedToken();
  }, []);

  const checkSavedToken = async () => {
    try {
      const token = await driverTrackingService.getSavedToken();
      if (token) {
        // Token exists, auto-navigate or show option to use it
        console.log('Saved token found');
      }
    } catch (error) {
      console.error('Error checking saved token:', error);
    } finally {
      setCheckingSavedToken(false);
    }
  };

  const handleAuthenticate = async (authPin?: string) => {
    const pinToUse = authPin || pin;

    if (!pinToUse) {
      showError(t('auth.emptyFields'));
      return;
    }

    if (pinToUse.length < 6 || pinToUse.length > 8) {
      showError('PIN must be 6-8 characters');
      return;
    }

    setLoading(true);
    try {
      const mission: MissionDetails = await driverTrackingService.authenticate(pinToUse);

      showSuccess(`${t('mission.title')}: ${mission.title}`);
      // Naviguer après un délai pour laisser le temps de voir le toast
      setTimeout(() => {
        navigation.navigate('DriverMissionStart', { mission });
      }, 2000);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCredentials = async () => {
    Alert.alert(
      t('auth.clearCredentials'),
      t('auth.clearCredentialsConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.clearCredentialsAction'),
          style: 'destructive',
          onPress: async () => {
            await driverTrackingService.clearCredentials();
            setPin('');
            showSuccess(t('auth.credentialsCleared'));
          },
        },
      ]
    );
  };

  if (checkingSavedToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('auth.checkingCredentials')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="key" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>{t('auth.accessTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.accessSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* PIN Input (Alphanumeric 6-8 characters) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mission PIN Code</Text>
              <Text style={styles.sublabel}>Enter the 6-8 character alphanumeric code</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Example: A3X9K2"
                  placeholderTextColor={Colors.textSecondary}
                  value={pin}
                  onChangeText={(text) => setPin(text.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={() => handleAuthenticate()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={Colors.white} />
                  <Text style={styles.buttonText}>{t('auth.submit')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Clear Credentials Button */}
            {pin && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCredentials}
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={styles.clearButtonText}>Clear Saved Token</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={styles.instructionHeader}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.instructionTitle}>How to access your mission</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1.</Text>
              <Text style={styles.instructionText}>Receive the mission PIN code from your dispatcher or transport company</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2.</Text>
              <Text style={styles.instructionText}>Enter the PIN code in the field above (6-8 alphanumeric characters)</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3.</Text>
              <Text style={styles.instructionText}>Tap "Log In" to access the mission details and start tracking</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>4.</Text>
              <Text style={styles.instructionText}>The PIN gives you access to one specific mission and its tracking features</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast notifications */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 6,
  },
  instructions: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 8,
    width: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
});
