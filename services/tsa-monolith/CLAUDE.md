# CLAUDE.md - TSA Monolith Service

## 🏗️ Architecture du Service

**TSA Monolith** est le service d'API principal du système TSA Logistics, construit avec **AdonisJS v6** et **TypeScript**.

### Stack Technique

- **Framework**: AdonisJS v6
- **Runtime**: Node.js v22+
- **Language**: TypeScript (strict mode)
- **Base de données**: PostgreSQL (prod) /
- **Cache**: Redis avec ioredis
- **ORM**: Lucid ORM
- **Authentification**: JWT + Sessions + MFA/TOTP
- **Email**: Queue Redis + Worker pattern
- **Validation**: VineJS

## 📁 Structure Actuelle du Projet

### ✅ Contrôleurs Implémentés (6/20+)

```
app/controllers/http/
├── Auth/
│   └── auth_controller.ts           # ✅ Authentification complète + MFA
├── Admin/
│   ├── categories_controller.ts     # ✅ Gestion catégories CRUD
│   ├── products_controller.ts       # ✅ Gestion produits CRUD
│   └── missions_controller.ts       # ✅ Gestion missions admin CRUD + stats
├── Affreteur/
│   └── missions_controller.ts       # ✅ Gestion missions affreteur + publication
└── Transporteur/
    └── missions_controller.ts       # ✅ Missions disponibles + suivi
```

### ❌ Contrôleurs Manquants (Routes définies mais pas d'implémentation)

```
app/controllers/http/
├── Admin/                          # Partiellement implémenté
│   ├── dashboard_controller.ts     # ❌ Dashboard admin
│   ├── users_controller.ts         # ❌ Gestion utilisateurs
│   ├── audit_logs_controller.ts    # ❌ Logs d'audit
│   └── stats_controller.ts         # ❌ Statistiques globales
├── Affreteur/                      # Partiellement implémenté
│   ├── propositions_controller.ts  # ❌ Propositions reçues
│   └── shipments_controller.ts     # ❌ Expéditions/suivi
├── Transporteur/                   # Partiellement implémenté
│   └── propositions_controller.ts  # ❌ Candidatures/postulations
├── Shop/                          # ❌ Dossier manquant - 0% implémenté
│   ├── products_controller.ts     # ❌ Boutique produits
│   └── categories_controller.ts   # ❌ Boutique catégories
└── Common/                        # ❌ Dossier manquant - 0% implémenté
    ├── messages_controller.ts     # ❌ Messagerie
    └── notifications_controller.ts # ❌ Notifications
```

### ✅ Modèles Complets (11/11)

```
app/models/
├── user.ts                     # Utilisateurs avec rôles (admin, transporteur, affreteur)
├── access_token.ts             # Tokens d'accès JWT
├── refresh_token.ts            # Tokens de rafraîchissement
├── mfa_recovery_code.ts        # Codes de récupération MFA
├── audit_log.ts                # Logs d'audit des actions
├── address.ts                  # Adresses géographiques
├── mission.ts                  # Missions de transport
├── proposition.ts              # Propositions des transporteurs
├── category.ts                 # Catégories de produits
├── product.ts                  # Produits avec stock
└── stock_movement.ts           # Mouvements de stock
```

### ✅ Services Métier Complets (5/5)

```
app/services/
├── auth_service.ts             # Authentification avec MFA/TOTP
├── cache_service.ts            # Cache Redis + rate limiting
├── email_service.ts            # Envoi d'emails + queue worker
├── mfa_service.ts              # Multi-factor authentication
└── notification_service.ts     # Système de notifications
```

### ✅ Middlewares (4)

```
app/middleware/
├── auth_middleware.ts                # Authentification JWT
├── role_middleware.ts                # Contrôle d'accès par rôles
├── container_bindings_middleware.ts  # Injections de dépendances
└── force_json_response_middleware.ts # Forcer réponses JSON
```

### ✅ Validateurs (4)

```
app/validators/
├── auth_validator.ts           # Validation authentification
├── category_validator.ts       # Validation catégories
├── product_validator.ts        # Validation produits
└── mission_validator.ts        # Validation missions
```

### ✅ Commandes Ace (8)

```
commands/
├── check_time.ts                    # Vérification horodatage
├── cleanup_inconsistent_users.ts   # Nettoyage utilisateurs incohérents
├── create_test_users.ts            # Création utilisateurs de test
├── diagnose.ts                      # Diagnostic système complet
├── email_worker.ts                  # Worker de traitement des emails
├── test_email.ts                    # Test d'envoi d'emails
├── test_mfa.ts                      # Test MFA/TOTP
└── unlock_user.ts                   # Déblocage utilisateur
```

### ✅ Configuration Complète (9 configs)

```
config/
├── app.ts                      # Configuration application
├── auth.ts                     # Configuration authentification JWT
├── bodyparser.ts               # Parser de requêtes
├── cors.ts                     # Configuration CORS
├── database.ts                 # Configuration PostgreSQL
├── hash.ts                     # Configuration hachage mots de passe
├── logger.ts                   # Configuration logs
├── mail.ts                     # Configuration SMTP
└── redis.ts                    # Configuration Redis
```

## 🚀 Commandes de Développement

### Installation et Configuration

```bash
npm install                    # Installer les dépendances
cp .env.example .env          # Configurer l'environnement
```

### Base de données

```bash
node ace migration:run        # Exécuter les migrations (13 migrations)
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

### Services et Diagnostic

```bash
node ace diagnose             # Diagnostic complet du système
node ace email:worker         # Lancer le worker d'emails
node ace test:email           # Test d'envoi d'emails
node ace test:mfa             # Test MFA/TOTP
node ace create:test-users    # Créer utilisateurs de test
```

### 🐳 Docker

```bash
# Créer et lancer avec Docker
docker build -t tsa-monolith .
docker run -d --name tsa-app --env-file .env.docker -p 3333:3333 tsa-monolith

# Le Dockerfile lance automatiquement :
# - Migrations (node ace migration:run --force)
# - Seeds (node ace db:seed --force)
# - Email worker (node ace email:worker &)
# - Application principale (node build/bin/server.js)
```

## 🛣️ Routes API - État d'Implémentation

### ✅ Authentification (100% Implémenté)

```
POST /api/auth/login            # Connexion (avec support MFA automatique)
POST /api/auth/register         # Inscription avec MFA obligatoire pour admins
POST /api/auth/verify-email     # Vérification email après inscription
POST /api/auth/forgot-password  # Mot de passe oublié
POST /api/auth/reset-password   # Réinitialisation mot de passe
POST /api/auth/refresh-token    # Renouvellement token
GET  /api/auth/me              # Profil utilisateur
PUT  /api/auth/profile         # Mise à jour profil
PUT  /api/auth/change-password # Changement mot de passe
POST /api/auth/logout          # Déconnexion sécurisée

# MFA (Multi-Factor Authentication)
GET  /api/auth/mfa/status      # Statut MFA utilisateur
POST /api/auth/mfa/initialize  # Initialisation MFA (QR code)
POST /api/auth/mfa/enable      # Activation MFA
POST /api/auth/mfa/disable     # Désactivation MFA
POST /api/auth/mfa/regenerate-codes # Régénération codes de récupération
```

### ✅ Admin - Produits & Catégories (100% Implémenté)

```
# Gestion Produits
GET    /api/admin/products              # Liste produits paginée
POST   /api/admin/products              # Créer produit
GET    /api/admin/products/stats        # Statistiques produits
GET    /api/admin/products/low-stock    # Produits stock faible
POST   /api/admin/products/bulk         # Import en lot
GET    /api/admin/products/:id          # Détails produit
PUT    /api/admin/products/:id          # Modifier produit
DELETE /api/admin/products/:id          # Supprimer produit

# Gestion Catégories
GET    /api/admin/categories            # Liste catégories
POST   /api/admin/categories            # Créer catégorie
GET    /api/admin/categories/tree       # Arbre hiérarchique
GET    /api/admin/categories/:id        # Détails catégorie
PUT    /api/admin/categories/:id        # Modifier catégorie
DELETE /api/admin/categories/:id        # Supprimer catégorie
```

### ✅ Admin - Missions (100% Implémenté)

```
# Gestion Missions Admin
GET    /api/admin/missions            # ✅ Liste toutes les missions avec filtres
POST   /api/admin/missions            # ✅ Créer mission pour affreteur
GET    /api/admin/missions/stats      # ✅ Statistiques missions globales
GET    /api/admin/missions/:id        # ✅ Détails mission
PUT    /api/admin/missions/:id/status # ✅ Changer statut mission
```

### ❌ Admin - Fonctionnalités Manquantes

```
GET    /api/admin/dashboard            # ❌ Dashboard admin
GET    /api/admin/users               # ❌ Gestion utilisateurs
GET    /api/admin/users/:id           # ❌ Détails utilisateur
PUT    /api/admin/users/:id           # ❌ Modifier utilisateur
DELETE /api/admin/users/:id           # ❌ Supprimer utilisateur
GET    /api/admin/audit-logs          # ❌ Logs d'audit
GET    /api/admin/stats/*             # ❌ Statistiques globales
```

### ✅ Routes Affreteur - Missions (100% Implémenté)

```
# Gestion Missions Affreteur
GET    /api/affreteur/missions                    # ✅ Mes missions avec filtres
POST   /api/affreteur/missions                    # ✅ Créer mission (statut DRAFT)
GET    /api/affreteur/missions/:id               # ✅ Détails mission
PUT    /api/affreteur/missions/:id               # ✅ Modifier mission
DELETE /api/affreteur/missions/:id               # ✅ Supprimer mission
POST   /api/affreteur/missions/:id/publish       # ✅ Publier mission (DRAFT→PUBLISHED)
POST   /api/affreteur/missions/:id/unpublish     # ✅ Dépublier mission (PUBLISHED→DRAFT)
```

### ❌ Routes Affreteur - Fonctionnalités Manquantes

```
GET    /api/affreteur/missions/:id/propositions  # ❌ Propositions reçues
POST   /api/affreteur/missions/:missionId/propositions/:id/accept # ❌ Accepter
POST   /api/affreteur/missions/:missionId/propositions/:id/reject # ❌ Rejeter
GET    /api/affreteur/shipments                  # ❌ Mes expéditions
GET    /api/affreteur/shipments/:id/tracking     # ❌ Suivi expédition
```

### ✅ Routes Transporteur - Missions (100% Implémenté)

```
# Missions Disponibles et Suivi
GET    /api/transporteur/missions/available      # ✅ Missions PUBLISHED uniquement
GET    /api/transporteur/missions/:id            # ✅ Détails mission publique
GET    /api/transporteur/my-missions             # ✅ Mes missions assignées
PUT    /api/transporteur/missions/:id/status    # ✅ Mettre à jour statut mission
POST   /api/transporteur/missions/:id/location  # ✅ Localisation GPS temps réel
POST   /api/transporteur/missions/:id/proof     # ✅ Preuve de livraison
```

### ❌ Routes Transporteur - Fonctionnalités Manquantes

```
POST   /api/transporteur/missions/:id/apply     # ❌ Postuler/candidater mission
GET    /api/transporteur/my-propositions        # ❌ Mes candidatures
```

### ❌ Routes Boutique (0% Implémenté)

```
GET    /api/shop/products           # ❌ Catalogue produits
GET    /api/shop/products/:id       # ❌ Détails produit
GET    /api/shop/categories         # ❌ Catégories boutique
GET    /api/shop/search             # ❌ Recherche produits
```

### ❌ Routes Communes (0% Implémenté)

```
GET    /api/common/messages         # ❌ Messagerie
POST   /api/common/messages         # ❌ Envoyer message
PUT    /api/common/messages/:id/read # ❌ Marquer lu
GET    /api/common/notifications    # ❌ Notifications
PUT    /api/common/notifications/:id/read # ❌ Marquer notification lue
PUT    /api/common/notifications/read-all # ❌ Tout marquer lu
```

## 📊 État d'Avancement du Projet

### ✅ Fonctionnalités Complètes

- **Authentification complète** avec JWT + MFA/TOTP ✅
- **Gestion admin des produits** (CRUD complet) ✅
- **Gestion admin des catégories** (CRUD complet) ✅
- **Système d'emails** avec queue + worker ✅
- **Cache Redis** + rate limiting ✅
- **Base de données** complètement structurée (13 migrations) ✅
- **Tests unitaires** pour les parties implémentées ✅
- **Docker** avec migrations/seeds/worker automatiques ✅

### 📈 Taux d'Implémentation

- **Modèles de données** : 100% ✅ (11/11 complets)
- **Migrations** : 100% ✅ (13/13 complètes)
- **Services métier** : 100% ✅ (5/5 implémentés)
- **Configuration** : 100% ✅ (9/9 configs)
- **Templates emails** : 100% ✅ (10 templates)
- **Système de missions** : 90% ✅ (CRUD + publication + suivi implémentés)
- **Contrôleurs API** : ~40% ✅ (6/15+ contrôleurs principaux)
- **Tests** : ~35% ⚠️ (seulement pour parties implémentées)

### 🚨 Contrôleurs à Implémenter en Priorité

1. **Système de Propositions** - `affreteur/propositions_controller.ts` + `transporteur/propositions_controller.ts`
2. **Admin Users** - `admin/users_controller.ts`
3. **Admin Dashboard** - `admin/dashboard_controller.ts`
4. **Suivi Expéditions** - `affreteur/shipments_controller.ts`
5. **Boutique E-commerce** - `shop/products_controller.ts` + `shop/categories_controller.ts`

## 🗄️ Base de Données

### ✅ Migrations Complètes (13)

```
database/migrations/
├── 1756021226549_create_enable_uuid_oosps_table.ts      # Extensions UUID PostgreSQL
├── 1756021226550_create_enable_postgis_table.ts         # Extension PostGIS géo
├── 1756021226576_create_users_table.ts                  # Table utilisateurs + rôles
├── 1756021226579_create_access_tokens_table.ts          # Tokens JWT
├── 1757125598163_create_refresh_tokens_table.ts         # Tokens rafraîchissement
├── 1757125730815_create_mfa_recovery_codes_table.ts     # Codes récupération MFA
├── 1757126181433_create_addresses_table.ts              # Adresses géographiques
├── 1757126354321_create_missions_table.ts               # Missions de transport
├── 1757126415959_create_propositions_table.ts           # Propositions transporteurs
├── 1757126516042_create_audit_logs_table.ts             # Logs d'audit
├── 1757129532490_create_categories_table.ts             # Catégories produits
├── 1757129552902_create_products_table.ts               # Produits avec stock
└── 1757129577671_create_stock_movements_table.ts        # Mouvements de stock
```

### ✅ Seeders (3)

```
database/seeders/
├── main_seeder.ts      # Seeder principal
├── category_seeder.ts  # Données test catégories (électronique, mode, etc.)
└── product_seeder.ts   # Données test produits avec stock
```

## 🔐 Système d'Authentification

### Rôles Utilisateurs

- **ADMIN**: Accès complet, MFA obligatoire
- **TRANSPORTEUR**: Gestion des courses, propositions
- **AFFRETEUR**: Création de missions, gestion expéditions

### Sécurité Implémentée

- **JWT** avec rotation automatique des tokens ✅
- **Rate limiting** sur les tentatives de connexion ✅
- **MFA/TOTP** obligatoire pour les admins ✅
- **Blacklisting** des tokens révoqués ✅
- **Audit logs** complets ✅
- **Hash** sécurisé des mots de passe (scrypt) ✅
- **Codes de récupération** MFA ✅

### Exemples d'utilisation

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

## 📊 Cache et Performance

### Redis Utilisé Pour

- **Sessions utilisateurs** (30min) ✅
- **Rate limiting** (par IP/utilisateur) ✅
- **Queue d'emails** asynchrone ✅
- **Cache des données** (missions, produits, etc.) ✅
- **Blacklist des tokens** révoqués ✅

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

- **Queue Redis**: Stockage temporaire des emails ✅
- **Worker Pattern**: Traitement asynchrone ✅
- **Templates Edge**: Rendu HTML des emails ✅
- **Retry Logic**: Nouvelles tentatives automatiques ✅
- **Dead Letter Queue**: Emails échoués définitivement ✅

### Templates Disponibles (10)

```
resources/views/emails/
├── account_locked.edge         # Compte bloqué
├── admin_mfa_setup.edge        # Configuration MFA admin
├── low_stock_alert.edge        # Alerte stock faible
├── mfa_enabled.edge           # MFA activé
├── new_mission.edge           # Nouvelle mission
├── password_reset.edge        # Réinitialisation mot de passe
├── proposition-accepted.edge   # Proposition acceptée
├── test.edge                  # Test d'email
├── verify_email.edge          # Vérification email
└── welcome.edge               # Bienvenue
```

### Lancement du Worker

```bash
node ace email:worker          # Worker manuel
# Ou automatique via Docker
```

## 🔧 Configuration

### Variables d'Environnement Actuelles

```bash
# Application
TZ=Africa/Douala
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=-upkrBdXc9P19O8oq2bm6PGygS--Toqv
NODE_ENV=development

# Base de données PostgreSQL
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=qwertyuiop
DB_DATABASE=tsa_contest

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Email SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=camcoder337@gmail.com
SMTP_PASSWORD=mrvw ylbv dthg yqam

# URLs
FRONTEND_URL=http://localhost:5173
MAIL_FROM=camcoder337@gmail.com
SUPPORT_EMAIL=support@tsa-logistics.com
```

### Configuration Docker

Pour utiliser avec Docker, modifier uniquement :

```bash
# .env.docker
HOST=0.0.0.0                    # Au lieu de localhost
DB_HOST=host.docker.internal    # Au lieu de 127.0.0.1
REDIS_HOST=host.docker.internal # Au lieu de 127.0.0.1
NODE_ENV=production             # Optionnel
```

## 🧪 Tests

### Tests Implémentés

```
tests/unit/
├── auth_service.spec.ts             # Tests service auth ✅
├── mfa_service.spec.ts              # Tests service MFA ✅
├── admin/
│   ├── categories_controller.spec.ts # Tests contrôleur catégories ✅
│   └── products_controller.spec.ts   # Tests contrôleur produits ✅
└── models/
    ├── category.spec.ts             # Tests modèle catégorie ✅
    └── product.spec.ts              # Tests modèle produit ✅
```

### Diagnostic Système

```bash
node ace diagnose
```

Vérifie:

- ✅ Connexion PostgreSQL
- ✅ Connexion Redis
- ✅ Configuration email SMTP
- ✅ Queue des emails
- ✅ Santé générale du système

## 🚨 Monitoring

### Audit Logs Implémentés

Toutes les actions critiques sont loggées dans `audit_logs`:

- Connexions/déconnexions ✅
- Changements de mot de passe ✅
- Activation/désactivation MFA ✅
- Actions d'administration ✅

### Métriques Redis

- Nombre de sessions actives ✅
- Taille des queues d'email ✅
- Taux de rate limiting ✅
- Performance du cache ✅

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

## 🚀 Prochaines Étapes

### Priorité 1 - Système de Missions Complet ✅

- [x] Implémenter `admin/missions_controller.ts` ✅
- [x] Implémenter `affreteur/missions_controller.ts` ✅
- [x] Implémenter `transporteur/missions_controller.ts` ✅
- [x] Système de publication des missions ✅
- [x] Filtrage et recherche avancée ✅

### Priorité 2 - Système de Propositions

- [ ] Implémenter `affreteur/propositions_controller.ts`
- [ ] Implémenter `transporteur/propositions_controller.ts`
- [ ] Workflow complet de candidature/acceptation
- [ ] Système de notifications automatiques

### Priorité 3 - Administration Complète

- [ ] Implémenter `admin/dashboard_controller.ts`
- [ ] Implémenter `admin/users_controller.ts`
- [ ] Implémenter `admin/audit_logs_controller.ts`

### Priorité 3 - E-commerce

- [ ] Implémenter `shop/products_controller.ts`
- [ ] Implémenter système de commandes

---

_Ce service fait partie de l'écosystème TSA Logistics pour le concours TSA Contest 2025._
_État : Core Business Ready - Authentification, gestion produits et système de missions complets._

## 🎯 Système de Missions - Fonctionnalités Implémentées

### ✅ Flux Complet des Missions

1. **DRAFT** : Affreteur crée une mission en brouillon
2. **PUBLISHED** : Affreteur publie la mission (visible aux transporteurs)
3. **ASSIGNED** : Transporteur assigné à la mission (via système de propositions)
4. **COMPLETED** : Mission terminée avec preuves de livraison
5. **CANCELLED** : Mission annulée

### ✅ Rôles et Permissions Implémentés

**ADMIN** 🔑

- Voir toutes les missions de tous les affreteurs
- Créer des missions au nom d'affreteurs
- Forcer n'importe quel changement de statut
- Statistiques globales par statut

**AFFRETEUR** 🚛

- CRUD complet de ses missions
- Publier/dépublier missions (DRAFT ↔ PUBLISHED)
- Validation métier (budgets, dates, adresses requises)

**TRANSPORTEUR** 🚚

- Voir uniquement les missions PUBLISHED avec filtres
- Suivi temps réel (localisation GPS)
- Upload de preuves de livraison
- Mise à jour des statuts de mission

### ✅ Validations & Sécurité Implémentées

- Isolation des données par rôle et utilisateur
- Validation des transitions de statut autorisées
- Validation métier (budgets min/max, dates cohérentes)
- Gestion complète des adresses géographiques
- Filtrage avancé par ville, budget, type de marchandise
- Pagination et tri pour toutes les listes
