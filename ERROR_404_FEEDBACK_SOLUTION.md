# Solution à l'Erreur 404 - Endpoint Feedback

## Problème

```
POST http://51.91.77.0:30003/api/shop/product-recommendations/feedback 404 (Not Found)
```

## Diagnostic

Le frontend est configuré pour appeler un **serveur distant** (`http://51.91.77.0:30003/`) au lieu de localhost.

**Fichier**: `apps/frontend-web/.env`
```env
VITE_API_URL="http://51.91.77.0:30003/"
```

Ce serveur distant **n'a pas les routes récemment ajoutées** pour le système de feedback des recommandations, qui ont été créées dans les commits récents.

## Cause

Les routes pour le feedback ont été ajoutées dans:
- `services/tsa-monolith/start/routes.ts:321-324`
- `services/tsa-monolith/app/controllers/http/shop/product_recommendations_controller.ts:185-231`

Mais le serveur distant (`51.91.77.0:30003`) n'a **pas encore été redéployé** avec ces changements.

---

## Solution 1: Tester en Local (Rapide)

### Étape 1: Modifier le .env du frontend

```bash
# apps/frontend-web/.env
VITE_API_URL="http://localhost:3333/"  # Au lieu de http://51.91.77.0:30003/
```

### Étape 2: Démarrer le serveur AdonisJS local

```bash
cd services/tsa-monolith
npm run dev
```

Le serveur devrait démarrer sur le port 3333.

### Étape 3: Redémarrer le frontend

```bash
cd apps/frontend-web
yarn dev
```

### Étape 4: Tester

Maintenant, les appels iront vers votre serveur local qui a toutes les routes récentes.

---

## Solution 2: Redéployer le Serveur Distant (Production)

### Étape 1: Pousser les commits vers le dépôt

```bash
git push origin develop
```

### Étape 2: Redéployer le serveur distant

Connectez-vous au serveur `51.91.77.0` et:

```bash
# Sur le serveur distant
cd /path/to/tsa-innovlab/services/tsa-monolith

# Pull les derniers changements
git pull origin develop

# Installer les dépendances (si nécessaire)
npm install

# Exécuter les migrations (si nécessaire)
node ace migration:run --force

# Redémarrer le serveur
pm2 restart tsa-monolith
# ou
systemctl restart tsa-monolith
```

### Étape 3: Vérifier que les routes sont disponibles

```bash
curl http://51.91.77.0:30003/api/shop/product-recommendations/popular
```

Si ça fonctionne, le serveur est redéployé correctement.

---

## Solution 3: Environnement Hybride

Vous pouvez aussi créer un `.env.local` pour le développement local:

### Créer .env.local

```bash
# apps/frontend-web/.env.local
VITE_API_URL="http://localhost:3333/"
```

Le fichier `.env.local` prend la priorité sur `.env` et n'est pas commité dans git.

### Garder .env pour la production

```bash
# apps/frontend-web/.env
VITE_API_URL="http://51.91.77.0:30003/"
```

---

## Vérification que tout fonctionne

### 1. Vérifier que le serveur a les routes

```bash
# Liste toutes les routes
node ace list:routes | grep product-recommendations
```

Vous devriez voir:
```
POST   /api/shop/product-recommendations/feedback
GET    /api/shop/product-recommendations
GET    /api/shop/product-recommendations/popular
GET    /api/shop/product-recommendations/similar/:id
GET    /api/shop/product-recommendations/stats
GET    /api/shop/product-recommendations/analyze-thresholds
GET    /api/shop/product-recommendations/ab-test-results
```

### 2. Tester l'endpoint directement

```bash
# Avec un token JWT valide
curl -X POST http://localhost:3333/api/shop/product-recommendations/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre_token>" \
  -d '{
    "product_id": "uuid-du-produit",
    "action": "view",
    "context": "personalized"
  }'
```

Réponse attendue:
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "action": "view",
    "product_id": "...",
    "timestamp": "..."
  }
}
```

---

## Recommandation

**Pour le développement**: Utilisez la Solution 1 ou 3 (local)

**Pour la production**: Utilisez la Solution 2 (redéployer le serveur distant)

---

## Fichiers à Vérifier sur le Serveur Distant

Si vous redéployez, assurez-vous que ces fichiers sont à jour:

1. **Routes**: `services/tsa-monolith/start/routes.ts`
   - Doit contenir les routes de feedback (lignes 321-342)

2. **Controller**: `services/tsa-monolith/app/controllers/http/shop/product_recommendations_controller.ts`
   - Doit contenir la méthode `submitFeedback` (lignes 185-231)

3. **Service**: `services/tsa-monolith/app/services/ai_service.ts`
   - Doit contenir `submitRecommendationFeedback` (lignes 419-451)

4. **Migrations**: Vérifier que les tables existent en base
   ```sql
   \dt product_recommendation*
   ```

   Devrait montrer:
   - `product_recommendation_feedbacks`
   - `product_recommendation_stats`

---

## En Cas d'Erreur Persistante

Si l'erreur 404 persiste même après le redémarrage:

### 1. Vérifier les logs du serveur

```bash
# Si PM2
pm2 logs tsa-monolith

# Ou logs directs
tail -f /var/log/tsa-monolith/error.log
```

### 2. Vérifier que le middleware auth fonctionne

```bash
# Tester un endpoint authentifié
curl http://localhost:3333/api/shop/product-recommendations \
  -H "Authorization: Bearer <token>"
```

Si erreur 401: Problème d'authentification
Si erreur 404: Route non enregistrée

### 3. Vider le cache du serveur

```bash
# AdonisJS
rm -rf build/
npm run build

# Redémarrer
pm2 restart tsa-monolith
```

---

## Résumé

**Problème**: Serveur distant sans les routes récentes
**Solution rapide**: Pointer vers localhost (`VITE_API_URL="http://localhost:3333/"`)
**Solution production**: Redéployer le serveur distant avec `git pull` + `pm2 restart`
