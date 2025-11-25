# 📱 Guide : Application Autonome Android (Sans Serveur)

Ce guide explique comment utiliser et déployer l'application **TSA Driver** en mode 100% autonome, sans dépendre d'un serveur backend.

## 🎯 Objectif

L'application mobile pour chauffeurs fonctionne **entièrement hors ligne** avec :
- ✅ Stockage local persistant (AsyncStorage)
- ✅ Sauvegarde des missions sur le téléphone
- ✅ Photos et signatures stockées localement
- ✅ Pas de connexion internet requise
- ✅ Données conservées après redémarrage

## 📋 Prérequis

### Pour Développement
- Node.js 18+
- Expo CLI
- Android Studio (pour émulateur) OU téléphone Android physique
- Compte Expo (gratuit) pour build

### Pour Utilisation (Utilisateur Final)
- Téléphone Android 5.0+ (API 21+)
- Aucune connexion internet requise après installation

## 🏗️ Architecture de Stockage

### 1. AsyncStorage (Données Structurées)

**Clé** | **Contenu** | **Exemple**
--------|-------------|-------------
`@tsa_driver_missions` | Toutes les missions | `[{id: '1', status: 'delivered', ...}]`
`@tsa_driver_settings` | Paramètres app | `{theme: 'light', notifications: true}`
`@tsa_driver_profile` | Profil chauffeur | `{name: 'Jean Mbarga', phone: '+237...'}`
`@tsa_driver_pod_photos` | Index des photos | `{'1': 'file://...jpg', '2': '...'}`
`@tsa_driver_pod_signatures` | Index signatures | `{'1': 'file://...png', '2': '...'}`

### 2. FileSystem (Fichiers Binaires)

Les fichiers sont stockés dans `FileSystem.documentDirectory` :
```
/data/data/com.tsa.driverapp/files/
├── pod_photo_1_1732012345678.jpg
├── pod_photo_2_1732012567890.jpg
├── pod_signature_1_1732012345678.png
└── pod_signature_2_1732012567890.png
```

## 🚀 Installation et Déploiement

### Option 1 : Build avec Expo (Recommandé)

#### Étape 1 : Installer EAS CLI
```bash
npm install -g eas-cli
```

#### Étape 2 : Se connecter à Expo
```bash
eas login
```

#### Étape 3 : Configurer le projet
```bash
cd apps/driver-app
eas build:configure
```

#### Étape 4 : Build APK pour Android
```bash
eas build -p android --profile preview
```

Cela va :
1. Builder l'application sur les serveurs Expo
2. Générer un APK téléchargeable
3. Vous envoyer un lien de téléchargement

#### Étape 5 : Télécharger et Installer
- Télécharger l'APK depuis le lien fourni
- Transférer sur téléphone Android
- Installer (autoriser "Sources inconnues" si nécessaire)

### Option 2 : Build Local (Avancé)

#### Étape 1 : Prebuild
```bash
cd apps/driver-app
npx expo prebuild
```

#### Étape 2 : Build avec Gradle
```bash
cd android
./gradlew assembleRelease
```

#### Étape 3 : Récupérer l'APK
L'APK sera dans :
```
android/app/build/outputs/apk/release/app-release.apk
```

### Option 3 : Development Build (Test)

Pour tester rapidement :
```bash
cd apps/driver-app
npm install
npm start
```

Puis scanner le QR code avec Expo Go.

## 🎮 Guide d'Utilisation

### Premier Lancement

1. **Ouvrir l'application**
   - L'app charge automatiquement 5 missions de démonstration
   - Ces missions sont sauvegardées dans AsyncStorage

2. **Écran d'accueil**
   - Onglet "Carte" : Voir les missions sur Google Maps
   - Onglet "Missions" : Liste des missions actives et terminées

### Workflow d'une Mission

#### 1. Consulter les Missions
```
Écran : Liste des Missions
↓
Onglets : [Actives] [Terminées]
↓
Cliquer sur une mission pour voir les détails
```

#### 2. Accepter une Mission
```
Écran : Détails de Mission
↓
Bouton : "Accepter la mission"
↓
Statut passe de "assigned" → "accepted"
↓
Sauvegarde automatique dans AsyncStorage
```

#### 3. Démarrer vers Pickup
```
Bouton : "Démarrer vers pickup"
↓
Statut : "en_route_pickup"
↓
Google Maps s'ouvre avec l'itinéraire (optionnel)
```

#### 4. Arriver au Pickup
```
Bouton : "Je suis arrivé"
↓
Statut : "arrived_pickup"
↓
Possibilité de scanner QR code
```

#### 5. Charger le Cargaison
```
Bouton : "Cargaison chargée"
↓
Statut : "loaded"
↓
Prêt pour livraison
```

#### 6. Démarrer Livraison
```
Bouton : "Démarrer livraison"
↓
Statut : "en_route_delivery"
↓
Navigation vers point de livraison
```

#### 7. Arriver à Destination
```
Bouton : "Je suis arrivé"
↓
Statut : "arrived_delivery"
↓
Prêt pour preuve de livraison
```

#### 8. Preuve de Livraison
```
Bouton : "Preuve de livraison"
↓
Écran de Preuve :
  1. Prendre une photo (Caméra)
     → Sauvegardée dans FileSystem
  2. Signature électronique
     → Dessinée sur écran, sauvegardée en PNG
  3. Nom du destinataire
  4. Notes (optionnel)
↓
Bouton : "Confirmer la livraison"
↓
Statut : "delivered"
↓
Tout sauvegardé localement
```

### Créer une Nouvelle Mission

```
Écran : Liste des Missions
↓
Bouton "+" en haut à droite
↓
Écran : Créer une Mission
↓
Remplir les champs :
  - Numéro de mission
  - Adresse de pickup
  - Adresse de livraison
  - Type de cargaison
  - Poids
  - Instructions spéciales
↓
Bouton : "Créer la mission"
↓
Mission sauvegardée dans AsyncStorage
↓
Apparaît dans la liste
```

### Voir sur la Carte

```
Onglet : Carte
↓
Visualisation :
  - Marqueurs bleus = Points de pickup
  - Marqueurs verts = Points de livraison
  - Lignes = Itinéraires
  - Position actuelle (si permission accordée)
↓
Cliquer sur marqueur → Détails de mission
```

### Bouton SOS

Le bouton SOS rouge est **toujours visible** en bas à droite :

```
Clic sur bouton SOS
↓
Modal d'alerte :
  - Type : Accident / Panne / Sécurité / Autre
  - Description (optionnel)
↓
Bouton : "Envoyer l'alerte"
↓
Alerte enregistrée localement
↓
En production : Envoie notification au dispatching
```

## 💾 Gestion des Données

### Voir les Données Stockées

Sur un téléphone avec ADB :
```bash
# Ouvrir le shell Android
adb shell

# Aller dans le dossier de l'app
cd /data/data/com.tsa.driverapp/

# Voir AsyncStorage
cd databases
sqlite3 RKStorage

# Lister toutes les données
.tables
SELECT * FROM catalystLocalStorage;
```

### Réinitialiser les Données

Depuis l'app (à implémenter dans les paramètres) :
```typescript
import { clearAllData } from './services/localStorageService';
import { initializeMissions } from './services/missionService';

// Effacer tout
await clearAllData();

// Recharger les missions par défaut
await initializeMissions();
```

### Exporter les Données

Pour sauvegarder manuellement :
```typescript
import { loadMissions } from './services/localStorageService';

const missions = await loadMissions();
const json = JSON.stringify(missions, null, 2);

// Enregistrer dans un fichier ou partager
// (nécessite expo-sharing ou expo-file-system)
```

## 🔧 Configuration

### Permissions Android

L'app requiert ces permissions (déjà configurées dans `app.json`) :

```json
{
  "android": {
    "permissions": [
      "CAMERA",                    // Pour scanner QR et prendre photos
      "ACCESS_FINE_LOCATION",      // GPS précis
      "ACCESS_COARSE_LOCATION"     // GPS approximatif
    ]
  }
}
```

### Google Maps API

Pour utiliser la carte :
1. Obtenir une clé API sur [Google Cloud Console](https://console.cloud.google.com/)
2. Activer **Maps SDK for Android**
3. Mettre la clé dans `app.json` :

```json
{
  "android": {
    "config": {
      "googleMaps": {
        "apiKey": "AIza..."
      }
    }
  }
}
```

**Note** : Google Maps fonctionne en cache après le premier chargement des tuiles.

## 📦 Distribution

### APK Autonome

Une fois le build terminé :

1. **Télécharger l'APK** depuis le lien EAS
2. **Transférer sur téléphone** :
   - Via USB
   - Via Google Drive
   - Via email
3. **Installer** :
   - Ouvrir le fichier APK
   - Autoriser "Sources inconnues" si demandé
   - Suivre l'installation

### Play Store (Optionnel)

Pour publier sur Google Play :
```bash
eas build -p android --profile production
eas submit -p android
```

## 🔒 Sécurité et Vie Privée

### Stockage Sécurisé
- AsyncStorage utilise le **Keystore Android** pour chiffrement
- Les fichiers sont dans le **sandbox de l'app** (privé)
- Aucune donnée n'est transmise sur internet

### Permissions
- Caméra : Uniquement pour photos et QR codes
- Localisation : Uniquement pour carte et tracking mission
- Aucune permission intrusive

## 🐛 Dépannage

### L'app ne s'installe pas
- Vérifier : Android 5.0+ (API 21+)
- Activer "Sources inconnues" dans Paramètres > Sécurité

### Les données disparaissent
- Vérifier : Ne pas "Effacer les données" de l'app dans Paramètres
- AsyncStorage persiste tant que l'app est installée

### La carte ne s'affiche pas
- Vérifier la clé Google Maps API dans `app.json`
- Vérifier la connexion internet (première fois)

### L'app crash au démarrage
```bash
# Voir les logs via ADB
adb logcat | grep "TSA Driver"
```

## 📊 Capacité de Stockage

### Limites

- **AsyncStorage** : ~10 MB (Android)
- **FileSystem** : Limité par espace téléphone

### Estimation

Item | Taille | Capacité
-----|--------|----------
Une mission (JSON) | ~2 KB | ~5000 missions dans 10 MB
Une photo (JPEG) | ~500 KB | Dépend de l'espace dispo
Une signature (PNG) | ~50 KB | ~200 MB pour 4000 signatures

Pour un usage typique :
- **100 missions** : ~200 KB
- **100 photos** : ~50 MB
- **100 signatures** : ~5 MB
- **Total** : ~55 MB

## ✅ Checklist de Déploiement

Avant de distribuer l'APK :

- [ ] Clé Google Maps API configurée
- [ ] Permissions Android vérifiées
- [ ] Build testé sur émulateur
- [ ] Build testé sur téléphone physique
- [ ] Workflow complet testé (mission → livraison)
- [ ] Photos et signatures testées
- [ ] Persistence testée (redémarrage app)
- [ ] APK signé (pour production)

## 🎓 Formation Chauffeurs

### Points Clés à Expliquer

1. **L'app fonctionne sans internet**
   - Toutes les données sont sur votre téléphone
   - Pas besoin de connexion pour travailler

2. **Les données restent**
   - Même après redémarrage
   - Ne pas désinstaller l'app

3. **Workflow simple**
   - Suivre les boutons dans l'ordre
   - Chaque action est sauvegardée automatiquement

4. **Preuve de livraison**
   - Photo claire du colis
   - Signature lisible
   - Nom complet du destinataire

## 📞 Support

Pour toute question :
- Documentation Expo : https://docs.expo.dev
- React Native : https://reactnative.dev
- Problème technique : Créer une issue sur GitHub

---

**Créé avec ❤️ pour TSA Contest 2025**
