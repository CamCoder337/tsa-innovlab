# Configuration Google Maps API

## Pourquoi Google Maps ?

L'application utilise Google Maps pour afficher les cartes de suivi GPS en temps réel. Si la clé API n'est pas configurée, l'application utilisera un fallback simple avec des liens vers Google Maps.

## Configuration

1. **Obtenir une clé API Google Maps** :
   - Aller sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créer un nouveau projet ou sélectionner un projet existant
   - Activer l'API "Maps JavaScript API"
   - Créer une clé API dans "Credentials"

2. **Configurer la clé dans l'application** :
   ```bash
   # Dans le fichier .env (frontend)
   VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
   ```

3. **Restrictions recommandées** :
   - Restreindre la clé aux domaines de votre application
   - Limiter aux APIs nécessaires : Maps JavaScript API

## Fallback sans Google Maps

Si aucune clé API n'est configurée, l'application affichera :
- Les coordonnées de départ et d'arrivée
- Des liens pour ouvrir Google Maps dans le navigateur
- Un message indiquant que le suivi GPS est disponible dans l'app mobile

## Test

Pour tester si Google Maps fonctionne :
1. Aller sur une page de suivi de mission
2. Cliquer sur l'onglet "Carte"
3. Vérifier si la carte interactive s'affiche

Si vous voyez "Impossible de charger la carte", vérifiez :
- La clé API dans le fichier .env
- Que l'API Maps JavaScript est activée
- Les restrictions de domaine