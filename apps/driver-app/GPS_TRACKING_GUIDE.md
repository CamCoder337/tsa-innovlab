# 📍 Guide de Test du Suivi GPS en Temps Réel

## Vue d'ensemble

Cette fonctionnalité vous permet de créer une mission test et de suivre votre déplacement **réel** sur la carte à l'aide de votre GPS.

## 🚀 Comment tester

### Étape 1 : Créer une Mission Test

1. Ouvrez l'application dans Expo Go
2. Sur l'écran "Mes Missions", cliquez sur le bouton **"+"** en haut à droite
3. Vous arrivez sur l'écran "Créer une Mission Test"

### Étape 2 : Configurer la Mission

1. **Point de départ** : Votre position actuelle est automatiquement détectée
2. **Destination** : Entrez une adresse proche de vous
   - Exemple : "Bureau d'en face", "Café du coin", etc.
   - 💡 Pour tester rapidement, choisissez une destination à 200m-1km
3. **Description** (optionnelle) : Donnez un nom à votre test
4. Cliquez sur **"🚀 Démarrer le suivi GPS"**

### Étape 3 : Suivre Votre Trajet

1. L'écran de carte s'ouvre avec la route tracée par Google Maps
2. Cliquez sur **"📍 Démarrer le suivi GPS"**
3. **Déplacez-vous physiquement** vers la destination
4. Observez sur la carte :
   - Votre position (marqueur bleu) se met à jour toutes les 2 secondes
   - La route devient **grise** derrière vous (trajet parcouru)
   - La route reste **bleue** devant vous (trajet restant)
   - Les statistiques se mettent à jour en temps réel

### Étape 4 : Arrivée

Quand vous arrivez à moins de **50 mètres** de la destination :
- Une notification "🎉 Mission accomplie!" s'affiche
- Affiche la distance totale parcourue
- Vous retournez à l'écran de liste

## 📊 Statistiques en Temps Réel

| Statistique | Description |
|-------------|-------------|
| **Progression** | Pourcentage du trajet accompli (0-100%) |
| **Distance totale** | Distance de la route selon Google Maps |
| **Parcourue** | Distance réellement parcourue par GPS |

## 🎨 Code Couleurs

| Élément | Couleur | Signification |
|---------|---------|---------------|
| Route parcourue | Gris clair | Vous êtes déjà passé par là |
| Route restante | Bleu foncé | Trajet à faire |
| Votre position | Bleu animé | Vous êtes ici |
| Point de départ | Pin bleu | Départ |
| Destination | Pin vert | Arrivée |

## 🔧 Paramètres Techniques

### Précision GPS
- **Mode** : Best For Navigation (haute précision)
- **Intervalle de temps** : 2 secondes
- **Intervalle de distance** : 5 mètres
- La position est mise à jour si vous bougez d'au moins 5m

### Détection d'Arrivée
- Rayon d'arrivée : **50 mètres**
- Quand vous êtes à moins de 50m de la destination, la mission est considérée comme terminée

### Suivi du Trajet
- Chaque position GPS est enregistrée dans le "chemin parcouru"
- Ce chemin est affiché en gris sur la carte
- La distance parcourue est calculée en additionnant les segments

## 📱 Exemple de Scénario

```
1. Position actuelle : Votre bureau
   Latitude: 3.8480, Longitude: 11.5021

2. Destination : Café à 500m
   Adresse : "Café du Centre, Yaoundé"

3. Démarrer le suivi GPS

4. Marchez vers le café (ou roulez en voiture)

5. Observez sur la carte :
   - Début : Route 100% bleue
   - Milieu : Route 50% grise, 50% bleue
   - Arrivée : Route 100% grise, notification de fin
```

## 🎯 Conseils pour un Bon Test

### Pour un Test Rapide
- Choisissez une destination à **200-500 mètres**
- Testez à pied ou en véhicule lent
- Assurez-vous d'avoir une bonne connexion GPS (pas à l'intérieur)

### Pour un Test Réaliste
- Choisissez une destination à **1-5 km**
- Testez en voiture ou en moto
- Observez comment la route change de couleur progressivement

### Pour Optimiser la Précision GPS
- ✅ Testez à l'extérieur (pas à l'intérieur d'un bâtiment)
- ✅ Assurez-vous que le GPS est activé
- ✅ Laissez le téléphone capter le signal pendant 10-20 secondes
- ❌ Évitez les tunnels ou zones avec peu de satellites

## 🐛 Résolution de Problèmes

### La position ne se met pas à jour
**Solution** :
- Vérifier que les permissions de localisation sont accordées
- Sortir à l'extérieur pour un meilleur signal GPS
- Redémarrer l'application

### La route ne se dessine pas
**Solution** :
- Vérifier la connexion internet (nécessaire pour Google Maps)
- Vérifier que l'adresse destination est valide
- Réessayer avec une adresse plus simple (ex: "Yaoundé, Cameroun")

### L'application demande toujours la permission
**Solution** :
- Aller dans Paramètres > Applications > Expo Go
- Autoriser "Localisation" en mode "Toujours" ou "En cours d'utilisation"

### La notification de fin n'apparaît pas
**Solution** :
- Assurez-vous d'être à moins de 50m de la destination
- Vérifiez que le suivi GPS est bien actif (bouton rouge "🔴 Suivi GPS actif")

## 🔒 Permissions Requises

| Permission | Utilisation |
|------------|-------------|
| Localisation (foreground) | Obtenir votre position actuelle |
| Localisation (background) | Suivre votre position pendant le trajet |

## ⚡ Fonctionnalités

- ✅ Création de mission depuis position actuelle
- ✅ Géocodage d'adresse (text → coordonnées GPS)
- ✅ Géocodage inverse (coordonnées → adresse)
- ✅ Suivi GPS en temps réel (toutes les 2s ou 5m)
- ✅ Calcul de progression automatique
- ✅ Changement de couleur de route dynamique
- ✅ Notification d'arrivée automatique
- ✅ Calcul de distance parcourue
- ✅ Centrage automatique de la caméra
- ✅ Routes réelles depuis Google Maps

## 📝 Notes Importantes

1. **Connexion Internet** : Nécessaire pour charger la route Google Maps et géocoder l'adresse
2. **Batterie** : Le suivi GPS continu consomme de la batterie
3. **Données Mobiles** : L'affichage de la carte consomme des données
4. **Précision** : La précision varie selon les conditions (météo, bâtiments, etc.)

## 🚀 Prochaines Améliorations

- [ ] Mode hors ligne avec routes en cache
- [ ] Historique des trajets effectués
- [ ] Export des trajets en GPX
- [ ] Statistiques de vitesse moyenne
- [ ] Estimation de temps d'arrivée dynamique
- [ ] Alertes de déviation de route
- [ ] Mode économie de batterie

## 🎓 Architecture Technique

### Composants Utilisés

1. **Expo Location** : Pour le suivi GPS
   ```typescript
   Location.watchPositionAsync({
     accuracy: Location.Accuracy.BestForNavigation,
     timeInterval: 2000,
     distanceInterval: 5,
   }, callback)
   ```

2. **Google Directions API** : Pour les routes réelles
3. **Google Geocoding API** : Pour convertir adresses ↔ coordonnées
4. **React Native Maps** : Pour l'affichage de la carte

### Calculs

**Distance entre deux points (Haversine)** :
```typescript
const R = 6371e3; // Rayon de la Terre en mètres
const φ1 = (lat1 * Math.PI) / 180;
const φ2 = (lat2 * Math.PI) / 180;
const Δφ = ((lat2 - lat1) * Math.PI) / 180;
const Δλ = ((lon2 - lon1) * Math.PI) / 180;

const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const distance = R * c;
```

**Progression** :
```typescript
const traveled = totalDistance - distanceToDestination;
const progress = (traveled / totalDistance) * 100;
```
