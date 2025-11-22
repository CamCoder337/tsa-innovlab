import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { getActiveMissions, getCompletedMissions } from '../services/missionService';
import { MissionCard } from '../components/MissionCard';
import { SOSButton } from '../components/SOSButton';
import { Mission } from '../types/mission.types';

interface MissionListScreenProps {
  navigation: any;
}

type TabType = 'active' | 'completed';

export const MissionListScreen: React.FC<MissionListScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les missions au montage et quand l'écran reçoit le focus
  useEffect(() => {
    const loadMissions = async () => {
      setLoading(true);
      const [active, completed] = await Promise.all([
        getActiveMissions(),
        getCompletedMissions(),
      ]);
      setActiveMissions(active);
      setCompletedMissions(completed);
      setLoading(false);
    };

    loadMissions();

    const unsubscribe = navigation.addListener('focus', loadMissions);
    return unsubscribe;
  }, [navigation]);

  const missions = activeTab === 'active' ? activeMissions : completedMissions;

  const handleMissionPress = (missionId: string) => {
    // Navigation vers la carte pour voir le trajet en live
    navigation.navigate('Map', { missionId });
  };

  const handleSOSAlert = (type: string, description: string) => {
    console.log('SOS Alert:', type, description);
    // TODO: Implémenter l'envoi d'alerte SOS au backend
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mes Missions</Text>
        </View>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => navigation.navigate('CreateMission')}
        >
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Actives ({activeMissions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Terminées ({completedMissions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des missions */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des missions...</Text>
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MissionCard mission={item} onPress={() => handleMissionPress(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📦</Text>
            <Text style={styles.emptyTitle}>Aucune mission</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active'
                ? "Vous n'avez pas de mission active pour le moment"
                : 'Aucune mission terminée'}
            </Text>
          </View>
        }
        />
      )}

      {/* Bouton SOS flottant */}
      <SOSButton onSOSAlert={handleSOSAlert} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120, // Espace pour le bouton SOS
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});
