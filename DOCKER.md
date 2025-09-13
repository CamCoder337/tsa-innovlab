# 🐳 TSA InnovLab - Docker Deployment

Guide de déploiement Docker pour la plateforme TSA InnovLab.

## 📋 Prérequis

- Docker >= 20.10
- Docker Compose >= 2.0
- Git
- Minimum 4GB RAM libre
- Minimum 10GB espace disque libre

## 🏗️ Architecture des Services

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (Port 80)                     │
│                    Load Balancer / Gateway                 │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
        ┌─────────▼──────────┐   ┌────────▼──────────┐
        │   tsa-monolith     │   │      tsa-ai       │
        │   AdonisJS API     │   │   FastAPI ML      │
        │    Port 3333       │   │    Port 8000      │
        └─────────┬──────────┘   └────────┬──────────┘
                  │                       │
        ┌─────────▼──────────┐   ┌────────▼──────────┐
        │    PostgreSQL      │   │      Redis        │
        │    Port 5432       │   │    Port 6379      │
        └────────────────────┘   └───────────────────┘
```

## 🚀 Déploiement Rapide

### Option 1: Script Automatique (Recommandé)

```bash
# Cloner le projet
git clone <repository-url>
cd tsa-innovlab

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Lancer le déploiement interactif
./deploy.sh
```

### Option 2: Manuel

```bash
# Configuration
cp .env.example .env
vim .env  # Éditer les variables

# Déploiement
docker-compose up -d --build

# Vérification
docker-compose ps
curl http://localhost/health
```

## 📁 Structure des Services

### Services Infrastructure
- **postgres**: Base de données PostgreSQL
- **redis**: Cache et sessions
- **nginx**: Load balancer et reverse proxy

### Services Application  
- **tsa-monolith**: API principal AdonisJS
- **tsa-ai**: Service IA FastAPI

## ⚙️ Configuration

### Variables d'Environnement (.env)

```env
# Database
POSTGRES_DB=tsa_contest
POSTGRES_USER=tsa_user
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# AdonisJS
APP_KEY=your-32-character-secret-key
NODE_ENV=production

# Security (générer des clés sécurisées)
openssl rand -base64 32  # pour APP_KEY
```

### Ports d'Accès

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Nginx | 80 | http://localhost | Point d'entrée principal |
| API Docs | 80 | http://localhost/api/ai/docs | Documentation FastAPI |
| Health | 80 | http://localhost/health | Monitoring |

## 🔧 Commandes Utiles

### Gestion des Services

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f [service_name]

# Redémarrer un service
docker-compose restart tsa-monolith

# Arrêter tout
docker-compose down

# Rebuild complet
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

### Debugging

```bash
# Status des services
docker-compose ps

# Logs en temps réel
docker-compose logs -f

# Accéder à un container
docker-compose exec tsa-monolith sh
docker-compose exec tsa-ai bash

# Vérifier la base de données
docker-compose exec postgres psql -U tsa_user -d tsa_contest
```

### Maintenance

```bash
# Backup de la base
docker-compose exec postgres pg_dump -U tsa_user tsa_contest > backup.sql

# Nettoyage complet
docker-compose down -v
docker system prune -a
```

## 🔍 Monitoring et Health Checks

### Endpoints de Santé

- **Global**: `GET /health` - Status du load balancer
- **AI Service**: `GET /api/ai/health` - Status du service IA
- **API Principal**: Via endpoints AdonisJS

### Logs

```bash
# Tous les logs
docker-compose logs -f

# Logs spécifiques
docker-compose logs -f tsa-monolith  # API principal
docker-compose logs -f tsa-ai        # Service IA
docker-compose logs -f nginx         # Load balancer
docker-compose logs -f postgres      # Base de données
```

## 🛠️ Résolution de Problèmes

### Service ne démarre pas

```bash
# Vérifier les logs
docker-compose logs [service_name]

# Vérifier la configuration
docker-compose config

# Reconstruire
docker-compose build --no-cache [service_name]
```

### Base de données

```bash
# Vérifier la connexion
docker-compose exec postgres pg_isready -U tsa_user

# Reset de la base
docker-compose down -v
docker-compose up -d postgres
# Attendre que postgres soit prêt
docker-compose up -d tsa-monolith  # Les migrations se lancent automatiquement
```

### Problèmes de Performance

```bash
# Vérifier l'utilisation ressources
docker stats

# Ajuster les limites dans docker-compose.yml
# Exemple:
#   deploy:
#     resources:
#       limits:
#         memory: 1G
#         cpus: '0.5'
```

## 🚀 Déploiement en Production

### Sécurité

1. **Changer tous les mots de passe par défaut**
2. **Générer une APP_KEY sécurisée**
3. **Utiliser HTTPS (configurer SSL dans nginx)**
4. **Configurer un firewall**
5. **Activer les logs d'audit**

### Performance

1. **Ajuster les worker processes nginx**
2. **Configurer la taille des pools de connexion**
3. **Activer la compression gzip**
4. **Configurer le cache Redis**
5. **Optimiser PostgreSQL**

### Monitoring

```bash
# Ajouter des services de monitoring
# Prometheus, Grafana, etc.
# Voir docker-compose.monitoring.yml (si disponible)
```

## 📞 Support

En cas de problème:

1. Consulter les logs: `docker-compose logs -f`
2. Vérifier la configuration: `docker-compose config`
3. Health check: `curl http://localhost/health`
4. Restart des services: `docker-compose restart`

## 🔗 URLs Importantes

- **Application**: http://localhost
- **API Docs**: http://localhost/api/ai/docs
- **Health Check**: http://localhost/health
- **Monitoring**: Configurer selon vos besoins