import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { DriverMissionAccessScreen } from '../screens/DriverMissionAccessScreen';
import { DriverMissionStartScreen } from '../screens/DriverMissionStartScreen';
import { DriverMissionTrackingScreen } from '../screens/DriverMissionTrackingScreen';
import { DriverReportIssueScreen } from '../screens/DriverReportIssueScreen';
import DeliveryProofScreen from '../screens/DeliveryProofScreen';
import type { MissionDetails } from '../services/driverTrackingService';

export type RootStackParamList = {
  DriverMissionAccess: undefined;
  DriverMissionStart: { mission: MissionDetails };
  DriverMissionTracking: { mission: MissionDetails };
  DriverReportIssue: {
    currentLocation?: {
      latitude: number;
      longitude: number;
    }
  };
  DeliveryProof: {
    missionId: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
    }
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="DriverMissionAccess"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen
          name="DriverMissionAccess"
          component={DriverMissionAccessScreen}
          options={{ title: 'Authentification' }}
        />
        <Stack.Screen
          name="DriverMissionStart"
          component={DriverMissionStartScreen}
          options={{ title: 'Démarrer la Mission' }}
        />
        <Stack.Screen
          name="DriverMissionTracking"
          component={DriverMissionTrackingScreen}
          options={{ title: 'Suivi de Mission' }}
        />
        <Stack.Screen
          name="DriverReportIssue"
          component={DriverReportIssueScreen}
          options={{ title: 'Signaler un Problème' }}
        />
        <Stack.Screen
          name="DeliveryProof"
          component={DeliveryProofScreen}
          options={{ title: 'Preuves de Livraison' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
