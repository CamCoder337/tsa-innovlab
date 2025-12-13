# 🔧 Guide de Diagnostic et Fix - Routes Orders en Production

## 🔍 Problème Identifié

L'erreur `"Cannot GET:/api/admin/orders"` en production indique que les routes existent dans le code mais ne sont pas fonctionnelles. Les causes possibles :

1. ❌ **Migrations non exécutées** → Tables `orders`, `order_items`, `carts`, etc. absentes
2. ❌ **Build non à jour** → Contrôleur `orders_controller.js` manquant dans `/build`
3. ❌ **Serveur non redémarré** → Anciennes routes encore en cache

## 📋 Étape 1 : Diagnostic de la Production

### Option A : Depuis votre machine locale (avec accès SSH à la BDD prod)

```bash
# 1. Configurez les variables d'environnement de la prod
export DB_HOST=<IP_SERVEUR_PRODUCTION>
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=<MOT_DE_PASSE_PROD>
export DB_DATABASE=tsa_contest

# 2. Lancez le script de diagnostic
cd services/tsa-monolith
node check_orders_tables.mjs
```

### Option B : Directement sur le serveur de production

```bash
# 1. Connectez-vous en SSH
ssh user@serveur-production

# 2. Allez dans le dossier de l'application
cd /path/to/tsa-innovlab/services/tsa-monolith

# 3. Lancez le diagnostic
node check_orders_tables.mjs
```

## 🔧 Étape 2 : Correction selon le Diagnostic

### Cas 1 : Migrations Manquantes ⚠️

Si le diagnostic indique "migrations MANQUANTES" :

```bash
# Sur le serveur de production

# 1. Vérifier les migrations en attente
node ace migration:status

# 2. Exécuter TOUTES les migrations
node ace migration:run --force

# 3. Vérifier que les tables sont créées
node check_orders_tables.mjs
```

**Migrations requises pour le système de commandes :**

- `1759501000000_create_carts_table`
- `1759502000000_create_cart_items_table`
- `1759503000000_create_orders_table`
- `1759504000000_create_order_items_table`
- `1759505000000_create_payments_table`

### Cas 2 : Build Non à Jour 🏗️

Si le contrôleur `orders_controller.js` est manquant dans `/build` :

```bash
# Sur le serveur de production

# 1. Sauvegarder l'ancien build (optionnel)
mv build build.backup.$(date +%Y%m%d_%H%M%S)

# 2. Reconstruire l'application
npm run build

# 3. Vérifier que le contrôleur existe
ls -la build/app/controllers/http/admin/orders_controller.js

# Si le fichier existe, vous devriez voir :
# -rw-r--r-- 1 user user 9247 Nov 10 14:52 orders_controller.js
```

### Cas 3 : Redémarrage du Serveur 🔄

Après avoir corrigé les migrations et/ou le build, **REDÉMARRER le serveur** :

#### Si vous utilisez PM2 :

```bash
pm2 restart tsa-monolith
pm2 logs tsa-monolith --lines 50
```

#### Si vous utilisez Docker :

```bash
docker-compose restart tsa-monolith
docker-compose logs -f tsa-monolith --tail=50
```

#### Si vous utilisez systemd :

```bash
sudo systemctl restart tsa-monolith
sudo journalctl -u tsa-monolith -f
```

#### Si vous lancez directement avec node :

```bash
# Arrêter le processus actuel (Ctrl+C ou kill)
pkill -f "node.*server.js"

# Relancer
cd /path/to/tsa-monolith
node build/bin/server.js
```

## ✅ Étape 3 : Validation Post-Fix

Une fois les corrections appliquées et le serveur redémarré :

### 1. Test de la route Health

```bash
curl https://votre-domaine.com/health

# Attendu : {"status":"ok","timestamp":"..."}
```

### 2. Test de la route Orders (avec authentification)

```bash
# Récupérer un token admin
TOKEN=$(curl -X POST https://votre-domaine.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemple.com","password":"motdepasse"}' \
  | jq -r '.data.token.token')

# Tester la route orders
curl https://votre-domaine.com/api/admin/orders \
  -H "Authorization: Bearer $TOKEN"

# Attendu : {"success":true,"message":"Orders retrieved successfully","data":{...}}
```

### 3. Test depuis le frontend

Ouvrez votre application frontend et :

- ✅ Connectez-vous en tant qu'admin
- ✅ Accédez à la page "Gestion des Commandes"
- ✅ Vérifiez que les commandes s'affichent (même si vide)

## 🐳 Solution Spécifique Docker

Si votre production utilise Docker, voici un redéploiement complet :

```bash
# 1. Arrêter les conteneurs
docker-compose down

# 2. Mettre à jour le code depuis Git
git pull origin develop

# 3. Reconstruire les images
docker-compose build tsa-monolith

# 4. Relancer avec les migrations automatiques
docker-compose up -d

# 5. Vérifier les logs
docker-compose logs -f tsa-monolith

# Dans les logs, vous devriez voir :
# ✅ "Running migrations..."
# ✅ "Migrated database/migrations/1759503000000_create_orders_table.ts"
# ✅ "Starting main application..."
# ✅ "Server started on port 3333"
```

## 📊 Vérification Finale - Checklist

Cochez chaque élément :

- [ ] ✅ Migrations exécutées (`node ace migration:status` montre toutes green)
- [ ] ✅ Tables créées (`node check_orders_tables.mjs` montre 5/5 tables)
- [ ] ✅ Build à jour (`ls build/app/controllers/http/admin/orders_controller.js`)
- [ ] ✅ Serveur redémarré (vérifier les logs de démarrage)
- [ ] ✅ Route `/health` répond (test curl)
- [ ] ✅ Route `/api/admin/orders` répond avec token admin
- [ ] ✅ Frontend affiche la page commandes sans erreur

## 🚨 Si le Problème Persiste

Si après toutes ces étapes l'erreur persiste :

### Vérification Avancée 1 : Routes enregistrées

```bash
# Sur le serveur, vérifier que les routes sont bien dans le fichier compilé
grep -n "orders_controller" build/start/routes.js

# Vous devriez voir plusieurs lignes comme :
# 161:router.get('/orders/stats', '#controllers/http/admin/orders_controller.stats')
# 162:router.get('/orders', '#controllers/http/admin/orders_controller.index')
# ...
```

### Vérification Avancée 2 : Base de données

```bash
# Connexion directe à PostgreSQL
psql -h <DB_HOST> -U <DB_USER> -d <DB_DATABASE>

# Vérifier les tables
\dt

# Vérifier les migrations
SELECT * FROM adonis_schema WHERE name LIKE '%order%';

# Quitter
\q
```

### Vérification Avancée 3 : Logs d'erreur détaillés

```bash
# Chercher les erreurs dans les logs
grep -i "error" /var/log/tsa-monolith.log
# OU
docker-compose logs tsa-monolith | grep -i "error"
# OU
pm2 logs tsa-monolith --err --lines 100
```

## 📞 Besoin d'Aide ?

Si vous êtes bloqué :

1. **Partagez la sortie du diagnostic** :

   ```bash
   node check_orders_tables.mjs > diagnostic.txt 2>&1
   ```

2. **Partagez les logs du serveur** :

   ```bash
   # Docker
   docker-compose logs tsa-monolith --tail=100 > logs.txt 2>&1

   # PM2
   pm2 logs tsa-monolith --lines 100 > logs.txt 2>&1
   ```

3. **Partagez l'état des migrations** :
   ```bash
   node ace migration:status > migrations.txt 2>&1
   ```

## 🎯 Résumé Ultra-Rapide (TL;DR)

```bash
# Sur le serveur de production :
cd /path/to/tsa-monolith
node ace migration:run --force
npm run build
pm2 restart tsa-monolith  # OU docker-compose restart
curl http://localhost:3333/api/admin/orders  # Test
```

Voilà ! Votre système de commandes devrait maintenant fonctionner. ✅
