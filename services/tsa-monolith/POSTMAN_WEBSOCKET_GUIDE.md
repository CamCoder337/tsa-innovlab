# 🧪 Guide de Test WebSocket avec Postman

Ce guide vous permet de tester complètement le système de notifications WebSocket en temps réel.

---

## 📋 Prérequis

1. **Postman Desktop** (version 10+) installé
2. **Serveur AdonisJS** en cours d'exécution sur `http://localhost:3333`
3. **Base de données** avec des utilisateurs de test

---

## 🚀 ÉTAPE 1 : Démarrer le Serveur

```bash
cd D:\TIL\tsa-innovlab\services\tsa-monolith
npm run dev
```

Vérifiez que vous voyez :

```
✅ WebSocket routes registered on /ws/*
[ info ] starting HTTP server on http://localhost:3333
```

---

## 👤 ÉTAPE 2 : Créer des Utilisateurs de Test

### 2.1 Créer un Admin

**Requête HTTP POST**

```
URL: http://localhost:3333/api/auth/register
Method: POST
Headers: Content-Type: application/json
Body (raw JSON):
```

```json
{
  "email": "admin@test.com",
  "password": "Admin123!",
  "firstName": "Admin",
  "lastName": "Test",
  "phone": "+237650000001",
  "role": "admin"
}
```

**Réponse attendue :**

```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": { ... },
    "requiresMFA": true
  }
}
```

### 2.2 Créer un Transporteur

**Requête HTTP POST**

```
URL: http://localhost:3333/api/auth/register
Method: POST
Headers: Content-Type: application/json
Body (raw JSON):
```

```json
{
  "email": "transporteur1@test.com",
  "password": "Transport123!",
  "firstName": "Jean",
  "lastName": "Transporteur",
  "phone": "+237650000002",
  "role": "transporteur"
}
```

### 2.3 Créer un Deuxième Transporteur

```json
{
  "email": "transporteur2@test.com",
  "password": "Transport123!",
  "firstName": "Paul",
  "lastName": "Transporteur",
  "phone": "+237650000003",
  "role": "transporteur"
}
```

### 2.4 Créer un Affreteur

```json
{
  "email": "affreteur@test.com",
  "password": "Affret123!",
  "firstName": "Marie",
  "lastName": "Affreteur",
  "phone": "+237650000004",
  "role": "affreteur"
}
```

---

## 🔐 ÉTAPE 3 : Authentification et Obtention des Tokens

### 3.1 Login Transporteur 1

**Requête HTTP POST**

```
URL: http://localhost:3333/api/auth/login
Method: POST
Headers: Content-Type: application/json
Body (raw JSON):
```

```json
{
  "email": "transporteur1@test.com",
  "password": "Transport123!"
}
```

**Réponse attendue :**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-ici",
      "email": "transporteur1@test.com",
      "role": "transporteur",
      ...
    },
    "token": {
      "type": "bearer",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "..."
    }
  }
}
```

**⚠️ IMPORTANT : Copier le token pour l'utiliser dans les tests WebSocket**

### 3.2 Login Transporteur 2

Répéter avec `transporteur2@test.com` et sauvegarder son token.

### 3.3 Login Affreteur

Répéter avec `affreteur@test.com` et sauvegarder son token.

---

## 🌐 ÉTAPE 4 : Connexion WebSocket dans Postman

### 4.1 Ouvrir une Connexion WebSocket

1. **Cliquer sur "New" → "WebSocket"**
2. **URL**: `ws://localhost:3333/ws/notifications`
3. **Onglet "Headers"** → Ajouter :

   ```
   Key: Authorization
   Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   _(Remplacer par le token du transporteur1)_

4. **Cliquer sur "Connect"**

**✅ Message de bienvenue attendu :**

```json
{
  "type": "connected",
  "message": "Connexion WebSocket établie",
  "user": {
    "id": "uuid-transporteur1",
    "email": "transporteur1@test.com",
    "role": "transporteur"
  },
  "timestamp": "2025-01-10T12:34:56.789Z"
}
```

### 4.2 Ouvrir une Deuxième Connexion (Transporteur 2)

1. **Nouvelle fenêtre Postman** (New Tab)
2. **URL**: `ws://localhost:3333/ws/notifications`
3. **Authorization**: Bearer token de transporteur2
4. **Connect**

**Vous devriez maintenant avoir 2 connexions WebSocket actives !**

---

## 🧪 ÉTAPE 5 : Test du Heartbeat (Ping/Pong)

### Dans la fenêtre WebSocket Transporteur 1

1. **Onglet "Message"**
2. **Saisir** : `ping`
3. **Cliquer "Send"**

**✅ Réponse attendue :**

```
pong
```

---

## 📢 ÉTAPE 6 : Test de Broadcasting aux Transporteurs

### 6.1 Créer une Mission (via HTTP)

**Nouvelle requête HTTP POST**

```
URL: http://localhost:3333/api/affreteur/missions
Method: POST
Headers:
  Content-Type: application/json
  Authorization: Bearer <token-affreteur>
Body (raw JSON):
```

```json
{
  "titre": "Transport Douala → Yaoundé",
  "description": "Livraison de matériel électronique urgent",
  "typeMarchandise": "Électronique",
  "poids": 150,
  "volume": 2.5,
  "budgetMin": 50000,
  "budgetMax": 75000,
  "dateDepartEstime": "2025-01-15T08:00:00Z",
  "dateArriveeEstime": "2025-01-15T12:00:00Z",
  "adresseDepart": {
    "street": "Boulevard de la Liberté",
    "city": "Douala",
    "postalCode": "1234",
    "country": "Cameroun",
    "latitude": 4.0511,
    "longitude": 9.7679
  },
  "adresseArrivee": {
    "street": "Avenue Kennedy",
    "city": "Yaoundé",
    "postalCode": "5678",
    "country": "Cameroun",
    "latitude": 3.848,
    "longitude": 11.5021
  }
}
```

**Réponse attendue :**

```json
{
  "success": true,
  "message": "Mission created successfully",
  "data": {
    "mission": {
      "id": "mission-uuid",
      "titre": "Transport Douala → Yaoundé",
      "status": "draft",
      ...
    }
  }
}
```

**⚠️ Copier l'ID de la mission**

### 6.2 Publier la Mission

**Requête HTTP POST**

```
URL: http://localhost:3333/api/affreteur/missions/<mission-id>/publish
Method: POST
Headers:
  Authorization: Bearer <token-affreteur>
```

**✅ Dans les 2 fenêtres WebSocket des transporteurs, vous devriez recevoir :**

```json
{
  "type": "broadcast",
  "data": {
    "type": "mission:new",
    "data": {
      "id": "mission-uuid",
      "titre": "Transport Douala → Yaoundé",
      "departureCity": "Douala",
      "arrivalCity": "Yaoundé",
      "budgetMin": 50000,
      "budgetMax": 75000,
      ...
    }
  },
  "timestamp": "2025-01-10T12:45:00.000Z"
}
```

**🎉 SUCCÈS : Les 2 transporteurs ont reçu la notification en temps réel !**

---

## 🔔 ÉTAPE 7 : Test de Notification Ciblée (Admin)

### 7.1 Créer et Envoyer une Notification Test

**Requête HTTP POST**

```
URL: http://localhost:3333/api/common/notifications
Method: POST
Headers:
  Content-Type: application/json
  Authorization: Bearer <token-admin>
Body (raw JSON):
```

```json
{
  "title": "Test de notification admin",
  "message": "Ceci est un test de notification WebSocket pour l'utilisateur ciblé",
  "priority": "high"
}
```

**✅ L'admin devrait recevoir dans sa connexion WebSocket :**

```json
{
  "type": "notification",
  "data": {
    "type": "notification:new",
    "data": {
      "id": "notif-uuid",
      "title": "Test de notification admin",
      "message": "Ceci est un test...",
      "priority": "high",
      "readAt": null,
      ...
    }
  },
  "timestamp": "2025-01-10T12:50:00.000Z",
  "userId": "admin-uuid"
}
```

---

## 💬 ÉTAPE 8 : Test des Messages Chat en Temps Réel

### 8.1 Créer une Conversation Directe

**Requête HTTP POST** (Transporteur 1 → Affreteur)

```
URL: http://localhost:3333/api/common/conversations/direct
Method: POST
Headers:
  Content-Type: application/json
  Authorization: Bearer <token-transporteur1>
Body (raw JSON):
```

```json
{
  "userId": "<affreteur-user-id>"
}
```

**Réponse :**

```json
{
  "success": true,
  "message": "Conversation créée ou récupérée avec succès",
  "data": {
    "id": "conversation-uuid",
    "type": "direct",
    ...
  }
}
```

**⚠️ Copier l'ID de la conversation**

### 8.2 Connecter l'Affreteur en WebSocket

1. **Nouvelle fenêtre Postman WebSocket**
2. **URL**: `ws://localhost:3333/ws/notifications`
3. **Authorization**: Bearer token de l'affreteur
4. **Connect**

### 8.3 Envoyer un Message

**Requête HTTP POST** (depuis Transporteur 1)

```
URL: http://localhost:3333/api/common/conversations/<conversation-id>/messages
Method: POST
Headers:
  Content-Type: application/json
  Authorization: Bearer <token-transporteur1>
Body (raw JSON):
```

```json
{
  "content": "Bonjour ! Je suis intéressé par la mission Douala → Yaoundé",
  "type": "text"
}
```

**✅ L'affreteur devrait recevoir en temps réel :**

```json
{
  "type": "notification",
  "data": {
    "type": "chat:message",
    "data": {
      "conversationId": "conversation-uuid",
      "message": {
        "id": "message-uuid",
        "content": "Bonjour ! Je suis intéressé...",
        "senderId": "transporteur1-uuid",
        "sender": {
          "firstName": "Jean",
          "lastName": "Transporteur",
          ...
        },
        "createdAt": "2025-01-10T13:00:00.000Z"
      }
    }
  },
  "timestamp": "2025-01-10T13:00:00.000Z",
  "userId": "affreteur-uuid"
}
```

**🎉 SUCCÈS : Message chat reçu en temps réel !**

---

## 📍 ÉTAPE 9 : Test de Suivi de Localisation GPS

### 9.1 Simuler une Mise à Jour de Position

**Requête HTTP POST** (Transporteur en mission)

```
URL: http://localhost:3333/api/transporteur/missions/<mission-id>/location
Method: POST
Headers:
  Content-Type: application/json
  Authorization: Bearer <token-transporteur1>
Body (raw JSON):
```

```json
{
  "latitude": 3.9,
  "longitude": 10.5
}
```

**✅ L'affreteur propriétaire de la mission devrait recevoir :**

```json
{
  "type": "notification",
  "data": {
    "type": "location_update",
    "data": {
      "location": {
        "latitude": 3.9,
        "longitude": 10.5,
        "timestamp": "2025-01-10T13:10:00.000Z"
      },
      "transporteur": "Jean Transporteur",
      "missionId": "mission-uuid"
    }
  },
  "timestamp": "2025-01-10T13:10:00.000Z"
}
```

---

## 🔍 ÉTAPE 10 : Vérifications et Diagnostics

### 10.1 Vérifier les Connexions Actives

Vous pouvez vérifier côté serveur en ajoutant un endpoint de debug.

**Dans les logs du serveur**, vous devriez voir :

```
✅ WebSocket: transporteur1@test.com (transporteur) connecté
✅ WebSocket: Utilisateur uuid-1 (transporteur) enregistré. Total connexions: 1

✅ WebSocket: transporteur2@test.com (transporteur) connecté
✅ WebSocket: Utilisateur uuid-2 (transporteur) enregistré. Total connexions: 2

📡 WebSocket: Broadcasting aux transporteurs (2 connectés)
✅ WebSocket: Message envoyé à 2 transporteurs
```

### 10.2 Test de Déconnexion

1. **Fermer une connexion WebSocket** dans Postman (bouton "Disconnect")
2. **Vérifier les logs serveur** :

```
❌ WebSocket: transporteur1@test.com déconnecté
❌ WebSocket: Utilisateur uuid-1 déconnecté. Connexions restantes: 1
```

---

## 📊 Résumé des Tests

| Test                          | Description                         | Statut   |
| ----------------------------- | ----------------------------------- | -------- |
| ✅ Connexion WebSocket        | Connexion avec JWT réussie          | À tester |
| ✅ Heartbeat                  | Ping/Pong fonctionnel               | À tester |
| ✅ Broadcasting Transporteurs | Notification nouvelle mission       | À tester |
| ✅ Notification Ciblée        | Message à un utilisateur spécifique | À tester |
| ✅ Message Chat               | Conversation en temps réel          | À tester |
| ✅ Localisation GPS           | Suivi position transporteur         | À tester |
| ✅ Déconnexion                | Nettoyage connexion                 | À tester |

---

## 🐛 Dépannage

### Erreur "WebSocket authentication failed"

**Cause** : Token JWT invalide ou expiré

**Solution** :

1. Vérifier que le token est bien au format `Bearer <token>`
2. Se reconnecter pour obtenir un nouveau token
3. Vérifier que le serveur est bien démarré

### Pas de message reçu après publication de mission

**Vérifications** :

1. La mission est bien au statut `published` (pas `draft`)
2. Les transporteurs sont bien connectés en WebSocket
3. Vérifier les logs serveur pour voir le broadcasting

### Connexion WebSocket se ferme immédiatement

**Cause** : Middleware auth() bloque la connexion

**Solution** :

1. Vérifier que le token est valide
2. Vérifier que le header `Authorization` est bien envoyé
3. Vérifier les logs serveur

---

## 🎯 Scénario de Test Complet (30 minutes)

### Préparation (5 min)

1. ✅ Démarrer le serveur
2. ✅ Créer 4 utilisateurs (admin, affreteur, 2 transporteurs)
3. ✅ Login et récupérer les 4 tokens

### Tests WebSocket (15 min)

4. ✅ Connecter Transporteur 1 en WebSocket
5. ✅ Connecter Transporteur 2 en WebSocket
6. ✅ Test ping/pong sur les 2 connexions
7. ✅ Créer et publier une mission (affreteur)
8. ✅ Vérifier que les 2 transporteurs reçoivent la notification

### Tests Chat (5 min)

9. ✅ Créer une conversation directe
10. ✅ Connecter l'affreteur en WebSocket
11. ✅ Envoyer un message depuis transporteur
12. ✅ Vérifier réception en temps réel côté affreteur

### Tests Localisation (5 min)

13. ✅ Simuler une mise à jour de position GPS
14. ✅ Vérifier réception par l'affreteur

---

## 📝 Notes Importantes

- **Tokens JWT** : Durée de vie 7 jours par défaut
- **WebSocket** : Connexion maintenue par heartbeat toutes les 30 secondes
- **Broadcasting** : Les messages sont filtrés par rôle automatiquement
- **Sécurité** : Authentification obligatoire pour toutes les connexions

---

## 🚀 Prochaines Étapes

Après validation des tests WebSocket :

1. **Frontend** : Intégrer les WebSockets dans l'application React
2. **Notifications Push** : Ajouter Firebase Cloud Messaging
3. **Persistance** : Stocker l'historique des notifications
4. **Monitoring** : Ajouter des métriques de connexions actives

---

**Bon test ! 🎉**
