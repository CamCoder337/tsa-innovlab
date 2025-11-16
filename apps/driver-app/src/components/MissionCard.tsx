import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Mission } from '../types/mission.types';
import { StatusBadge } from './StatusBadge';

interface MissionCardProps {
  mission: Mission;
  onPress?: () => void;
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MissionCard: React.FC<MissionCardProps> = ({ mission, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.missionNumber}>{mission.missionNumber}</Text>
          <Text style={styles.cargoType}>{mission.cargoType}</Text>
        </View>
        <StatusBadge status={mission.status} />
      </View>

      {/* Route */}
      <View style={styles.route}>
        {/* Pickup */}
        <View style={styles.routeItem}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Ramassage</Text>
            <Text style={styles.routeLocation}>{mission.pickup.city}</Text>
            <Text style={styles.routeAddress}>{mission.pickup.address}</Text>
            <Text style={styles.routeTime}>{formatDate(mission.pickupTime)}</Text>
          </View>
        </View>

        {/* Line connector */}
        <View style={styles.routeLine} />

        {/* Delivery */}
        <View style={styles.routeItem}>
          <View style={[styles.dot, { backgroundColor: Colors.success }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Livraison</Text>
            <Text style={styles.routeLocation}>{mission.delivery.city}</Text>
            <Text style={styles.routeAddress}>{mission.delivery.address}</Text>
            <Text style={styles.routeTime}>{formatDate(mission.deliveryTime)}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{mission.distance} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{mission.weight} kg</Text>
          <Text style={styles.statLabel}>Poids</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.floor(mission.estimatedDuration / 60)}h{mission.estimatedDuration % 60}</Text>
          <Text style={styles.statLabel}>Durée estimée</Text>
        </View>
      </View>

      {/* Progress bar (only for in-progress missions) */}
      {mission.progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${mission.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{mission.progress}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  missionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  cargoType: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  route: {
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.gray[200],
    marginLeft: 5,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  routeLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  routeTime: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    width: 40,
    textAlign: 'right',
  },
});
