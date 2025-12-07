import React from 'react';

// Ignorer les avertissements spécifiques en développement
if (__DEV__) {
  const ignoreWarns = ['react-native-permissions: NativeModule.RNPermissions is null'];

  const errorWarn = global.console.warn;
  global.console.warn = (...arg: any) => {
    for (const warning of ignoreWarns) {
      if (arg[0]?.startsWith?.(warning)) {
        return;
      }
    }
    errorWarn(...arg);
  };
}
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
// import { initializeMissions } from './src/services/missionService'; // Supprimé : données de test non nécessaires
import './src/i18n'; // Initialize i18n
import { env } from './src/config/env';

// Log environment configuration on app startup (debug mode only)
env.logConfig();

export default function App() {
  // Suppression de l'initialisation des missions de test
  // L'application utilise maintenant le workflow réel avec authentification Token + PIN

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
