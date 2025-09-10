# 🐳 TSA Monolith - Docker Configuration

## 📋 Overview

Cette configuration Docker optimisée pour le service **TSA Monolith** inclut :

- ✅ **Multi-stage builds** pour images légères et sécurisées
- ✅ **Production-ready** avec gestion des secrets
- ✅ **Monitoring** et health checks avancés
- ✅ **Scalabilité** et performance optimisées
- ✅ **Sécurité** renforcée (non-root user, resource limits)

## 🚀 Quick Start

### Développement

```bash
# Construire et lancer en mode développement
docker build --target development -t tsa-monolith:dev .
docker run -p 3333:3333 --env-file .env.docker tsa-monolith:dev

# Ou avec docker-compose
docker-compose up -d
```

### Production

```bash
# Configuration production complète
cd /path/to/tsa-innovlab
cp .env.prod.example .env.prod
# Configurer les variables dans .env.prod

# Déploiement initial (en tant que root)
sudo ./scripts/deploy.sh setup

# Déploiement de l'application
./scripts/deploy.sh deploy
```

## 📁 Structure Docker

```
services/tsa-monolith/
├── Dockerfile              # Multi-stage optimisé
├── .dockerignore           # Exclusions pour build rapide
├── .env.docker            # Template environnement Docker
└── README.Docker.md        # Cette documentation

# Racine du projet
├── docker-compose.yml      # Configuration développement
├── docker-compose.prod.yml # Configuration production
├── .env.prod.example      # Template production
└── scripts/
    └── deploy.sh          # Script de déploiement
```

## 🔧 Configuration Dockerfile

### Multi-stage Build

1. **Base**: Dépendances système communes
2. **Builder**: Construction de l'application
3. **Production**: Runtime optimisé (défaut)
4. **Development**: Mode développement avec hot-reload

### Optimisations

- **Cache Docker** : Copie des `package*.json` en premier
- **Sécurité** : Utilisateur non-root (`adonisjs:nodejs`)
- **Performance** : `dumb-init` pour gestion des signaux
- **Monitoring** : Health checks configurables
- **Size** : Image Alpine + nettoyage des caches

## ⚙️ Variables d'environnement

### Configuration de base

```bash
NODE_ENV=production          # Mode d'exécution
HOST=0.0.0.0                # Interface d'écoute
PORT=3333                   # Port applicatif
TZ=UTC                      # Timezone
APP_KEY=your-32-char-key    # Clé de chiffrement AdonisJS
```

### Base de données

```bash
DB_HOST=postgres            # Host PostgreSQL
DB_PORT=5432               # Port PostgreSQL
DB_USER=tsa_user           # Utilisateur DB
DB_PASSWORD=strong-pwd     # Mot de passe DB
DB_DATABASE=tsa_contest    # Nom de la base
```

### Cache Redis

```bash
REDIS_HOST=redis           # Host Redis
REDIS_PORT=6379           # Port Redis  
REDIS_PASSWORD=strong-pwd  # Mot de passe Redis
SESSION_DRIVER=redis       # Driver de session
```

### Email et externe

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=user@domain.com
SMTP_PASSWORD=app-password
FRONTEND_URL=https://app.domain.com
```

## 🎯 Commandes Docker

### Build et run

```bash
# Build production
docker build -t tsa-monolith:prod .

# Build développement
docker build --target development -t tsa-monolith:dev .

# Run avec variables d'environnement
docker run -d \
  --name tsa-monolith \
  -p 3333:3333 \
  --env-file .env.docker \
  tsa-monolith:prod
```

### Docker Compose

```bash
# Développement
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Monitoring
docker-compose ps
docker-compose logs -f tsa-monolith
```

### Gestion

```bash
# Status des services
./scripts/deploy.sh status

# Logs en temps réel
./scripts/deploy.sh logs tsa-monolith

# Sauvegarde
./scripts/deploy.sh backup

# Arrêt propre
./scripts/deploy.sh stop
```

## 🔐 Sécurité

### Mots de passe forts

- **Générateur** : `openssl rand -base64 32`
- **APP_KEY** : `openssl rand -hex 16` (32 caractères)
- **Database** : Minimum 16 caractères, alphanumériques + symboles
- **Redis** : Minimum 20 caractères

### Pratiques de sécurité

- 🔒 Utilisateur non-root dans les containers
- 🛡️ `no-new-privileges` security option
- 📊 Resource limits configurées
- 🔑 Secrets via variables d'environnement
- 🚫 `.dockerignore` pour exclure fichiers sensibles

## 📊 Monitoring & Health Checks

### Health Checks

```bash
# Status des health checks
docker ps --format "table {{.Names}}\t{{.Status}}"

# Vérification manuelle
curl http://localhost:3333/health
```

### Métriques système

```bash
# Utilisation des ressources
docker stats

# Logs structurés
docker logs tsa-monolith --since 1h | jq

# Monitoring des volumes
docker system df
```

## 🚀 Performance

### Ressources optimisées

| Service | CPU Limit | Memory Limit | CPU Request | Memory Request |
|---------|-----------|--------------|-------------|----------------|
| Monolith | 4.0 | 4G | 2.0 | 2G |
| PostgreSQL | 2.0 | 2G | 1.0 | 1G |
| Redis | 0.5 | 1G | 0.25 | 512M |
| AI Service | 6.0 | 8G | 2.0 | 4G |

### Optimisations applicatives

- **Node.js** : Production mode avec optimisations V8
- **PostgreSQL** : Configuration tuning pour performance
- **Redis** : Cache policy et persistence optimisées
- **Nginx** : Compression gzip et cache statique

## 🔧 Troubleshooting

### Problèmes courants

```bash
# Container ne démarre pas
docker logs tsa-monolith
docker inspect tsa-monolith

# Connexion base de données
docker exec -it tsa-postgres psql -U tsa_user -d tsa_contest

# Test Redis
docker exec -it tsa-redis redis-cli -a password ping

# Rebuild complet
docker-compose down -v
docker system prune -f
docker-compose up --build -d
```

### Debugging

```bash
# Shell interactif dans le container
docker exec -it tsa-monolith sh

# Variables d'environnement
docker exec tsa-monolith env | grep -E "(DB_|REDIS_|NODE_)"

# Processus en cours
docker exec tsa-monolith ps aux
```

## 📚 Resources

- [AdonisJS Docker Guide](https://docs.adonisjs.com/guides/deployment#docker)
- [Docker Multi-stage Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Docker Config](https://hub.docker.com/_/postgres)
- [Redis Docker Config](https://hub.docker.com/_/redis)

## 🆘 Support

Pour les questions liées à Docker :

1. **Vérifier les logs** : `./scripts/deploy.sh logs`
2. **Status des services** : `./scripts/deploy.sh status`
3. **Health checks** : Vérifier `/health` endpoints
4. **Resources** : Surveiller usage CPU/RAM avec `docker stats`

---

🚢 **Happy Dockerizing!** - *TSA Contest 2025*