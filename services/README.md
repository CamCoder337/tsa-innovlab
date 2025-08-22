# 🔧 Services - TSA-Logistique

> Architecture microservices backend pour la plateforme logistique TSA

## 📋 Vue d'Ensemble

Le dossier `services/` contient tous les services backend de TSA-Logistique, construits selon une architecture microservices moderne. Chaque service est indépendant, scalable et communique via des APIs REST bien définies.

## 🏗️ Architecture des Services

```
services/
├── api-backend/              # 🔑 API principale (AdonisJS)
├── ai-service/               # 🤖 Intelligence artificielle (FastAPI)
└── notification-service/     # 📬 Notifications (Node.js)
```

## 🔑 API Backend

**Stack :** AdonisJS 6 + TypeScript + PostgreSQL

### Responsabilités
- **Authentification & autorisation** (JWT, sessions)
- **Gestion utilisateurs** et profils
- **CRUD missions** de transport
- **Système d'enchères** pour missions
- **Gestion produits** e-commerce
- **Traitement commandes** et paiements
- **KYC & vérification** d'identité
- **Chat temps réel** (WebSocket)
- **APIs REST** pour frontends

### Architecture Interne
```
api-backend/
├── app/
│   ├── controllers/          # Contrôleurs HTTP
│   ├── models/              # Modèles Lucid ORM
│   ├── services/            # Logique métier
│   ├── middleware/          # Middlewares HTTP
│   ├── validators/          # Validation des données
│   ├── jobs/               # Jobs background (Bull Queue)
│   └── exceptions/         # Exceptions personnalisées
├── config/                 # Configuration AdonisJS
├── database/              # Migrations, seeders, factories
├── start/                 # Démarrage et routes
└── tests/                # Tests (unit, functional, integration)
```

### Démarrage Rapide
```bash
cd services/api-backend

# Installation
pnpm install

# Configuration
cp .env.example .env

# Base de données
pnpm db:migrate
pnpm db:seed

# Développement
pnpm dev        # http://localhost:8000
```

### APIs Principales
| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Status du service |
| `POST /api/auth/login` | Connexion utilisateur |
| `GET /api/missions` | Liste des missions |
| `POST /api/products` | Créer un produit |
| `GET /api/users/profile` | Profil utilisateur |
| `POST /api/kyc/documents` | Upload documents KYC |

## 🤖 AI Service

**Stack :** FastAPI + Python + TensorFlow/Scikit-learn

### Responsabilités
- **Optimisation de routes** via algorithmes ML
- **Prédiction de demande** transport
- **Matching intelligent** missions ↔ transporteurs
- **Analyse prédictive** des prix
- **Recommandations produits** e-commerce
- **Détection d'anomalies** dans les trajets
- **Analytics avancées** et insights

### Architecture Interne
```
ai-service/
├── app/
│   ├── routers/            # Routes FastAPI
│   ├── services/           # Services ML
│   ├── models/            # Modèles ML (TensorFlow, scikit-learn)
│   ├── data/              # Traitement des données
│   ├── utils/             # Utilitaires
│   └── core/              # Configuration
├── datasets/              # Données d'entraînement
├── models/               # Modèles ML sérialisés
├── notebooks/            # Jupyter notebooks R&D
└── tests/               # Tests Python
```

### Démarrage Rapide
```bash
cd services/ai-service

# Environnement virtuel Python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installation
pip install -r requirements.txt

# Configuration
cp .env.example .env

# Développement
python main.py    # http://localhost:5000
```

### APIs ML Disponibles
| Endpoint | Description |
|----------|-------------|
| `GET /health` | Status du service IA |
| `POST /optimize/route` | Optimisation d'itinéraire |
| `POST /predict/demand` | Prédiction de demande |
| `POST /match/missions` | Matching missions/transporteurs |
| `POST /recommend/products` | Recommandations produits |
| `POST /analyze/pricing` | Analyse prédictive prix |

## 📬 Notification Service

**Stack :** Node.js + TypeScript + Bull Queue

### Responsabilités
- **Notifications push** mobiles (FCM)
- **Emails transactionnels** (SendGrid/Mailgun)
- **SMS** (Twilio/Africa's Talking)
- **Notifications in-app** temps réel
- **Templates** de messages
- **Scheduling** de notifications
- **Analytics** d'engagement

### Démarrage Rapide
```bash
cd services/notification-service

# Installation
pnpm install

# Configuration
cp .env.example .env

# Développement
pnpm dev        # http://localhost:6000
```

## 🔄 Communication Inter-Services

### Architecture de Communication
```mermaid
graph TB
    FE[Frontend] --> API[API Backend]
    API --> AI[AI Service]
    API --> NOTIF[Notification Service]
    API --> DB[(PostgreSQL)]
    API --> REDIS[(Redis)]
    AI --> API
    NOTIF --> QUEUE[Bull Queue]
```

### Patterns de Communication
- **Synchrone** : HTTP REST entre API Backend ↔ AI Service
- **Asynchrone** : Queue Redis pour notifications
- **Événements** : WebSocket pour temps réel
- **Cache** : Redis pour sessions et cache

## 🛠️ Développement

### Scripts Monorepo
```bash
# Démarrer tous les services
pnpm dev

# Démarrer un service spécifique
pnpm dev:backend     # API Backend seulement
pnpm dev:ai          # AI Service seulement

# Tests
pnpm test:services   # Tous les tests services
pnpm test:backend    # Tests API Backend
pnpm test:ai         # Tests AI Service

# Build
pnpm build:services  # Build tous les services
```

### Docker Compose
```bash
# Services de développement
docker-compose up -d postgres redis

# Tous les services (production)
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Configuration

### Variables d'Environnement Communes
```env
# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/tsa_logistique
REDIS_URL=redis://localhost:6379

# Services internes
API_BACKEND_URL=http://localhost:8000
AI_SERVICE_URL=http://localhost:5000
NOTIFICATION_SERVICE_URL=http://localhost:6000

# APIs externes
SMILE_IDENTITY_API_KEY=your_key
CLOUDINARY_API_KEY=your_key
SENDGRID_API_KEY=your_key
```

### Configuration par Service
- **API Backend** : `.env` avec DB, Redis, APIs externes
- **AI Service** : `.env` avec modèles ML, datasets
- **Notification Service** : `.env` avec providers (FCM, SendGrid)

## 📊 Monitoring & Observabilité

### Logs
- **Structured logging** avec Winston/Pino
- **Correlation IDs** pour traçabilité
- **Centralization** via ELK Stack ou Grafana Loki

### Métriques
- **Application metrics** : Prometheus + Grafana
- **Health checks** : `/health` sur chaque service
- **Performance monitoring** : APM (Sentry, New Relic)

### Alerting
- **Uptime monitoring** : UptimeRobot/Pingdom
- **Error tracking** : Sentry
- **Slack/Discord** notifications

## 🚀 Déploiement

### Environnements
| Service | Staging | Production |
|---------|---------|------------|
| **API Backend** | Railway | Railway |
| **AI Service** | Render | Render |

### CI/CD Pipeline
1. **Tests** automatiques sur PR
2. **Build** Docker images
3. **Deploy** staging sur merge `integration`
4. **Deploy** production sur merge `main`
5. **Health checks** post-déploiement

### Docker
```bash
# Build toutes les images
docker-compose build

# Push vers registry
docker-compose push

# Deploy production
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Tests

### Stratégie de Tests
- **Unit tests** : Logique métier isolée
- **Integration tests** : Communication entre services
- **E2E tests** : Scénarios utilisateur complets
- **Load tests** : Performance sous charge

### Commandes de Test
```bash
# Tests unitaires
pnpm test:unit

# Tests d'intégration
pnpm test:integration

# Tests E2E
pnpm test:e2e

# Coverage
pnpm test:coverage
```

## 🔧 Maintenance

### Gestion des Migrations
```bash
# API Backend (Lucid ORM)
cd services/api-backend
pnpm db:migrate
pnpm db:rollback

# Backup/Restore
pnpm db:backup
pnpm db:restore
```

### Monitoring de Performance
- **Database queries** : Slow query log
- **API response times** : < 200ms médiane
- **Memory usage** : < 512MB par service
- **CPU usage** : < 70% moyenne

## 🆘 Troubleshooting

### Problèmes Courants

#### Service ne démarre pas
```bash
# Vérifier les logs
docker-compose logs service-name

# Vérifier les variables d'environnement
cat .env

# Redémarrer proprement
docker-compose restart service-name
```

#### Base de données inaccessible
```bash
# Vérifier PostgreSQL
docker-compose logs postgres
psql -h localhost -U postgres -d tsa_logistique

# Reset complet
docker-compose down -v
docker-compose up -d postgres
pnpm db:migrate
```

#### Communication inter-services
```bash
# Tester la connectivité
curl http://localhost:8000/health
curl http://localhost:5000/health

# Vérifier les URL de configuration
grep SERVICE_URL .env
```

## 📚 Documentation Technique

### API Documentation
- **API Backend** : Swagger UI sur `/docs`
- **AI Service** : FastAPI docs sur `/docs`
- **Postman Collections** : `docs/postman/`

### Guides Spécialisés
- [API Backend Guide](api-backend/README.md)
- [AI Service Guide](ai-service/README.md)

## 🤝 Contribution

### Guidelines Spécifiques
- **API Backend** : Suivre conventions AdonisJS
- **AI Service** : PEP8 pour Python, docstrings obligatoires
- **Notification Service** : TypeScript strict mode

### Architecture Decisions
- **RESTful APIs** : Suivre conventions REST
- **Error handling** : Codes HTTP appropriés
- **Data validation** : Validation stricte des inputs
- **Security** : JWT, rate limiting, CORS

---

**🔧 Les services sont le cœur de TSA-Logistique - construits pour la scalabilité et la performance !**

Pour plus de détails, consultez le README de chaque service individuel.