# 🧪 Données de Test - TSA Logistics API

## 📦 Collection Postman

**Fichier**: `postman-collection.json`

### Import dans Postman

1. Ouvrir Postman
2. Cliquer sur **Import**
3. Sélectionner le fichier `postman-collection.json`
4. La collection "TSA Logistics API - Authentication Tests" sera importée

## 👥 Utilisateurs de Test

### 🔑 Admin

```json
{
  "email": "admin@tsa-logistics.com",
  "password": "Admin123!",
  "firstName": "Admin",
  "lastName": "TSA",
  "phone": "+33612345678",
  "role": "admin"
}
```

- ✅ Accès complet à tous les endpoints
- 🔒 MFA obligatoire
- 🛡️ Toutes les permissions

### 🚛 Transporteur

```json
{
  "email": "transporteur@tsa-logistics.com",
  "password": "Transport123!",
  "firstName": "Jean",
  "lastName": "Transporteur",
  "phone": "+33612345679",
  "role": "transporteur"
}
```

- ✅ Accès aux routes `/api/transporteur/*`
- ❌ Refusé sur `/api/admin/*` et `/api/affreteur/*`
- 🚛 Gestion des courses et propositions

### 📦 Affreteur

```json
{
  "email": "affreteur@tsa-logistics.com",
  "password": "Affret123!",
  "firstName": "Marie",
  "lastName": "Affreteur",
  "phone": "+33612345680",
  "role": "affreteur"
}
```

- ✅ Accès aux routes `/api/affreteur/*`
- ❌ Refusé sur `/api/admin/*` et `/api/transporteur/*`
- 📦 Gestion des missions et expéditions

## 🧪 Scénarios de Test

### 1. **Tests d'Inscription (Registration)**

- ✅ Inscription admin
- ✅ Inscription transporteur
- ✅ Inscription affreteur
- ❌ Email déjà utilisé
- ❌ Données invalides

### 2. **Tests de Connexion (Login)**

- ✅ Login admin
- ✅ Login transporteur
- ✅ Login affreteur
- ❌ Credentials incorrects
- ❌ Compte inexistant
- 🔒 Login avec MFA (pour admin)

### 3. **Tests de Tokens**

- ✅ Génération token d'accès
- ✅ Génération token de rafraîchissement
- ✅ Refresh token
- ❌ Token expiré
- ❌ Token invalide

### 4. **Tests de Profil**

- ✅ Récupérer profil (GET /me)
- ✅ Mise à jour profil
- ✅ Changement mot de passe
- ❌ Mot de passe actuel incorrect

### 5. **Tests MFA (Multi-Factor Authentication)**

- ✅ Vérifier statut MFA
- ✅ Initialiser MFA (QR Code)
- ✅ Activer MFA
- ✅ Désactiver MFA
- ✅ Régénérer codes de récupération
- ❌ Code MFA invalide

### 6. **Tests de Permissions par Rôle**

- ✅ Admin → Accès à toutes les routes
- ❌ Transporteur → Refusé sur routes admin/affreteur
- ❌ Affreteur → Refusé sur routes admin/transporteur
- ❌ Sans token → Refusé sur toutes les routes protégées

### 7. **Tests d'Erreurs**

- ❌ 401 - Non authentifié
- ❌ 403 - Accès refusé (rôle insuffisant)
- ❌ 422 - Erreur de validation
- ❌ 429 - Rate limit dépassé

## 🚀 Lancement des Tests

### 1. Prérequis

```bash
# Démarrer le serveur AdonisJS
cd services/tsa-monolith
npm run dev

# Démarrer Redis
docker run -d -p 6379:6379 --name redis-tsa redis

# Démarrer le worker email (optionnel)
node ace email:worker
```

### 2. Variables d'Environnement Postman

La collection utilise ces variables automatiquement :

- `{{baseUrl}}`: http://localhost:3333
- `{{accessToken}}`: Auto-rempli après login
- `{{refreshToken}}`: Auto-rempli après login
- `{{adminId}}`: Auto-rempli après inscription admin
- `{{transporteurId}}`: Auto-rempli après inscription transporteur
- `{{affreteurId}}`: Auto-rempli après inscription affreteur

### 3. Ordre d'Exécution Recommandé

1. **Health Check** → Vérifier que l'API fonctionne
2. **Registrations** → Créer tous les utilisateurs de test
3. **Logins** → Tester les connexions
4. **Profile Tests** → Tester la gestion des profils
5. **MFA Tests** → Tester l'authentification à deux facteurs
6. **Permission Tests** → Vérifier les restrictions par rôle
7. **Error Tests** → Vérifier les cas d'erreur
8. **Logout** → Nettoyer les sessions

### 4. Scripts de Test Automatisés

Chaque requête inclut des **scripts de test** qui :

- ✅ Vérifient les codes de réponse HTTP
- ✅ Validèrent la structure des réponses JSON
- ✅ Extraient et sauvegardent automatiquement les tokens
- ✅ Vérifient les données métier (rôles, permissions, etc.)

## 📊 Collection Runner

Pour exécuter tous les tests automatiquement :

1. Cliquer sur la collection "TSA Logistics API"
2. Cliquer sur **Run**
3. Sélectionner toutes les requêtes
4. Cliquer sur **Run TSA Logistics API**
5. Observer les résultats des tests

## 🐛 Debugging

### Logs Utiles

```bash
# Logs du serveur AdonisJS
tail -f tmp/app.log

# Diagnostic système
node ace diagnose

# Logs Redis (si conteneur Docker)
docker logs redis-tsa
```

### Vérifications Manuelles

```bash
# Vérifier les utilisateurs créés
sqlite3 database/database.sqlite "SELECT email, role FROM users;"

# Vérifier les tokens actifs
sqlite3 database/database.sqlite "SELECT * FROM access_tokens WHERE revoked_at IS NULL;"

# Vérifier les logs d'audit
sqlite3 database/database.sqlite "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;"
```

## 🔧 Personnalisation

### Ajouter de Nouveaux Tests

1. Dupliquer une requête existante
2. Modifier l'URL et les données
3. Adapter les scripts de test
4. Tester individuellement puis en collection

### Variables Personnalisées

```javascript
// Dans les scripts Postman
pm.collectionVariables.set('maVariable', 'maValeur')
pm.environment.set('envVariable', 'valeur')
```

### Headers Automatiques

```javascript
// Ajouter un header à toutes les requêtes
pm.request.headers.add({
  key: 'X-Custom-Header',
  value: 'CustomValue',
})
```

---

**Bon testing ! 🚀**
