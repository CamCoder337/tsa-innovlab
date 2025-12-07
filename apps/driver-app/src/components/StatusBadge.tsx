import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { MissionStatus } from '../types/mission.types';

interface StatusBadgeProps {
  status: MissionStatus;
}

const getStatusConfig = (status: MissionStatus) => {
  switch (status) {
    case MissionStatus.ASSIGNED:
      return {
        label: 'Assignée',
        color: Colors.status.pending,
        backgroundColor: '#FEF3C7', // amber-100
      };
    case MissionStatus.ACCEPTED:
      return {
        label: 'Acceptée',
        color: Colors.status.inProgress,
        backgroundColor: '#DBEAFE', // blue-100
      };
    case MissionStatus.EN_ROUTE_PICKUP:
    case MissionStatus.EN_ROUTE_DELIVERY:
      return {
        label: 'En cours',
        color: Colors.status.inProgress,
        backgroundColor: '#DBEAFE', // blue-100
      };
    case MissionStatus.ARRIVED_PICKUP:
    case MissionStatus.ARRIVED_DELIVERY:
      return {
        label: 'Sur place',
        color: Colors.status.inProgress,
        backgroundColor: '#DBEAFE', // blue-100
      };
    case MissionStatus.LOADED:
      return {
        label: 'Chargé',
        color: Colors.status.inProgress,
        backgroundColor: '#DBEAFE', // blue-100
      };
    case MissionStatus.DELIVERED:
      return {
        label: 'Livrée',
        color: Colors.status.completed,
        backgroundColor: '#D1FAE5', // green-100
      };
    case MissionStatus.FAILED:
      return {
        label: 'Échouée',
        color: Colors.status.cancelled,
        backgroundColor: '#FEE2E2', // red-100
      };
    case MissionStatus.CANCELLED:
      return {
        label: 'Annulée',
        color: Colors.status.cancelled,
        backgroundColor: '#FEE2E2', // red-100
      };
    default:
      return {
        label: status,
        color: Colors.text.secondary,
        backgroundColor: Colors.gray[100],
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = getStatusConfig(status);

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
