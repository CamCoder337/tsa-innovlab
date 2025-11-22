# 📱 TSA Driver App - Application Mobile Chauffeurs

Application mobile React Native pour les chauffeurs de TSA Logistics.

## 🎯 Fonctionnalités

### ✅ Implémentées (Mock Data)

- **🗺️ Carte interactive** avec Google Maps
  - Visualisation des missions sur la carte
  - Marqueurs de ramassage (bleu) et livraison (vert)
  - Position actuelle du chauffeur pour missions en cours
  - Lignes de trajet entre pickup et delivery

- **📋 Liste des missions**
  - Onglet "Actives" et "Terminées"
  - Cartes détaillées avec toutes les infos
  - Barre de progression pour missions en cours

- **🔍 Détails complets de mission**
  - Informations de ramassage et livraison
  - Distance, poids, durée estimée
  - Instructions spéciales
  - Contacts (expéditeur et destinataire)
  - Boutons d'appel direct
  - Actions (Démarrer / Terminer mission)

- **🆘 Bouton SOS flottant**
  - Accessible depuis tous les écrans
  - 4 types d'alerte : Accident, Panne, Sécurité, Autre
  - Description optionnelle
  - Animation pulsante pour visibilité

### Design

- 🎨 **Design System TSA** : Couleurs, typographie et composants inspirés du frontend web
- 🌙 **UI moderne** : Cartes, ombres, animations fluides
- 📱 **Navigation intuitive** : Transitions fluides entre écrans

## 🚀 Installation et Lancement

### Prérequis

- Node.js 18+ installé
- Expo Go app installée sur votre téléphone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- **Google Maps API Key** (pour afficher les cartes)

### Installation

```bash
# Aller dans le dossier de l'app
cd apps/driver-app

# Installer les dépendances
npm install
```

### Configuration Google Maps

1. **Obtenir une API Key Google Maps** :
   - Aller sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créer un projet ou sélectionner un projet existant
   - Activer **Maps SDK for Android** et **Maps SDK for iOS**
   - Créer une clé API dans "Credentials"

2. **Configurer la clé dans l'app** :
   - Ouvrir `app.json`
   - Remplacer `YOUR_GOOGLE_MAPS_API_KEY_HERE` par votre clé API (ligne 27)

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "VOTRE_CLE_API_ICI"
    }
  }
}
```

### Lancement

```bash
# Démarrer Expo
npm start
```

Ensuite :
1. **Scanner le QR code** avec l'app Expo Go sur votre téléphone
2. L'app se lancera automatiquement

**Ou utiliser un émulateur** :
```bash
# Android
npm run android

# iOS (Mac seulement)
npm run ios
```

## 📁 Structure du Projet

```
driver-app/
├── src/
│   ├── components/           # Composants réutilisables
│   │   ├── StatusBadge.tsx  # Badge de statut (En cours, Terminée, etc.)
│   │   ├── MissionCard.tsx  # Carte de mission pour la liste
│   │   └── SOSButton.tsx    # Bouton SOS flottant
│   │
│   ├── screens/             # Écrans de l'application
│   │   ├── MapScreen.tsx    # Écran carte avec missions
│   │   ├── MissionListScreen.tsx      # Liste des missions
│   │   └── MissionDetailsScreen.tsx   # Détails d'une mission
│   │
│   ├── navigation/          # Configuration navigation
│   │   └── AppNavigator.tsx
│   │
│   ├── constants/           # Constantes de l'app
│   │   └── colors.ts        # Couleurs TSA (inspirées du web)
│   │
│   ├── types/               # Types TypeScript
│   │   └── mission.types.ts # Types Mission, Location, etc.
│   │
│   └── data/                # Mock data
│       └── mockMissions.ts  # 4 missions de test (Douala, Yaoundé, etc.)
│
├── App.tsx                  # Point d'entrée
├── app.json                 # Configuration Expo
└── package.json             # Dépendances
```

## 🎨 Design System

### Couleurs TSA

Les couleurs sont définies dans `src/constants/colors.ts` :

- **Primary** : `#1E40AF` (Bleu TSA)
- **Success** : `#10B981` (Vert pour livraison)
- **Warning** : `#F59E0B` (Jaune pour pending)
- **Danger/SOS** : `#DC2626` (Rouge pour alertes)

Toutes les couleurs sont synchronisées avec le frontend web.

## 💾 Fonctionnement Autonome - Stockage Local

L'application est **100% autonome** et fonctionne **sans serveur backend**. Toutes les données sont stockées localement sur votre téléphone Android.

### Architecture de Stockage

#### 1. **AsyncStorage** (Stockage Persistant)
Toutes les missions et paramètres sont sauvegardés dans AsyncStorage :
- `@tsa_driver_missions` : Toutes les missions (actives et terminées)
- `@tsa_driver_settings` : Paramètres de l'application
- `@tsa_driver_profile` : Profil du chauffeur
- `@tsa_driver_pod_photos` : Index des photos de preuve de livraison
- `@tsa_driver_pod_signatures` : Index des signatures

#### 2. **FileSystem** (Fichiers Locaux)
Les photos et signatures sont sauvegardées dans le répertoire de documents de l'app :
- Photos de livraison : `${FileSystem.documentDirectory}/pod_photo_*.jpg`
- Signatures : `${FileSystem.documentDirectory}/pod_signature_*.png`

### Services Disponibles

#### `localStorageService.ts`
Service de gestion du stockage persistant :
```typescript
import { saveMissions, loadMissions, saveMission } from './services/localStorageService';

// Sauvegarder toutes les missions
await saveMissions(missions);

// Charger les missions
const missions = await loadMissions();

// Sauvegarder une mission
await saveMission(updatedMission);
```

#### `proofOfDeliveryService.ts`
Gestion des preuves de livraison :
```typescript
import { saveProofPhoto, saveProofSignature, saveProofOfDelivery }
  from './services/proofOfDeliveryService';

// Sauvegarder une photo
const photoPath = await saveProofPhoto(missionId, photoUri);

// Sauvegarder une signature
const signaturePath = await saveProofSignature(missionId, signatureUri);

// Sauvegarder la preuve complète
await saveProofOfDelivery(mission, proofData);
```

#### `missionService.ts` (Mis à Jour)
Service métier avec persistance automatique :
```typescript
import {
  initializeMissions,
  getAllMissions,
  updateMissionStatus,
  createMission
} from './services/missionService';

// Initialiser au premier lancement
const missions = await initializeMissions();

// Récupérer toutes les missions
const allMissions = await getAllMissions();

// Mettre à jour le statut
await updateMissionStatus(missionId, 'delivered');

// Créer une nouvelle mission
await createMission(newMission);
```

### Premier Lancement

Au premier démarrage, l'app :
1. Vérifie si des données existent dans AsyncStorage
2. Si aucune donnée : charge **5 missions de démonstration** depuis `mockMissions.ts`
3. Sauvegarde ces missions dans AsyncStorage
4. Lors des prochains lancements, charge directement depuis AsyncStorage

### Workflow Complet d'une Mission

```
1. Consulter missions → Données chargées depuis AsyncStorage
2. Accepter mission → Statut mis à jour et sauvegardé
3. Démarrer trajet → État sauvegardé automatiquement
4. Arriver au pickup → Statut "arrived_pickup" persisté
5. Charger cargaison → Statut "loaded" sauvegardé
6. Démarrer livraison → État "en_route_delivery" persisté
7. Arriver livraison → Statut "arrived_delivery" sauvegardé
8. Preuve de livraison :
   - Photo → Sauvegardée dans FileSystem
   - Signature → Sauvegardée dans FileSystem
   - Mission mise à jour avec chemins des fichiers
9. Finaliser → Mission "delivered" + données persistées
```

### Persistance des Données

✅ **Toutes les modifications sont automatiquement sauvegardées** :
- Changement de statut de mission
- Ajout de nouvelle mission
- Photos et signatures
- Paramètres utilisateur

✅ **Les données restent disponibles** :
- Après redémarrage de l'app
- Après redémarrage du téléphone
- Même sans connexion internet

### Gestion des Données

#### Voir les données stockées
```typescript
// Dans un écran ou composant
import { loadMissions } from '../services/localStorageService';

const missions = await loadMissions();
console.log('Missions stockées:', missions);
```

#### Réinitialiser les données
```typescript
import { clearAllData } from '../services/localStorageService';

// Effacer toutes les données
await clearAllData();

// Réinitialiser avec données par défaut
const missions = await initializeMissions();
```

## 📊 Données de Test (Mock Data)

L'app contient **5 missions de démonstration** dans `src/data/mockMissions.ts` :

1. **TSA-M-2025-001** : Douala → Yaoundé (Assignée)
2. **TSA-M-2025-002** : Yaoundé → Bamenda (Assignée)
3. **TSA-M-2025-003** : Douala → Limbé (Assignée)
4. **TSA-M-2025-004** : Aéroport Douala → Hilton Yaoundé (Livrée ✅)
5. **TSA-M-2025-005** : Yaoundé → Bafoussam (Annulée ❌)

Ces missions utilisent des **villes réelles du Cameroun** avec coordonnées GPS réelles.

## 🔌 Prochaines Étapes (Connexion Backend)

Pour connecter l'app au backend AdonisJS :

1. **Créer un service API** :
```typescript
// src/services/api.ts
import axios from 'axios';

const API_URL = 'http://51.91.77.0:30000'; // Serveur de prod

export const missionApi = {
  getMissions: () => axios.get(`${API_URL}/api/driver/missions`),
  getMissionById: (id: string) => axios.get(`${API_URL}/api/driver/missions/${id}`),
  updateLocation: (id: string, location) =>
    axios.post(`${API_URL}/api/driver/missions/${id}/location`, location),
  sendSOS: (data) => axios.post(`${API_URL}/api/driver/sos`, data),
};
```

2. **Remplacer les mock data** par les appels API réels

3. **Ajouter l'authentification** JWT

4. **Géolocalisation temps réel** avec `expo-location`

## 🛠️ Technologies Utilisées

- **React Native** : Framework mobile
- **Expo** : Plateforme de développement
- **TypeScript** : Typage fort
- **React Navigation** : Navigation entre écrans
- **react-native-maps** : Google Maps pour Android/iOS
- **expo-location** : Géolocalisation GPS

## 📸 Captures d'Écran (à venir)

Une fois l'app lancée, vous verrez :
- 🗺️ Carte avec 3 missions actives affichées
- 📋 Liste avec onglets Actives/Terminées
- 🔍 Détails complets avec boutons d'action
- 🆘 Bouton SOS en bas à droite (pulsant)

## 🐛 Debugging

Si vous rencontrez des problèmes :

```bash
# Nettoyer le cache Expo
npm start -- --clear

# Réinstaller les dépendances
rm -rf node_modules
npm install
```

## 📞 Support

Pour toute question sur l'app mobile, consultez la documentation Expo :
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [react-native-maps Docs](https://github.com/react-native-maps/react-native-maps)

---

**Créé avec ❤️ pour TSA Contest 2025**
