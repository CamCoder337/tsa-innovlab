import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

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
import { initializeMissions } from './src/services/missionService';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialiser les missions au démarrage
        await initializeMissions();
        setIsReady(true);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setIsReady(true); // Continuer quand même
      }
    };

    initialize();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
