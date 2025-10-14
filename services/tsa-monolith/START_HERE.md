# 🚀 COMMENCEZ ICI - Tests WebSocket TSA Logistics

## ⚡ Démarrage en 3 Étapes (5 minutes)

### 1️⃣ Démarrer le Serveur

```bash
cd D:\TIL\tsa-innovlab\services\tsa-monolith
npm run dev
```

✅ **Vérification :** Vous devez voir `✅ WebSocket routes registered on /ws/*`

---

### 2️⃣ Importer dans Postman

**Méthode 1 - Glisser-Déposer (Recommandé)**

1. Ouvrir **Postman**
2. Cliquer **"Import"** en haut à gauche
3. Glisser ces 2 fichiers :
   - `TSA_WebSocket_Tests.postman_collection.json`
   - `TSA_WebSocket_Tests.postman_environment.json`
4. Sélectionner **"TSA WebSocket Tests Environment"** en haut à droite

**Méthode 2 - Depuis Postman**

1. Import → Files → Sélectionner les 2 fichiers JSON
2. Import → Activer l'environnement

---

### 3️⃣ Lancer le Test Rapide

**Dans Postman :**

#### A. Créer les utilisateurs (1 min)

Dossier **"1. Authentication"** → Exécuter dans l'ordre :

1. ✅ Register Admin
2. ✅ Register Transporteur 1
3. ✅ Register Transporteur 2
4. ✅ Register Affreteur

#### B. Se connecter (30 sec)

5. ✅ Login Transporteur 1
6. ✅ Login Transporteur 2
7. ✅ Login Affreteur

_(Les tokens sont automatiquement sauvegardés)_

#### C. Test WebSocket (2 min)

8. Dossier **"6. WebSocket Connections"**
9. **WS - Transporteur 1** → Cliquer **"Connect"**
10. **Nouvel onglet** → **WS - Transporteur 2** → **"Connect"**

#### D. Tester le Broadcasting (1 min)

11. Dossier **"2. Missions"**
12. **Create Mission (Affreteur)** → Send
13. **Publish Mission** → Send

**🎉 RÉSULTAT ATTENDU :**
Les 2 onglets WebSocket des transporteurs reçoivent simultanément :

```json
{
  "type": "broadcast",
  "data": {
    "type": "mission:new",
    "data": {
      "titre": "Transport Douala → Yaoundé",
      "budgetMin": 50000,
      "budgetMax": 75000
    }
  }
}
```

**✅ SUCCÈS ! Le système WebSocket fonctionne !**

---

## 📚 Documentation Disponible

### 🏃 Guides Rapides

| Fichier                        | Description              | Temps  |
| ------------------------------ | ------------------------ | ------ |
| **START_HERE.md** (ce fichier) | Démarrage ultra-rapide   | 5 min  |
| **POSTMAN_QUICK_START.md**     | Guide pas à pas détaillé | 10 min |

### 📖 Documentation Complète

| Fichier                          | Public                | Objectif                                  |
| -------------------------------- | --------------------- | ----------------------------------------- |
| **POSTMAN_WEBSOCKET_GUIDE.md**   | Testeurs              | Tous les scénarios de test (30 min)       |
| **README_WEBSOCKET.md**          | Développeurs Backend  | Architecture technique complète           |
| **WEBSOCKET_CLIENT_EXAMPLES.md** | Développeurs Frontend | Exemples de code pour React, Vue, Angular |
| **TESTS_POSTMAN_INDEX.md**       | Tous                  | Index de tous les fichiers                |

---

## 🎯 Prochaines Étapes

### Vous êtes Testeur ?

→ Consultez **POSTMAN_WEBSOCKET_GUIDE.md** pour tous les scénarios de test

### Vous êtes Développeur Backend ?

→ Lisez **README_WEBSOCKET.md** pour l'architecture complète

### Vous êtes Développeur Frontend ?

→ Consultez **WEBSOCKET_CLIENT_EXAMPLES.md** pour intégrer dans votre app

---

## 🧪 Tests Complémentaires (Optionnels)

### Test du Chat Temps Réel (3 min)

1. Dossier **"3. Chat & Messages"**
2. **Create Direct Conversation** → Send
3. Ouvrir **"WS - Affreteur"** → Connect (nouvel onglet)
4. **Send Message** → Send

**✅ L'affreteur reçoit le message instantanément dans son WebSocket**

### Test de Localisation GPS (2 min)

1. Dossier **"5. GPS Tracking"**
2. **Update Location** → Send

**✅ L'affreteur reçoit la position GPS en temps réel**

---

## 🐛 Dépannage Ultra-Rapide

### ❌ "Could not connect to WebSocket"

**Solution :** Vérifier que le serveur est démarré (`npm run dev`)

### ❌ "WebSocket authentication failed"

**Solution :** Re-exécuter les requêtes Login pour obtenir de nouveaux tokens

### ❌ "Pas de notification reçue après publish"

**Solutions :**

- Vérifier que les WebSockets sont bien connectés (statut "Connected")
- Vérifier que la mission est au statut "published" dans la réponse
- Regarder les logs du serveur

---

## 📊 Ce que Vous Allez Voir

### Dans Postman (WebSocket connecté)

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

### Dans les Logs Serveur

```
✅ WebSocket: transporteur1@test.com (transporteur) connecté
✅ WebSocket: Utilisateur uuid (transporteur) enregistré. Total connexions: 1
📡 WebSocket: Broadcasting aux transporteurs (2 connectés)
✅ WebSocket: Message envoyé à 2 transporteurs
```

---

## 🎓 Vous Avez Terminé ?

**Félicitations ! Vous avez :**

- ✅ Démarré le serveur WebSocket
- ✅ Créé des utilisateurs de test
- ✅ Connecté des clients WebSocket
- ✅ Testé le broadcasting en temps réel
- ✅ Validé que le système fonctionne

**🚀 Le système WebSocket TSA Logistics est opérationnel ! 🎉**

---

## 📞 Besoin d'Aide ?

### Consultez la Documentation

- **Démarrage :** POSTMAN_QUICK_START.md
- **Tests complets :** POSTMAN_WEBSOCKET_GUIDE.md
- **Architecture :** README_WEBSOCKET.md
- **Intégration Frontend :** WEBSOCKET_CLIENT_EXAMPLES.md

### Index Complet

→ **TESTS_POSTMAN_INDEX.md** : Tous les fichiers et leur utilisation

---

**🎯 Commencez maintenant en suivant les 3 étapes ci-dessus ! ⬆️**
