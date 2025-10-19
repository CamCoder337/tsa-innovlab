# 🚀 Guide de Démarrage Rapide - Système de Recommandation

**Temps estimé : 5 minutes**

## Étape 1 : Vérifier les prérequis

```bash
# Vérifier Python
python --version  # Doit être >= 3.11

# Vérifier Node.js
node --version  # Doit être >= 22

# Vérifier PostgreSQL
psql --version  # Doit être >= 15
```

## Étape 2 : Démarrer les services

### Terminal 1 : Service AI (FastAPI)

```bash
cd services/tsa-ai

# Activer l'environnement virtuel
source venv/bin/activate  # Windows: venv\Scripts\activate

# Lancer le service
uvicorn app.main:app --reload --port 8000
```

Vous devriez voir :
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Terminal 2 : API principale (AdonisJS)

```bash
cd services/tsa-monolith

# Lancer le service
npm run dev
```

Vous devriez voir :
```
[ info ] starting http server...
[ info ] HTTP server started on http://localhost:3333
```

## Étape 3 : Tester rapidement

### Option A : Script de test automatisé (recommandé)

```bash
cd services/tsa-ai
python test_recommendations_quick.py
```

**Résultat attendu** :
```
**********************************************************************
  🚀 TSA InnovLab - Product Recommendation System Tests
**********************************************************************

======================================================================
Test 1: Health Check
======================================================================

✅ Service healthy: product_recommendations
ℹ️  Version: 1.0.0

======================================================================
Test 2: Popular Products
======================================================================

✅ Popular products retrieved
ℹ️  Strategy: popularity
ℹ️  Total: 5
ℹ️  Processing time: 45.23ms

...

======================================================================
Test Summary
======================================================================

✅ PASSED - Health Check
✅ PASSED - Popular Products
✅ PASSED - Personalized (New User)
✅ PASSED - Similar Products
✅ PASSED - Performance

🎉 All tests passed! (8/8)
```

### Option B : Tests manuels avec curl

#### Test 1 : Health check

```bash
curl http://localhost:8000/api/ai/product-recommendations/health
```

**Réponse attendue** :
```json
{
  "status": "healthy",
  "service": "product_recommendations",
  "version": "1.0.0"
}
```

#### Test 2 : Produits populaires

```bash
curl "http://localhost:8000/api/ai/product-recommendations/popular?limit=5"
```

**Réponse attendue** :
```json
{
  "success": true,
  "recommendations": [
    {
      "product_id": "...",
      "score": 1.0,
      "reason": "Produit populaire (50 commandes récentes)",
      "confidence": 0.85
    }
  ],
  "strategy_used": "popularity",
  "total": 5,
  "processing_time_ms": 45.23
}
```

#### Test 3 : Recommandations personnalisées

```bash
curl -X POST http://localhost:8000/api/ai/product-recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000001",
    "limit": 5,
    "context": "homepage"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "recommendations": [...],
  "strategy_used": "popularity_based",
  "total": 5,
  "processing_time_ms": 52.18
}
```

### Option C : Postman/Insomnia

1. Importer la collection : `services/tsa-ai/postman_collection.json`
2. Exécuter le dossier "1. Health & Status"
3. Exécuter les autres tests

## Étape 4 : Comprendre les stratégies

Le système choisit automatiquement la meilleure stratégie :

```
┌─────────────────────────────────────────────────────────────────┐
│ Historique utilisateur      │ Stratégie utilisée              │
├─────────────────────────────┼─────────────────────────────────┤
│ 0 achat (nouveau)           │ popularity_based                │
│ 1-2 achats                  │ content_based                   │
│ 3+ achats                   │ collaborative_filtering         │
└─────────────────────────────┴─────────────────────────────────┘
```

### Exemple de test des stratégies

```bash
# Nouveau utilisateur → popularity_based
curl -X POST http://localhost:8000/api/ai/product-recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{"user_id": "new-user-123", "limit": 5}'

# Vérifier strategy_used dans la réponse
```

## Étape 5 : Tests avancés

### Test de performance

```bash
# Avec Apache Bench
echo '{"user_id":"test-user","limit":10}' > payload.json

ab -n 1000 -c 10 -T "application/json" -p payload.json \
  http://localhost:8000/api/ai/product-recommendations/personalized
```

**Objectifs** :
- Requests per second : > 100
- Time per request : < 100ms (mean)

### Tests unitaires

```bash
cd services/tsa-ai
pytest tests/test_product_recommendations.py -v
```

**Couverture attendue** : > 85%

## Étape 6 : Intégration avec AdonisJS

### Via l'API AdonisJS

```bash
# 1. Login pour obtenir un token
TOKEN=$(curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' | jq -r '.token.accessToken')

# 2. Obtenir des recommandations
curl http://localhost:3333/api/shop/product-recommendations?limit=5 \
  -H "Authorization: Bearer $TOKEN"
```

## Indicateurs de succès

### ✅ Le système fonctionne correctement si :

1. **Health check** retourne `status: "healthy"`
2. **Produits populaires** retourne une liste avec `total > 0`
3. **Recommandations personnalisées** retourne `success: true`
4. **Stratégie appropriée** est sélectionnée selon l'utilisateur
5. **Temps de réponse** < 200ms
6. **Pas d'erreurs** dans les logs

### 🔍 Vérifier les logs

```bash
# Logs FastAPI
tail -f services/tsa-ai/logs/app.log

# Logs AdonisJS
# Visible dans le terminal où npm run dev est lancé
```

## Dépannage rapide

### Problème : Service ne démarre pas

```bash
# Vérifier PostgreSQL
psql -U postgres -c "SELECT 1"

# Vérifier les variables d'environnement
cat services/tsa-ai/.env
cat services/tsa-monolith/.env

# Réinstaller les dépendances
cd services/tsa-ai
pip install -r requirements.txt

cd services/tsa-monolith
npm install
```

### Problème : Aucune recommandation retournée

```bash
# Vérifier qu'il y a des données en base
psql -U postgres -d tsa_contest

SELECT COUNT(*) FROM products WHERE is_active = true;
SELECT COUNT(*) FROM orders WHERE status = 'paid';

# Si 0 → Créer des données de test
cd services/tsa-monolith
node ace db:seed
```

### Problème : Performances lentes

```bash
# Vérifier les index
psql -U postgres -d tsa_contest

\di  -- Liste les index

# Analyser les requêtes lentes
# Dans services/tsa-ai/app/core/database.py
# Activer logging:
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

## Prochaines étapes

### 📖 Documentation complète

- **[Architecture et algorithmes détaillés](./PRODUCT_RECOMMENDATION_SYSTEM.md)**
- **[Guide de test complet](./services/tsa-ai/TEST_RECOMMENDATIONS.md)**
- **[Résumé](./docs/RECOMMENDATION_SYSTEM.md)**

### 🎯 Aller plus loin

1. **Tester différents contextes** : homepage, product, cart, checkout
2. **Soumettre du feedback** : Améliorer les recommandations
3. **Tests de charge** : Vérifier la scalabilité
4. **Intégrer au frontend** : Afficher les recommandations dans l'UI

### 🧪 Environnements de test

Créer des utilisateurs avec différents historiques :

```sql
-- Nouveau utilisateur (0 achat)
INSERT INTO users (id, email, password, first_name, last_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'new@test.com', '...', 'New', 'User');

-- Utilisateur avec 1 achat
-- Créer user + 1 order + 1 order_item

-- Utilisateur avec 5 achats
-- Créer user + 5 orders + multiple order_items
```

## Aide et support

### 📚 Ressources

- **Documentation** : Voir les fichiers référencés dans le README
- **Code source** :
  - `services/tsa-ai/app/services/product_recommendation_service.py`
  - `services/tsa-ai/app/endpoints/product_recommendations.py`
- **Tests** : `services/tsa-ai/tests/test_product_recommendations.py`

### 🐛 Signaler un bug

1. Vérifier les logs
2. Reproduire le problème
3. Créer une issue GitHub avec :
   - Description du problème
   - Étapes pour reproduire
   - Logs d'erreur
   - Configuration (OS, versions)

---

**✅ Checklist de démarrage**

- [ ] Services FastAPI et AdonisJS démarrés
- [ ] Health check retourne `healthy`
- [ ] Script de test automatisé passe tous les tests
- [ ] Produits populaires retournés
- [ ] Recommandations personnalisées fonctionnelles
- [ ] Temps de réponse < 200ms
- [ ] Pas d'erreurs dans les logs

**🎉 Si tous les points sont cochés, le système est opérationnel !**

---

**Temps total : ~5 minutes** ⏱️

Pour toute question, consultez la [documentation complète](./PRODUCT_RECOMMENDATION_SYSTEM.md).
