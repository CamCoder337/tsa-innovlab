# 🚀 Guide de Démarrage Rapide - Tests WebSocket avec Postman

## ⏱️ Temps estimé : 10 minutes

---

## 📥 ÉTAPE 1 : Importer dans Postman (2 min)

### 1.1 Importer la Collection

1. Ouvrir **Postman**
2. Cliquer sur **"Import"** (en haut à gauche)
3. Glisser-déposer le fichier : **`TSA_WebSocket_Tests.postman_collection.json`**
4. Cliquer sur **"Import"**

✅ Vous devriez voir la collection **"TSA WebSocket Tests"** avec 6 dossiers

### 1.2 Importer l'Environnement

1. Cliquer sur **"Import"** à nouveau
2. Glisser-déposer le fichier : **`TSA_WebSocket_Tests.postman_environment.json`**
3. Cliquer sur **"Import"**

✅ Vous devriez voir l'environnement **"TSA WebSocket Tests Environment"**

### 1.3 Activer l'Environnement

1. En haut à droite, sélectionner **"TSA WebSocket Tests Environment"** dans le dropdown
2. L'environnement est maintenant actif (vous devriez voir une coche verte)

---

## 🖥️ ÉTAPE 2 : Démarrer le Serveur (1 min)

Ouvrir un terminal et exécuter :

```bash
cd D:\TIL\tsa-innovlab\services\tsa-monolith
npm run dev
```

**✅ Vérification :** Vous devriez voir dans les logs :

```
✅ WebSocket routes registered on /ws/*
[ info ] starting HTTP server on http://localhost:3333
```

---

## 👥 ÉTAPE 3 : Créer et Authentifier les Utilisateurs (3 min)

### 3.1 Enregistrer les Utilisateurs

Dans Postman, dossier **"1. Authentication"**, exécuter **dans l'ordre** :

1. ✅ **Register Admin**
2. ✅ **Register Transporteur 1**
3. ✅ **Register Transporteur 2**
4. ✅ **Register Affreteur**

**💡 Astuce :** Cliquer sur "Send" pour chaque requête. Vous devriez recevoir `"success": true`

### 3.2 Se Connecter et Récupérer les Tokens

Exécuter **dans l'ordre** :

5. ✅ **Login Transporteur 1** → Token automatiquement sauvegardé
6. ✅ **Login Transporteur 2** → Token automatiquement sauvegardé
7. ✅ **Login Affreteur** → Token automatiquement sauvegardé

**✅ Vérification :** Cliquer sur l'icône "👁️ œil" à côté de l'environnement en haut à droite. Vous devriez voir :

- `transporteur1_token` : eyJhbGciOiJIUzI1NiIs...
- `transporteur2_token` : eyJhbGciOiJIUzI1NiIs...
- `affreteur_token` : eyJhbGciOiJIUzI1NiIs...

---

## 🌐 ÉTAPE 4 : Connexions WebSocket (2 min)

### 4.1 Connecter Transporteur 1

1. Aller dans le dossier **"6. WebSocket Connections"**
2. Ouvrir **"WS - Transporteur 1"**
3. **Important :** Postman devrait automatiquement reconnaître l'URL WebSocket
4. Cliquer sur **"Connect"** (bouton bleu en bas)

**✅ Message de bienvenue attendu :**

```json
{
  "type": "connected",
  "message": "Connexion WebSocket établie",
  "user": {
    "email": "transporteur1@test.com",
    "role": "transporteur"
  }
}
```

### 4.2 Test Heartbeat (Ping/Pong)

1. Dans l'onglet **"Message"** en bas
2. Taper : `ping`
3. Cliquer **"Send"**

**✅ Réponse attendue :** `pong`

### 4.3 Connecter Transporteur 2

1. **Ouvrir un NOUVEL ONGLET** Postman (Ctrl+T ou Cmd+T)
2. Répéter les étapes 4.1 avec **"WS - Transporteur 2"**

**🎉 Vous avez maintenant 2 transporteurs connectés en temps réel !**

---

## 🚛 ÉTAPE 5 : Test de Broadcasting (2 min)

### 5.1 Créer une Mission

1. Retourner aux requêtes HTTP (nouvel onglet)
2. Dossier **"2. Missions"**
3. Exécuter **"Create Mission (Affreteur)"**

**✅ Vérification :** La réponse contient `"status": "draft"` et l'ID de la mission est sauvegardé automatiquement

### 5.2 Publier la Mission (🔥 Moment Magique 🔥)

1. Exécuter **"Publish Mission (WebSocket Test)"**

**🎉 RÉSULTAT :** Regardez vos 2 onglets WebSocket des transporteurs !

**✅ Vous devriez recevoir simultanément dans les 2 connexions :**

```json
{
  "type": "broadcast",
  "data": {
    "type": "mission:new",
    "data": {
      "id": "...",
      "titre": "Transport Douala → Yaoundé",
      "departureCity": "Douala",
      "arrivalCity": "Yaoundé",
      "budgetMin": 50000,
      "budgetMax": 75000
    }
  },
  "timestamp": "2025-01-10T..."
}
```

**🚀 FÉLICITATIONS ! Le broadcasting WebSocket fonctionne !**

---

## 💬 BONUS : Test du Chat en Temps Réel (optionnel, 3 min)

### B.1 Connecter l'Affreteur en WebSocket

1. **Nouvel onglet** Postman
2. Dossier **"6. WebSocket Connections"**
3. **"WS - Affreteur"** → **Connect**

### B.2 Créer une Conversation

1. Dossier **"3. Chat & Messages"**
2. Exécuter **"Create Direct Conversation"**

### B.3 Envoyer un Message

1. Exécuter **"Send Message (WebSocket Test)"**

**✅ Regardez l'onglet WebSocket de l'affreteur :** Vous recevez le message instantanément !

```json
{
  "type": "notification",
  "data": {
    "type": "chat:message",
    "data": {
      "message": {
        "content": "Bonjour ! Je suis intéressé...",
        "sender": {
          "firstName": "Jean",
          "lastName": "Transporteur"
        }
      }
    }
  }
}
```

---

## 📍 BONUS 2 : Test de Localisation GPS (optionnel, 2 min)

1. Dossier **"5. GPS Tracking"**
2. Exécuter **"Update Location (WebSocket Test)"**

**✅ L'affreteur reçoit la position en temps réel dans son WebSocket !**

---

## 📊 Résumé des Tests Réussis

Si vous avez suivi toutes les étapes, vous avez testé :

| Test | Description                    | Statut |
| ---- | ------------------------------ | ------ |
| ✅   | Authentification JWT           | Testé  |
| ✅   | Connexion WebSocket avec auth  | Testé  |
| ✅   | Heartbeat (ping/pong)          | Testé  |
| ✅   | Broadcasting aux transporteurs | Testé  |
| ✅   | Message chat en temps réel     | Testé  |
| ✅   | Localisation GPS en temps réel | Testé  |

---

## 🐛 Dépannage Rapide

### Erreur "Could not connect to WebSocket"

- ✅ Vérifier que le serveur est démarré (`npm run dev`)
- ✅ Vérifier l'URL : `ws://localhost:3333/ws/notifications`
- ✅ Vérifier que le token est bien dans les headers

### "WebSocket authentication failed"

- ✅ Re-exécuter le login pour obtenir un nouveau token
- ✅ Vérifier que le header `Authorization: Bearer <token>` est correct

### Les transporteurs ne reçoivent pas la notification

- ✅ Vérifier que les 2 WebSockets sont bien connectés (statut "Connected")
- ✅ Vérifier que la mission est bien au statut "published" (pas "draft")
- ✅ Regarder les logs du serveur pour voir le broadcasting

### Les logs du serveur pour confirmation

```
✅ WebSocket: transporteur1@test.com (transporteur) connecté
✅ WebSocket: Utilisateur uuid-1 (transporteur) enregistré. Total connexions: 1
✅ WebSocket: transporteur2@test.com (transporteur) connecté
✅ WebSocket: Utilisateur uuid-2 (transporteur) enregistré. Total connexions: 2

📡 WebSocket: Broadcasting aux transporteurs (2 connectés)
✅ WebSocket: Message envoyé à 2 transporteurs
```

---

## 🎓 Ce que Vous Avez Appris

✅ **WebSocket Authentication** : Authentification JWT via headers
✅ **Real-time Broadcasting** : Notifications simultanées à plusieurs clients
✅ **Role-based Targeting** : Messages ciblés par rôle (transporteur, affreteur)
✅ **Bidirectional Communication** : Ping/pong et messages du client vers le serveur
✅ **Multi-channel Notifications** : Base de données + Email + WebSocket

---

## 📖 Documentation Complète

Pour plus de détails et scénarios avancés, consultez :

- **POSTMAN_WEBSOCKET_GUIDE.md** : Guide exhaustif avec tous les cas d'usage

---

**🎉 Bravo ! Votre système WebSocket est pleinement fonctionnel ! 🚀**
