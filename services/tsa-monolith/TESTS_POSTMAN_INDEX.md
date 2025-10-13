# 📦 Documentation Complète des Tests WebSocket

Bienvenue dans la documentation complète pour tester le système WebSocket de TSA Logistics avec Postman !

---

## 📁 Fichiers Disponibles

### 🚀 Pour Commencer (Essentiel)

| Fichier                                          | Description                         | Temps  |
| ------------------------------------------------ | ----------------------------------- | ------ |
| **POSTMAN_QUICK_START.md**                       | ⚡ Guide de démarrage rapide        | 10 min |
| **TSA_WebSocket_Tests.postman_collection.json**  | 📦 Collection Postman à importer    | -      |
| **TSA_WebSocket_Tests.postman_environment.json** | ⚙️ Environnement Postman à importer | -      |

### 📚 Documentation Complète

| Fichier                          | Description                                   | Public                |
| -------------------------------- | --------------------------------------------- | --------------------- |
| **POSTMAN_WEBSOCKET_GUIDE.md**   | 📖 Guide exhaustif avec tous les scénarios    | Testeurs              |
| **README_WEBSOCKET.md**          | 📡 Architecture et fonctionnalités WebSocket  | Développeurs          |
| **WEBSOCKET_CLIENT_EXAMPLES.md** | 💻 Exemples de code pour intégration frontend | Développeurs Frontend |

---

## 🎯 Parcours Recommandés

### Pour les Testeurs (QA)

```
1️⃣ Lire : POSTMAN_QUICK_START.md (10 min)
2️⃣ Importer : Collection + Environnement Postman
3️⃣ Tester : Suivre le guide pas à pas
4️⃣ Approfondir : POSTMAN_WEBSOCKET_GUIDE.md (si besoin)
```

**⏱️ Temps total : 15-20 minutes**

### Pour les Développeurs Backend

```
1️⃣ Lire : README_WEBSOCKET.md (architecture complète)
2️⃣ Consulter : POSTMAN_QUICK_START.md (tests rapides)
3️⃣ Code : app/services/websocket_service.ts
```

**⏱️ Temps total : 30 minutes**

### Pour les Développeurs Frontend

```
1️⃣ Lire : WEBSOCKET_CLIENT_EXAMPLES.md (exemples de code)
2️⃣ Tester : POSTMAN_QUICK_START.md (comprendre le protocole)
3️⃣ Intégrer : Choisir un exemple (React, Vue, Angular, etc.)
```

**⏱️ Temps total : 45 minutes**

---

## 🚀 Démarrage Ultra-Rapide (5 minutes)

### Étape 1 : Démarrer le serveur

```bash
cd D:\TIL\tsa-innovlab\services\tsa-monolith
npm run dev
```

### Étape 2 : Importer dans Postman

1. Ouvrir Postman
2. Import → `TSA_WebSocket_Tests.postman_collection.json`
3. Import → `TSA_WebSocket_Tests.postman_environment.json`
4. Sélectionner l'environnement en haut à droite

### Étape 3 : Créer les utilisateurs

Dossier "1. Authentication" → Exécuter dans l'ordre :

- Register Admin
- Register Transporteur 1
- Register Transporteur 2
- Register Affreteur
- Login Transporteur 1
- Login Transporteur 2
- Login Affreteur

### Étape 4 : Test WebSocket

1. Dossier "6. WebSocket Connections"
2. Ouvrir "WS - Transporteur 1" → Connect
3. Ouvrir "WS - Transporteur 2" → Connect (nouvel onglet)
4. Dossier "2. Missions" → Create Mission → Publish Mission

**✅ Les 2 transporteurs reçoivent la notification en temps réel !**

---

## 📊 Contenu de Chaque Fichier

### 1. POSTMAN_QUICK_START.md

**Objectif** : Tester le système en 10 minutes

**Contenu :**

- ✅ Import de la collection Postman
- ✅ Création des utilisateurs de test
- ✅ Authentification et récupération des tokens
- ✅ Connexion WebSocket
- ✅ Test de broadcasting aux transporteurs
- ✅ Test du chat en temps réel
- ✅ Test de localisation GPS
- ✅ Dépannage rapide

**Idéal pour :** QA, Product Managers, Démos

---

### 2. POSTMAN_WEBSOCKET_GUIDE.md

**Objectif** : Guide exhaustif avec tous les détails

**Contenu :**

- 📋 Prérequis complets
- 👤 Création détaillée des utilisateurs
- 🔐 Processus d'authentification
- 🌐 Connexion WebSocket avec headers
- 🧪 Heartbeat (ping/pong)
- 📢 Broadcasting par rôle
- 🔔 Notifications ciblées
- 💬 Messages chat temps réel
- 📍 Suivi GPS en temps réel
- 🔍 Vérifications et diagnostics
- 🐛 Dépannage complet
- 🎯 Scénario de test complet (30 min)

**Idéal pour :** Testeurs expérimentés, Documentation exhaustive

---

### 3. README_WEBSOCKET.md

**Objectif** : Documentation technique complète du système

**Contenu :**

- 🏗️ Architecture WebSocket (diagrammes)
- 💡 Fonctionnalités implémentées
- 📨 Types de messages WebSocket (tous les formats)
- 🔧 Services implémentés (API complète)
- 🛠️ Intégration dans les contrôleurs
- 🧪 Scénarios de test couverts
- 📊 Monitoring et logs
- 🔒 Sécurité (authentification, isolation)
- 🚀 Prochaines améliorations
- 📚 Ressources utiles

**Idéal pour :** Développeurs Backend, Architectes, Revue de code

---

### 4. WEBSOCKET_CLIENT_EXAMPLES.md

**Objectif** : Exemples de code pour intégration frontend

**Contenu :**

- 📱 JavaScript Vanilla (Browser)
- ⚛️ React + TypeScript (Hook custom)
- 📱 React Native
- 🐍 Python Client
- 🌍 Vue.js 3 (Composition API)
- 🔧 Angular
- 🛠️ Gestion d'erreurs avancée
- 📝 Notes sur l'authentification
- 🎯 Checklist d'intégration

**Idéal pour :** Développeurs Frontend, Intégration mobile

---

### 5. TSA_WebSocket_Tests.postman_collection.json

**Objectif** : Collection Postman prête à l'emploi

**Contenu :**

- 📁 1. Authentication (8 requêtes)
  - Register Admin, Transporteurs, Affreteur
  - Login avec sauvegarde automatique des tokens
- 📁 2. Missions (3 requêtes)
  - Create Mission
  - Publish Mission (Test WebSocket)
  - Get Available Missions
- 📁 3. Chat & Messages (3 requêtes)
  - Create Direct Conversation
  - Send Message (Test WebSocket)
  - Get Messages
- 📁 4. Notifications (2 requêtes)
  - Get My Notifications
  - Mark Notification as Read
- 📁 5. GPS Tracking (1 requête)
  - Update Location (Test WebSocket)
- 📁 6. WebSocket Connections (3 connexions)
  - WS - Transporteur 1
  - WS - Transporteur 2
  - WS - Affreteur

**Scripts automatiques :**

- ✅ Extraction automatique des tokens après login
- ✅ Sauvegarde automatique des IDs (mission, conversation)
- ✅ Variables d'environnement dynamiques

---

### 6. TSA_WebSocket_Tests.postman_environment.json

**Objectif** : Variables d'environnement pré-configurées

**Variables :**

```
base_url: http://localhost:3333
ws_url: ws://localhost:3333
transporteur1_token: (auto-rempli)
transporteur1_id: (auto-rempli)
transporteur2_token: (auto-rempli)
transporteur2_id: (auto-rempli)
affreteur_token: (auto-rempli)
affreteur_id: (auto-rempli)
admin_token: (auto-rempli)
admin_id: (auto-rempli)
mission_id: (auto-rempli)
conversation_id: (auto-rempli)
```

---

## 🎓 Cas d'Usage par Profil

### 👨‍💼 Product Manager / Business

**Objectif :** Valider que les fonctionnalités temps réel fonctionnent

**Fichiers à utiliser :**

1. POSTMAN_QUICK_START.md
2. Collection Postman

**Scénario de démo (5 min) :**

- Créer 2 transporteurs
- Les connecter en WebSocket
- Publier une mission
- Observer la réception instantanée chez les 2 transporteurs

---

### 🧪 QA / Testeur

**Objectif :** Tester tous les scénarios et vérifier la qualité

**Fichiers à utiliser :**

1. POSTMAN_QUICK_START.md (démarrage)
2. POSTMAN_WEBSOCKET_GUIDE.md (tests complets)
3. Collection Postman

**Plan de test (30 min) :**

- Test de broadcasting (nouvelle mission)
- Test de messages ciblés (chat)
- Test de localisation GPS
- Test de reconnexion
- Test de déconnexion propre
- Vérification des logs serveur

---

### 👨‍💻 Développeur Backend

**Objectif :** Comprendre l'architecture et débugger

**Fichiers à utiliser :**

1. README_WEBSOCKET.md (architecture complète)
2. POSTMAN_QUICK_START.md (tests rapides)
3. Code source : app/services/websocket_service.ts

**Tâches :**

- Comprendre WebSocketService
- Analyser les logs de broadcasting
- Ajouter de nouveaux types de messages
- Optimiser les performances

---

### 🎨 Développeur Frontend

**Objectif :** Intégrer WebSocket dans l'application

**Fichiers à utiliser :**

1. WEBSOCKET_CLIENT_EXAMPLES.md (exemples de code)
2. POSTMAN_QUICK_START.md (comprendre le protocole)
3. README_WEBSOCKET.md (types de messages)

**Étapes :**

1. Choisir l'exemple adapté (React, Vue, Angular, etc.)
2. Implémenter le hook/service WebSocket
3. Gérer les messages entrants
4. Afficher les notifications UI
5. Tester avec Postman en parallèle

---

## 🔍 Recherche Rapide

### "Je veux tester rapidement"

→ **POSTMAN_QUICK_START.md** (10 min)

### "Je veux tout comprendre en détail"

→ **POSTMAN_WEBSOCKET_GUIDE.md** (30 min)

### "Je veux comprendre l'architecture"

→ **README_WEBSOCKET.md** (lecture 20 min)

### "Je veux intégrer dans React"

→ **WEBSOCKET_CLIENT_EXAMPLES.md** → Section React (code + explications)

### "Je veux voir le code serveur"

→ `app/services/websocket_service.ts`

### "Je veux tester sans lire de doc"

→ Importer la collection Postman → Suivre les descriptions dans chaque requête

---

## ✅ Checklist de Validation Complète

### Tests Fonctionnels

- [ ] Connexion WebSocket avec authentification réussie
- [ ] Heartbeat (ping/pong) fonctionne
- [ ] Broadcasting aux transporteurs (nouvelle mission)
- [ ] Message chat ciblé (1-to-1)
- [ ] Localisation GPS en temps réel
- [ ] Notification système
- [ ] Reconnexion automatique après déconnexion
- [ ] Fermeture propre de connexion

### Tests Non-Fonctionnels

- [ ] Latence < 50ms pour broadcasting
- [ ] Plusieurs connexions simultanées (10+)
- [ ] Reconnexion après perte réseau
- [ ] Gestion de déconnexion brutale
- [ ] Logs serveur corrects et détaillés
- [ ] Pas de fuite mémoire (connexions bien nettoyées)

### Sécurité

- [ ] Authentification JWT obligatoire
- [ ] Fermeture immédiate si token invalide
- [ ] Isolation par rôle (transporteurs vs affreteurs)
- [ ] Pas de fuite d'information entre utilisateurs

---

## 🆘 Support et Dépannage

### Problème fréquent #1 : "Could not connect to WebSocket"

**Solutions :**

1. Vérifier que le serveur est démarré : `npm run dev`
2. Vérifier l'URL : `ws://localhost:3333/ws/notifications`
3. Vérifier que le token est dans les headers

**Fichiers à consulter :**

- POSTMAN_QUICK_START.md → Section "Dépannage Rapide"
- POSTMAN_WEBSOCKET_GUIDE.md → Section "Dépannage"

---

### Problème fréquent #2 : "Pas de notification reçue"

**Solutions :**

1. Vérifier que la WebSocket est bien connectée (statut "Connected")
2. Vérifier que la mission est au statut `published` (pas `draft`)
3. Regarder les logs serveur pour voir le broadcasting

**Logs attendus :**

```
📡 WebSocket: Broadcasting aux transporteurs (2 connectés)
✅ WebSocket: Message envoyé à 2 transporteurs
```

---

### Problème fréquent #3 : "Token invalide"

**Solutions :**

1. Re-exécuter le login pour obtenir un nouveau token
2. Vérifier le format : `Bearer <token>` (avec espace)
3. Vérifier que le token n'a pas expiré (7 jours par défaut)

---

## 📞 Contact et Contribution

### Signaler un Bug

Créer une issue avec :

- Description du problème
- Étapes pour reproduire
- Logs serveur
- Version de Postman

### Suggérer une Amélioration

- Nouveau type de message WebSocket
- Nouvel exemple de code client
- Amélioration de la documentation

---

## 📈 Métriques de Réussite

### Tests Passés avec Succès

Si vous avez suivi **POSTMAN_QUICK_START.md** et que tous les tests sont passés :

✅ **Broadcasting** : 2/2 transporteurs reçoivent la notification
✅ **Chat** : Message reçu instantanément
✅ **GPS** : Position mise à jour en temps réel
✅ **Heartbeat** : Ping/Pong fonctionne
✅ **Latence** : < 50ms

**🎉 Félicitations ! Votre système WebSocket est 100% fonctionnel ! 🚀**

---

## 🗺️ Roadmap

### Prochaines Fonctionnalités à Tester

- [ ] Notifications push mobiles (Firebase Cloud Messaging)
- [ ] Compression des messages (gzip)
- [ ] Rooms WebSocket par mission
- [ ] Streaming de fichiers binaires
- [ ] Dashboard de monitoring temps réel

---

**📦 Documentation complète et tests Postman prêts à l'emploi ! 🚀**
