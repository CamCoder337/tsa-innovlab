# 🚚 Workflow de Tracking de Missions - Documentation Complète

## 📋 Vue d'ensemble

Ce document décrit le système complet de tracking de missions implémenté pour la plateforme TSA Logistics. Le workflow permet aux chauffeurs de suivre leurs missions en temps réel et aux affréteurs de monitorer la progression des livraisons de manière sécurisée.

## 🔄 Flux du Workflow

```
DRAFT → PUBLISHED → ASSIGNED → READY_TO_START → IN_PROGRESS → DELIVERED → PAID → COMPLETED
                                                      ↓
                                                  CANCELLED
```

### Détails des statuts

| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| **DRAFT** | Mission créée, non publiée | Modifier, Publier, Supprimer |
| **PUBLISHED** | Mission visible aux transporteurs | Assigner, Dépublier |
| **ASSIGNED** | Transporteur assigné, en attente de démarrage | Générer tracking token/PIN, Initialiser QR code |
| **READY_TO_START** | Mission prête à démarrer (credentials générés) | Démarrer la mission (première position GPS) |
| **IN_PROGRESS** | Mission en cours (tracking actif) | Envoyer positions GPS, Signaler problèmes |
| **DELIVERED** | Livraison confirmée via QR code | Marquer comme payé |
| **PAID** | Transporteur payé | Clôturer définitivement |
| **COMPLETED** | Mission terminée et archivée | Consulter historique |
| **CANCELLED** | Mission annulée | - |

## 🗄️ Modèles de Données

### Mission (modifié)

Nouveaux champs ajoutés :

```typescript
- trackingLinkToken: string | null      // Token unique pour l'authentification chauffeur
- trackingPin: string | null             // PIN à 6 chiffres
- qrCodeToken: string | null             // Token unique pour validation QR code
- startedAt: DateTime | null             // Date/heure de démarrage réel
- deliveredAt: DateTime | null           // Date/heure de livraison
- paidAt: DateTime | null                // Date/heure de paiement
```

### LocationUpdate (nouveau)

Stocke toutes les positions GPS envoyées par les chauffeurs :

```typescript
{
  id: string
  missionId: string                      // Référence à la mission
  driverId: string | null                // Référence au chauffeur
  latitude: number                       // Latitude GPS
  longitude: number                      // Longitude GPS
  speed: number | null                   // Vitesse en m/s
  heading: number | null                 // Direction (0-360°)
  accuracy: number | null                // Précision en mètres
  timestamp: DateTime                    // Horodatage
}
```

### MissionIssue (nouveau)

Gère les problèmes signalés pendant les missions :

```typescript
{
  id: string
  missionId: string
  reportedById: string                   // Qui a signalé
  type: IssueType                        // breakdown, delay, accident, traffic, other
  description: string
  photos: string[] | null                // URLs des photos
  latitude: number | null                // Position du problème
  longitude: number | null
  status: IssueStatus                    // reported, acknowledged, resolved
  createdAt: DateTime
  resolvedAt: DateTime | null
}
```

## 🔑 Système d'Authentification Chauffeur

### Génération automatique des credentials

Lorsqu'une mission passe au statut `ASSIGNED` ou `READY_TO_START` :

1. **Tracking Token** : Token unique de 64 caractères hexadécimaux
2. **Tracking PIN** : Code à 6 chiffres (ex: 123456)
3. **QR Code Token** : Token unique pour validation de livraison

### Authentification

**Endpoint** : `POST /track/:token/authenticate`

```json
{
  "pin": "123456"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "mission": {
      "id": "uuid",
      "title": "Livraison Douala - Yaoundé",
      "status": "assigned",
      "departureAddress": {...},
      "arrivalAddress": {...}
    },
    "trackingToken": "abc123..."
  }
}
```

### Sécurité

- Chauffeurs ne voient QUE les missions de LEUR transporteur
- Token + PIN requis pour toutes les opérations
- Rate limiting sur les tentatives d'authentification
- Les positions GPS sont isolées par mission

## 📡 API Endpoints

### Pour les Chauffeurs (Token + PIN Auth)

#### 1. Authentification
```
POST /track/:token/authenticate
Body: { "pin": "123456" }
```

#### 2. Envoyer position GPS
```
POST /track/:token/location
Headers: X-Tracking-Token, X-Tracking-Pin
Body: {
  "latitude": 4.0511,
  "longitude": 9.7679,
  "speed": 15.5,
  "heading": 90.0,
  "accuracy": 10.0
}
```

**Note** : La première position envoyée fait automatiquement passer la mission à `IN_PROGRESS`

#### 3. Récupérer positions
```
GET /track/:token/locations?limit=50
Headers: X-Tracking-Token, X-Tracking-Pin
```

#### 4. Signaler un problème
```
POST /track/:token/report-issue
Headers: X-Tracking-Token, X-Tracking-Pin
Body: {
  "type": "breakdown",  // breakdown, delay, accident, traffic, other
  "description": "Panne moteur sur autoroute",
  "latitude": 4.0511,
  "longitude": 9.7679,
  "photos": ["url1", "url2"]
}
```

### Pour les Affréteurs (JWT Auth)

#### 1. Générer QR code de livraison
```
GET /api/affreteur/missions/:id/qr-code
Headers: Authorization: Bearer <token>
```

**Réponse** : Image QR code en base64

#### 2. Régénérer QR code
```
POST /api/affreteur/missions/:id/regenerate-qr
```

#### 3. Suivre positions GPS
```
GET /api/affreteur/missions/:id/locations?limit=50
```

#### 4. Voir problèmes signalés
```
GET /api/affreteur/missions/:id/issues
```

#### 5. Marquer problème comme reconnu
```
POST /api/affreteur/missions/:id/issues/:issueId/acknowledge
```

#### 6. Résoudre un problème
```
POST /api/affreteur/missions/:id/issues/:issueId/resolve
```

#### 7. Marquer comme payé
```
POST /api/affreteur/missions/:id/mark-as-paid
```

**Condition** : Mission doit être à l'état `DELIVERED`

#### 8. Clôturer définitivement
```
POST /api/affreteur/missions/:id/complete
```

**Condition** : Mission doit être à l'état `PAID`

### Validation de Livraison (Public - via QR code)

```
GET /delivery-proof?token=<qr_code_token>&mission_id=<uuid>&latitude=4.0&longitude=9.7
```

**Vérifications** :
1. Token QR code valide pour cette mission
2. Mission en statut `IN_PROGRESS`
3. (Optionnel) Chauffeur à moins de 200m du point de livraison

**Résultat** : Mission passe à `DELIVERED`

## 🏗️ Architecture Backend (✅ COMPLET)

### Services Implémentés

#### 1. MissionTrackingService

```typescript
- generateTrackingToken()              // Génère token 64 chars
- generateTrackingPin()                // Génère PIN 6 chiffres
- generateQrCodeToken()                // Génère token QR code
- initializeTracking(mission)          // Initialise tous les tokens
- verifyTrackingCredentials(token, pin) // Vérifie authentification
- recordLocationUpdate(...)            // Enregistre position GPS
- getRecentLocations(missionId)        // Récupère dernières positions
- isNearDestination(...)               // Vérifie proximité (200m)
- cleanupOldLocations()                // Nettoie positions > 7 jours
```

#### 2. QrCodeService

```typescript
- generateDeliveryQrCode(mission)      // Génère QR code PNG base64
- generateDeliveryQrCodeSvg(mission)   // Génère QR code SVG
- verifyQrCodeToken(missionId, token)  // Vérifie token QR
- regenerateQrCodeToken(mission)       // Régénère en cas de fuite
```

### Contrôleurs Implémentés

1. **MissionTrackingController** (`driver/mission_tracking_controller.ts`)
   - authenticate()
   - updateLocation()
   - getLocations()
   - reportIssue()
   - validateDelivery()

2. **MissionsController** (affreteur - méthodes ajoutées)
   - getDeliveryQrCode()
   - regenerateQrCode()
   - markAsPaid()
   - completeMission()
   - getLocationUpdates()
   - getIssues()
   - acknowledgeIssue()
   - resolveIssue()

### Middleware

- **TrackingAuthMiddleware** : Vérifie token + PIN pour chauffeurs

### Migrations Exécutées

1. `add_tracking_fields_to_missions` : Ajoute champs tracking + nouveaux statuts
2. `create_location_updates` : Table des positions GPS
3. `create_mission_issues` : Table des problèmes signalés

## 📱 Frontend & Mobile (⏳ À IMPLÉMENTER)

### App Mobile Chauffeur (React Native)

#### Écrans à créer

1. **DriverMissionAccessScreen**
   - Input pour tracking token
   - Input pour PIN
   - Bouton "Démarrer la mission"
   - Affichage erreur si credentials invalides

2. **DriverMissionDetailsScreen**
   - Carte avec itinéraire
   - Adresse de départ et d'arrivée
   - Bouton "Envoyer ma position" (automatique)
   - Bouton "Signaler un problème"
   - Scanner QR code de livraison

3. **ReportIssueScreen**
   - Sélecteur de type de problème
   - Zone de texte description
   - Upload photos
   - Position GPS automatique

#### Services à créer

```typescript
// services/driverTrackingService.ts
class DriverTrackingService {
  authenticate(token: string, pin: string)
  startLocationTracking(token: string, pin: string)
  stopLocationTracking()
  sendLocationUpdate(lat, lng, speed, heading)
  reportIssue(type, description, photos)
  scanQRCode()  // Utilise expo-barcode-scanner
}
```

#### Intégrations nécessaires

- `expo-location` : Tracking GPS continu
- `expo-barcode-scanner` : Scanner QR code
- `expo-image-picker` : Upload photos problèmes
- Gestion permissions GPS

### Frontend Web - Interface Affréteur (React)

#### Composants à créer

1. **MissionTrackingDashboard**
   - Carte en temps réel (Google Maps / Mapbox)
   - Markers : position actuelle chauffeur, départ, arrivée
   - Ligne du trajet parcouru
   - Timeline des événements

2. **QRCodeGenerator**
   - Affiche QR code pour livraison
   - Bouton "Télécharger PNG"
   - Bouton "Régénérer" (sécurité)
   - Instructions pour le chauffeur

3. **IssuesList**
   - Liste des problèmes signalés
   - Badges de statut (reported, acknowledged, resolved)
   - Actions : Reconnaître, Résoudre
   - Affichage photos

4. **MissionStatusTimeline**
   - ASSIGNED → Credentials générés
   - READY_TO_START → Chauffeur authentifié
   - IN_PROGRESS → Première position reçue
   - DELIVERED → QR code scanné
   - PAID → Paiement effectué
   - COMPLETED → Mission archivée

5. **PaymentConfirmationDialog**
   - Résumé de la mission
   - Montant à payer
   - Bouton "Confirmer le paiement"
   - Passage à statut PAID

#### Services à créer

```typescript
// services/affreteurTrackingService.ts
class AffreteurTrackingService {
  generateQRCode(missionId: string)
  regenerateQRCode(missionId: string)
  getLiveLocations(missionId: string)  // Polling ou WebSocket
  getIssues(missionId: string)
  acknowledgeIssue(missionId: string, issueId: string)
  resolveIssue(missionId: string, issueId: string)
  markAsPaid(missionId: string)
  completeMission(missionId: string)
}
```

### Frontend Web - Interface Transporteur (React)

#### Composants à créer

1. **TransporterDriversMap**
   - Carte avec tous les chauffeurs actifs du transporteur
   - Markers cliquables avec infos chauffeur
   - Filtres par statut de mission
   - Vue liste / vue carte

2. **DriverCredentialsDisplay**
   - Affichage Token + PIN pour chauffeur
   - QR code avec credentials (optionnel)
   - Bouton "Copier les credentials"
   - Instructions d'utilisation

3. **MyDriversMissions**
   - Liste des missions de mes chauffeurs
   - Suivi en temps réel
   - Alertes en cas de problème
   - Accès au tracking live

## 🔒 Sécurité & Isolation

### Règles de sécurité implémentées

1. **Isolation chauffeur**
   - Chauffeur ne voit QUE les missions de SON transporteur
   - Vérification `transporteurId` dans toutes les requêtes

2. **Isolation affréteur**
   - Affréteur ne voit QUE ses propres missions
   - Vérification `affreteurId` dans toutes les requêtes

3. **Isolation transporteur**
   - Transporteur ne voit QUE ses chauffeurs et leurs positions
   - Vérification des relations mission-transporteur

4. **Rate Limiting**
   - 10 tentatives d'authentification / 15 min
   - 100 positions GPS / heure / chauffeur

5. **Expiration des tokens**
   - QR code peut être régénéré en cas de fuite
   - Tokens archivés après clôture de mission

## 🧪 Tests à effectuer

### Tests Backend (API)

```bash
# 1. Créer une mission et l'assigner
POST /api/admin/missions (status: draft)
POST /api/admin/missions/:id/assign (transporteurId)

# 2. Vérifier génération credentials
GET /api/affreteur/missions/:id
# → Doit contenir trackingLinkToken, trackingPin, qrCodeToken

# 3. Authentification chauffeur
POST /track/:token/authenticate { "pin": "123456" }
# → Doit retourner mission details

# 4. Envoyer position GPS
POST /track/:token/location
Headers: X-Tracking-Token, X-Tracking-Pin
Body: { "latitude": 4.05, "longitude": 9.77 }
# → Mission passe à IN_PROGRESS

# 5. Signaler problème
POST /track/:token/report-issue
Body: { "type": "delay", "description": "Embouteillage" }

# 6. Affréteur voit le problème
GET /api/affreteur/missions/:id/issues
# → Doit retourner le problème signalé

# 7. Générer QR code
GET /api/affreteur/missions/:id/qr-code
# → Retourne image base64

# 8. Scanner QR code (simuler)
GET /delivery-proof?token=<qr_token>&mission_id=<id>
# → Mission passe à DELIVERED

# 9. Marquer comme payé
POST /api/affreteur/missions/:id/mark-as-paid
# → Mission passe à PAID

# 10. Clôturer
POST /api/affreteur/missions/:id/complete
# → Mission passe à COMPLETED
```

### Tests Frontend

1. **Interface Chauffeur (Mobile)**
   - Saisir token + PIN invalides → Erreur
   - Saisir token + PIN valides → Accès mission
   - Envoyer position GPS → Mise à jour carte
   - Signaler problème → Confirmation
   - Scanner QR code → Confirmation livraison

2. **Interface Affréteur (Web)**
   - Voir carte tracking en temps réel
   - Générer QR code → Affichage + téléchargement
   - Voir problèmes signalés → Liste avec détails
   - Marquer comme payé → Changement statut
   - Clôturer mission → Archivage

3. **Interface Transporteur (Web)**
   - Voir liste de mes chauffeurs actifs
   - Accéder au tracking d'un chauffeur
   - Copier credentials pour nouveau chauffeur
   - Voir historique des missions

## 📊 Performances & Optimisation

### Nettoyage automatique

```bash
# Commande Ace à créer pour nettoyage régulier
node ace tracking:cleanup

# Nettoie :
# - Positions GPS > 7 jours (sauf missions actives)
# - Missions COMPLETED > 30 jours (archivage)
```

### Indexation base de données

Indexes créés :
- `missions(tracking_link_token)` : Recherche rapide par token
- `missions(qr_code_token)` : Validation QR code rapide
- `location_updates(mission_id, timestamp)` : Récupération positions ordonnées
- `mission_issues(mission_id, status)` : Filtrage problèmes

### Recommandations futures

1. **WebSocket** : Remplacer polling par WebSocket pour tracking temps réel
2. **Redis Cache** : Cache les dernières positions (TTL 30s)
3. **CDN** : Héberger QR codes statiques sur CDN
4. **Compression** : Compresser historique positions (> 1000 points)

## 🚀 Déploiement

### Variables d'environnement

```bash
# .env
FRONTEND_URL=https://app.tsa-logistics.com  # Pour génération QR codes
TRACKING_RATE_LIMIT=100                      # Positions GPS / heure
TRACKING_CLEANUP_DAYS=7                      # Jours avant nettoyage
```

### Checklist de déploiement

- [ ] Migrations exécutées
- [ ] Package `qrcode` installé
- [ ] Variables d'env configurées
- [ ] Rate limiting activé
- [ ] Tests E2E passés
- [ ] Documentation API publiée
- [ ] Permissions GPS validées (mobile)
- [ ] WebSocket configuré (optionnel)

## 📚 Ressources

- **Code Backend** : `services/tsa-monolith/`
- **Modèles** : `app/models/mission.ts`, `app/models/location_update.ts`, `app/models/mission_issue.ts`
- **Services** : `app/services/mission_tracking_service.ts`, `app/services/qr_code_service.ts`
- **Contrôleurs** : `app/controllers/http/driver/`, `app/controllers/http/affreteur/`
- **Routes** : `start/routes.ts` (lignes 329-354)
- **Migrations** : `database/migrations/`

---

**État d'avancement** :
- ✅ Backend complet (12/12 tâches)
- ⏳ Frontend web (0/5 composants)
- ⏳ App mobile (0/3 écrans)

**Prochaines étapes** : Implémenter les interfaces mobile et web pour permettre aux utilisateurs d'utiliser le workflow.
