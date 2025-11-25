# Guide de Test - Tracking GPS en Temps Réel

Ce guide vous explique comment tester le système de tracking GPS entre l'app mobile (driver-app) et le dashboard transporteur (frontend-web).

## 🏗️ Architecture Implémentée

```
┌─────────────────┐         ┌──────────────┐         ┌────────────────────┐
│  App Mobile     │         │   Backend    │         │  Dashboard         │
│  (driver-app)   │ ──────> │  AdonisJS    │ ──────> │  Transporteur      │
│                 │  POST   │              │ WebSocket│                   │
│  - Expo         │         │  Port 3333   │         │  Port 5173         │
│  - GPS Auto     │         │  - API       │         │  - React           │
│    (5 secondes) │         │  - WebSocket │         │  - Google Maps     │
└─────────────────┘         └──────────────┘         └────────────────────┘
```

## 📝 Fonctionnalités Implémentées

### Backend (tsa-monolith)
✅ **Endpoint public (sans authentification)**
- `POST /api/tracking/update-location` - Recevoir position GPS
- `GET /api/tracking/locations` - Récupérer toutes les positions actives
- `GET /api/tracking/locations/:deviceId` - Position d'un appareil spécifique
- `DELETE /api/tracking/cleanup` - Nettoyer les positions anciennes (>5 min)

✅ **Broadcasting temps réel via WebSocket**
- Diffusion automatique des positions à tous les clients connectés
- Type de message: `location_update`

### App Mobile (driver-app)
✅ **App Expo minimaliste**
- Demande automatique des permissions GPS
- ID unique généré pour chaque appareil
- Envoi automatique de la position toutes les 5 secondes
- Interface simple avec bouton Start/Stop
- Affichage de la position actuelle et des statistiques

### Frontend (frontend-web)
✅ **Dashboard Transporteur avec onglet "Chauffeurs GPS"**
- Carte Google Maps avec markers en temps réel
- Liste des chauffeurs actifs
- Connexion WebSocket pour mises à jour live
- Détails de chaque chauffeur (position, vitesse, direction)
- Stats: nombre de chauffeurs, état connexion, dernière mise à jour

---

## 🚀 Étape 1 : Démarrer le Backend

```bash
cd services/tsa-monolith
npm run dev
```

**Vérifier que le serveur démarre sur le port 3333**

Test manuel de l'API :
```bash
# Test de l'endpoint (optionnel)
curl -X POST http://localhost:3333/api/tracking/update-location \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-001","latitude":3.8480,"longitude":11.5021,"speed":0}'
```

---

## 📱 Étape 2 : Démarrer l'App Mobile

### Option A : Émulateur Android (Recommandé)

```bash
cd apps/driver-app

# Installer les dépendances si ce n'est pas déjà fait
npm install

# Démarrer Expo
npx expo start
```

**Ensuite :**
1. Appuyez sur `a` pour ouvrir dans l'émulateur Android
2. L'app se lance automatiquement
3. Cliquez sur "Start Tracking"
4. **IMPORTANT** : Sur l'émulateur, simulez une position GPS :
   - Ouvrez les "Extended Controls" (icône `...` dans la barre latérale)
   - Allez dans "Location"
   - Entrez des coordonnées (ex: Lat: 3.8480, Lng: 11.5021 pour Yaoundé)
   - Cliquez sur "Send"

### Option B : Appareil Physique Android

```bash
cd apps/driver-app
npx expo start
```

1. Scannez le QR code avec l'app Expo Go
2. Autorisez l'accès à la localisation
3. Cliquez sur "Start Tracking"
4. **Déplacez-vous physiquement** pour voir les positions changer

### Option C : Simulateur iOS (Mac uniquement)

```bash
cd apps/driver-app
npx expo start
```

Appuyez sur `i` pour ouvrir dans le simulateur iOS.

---

## 🖥️ Étape 3 : Démarrer le Frontend

```bash
cd apps/frontend-web
yarn dev
```

**Le frontend démarre sur http://localhost:5173**

### Se Connecter comme Transporteur

1. Allez sur http://localhost:5173
2. Connectez-vous avec un compte transporteur (créez-en un si nécessaire)
   ```
   Email: transporteur@test.com
   Password: (votre mot de passe)
   ```

3. **Naviguez vers le Dashboard de Tracking**
   - Allez dans le menu de navigation
   - Cliquez sur "Tracking" ou "Suivi"
   - Cliquez sur l'onglet **"Chauffeurs GPS"** 🚗

---

## 🧪 Étape 4 : Tester le Flux Complet

### Test 1 : Vérifier la Position Initiale

1. **App Mobile** : Cliquez sur "Start Tracking"
2. **Frontend** : Vous devriez voir :
   - Un nouveau marker bleu apparaître sur la carte
   - Le compteur "Chauffeurs Actifs" passer à 1
   - L'appareil listé dans la sidebar avec son deviceId
   - Badge "🟢 En ligne" en vert

### Test 2 : Mises à Jour en Temps Réel

1. **App Mobile** : Observez le compteur "Updates sent" augmenter toutes les 5 secondes
2. **Frontend** :
   - Le marker devrait se mettre à jour automatiquement
   - Le timestamp de "Dernière MAJ" change toutes les 5 secondes
   - Les coordonnées dans la liste se mettent à jour

### Test 3 : Simulation de Mouvement (Émulateur)

1. **Émulateur Android** :
   - Ouvrez Extended Controls → Location
   - Changez les coordonnées GPS
   - Cliquez sur "Send"

2. **Frontend** :
   - Le marker se déplace sur la carte
   - La vitesse peut s'afficher si détectée
   - Les coordonnées changent dans la liste

### Test 4 : Plusieurs Chauffeurs

1. **Méthode 1** : Lancez plusieurs instances de l'app
   - Ouvrez plusieurs émulateurs
   - Chacun aura un deviceId unique

2. **Méthode 2** : Envoyez manuellement des positions
   ```bash
   # Chauffeur 1
   curl -X POST http://localhost:3333/api/tracking/update-location \
     -H "Content-Type: application/json" \
     -d '{"deviceId":"driver-001","latitude":3.8480,"longitude":11.5021,"speed":50}'

   # Chauffeur 2
   curl -X POST http://localhost:3333/api/tracking/update-location \
     -H "Content-Type: application/json" \
     -d '{"deviceId":"driver-002","latitude":3.8550,"longitude":11.5100,"speed":30}'
   ```

3. **Frontend** :
   - Vous devriez voir 2 markers sur la carte
   - Compteur "Chauffeurs Actifs" = 2
   - Les deux chauffeurs dans la liste

### Test 5 : Interactivité

1. **Cliquez sur un chauffeur dans la liste** :
   - La carte se centre sur sa position
   - Zoom automatique à niveau 15

2. **Cliquez sur un marker sur la carte** :
   - Une info-bulle s'ouvre avec les détails
   - Le chauffeur est sélectionné
   - Ses détails s'affichent dans la carte du bas

3. **Cliquez sur "Actualiser"** :
   - Recharge toutes les positions depuis le backend

---

## 🔍 Vérifications et Débogage

### Backend

**Vérifier les logs** :
```bash
# Dans le terminal du backend, vous devriez voir :
✅ WebSocket: user@email.com (transporteur) connecté
✅ Location updated successfully and broadcasted in real-time
```

**Tester l'API manuellement** :
```bash
# Récupérer toutes les positions
curl http://localhost:3333/api/tracking/locations

# Récupérer une position spécifique
curl http://localhost:3333/api/tracking/locations/driver-abc123
```

### App Mobile

**Problèmes courants** :

1. **"Permission denied"**
   - Allez dans les paramètres de l'appareil
   - Autorisez la localisation pour Expo Go

2. **"Network error"**
   - Vérifiez que le backend tourne sur le port 3333
   - Pour émulateur Android, l'URL est `http://10.0.2.2:3333`
   - Pour appareil physique, utilisez l'IP locale de votre PC

3. **Position ne change pas**
   - Sur émulateur : simulez manuellement la position
   - Sur appareil réel : déplacez-vous physiquement

### Frontend

**Ouvrir la console développeur** (F12) :

```javascript
// Vérifier la connexion WebSocket
// Vous devriez voir :
✅ WebSocket connection established
✅ Received message: {type: 'location_update', data: {...}}
```

**Problèmes courants** :

1. **"Google Maps not loaded"**
   - Vérifiez que la clé API Google Maps est configurée
   - Regardez dans `.env` du frontend

2. **"WebSocket connection failed"**
   - Vérifiez que le backend WebSocket est actif
   - URL WebSocket : `ws://localhost:3333/ws/notifications`

3. **Aucun chauffeur n'apparaît**
   - Vérifiez que l'app mobile envoie bien les données
   - Testez manuellement avec curl
   - Vérifiez la console réseau (F12 → Network)

---

## 📊 Données de Test

### Coordonnées GPS des Villes Camerounaises

```javascript
// Yaoundé
{ latitude: 3.8480, longitude: 11.5021 }

// Douala
{ latitude: 4.0511, longitude: 9.7679 }

// Limbé
{ latitude: 4.0167, longitude: 9.2000 }

// Bamenda
{ latitude: 5.9597, longitude: 10.1494 }

// Garoua
{ latitude: 9.3000, longitude: 13.4000 }
```

### Script de Test Automatique

Créez un fichier `test-tracking.sh` :

```bash
#!/bin/bash

# Envoyer 10 positions avec mouvement simulé
for i in {1..10}; do
  LAT=$(echo "3.8480 + $i * 0.001" | bc)
  LNG=$(echo "11.5021 + $i * 0.001" | bc)

  curl -X POST http://localhost:3333/api/tracking/update-location \
    -H "Content-Type: application/json" \
    -d "{\"deviceId\":\"test-driver\",\"latitude\":$LAT,\"longitude\":$LNG,\"speed\":$(($i * 5))}"

  echo "Position $i envoyée"
  sleep 5
done
```

---

## ✅ Résultat Attendu

Après avoir suivi tous les tests, vous devriez avoir :

1. ✅ L'app mobile qui envoie sa position toutes les 5 secondes
2. ✅ Le backend qui reçoit et stocke les positions
3. ✅ Le WebSocket qui diffuse les mises à jour
4. ✅ Le dashboard transporteur qui affiche :
   - Une carte avec tous les chauffeurs
   - Des markers qui se mettent à jour en temps réel
   - Une liste interactive des chauffeurs
   - Des stats (nombre actif, connexion, dernière MAJ)
   - Des détails sur chaque chauffeur sélectionné

---

## 🔄 Nettoyage

### Nettoyer les anciennes positions (>5 minutes)

```bash
curl -X DELETE http://localhost:3333/api/tracking/cleanup
```

### Redémarrer tout

```bash
# Arrêter tous les services (Ctrl+C dans chaque terminal)

# Redémarrer dans l'ordre :
# Terminal 1 : Backend
cd services/tsa-monolith && npm run dev

# Terminal 2 : Frontend
cd apps/frontend-web && yarn dev

# Terminal 3 : Mobile
cd apps/driver-app && npx expo start
```

---

## 🎯 Prochaines Étapes (Hors Scope de ce Test)

Pour passer en production, il faudrait :

- [ ] Ajouter l'authentification pour les chauffeurs
- [ ] Lier les chauffeurs aux transporteurs (affiliation)
- [ ] Stocker l'historique des positions en base de données
- [ ] Ajouter des filtres (par transporteur, par mission, etc.)
- [ ] Implémenter le geofencing (arrivée automatique)
- [ ] Notifications push quand un chauffeur arrive
- [ ] Mode hors-ligne pour l'app mobile

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans chaque terminal
2. Ouvrez la console développeur (F12) pour le frontend
3. Testez chaque composant séparément (backend API → mobile → frontend)

**Bon test ! 🚀**
