# 🚛 TSA InnovLab - Plateforme Logistique Intelligente



## 📋 Vue d'ensemble

TSA InnovLab est une solution complète de gestion logistique intelligente développée dans le cadre du concours InnovLab TSA Contest 2025. Cette plateforme révolutionne le transport et la logistique en Afrique en connectant affréteurs, transporteurs et administrateurs dans un écosystème digital unifié.

### 🎯 Vision
Créer l'"Uber de la logistique" avec une plateforme qui transforme la façon dont les colis sont transportés, suivis et livrés, tout en optimisant l'écosystème des pièces reconditionnées.

## ✨ Fonctionnalités Principales

### 🔐 Authentification Multi-Rôles
- **Administrateur** : Gestion complète de la plateforme
- **Transporteur** : Gestion des courses et livraisons
- **Affréteur** : Création et suivi des commandes

### 📦 6 Modules Principaux

#### 1. 🌐 Réseau de Fret Digital
- Matching intelligent transporteur/affréteur
- Place de marché B2B avec notation en temps réel
- Système de contre-propositions flexible
- Intégration paiements (Mobile Money + virements)

#### 2. 📍 Suivi & Tracking Omniscient
- Tracking GPS en temps réel
- Prédiction ETA avec facteurs météo/trafic
- Alertes proactives et notifications
- Historique complet des trajets

#### 3. 🏠 Livraison à Domicile Grand Public
- Calcul de tarifs dynamiques
- Géolocalisation en temps réel
- Optimisation des tournées via IA
- Paiement cash-on-delivery

#### 4. 🛒 Boutique en Ligne de Pièces Reconditionnées
- Catalogue intelligent avec recherche par photo
- Scoring de qualité des pièces
- Gestion des stocks et alertes
- Système de retours et garanties

#### 5. 💬 Chatbot & Support Tactique
- Support client 24/7 automatisé
- Chat en temps réel multi-canal
- Système d'urgence pour transporteurs
- Analyse de sentiment automatique

#### 6. 🤖 IA & Data : Le Cerveau Prédictif
- Prédiction des retards avec facteurs explicatifs
- Recommandations de produits intelligentes
- Optimisation des routes et prix dynamiques
- Détection automatique de fraudes

## 🏗️ Architecture Technique

### Stack Technologique
```
Frontend Web:     React.js + TypeScript
Mobile:           Flutter
API Principale:   AdonisJS (TypeScript) - Backend core
Services IA/ML:   FastAPI (Python) - Data & Intelligence
Base de données:  PostgreSQL + Redis + Cache & Broker
Services Externes: Storage, Mailing, KYC, Maps, Monitoring
Load Balancer:    Nginx
CI/CD:            GitHub Actions
Déploiement:      Docker + Cloud Infrastructure
```

## 🚀 Installation et Configuration

### Prérequis
```bash
Node.js >= 22.x
Python >= 3.12
PostgreSQL >= 18
Redis >= 8.x
Docker & Docker Compose
```

### Installation Rapide
```bash
# Cloner le repository
git clone https://github.com/CamCoder337/tsa-innovlab.git
cd tsa-innovlab

# Installation API principale (AdonisJS)
cd backend
npm install
cp .env.example .env

# Installation services IA/ML (FastAPI)
cd ../ai-services
pip install -r requirements.txt
cp .env.example .env

# Installation Frontend
cd ../frontend
npm install

# Lancer avec Docker (recommandé)
docker-compose up -d

# Ou lancement manuel
# Terminal 1 - API Principale
cd backend && npm run dev

# Terminal 2 - Services IA
cd ai-services && uvicorn main:app --reload

# Terminal 3 - Frontend  
cd frontend && npm run dev
```

### Variables d'Environnement

**Backend AdonisJS (.env)**
```env
# Base de données
DB_CONNECTION=pg
PG_HOST=localhost
PG_PORT=5432
PG_USER=tsa_user
PG_PASSWORD=password
PG_DB_NAME=tsa_innovlab

# Redis
REDIS_CONNECTION=local
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT
APP_KEY=your_super_secret_app_key
JWT_SECRET=your_jwt_secret

# Services externes
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
SMILE_ID_API_KEY=your_kyc_key

# FastAPI Services
FASTAPI_BASE_URL=http://localhost:8000
```

**Services IA FastAPI (.env)**
```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/tsa_innovlab

# APIs ML
HUGGING_FACE_API_KEY=your_hugging_face_key
OPENWEATHER_API_KEY=your_weather_key

# Services principaux
ADONIS_API_URL=http://localhost:3333

# Modèles IA
MODEL_PATH=./models/
PREDICTION_THRESHOLD=0.85
```

## 📊 Méthodologie Agile (Scrum)

### 🗓️ Planning des Sprints (8 semaines)
- **Sprint 0** (2-3 jours) : Architecture et setup
- **Sprint 1** (Sem 1-2) : MVP avec authentification
- **Sprint 2** (Sem 3-4) : Logistique et tracking
- **Sprint 3** (Sem 5-6) : E-commerce pièces
- **Sprint 4** (Sem 7-8) : IA, optimisations et finalisation

### 📈 Definition of Done
- ✅ Code développé et testé (couverture ≥ 70%)
- ✅ Fonction intégrée et déployée
- ✅ Documentation mise à jour
- ✅ Pipeline CI/CD validé
- ✅ Standards sécurité respectés

## 🧪 Tests et Qualité

### Exécution des Tests
```bash
# Tests API principale (AdonisJS)
cd backend
npm test
npm run test:coverage

# Tests services IA (FastAPI)
cd ai-services  
pytest tests/
pytest tests/ --cov=app

# Tests Frontend
cd frontend
npm test
npm run test:e2e

# Tests d'intégration
npm run test:integration

# Linting et formatage
npm run lint
black ai-services/  # Python formatting
```

### Standards de Qualité
- **Couverture tests** : ≥ 80% (Sprint 4)
- **Performance API** : < 400ms (p95)
- **Sécurité** : Conformité OWASP
- **Clean Code** : Principes SOLID, DRY, KISS

## 📱 Applications Mobiles

### Fonctionnalités Mobiles
- **Affréteur** : Création/suivi commandes, chat, factures
- **Transporteur** : Candidature, GPS intégré, preuves photo
- **Admin** : Dashboard simplifié, validation commandes

### Installation Mobile
```bash
# Android
cd mobile/android
./gradlew assembleDebug

# iOS  
cd mobile/ios
xcodebuild -workspace App.xcworkspace -scheme App build
```

## 📊 Analytics et IA

### Modèles IA Intégrés
1. **Prédiction ETA** : Algorithmes de machine learning pour estimer les délais
2. **Recommandations** : Système de recommandation de pièces
3. **Détection d'anomalies** : Identification des retards suspects
4. **Optimisation routes** : Algorithmes d'optimisation des trajets

### Métriques Surveillées
- Temps de livraison moyen
- Taux de satisfaction client
- Performance des transporteurs
- Ventes pièces reconditionnées

## 🔧 API Documentation

### Endpoints Principaux
```bash
# Authentification
POST /api/auth/login
POST /api/auth/register

# Commandes
GET /api/orders
POST /api/orders
PUT /api/orders/:id

# Tracking
GET /api/tracking/:orderId
POST /api/tracking/update

# Produits
GET /api/products
POST /api/products
```

Documentation complète : [API Docs](./docs/api.md)

## 🚀 Déploiement

### Production
```bash
# Build production
# Frontend
cd frontend && npm run build

# Backend AdonisJS
cd backend && npm run build

# Services IA FastAPI (Docker)
cd ai-services && docker build -t tsa-ai-services .

# Déploiement complet
docker-compose -f docker-compose.prod.yml up -d
```

### Environnements
- **Development** : 
  - Frontend: `http://localhost:3000`
  - AdonisJS API: `http://localhost:3333`
  - FastAPI Services: `http://localhost:8000`
- **Staging** : `https://staging.tsa-innovlab.com`
- **Production** : `https://app.tsa-innovlab.com`

## 👥 Équipe de Développement

| Rôle | Responsabilités |
|------|----------------|
| **Product Owner** | Vision produit, backlog |
| **Scrum Master** | Facilitation, processus Agile |
| **Dev Frontend** | Interface utilisateur web/mobile |
| **Dev Backend** | APIs, logique métier |
| **Data Scientist** | IA, analytics, prédictions |
| **DevOps/QA** | Tests, déploiement, infrastructure |

## 📈 Métriques de Performance

### Objectifs Techniques
- **Disponibilité** : 99.9%
- **Temps de réponse** : < 400ms
- **Utilisateurs simultanés** : 500+
- **Couverture tests** : 80%

### KPIs Business
- Taux de mise en relation affréteur/transporteur : 95%
- Réduction des retards : 40%
- Satisfaction client : > 4.5/5

## 🏆 Concours InnovLab TSA

### Critères d'Évaluation
| Critère | Pondération | Focus |
|---------|-------------|-------|
| **Fonctionnalités** | 30% | Complétude, UX |
| **Qualité logicielle** | 25% | Tests, clean code |
| **Data & IA** | 15% | Intégration IA |
| **UX & Mobile** | 10% | Design, responsivité |
| **Architecture** | 10% | Robustesse, sécurité |
| **Agilité** | 10% | Sprints, livrables |

### 🥇 Récompenses
- **1ère place** : 1,000,000 FCFA
- **2ème place** : 300,000 FCFA  
- **3ème place** : 200,000 FCFA
- **Bonus** : Stages chez TSA-Logistique

## 📚 Documentation

- [Guide d'Installation](./docs/installation.md)
- [Documentation API](./docs/api.md)
- [Guide Utilisateur](./docs/user-guide.md)
- [Architecture Technique](./docs/architecture.md)
- [Guide de Contribution](./CONTRIBUTING.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est développé dans le cadre du concours InnovLab TSA Contest 2025.
Le code source des 3 premiers lauréats devient propriété de TSA-Logistique.

## 📞 Contact

**TSA-Logistique**
- 📧 Email: infos@tsa-logistique.com
- 📱 Téléphone: +237 651 21 87 97
- 🌐 Site web: [tsa-logistique.com](https://tsa-logistique.com)

**Équipe de Développement**
- 📧 Email: dev@tsa-innovlab.com
- 💬 Slack: #tsa-innovlab-team

---

> *"Coder, c'est comme livrer un colis : il faut que ça arrive complet, à l'heure, et que ça donne envie de revenir."* - InnovLab TSA Contest

![Made with ❤️ for TSA InnovLab](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)
