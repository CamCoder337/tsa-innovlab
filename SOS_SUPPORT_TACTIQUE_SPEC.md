# Spécification : Système SOS et Support Tactique

## Vue d'ensemble

Système d'urgence complet permettant aux transporteurs de signaler des situations critiques (accident, panne, urgence médicale, problème de sécurité) avec notification temps réel aux admins et affréteurs.

---

## Architecture Implémentée

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WORKFLOW SOS COMPLET                                 │
└─────────────────────────────────────────────────────────────────────────────┘

   DRIVER APP                    MONOLITH                      FRONTEND WEB
   ──────────                    ────────                      ────────────
       │                            │                              │
   ┌───┴───┐                        │                              │
   │  SOS  │ ──POST /track/:token/sos──►                           │
   │Button │                        │                              │
   └───┬───┘                        ▼                              │
       │                   ┌────────────────┐                      │
       │                   │ Créer Issue    │                      │
       │                   │ isEmergency=T  │                      │
       │                   │ priority=auto  │                      │
       │                   └───────┬────────┘                      │
       │                           │                               │
       │                           ▼                               │
       │                   ┌────────────────┐                      │
       │                   │ Créer Conv.    │                      │
       │                   │ Urgence        │                      │
       │                   └───────┬────────┘                      │
       │                           │                               │
       │                           ▼                               │
       │                   ┌────────────────┐      WebSocket       │
       │                   │ Emit Event     │ ─────────────────►   │
       │                   │ sos:alert      │                      │
       │                   └───────┬────────┘                      │
       │                           │                               ▼
       │                           │                      ┌────────────────┐
       │◄──────────────────────────┘                      │ Badge Rouge    │
       │   Response avec                                  │ + Son Alerte   │
       │   conversationId                                 │ + Toast        │
       │                                                  └────────────────┘
       │                                                           │
       ▼                                                           ▼
┌──────────────┐                                         ┌────────────────┐
│ Chat Urgence │                                         │ Page Urgences  │
│ + Contacts   │                                         │ /admin/        │
│   Secours    │                                         │ emergencies    │
└──────────────┘                                         └────────────────┘
```

---

## Composants Implémentés

### 1. Backend Monolith (AdonisJS)

#### 1.1 Endpoint SOS
```
POST /api/track/:token/sos
```

**Headers requis:**
```
X-Tracking-Token: <token>
X-Tracking-Pin: <pin>
```

**Payload:**
```typescript
{
  type: 'breakdown' | 'accident' | 'medical' | 'security',
  latitude: number,    // Requis
  longitude: number,   // Requis
  description?: string // Optionnel
}
```

**Réponse:**
```typescript
{
  success: true,
  message: "SOS received. Help is on the way.",
  data: {
    issue: {
      id: string,
      type: string,
      priority: 1 | 2 | 3,
      status: "reported",
      location: { lat: number, lng: number },
      createdAt: string
    },
    conversationId: number | null,
    emergencyContacts: {
      police: "117",
      samu: "119",
      pompiers: "118"
    }
  }
}
```

**Fichier:** `services/tsa-monolith/app/controllers/http/driver/mission_tracking_controller.ts`

#### 1.2 Routes Admin Urgences
```
GET    /api/admin/emergencies           - Liste des urgences
GET    /api/admin/emergencies/stats     - Statistiques
GET    /api/admin/emergencies/:id       - Détails
POST   /api/admin/emergencies/:id/acknowledge   - Prendre en charge
POST   /api/admin/emergencies/:id/in-progress   - Marquer en cours
POST   /api/admin/emergencies/:id/resolve       - Résoudre
```

**Fichier:** `services/tsa-monolith/app/controllers/http/admin/emergencies_controller.ts`

#### 1.3 Événements WebSocket
```typescript
enum WebSocketEventType {
  SOS_ALERT = 'sos:alert',
  SOS_ACKNOWLEDGED = 'sos:acknowledged',
  SOS_RESOLVED = 'sos:resolved'
}
```

**Fichier:** `services/tsa-monolith/app/services/websocket_service.ts`

#### 1.4 Event Listeners
**Fichier:** `services/tsa-monolith/app/listeners/sos_listener.ts`

- `onSosAlert` - Broadcast aux admins + notification affréteur
- `onSosAcknowledged` - Notification transporteur + affréteur
- `onSosResolved` - Notification toutes les parties

#### 1.5 Types d'événements
**Fichier:** `services/tsa-monolith/types/events.d.ts`

```typescript
interface EventsList {
  'mission:sos_alert': { issue: MissionIssue, mission: Mission }
  'mission:sos_acknowledged': { issue: MissionIssue, mission: Mission, handledBy: User }
  'mission:sos_resolved': { issue: MissionIssue, mission: Mission, resolvedBy: User }
}
```

---

### 2. Driver App (React Native)

#### 2.1 Composant SOSButton
**Fichier:** `apps/driver-app/src/components/SOSButton.tsx`

**Fonctionnalités:**
- Bouton rouge flottant avec animation pulsante
- Modal de sélection du type d'urgence
- 4 types: Accident (💥), Médical (🏥), Sécurité (🚨), Panne (⚙️)
- Indicateur de priorité (CRITIQUE / HAUTE)
- Champ description optionnel
- Boutons d'appel direct aux secours (117, 119, 118)
- Vibration de confirmation
- Gestion des erreurs avec fallback contacts d'urgence

#### 2.2 Service SOS
**Fichier:** `apps/driver-app/src/services/driverTrackingService.ts`

```typescript
async reportSOS(
  type: 'breakdown' | 'accident' | 'medical' | 'security',
  description?: string
): Promise<{
  issueId: string;
  conversationId: number | null;
  emergencyContacts: Record<string, string>;
}>
```

---

### 3. Frontend Web (React)

#### 3.1 Page Admin Urgences
**Fichier:** `apps/frontend-web/src/pages/admin/EmergenciesManagement.tsx`

**Fonctionnalités:**
- Dashboard avec statistiques temps réel
- Cartes: Actives, Critiques, Haute priorité, Résolues aujourd'hui, Temps réponse moyen
- Table des urgences avec filtres (Actives / Toutes)
- Actions: Localisation GPS, Chat, Prendre en charge, En cours, Résoudre
- Auto-refresh toutes les 30 secondes
- Dialog de résolution avec notes

#### 3.2 Badge Urgence Sidebar
**Fichier:** `apps/frontend-web/src/components/admin/EmergencyBadge.tsx`

**Fonctionnalités:**
- Badge rouge avec compteur
- Animation pulsante si urgences critiques
- Son d'alerte (Web Audio API)
- Écoute WebSocket pour mises à jour temps réel

#### 3.3 Service Urgences
**Fichier:** `apps/frontend-web/src/services/emergency.service.ts`

#### 3.4 Hook WebSocket
**Fichier:** `apps/frontend-web/src/hooks/useWebSocket.ts`

---

## Modèle de Données

### MissionIssue (Étendu)
```typescript
{
  id: string
  missionId: string
  reportedById: string
  type: 'breakdown' | 'delay' | 'accident' | 'traffic' | 'medical' | 'security' | 'other'
  description: string
  photos: string[] | null
  latitude: number | null
  longitude: number | null
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved'
  
  // Champs SOS
  isEmergency: boolean
  emergencyConversationId: number | null
  priority: 1 | 2 | 3  // 1=CRITIQUE, 2=HAUTE, 3=NORMALE
  firstResponseAt: DateTime | null
  handledById: string | null
  
  createdAt: DateTime
  updatedAt: DateTime
  resolvedAt: DateTime | null
}
```

### Priorité Automatique
```typescript
const priorityMap = {
  accident: 1,   // CRITIQUE
  medical: 1,    // CRITIQUE
  security: 1,   // CRITIQUE
  breakdown: 2,  // HAUTE
}
```

---

## Workflow Utilisateur

### Transporteur (Driver App)
1. Appuie sur le bouton SOS rouge
2. Sélectionne le type d'urgence
3. (Optionnel) Ajoute une description
4. Confirme l'envoi
5. Reçoit confirmation + contacts d'urgence
6. Peut appeler directement les secours

### Admin (Dashboard Web)
1. Reçoit notification (badge rouge + son)
2. Voit la liste des urgences actives
3. Clique sur "Prendre en charge"
4. Peut voir la localisation GPS
5. Peut ouvrir le chat avec le transporteur
6. Marque "En cours" puis "Résolu"

### Affréteur
1. Reçoit notification WebSocket
2. Voit l'alerte sur sa mission
3. Peut contacter le transporteur via chat

---

## Contacts d'Urgence (Cameroun)
- Police: 117
- SAMU: 119
- Pompiers: 118

---

## Fichiers Créés/Modifiés

### Backend Monolith
```
services/tsa-monolith/
├── app/
│   ├── controllers/http/
│   │   ├── admin/emergencies_controller.ts     [CRÉÉ]
│   │   └── driver/mission_tracking_controller.ts [MODIFIÉ]
│   ├── listeners/
│   │   └── sos_listener.ts                     [CRÉÉ]
│   └── models/
│       └── mission_issue.ts                    [EXISTANT]
├── start/
│   ├── routes.ts                               [MODIFIÉ]
│   └── events.ts                               [MODIFIÉ]
├── types/
│   └── events.d.ts                             [MODIFIÉ]
└── database/migrations/
    └── 1764200000000_add_emergency_to_mission_issues.ts [EXISTANT]
```

### Frontend Web
```
apps/frontend-web/src/
├── App.tsx                                     [MODIFIÉ - Route ajoutée]
├── pages/admin/
│   └── EmergenciesManagement.tsx               [CRÉÉ]
├── components/
│   ├── admin/
│   │   └── EmergencyBadge.tsx                  [CRÉÉ]
│   └── layout/
│       └── Sidebar.tsx                         [MODIFIÉ - Lien + Badge]
├── services/
│   └── emergency.service.ts                    [CRÉÉ]
└── hooks/
    ├── useWebSocket.ts                         [CRÉÉ]
    └── useEmergencyStats.ts                    [CRÉÉ]
```

### Driver App
```
apps/driver-app/src/
├── components/
│   └── SOSButton.tsx                           [MODIFIÉ]
└── services/
    └── driverTrackingService.ts                [MODIFIÉ]
```

---

## Intégration Complète ✅

### Route React
- Route `/app/emergencies` ajoutée dans `App.tsx`
- Lazy loading avec `EmergenciesManagement`

### Sidebar Admin
- Lien "Urgences SOS" avec icône AlertTriangle (rouge)
- Badge dynamique affichant le nombre d'urgences actives
- Animation pulse si urgences critiques
- Hook `useEmergencyStats` pour les stats temps réel

---

## Tests Implémentés ✅

### Backend (Japa)
**Fichier:** `services/tsa-monolith/tests/functional/sos.spec.ts`

| Test | Description |
|------|-------------|
| `should create SOS alert with valid data` | Création d'une alerte SOS valide |
| `should set CRITICAL priority for accident/medical/security` | Priorité automatique |
| `should set HIGH priority for breakdown` | Priorité panne |
| `should reject SOS without GPS coordinates` | Validation GPS requis |
| `should reject SOS with invalid type` | Validation type |
| `should reject SOS without authentication` | Sécurité auth |
| `should create emergency conversation` | Création conversation |
| `should list emergencies` | Liste admin |
| `should filter active emergencies` | Filtrage |
| `should get emergency stats` | Statistiques |
| `should acknowledge emergency` | Prise en charge |
| `should resolve emergency` | Résolution |
| `should reject non-admin access` | Sécurité rôle |

**Fichier:** `services/tsa-monolith/tests/unit/listeners/sos_listener.spec.ts`
- Tests unitaires pour les priorités, types, statuts
- Tests des structures de données WebSocket

### Frontend E2E (Playwright)
**Fichier:** `apps/frontend-web/e2e/emergencies.spec.ts`

| Test | Description |
|------|-------------|
| `Accès à la page des urgences` | Navigation sidebar |
| `Affichage des statistiques` | Cartes stats |
| `Filtrage actives vs toutes` | Boutons filtre |
| `Table des urgences` | Structure table |
| `Badge d'urgence sidebar` | Badge dynamique |
| `Prendre en charge une urgence` | Action acknowledge |
| `Résoudre une urgence` | Action resolve |
| `Accès non autorisé` | Sécurité rôle |

### Commandes pour lancer les tests

```bash
# Backend - Tests fonctionnels SOS
cd services/tsa-monolith
node ace test --files="tests/functional/sos.spec.ts"

# Backend - Tests unitaires SOS
node ace test --files="tests/unit/listeners/sos_listener.spec.ts"

# Frontend - Tests E2E urgences
cd apps/frontend-web
npx playwright test emergencies.spec.ts
```

---

## Prochaines Étapes (Optionnel)

1. **Push Notifications** - Intégrer FCM pour notifications même hors app
2. **Escalade Automatique** - Notifier tous les admins si pas de réponse en 5 min
3. **Traductions i18n** - Ajouter les clés de traduction pour "Urgences SOS"

---

## Estimation Temps Réalisé

| Composant | Temps |
|-----------|-------|
| Backend (Endpoint + Listener + Routes) | 1h30 |
| Frontend (Page + Badge + Service) | 2h |
| Driver App (SOSButton + Service) | 1h |
| Documentation | 30 min |
| **TOTAL** | **5h** |
