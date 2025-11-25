import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mission } from '../types/mission.types';
import { updateMission } from './missionService';

/**
 * Service pour gérer les preuves de livraison (photos et signatures)
 * Note: Pour un stockage persistant complet avec fichiers, utilisez expo-file-system
 * Pour cette version simplifiée, on stocke les URIs directement
 */

const STORAGE_KEYS = {
  POD_PHOTOS: '@tsa_driver_pod_photos',
  POD_SIGNATURES: '@tsa_driver_pod_signatures',
};

/**
 * Interface pour les preuves de livraison
 */
export interface ProofOfDeliveryData {
  photo?: string; // URI locale de la photo
  signature?: string; // URI locale de la signature
  recipientName: string;
  notes?: string;
  deliveredAt: string;
}

/**
 * Sauvegarder une photo de preuve de livraison en local
 */
export const saveProofPhoto = async (missionId: string, photoUri: string): Promise<string> => {
  try {
    // Sauvegarder la référence dans AsyncStorage
    const photos = await loadAllPhotos();
    photos[missionId] = photoUri;
    await AsyncStorage.setItem(STORAGE_KEYS.POD_PHOTOS, JSON.stringify(photos));

    return photoUri;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la photo:', error);
    throw error;
  }
};

/**
 * Sauvegarder une signature de preuve de livraison en local
 */
export const saveProofSignature = async (
  missionId: string,
  signatureUri: string
): Promise<string> => {
  try {
    // Sauvegarder la référence dans AsyncStorage
    const signatures = await loadAllSignatures();
    signatures[missionId] = signatureUri;
    await AsyncStorage.setItem(STORAGE_KEYS.POD_SIGNATURES, JSON.stringify(signatures));

    return signatureUri;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la signature:', error);
    throw error;
  }
};

/**
 * Charger toutes les photos sauvegardées
 */
const loadAllPhotos = async (): Promise<Record<string, string>> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.POD_PHOTOS);
    return jsonValue ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Erreur lors du chargement des photos:', error);
    return {};
  }
};

/**
 * Charger toutes les signatures sauvegardées
 */
const loadAllSignatures = async (): Promise<Record<string, string>> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.POD_SIGNATURES);
    return jsonValue ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Erreur lors du chargement des signatures:', error);
    return {};
  }
};

/**
 * Récupérer la photo d'une mission
 */
export const getProofPhoto = async (missionId: string): Promise<string | null> => {
  try {
    const photos = await loadAllPhotos();
    return photos[missionId] || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la photo:', error);
    return null;
  }
};

/**
 * Récupérer la signature d'une mission
 */
export const getProofSignature = async (missionId: string): Promise<string | null> => {
  try {
    const signatures = await loadAllSignatures();
    return signatures[missionId] || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la signature:', error);
    return null;
  }
};

/**
 * Sauvegarder la preuve de livraison complète dans la mission
 */
export const saveProofOfDelivery = async (
  mission: Mission,
  proofData: ProofOfDeliveryData
): Promise<Mission | undefined> => {
  try {
    const updatedMission: Mission = {
      ...mission,
      proofOfDelivery: {
        photo: proofData.photo || '',
        signature: proofData.signature || '',
        recipientName: proofData.recipientName,
        notes: proofData.notes,
        deliveredAt: proofData.deliveredAt,
      },
    };

    return await updateMission(updatedMission);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la preuve de livraison:', error);
    return undefined;
  }
};

/**
 * Supprimer les fichiers de preuve de livraison
 */
export const deleteProofFiles = async (missionId: string): Promise<void> => {
  try {
    // Supprimer les références dans AsyncStorage
    const photos = await loadAllPhotos();
    const signatures = await loadAllSignatures();

    delete photos[missionId];
    delete signatures[missionId];

    await AsyncStorage.setItem(STORAGE_KEYS.POD_PHOTOS, JSON.stringify(photos));
    await AsyncStorage.setItem(STORAGE_KEYS.POD_SIGNATURES, JSON.stringify(signatures));
  } catch (error) {
    console.error('Erreur lors de la suppression des fichiers de preuve:', error);
    throw error;
  }
};
