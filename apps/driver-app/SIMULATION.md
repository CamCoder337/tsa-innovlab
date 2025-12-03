# Simulation de Suivi en Temps Réel

## Vue d'ensemble

L'application driver-app inclut une fonctionnalité de **simulation de suivi en temps réel** qui permet de visualiser le déplacement d'un chauffeur le long d'un trajet de livraison, de manière similaire à une vraie mission de livraison.

## Fonctionnalités

### 1. Simulation de Trajet
- **Animation fluide** : Le marqueur du chauffeur se déplace progressivement du point de ramassage au point de livraison
- **100 points interpolés** : La route est divisée en 100 étapes pour une animation douce
- **Vitesse configurable** : Par défaut 3 points/seconde (modifiable)

### 2. Statistiques en Temps Réel
La simulation affiche en temps réel :
- **Progression** : Pourcentage du trajet accompli (0-100%)
- **Distance restante** : Calculée dynamiquement en kilomètres
- **ETA (Estimated Time of Arrival)** : Temps estimé jusqu'à l'arrivée, formaté (ex: "2h 30min")

### 3. Contrôles de Simulation
Trois boutons permettent de contrôler la simulation :
- **▶ Démarrer simulation** : Lance la simulation depuis le début
- **▶ Reprendre** : Continue une simulation en pause
- **⏸ Pause** : Met la simulation en pause
- **⟲ Réinitialiser** : Remet la simulation à zéro

### 4. Suivi de Caméra
- La carte suit automatiquement le marqueur du chauffeur pendant la simulation
- Zoom automatique pour garder le véhicule au centre de l'écran

### 5. Notifications
- **Alerte de confirmation** : Avant de démarrer la simulation
- **Notification de fin** : Quand la livraison est complétée (100%)

## Architecture Technique

### Fichiers Principaux

#### `src/utils/routeSimulation.ts`
Utilitaires de simulation de route :
- `interpolateCoordinates()` : Interpole entre deux coordonnées GPS
- `generateRoutePoints()` : Génère N points le long d'une route
- `calculateDistance()` : Calcule la distance avec la formule de Haversine
- `calculateETA()` : Calcule l'ETA basé sur distance et vitesse
- `formatETA()` : Formate l'ETA en texte lisible
- `RouteSimulator` : Classe principale gérant la simulation

#### `src/screens/MapScreen.tsx`
Écran de carte intégrant la simulation :
- Initialise le simulateur au chargement
- Affiche le panneau de stats et de contrôles
- Gère les callbacks de mise à jour
- Centre la caméra sur le véhicule

### Classe `RouteSimulator`

```typescript
const simulator = new RouteSimulator(
  mission,           // Mission à simuler
  updateCallback,    // Fonction appelée à chaque mise à jour
  speed             // Points par seconde (défaut: 2)
);

// Méthodes disponibles
simulator.start();         // Démarrer
simulator.pause();         // Mettre en pause
simulator.stop();          // Arrêter
simulator.reset();         // Réinitialiser
simulator.setSpeed(5);     // Changer la vitesse
```

### État de Simulation

```typescript
interface RouteSimulationState {
  currentPosition: { latitude: number; longitude: number };
  progress: number;           // 0-100
  remainingDistance: number;  // km
  eta: number;               // minutes
  isRunning: boolean;
}
```

## Utilisation

### 1. Navigation vers une Mission
Depuis l'écran de liste des missions (`MissionListScreen`), cliquer sur une mission pour ouvrir la carte avec la simulation.

### 2. Démarrer la Simulation
1. Appuyer sur le bouton **"▶ Démarrer simulation"**
2. Confirmer dans la boîte de dialogue
3. Observer le marqueur se déplacer le long de la route

### 3. Contrôler la Simulation
- **Pause** : Figer la simulation à tout moment
- **Reprendre** : Continuer depuis le point actuel
- **Réinitialiser** : Recommencer depuis le début

### 4. Fin de Simulation
Quand le marqueur atteint la destination :
- La simulation s'arrête automatiquement
- Une notification confirme la livraison
- La progression affiche 100%

## Configuration

### Vitesse de Simulation
Modifiable dans `MapScreen.tsx` ligne 107 :
```typescript
new RouteSimulator(mission, callback, 3) // 3 points/seconde
```

Valeurs recommandées :
- `1` : Très lent (réaliste)
- `2` : Lent (défaut)
- `3` : Rapide (démonstration)
- `5` : Très rapide (test)

### Nombre de Points
Modifiable dans `routeSimulation.ts` ligne 89 :
```typescript
this.routePoints = generateRoutePoints(..., 100) // 100 points
```

Plus de points = animation plus fluide mais plus longue

### Vitesse Moyenne pour ETA
Modifiable dans `routeSimulation.ts` ligne 70 :
```typescript
export const calculateETA = (
  remainingDistance: number,
  averageSpeed: number = 60 // km/h
)
```

## Cas d'Usage

### 1. Démonstration Commerciale
Montrer comment fonctionne le suivi en temps réel aux clients potentiels.

### 2. Tests de l'Interface
Valider l'UX du suivi de livraison sans conduire réellement.

### 3. Formation des Chauffeurs
Former les chauffeurs à l'utilisation de l'application.

### 4. Développement
Tester les fonctionnalités de suivi sans backend connecté.

## Améliorations Futures

### À Court Terme
- [ ] Ajouter des points d'intérêt le long de la route
- [ ] Simuler des retards aléatoires
- [ ] Mode "suivre moi" avec géolocalisation réelle

### À Moyen Terme
- [ ] Intégration avec Google Directions API pour routes réelles
- [ ] Simulation de trafic et conditions météo
- [ ] Historique des trajets simulés

### À Long Terme
- [ ] Connexion au backend pour simuler avec données réelles
- [ ] Mode multi-chauffeur (plusieurs simulations simultanées)
- [ ] Replay de missions historiques

## Notes Techniques

### Calcul de Distance
Utilise la **formule de Haversine** pour calculer la distance orthodromique entre deux points GPS sur une sphère.

### Interpolation Linéaire
L'interpolation actuelle est **linéaire**, ce qui signifie que le trajet est une ligne droite entre pickup et delivery. Pour des routes réelles, il faudrait utiliser Google Directions API.

### Performance
- La simulation utilise `setInterval` avec nettoyage approprié
- Pas d'impact significatif sur les performances
- La caméra s'anime sans saccades grâce à `animateCamera`

### Gestion de la Mémoire
- Le simulateur est nettoyé lors du démontage du composant
- Utilisation de `useRef` pour éviter les re-renders inutiles

## Support

Pour toute question ou problème :
1. Vérifier que Google Maps API key est configurée dans `app.json`
2. S'assurer que les permissions de localisation sont accordées
3. Vérifier les logs de la console pour les erreurs
