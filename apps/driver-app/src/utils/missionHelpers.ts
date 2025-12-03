import { Alert, Linking, Platform } from 'react-native';
import { MissionStatus } from '../types/mission.types';

/**
 * Obtenir le prochain statut de mission
 */
export const getNextStatus = (currentStatus: MissionStatus): MissionStatus | null => {
  const statusFlow: { [key in MissionStatus]?: MissionStatus } = {
    [MissionStatus.ASSIGNED]: MissionStatus.ACCEPTED,
    [MissionStatus.ACCEPTED]: MissionStatus.EN_ROUTE_PICKUP,
    [MissionStatus.EN_ROUTE_PICKUP]: MissionStatus.ARRIVED_PICKUP,
    [MissionStatus.ARRIVED_PICKUP]: MissionStatus.LOADED,
    [MissionStatus.LOADED]: MissionStatus.EN_ROUTE_DELIVERY,
    [MissionStatus.EN_ROUTE_DELIVERY]: MissionStatus.ARRIVED_DELIVERY,
    [MissionStatus.ARRIVED_DELIVERY]: MissionStatus.DELIVERED,
  };

  return statusFlow[currentStatus] || null;
};

/**
 * Obtenir le libellé du statut
 */
export const getStatusLabel = (status: MissionStatus): string => {
  const labels: { [key in MissionStatus]: string } = {
    [MissionStatus.ASSIGNED]: 'Assignée',
    [MissionStatus.ACCEPTED]: 'Acceptée',
    [MissionStatus.EN_ROUTE_PICKUP]: 'En route vers le pickup',
    [MissionStatus.ARRIVED_PICKUP]: 'Arrivé au pickup',
    [MissionStatus.LOADED]: 'Colis chargé',
    [MissionStatus.EN_ROUTE_DELIVERY]: 'En route vers livraison',
    [MissionStatus.ARRIVED_DELIVERY]: 'Arrivé à destination',
    [MissionStatus.DELIVERED]: 'Livré',
    [MissionStatus.FAILED]: 'Échec',
    [MissionStatus.CANCELLED]: 'Annulé',
  };

  return labels[status];
};

/**
 * Obtenir le texte du bouton d'action
 */
export const getActionButtonText = (status: MissionStatus): string | null => {
  const buttonTexts: { [key in MissionStatus]?: string } = {
    [MissionStatus.ASSIGNED]: '✓ Accepter la mission',
    [MissionStatus.ACCEPTED]: '🚗 Démarrer vers le pickup',
    [MissionStatus.EN_ROUTE_PICKUP]: '📍 Arrivé au pickup',
    [MissionStatus.ARRIVED_PICKUP]: '📦 Colis chargé',
    [MissionStatus.LOADED]: '🚛 En route vers livraison',
    [MissionStatus.EN_ROUTE_DELIVERY]: '🎯 Arrivé à destination',
    [MissionStatus.ARRIVED_DELIVERY]: '✓ Livrer le colis',
  };

  return buttonTexts[status] || null;
};

/**
 * Appeler un numéro de téléphone
 */
export const makePhoneCall = (phoneNumber: string) => {
  const url = `tel:${phoneNumber}`;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (!supported) {
        Alert.alert('Erreur', 'Impossible de passer un appel sur cet appareil.');
      } else {
        return Linking.openURL(url);
      }
    })
    .catch((err) => {
      console.error("Erreur lors de l'appel:", err);
      Alert.alert('Erreur', "Impossible de passer l'appel.");
    });
};

/**
 * Ouvrir la navigation vers une destination
 */
export const openNavigation = (latitude: number, longitude: number, address: string) => {
  const scheme = Platform.select({
    ios: 'maps:0,0?q=',
    android: 'geo:0,0?q=',
  });
  const latLng = `${latitude},${longitude}`;
  const label = encodeURIComponent(address);
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`,
  });

  if (url) {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          // Fallback vers Google Maps web
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
          return Linking.openURL(googleMapsUrl);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => {
        console.error("Erreur lors de l'ouverture de la navigation:", err);
        Alert.alert('Erreur', "Impossible d'ouvrir la navigation.");
      });
  }
};

/**
 * Ouvrir avec Waze
 */
export const openWaze = (latitude: number, longitude: number) => {
  const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (!supported) {
        Alert.alert('Waze non disponible', "L'application Waze n'est pas installée.");
      } else {
        return Linking.openURL(url);
      }
    })
    .catch((err) => {
      console.error("Erreur lors de l'ouverture de Waze:", err);
      Alert.alert('Erreur', "Impossible d'ouvrir Waze.");
    });
};

/**
 * Ouvrir le choix de navigation
 */
export const promptNavigationChoice = (latitude: number, longitude: number, address: string) => {
  Alert.alert(
    'Navigation',
    'Choisissez votre application de navigation',
    [
      {
        text: 'Google Maps',
        onPress: () => openNavigation(latitude, longitude, address),
      },
      {
        text: 'Waze',
        onPress: () => openWaze(latitude, longitude),
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};
