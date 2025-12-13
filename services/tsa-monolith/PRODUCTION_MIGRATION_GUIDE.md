# 🚀 Guide: Lancer les Migrations en Production

## 🎯 Problème Actuel

La route `/api/admin/orders` retourne `"Cannot GET:/api/admin/orders"` car les tables ne sont pas créées en base de données.

**Serveur de production**: `51.91.77.0:30000`
**Architecture**: Docker + Portainer

## ✅ Solution Rapide (Méthode Recommandée)

### Étape 1 : Connexion SSH au Serveur

```bash
ssh user@51.91.77.0
```

> **Note**: Remplacez `user` par votre nom d'utilisateur SSH

### Étape 2 : One-Liner pour Lancer les Migrations

```bash
docker exec tsa-backend node ace migration:run --force && docker restart tsa-backend
```

**Ce que fait cette commande :**

1. Exécute toutes les migrations manquantes dans le conteneur `tsa-backend`
2. Redémarre le conteneur pour recharger les routes

### Étape 3 : Vérification

Après ~60 secondes (temps de redémarrage), testez :

```bash
curl http://localhost:30000/health
curl http://localhost:30000/api/admin/orders
```

Si la deuxième commande ne retourne plus `"Cannot GET:/api/admin/orders"`, c'est réglé ! ✅

---

## 📋 Solution Complète (Avec Script Automatique)

### Étape 1 : Transférer le Script sur le Serveur

Depuis votre machine locale :

```bash
# Transférer le script vers le serveur
scp services/tsa-monolith/run_migrations_production.sh user@51.91.77.0:/tmp/

# Se connecter au serveur
ssh user@51.91.77.0
```

### Étape 2 : Exécuter le Script

```bash
# Donner les permissions d'exécution
chmod +x /tmp/run_migrations_production.sh

# Lancer le script
/tmp/run_migrations_production.sh
```

Le script va :

- ✅ Vérifier que le conteneur est actif
- ✅ Afficher l'état des migrations avant/après
- ✅ Lancer toutes les migrations manquantes
- ✅ Redémarrer le conteneur
- ✅ Tester les routes `/health` et `/api/admin/orders`
- ✅ Afficher un rapport complet

---

## 🔍 Commandes de Diagnostic

Si vous voulez d'abord diagnostiquer avant de lancer les migrations :

### 1. Vérifier l'État des Migrations

```bash
docker exec tsa-backend node ace migration:status
```

Vous verrez la liste des migrations avec leur statut (pending/migrated).

### 2. Lister les Tables de la Base de Données

```bash
docker exec tsa-postgres psql -U tsa_admin -d tsa_contest_prod -c "\dt"
```

Cherchez les tables : `orders`, `order_items`, `carts`, `cart_items`, `payments`

### 3. Vérifier les Logs du Backend

```bash
docker logs tsa-backend --tail 100
```

Cherchez des erreurs liées aux routes ou à la base de données.

### 4. Vérifier que le Build Contient le Contrôleur Orders

```bash
docker exec tsa-backend ls -la build/app/controllers/http/admin/
```

Vous devriez voir `orders_controller.js` dans la liste.

---

## 🐳 Alternative: Redéployer la Stack Portainer

Si les migrations ne fonctionnent toujours pas après les avoir lancées manuellement, il se peut que le **build de l'application soit obsolète** (compilé avant que les fichiers orders ne soient ajoutés).

### Solution : Forcer un Rebuild Complet

#### Option A : Via Portainer UI

1. Se connecter à Portainer
2. Aller dans **Stacks** → Sélectionner votre stack `tsa-backend-prod`
3. Cliquer sur **Editor** ou **Update**
4. Cocher **"Re-pull image and redeploy"** OU **"Pull and redeploy"**
5. Cliquer **"Update the stack"**

Portainer va :

- Re-pull le code depuis GitHub (branche `develop`)
- Reconstruire l'image Docker (avec le nouveau code)
- Lancer automatiquement les migrations au démarrage (via le `Dockerfile`)

#### Option B : Via SSH (Ligne de Commande)

```bash
# Se connecter au serveur
ssh user@51.91.77.0

# Naviguer vers le dossier de la stack (si déployée manuellement)
cd /path/to/tsa-innovlab/services/tsa-monolith

# Pull les dernières modifications
git pull origin develop

# Reconstruire et redéployer
docker-compose -f docker-compose.portainer.yml build backend
docker-compose -f docker-compose.portainer.yml up -d backend

# Les migrations se lanceront automatiquement au démarrage
```

---

## ⚠️ Dépannage

### Problème 1 : "Container tsa-backend not found"

Le conteneur peut avoir un nom différent. Lister les conteneurs :

```bash
docker ps
```

Cherchez le conteneur du backend et remplacez `tsa-backend` par le bon nom.

### Problème 2 : Les Migrations Échouent

Vérifiez les erreurs :

```bash
docker logs tsa-backend --tail 200 | grep -i "error\|migration"
```

Causes fréquentes :

- Base de données non accessible
- Permissions insuffisantes
- Conflit de schéma (tables déjà existantes)

### Problème 3 : Les Routes Ne Fonctionnent Toujours Pas

Même après les migrations, si les routes ne marchent pas :

1. **Vérifier que le build est à jour** :

   ```bash
   docker exec tsa-backend ls -la build/app/controllers/http/admin/orders_controller.js
   ```

   Si le fichier n'existe pas → Le build est obsolète → Redéployer la stack

2. **Vérifier les routes dans le code compilé** :

   ```bash
   docker exec tsa-backend grep -n "orders_controller" build/start/routes.js
   ```

   Vous devriez voir plusieurs lignes avec `/orders` et `orders_controller`

3. **Vérifier les logs au démarrage** :
   ```bash
   docker logs tsa-backend | grep -i "route\|server"
   ```

---

## 📊 Migrations Nécessaires pour le Système de Commandes

Ces 5 migrations doivent être exécutées :

| Ordre | Migration                                | Table Créée   | Description             |
| ----- | ---------------------------------------- | ------------- | ----------------------- |
| 1     | `1759501000000_create_carts_table`       | `carts`       | Paniers d'achat         |
| 2     | `1759502000000_create_cart_items_table`  | `cart_items`  | Articles dans le panier |
| 3     | `1759503000000_create_orders_table`      | `orders`      | **Commandes** ⭐        |
| 4     | `1759504000000_create_order_items_table` | `order_items` | Articles de la commande |
| 5     | `1759505000000_create_payments_table`    | `payments`    | Paiements               |

---

## ✅ Validation Finale

Après avoir lancé les migrations et redémarré le serveur, testez :

### Test 1 : Santé du Serveur

```bash
curl http://51.91.77.0:30000/health
```

**Attendu** : `{"status":"ok","timestamp":"..."}`

### Test 2 : Route Orders (Sans Auth)

```bash
curl http://51.91.77.0:30000/api/admin/orders
```

**Attendu** : `{"success":false,"message":"E_UNAUTHORIZED_ACCESS: Unauthorized access",...}`

✅ Si vous avez cette erreur, **c'est NORMAL et c'est BON** ! Cela signifie que :

- La route existe ✅
- Le contrôleur fonctionne ✅
- Seule l'authentification manque (ce qui est attendu)

❌ Si vous avez toujours `"Cannot GET:/api/admin/orders"` → Le problème persiste

### Test 3 : Route Orders (Avec Token Admin)

Obtenez un token admin et testez :

```bash
# 1. Login
TOKEN=$(curl -X POST http://51.91.77.0:30000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tsa-logistics.com","password":"Admin123!"}' \
  | jq -r '.data.token.token')

# 2. Test route orders
curl http://51.91.77.0:30000/api/admin/orders \
  -H "Authorization: Bearer $TOKEN"
```

**Attendu** : `{"success":true,"message":"Orders retrieved successfully","data":{...}}`

---

## 🎯 Résumé TL;DR

Sur le serveur de production (`51.91.77.0`), exécutez :

```bash
docker exec tsa-backend node ace migration:run --force && \
docker restart tsa-backend && \
sleep 60 && \
curl http://localhost:30000/api/admin/orders
```

Si ça ne fonctionne pas, **redéployez la stack complète** via Portainer pour forcer un rebuild.

---

**Besoin d'aide ?** Partagez la sortie des commandes de diagnostic dans votre équipe.
