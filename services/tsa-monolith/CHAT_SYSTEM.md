# 💬 Système de Chat en Temps Réel - TSA Monolith

## 📋 Vue d'ensemble

Le système de chat permet la communication en temps réel entre les différents acteurs de la plateforme TSA Logistics via WebSocket et API REST.

### ✅ Fonctionnalités implémentées

- **Conversations directes** entre utilisateurs autorisés
- **Conversations liées aux missions** pour la coordination logistique
- **Messagerie temps réel** via WebSocket
- **Indicateurs de lecture** des messages
- **Indicateurs "en train d'écrire"** (typing indicators)
- **Contrôles d'autorisation** stricts basés sur les rôles
- **Comptage des messages non lus**
- **Historique complet** des conversations

---

## 🔐 Règles d'Autorisation

### Conversations Directes

| Rôle 1        | Rôle 2           | Autorisé ? | Notes                           |
| ------------- | ---------------- | ---------- | ------------------------------- |
| Admin         | Affreteur        | ✅         | Sans restriction                |
| Admin         | Transporteur     | ✅         | Sans restriction                |
| Admin         | Admin            | ✅         | Communication interne           |
| Affreteur     | Affreteur        | ✅         | Entre affreteurs                |
| Transporteur  | Transporteur     | ✅         | Entre transporteurs             |
| **Affreteur** | **Transporteur** | ❌         | **Doit passer par une mission** |

### Conversations Mission

- **Affreteur ↔ Transporteur** : Autorisé uniquement si les deux sont liés à la même mission
  - L'affreteur doit être propriétaire de la mission (`affreteurId`)
  - Le transporteur doit être assigné à la mission (`transporteurId`)
- **Admin** : Peut créer/consulter toutes les conversations mission

---

## 🌐 API REST Endpoints

### 1. Gestion des Conversations

#### **GET** `/api/common/conversations`

Liste les conversations de l'utilisateur connecté.

**Query Parameters:**

```json
{
  "page": 1, // Page de pagination (optionnel)
  "limit": 20, // Nombre d'items par page (optionnel)
  "type": "direct" // Filtrer par type: "direct" ou "mission" (optionnel)
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "meta": { "total": 10, "page": 1, "perPage": 20 },
    "data": [
      {
        "id": 1,
        "type": "direct",
        "user1Id": "uuid-1",
        "user2Id": "uuid-2",
        "missionId": null,
        "lastActivityAt": "2025-01-15T10:30:00Z",
        "messagesCount": 45,
        "unreadMessagesCount": 3,
        "otherParticipant": {
          "id": "uuid-2",
          "firstName": "Jean",
          "lastName": "Dupont",
          "email": "jean@example.com",
          "role": "transporteur"
        }
      }
    ]
  }
}
```

---

#### **GET** `/api/common/conversations/:id`

Détails d'une conversation spécifique.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "mission",
    "missionId": "mission-uuid",
    "mission": {
      "id": "mission-uuid",
      "title": "Transport Douala - Yaoundé",
      "status": "in_progress"
    },
    "otherParticipant": {
      "id": "uuid-2",
      "firstName": "Marie",
      "lastName": "Martin",
      "role": "affreteur"
    }
  }
}
```

---

#### **POST** `/api/common/conversations/direct`

Créer ou récupérer une conversation directe.

**Request Body:**

```json
{
  "userId": "uuid-target-user"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Conversation créée ou récupérée avec succès",
  "data": {
    "id": 1,
    "type": "direct",
    "user1Id": "uuid-1",
    "user2Id": "uuid-2",
    "otherParticipant": {
      /* ... */
    }
  }
}
```

**Erreurs possibles:**

- `403 Forbidden` : Conversation non autorisée (ex: affreteur → transporteur sans mission)
- `404 Not Found` : Utilisateur cible introuvable

---

#### **POST** `/api/common/conversations/mission`

Créer ou récupérer une conversation liée à une mission.

**Request Body:**

```json
{
  "missionId": "mission-uuid",
  "userId": "uuid-target-user"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Conversation mission créée ou récupérée avec succès",
  "data": {
    "id": 2,
    "type": "mission",
    "missionId": "mission-uuid",
    "user1Id": "uuid-affreteur",
    "user2Id": "uuid-transporteur",
    "mission": {
      /* ... */
    },
    "otherParticipant": {
      /* ... */
    }
  }
}
```

**Erreurs possibles:**

- `403 Forbidden` : Les participants ne sont pas liés à la mission
- `404 Not Found` : Mission ou utilisateur introuvable

---

#### **GET** `/api/common/conversations/search/users`

Rechercher des utilisateurs pour créer une conversation.

**Query Parameters:**

```json
{
  "search": "jean", // Recherche par nom/email (optionnel)
  "role": "transporteur", // Filtrer par rôle (optionnel)
  "limit": 10 // Nombre de résultats (max 50)
}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "role": "transporteur"
    }
  ]
}
```

---

### 2. Gestion des Messages

#### **GET** `/api/common/conversations/:conversationId/messages`

Récupérer les messages d'une conversation.

**Query Parameters:**

```json
{
  "page": 1,
  "limit": 50
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": {
      "meta": { "total": 120, "page": 1, "perPage": 50 },
      "data": [
        {
          "id": 456,
          "conversationId": 1,
          "senderId": "uuid-1",
          "content": "Bonjour, la livraison est en cours",
          "type": "text",
          "isRead": true,
          "createdAt": "2025-01-15T10:30:00Z",
          "sender": {
            "id": "uuid-1",
            "firstName": "Jean",
            "lastName": "Dupont",
            "role": "transporteur"
          }
        }
      ]
    },
    "conversation": {
      /* ... */
    }
  }
}
```

> **Note :** Les messages sont automatiquement marqués comme lus lors de la récupération.

---

#### **POST** `/api/common/conversations/:conversationId/messages`

Envoyer un message dans une conversation.

**Request Body:**

```json
{
  "content": "Message texte ici",
  "type": "text" // "text" ou "system" (optionnel)
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message envoyé avec succès",
  "data": {
    "message": {
      "id": 789,
      "conversationId": 1,
      "senderId": "uuid-current-user",
      "content": "Message texte ici",
      "type": "text",
      "isRead": false,
      "createdAt": "2025-01-15T10:35:00Z",
      "sender": {
        /* ... */
      }
    }
  }
}
```

> **WebSocket :** Le message est automatiquement envoyé en temps réel à tous les participants via l'événement `chat:message`.

---

#### **PUT** `/api/common/messages/:id/read`

Marquer un message spécifique comme lu.

**Response:**

```json
{
  "success": true,
  "message": "Message marqué comme lu",
  "data": {
    "message": {
      /* ... */
    }
  }
}
```

> **WebSocket :** L'expéditeur reçoit une notification `chat:read` en temps réel.

---

#### **PUT** `/api/common/conversations/:conversationId/messages/read-all`

Marquer tous les messages d'une conversation comme lus.

**Response:**

```json
{
  "success": true,
  "message": "15 messages marqués comme lus",
  "data": {
    "updatedCount": 15
  }
}
```

---

#### **GET** `/api/common/messages/unread-count`

Obtenir le nombre total de messages non lus.

**Response:**

```json
{
  "success": true,
  "data": {
    "unreadCount": 7
  }
}
```

---

#### **POST** `/api/common/conversations/:conversationId/typing`

Envoyer un indicateur "en train d'écrire".

**Request Body:**

```json
{
  "isTyping": true // true = commence à écrire, false = arrête
}
```

**Response:**

```json
{
  "success": true,
  "message": "Indicateur de saisie envoyé"
}
```

> **WebSocket :** Les autres participants reçoivent l'événement `chat:typing:start` ou `chat:typing:stop`.

---

## 🔌 WebSocket - Événements en Temps Réel

### Connexion WebSocket

**URL:** `ws://localhost:3333/ws/notifications`

**Headers requis:**

```
Authorization: Bearer <access_token>
```

**Exemple de connexion (JavaScript):**

```javascript
const token = 'your_access_token'
const ws = new WebSocket(`ws://localhost:3333/ws/notifications`)

// Envoyer le token après connexion
ws.onopen = () => {
  console.log('✅ WebSocket connecté')

  // Heartbeat pour maintenir la connexion
  setInterval(() => {
    ws.send('ping')
  }, 30000) // Toutes les 30 secondes
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  console.log('📨 Message reçu:', message)
  handleWebSocketEvent(message)
}

ws.onclose = () => {
  console.log('❌ WebSocket déconnecté')
}
```

---

### Types d'Événements

#### 1. `connected`

Confirmation de connexion réussie.

```json
{
  "type": "connected",
  "message": "Connexion WebSocket établie",
  "user": {
    "id": "uuid-user",
    "email": "user@example.com",
    "role": "transporteur"
  },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

#### 2. `chat:message`

Nouveau message reçu dans une conversation.

```json
{
  "type": "chat:message",
  "data": {
    "conversationId": 1,
    "message": {
      "id": 789,
      "conversationId": 1,
      "senderId": "uuid-sender",
      "content": "Bonjour, le colis est prêt !",
      "type": "text",
      "isRead": false,
      "createdAt": "2025-01-15T10:30:00Z",
      "sender": {
        "id": "uuid-sender",
        "firstName": "Marie",
        "lastName": "Martin",
        "role": "affreteur"
      }
    }
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Action recommandée côté client:**

- Ajouter le message à l'historique de la conversation
- Afficher une notification si la conversation n'est pas active
- Incrémenter le compteur de messages non lus

---

#### 3. `chat:read`

Message(s) marqué(s) comme lu(s).

```json
{
  "type": "chat:read",
  "data": {
    "conversationId": 1,
    "readerId": "uuid-reader",
    "messageIds": [789, 790, 791],
    "readAt": "2025-01-15T10:35:00Z"
  },
  "timestamp": "2025-01-15T10:35:00Z",
  "userId": "uuid-sender"
}
```

**Action recommandée côté client:**

- Mettre à jour l'état des messages comme "lus"
- Afficher un indicateur visuel (✓✓ double check)

---

#### 4. `chat:typing:start`

Un participant commence à écrire.

```json
{
  "type": "chat:typing:start",
  "data": {
    "conversationId": 1,
    "senderId": "uuid-typing-user",
    "isTyping": true
  },
  "timestamp": "2025-01-15T10:36:00Z"
}
```

**Action recommandée côté client:**

- Afficher "X est en train d'écrire..."

---

#### 5. `chat:typing:stop`

Un participant arrête d'écrire.

```json
{
  "type": "chat:typing:stop",
  "data": {
    "conversationId": 1,
    "senderId": "uuid-typing-user",
    "isTyping": false
  },
  "timestamp": "2025-01-15T10:36:30Z"
}
```

**Action recommandée côté client:**

- Masquer l'indicateur "en train d'écrire"

---

#### 6. `chat:conversation:created`

Nouvelle conversation créée.

```json
{
  "type": "chat:conversation:created",
  "data": {
    "conversationId": 5
  },
  "timestamp": "2025-01-15T11:00:00Z"
}
```

**Action recommandée côté client:**

- Recharger la liste des conversations
- Afficher une notification

---

## 🏗️ Architecture Technique

### Modèles de Données

#### `Conversation`

```typescript
{
  id: number
  type: 'direct' | 'mission'
  user1Id: string
  user2Id: string
  missionId: string | null
  lastActivityAt: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Relations:**

- `messages: HasMany<Message>`
- `user1: BelongsTo<User>`
- `user2: BelongsTo<User>`
- `mission: BelongsTo<Mission>`

---

#### `Message`

```typescript
{
  id: number
  conversationId: number
  senderId: string
  missionId: string | null
  content: string
  type: 'text' | 'system'
  readAt: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Relations:**

- `conversation: BelongsTo<Conversation>`
- `sender: BelongsTo<User>`
- `mission: BelongsTo<Mission>`

---

### Services

#### `ConversationAuthorizationService`

Gère les autorisations de conversations selon les règles métier.

**Méthodes principales:**

- `canConverseDirect(user1, user2)` : Vérifie les conversations directes
- `canConverseMission(user1, user2, mission)` : Vérifie les conversations mission
- `getDirectConversationDenialReason(user1, user2)` : Messages d'erreur explicites

---

#### `WebSocketService` (Singleton)

Gère les connexions WebSocket et le broadcasting.

**Méthodes principales:**

- `registerConnection(userId, role, ws)` : Enregistre une connexion
- `sendToUser(userId, message)` : Envoie à un utilisateur spécifique
- `sendChatEvent(userIds, eventType, data)` : Envoie un événement de chat
- `sendTypingIndicator(conversationId, senderId, recipientIds, isTyping)`
- `sendMessageReadNotification(messageId, conversationId, readerId, senderId)`
- `broadcastToTransporteurs(message)` : Broadcast aux transporteurs
- `broadcastToAffreteurs(message)` : Broadcast aux affreteurs

---

## 🧪 Tests & Validation

### Scénarios de Test

#### ✅ Test 1 : Conversation Admin → Affreteur

```bash
# Admin crée conversation avec affreteur
POST /api/common/conversations/direct
{
  "userId": "uuid-affreteur"
}

# Résultat attendu: 200 OK, conversation créée
```

---

#### ✅ Test 2 : Conversation Admin → Transporteur

```bash
# Admin crée conversation avec transporteur
POST /api/common/conversations/direct
{
  "userId": "uuid-transporteur"
}

# Résultat attendu: 200 OK, conversation créée
```

---

#### ❌ Test 3 : Affreteur → Transporteur (Direct) - REFUSÉ

```bash
# Affreteur tente conversation directe avec transporteur
POST /api/common/conversations/direct
{
  "userId": "uuid-transporteur"
}

# Résultat attendu: 403 Forbidden
# Message: "Les conversations directes entre affreteurs et transporteurs
#           ne sont pas autorisées. Veuillez créer une conversation
#           liée à une mission spécifique."
```

---

#### ✅ Test 4 : Affreteur → Transporteur (Via Mission) - AUTORISÉ

```bash
# Affreteur crée conversation mission avec transporteur assigné
POST /api/common/conversations/mission
{
  "missionId": "mission-uuid",
  "userId": "uuid-transporteur-assigne"
}

# Résultat attendu: 200 OK, conversation mission créée
```

---

#### ✅ Test 5 : Envoi de Message en Temps Réel

```bash
# 1. Connexion WebSocket des 2 participants
ws1 = new WebSocket('ws://localhost:3333/ws/notifications')
ws2 = new WebSocket('ws://localhost:3333/ws/notifications')

# 2. Envoi d'un message via API
POST /api/common/conversations/1/messages
{
  "content": "Test de message temps réel"
}

# 3. Vérification
# - ws1 (expéditeur) reçoit: 201 Created
# - ws2 (destinataire) reçoit: event "chat:message" via WebSocket
```

---

## 📊 Métriques & Monitoring

### Logs disponibles

```
✅ WebSocket: Utilisateur {userId} ({role}) connecté
📡 WebSocket: Broadcasting aux transporteurs (5 connectés)
✅ WebSocket: Message envoyé à l'utilisateur {userId}
❌ WebSocket: Utilisateur {userId} non connecté, message non envoyé
❌ WebSocket: {userId} déconnecté
```

### Statistiques WebSocket

```typescript
const stats = websocketService.getConnectionStats()
// {
//   total: 23,
//   transporteurs: 15,
//   affreteurs: 7,
//   admins: 1
// }
```

---

## 🚀 Déploiement

### Variables d'environnement requises

```bash
# WebSocket Redis (optionnel, pour multi-instances)
WEBSOCKET_REDIS_ENABLED=false
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# URL Frontend (CORS)
FRONTEND_URL=http://localhost:5173
```

### Configuration Redis pour Broadcasting Multi-Instances

Pour déployer plusieurs instances de l'API, activez Redis dans `config/websocket.ts`:

```typescript
redis: {
  enabled: env.get('WEBSOCKET_REDIS_ENABLED', true),
  host: env.get('REDIS_HOST', 'localhost'),
  port: env.get('REDIS_PORT', 6379),
  password: env.get('REDIS_PASSWORD'),
}
```

Cela permet de broadcaster les messages WebSocket entre toutes les instances de serveur.

---

## 📚 Exemples d'Intégration Frontend

### React/TypeScript - Hook personnalisé

```typescript
import { useEffect, useState } from 'react'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export function useChatWebSocket(token: string) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const websocket = new WebSocket(`ws://localhost:3333/ws/notifications`)

    websocket.onopen = () => {
      console.log('✅ WebSocket connecté')
      setIsConnected(true)

      // Heartbeat
      const interval = setInterval(() => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send('ping')
        }
      }, 30000)

      return () => clearInterval(interval)
    }

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data)

      // Ignorer pong
      if (message === 'pong') return

      setMessages((prev) => [...prev, message])

      // Gérer les différents types d'événements
      switch (message.type) {
        case 'chat:message':
          handleNewMessage(message.data)
          break
        case 'chat:read':
          handleMessageRead(message.data)
          break
        case 'chat:typing:start':
          handleTypingStart(message.data)
          break
        case 'chat:typing:stop':
          handleTypingStop(message.data)
          break
      }
    }

    websocket.onclose = () => {
      console.log('❌ WebSocket déconnecté')
      setIsConnected(false)
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [token])

  const sendTypingIndicator = (conversationId: number, isTyping: boolean) => {
    fetch(`/api/common/conversations/${conversationId}/typing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isTyping })
    })
  }

  return { ws, messages, isConnected, sendTypingIndicator }
}

// Composant de chat
function ChatConversation({ conversationId }: { conversationId: number }) {
  const token = useAuthToken()
  const { messages, isConnected, sendTypingIndicator } = useChatWebSocket(token)

  const handleTyping = () => {
    sendTypingIndicator(conversationId, true)

    // Arrêter après 2 secondes d'inactivité
    clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      sendTypingIndicator(conversationId, false)
    }, 2000)
  }

  return (
    <div>
      {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
      {/* UI du chat */}
    </div>
  )
}
```

---

## 🔧 Dépannage

### Problème : WebSocket ne se connecte pas

**Solutions:**

1. Vérifier que le token JWT est valide
2. Vérifier les CORS dans `config/cors.ts`
3. S'assurer que le port 3333 est ouvert
4. Vérifier les logs du serveur

### Problème : Messages non reçus en temps réel

**Solutions:**

1. Vérifier que les deux utilisateurs sont connectés au WebSocket
2. Consulter les logs du `WebSocketService`
3. Vérifier que les IDs des participants sont corrects
4. Tester avec `wscat` pour debug

```bash
npx wscat -c "ws://localhost:3333/ws/notifications" -H "Authorization: Bearer TOKEN"
```

---

## 📝 Notes de Version

### Version 1.0.0 (2025-01-15)

- ✅ Système de chat complet avec WebSocket
- ✅ Conversations directes et mission
- ✅ Contrôles d'autorisation métier
- ✅ Indicateurs de lecture
- ✅ Indicateurs "typing"
- ✅ API REST complète
- ✅ Documentation complète

---

## 🎯 Prochaines Améliorations

- [ ] Pièces jointes (images, fichiers)
- [ ] Messages vocaux
- [ ] Recherche dans les messages
- [ ] Archivage des conversations
- [ ] Notifications push (Firebase/OneSignal)
- [ ] Groupes de chat (plus de 2 participants)
- [ ] Suppression de messages
- [ ] Édition de messages

---

**Documentation maintenue par l'équipe TSA Logistics**
_Dernière mise à jour : 2025-01-15_
