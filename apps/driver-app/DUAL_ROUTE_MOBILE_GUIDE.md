# Guide des Itinéraires Multiples - App Mobile Driver

## Vue d'ensemble

L'application mobile driver affiche maintenant plusieurs itinéraires simultanément pour une meilleure planification et navigation.

## Types d'itinéraires affichés

### 1. Route Active (Bleu solide)
- **Couleur**: Bleu (`Colors.primary`)
- **Style**: Ligne solide épaisse (7px)
- **Description**: Itinéraire de navigation actuel vers la destination courante
- **Logique**: 
  - Si cargaison non récupérée → vers le dépôt
  - Si cargaison récupérée → vers la destination finale

### 2. Route vers Dépôt (Orange pointillé)
- **Couleur**: Orange (`#FF8C00`)
- **Style**: Ligne pointillée (6px, pattern [10, 5])
- **Description**: Itinéraire de la position actuelle vers le point de départ
- **Visibilité**: Affiché uniquement si la cargaison n'est pas encore récupérée

### 3. Plan de Mission (Vert pointillé)
- **Couleur**: Vert lime (`#32CD32`)
- **Style**: Ligne pointillée (5px, pattern [15, 10])
- **Description**: Itinéraire planifié du dépôt vers la destination finale
- **Visibilité**: Toujours affiché pour la planification

### 4. Trajet Parcouru (Gris solide)
- **Couleur**: Gris (`#666666`)
- **Style**: Ligne solide fine (4px)
- **Description**: Chemin réellement parcouru par le chauffeur
- **Mise à jour**: En temps réel avec le GPS

## Interface utilisateur

### Légende Interactive
- **Position**: Coin supérieur gauche, sous la carte d'information
- **Contenu**: Explication visuelle de chaque type d'itinéraire
- **Adaptation**: La légende s'adapte selon l'état de la mission

### Marqueurs
- **Dépôt**: Marqueur vert (toujours visible)
- **Destination**: Marqueur rouge (toujours visible)
- **Chauffeur**: Icône de navigation bleue avec orientation

## Logique de calcul

### États de mission
```typescript
const isCargoPickedUp = ['loaded', 'en_route_delivery', 'arrived_delivery', 'delivered']
  .includes(mission.status.toLowerCase());
```

### Calcul des routes
1. **Route vers dépôt**: Position actuelle → Dépôt (si cargaison non récupérée)
2. **Plan mission**: Dépôt → Destination finale (toujours)
3. **Route active**: Position actuelle → Destination courante (dépôt ou finale)

### API Google Directions
- Utilise `googleMapsService.getDirections()`
- Gestion d'erreur avec fallback
- Cache automatique des résultats

## Avantages

### Pour le chauffeur
- **Vision globale**: Voir l'ensemble du trajet dès le début
- **Planification**: Anticiper les étapes suivantes
- **Orientation**: Comprendre sa position dans le processus global

### Pour l'efficacité
- **Optimisation**: Possibilité de voir des raccourcis
- **Préparation**: Anticiper les conditions de circulation
- **Contexte**: Comprendre la logique de la mission

## Configuration

### Couleurs personnalisables
```typescript
// Dans le composant
const routeColors = {
  active: Colors.primary,      // Bleu
  toPickup: '#FF8C00',        // Orange
  missionPlan: '#32CD32',     // Vert lime
  traveled: '#666666'         // Gris
};
```

### Styles de ligne
```typescript
const routeStyles = {
  active: { width: 7, dash: [0] },           // Solide épais
  toPickup: { width: 6, dash: [10, 5] },    // Pointillé moyen
  missionPlan: { width: 5, dash: [15, 10] }, // Pointillé fin
  traveled: { width: 4, dash: [0] }         // Solide fin
};
```

## Performance

### Optimisations
- Calcul des routes uniquement lors des changements de position significatifs
- Cache des résultats Google Directions
- Mise à jour différentielle des polylines

### Gestion mémoire
- Nettoyage automatique des anciennes routes
- Limitation du nombre de points dans le trajet parcouru
- Gestion d'erreur pour éviter les fuites mémoire

## Dépannage

### Routes non affichées
1. Vérifier la clé API Google Maps
2. Contrôler la connectivité réseau
3. Vérifier les coordonnées de mission

### Performance dégradée
1. Réduire la fréquence de mise à jour GPS
2. Limiter le nombre de points du trajet parcouru
3. Utiliser le cache des directions

### Erreurs de calcul
1. Valider les coordonnées d'entrée
2. Gérer les timeouts API
3. Implémenter des fallbacks locaux

## Évolutions futures

### Fonctionnalités possibles
- **Routes alternatives**: Afficher plusieurs options
- **Conditions trafic**: Intégrer les données de circulation
- **Points d'intérêt**: Marquer les stations-service, restaurants
- **Historique**: Sauvegarder les trajets précédents

### Améliorations UX
- **Zoom automatique**: Adapter la vue selon les routes
- **Animation**: Transitions fluides entre les états
- **Personnalisation**: Permettre de masquer certaines routes
- **Notifications**: Alertes sur les déviations importantes