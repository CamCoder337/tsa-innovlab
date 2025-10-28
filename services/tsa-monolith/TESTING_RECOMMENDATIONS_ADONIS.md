# 📋 Guide de Test - Recommandations depuis AdonisJS

## 🎯 Vue d'ensemble

Ce document guide les tests du système de recommandation de produits **depuis AdonisJS** (port 3333).
Toutes les routes passent par le service AdonisJS qui proxy les appels vers FastAPI.

---

## ⚙️ Prérequis

### 1. Services démarrés

```bash
# Terminal 1 : PostgreSQL
# Vérifier que PostgreSQL est accessible

# Terminal 2 : FastAPI (port 8000)
cd services/tsa-ai
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3 : AdonisJS (port 3333)
cd services/tsa-monolith
npm run dev
```

### 2. Authentification

**Toutes les routes de recommandation nécessitent une authentification** sauf `/popular`.

Obtenir un token :

```bash
# 1. Se connecter
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }'

# Réponse :
# {
#   "success": true,
#   "message": "Login successful",
#   "data": {
#     "type": "bearer",
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#     "user": {...}
#   }
# }
```

**Utiliser le token dans tous les appels** :

```bash
Authorization: Bearer <votre-token>
```

---

## 📦 Phase 1 : Tests des Recommandations de Base

### 1.1 Recommandations Personnalisées

**URL** : `GET http://localhost:3333/api/shop/product-recommendations`

```bash
curl -X GET "http://localhost:3333/api/shop/product-recommendations?limit=10&context=homepage" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Paramètres de requête** :
- `limit` (optionnel) : Nombre de produits (défaut: 10)
- `context` (optionnel) : homepage | product | cart | checkout

**Réponse attendue** :

```json
{
  "success": true,
  "message": "Personalized recommendations retrieved successfully",
  "data": {
    "products": [
      {
        "id": "uuid-du-produit",
        "name": "Nom du produit",
        "price": 15000,
        "stock": 50,
        "is_active": true,
        "category": {
          "id": "uuid-categorie",
          "name": "Électronique"
        },
        "recommendation_score": 0.850,
        "recommendation_reason": "Aimé par des utilisateurs similaires (15 achats)"
      }
    ],
    "strategy": "collaborative_filtering",
    "total": 10
  }
}
```

**Stratégies possibles** :
- `collaborative_filtering` : Utilisateur avec ≥3 achats
- `content_based` : Utilisateur avec ≥1 achat
- `popularity_based` : Nouvel utilisateur
- `fallback_recent` : Si AI service indisponible

### 1.2 Produits Similaires

**URL** : `GET http://localhost:3333/api/shop/product-recommendations/similar/:id`

```bash
PRODUCT_ID="abc12345-e89b-12d3-a456-426614174000"

curl -X GET "http://localhost:3333/api/shop/product-recommendations/similar/$PRODUCT_ID?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue** :

```json
{
  "success": true,
  "message": "Similar products retrieved successfully",
  "data": {
    "base_product": {
      "id": "abc12345...",
      "name": "iPhone 14 Pro",
      "price": 550000
    },
    "products": [
      {
        "id": "uuid-produit-similaire",
        "name": "iPhone 14",
        "price": 500000,
        "similarity_score": 0.920,
        "similarity_reason": "Même catégorie et prix similaire"
      }
    ],
    "strategy": "content_similarity",
    "total": 5
  }
}
```

### 1.3 Produits Populaires (Public - Pas d'auth)

**URL** : `GET http://localhost:3333/api/shop/product-recommendations/popular`

```bash
curl -X GET "http://localhost:3333/api/shop/product-recommendations/popular?limit=10"
```

**Pas besoin de token d'authentification** ✅

**Réponse attendue** :

```json
{
  "success": true,
  "message": "Popular products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Produit populaire",
        "price": 25000,
        "popularity_score": 1.0,
        "popularity_reason": "Produit populaire (42 commandes récentes)"
      }
    ],
    "strategy": "popularity",
    "total": 10
  }
}
```

---

## 💬 Phase 2 : Test du Feedback

**URL** : `POST http://localhost:3333/api/shop/product-recommendations/feedback`

### 2.1 Envoyer du feedback

```bash
curl -X POST http://localhost:3333/api/shop/product-recommendations/feedback \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "abc12345-e89b-12d3-a456-426614174000",
    "action": "view",
    "context": "homepage"
  }'
```

**Actions possibles** :
- `view` : L'utilisateur a vu le produit
- `click` : L'utilisateur a cliqué
- `add_to_cart` : Ajouté au panier
- `purchase` : Produit acheté ✅
- `ignore` : Recommandation ignorée
- `remove` : Retiré du panier

**Réponse attendue** :

```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "action": "view",
    "product_id": "abc12345...",
    "timestamp": "2025-10-28T10:30:00Z"
  }
}
```

### 2.2 Parcours utilisateur complet

```bash
TOKEN="YOUR_TOKEN_HERE"
PRODUCT_ID="abc12345-e89b-12d3-a456-426614174000"

# 1. Vue
curl -X POST http://localhost:3333/api/shop/product-recommendations/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"action\":\"view\",\"context\":\"homepage\"}"

# 2. Clic
curl -X POST http://localhost:3333/api/shop/product-recommendations/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"action\":\"click\",\"context\":\"homepage\"}"

# 3. Ajout panier
curl -X POST http://localhost:3333/api/shop/product-recommendations/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"action\":\"add_to_cart\",\"context\":\"product\"}"

# 4. Achat
curl -X POST http://localhost:3333/api/shop/product-recommendations/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"action\":\"purchase\",\"context\":\"checkout\"}"
```

---

## 📊 Phase 3 : Statistiques en Temps Réel

**URL** : `GET http://localhost:3333/api/shop/product-recommendations/stats`

### 3.1 Obtenir les statistiques

```bash
curl -X GET http://localhost:3333/api/shop/product-recommendations/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue** :

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
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
}
```

**Métriques** :
- **CTR** (Click-Through Rate) : % de clics sur les vues
- **Conversion Rate** : % d'achats sur les clics

---

## 🔧 Phase 4 : Auto-Tuning des Seuils

**URL** : `GET http://localhost:3333/api/shop/product-recommendations/analyze-thresholds`

### 4.1 Obtenir les recommandations d'ajustement

```bash
curl -X GET http://localhost:3333/api/shop/product-recommendations/analyze-thresholds \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue** :

```json
{
  "success": true,
  "message": "Threshold analysis retrieved successfully",
  "data": {
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
}
```

### 4.2 Interpréter les résultats

**Si collaborative > 5% conversion** :
→ Suggère de **baisser le seuil** (ex: 3 → 2) pour servir plus d'utilisateurs

**Si collaborative < 2% conversion** :
→ Suggère d'**augmenter le seuil** (ex: 3 → 4) pour améliorer la qualité

**Si content-based surperforme** :
→ Recommande de **prioriser cette stratégie**

---

## 🧪 Phase 5 : Tests A/B

**URL** : `GET http://localhost:3333/api/shop/product-recommendations/ab-test-results`

### 5.1 Obtenir les résultats

```bash
curl -X GET http://localhost:3333/api/shop/product-recommendations/ab-test-results \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue** :

```json
{
  "success": true,
  "message": "A/B test results retrieved successfully",
  "data": {
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
            "ctr": 12.5,
            "conversion_rate": 25.1
          }
        }
      },
      "variant_a": {
        "overall_conversion_rate": 4.1
      },
      "variant_b": {
        "overall_conversion_rate": 2.9
      }
    },
    "winner": "variant_a",
    "best_conversion_rate": 4.1,
    "recommendation": "Group 'variant_a' performs best with 4.10% conversion rate"
  }
}
```

### 5.2 Configuration des groupes

**Control (34%)** : Configuration standard
- min_purchases_collaborative = 3
- min_common_products = 2
- similar_users_limit = 20

**Variant A (33%)** : Plus agressif ⚡
- min_purchases_collaborative = 2
- min_common_products = 1
- similar_users_limit = 20

**Variant B (33%)** : Plus conservateur 🎯
- min_purchases_collaborative = 4
- min_common_products = 2
- similar_users_limit = 30

---

## 🎯 Scénarios de Test Complets

### Scénario 1 : Parcours Client E-commerce

```bash
TOKEN="YOUR_TOKEN_HERE"
BASE_URL="http://localhost:3333/api/shop"

# 1. Se connecter
LOGIN_RESPONSE=$(curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

# 2. Obtenir des recommandations personnalisées
curl -X GET "$BASE_URL/product-recommendations?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.products[0]'

# 3. Feedback : vue du produit
PRODUCT_ID="<extraire depuis la réponse>"
curl -X POST "$BASE_URL/product-recommendations/feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"action\":\"view\"}"

# 4. Voir des produits similaires
curl -X GET "$BASE_URL/product-recommendations/similar/$PRODUCT_ID?limit=5" \
  -H "Authorization: Bearer $TOKEN"

# 5. Feedback : clic
curl -X POST "$BASE_URL/product-recommendations/feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"action\":\"click\"}"

# 6. Feedback : ajout panier
curl -X POST "$BASE_URL/product-recommendations/feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"action\":\"add_to_cart\"}"

# 7. Feedback : achat
curl -X POST "$BASE_URL/product-recommendations/feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"action\":\"purchase\"}"
```

### Scénario 2 : Monitoring Administrateur

```bash
TOKEN="YOUR_ADMIN_TOKEN"
BASE_URL="http://localhost:3333/api/shop/product-recommendations"

# 1. Consulter les statistiques
curl -X GET "$BASE_URL/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.strategies_performance'

# 2. Analyser les seuils
curl -X GET "$BASE_URL/analyze-thresholds" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.suggested_adjustments'

# 3. Vérifier les tests A/B
curl -X GET "$BASE_URL/ab-test-results" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {winner, best_conversion_rate}'
```

### Scénario 3 : Test de Performance

```bash
# Tester la latence des endpoints
TOKEN="YOUR_TOKEN"

# Recommandations personnalisées
time curl -X GET "http://localhost:3333/api/shop/product-recommendations" \
  -H "Authorization: Bearer $TOKEN" -w "\nTime: %{time_total}s\n"

# Stats
time curl -X GET "http://localhost:3333/api/shop/product-recommendations/stats" \
  -H "Authorization: Bearer $TOKEN" -w "\nTime: %{time_total}s\n"

# Produits populaires (sans auth)
time curl -X GET "http://localhost:3333/api/shop/product-recommendations/popular" \
  -w "\nTime: %{time_total}s\n"
```

---

## 📈 Métriques de Succès

| Métrique | Objectif | Interprétation |
|----------|----------|----------------|
| **Latence** | <200ms | Temps de réponse depuis AdonisJS |
| **CTR Global** | >12% | Taux de clic sur les recommandations |
| **Conversion Rate** | >20% | Taux d'achat sur les clics |
| **Disponibilité** | >99% | Service AI accessible |

### Critères de validation

✅ **Test réussi** :
- Toutes les routes retournent 200 OK
- Latence < 200ms depuis AdonisJS
- Feedback stocké correctement
- Stats à jour et cohérentes
- A/B testing différencie les groupes

❌ **Test échoué** :
- Erreurs 503 (AI service indisponible)
- Erreurs 401/403 (problème d'auth)
- Latence > 500ms
- Stats à 0 malgré du feedback

---

## 🐛 Troubleshooting

### Erreur 401 Unauthorized

```bash
# Vérifier que le token est valide
curl -X GET http://localhost:3333/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Solution** : Se reconnecter pour obtenir un nouveau token

### Erreur 503 AI Service Unavailable

```bash
# Vérifier que FastAPI tourne
curl http://localhost:8000/api/ai/health
```

**Solution** :
```bash
cd services/tsa-ai
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Pas de recommandations (fallback)

```bash
# Vérifier qu'il y a des données
psql -h 127.0.0.1 -U postgres -d tsa_contest -c "
SELECT COUNT(*) FROM products WHERE is_active = true;
SELECT COUNT(*) FROM orders WHERE status IN ('paid', 'delivered');
"
```

**Solution** : Créer des données de test

### Stats à 0

```bash
# Vérifier qu'il y a du feedback
psql -h 127.0.0.1 -U postgres -d tsa_contest -c "
SELECT COUNT(*) FROM product_recommendation_feedbacks;
"
```

**Solution** : Envoyer du feedback via l'endpoint

---

## 🔑 Variables d'Environnement

### AdonisJS (.env)

```bash
# URL du service FastAPI
FASTAPI_BASE_URL=http://localhost:8000

# Optionnel : Timeout pour les appels AI
AI_SERVICE_TIMEOUT=10000
```

### FastAPI (.env)

```bash
# Activer l'A/B testing
REC_AB_TESTING_ENABLED=true

# Seuils configurables
REC_MIN_PURCHASES_COLLABORATIVE=3
REC_SIMILAR_USERS_LIMIT=20
REC_MIN_COMMON_PRODUCTS=2
```

---

## 📚 Endpoints Résumé

| Endpoint | Méthode | Auth | Description |
|----------|---------|------|-------------|
| `/product-recommendations` | GET | ✅ | Recommandations personnalisées |
| `/product-recommendations/similar/:id` | GET | ✅ | Produits similaires |
| `/product-recommendations/popular` | GET | ❌ | Produits populaires (public) |
| `/product-recommendations/feedback` | POST | ✅ | Soumettre feedback |
| `/product-recommendations/stats` | GET | ✅ | Statistiques système |
| `/product-recommendations/analyze-thresholds` | GET | ✅ | Auto-tuning |
| `/product-recommendations/ab-test-results` | GET | ✅ | Résultats A/B |

**Base URL** : `http://localhost:3333/api/shop`

---

## ✅ Checklist de Test

- [ ] Service AdonisJS démarré (port 3333)
- [ ] Service FastAPI démarré (port 8000)
- [ ] PostgreSQL accessible
- [ ] Compte utilisateur créé
- [ ] Token d'authentification obtenu
- [ ] **Recommandations personnalisées** testées
- [ ] **Produits similaires** testés
- [ ] **Produits populaires** testés
- [ ] **Feedback** envoyé et stocké
- [ ] **Statistiques** vérifiées
- [ ] **Auto-tuning** testé
- [ ] **A/B testing** vérifié
- [ ] Latence < 200ms
- [ ] Métriques de succès atteintes

---

**Date de création** : 2025-10-28
**Version** : 1.0
**Service** : TSA InnovLab - AdonisJS Routes
**Port** : 3333
