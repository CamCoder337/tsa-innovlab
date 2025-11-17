import React from 'react';

// Ignorer les avertissements spécifiques en développement
if (__DEV__) {
  const ignoreWarns = [
    "react-native-permissions: NativeModule.RNPermissions is null",
  ];
  
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

export default function App() {
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
});
