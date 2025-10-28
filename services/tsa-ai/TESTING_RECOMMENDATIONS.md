# 📋 Guide de Test - Système de Recommandation de Produits

## 🎯 Vue d'ensemble

Ce document guide les tests complets du système de recommandation de produits, depuis les recommandations de base jusqu'aux fonctionnalités avancées (auto-tuning, stats, A/B testing).

## ⚙️ Prérequis

### 1. Services en cours d'exécution

```bash
# Terminal 1 : AdonisJS (port 3333)
cd services/tsa-monolith
npm run dev

# Terminal 2 : FastAPI (port 8000)
cd services/tsa-ai
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3 : PostgreSQL
# Vérifier que PostgreSQL est démarré et accessible
```

### 2. Base de données

```bash
# Vérifier que les tables de recommandation existent
psql -h 127.0.0.1 -U postgres -d tsa_contest -c "\dt product_recommendation*"

# Résultat attendu :
# product_recommendation_feedbacks
# product_recommendation_stats
```

### 3. Variables d'environnement

Vérifier dans `services/tsa-ai/.env` :

```bash
# Configuration recommandation
REC_MIN_PURCHASES_COLLABORATIVE=3
REC_MIN_PURCHASES_CONTENT=1
REC_SIMILAR_USERS_LIMIT=20
REC_MIN_COMMON_PRODUCTS=2
REC_PRICE_RANGE_MULTIPLIER=0.5
REC_SIMILAR_PRICE_RANGE=0.3
REC_DEFAULT_TIME_WINDOW_DAYS=30

# A/B Testing (activer pour tester)
REC_AB_TESTING_ENABLED=true
```

### 4. Données de test

Créer des utilisateurs et produits de test via AdonisJS :

```bash
cd services/tsa-monolith
node ace create:test-users
```

---

## 📦 Phase 1 : Tests des Recommandations de Base

### 1.1 Recommandations Personnalisées

**Endpoint** : `POST /api/ai/product-recommendations/personalized`

**Test depuis Postman/Insomnia** :

```http
POST http://localhost:8000/api/ai/product-recommendations/personalized
Content-Type: application/json

{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "limit": 10,
  "context": "homepage",
  "exclude_product_ids": []
}
```

**Test depuis curl** :

```bash
curl -X POST http://localhost:8000/api/ai/product-recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_HERE",
    "limit": 10,
    "context": "homepage"
  }'
```

**Réponse attendue** :

```json
{
  "success": true,
  "recommendations": [
    {
      "product_id": "uuid-du-produit",
      "score": 0.850,
      "reason": "Aimé par des utilisateurs similaires (15 achats)",
      "confidence": 0.8
    }
  ],
  "strategy_used": "collaborative_filtering",
  "total": 10,
  "processing_time_ms": 45.23,
  "metadata": {
    "ab_test_group": "variant_a",
    "ab_test_config": {
      "min_purchases_collaborative": 2,
      "min_common_products": 1,
      "similar_users_limit": 20
    }
  },
  "timestamp": "2025-10-28T10:30:00Z"
}
```

**Stratégies possibles** :
- `collaborative_filtering` : Utilisateur avec ≥3 achats
- `content_based` : Utilisateur avec ≥1 achat
- `popularity_based` : Nouvel utilisateur sans historique

### 1.2 Produits Similaires

**Endpoint** : `POST /api/ai/product-recommendations/similar`

```http
POST http://localhost:8000/api/ai/product-recommendations/similar
Content-Type: application/json

{
  "product_id": "abc12345-e89b-12d3-a456-426614174000",
  "limit": 5
}
```

**Réponse attendue** :

```json
{
  "success": true,
  "recommendations": [
    {
      "product_id": "uuid-produit-similaire",
      "score": 0.920,
      "reason": "Même catégorie et prix similaire",
      "confidence": 0.8
    }
  ],
  "strategy_used": "content_similarity",
  "total": 5,
  "processing_time_ms": 12.45
}
```

### 1.3 Produits Populaires

**Endpoint** : `GET /api/ai/product-recommendations/popular`

```http
GET http://localhost:8000/api/ai/product-recommendations/popular?limit=10&time_window_days=30
```

```bash
curl "http://localhost:8000/api/ai/product-recommendations/popular?limit=10&time_window_days=30"
```

**Réponse attendue** :

```json
{
  "success": true,
  "recommendations": [
    {
      "product_id": "uuid-produit-populaire",
      "score": 1.0,
      "reason": "Produit populaire (42 commandes récentes)",
      "confidence": 0.85
    }
  ],
  "strategy_used": "popularity",
  "total": 10
}
```

---

## 💬 Phase 2 : Test du Feedback

**Endpoint** : `POST /api/ai/product-recommendations/feedback`

Le feedback alimente les stats et l'auto-tuning.

### 2.1 Envoyer du feedback

```http
POST http://localhost:8000/api/ai/product-recommendations/feedback
Content-Type: application/json

{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "product_id": "abc12345-e89b-12d3-a456-426614174000",
  "action": "view",
  "context": "homepage",
  "timestamp": "2025-10-28T10:30:00Z"
}
```

**Actions possibles** :
- `view` : L'utilisateur a vu le produit
- `click` : L'utilisateur a cliqué sur le produit
- `add_to_cart` : Ajouté au panier
- `purchase` : Produit acheté ✅
- `ignore` : Recommandation ignorée
- `remove` : Retiré du panier

### 2.2 Séquence complète de feedback

Pour simuler un parcours utilisateur complet :

```bash
# 1. Vue du produit
curl -X POST http://localhost:8000/api/ai/product-recommendations/feedback \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","product_id":"PRODUCT_ID","action":"view","context":"homepage"}'

# 2. Clic sur le produit
curl -X POST http://localhost:8000/api/ai/product-recommendations/feedback \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","product_id":"PRODUCT_ID","action":"click","context":"homepage"}'

# 3. Ajout au panier
curl -X POST http://localhost:8000/api/ai/product-recommendations/feedback \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","product_id":"PRODUCT_ID","action":"add_to_cart","context":"product"}'

# 4. Achat
curl -X POST http://localhost:8000/api/ai/product-recommendations/feedback \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","product_id":"PRODUCT_ID","action":"purchase","context":"checkout"}'
```

**Réponse attendue** :

```json
{
  "message": "Feedback reçu avec succès",
  "status": "success",
  "action": "purchase",
  "timestamp": "2025-10-28T10:30:00Z",
  "stored": true
}
```

### 2.3 Vérifier le stockage

```bash
# Vérifier dans la base de données
psql -h 127.0.0.1 -U postgres -d tsa_contest -c "
SELECT user_id, product_id, action, strategy_used,
       metadata->>'ab_test_group' as ab_group, created_at
FROM product_recommendation_feedbacks
ORDER BY created_at DESC
LIMIT 10;
"
```

---

## 📊 Phase 3 : Statistiques en Temps Réel

**Endpoint** : `GET /api/ai/product-recommendations/stats`

### 3.1 Obtenir les statistiques

```bash
curl http://localhost:8000/api/ai/product-recommendations/stats
```

**Réponse attendue** :

```json
{
  "total_recommendations_served": 1523,
  "total_users_recommended": 342,
  "total_views": 1523,
  "total_clicks": 234,
  "total_purchases": 45,
  "strategies_performance": {
    "collaborative_filtering": {
      "usage_count": 856,
      "avg_ctr": 15.3,
      "avg_conversion": 19.2
    },
    "content_based": {
      "usage_count": 423,
      "avg_ctr": 14.1,
      "avg_conversion": 16.8
    },
    "popularity_based": {
      "usage_count": 244,
      "avg_ctr": 12.5,
      "avg_conversion": 14.2
    }
  },
  "last_updated": "2025-10-28T10:30:00Z",
  "status": "operational"
}
```

**Métriques clés** :
- **CTR (Click-Through Rate)** : (clicks / views) × 100
- **Conversion Rate** : (purchases / clicks) × 100

---

## 🔧 Phase 4 : Auto-Tuning des Seuils

**Endpoint** : `GET /api/ai/product-recommendations/analyze-thresholds`

### 4.1 Obtenir les recommandations d'ajustement

```bash
curl http://localhost:8000/api/ai/product-recommendations/analyze-thresholds
```

**Réponse attendue** :

```json
{
  "current_thresholds": {
    "min_purchases_collaborative": 3,
    "min_purchases_content": 1,
    "similar_users_limit": 20,
    "min_common_products": 2
  },
  "performance_metrics": {
    "collaborative_conversion": 4.2,
    "content_conversion": 6.5,
    "popularity_conversion": 2.8
  },
  "suggested_adjustments": {
    "min_purchases_collaborative": 2
  },
  "reasoning": [
    "Content-based significantly outperforms collaborative - consider prioritizing it",
    "Collaborative filtering performs well - consider lowering threshold to serve more users"
  ],
  "recommendation": "Apply suggested adjustments and monitor for 7 days"
}
```

### 4.2 Interpréter les résultats

**Scénario 1 : Collaborative performe bien (>5% conversion)**
→ Suggère de baisser le seuil (ex: 3 → 2) pour servir plus d'utilisateurs

**Scénario 2 : Collaborative sous-performe (<2% conversion)**
→ Suggère d'augmenter le seuil (ex: 3 → 4) pour améliorer la qualité

**Scénario 3 : Content-based surperforme**
→ Recommande de prioriser cette stratégie

### 4.3 Appliquer les ajustements

Modifier `.env` en fonction des suggestions :

```bash
# Si suggestion : min_purchases_collaborative = 2
REC_MIN_PURCHASES_COLLABORATIVE=2

# Redémarrer le service
# uvicorn app.main:app --reload
```

---

## 🧪 Phase 5 : Tests A/B

**Endpoint** : `GET /api/ai/product-recommendations/ab-test-results`

### 5.1 Activer l'A/B testing

```bash
# Dans services/tsa-ai/.env
REC_AB_TESTING_ENABLED=true

# Redémarrer FastAPI
```

### 5.2 Obtenir les résultats

```bash
curl http://localhost:8000/api/ai/product-recommendations/ab-test-results
```

**Réponse attendue** :

```json
{
  "enabled": true,
  "period": "last_30_days",
  "groups": {
    "control": {
      "group": "control",
      "total_users": 1245,
      "total_impressions": 8934,
      "overall_conversion_rate": 3.2,
      "strategies": {
        "collaborative_filtering": {
          "users": 856,
          "impressions": 6123,
          "views": 6123,
          "clicks": 765,
          "purchases": 192,
          "ctr": 12.5,
          "conversion_rate": 25.1
        }
      }
    },
    "variant_a": {
      "group": "variant_a",
      "total_users": 1187,
      "total_impressions": 8521,
      "overall_conversion_rate": 4.1,
      "strategies": {
        "collaborative_filtering": {
          "ctr": 15.2,
          "conversion_rate": 27.0
        }
      }
    },
    "variant_b": {
      "group": "variant_b",
      "total_users": 1198,
      "total_impressions": 8612,
      "overall_conversion_rate": 2.9,
      "strategies": {
        "collaborative_filtering": {
          "ctr": 11.8,
          "conversion_rate": 24.6
        }
      }
    }
  },
  "winner": "variant_a",
  "best_conversion_rate": 4.1,
  "recommendation": "Group 'variant_a' performs best with 4.10% conversion rate"
}
```

### 5.3 Comprendre les groupes

**Control (34%)** : Configuration standard
- `min_purchases_collaborative = 3`
- `min_common_products = 2`
- `similar_users_limit = 20`

**Variant A (33%)** : Plus agressif
- `min_purchases_collaborative = 2`
- `min_common_products = 1`
- `similar_users_limit = 20`

**Variant B (33%)** : Plus conservateur
- `min_purchases_collaborative = 4`
- `min_common_products = 2`
- `similar_users_limit = 30`

### 5.4 Vérifier l'assignation des utilisateurs

```bash
# Vérifier dans la DB
psql -h 127.0.0.1 -U postgres -d tsa_contest -c "
SELECT
  metadata->>'ab_test_group' as ab_group,
  COUNT(DISTINCT user_id) as users,
  COUNT(*) as total_feedback
FROM product_recommendation_feedbacks
WHERE metadata IS NOT NULL
GROUP BY metadata->>'ab_test_group';
"
```

**Résultat attendu** :
```
 ab_group  | users | total_feedback
-----------+-------+----------------
 control   |  1245 |          8934
 variant_a |  1187 |          8521
 variant_b |  1198 |          8612
```

---

## ⏰ Phase 6 : Job Cron pour Stats

### 6.1 Exécuter manuellement

```bash
cd services/tsa-ai
python scripts/calculate_recommendation_stats.py --period daily
```

**Output attendu** :

```
2025-10-28 10:30:00 - INFO - Starting recommendation stats calculation - period: daily
2025-10-28 10:30:00 - INFO - Calculating daily stats for period: 2025-10-28
2025-10-28 10:30:01 - INFO - Processing strategy: collaborative_filtering
2025-10-28 10:30:01 - INFO -   ✓ collaborative_filtering: 856 recs, CTR: 12.50%, Conv: 25.10%
2025-10-28 10:30:02 - INFO - Processing strategy: content_based
2025-10-28 10:30:02 - INFO -   ✓ content_based: 423 recs, CTR: 14.10%, Conv: 16.80%
2025-10-28 10:30:03 - INFO - Processing strategy: popularity
2025-10-28 10:30:03 - INFO -   ✓ popularity: 244 recs, CTR: 12.50%, Conv: 14.20%
2025-10-28 10:30:04 - INFO - ✓ Successfully calculated daily stats for 2025-10-28
2025-10-28 10:30:04 - INFO - Stats calculation completed successfully
```

### 6.2 Vérifier les stats stockées

```bash
psql -h 127.0.0.1 -U postgres -d tsa_contest -c "
SELECT
  strategy,
  period_type,
  period_date,
  total_recommendations,
  ctr_bps/100.0 as ctr_percent,
  conversion_rate_bps/100.0 as conv_percent
FROM product_recommendation_stats
ORDER BY period_date DESC, strategy
LIMIT 10;
"
```

### 6.3 Configurer le cron

```bash
# Éditer crontab
crontab -e

# Ajouter (remplacer /path/to par votre chemin réel)
0 1 * * * cd /path/to/tsa-innovlab/services/tsa-ai && python3 scripts/calculate_recommendation_stats.py --period daily >> /var/log/recommendation_stats_daily.log 2>&1
```

---

## 🎯 Scénarios de Test Complets

### Scénario 1 : Parcours Utilisateur Complet

```bash
USER_ID="123e4567-e89b-12d3-a456-426614174000"
BASE_URL="http://localhost:8000/api/ai/product-recommendations"

# 1. Obtenir des recommandations
RECS=$(curl -X POST "$BASE_URL/personalized" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\",\"limit\":10}")

echo "$RECS" | jq '.recommendations[0]'

# 2. Extraire le premier produit recommandé
PRODUCT_ID=$(echo "$RECS" | jq -r '.recommendations[0].product_id')

# 3. Feedback : vue
curl -X POST "$BASE_URL/feedback" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\",\"product_id\":\"$PRODUCT_ID\",\"action\":\"view\"}"

# 4. Feedback : clic
curl -X POST "$BASE_URL/feedback" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\",\"product_id\":\"$PRODUCT_ID\",\"action\":\"click\"}"

# 5. Produits similaires
curl -X POST "$BASE_URL/similar" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"limit\":5}"

# 6. Feedback : achat
curl -X POST "$BASE_URL/feedback" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\",\"product_id\":\"$PRODUCT_ID\",\"action\":\"purchase\"}"
```

### Scénario 2 : Test A/B avec Plusieurs Utilisateurs

```bash
BASE_URL="http://localhost:8000/api/ai/product-recommendations"

# Créer 100 utilisateurs de test et obtenir des recommandations
for i in {1..100}; do
  USER_ID=$(uuidgen)

  curl -X POST "$BASE_URL/personalized" \
    -H "Content-Type: application/json" \
    -d "{\"user_id\":\"$USER_ID\",\"limit\":5}" \
    > /dev/null 2>&1

  echo "User $i: $USER_ID"
done

# Vérifier la distribution A/B
curl "$BASE_URL/ab-test-results" | jq '.groups | keys'
```

### Scénario 3 : Monitoring et Optimisation

```bash
BASE_URL="http://localhost:8000/api/ai/product-recommendations"

# 1. Obtenir les stats actuelles
curl "$BASE_URL/stats" | jq '.strategies_performance'

# 2. Obtenir les recommandations d'optimisation
curl "$BASE_URL/analyze-thresholds" | jq '.suggested_adjustments'

# 3. Vérifier les résultats A/B
curl "$BASE_URL/ab-test-results" | jq '{winner, best_conversion_rate, recommendation}'

# 4. Calculer les stats
python scripts/calculate_recommendation_stats.py --period daily
```

---

## 📈 Métriques de Succès

### Indicateurs clés

| Métrique | Objectif | Formule |
|----------|----------|---------|
| **CTR** | >12% | (clicks / views) × 100 |
| **Conversion Rate** | >20% | (purchases / clicks) × 100 |
| **Avg Processing Time** | <100ms | - |
| **User Coverage** | >80% | users_with_recs / total_users |

### Critères de validation

✅ **Test réussi si** :
- Recommandations retournées en <100ms
- CTR global >12%
- Conversion rate >20%
- A/B testing montre un gagnant clair (>10% d'écart)
- Auto-tuning suggère des ajustements pertinents
- Feedback stocké correctement dans la DB

❌ **Test échoué si** :
- Temps de réponse >500ms
- Erreurs 500 fréquentes
- CTR <5%
- Aucune recommandation pour utilisateurs avec historique
- A/B testing ne différencie pas les groupes

---

## 🐛 Troubleshooting

### Problème : 404 Not Found

```bash
# Vérifier que FastAPI tourne
curl http://localhost:8000/docs

# Vérifier le bon préfixe
# ✅ Correct : /api/ai/product-recommendations/...
# ❌ Incorrect : /api/ai/recommendations/...
```

### Problème : Pas de recommandations

```bash
# Vérifier qu'il y a des données dans la DB
psql -h 127.0.0.1 -U postgres -d tsa_contest -c "
SELECT COUNT(*) FROM products WHERE is_active = true;
SELECT COUNT(*) FROM orders WHERE status IN ('paid', 'processing', 'shipped', 'delivered');
"
```

### Problème : Stats à 0

```bash
# Vérifier qu'il y a du feedback
psql -h 127.0.0.1 -U postgres -d tsa_contest -c "
SELECT COUNT(*) FROM product_recommendation_feedbacks;
"

# Envoyer du feedback de test (voir Phase 2)
```

### Problème : A/B testing désactivé

```bash
# Vérifier la variable d'environnement
cd services/tsa-ai
grep REC_AB_TESTING_ENABLED .env

# Doit être : REC_AB_TESTING_ENABLED=true

# Redémarrer FastAPI après modification
```

---

## 📚 Ressources

- **Documentation API** : http://localhost:8000/docs
- **Base de données** : `tsa_contest` sur PostgreSQL
- **Logs** : `services/tsa-ai/logs/`
- **Configuration** : `services/tsa-ai/.env`

---

## ✅ Checklist de Test

- [ ] Service FastAPI démarré (port 8000)
- [ ] Service AdonisJS démarré (port 3333)
- [ ] PostgreSQL accessible
- [ ] Tables de recommandation créées
- [ ] Variables d'environnement configurées
- [ ] Données de test disponibles
- [ ] **Phase 1** : Recommandations personnalisées testées
- [ ] **Phase 1** : Produits similaires testés
- [ ] **Phase 1** : Produits populaires testés
- [ ] **Phase 2** : Feedback envoyé et stocké
- [ ] **Phase 3** : Stats en temps réel vérifiées
- [ ] **Phase 4** : Auto-tuning testé
- [ ] **Phase 5** : A/B testing activé et vérifié
- [ ] **Phase 6** : Job cron exécuté manuellement
- [ ] Métriques de succès atteintes
- [ ] Documentation mise à jour

---

**Date de création** : 2025-10-28
**Version** : 1.0
**Service** : TSA InnovLab - Système de Recommandation
