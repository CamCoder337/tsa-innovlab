# 🚀 Guide du Système Real-Time TSA Logistics

## ✅ Implémentation Complète et TESTÉE

Le système de communication temps réel est maintenant **entièrement opérationnel et testé** avec :

- **Transmit + Redis** pour le real-time SSE
- **SDK Client officiel** `@adonisjs/transmit-client`
- **Notifications** automatiques (DB + Email + Broadcast)
- **Chat** temps réel entre utilisateurs
- **Tracking** de missions en direct

---

## 📊 Architecture

```
┌─────────────────────────────┐
│   Frontend (React/HTML)     │
│   @adonisjs/transmit-client │
└────────┬────────────────────┘
         │ 1. Connect SSE
         │ 2. Subscribe to channel
         │ 3. Listen messages
         ↓
┌─────────────────────────────────┐
│  Transmit Routes (AdonisJS)     │
│  /__transmit/events (SSE)       │
│  /__transmit/subscriptions      │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  TransmitService                │
│  - broadcastNotification()      │
│  - broadcastNewMission()        │
│  - broadcastMissionUpdate()     │
│  - broadcastChatMessage()       │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Redis Pub/Sub (Transport)      │
│  - Channel subscriptions        │
│  - Message broadcasting         │
└─────────────────────────────────┘
```

## ⚠️ IMPORTANT : Utiliser le SDK Client

**NE PAS utiliser EventSource brut !** Transmit nécessite le SDK officiel qui gère :

- ✅ Connexion SSE
- ✅ Souscription aux canaux (requête POST séparée)
- ✅ Gestion des reconnexions
- ✅ Parsing des messages

---

## 🔧 Configuration

### 1. Variables d'environnement

```bash
# Redis (requis pour Transmit)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 2. Démarrer les services

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: AdonisJS
cd services/tsa-monolith
npm run dev

# Terminal 3: Frontend (optionnel)
cd apps/frontend-web
yarn dev
```

---

## 🔥 Implémentation Frontend

### Option 1: React/TypeScript (RECOMMANDÉ)

#### Installation

```bash
npm install @adonisjs/transmit-client
# ou
yarn add @adonisjs/transmit-client
```

#### Hook personnalisé React

```typescript
// hooks/useTransmit.ts
import { useEffect, useState, useCallback } from 'react'
import { Transmit } from '@adonisjs/transmit-client'

interface UseTransmitOptions {
  channel: string
  token: string
  userId: string
  onMessage: (data: any) => void
}

export function useTransmit({ channel, token, userId, onMessage }: UseTransmitOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let transmit: Transmit | null = null
    let subscription: any = null

    const connect = async () => {
      try {
        // Créer l'instance Transmit
        transmit = new Transmit({
          baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3333',
          uidGenerator: () => `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          onAuthorize: async (request) => {
            // Ajouter le token à chaque requête
            request.url +=
              (request.url.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`
            return request
          },
        })

        // Créer la souscription
        subscription = transmit.subscription(channel)
        await subscription.create()

        // Écouter les messages
        subscription.onMessage(onMessage)

        setIsConnected(true)
        console.log(`✅ Connecté au canal: ${channel}`)
      } catch (err: any) {
        console.error('❌ Erreur connexion Transmit:', err)
        setError(err.message)
        setIsConnected(false)
      }
    }

    connect()

    // Cleanup
    return () => {
      if (subscription) {
        subscription.delete().catch(console.error)
      }
      transmit = null
      setIsConnected(false)
    }
  }, [channel, token, userId, onMessage])

  return { isConnected, error }
}
```

#### Utilisation dans un composant

```typescript
// components/NotificationListener.tsx
import { useTransmit } from '../hooks/useTransmit'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

export function NotificationListener() {
  const { user, token } = useAuth()

  const handleMessage = useCallback((data: any) => {
    console.log('📨 Notification reçue:', data)

    // Afficher une notification toast
    if (data.type === 'notification:new') {
      toast.success(data.data.message)
    } else if (data.type === 'mission:new') {
      toast.info(`Nouvelle mission: ${data.data.titre}`)
    } else if (data.type === 'chat:message') {
      // Mettre à jour le state du chat
      // ...
    }
  }, [])

  const { isConnected, error } = useTransmit({
    channel: `notifications:user:${user.id}`,
    token,
    userId: user.id,
    onMessage: handleMessage
  })

  return (
    <div className="fixed bottom-4 right-4">
      {isConnected ? (
        <span className="text-green-500">🟢 Connecté</span>
      ) : error ? (
        <span className="text-red-500">🔴 {error}</span>
      ) : (
        <span className="text-yellow-500">🟡 Connexion...</span>
      )}
    </div>
  )
}
```

#### Exemple : Chat temps réel

```typescript
// components/Chat.tsx
import { useState, useEffect } from 'react'
import { useTransmit } from '../hooks/useTransmit'

export function Chat({ conversationId, token, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'chat:message') {
      setMessages(prev => [...prev, data.data])
    }
  }, [])

  useTransmit({
    channel: `chat:conversation:${conversationId}`,
    token,
    userId,
    onMessage: handleMessage
  })

  const sendMessage = async (content: string) => {
    // Envoyer via API REST classique
    await fetch(`/api/common/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content, type: 'text' })
    })
    // Le message sera reçu via Transmit automatiquement
  }

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

#### Exemple : Notifications transporteur (nouvelles missions)

```typescript
// components/TransporteurDashboard.tsx
export function TransporteurDashboard() {
  const { user, token } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])

  const handleMissionNotification = useCallback((data: any) => {
    if (data.type === 'mission:new') {
      // Ajouter la nouvelle mission à la liste
      setMissions(prev => [data.data, ...prev])

      // Notification sonore
      new Audio('/notification.mp3').play()

      // Toast
      toast.success(`Nouvelle mission: ${data.data.titre}`)
    }
  }, [])

  useTransmit({
    channel: 'missions:new:transporteurs',
    token,
    userId: user.id,
    onMessage: handleMissionNotification
  })

  return <div>{/* Liste des missions */}</div>
}
```

---

## 🧪 Tests

### Option 1: Page de test HTML

1. **Ouvrir** : http://localhost:3333/test-transmit-sse.html

2. **Se connecter** (obtenir un token) :

   ```bash
   POST http://localhost:3333/api/auth/login
   {
     "email": "user@example.com",
     "password": "password"
   }
   ```

3. **Copier le token JWT** dans le champ "Token JWT" de la page

4. **Choisir un canal** :
   - `global` : Canal de test public
   - `missions:new:transporteurs` : Nouvelles missions
   - `notifications:user:{userId}` : Notifications personnelles
   - `chat:conversation:{id}` : Chat conversation

5. **Cliquer sur "Se connecter"**
   - Le système génère automatiquement un `uid` unique
   - Le token est passé dans l'URL : `?channel=X&uid=Y&token=Z`
   - EventSource se connecte et vous recevez "✅ Connecté"

6. **Tester les broadcasts** avec les boutons de test

### Option 2: Postman/Curl

#### A. Connexion SSE (EventSource)

**Important** : EventSource ne supporte pas les headers `Authorization` personnalisés. Le token JWT doit être passé en query string.

```bash
# Connexion anonyme au canal global (public)
curl -N \
  -H "Accept: text/event-stream" \
  "http://localhost:3333/__transmit/events?channel=global&uid=curl-test-123"

# Connexion authentifiée avec token
curl -N \
  -H "Accept: text/event-stream" \
  "http://localhost:3333/__transmit/events?channel=notifications:user:1&uid=curl-auth-456&token=YOUR_JWT_TOKEN_HERE"
```

**Paramètres requis** :

- `channel` : Canal à écouter (requis)
- `uid` : Identifiant unique de la connexion (requis)
- `token` : Token JWT pour authentification (optionnel pour canaux publics)

#### B. Test broadcast manuel

```bash
POST http://localhost:3333/transmit/broadcast
Content-Type: application/json

{
  "channel": "global",
  "message": {
    "test": true,
    "content": "Message de test",
    "timestamp": "2025-01-28T10:00:00Z"
  }
}
```

#### C. Test nouvelle mission

```bash
POST http://localhost:3333/transmit/test-mission
```

---

## 📡 Canaux Transmit Disponibles

### Canaux Publics

- `global` : Canal de test, accessible à tous

### Canaux par Rôle

- `missions:new:transporteurs` : Nouvelles missions pour tous les transporteurs

### Canaux Utilisateur

- `notifications:user:{userId}` : Notifications personnelles d'un utilisateur

### Canaux Mission

- `mission:{missionId}:tracking` : Tracking temps réel d'une mission
- `mission:{missionId}:chat` : Chat lié à une mission

### Canaux Chat

- `chat:conversation:{conversationId}` : Messages dans une conversation

---

## 🔔 Système de Notifications

### Triggers Automatiques

#### 1. Nouvelle Mission Publiée

**Quand** : Affreteur publie une mission (`POST /api/affreteur/missions/:id/publish`)

**Qui est notifié** : Tous les transporteurs actifs

**Canaux utilisés** :

- `missions:new:transporteurs` (broadcast global)
- `notifications:user:{transporteurId}` (notification individuelle)

**Actions** :

- ✅ Notification créée en DB
- ✅ Email envoyé à chaque transporteur
- ✅ Broadcast temps réel SSE

**Test** :

```bash
# 1. Créer une mission en DRAFT
POST /api/affreteur/missions
Authorization: Bearer {token_affreteur}
{
  "titre": "Mission test",
  "adresseDepartId": 1,
  "adresseArriveeId": 2,
  "budgetMin": 10000,
  "budgetMax": 50000
}

# 2. Publier la mission
POST /api/affreteur/missions/{id}/publish
Authorization: Bearer {token_affreteur}

# Résultat attendu:
# - Notification DB créée pour chaque transporteur
# - Email envoyé à chaque transporteur
# - Broadcast SSE sur "missions:new:transporteurs"
```

#### 2. Mission Assignée à un Transporteur

**Quand** : Admin/Affreteur assigne une mission

**Qui est notifié** : Le transporteur assigné

**Canaux utilisés** :

- `notifications:user:{transporteurId}`

**Actions** :

- ✅ Notification en DB
- ✅ Email de confirmation
- ✅ Broadcast temps réel

#### 3. Changement de Statut Mission

**Quand** : Transporteur met à jour le statut (`PUT /api/transporteur/missions/:id/status`)

**Qui est notifié** : L'affreteur propriétaire de la mission

**Canaux utilisés** :

- `notifications:user:{affreteurId}`
- `mission:{missionId}:tracking`

**Actions** :

- ✅ Notification en DB
- ✅ Email à l'affreteur
- ✅ Broadcast sur canal de tracking

**Test** :

```bash
PUT /api/transporteur/missions/{id}/status
Authorization: Bearer {token_transporteur}
{
  "status": "completed",
  "commentaire": "Livraison effectuée avec succès"
}

# Résultat attendu:
# - Affreteur reçoit notification DB
# - Affreteur reçoit email
# - Broadcast sur mission:{id}:tracking
```

---

## 💬 Système de Chat

### Créer une Conversation

#### A. Conversation Directe (User ↔ User)

```bash
POST /api/common/conversations/direct
Authorization: Bearer {token}
{
  "userId": 123  # ID de l'autre utilisateur
}
```

#### B. Conversation Mission (liée à une mission)

```bash
POST /api/common/conversations/mission
Authorization: Bearer {token}
{
  "missionId": 456,
  "userId": 123
}
```

### Envoyer un Message

```bash
POST /api/common/conversations/{conversationId}/messages
Authorization: Bearer {token}
{
  "content": "Bonjour, j'ai une question sur la mission",
  "type": "text"
}
```

**Résultat** :

- ✅ Message sauvegardé en DB
- ✅ Broadcast sur `chat:conversation:{conversationId}`
- ✅ Tous les participants reçoivent le message en temps réel

### Récupérer les Messages

```bash
GET /api/common/conversations/{conversationId}/messages?page=1&limit=50
Authorization: Bearer {token}
```

### Marquer comme Lu

```bash
# Un message
PUT /api/common/messages/{messageId}/read
Authorization: Bearer {token}

# Tous les messages d'une conversation
PUT /api/common/conversations/{conversationId}/messages/read-all
Authorization: Bearer {token}
```

---

## 🔑 UID : Gestion des Connexions Multiples

### Pourquoi générer un UID unique ?

**Question** : Pourquoi ne pas utiliser simplement `user.id` comme uid ?

**Réponse** : Un même utilisateur peut avoir **plusieurs connexions simultanées** :

- 📱 Application mobile
- 💻 Application desktop
- 🌐 Plusieurs onglets navigateur
- 🖥️ Plusieurs sessions (travail + personnel)

Si vous utilisez `user.id` directement, **Transmit fermera les anciennes connexions** quand une nouvelle se connecte avec le même uid.

### ✅ Solution Recommandée

```typescript
// Format : userId-timestamp-random
uidGenerator: () => `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Exemples générés :
// "123-1709234567890-a5b7c9d"
// "123-1709234568123-x2y9k4m"
```

**Avantages** :

- ✅ Chaque connexion a un ID unique
- ✅ Un utilisateur peut avoir plusieurs connexions actives
- ✅ On peut identifier l'utilisateur (préfixe avec user.id)
- ✅ Risque de collision = 0

### ⚠️ Anti-pattern

```typescript
// ❌ MAUVAIS : Utiliser uniquement user.id
uidGenerator: () => user.id

// ❌ MAUVAIS : Random pur (impossible d'identifier l'utilisateur)
uidGenerator: () => Math.random().toString()

// ❌ MAUVAIS : Timestamp seul (collisions possibles)
uidGenerator: () => Date.now().toString()
```

---

## 🔍 Sécurité des Canaux

### Vérifications Automatiques

Le fichier `config/transmit.ts` contient les hooks d'autorisation :

```typescript
authorization: {
  subscribeToChannel: async (ctx, channel) => {
    const user = ctx.auth?.user
    if (!user) return false

    // TransmitService.canAccessChannel() vérifie:
    // - Canaux notifications: user.id match
    // - Canaux missions: user est propriétaire ou transporteur
    // - Canaux conversations: user est participant
    return await transmitService.canAccessChannel(user, channel)
  }
}
```

### Canaux Protégés

| Canal                        | Accès                                             |
| ---------------------------- | ------------------------------------------------- |
| `global`                     | ✅ Tous                                           |
| `missions:new:transporteurs` | ✅ Role transporteur uniquement                   |
| `notifications:user:{id}`    | ✅ user.id === {id} uniquement                    |
| `mission:{id}:tracking`      | ✅ Affreteur propriétaire OU transporteur assigné |
| `chat:conversation:{id}`     | ✅ Participants de la conversation uniquement     |

---

## 📝 Endpoints Notifications

### Liste des Notifications

```bash
GET /api/common/notifications?page=1&limit=20&filter=unread
Authorization: Bearer {token}

# Filtres disponibles:
# - filter=all (défaut)
# - filter=unread
# - filter=read
# - filter=urgent
```

### Marquer comme Lue

```bash
# Une notification
PUT /api/common/notifications/{id}/read
Authorization: Bearer {token}

# Toutes les notifications
PUT /api/common/notifications/read-all
Authorization: Bearer {token}
```

### Statistiques

```bash
GET /api/common/notifications/stats
Authorization: Bearer {token}

# Retourne:
# - unread: nombre non lues
# - urgent: nombre urgentes
# - total: total
# - byType: répartition par type
```

### Test Notification (Admin uniquement)

```bash
POST /api/common/notifications/test
Authorization: Bearer {token_admin}
{
  "title": "Test",
  "message": "Notification de test",
  "priority": "normal"
}
```

---

## 🐛 Débogage

### Vérifier Transmit

```bash
# Logs de démarrage
✅ Transmit routes registered on /__transmit/*

# Logs de connexion
✅ Transmit: user@example.com autorisé sur global
📡 Broadcast envoyé: global
```

### Vérifier Redis

```bash
# Connexion Redis
redis-cli ping
# Réponse: PONG

# Voir les clés Transmit
redis-cli --scan --pattern "transmit:*"
```

### Logs Importants

```typescript
// Mission publiée
📢 Notification nouvelle mission à 5 transporteurs: Mission Douala-Yaoundé
📝 5 notifications créées en base
📡 Transmit broadcast envoyé sur missions:new:transporteurs
📧 5 emails envoyés pour nouvelle mission
✅ Notification nouvelle mission complète: 5 transporteurs notifiés

// Changement de statut
🔔 Notification changement statut: Mission X assigned → completed
📡 Tracking mission 123: status assigned → completed broadcasted
✅ Affreteur 456 notifié du changement de statut mission 123

// Message chat
💬 Message envoyé dans conversation 789
📡 Transmit broadcast envoyé sur chat:conversation:789
```

---

## ❓ FAQ

### Q: Les EventSource se déconnectent-ils souvent ?

**R**: EventSource se reconnecte automatiquement en cas de déconnexion. Transmit gère les reconnexions.

### Q: Comment tester sans le frontend ?

**R**: Utilisez la page de test HTML fournie : `/test-transmit-sse.html`

### Q: Les notifications sont-elles persistées ?

**R**: Oui, toutes les notifications sont sauvegardées en base de données dans la table `notifications`.

### Q: Puis-je désactiver les emails ?

**R**: Oui, dans `NotificationManagerService`, le paramètre `sendEmail` peut être configuré.

### Q: Comment voir les connexions actives ?

**R**: Transmit ne fournit pas d'API pour lister les connexions actives par design (sécurité).

---

## 🎯 Points d'Entrée Principaux

### Services

- `app/services/transmit_service.ts` : Gestion Transmit
- `app/services/notification_manager_service.ts` : Orchestration notifications
- `app/services/mission_notification_service.ts` : Notifications missions

### Contrôleurs

- `app/controllers/http/common/notifications_controller.ts`
- `app/controllers/http/common/conversations_controller.ts`
- `app/controllers/http/common/messages_controller.ts`

### Configuration

- `config/transmit.ts` : Config Transmit + Authorization hooks
- `start/routes.ts` : Routes Transmit (ligne 286-391)

---

## ✅ Checklist de Test

- [ ] Redis démarre correctement
- [ ] API démarre sans erreur
- [ ] Page de test `/test-transmit-sse.html` accessible
- [ ] Connexion SSE sur `global` fonctionne
- [ ] Broadcast manuel via `/transmit/broadcast` fonctionne
- [ ] Publication mission → broadcast aux transporteurs
- [ ] Changement statut mission → notification affreteur
- [ ] Création conversation → récupération messages
- [ ] Envoi message → broadcast temps réel aux participants
- [ ] Notifications DB créées correctement
- [ ] Emails envoyés (vérifier logs)

---

## 🚀 Prochaines Étapes

1. **Frontend** : Implémenter EventSource dans React
2. **Mobile** : Support WebSocket via Socket.io (optionnel)
3. **Monitoring** : Ajouter métriques Transmit (connexions actives, messages/s)
4. **Tests E2E** : Scénarios complets de notification
5. **Performance** : Load testing avec 1000+ connexions simultanées

---

## 🔧 Problèmes Courants et Solutions

### Erreur : "EventSource's response has a MIME type 'application/json'"

**Cause** : Le middleware `ForceJsonResponseMiddleware` force toutes les réponses en JSON.

**Solution** : Exclure les routes Transmit du middleware :

```typescript
// app/middleware/force_json_response_middleware.ts
async handle({ request }: HttpContext, next: NextFn) {
  const url = request.url()

  // Exclure TOUTES les routes Transmit
  if (url.startsWith('/__transmit')) {
    return next()
  }

  const headers = request.headers()
  headers.accept = 'application/json'
  return next()
}
```

### Erreur : "subscription.onMessage is not a function"

**Cause** : Utilisation d'EventSource brut au lieu du SDK Transmit.

**Solution** : Installer et utiliser `@adonisjs/transmit-client` :

```bash
npm install @adonisjs/transmit-client
```

### Les messages ne sont pas reçus

**Checklist** :

1. ✅ Redis est-il démarré ? (`redis-cli ping`)
2. ✅ Le SDK client est-il utilisé ? (pas EventSource brut)
3. ✅ `subscription.create()` a-t-il été appelé ?
4. ✅ Le token JWT est-il passé correctement ?
5. ✅ Le hook `subscribeToChannel` retourne-t-il `true` ?
6. ✅ Le middleware `ForceJsonResponseMiddleware` exclut-il `/__transmit` ?

**Debug** :

```bash
# Vérifier Redis
redis-cli MONITOR

# Vérifier les logs AdonisJS
# Chercher : "🔍 [TRANSMIT SUBSCRIBE]" et "📡 TRANSMIT BROADCAST"

# Vérifier les logs browser
# Chercher : "📨 Message Transmit reçu"
```

### Authentification échoue

**Cause** : Le token n'est pas passé correctement dans les requêtes Transmit.

**Solution** : Utiliser le hook `onAuthorize` :

```typescript
const transmit = new Transmit({
  baseUrl: 'http://localhost:3333',
  onAuthorize: async (request) => {
    request.url += (request.url.includes('?') ? '&' : '?') + `token=${token}`
    return request
  },
})
```

### Connexions multiples se ferment

**Cause** : Même `uid` utilisé pour toutes les connexions.

**Solution** : Générer un uid unique par connexion (voir section UID ci-dessus).

---

**Date de dernière mise à jour** : 2025-10-01
**Statut** : ✅ Système Opérationnel et Testé
**Version** : 2.0.0
