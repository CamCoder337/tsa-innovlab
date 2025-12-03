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
  const [token, setToken] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSavedCredentials, setCheckingSavedCredentials] = useState(true);

  useEffect(() => {
    checkSavedCredentials();
  }, []);

  const checkSavedCredentials = async () => {
    try {
      const credentials = await driverTrackingService.getSavedCredentials();
      if (credentials) {
        setToken(credentials.token);
        setPin(credentials.pin);
      }
    } catch (error) {
      console.error('Error checking saved credentials:', error);
    } finally {
      setCheckingSavedCredentials(false);
    }
  };

  const handleAuthenticate = async (authToken?: string, authPin?: string) => {
    const tokenToUse = authToken || token;
    const pinToUse = authPin || pin;

    if (!tokenToUse || !pinToUse) {
      Alert.alert(t('common.error'), t('auth.emptyFields'));
      return;
    }

    if (pinToUse.length !== 6) {
      Alert.alert(t('common.error'), t('auth.invalidPin'));
      return;
    }

    setLoading(true);
    try {
      const mission: MissionDetails = await driverTrackingService.authenticate(
        tokenToUse,
        pinToUse
      );

      Alert.alert(t('auth.authSuccess'), `${t('mission.title')}: ${mission.title}`, [
        {
          text: t('common.close'),
          onPress: () => {
            navigation.navigate('DriverMissionStart', { mission });
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(t('auth.authFailed'), error.message);
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
            setToken('');
            setPin('');
            Alert.alert(t('common.success'), t('auth.credentialsCleared'));
          },
        },
      ]
    );
  };

  if (checkingSavedCredentials) {
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
            {/* Token Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.token')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="barcode-outline"
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.tokenPlaceholder')}
                  placeholderTextColor={Colors.textSecondary}
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* PIN Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.pinLabel')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.pinPlaceholder')}
                  placeholderTextColor={Colors.textSecondary}
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
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
            {(token || pin) && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCredentials}
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={styles.clearButtonText}>{t('auth.savedCredentials')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={styles.instructionHeader}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.instructionTitle}>{t('auth.howToGetCredentials')}</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1.</Text>
              <Text style={styles.instructionText}>{t('auth.instruction1')}</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2.</Text>
              <Text style={styles.instructionText}>{t('auth.instruction2')}</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3.</Text>
              <Text style={styles.instructionText}>{t('auth.instruction3')}</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>4.</Text>
              <Text style={styles.instructionText}>{t('auth.instruction4')}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
