import { Mission, MissionStatus } from '../types/mission.types';
import {
  loadMissions,
  saveMissions,
  saveMission as saveSingleMission,
  hasLocalData,
} from './localStorageService';
import { getAllMissions as getDefaultMissions } from '../data/mockMissions';

/**
 * Initialiser les missions depuis le stockage local ou avec les données par défaut
 */
export const initializeMissions = async (): Promise<Mission[]> => {
  try {
    const hasData = await hasLocalData();

    if (!hasData) {
      // Première utilisation : charger les données mock par défaut
      const defaultMissions = getDefaultMissions();
      await saveMissions(defaultMissions);
      return defaultMissions;
    }

    // Charger les missions depuis le stockage local
    return await loadMissions();
  } catch (error) {
    console.error("Erreur lors de l'initialisation des missions:", error);
    return [];
  }
};

/**
 * Met à jour le statut d'une mission
 * @param missionId ID de la mission à mettre à jour
 * @param newStatus Nouveau statut
 * @returns La mission mise à jour ou undefined si non trouvée
 */
export const updateMissionStatus = async (
  missionId: string,
  newStatus: MissionStatus
): Promise<Mission | undefined> => {
  try {
    // Récupérer toutes les missions
    const allMissions = await loadMissions();

    // Trouver l'index de la mission
    const missionIndex = allMissions.findIndex((m: Mission) => m.id === missionId);

    if (missionIndex === -1) {
      console.error(`Mission avec l'ID ${missionId} non trouvée`);
      return undefined;
    }

    // Créer une copie de la mission avec les mises à jour
    const missionToUpdate = allMissions[missionIndex];
    const updatedMission: Mission = {
      ...missionToUpdate,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    // Mettre à jour la mission et sauvegarder
    await saveSingleMission(updatedMission);
    return updatedMission;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la mission:', error);
    return undefined;
  }
};

/**
 * Récupère une mission par son ID
 * @param missionId ID de la mission
 * @returns La mission ou undefined si non trouvée
 */
export const getMission = async (missionId: string): Promise<Mission | undefined> => {
  try {
    const missions = await loadMissions();
    return missions.find((m) => m.id === missionId);
  } catch (error) {
    console.error('Erreur lors de la récupération de la mission:', error);
    return undefined;
  }
};

/**
 * Récupère toutes les missions
 * @returns Liste des missions
 */
export const getAllMissions = async (): Promise<Mission[]> => {
  try {
    return await loadMissions();
  } catch (error) {
    console.error('Erreur lors de la récupération des missions:', error);
    return [];
  }
};

/**
 * Récupère les missions actives (non terminées)
 * @returns Liste des missions actives
 */
export const getActiveMissions = async (): Promise<Mission[]> => {
  try {
    const missions = await loadMissions();
    return missions.filter(
      (mission) =>
        mission.status === MissionStatus.ASSIGNED ||
        mission.status === MissionStatus.ACCEPTED ||
        mission.status === MissionStatus.EN_ROUTE_PICKUP ||
        mission.status === MissionStatus.ARRIVED_PICKUP ||
        mission.status === MissionStatus.LOADED ||
        mission.status === MissionStatus.EN_ROUTE_DELIVERY ||
        mission.status === MissionStatus.ARRIVED_DELIVERY
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des missions actives:', error);
    return [];
  }
};

/**
 * Récupère les missions terminées
 * @returns Liste des missions terminées
 */
export const getCompletedMissions = async (): Promise<Mission[]> => {
  try {
    const missions = await loadMissions();
    return missions.filter(
      (mission) =>
        mission.status === MissionStatus.DELIVERED ||
        mission.status === MissionStatus.CANCELLED ||
        mission.status === MissionStatus.FAILED
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des missions terminées:', error);
    return [];
  }
};

/**
 * Créer une nouvelle mission
 * @param mission Nouvelle mission à créer
 */
export const createMission = async (mission: Mission): Promise<Mission> => {
  try {
    await saveSingleMission(mission);
    return mission;
  } catch (error) {
    console.error('Erreur lors de la création de la mission:', error);
    throw error;
  }
};

/**
 * Mettre à jour une mission complète
 * @param mission Mission à mettre à jour
 */
export const updateMission = async (mission: Mission): Promise<Mission | undefined> => {
  try {
    const updatedMission = {
      ...mission,
      updatedAt: new Date().toISOString(),
    };
    await saveSingleMission(updatedMission);
    return updatedMission;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la mission:', error);
    return undefined;
  }
};
