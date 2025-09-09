# CLAUDE.md - TSA Monolith Service

## 🏗️ Architecture du Service

**TSA Monolith** est le service d'API principal du système TSA Logistics, construit avec **AdonisJS v6** et **TypeScript**.

### Stack Technique
- **Framework**: AdonisJS v6
- **Runtime**: Node.js v22+ 
- **Language**: TypeScript (strict mode)
- **Base de données**: SQLite (dev) / PostgreSQL (prod)
- **Cache**: Redis avec ioredis
- **ORM**: Lucid ORM
- **Authentification**: JWT + Sessions + MFA
- **Email**: Queue Redis + Worker pattern
- **Validation**: VineJS

## 📁 Structure du Projet

```
app/
├── controllers/http/
│   └── Auth/auth_controller.ts     # Contrôleur d'authentification
├── middleware/
│   ├── auth_middleware.ts          # Middleware d'authentification
│   └── role_middleware.ts          # Middleware de gestion des rôles
├── models/
│   ├── user.ts                     # Modèle utilisateur avec rôles
│   ├── access_token.ts             # Tokens d'accès JWT
│   ├── refresh_token.ts            # Tokens de rafraîchissement
│   └── audit_log.ts                # Logs d'audit
├── services/
│   ├── auth_service.ts             # Service d'authentification
│   ├── cache_service.ts            # Service de cache Redis
│   ├── mfa_service.ts              # Service MFA/TOTP
│   ├── email_service.ts            # Service d'envoi d'emails
│   └── notification_service.ts     # Service de notifications
└── validators/
    └── auth_validator.ts           # Validateurs d'authentification

commands/
├── diagnose.ts                     # Commande de diagnostic système
└── email_worker.ts                 # Worker de traitement des emails

config/
├── auth.ts                         # Configuration authentification
├── database.ts                     # Configuration base de données
├── redis.ts                        # Configuration Redis
└── mail.ts                         # Configuration email
```

## 🚀 Commandes de Développement

### Installation et Configuration
```bash
npm install                    # Installer les dépendances
cp .env.example .env          # Configurer l'environnement
```

### Base de données
```bash
node ace migration:run        # Exécuter les migrations
node ace db:seed              # Peupler avec des données de test
```

### Développement
```bash
npm run dev                   # Démarrer le serveur de développement (port 3333)
npm run build                 # Construire pour la production
npm run typecheck             # Vérification TypeScript
npm run lint                  # ESLint
npm run format                # Prettier
```

### Tests
```bash
npm test                      # Lancer tous les tests (Japa framework)
npm run test:watch            # Tests en mode watch
```

### Services
```bash
node ace diagnose             # Diagnostic complet du système
node ace email:worker         # Lancer le worker d'emails
```

## 🔐 Système d'Authentification

### Rôles Utilisateurs
- **ADMIN**: Accès complet, MFA obligatoire
- **TRANSPORTEUR**: Gestion des courses, propositions  
- **AFFRETEUR**: Création de missions, gestion expéditions

### Endpoints d'Authentification

#### Authentification de base
```
POST /api/auth/login           # Connexion (avec support MFA automatique)
POST /api/auth/register        # Inscription avec MFA obligatoire pour admins
POST /api/auth/verify-email    # Vérification email après inscription
POST /api/auth/logout          # Déconnexion sécurisée
POST /api/auth/refresh-token   # Renouvellement token
GET  /api/auth/me             # Profil utilisateur
PUT  /api/auth/profile        # Mise à jour profil
PUT  /api/auth/change-password # Changement mot de passe
```

#### Exemples d'utilisation

**Inscription Admin :**
```json
POST /api/auth/register
{
  "email": "admin@tsa-logistics.com",
  "password": "admin123!",
  "firstName": "Admin",
  "lastName": "User", 
  "phone": "+33612345678",
  "role": "admin"
}
```

**Login avec MFA :**
```json
POST /api/auth/login
{
  "email": "admin@tsa-logistics.com",
  "password": "admin123!",
  "mfaToken": "123456"  // Code Google Authenticator
}
```

**Vérification Email :**
```json
POST /api/auth/verify-email
{
  "token": "TOKEN_FROM_EMAIL"
}
```

### Sécurité
- **JWT** avec rotation automatique des tokens
- **Rate limiting** sur les tentatives de connexion
- **MFA/TOTP** obligatoire pour les admins
- **Blacklisting** des tokens révoqués
- **Audit logs** complets
- **Hash** sécurisé des mots de passe (scrypt)

## 📊 Cache et Performance

### Redis
- **Sessions utilisateurs** (30min)
- **Rate limiting** (par IP/utilisateur)
- **Queue d'emails** asynchrone
- **Cache des données** (missions, produits, etc.)
- **Blacklist des tokens** révoqués

### Stratégies de Cache
```typescript
// Cache des sessions
await cacheService.setUserSession(userId, sessionData)

// Rate limiting
await cacheService.checkRateLimit(key, limit, window)

// Cache générique avec TTL
await cacheService.set(key, value, ttlSeconds)
```

## 📧 Système d'Email

### Architecture
- **Queue Redis**: Stockage temporaire des emails
- **Worker Pattern**: Traitement asynchrone
- **Templates Edge**: Rendu HTML des emails
- **Retry Logic**: Nouvelles tentatives automatiques
- **Dead Letter Queue**: Emails échoués définitivement

### Types d'emails
- Vérification d'email
- Réinitialisation mot de passe  
- Notifications MFA
- Bienvenue utilisateur
- Alerts administrateur

### Lancement du Worker
```bash
node ace email:worker
```

## 🔧 Configuration

### Variables d'Environnement
```bash
# Base de données
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_DATABASE=tsa-db

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# URLs
FRONTEND_URL=http://localhost:5173
MAIL_FROM=noreply@tsa-logistics.com
```

## 🧪 Tests et Diagnostic

### Diagnostic Système
```bash
node ace diagnose
```
Vérifie:
- ✅ Connexion Redis
- ✅ Configuration email
- ✅ Queue des emails
- ✅ Santé générale du système

### Tests d'Intégration
- Tests des endpoints d'auth
- Tests des middlewares de rôle
- Tests du système MFA
- Tests de cache Redis
- Tests du worker email

## 🚨 Monitoring

### Audit Logs
Toutes les actions critiques sont loggées:
- Connexions/déconnexions
- Changements de mot de passe
- Activation/désactivation MFA
- Actions d'administration

### Métriques Redis
- Nombre de sessions actives
- Taille des queues d'email
- Taux de rate limiting
- Performance du cache

## 🐛 Debug et Troubleshooting

### Problèmes Courants

**Redis ne se connecte pas:**
```bash
# Vérifier la configuration
node ace diagnose
# Vérifier Docker Redis
docker ps | grep redis
```

**Emails ne partent pas:**
```bash
# Vérifier la queue
node ace diagnose
# Lancer le worker
node ace email:worker
```

**Erreurs TypeScript:**
```bash
npm run typecheck
npm run build
```

### Logs
- **Application**: Logs AdonisJS dans `tmp/`
- **Audit**: Table `audit_logs` 
- **Emails**: Queue Redis `email_queue` et `email_failed_queue`

## 📚 Documentation API

### Format des Réponses
```json
{
  "success": boolean,
  "message": string,
  "data": object,
  "errors": string[]
}
```

### Codes d'Erreur
- **401**: Non authentifié
- **403**: Accès refusé (rôle insuffisant)
- **422**: Erreur de validation
- **429**: Rate limit dépassé

## 🔄 Workflow de Développement

1. **Créer une branche**: `git checkout -b feature/nouvelle-fonctionnalité`
2. **Développer**: Modifier le code + tests
3. **Vérifier**: `npm run typecheck && npm run lint && npm test`
4. **Commit**: Messages conventionnels
5. **PR**: Vers la branche `main`

---

*Ce service fait partie de l'écosystème TSA Logistics pour le concours TSA Contest 2025.*