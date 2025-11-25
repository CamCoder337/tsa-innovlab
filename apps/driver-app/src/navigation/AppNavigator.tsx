import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MapScreen } from '../screens/MapScreen';
import { MissionListScreen } from '../screens/MissionListScreen';
import { MissionDetailsScreen } from '../screens/MissionDetailsScreen';
import { CreateMissionScreen } from '../screens/CreateMissionScreen';
import { LiveTrackingScreen } from '../screens/LiveTrackingScreen';
import { ProofOfDeliveryScreen } from '../screens/ProofOfDeliveryScreen';
import { SimpleTrackingTestScreen } from '../screens/SimpleTrackingTestScreen';

export type RootStackParamList = {
  SimpleTrackingTest: undefined;
  MissionList: undefined;
  Map: { missionId: string };
  MissionDetails: { missionId: string };
  CreateMission: undefined;
  LiveTracking: { mission: any };
  ProofOfDelivery: { mission: any };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MissionList"
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
        <Stack.Screen name="SimpleTrackingTest" component={SimpleTrackingTestScreen} />
        <Stack.Screen name="MissionList" component={MissionListScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="MissionDetails" component={MissionDetailsScreen} />
        <Stack.Screen name="CreateMission" component={CreateMissionScreen} />
        <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
        <Stack.Screen name="ProofOfDelivery" component={ProofOfDeliveryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
