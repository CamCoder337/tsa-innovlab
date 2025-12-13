# Guide du Suivi Double Itinéraire

## Vue d'ensemble

Le système de suivi GPS affiche maintenant **deux itinéraires simultanément** avec des couleurs différentes pour une meilleure compréhension du trajet.

## Types d'itinéraires affichés

### 🟢 Route Planifiée (Vert pointillé)
- **Couleur** : Vert avec ligne pointillée
- **Trajet** : Point de départ → Point d'arrivée
- **Usage** : Itinéraire original prévu pour la mission
- **Calcul** : Une seule fois au chargement de la page

### 🟠 Route Actuelle (Orange)
- **Couleur** : Orange continu
- **Trajet** : Position actuelle du chauffeur → Point d'arrivée
- **Usage** : Itinéraire optimal depuis la position actuelle
- **Calcul** : Mis à jour à chaque nouvelle position GPS

### 🔵 Trajet Parcouru (Bleu)
- **Couleur** : Bleu continu
- **Trajet** : Historique des positions GPS du chauffeur
- **Usage** : Chemin réellement suivi par le chauffeur
- **Mise à jour** : En temps réel avec les positions GPS

## Informations affichées

### Cartes d'information
- **Route planifiée** : Distance et durée de l'itinéraire original
- **Route actuelle** : Distance et durée restantes depuis la position actuelle

### Marqueurs
- 🟢 **Vert** : Point de départ de la mission
- 🔴 **Rouge** : Point d'arrivée de la mission  
- 🔵 **Bleu** : Position actuelle du chauffeur

## Avantages

### Pour l'affréteur
- **Vue complète** : Voir l'itinéraire prévu vs réel
- **Estimation précise** : Temps d'arrivée mis à jour en temps réel
- **Suivi des déviations** : Identifier si le chauffeur suit l'itinéraire optimal

### Pour le suivi logistique
- **Optimisation** : Comparer les routes pour améliorer la planification
- **Alertes** : Détecter les déviations importantes
- **Reporting** : Analyser l'efficacité des itinéraires

## Configuration technique

### Calcul des routes
```typescript
// Route planifiée (calculée une fois)
const plannedRoute = await calculateRoute(departureLocation, arrivalLocation);

// Route actuelle (recalculée à chaque position)
const currentRoute = await calculateRoute(currentLocation, arrivalLocation);
```

### Couleurs et styles
```typescript
// Route planifiée
strokeColor: '#10B981', // Vert
strokeDashArray: '10,5', // Pointillé

// Route actuelle  
strokeColor: '#F59E0B', // Orange
strokeWeight: 5, // Plus épaisse

// Trajet parcouru
strokeColor: '#4F46E5', // Bleu
strokeWeight: 3
```

## Cas d'usage

### Scénario 1 : Trajet normal
- Route planifiée et actuelle sont similaires
- Le chauffeur suit l'itinéraire optimal
- Temps d'arrivée stable

### Scénario 2 : Déviation
- Route actuelle différente de la planifiée
- Possible embouteillage ou route fermée
- Temps d'arrivée recalculé automatiquement

### Scénario 3 : Retard
- Route actuelle plus longue que prévue
- Alerte automatique possible
- Notification client du nouveau délai

## Performance

### Optimisations
- Route planifiée calculée une seule fois
- Route actuelle recalculée seulement si position change significativement
- Cache des résultats pour éviter les appels répétés

### Limitations
- Nécessite une clé Google Maps API valide
- Consommation d'API proportionnelle aux mises à jour de position
- Précision dépendante de la qualité du signal GPS

## Fallback

Si Google Maps n'est pas disponible, le système utilise automatiquement `SimpleMapFallback` qui affiche :
- Les coordonnées de départ et d'arrivée
- Des liens vers Google Maps externe
- Le calcul de distance à vol d'oiseau