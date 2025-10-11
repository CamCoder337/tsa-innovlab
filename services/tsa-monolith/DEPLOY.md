# 🚀 Guide de Déploiement Portainer - TSA Monolith Backend

Guide complet pour déployer le backend AdonisJS avec Nginx, PostgreSQL PostGIS 17 et Redis sur Portainer.

## 📋 Prérequis

- ✅ Portainer installé et accessible
- ✅ Réseau Docker `InnovLabG1` créé dans Portainer
- ✅ Code source sur GitHub (repository accessible)
- ✅ Accès au serveur SMTP (Gmail, SendGrid, etc.)

---

## 🏗️ Architecture de la Stack

```
Internet / Frontend React
         ↓
    Nginx Backend:3333 (Alpine, reverse proxy)
         ↓
    AdonisJS:3333 (interne, non exposé)
         ↓
    PostgreSQL PostGIS 17 + Redis
```

**Services déployés :**

- ✅ Nginx Backend (Alpine) - Reverse proxy optimisé
- ✅ AdonisJS API - Backend principal
- ✅ PostgreSQL PostGIS 17 Alpine - Base de données avec extensions géospatiales
- ✅ Redis 7 Alpine - Cache et queue d'emails

**Réseau :** `InnovLabG1` (externe, déjà créé)

**Volumes persistants :**

- `tsa_postgres_data` - Données PostgreSQL
- `tsa_redis_data` - Données Redis
- `tsa_nginx_logs` - Logs Nginx

---

## 📦 Étape 1 : Préparer le Repository GitHub

### 1.1 Vérifier les fichiers nécessaires

Assurez-vous que votre repository GitHub contient :

```
services/tsa-monolith/
├── Dockerfile                         ✅ Présent
├── docker-compose.portainer.yml       ✅ Présent
├── nginx-backend.conf                 ✅ Présent
├── stack.env                          ✅ Présent (avec placeholders)
└── ... (autres fichiers du projet)
```

### 1.2 Commit et Push sur GitHub

```bash
cd services/tsa-monolith
git add stack.env docker-compose.portainer.yml nginx-backend.conf
git commit -m "feat: add Portainer deployment configuration"
git push origin main
```

### 1.3 Vérifier l'URL du Repository

Exemple : `https://github.com/CamCoder337/tsa-innovlab.git`

---

## 🔧 Étape 2 : Préparer les Variables d'Environnement

### 2.1 Générer l'APP_KEY

Sur votre machine locale :

```bash
cd services/tsa-monolith
node ace generate:key
```

Copier la clé générée (ex: `-upkrBdXc9P19O8oq2bm6PGygS--Toqv`)

### 2.2 Configurer le SMTP (Gmail exemple)

1. Aller dans votre compte Gmail
2. Activer l'authentification à 2 facteurs
3. Créer un "App Password" : https://myaccount.google.com/apppasswords
4. Copier le mot de passe généré (16 caractères)

### 2.3 Préparer les valeurs

Ouvrir `.env.portainer.example` et noter toutes les valeurs à renseigner :

```bash
APP_KEY=<votre_clé_générée>
LOG_LEVEL=info
DB_USER=tsa_admin
DB_PASSWORD=<générer_mot_de_passe_fort>
DB_DATABASE=tsa_contest_prod
REDIS_PASSWORD=<générer_mot_de_passe_fort>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply@tsa-logistics.com
SMTP_PASSWORD=<votre_app_password_gmail>
RESEND_API_KEY=<votre_cle_resend>
MAIL_DOMAIN=onboarding.tsa-logistics.com
FRONTEND_URL=https://app.tsa-logistics.com
MAIL_FROM=noreply@tsa-logistics.com
SUPPORT_EMAIL=support@tsa-logistics.com
ADMIN_EMAIL=admin@tsa-logistics.com
ADMIN_PASSWORD=Admin123!
BACKEND_PORT=3333
```

---

## 🚢 Étape 3 : Déployer sur Portainer depuis GitHub

### 3.1 Créer la Stack depuis Repository

1. Se connecter à Portainer
2. Aller dans **Stacks** → **Add Stack**
3. Renseigner :
   - **Name :** `tsa-backend-prod`
   - **Build method :** **Repository** ⚠️ IMPORTANT

### 3.2 Configurer le Repository Git

1. **Repository URL :** `https://github.com/CamCoder337/tsa-innovlab`
   - Remplacer par votre URL GitHub

2. **Repository reference :** `refs/heads/main`
   - Ou `refs/heads/master` selon votre branche

3. **Compose path :** `services/tsa-monolith/docker-compose.portainer.yml`
   - Chemin relatif vers le docker-compose dans le repo

4. **Authentication :**
   - Si repo **public** : Laisser vide
   - Si repo **privé** : Ajouter un Personal Access Token GitHub

### 3.3 Configurer les Variables d'Environnement

1. Section **"Environment variables"**
2. Cliquer sur **"Advanced mode"**
3. Copier-coller **TOUTES** les variables préparées à l'Étape 2.3
4. **IMPORTANT :** Ne pas inclure les commentaires `#`

**Exemple (sans commentaires) :**

```
APP_KEY=-upkrBdXc9P19O8oq2bm6PGygS--Toqv
LOG_LEVEL=info
DB_USER=tsa_admin
DB_PASSWORD=SuperSecretPassword123!
DB_DATABASE=tsa_contest_prod
REDIS_PASSWORD=RedisSecretPassword456!
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply@tsa-logistics.com
SMTP_PASSWORD=abcd efgh ijkl mnop
RESEND_API_KEY=re_votre_cle_resend
MAIL_DOMAIN=onboarding.tsa-logistics.com
FRONTEND_URL=https://app.tsa-logistics.com
MAIL_FROM=noreply@tsa-logistics.com
SUPPORT_EMAIL=support@tsa-logistics.com
ADMIN_EMAIL=admin@tsa-logistics.com
ADMIN_PASSWORD=Admin123!
BACKEND_PORT=3333
```

**Note importante :** Le fichier `stack.env` du repo contient des placeholders (comme `${APP_KEY}`). Portainer va automatiquement remplacer ces placeholders par les valeurs que vous avez renseignées ci-dessus.

### 3.4 Déployer

1. Vérifier que toutes les variables sont renseignées
2. Cliquer sur **"Deploy the stack"**
3. Portainer va :
   - ✅ Cloner le repository GitHub
   - ✅ Lire le fichier `stack.env`
   - ✅ Remplacer les placeholders par vos vraies valeurs
   - ✅ Builder l'image Docker depuis le `Dockerfile`
   - ✅ Démarrer tous les services
4. Attendre 3-5 minutes (build + démarrage)

---

## ✅ Étape 4 : Vérifications Post-Déploiement

### 4.1 Vérifier les Services

Dans Portainer → **Stacks** → `tsa-backend-prod` :

- ✅ `tsa-postgres` - **running** (vert)
- ✅ `tsa-redis` - **running** (vert)
- ✅ `tsa-backend` - **running** (vert)
- ✅ `tsa-nginx-backend` - **running** (vert)

### 4.2 Vérifier les Health Checks

Cliquer sur chaque service et vérifier :

- **Health status :** `healthy` (après 30-60 secondes)

### 4.3 Tester l'API

**Health check Nginx :**

```bash
curl http://votre-serveur:3333/nginx-health
# Réponse attendue: OK
```

**Health check Backend :**

```bash
curl http://votre-serveur:3333/health
# Réponse attendue: {"status":"ok"}
```

**Test API :**

```bash
curl http://votre-serveur:3333/api/auth/login
# Réponse attendue: erreur 422 (validation) = API fonctionne
```

### 4.4 Vérifier les Logs

Dans Portainer, cliquer sur chaque service → **Logs** :

**PostgreSQL :**

```
database system is ready to accept connections
```

**Redis :**

```
Ready to accept connections
```

**AdonisJS :**

```
Server started on port 3333
Email worker started successfully
```

**Nginx :**

```
start worker processes
```

---

## 🔒 Étape 5 : Configuration SSL/HTTPS (Production)

### Option A : Utiliser Traefik (si disponible sur Portainer)

Si vous avez Traefik comme reverse proxy :

1. Ajouter les labels au service `nginx-backend` dans `docker-compose.portainer.yml` :

```yaml
nginx-backend:
  labels:
    - 'traefik.enable=true'
    - 'traefik.http.routers.tsa-api.rule=Host(`api.tsa-logistics.com`)'
    - 'traefik.http.routers.tsa-api.entrypoints=websecure'
    - 'traefik.http.routers.tsa-api.tls.certresolver=letsencrypt'
```

### Option B : Certificat SSL manuel

1. Obtenir un certificat Let's Encrypt
2. Modifier `nginx-backend.conf` pour écouter sur le port 443
3. Monter les certificats comme volumes

---

## 🛠️ Étape 6 : Maintenance

### Mettre à jour l'application

**Méthode 1 : Push vers GitHub (Recommandé)**

1. Faire vos modifications dans le code
2. Commit et push sur GitHub :

   ```bash
   git add .
   git commit -m "feat: nouvelle fonctionnalité"
   git push origin main
   ```

3. Dans Portainer → Stack `tsa-backend-prod` → Cliquer **"Pull and redeploy"**
   - Portainer va automatiquement :
     - ✅ Pull les dernières modifications depuis GitHub
     - ✅ Rebuild l'image Docker
     - ✅ Redémarrer les services

**Méthode 2 : Redéploiement manuel**

1. Dans Portainer → Stack `tsa-backend-prod` → **Editor**
2. Cliquer **"Update the stack"**
3. Portainer va rebuild et redéployer

### Backup de la base de données

```bash
# Se connecter au conteneur PostgreSQL
docker exec -it tsa-postgres bash

# Créer un backup
pg_dump -U tsa_admin tsa_contest_prod > /tmp/backup.sql

# Copier le backup hors du conteneur
docker cp tsa-postgres:/tmp/backup.sql ./backup-$(date +%Y%m%d).sql
```

### Restaurer un backup

```bash
docker cp backup-20250104.sql tsa-postgres:/tmp/backup.sql
docker exec -it tsa-postgres psql -U tsa_admin -d tsa_contest_prod -f /tmp/backup.sql
```

### Voir les logs en temps réel

```bash
# Logs Nginx
docker logs -f tsa-nginx-backend

# Logs AdonisJS
docker logs -f tsa-backend

# Logs PostgreSQL
docker logs -f tsa-postgres

# Logs Redis
docker logs -f tsa-redis
```

---

## 🚨 Troubleshooting

### Problème : Services ne démarrent pas

**Vérifier :**

1. Réseau `InnovLabG1` existe bien
2. Variables d'environnement renseignées correctement
3. Image Docker accessible depuis le registre

**Solution :**

```bash
# Dans Portainer, vérifier les logs de chaque service
# Erreur commune : APP_KEY manquante ou invalide
```

### Problème : Backend ne répond pas

**Vérifier :**

1. Health check du backend : `curl http://localhost:3333/health`
2. Connexion PostgreSQL réussie
3. Connexion Redis réussie

**Solution :**

```bash
# Diagnostiquer depuis le conteneur
docker exec -it tsa-backend node ace diagnose
```

### Problème : Emails ne partent pas

**Vérifier :**

1. SMTP_USERNAME et SMTP_PASSWORD corrects
2. Gmail App Password valide (16 caractères)
3. Worker d'emails démarré

**Solution :**

```bash
# Tester l'envoi d'email
docker exec -it tsa-backend node ace test:email
```

### Problème : Rate limiting trop strict

**Solution :**
Modifier `nginx-backend.conf` :

```nginx
# Augmenter les limites
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=200r/s;  # Au lieu de 100r/s
```

Redéployer la stack.

---

## 📊 Monitoring

### Métriques à surveiller

- **CPU/RAM** : Portainer → Containers → Stats
- **Logs Nginx** : Volume `tsa_nginx_logs`
- **Connexions PostgreSQL** : `SELECT count(*) FROM pg_stat_activity;`
- **Taille Redis** : `docker exec tsa-redis redis-cli INFO memory`

### Alertes recommandées

- 🚨 CPU > 80% pendant 5 min
- 🚨 RAM > 90%
- 🚨 Disque PostgreSQL > 80%
- 🚨 Service down > 2 min

---

## 📚 Ressources

- **Portainer Documentation :** https://docs.portainer.io
- **AdonisJS Documentation :** https://docs.adonisjs.com
- **Nginx Documentation :** https://nginx.org/en/docs/
- **PostgreSQL PostGIS :** https://postgis.net/documentation/

---

## ✅ Checklist Finale

- [ ] Image Docker poussée sur le registre
- [ ] APP_KEY générée avec `node ace generate:key`
- [ ] SMTP configuré et testé
- [ ] Réseau `InnovLabG1` créé dans Portainer
- [ ] Toutes les variables d'environnement renseignées
- [ ] Stack déployée avec succès
- [ ] Tous les services sont `healthy`
- [ ] API répond sur `/health`
- [ ] Nginx répond sur `/nginx-health`
- [ ] Test d'envoi d'email réussi
- [ ] Backup de la base de données configuré

---

**🎉 Déploiement terminé avec succès !**

Votre backend TSA Monolith est maintenant en production sur Portainer avec :

- ✅ Nginx reverse proxy optimisé (gzip, rate limiting, security headers)
- ✅ AdonisJS API avec worker d'emails
- ✅ PostgreSQL PostGIS 17 avec volumes persistants
- ✅ Redis cache et queue avec persistence
- ✅ Architecture production-ready sur réseau InnovLabG1
