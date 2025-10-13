# 🧪 Tests du Système de Chat - Guide Complet

## 📁 Fichiers de Tests Créés

### Tests Unitaires
```
tests/unit/services/conversation_authorization_service.spec.ts
```
**Couverture :** 16 tests
- ✅ Règles d'autorisation conversations directes (Admin-Affreteur, Admin-Transporteur, etc.)
- ✅ Règles d'autorisation conversations mission
- ✅ Validation des participants liés aux missions
- ✅ Messages d'erreur explicites

---

### Tests Fonctionnels
```
tests/functional/conversations.spec.ts  (26 tests)
tests/functional/messages.spec.ts       (23 tests)
```

**API Conversations :**
- ✅ GET `/api/common/conversations` - Liste et pagination
- ✅ GET `/api/common/conversations/:id` - Détails conversation
- ✅ POST `/api/common/conversations/direct` - Création conversation directe
- ✅ POST `/api/common/conversations/mission` - Création conversation mission
- ✅ GET `/api/common/conversations/search/users` - Recherche utilisateurs
- ✅ Tests d'autorisation (Admin/Affreteur/Transporteur)
- ✅ Tests de validation des règles métier

**API Messages :**
- ✅ GET `/api/common/conversations/:id/messages` - Liste messages
- ✅ POST `/api/common/conversations/:id/messages` - Envoi message
- ✅ PUT `/api/common/messages/:id/read` - Marquer message lu
- ✅ PUT `/api/common/conversations/:id/messages/read-all` - Marquer tous lus
- ✅ GET `/api/common/messages/unread-count` - Compteur non lus
- ✅ POST `/api/common/conversations/:id/typing` - Indicateur typing
- ✅ Tests de pagination
- ✅ Tests de validation
- ✅ Tests d'accès et permissions

---

## 🚀 Exécution des Tests

### Tous les Tests
```bash
npm run test
```

### Tests Unitaires Uniquement
```bash
npm run test -- --group=unit
```

### Tests Fonctionnels Uniquement
```bash
npm run test -- --group=functional
```

### Tests Spécifiques au Chat
```bash
# Tests d'autorisation
npm run test -- tests/unit/services/conversation_authorization_service.spec.ts

# Tests API Conversations
npm run test -- tests/functional/conversations.spec.ts

# Tests API Messages
npm run test -- tests/functional/messages.spec.ts
```

### Mode Watch (Développement)
```bash
npm run test:watch
```

---

## 📊 Couverture des Tests

### Résumé par Composant

| Composant | Tests | Statut |
|-----------|-------|--------|
| **ConversationAuthorizationService** | 16 | ✅ Complet |
| **ConversationsController** | 26 | ✅ Complet |
| **MessagesController** | 23 | ✅ Complet |
| **WebSocketService** | - | ⚠️ Tests manuels recommandés |
| **Total** | **65 tests** | **✅ Prêt** |

---

## 🎯 Scénarios de Test Couverts

### ✅ Scénario 1 : Admin crée conversation avec Affreteur
```typescript
test('Admin should create direct conversation with Affreteur')
```
**Vérifie :**
- Autorisation Admin → Affreteur
- Création de conversation type "direct"
- Retour HTTP 200

---

### ✅ Scénario 2 : Affreteur tente conversation directe avec Transporteur (REFUSÉ)
```typescript
test('Affreteur should NOT create direct conversation with Transporteur')
```
**Vérifie :**
- Blocage Affreteur → Transporteur
- Retour HTTP 403
- Message d'erreur explicite

---

### ✅ Scénario 3 : Affreteur crée conversation mission avec Transporteur (AUTORISÉ)
```typescript
test('Should create mission conversation when users are linked')
```
**Vérifie :**
- Autorisation via mission
- Validation des participants liés
- Création conversation type "mission"

---

### ✅ Scénario 4 : Envoi et lecture de messages
```typescript
test('should send a message')
test('should mark single message as read')
```
**Vérifie :**
- Envoi de message
- Validation du contenu
- Marquage comme lu
- Mise à jour lastActivityAt

---

### ✅ Scénario 5 : Indicateur "en train d'écrire"
```typescript
test('should send typing indicator')
```
**Vérifie :**
- Envoi indicateur isTyping: true/false
- Vérification des permissions

---

## 🔍 Tests de Validation

### Validations Testées

| Validation | Test | Résultat Attendu |
|------------|------|------------------|
| **Message vide** | `should reject empty message` | HTTP 422 |
| **Message trop long (>5000)** | `should reject very long message` | HTTP 422 |
| **Conversation avec soi-même** | `should return 400 if trying to create conversation with self` | HTTP 400 |
| **Utilisateur non participant** | `should return 403 if user is not participant` | HTTP 403 |
| **Marquer ses propres messages lus** | `should not allow marking own message as read` | HTTP 400 |

---

## 🐛 Tests de Sécurité

### Tests d'Isolation

```typescript
// Utilisateur non participant ne peut pas accéder
test('should return 403 if user is not participant')

// Utilisateur non lié à la mission ne peut pas créer conversation
test('Should reject mission conversation if users not linked')

// Résultats de recherche n'incluent pas l'utilisateur courant
test('Should not return current user in search')
```

---

## 📈 Métriques Attendues

### Temps d'Exécution
- Tests unitaires : ~2-5 secondes
- Tests fonctionnels : ~10-20 secondes
- **Total : ~30 secondes**

### Taux de Réussite
- **Objectif : 100%** (65/65 tests)

---

## 🔧 Dépannage

### Problème : Tests échouent avec "router.ws is not a function"
**Solution :** Déjà corrigé ! La route WebSocket est conditionnée :
```typescript
if (typeof router.ws === 'function') {
  // Routes WebSocket
}
```

### Problème : Erreurs de base de données
**Solution :** Les tests utilisent des transactions globales qui sont automatiquement rollback.
```typescript
group.setup(async () => {
  await Database.beginGlobalTransaction()
})

group.teardown(async () => {
  await Database.rollbackGlobalTransaction()
})
```

### Problème : Tests lents
**Solution :** Utiliser `--force-exit` :
```bash
npm run test -- --force-exit
```

---

## 🧪 Tests Manuels Recommandés (WebSocket)

Le WebSocket est difficile à tester automatiquement. Tests manuels recommandés :

### 1. Test de Connexion
```bash
npx wscat -c "ws://localhost:3333/ws/notifications"
```

### 2. Test de Message en Temps Réel
1. Ouvrir 2 terminaux avec `wscat`
2. Se connecter avec 2 utilisateurs différents
3. Envoyer message via API REST
4. Vérifier réception WebSocket

### 3. Test Heartbeat
```
Connected (press CTRL+C to quit)
> ping
< pong
```

---

## 📝 Commandes Rapides

```bash
# Lancer tous les tests du chat
npm run test -- tests/unit/services/conversation_authorization_service.spec.ts tests/functional/conversations.spec.ts tests/functional/messages.spec.ts

# Avec verbosité
npm run test -- --verbose

# Avec timeout augmenté
npm run test -- --timeout=60000

# Seulement les tests qui ont échoué
npm run test -- --failed

# Générer rapport de couverture (si configuré)
npm run test -- --coverage
```

---

## ✅ Checklist Avant Déploiement

- [ ] Tous les tests unitaires passent (16/16)
- [ ] Tous les tests fonctionnels passent (49/49)
- [ ] TypeScript compile sans erreur (`npm run typecheck`)
- [ ] Linter passe (`npm run lint`)
- [ ] Tests manuels WebSocket effectués
- [ ] Documentation à jour (CHAT_SYSTEM.md)

---

## 📚 Ressources

- **Documentation complète :** [CHAT_SYSTEM.md](./CHAT_SYSTEM.md)
- **Référence rapide :** [CHAT_QUICK_REFERENCE.md](./CHAT_QUICK_REFERENCE.md)
- **Documentation Japa :** https://japa.dev/docs

---

**Tests créés le :** 2025-01-15
**Framework :** Japa v4
**Couverture totale :** 65 tests
