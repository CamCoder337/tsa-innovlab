import { Mission, MissionStatus } from '../types/mission.types';
import { 
  getMissionById as getMockMissionById, 
  getActiveMissions as getMockActiveMissions, 
  getCompletedMissions as getMockCompletedMissions,
  updateMission as updateMockMission,
  getAllMissions as getAllMockMissions
} from '../data/mockMissions';

/**
 * Met à jour le statut d'une mission
 * @param missionId ID de la mission à mettre à jour
 * @param newStatus Nouveau statut
 * @returns La mission mise à jour ou undefined si non trouvée
 */
export const updateMissionStatus = (
  missionId: string,
  newStatus: MissionStatus
): Mission | undefined => {
  // Récupérer toutes les missions
  const allMissions = getAllMockMissions();
  
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
    updatedAt: new Date().toISOString()
  };

  // Mettre à jour la mission via la fonction updateMission
  return updateMockMission(updatedMission);
};

/**
 * Récupère une mission par son ID
 * @param missionId ID de la mission
 * @returns La mission ou undefined si non trouvée
 */
export const getMission = (missionId: string): Mission | undefined => {
  return getMockMissionById(missionId);
};

/**
 * Récupère toutes les missions
 * @returns Liste des missions
 */
export const getAllMissions = (): Mission[] => {
  return getAllMockMissions();
};

/**
 * Récupère les missions actives (non terminées)
 * @returns Liste des missions actives
 */
export const getActiveMissions = (): Mission[] => {
  return getMockActiveMissions();
};

/**
 * Récupère les missions terminées
 * @returns Liste des missions terminées
 */
export const getCompletedMissions = (): Mission[] => {
  return getMockCompletedMissions();
};
