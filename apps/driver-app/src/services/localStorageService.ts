import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mission } from '../types/mission.types';

/**
 * Service de stockage local pour persister les données hors ligne
 */

// Clés de stockage
const STORAGE_KEYS = {
  MISSIONS: '@tsa_driver_missions',
  SETTINGS: '@tsa_driver_settings',
  DRIVER_PROFILE: '@tsa_driver_profile',
};

/**
 * Sauvegarder les missions dans AsyncStorage
 */
export const saveMissions = async (missions: Mission[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(missions);
    await AsyncStorage.setItem(STORAGE_KEYS.MISSIONS, jsonValue);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des missions:', error);
    throw error;
  }
};

/**
 * Récupérer les missions depuis AsyncStorage
 */
export const loadMissions = async (): Promise<Mission[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.MISSIONS);
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    }
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement des missions:', error);
    return [];
  }
};

/**
 * Sauvegarder une mission spécifique
 */
export const saveMission = async (mission: Mission): Promise<void> => {
  try {
    const missions = await loadMissions();
    const index = missions.findIndex((m) => m.id === mission.id);

    if (index !== -1) {
      missions[index] = mission;
    } else {
      missions.push(mission);
    }

    await saveMissions(missions);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la mission:', error);
    throw error;
  }
};

/**
 * Supprimer une mission
 */
export const deleteMission = async (missionId: string): Promise<void> => {
  try {
    const missions = await loadMissions();
    const filteredMissions = missions.filter((m) => m.id !== missionId);
    await saveMissions(filteredMissions);
  } catch (error) {
    console.error('Erreur lors de la suppression de la mission:', error);
    throw error;
  }
};

/**
 * Effacer toutes les données de stockage
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.MISSIONS,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.DRIVER_PROFILE,
    ]);
  } catch (error) {
    console.error("Erreur lors de l'effacement des données:", error);
    throw error;
  }
};

/**
 * Sauvegarder les paramètres de l'application
 */
export const saveSettings = async (settings: Record<string, any>): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, jsonValue);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    throw error;
  }
};

/**
 * Récupérer les paramètres de l'application
 */
export const loadSettings = async (): Promise<Record<string, any>> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    }
    return {};
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error);
    return {};
  }
};

/**
 * Sauvegarder le profil du chauffeur
 */
export const saveDriverProfile = async (profile: Record<string, any>): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(profile);
    await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_PROFILE, jsonValue);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du profil:', error);
    throw error;
  }
};

/**
 * Récupérer le profil du chauffeur
 */
export const loadDriverProfile = async (): Promise<Record<string, any> | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_PROFILE);
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error);
    return null;
  }
};

/**
 * Vérifier si des données existent en local
 */
export const hasLocalData = async (): Promise<boolean> => {
  try {
    const missions = await AsyncStorage.getItem(STORAGE_KEYS.MISSIONS);
    return missions !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification des données locales:', error);
    return false;
  }
};
