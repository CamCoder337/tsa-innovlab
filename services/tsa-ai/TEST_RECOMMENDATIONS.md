# Guide de Test Rapide - Système de Recommandation

## Démarrage rapide

### 1. Démarrer les services

```bash
# Terminal 1 - Service FastAPI
cd services/tsa-ai
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Service AdonisJS (optionnel)
cd services/tsa-monolith
npm run dev

# Terminal 3 - PostgreSQL (si pas déjà lancé)
# Voir docker-compose.yml
```

### 2. Vérifier la santé du service

```bash
curl http://localhost:8000/api/ai/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00"
}
```

## Tests manuels avec curl

### Test 1: Produits populaires

**Sans authentification requise**

```bash
curl "http://localhost:8000/api/ai/product-recommendations/popular?limit=5&time_window_days=30"
```

Réponse attendue :
```json
{
  "success": true,
  "recommendations": [
    {
      "product_id": "uuid-product-1",
      "score": 1.0,
      "reason": "Produit populaire (50 commandes récentes)",
      "confidence": 0.85
    }
  ],
  "strategy_used": "popularity",
  "total": 5,
  "processing_time_ms": 45.5
}
```

### Test 2: Recommandations personnalisées

**Nouveau utilisateur (stratégie: popularity_based)**

```bash
curl -X POST http://localhost:8000/api/ai/product-recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000001",
    "limit": 5,
    "context": "homepage"
  }'
```

**Utilisateur avec historique (stratégie: collaborative_filtering)**

```bash
curl -X POST http://localhost:8000/api/ai/product-recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "limit": 10,
    "context": "homepage",
    "exclude_product_ids": []
  }'
```

### Test 3: Produits similaires

```bash
curl -X POST http://localhost:8000/api/ai/product-recommendations/similar \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "660e8400-e29b-41d4-a716-446655440001",
    "limit": 5,
    "exclude_product_ids": []
  }'
```

### Test 4: Feedback utilisateur

```bash
curl -X POST http://localhost:8000/api/ai/product-recommendations/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_id": "660e8400-e29b-41d4-a716-446655440001",
    "action": "click",
    "context": "homepage"
  }'
```

### Test 5: Statistiques

```bash
curl http://localhost:8000/api/ai/product-recommendations/stats
```

## Tests avec Python

### Script de test complet

Créer `test_all.py` :

```python
#!/usr/bin/env python3
import requests
import json
import time

BASE_URL = "http://localhost:8000/api/ai/product-recommendations"

def test_health():
    print("\n=== Test 1: Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200

def test_popular_products():
    print("\n=== Test 2: Popular Products ===")
    response = requests.get(f"{BASE_URL}/popular?limit=5&time_window_days=30")
    data = response.json()
    print(f"Strategy: {data['strategy_used']}")
    print(f"Total: {data['total']}")
    print(f"Processing time: {data.get('processing_time_ms', 0)}ms")
    assert response.status_code == 200
    assert data['success'] == True

def test_personalized_new_user():
    print("\n=== Test 3: Personalized (New User) ===")
    payload = {
        "user_id": "00000000-0000-0000-0000-000000000001",
        "limit": 5,
        "context": "homepage"
    }
    response = requests.post(f"{BASE_URL}/personalized", json=payload)
    data = response.json()
    print(f"Strategy: {data['strategy_used']}")
    print(f"Expected: popularity_based")
    assert data['strategy_used'] == 'popularity_based'

def test_personalized_existing_user():
    print("\n=== Test 4: Personalized (Existing User) ===")
    payload = {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "limit": 10
    }
    response = requests.post(f"{BASE_URL}/personalized", json=payload)
    data = response.json()
    print(f"Strategy: {data['strategy_used']}")
    print(f"Total recommendations: {data['total']}")

def test_similar_products():
    print("\n=== Test 5: Similar Products ===")
    payload = {
        "product_id": "660e8400-e29b-41d4-a716-446655440001",
        "limit": 5
    }
    response = requests.post(f"{BASE_URL}/similar", json=payload)
    data = response.json()
    print(f"Strategy: {data['strategy_used']}")
    print(f"Success: {data['success']}")

def test_performance():
    print("\n=== Test 6: Performance ===")
    times = []
    for i in range(10):
        start = time.time()
        requests.post(
            f"{BASE_URL}/personalized",
            json={"user_id": "test-user", "limit": 5}
        )
        elapsed = (time.time() - start) * 1000
        times.append(elapsed)

    avg_time = sum(times) / len(times)
    print(f"Average response time: {avg_time:.2f}ms")
    print(f"Min: {min(times):.2f}ms")
    print(f"Max: {max(times):.2f}ms")
    assert avg_time < 200, "Performance issue: average > 200ms"

if __name__ == "__main__":
    print("🚀 Starting Recommendation System Tests\n")
    print("=" * 50)

    try:
        test_health()
        test_popular_products()
        test_personalized_new_user()
        test_personalized_existing_user()
        test_similar_products()
        test_performance()

        print("\n" + "=" * 50)
        print("✅ All tests passed!")

    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
```

Exécuter :

```bash
python test_all.py
```

## Tests unitaires pytest

```bash
# Tous les tests
pytest tests/test_product_recommendations.py -v

# Test spécifique
pytest tests/test_product_recommendations.py::TestProductRecommendationService::test_get_personalized_recommendations_new_user -v

# Avec couverture
pytest tests/test_product_recommendations.py --cov=app/services --cov=app/endpoints --cov-report=html

# Afficher les logs
pytest tests/test_product_recommendations.py -v -s
```

## Tests de charge

### Avec Apache Bench

```bash
# Créer le payload
echo '{"user_id":"test-user","limit":10}' > payload.json

# Lancer le test
ab -n 1000 -c 10 -T "application/json" -p payload.json \
  http://localhost:8000/api/ai/product-recommendations/personalized

# Résultats attendus :
# Requests per second: > 100
# Time per request: < 100ms (mean)
```

### Avec k6

Créer `load_test.js` :

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },  // Montée en charge
    { duration: '1m', target: 50 },   // Plateau
    { duration: '30s', target: 0 },   // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% des requêtes < 200ms
    http_req_failed: ['rate<0.1'],    // < 10% d'erreurs
  },
};

export default function() {
  const url = 'http://localhost:8000/api/ai/product-recommendations/personalized';
  const payload = JSON.stringify({
    user_id: `user-${__VU}`,
    limit: 10,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has recommendations': (r) => JSON.parse(r.body).total > 0,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

Exécuter :

```bash
k6 run load_test.js
```

## Validation des stratégies

### Script pour tester le routage des stratégies

Créer `test_strategies.py` :

```python
#!/usr/bin/env python3
import requests

BASE_URL = "http://localhost:8000/api/ai/product-recommendations"

def test_strategy_routing():
    """
    Vérifier que la bonne stratégie est sélectionnée
    selon l'historique utilisateur
    """

    test_cases = [
        {
            "name": "Nouveau utilisateur",
            "user_id": "00000000-0000-0000-0000-000000000001",
            "expected_strategy": "popularity_based",
        },
        {
            "name": "Utilisateur avec 1-2 achats",
            "user_id": "user-with-few-purchases",
            "expected_strategy": "content_based",
        },
        {
            "name": "Utilisateur avec 3+ achats",
            "user_id": "user-with-many-purchases",
            "expected_strategy": "collaborative_filtering",
        },
    ]

    print("🧪 Testing Strategy Selection\n")
    print("=" * 60)

    for test in test_cases:
        response = requests.post(
            f"{BASE_URL}/personalized",
            json={"user_id": test["user_id"], "limit": 5}
        )

        data = response.json()
        strategy = data.get("strategy_used")

        status = "✅" if strategy == test["expected_strategy"] else "❌"

        print(f"\n{status} {test['name']}")
        print(f"   Expected: {test['expected_strategy']}")
        print(f"   Got: {strategy}")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_strategy_routing()
```

## Tests d'intégration avec AdonisJS

### Via l'API AdonisJS

```bash
# 1. Login
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' | jq -r '.token.accessToken'

# Récupérer le token

# 2. Recommandations via AdonisJS
curl http://localhost:3333/api/shop/product-recommendations?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq

# 3. Produits similaires
curl http://localhost:3333/api/shop/product-recommendations/similar/PRODUCT_ID?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq

# 4. Produits populaires (pas d'auth nécessaire)
curl http://localhost:3333/api/shop/product-recommendations/popular?limit=10 | jq
```

## Vérification des données

### Créer des données de test

```sql
-- Créer un utilisateur de test
INSERT INTO users (id, email, password, first_name, last_name, role)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@example.com',
  '$scrypt$n=16384$...',  -- Hash bcrypt de "password123"
  'Test',
  'User',
  'affreteur'
);

-- Créer des catégories
INSERT INTO categories (id, name, slug)
VALUES
  ('cat-electronics', 'Électronique', 'electronique'),
  ('cat-fashion', 'Mode', 'mode');

-- Créer des produits
INSERT INTO products (id, name, category_id, price, stock, is_active)
VALUES
  ('prod-1', 'iPhone 15 Pro', 'cat-electronics', 1199.99, 50, true),
  ('prod-2', 'MacBook Pro', 'cat-electronics', 1999.99, 30, true),
  ('prod-3', 'AirPods Pro', 'cat-electronics', 249.99, 100, true);

-- Créer des commandes
INSERT INTO orders (id, user_id, status, created_at)
VALUES
  ('order-1', '550e8400-e29b-41d4-a716-446655440000', 'paid', NOW() - INTERVAL '10 days'),
  ('order-2', '550e8400-e29b-41d4-a716-446655440000', 'paid', NOW() - INTERVAL '5 days');

-- Créer des lignes de commande
INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price)
VALUES
  (uuid_generate_v4(), 'order-1', 'prod-1', 'iPhone 15 Pro', 1, 1199.99),
  (uuid_generate_v4(), 'order-2', 'prod-2', 'MacBook Pro', 1, 1999.99);
```

## Checklist de test complète

### Fonctionnalités

- [ ] Health check fonctionne
- [ ] Produits populaires retournés
- [ ] Recommandations personnalisées (nouveau utilisateur)
- [ ] Recommandations personnalisées (utilisateur existant)
- [ ] Produits similaires
- [ ] Feedback enregistré
- [ ] Statistiques disponibles

### Stratégies

- [ ] Popularity-based pour nouveaux utilisateurs
- [ ] Content-based pour 1-2 achats
- [ ] Collaborative filtering pour 3+ achats
- [ ] Content similarity pour produits similaires

### Performance

- [ ] Temps de réponse < 100ms (moyenne)
- [ ] Temps de réponse < 200ms (95th percentile)
- [ ] Pas d'erreurs sous charge (100 req/s)
- [ ] Utilisation mémoire stable

### Validation

- [ ] Scores entre 0 et 1
- [ ] product_id valides
- [ ] Raisons explicites
- [ ] Confidence entre 0 et 1
- [ ] Exclusion des produits fonctionnelle

### Erreurs

- [ ] Produit non trouvé → 404
- [ ] Validation échouée → 422
- [ ] Limite dépassée → 422
- [ ] Service indisponible → Fallback gracieux

## Dépannage

### Service ne démarre pas

```bash
# Vérifier PostgreSQL
psql -U postgres -d tsa_contest -c "SELECT 1"

# Vérifier les migrations
cd services/tsa-monolith
node ace migration:status

# Logs FastAPI
tail -f services/tsa-ai/logs/app.log
```

### Aucune recommandation retournée

```bash
# Vérifier les données
psql -U postgres -d tsa_contest

SELECT COUNT(*) FROM products WHERE is_active = true;
SELECT COUNT(*) FROM orders WHERE status = 'paid';
SELECT COUNT(*) FROM order_items;

# Si 0 produits/commandes → Créer des données de test
```

### Erreur de connexion DB

```bash
# Vérifier .env
cat services/tsa-ai/.env | grep DATABASE

# Tester la connexion
python -c "from app.core.database import SessionLocal; db = SessionLocal(); print('✅ DB connected')"
```

### Performances lentes

```bash
# Analyser les requêtes SQL
# Activer logging dans database.py
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Créer des index
psql -U postgres -d tsa_contest -f create_indexes.sql
```

## Contact et support

Pour toute question :

- **Documentation complète** : `PRODUCT_RECOMMENDATION_SYSTEM.md`
- **Code source** : `services/tsa-ai/app/services/product_recommendation_service.py`
- **Tests unitaires** : `services/tsa-ai/tests/test_product_recommendations.py`
