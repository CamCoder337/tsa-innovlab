# API Endpoints

Ce dossier contient tous les endpoints FastAPI organisés par domaine fonctionnel.

## 📁 Structure

```
endpoints/
├── __init__.py
├── health.py           # Health checks
├── eta.py             # Prédictions ETA
├── anomalies.py       # Détection anomalies
├── recommendations.py # Recommandations produits
└── analytics.py       # Analytics et métriques
```

## 🎯 Organisation des Endpoints

Chaque fichier correspond à un **APIRouter** avec des endpoints liés :
- **Groupage logique** par fonctionnalité
- **Préfixes cohérents** (`/api/ai/{domain}`)
- **Tags OpenAPI** pour documentation
- **Réutilisation** de dependencies communes

## 🏥 health.py

Endpoints pour le monitoring et les health checks.

### Routes disponibles

```
GET  /api/ai/health/                    # Health basique
GET  /api/ai/health/detailed           # Health détaillé
GET  /api/ai/health/database          # Status base de données
GET  /api/ai/health/models            # Status modèles ML
GET  /api/ai/health/system            # Status système
```

### Utilisation

```python
# Health basique - pour load balancers
@router.get("/", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        service="TSA Contest AI API",
        version=settings.app_version
    )

# Health détaillé - pour monitoring
@router.get("/detailed", response_model=DetailedHealthResponse)
async def detailed_health_check(db: Session = Depends(get_db)):
    # Vérification DB, ML models, système
    pass
```

### Codes de retour

- **200** : Service healthy
- **503** : Service unhealthy ou degraded
- **500** : Erreur interne

### Exemples de réponses

```json
// Basic health
{
    "status": "healthy",
    "timestamp": "2024-12-19T10:30:00Z",
    "service": "TSA Contest AI API",
    "version": "1.0.0"
}

// Detailed health
{
    "status": "healthy",
    "timestamp": "2024-12-19T10:30:00Z",
    "service": "TSA Contest AI API",
    "version": "1.0.0",
    "environment": "development",
    "database": {
        "status": "healthy",
        "connection": true
    },
    "ml_models": {
        "status": "healthy",
        "all_loaded": true,
        "models": {
            "eta_model.pkl": {"exists": true, "size_mb": 2.5},
            "anomaly_model.pkl": {"exists": true, "size_mb": 1.8}
        }
    },
    "system": {
        "status": "healthy",
        "cpu_percent": 15.2,
        "memory_percent": 45.8,
        "disk_percent": 60.1
    }
}
```

## 🚛 eta.py

Endpoints pour les prédictions ETA - le cœur du système ML.

### Routes disponibles

```
POST /api/ai/eta/predict                           # Prédiction ETA unique
POST /api/ai/eta/predict/batch                     # Prédictions batch
GET  /api/ai/eta/quick/{lat1}/{lng1}/{lat2}/{lng2} # ETA rapide
GET  /api/ai/eta/history/{shipment_id}             # Historique prédictions
POST /api/ai/eta/feedback                          # Feedback précision
GET  /api/ai/eta/model/stats                       # Statistiques modèle
```

### Endpoint principal

```python
@router.post("/predict", response_model=ETAResponse)
async def predict_eta(
    request: ETARequest,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Prédire l'ETA pour une livraison
    
    Paramètres requis:
    - origin_lat/lng: Coordonnées départ
    - destination_lat/lng: Coordonnées arrivée  
    - vehicle_type: Type véhicule (truck, van, moto, car, pickup)
    
    Paramètres optionnels:
    - cargo_weight_kg: Poids cargo
    - departure_time: Heure départ prévue
    - priority: Priorité (normal, urgent, express)
    - driver_experience_years: Expérience chauffeur
    """
```

### Exemples de requêtes

```json
// Prédiction ETA simple
POST /api/ai/eta/predict
{
    "origin_lat": 4.0483,
    "origin_lng": 9.7043,
    "destination_lat": 3.8480,
    "destination_lng": 11.5021,
    "vehicle_type": "truck",
    "cargo_weight_kg": 2000,
    "priority": "normal"
}

// ETA rapide via URL
GET /api/ai/eta/quick/4.0483/9.7043/3.8480/11.5021?vehicle_type=van&cargo_weight=800

// Batch de prédictions
POST /api/ai/eta/predict/batch
{
    "predictions": [
        {
            "origin_lat": 4.0483,
            "origin_lng": 9.7043,
            "destination_lat": 3.8480,
            "destination_lng": 11.5021,
            "vehicle_type": "truck"
        },
        {
            "origin_lat": 3.8480,
            "origin_lng": 11.5021,
            "destination_lat": 5.4781,
            "destination_lng": 10.4176,
            "vehicle_type": "van"
        }
    ]
}
```

### Réponses types

```json
// Prédiction ETA
{
    "estimated_duration_minutes": 180,
    "estimated_arrival_time": "2024-12-19T13:30:00Z",
    "confidence_score": 0.85,
    "reliability_level": "high",
    "risk_factors": ["rush_hour"],
    "positive_factors": ["experienced_driver"],
    "min_duration_minutes": 165,
    "max_duration_minutes": 195,
    "traffic_impact": "medium",
    "weather_impact": "low",
    "distance_km": 240.5,
    "prediction_timestamp": "2024-12-19T10:30:00Z",
    "model_version": "1.0.0"
}

// Batch response
{
    "predictions": [...],
    "successful_predictions": 2,
    "failed_predictions": 0,
    "processing_time_ms": 245.8,
    "batch_id": "batch_1703001000"
}
```

### Gestion d'erreurs

```python
# Validation Pydantic
422 Unprocessable Entity
{
    "detail": "Validation error",
    "errors": [
        {
            "loc": ["origin_lat"],
            "msg": "ensure this value is greater than or equal to -90",
            "type": "value_error.number.not_ge"
        }
    ]
}

# Erreur interne
500 Internal Server Error
{
    "detail": "Internal server error",
    "message": "Une erreur interne s'est produite"
}
```

## 🔍 anomalies.py

Endpoints pour la détection d'anomalies (en développement).

### Routes prévues

```
POST /api/ai/anomalies/detect           # Détecter anomalies
GET  /api/ai/anomalies/{shipment_id}    # Anomalies d'un colis
GET  /api/ai/anomalies/types            # Types d'anomalies disponibles
POST /api/ai/anomalies/feedback         # Feedback détection
```

### Structure endpoint

```python
@router.post("/detect", response_model=AnomalyResponse)
async def detect_anomalies(
    request: AnomalyRequest,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Détecter des anomalies pour un colis
    
    Types d'anomalies supportées:
    - delay: Retards significatifs
    - route_deviation: Déviations de route
    - speed_anomaly: Vitesses anormales
    - stop_duration: Arrêts prolongés
    """
```

## 💡 recommendations.py

Endpoints pour les recommandations de produits (en développement).

### Routes prévues

```
POST /api/ai/recommendations/products    # Recommander produits
GET  /api/ai/recommendations/user/{id}   # Recommandations utilisateur
POST /api/ai/recommendations/feedback    # Feedback recommandations
GET  /api/ai/recommendations/stats       # Statistiques algorithmes
```

### Exemple d'utilisation

```python
@router.post("/products", response_model=RecommendationResponse)
async def recommend_products(
    request: RecommendationRequest,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Générer des recommandations de produits personnalisées
    
    Algorithmes disponibles:
    - collaborative: Filtrage collaboratif
    - content_based: Basé sur le contenu
    - hybrid: Approche hybride
    - popularity: Basé sur la popularité
    """
```

## 📊 analytics.py

Endpoints pour analytics et métriques (en développement).

### Routes prévues

```
GET /api/ai/analytics/performance        # Performance modèles
GET /api/ai/analytics/usage             # Statistiques usage API
GET /api/ai/analytics/insights          # Insights ML
POST /api/ai/analytics/reports          # Générer rapports
```

## 🔧 Patterns Communs

### Structure d'endpoint type

```python
@router.post("/endpoint", response_model=ResponseSchema)
async def endpoint_function(
    request: RequestSchema,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Documentation détaillée de l'endpoint
    
    - **param1**: Description paramètre 1
    - **param2**: Description paramètre 2
    """
    try:
        # 1. Log de la requête
        logger.info(f"Endpoint called by user {user.get('id') if user else 'anonymous'}")
        
        # 2. Validation métier (si nécessaire)
        if not validate_business_logic(request):
            raise HTTPException(422, "Business validation failed")
        
        # 3. Appel du service
        service = SomeService()
        result = await service.process(request)
        
        # 4. Log du résultat
        logger.info(f"Endpoint completed successfully")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.error(f"Endpoint failed: {e}")
        raise HTTPException(500, "Internal server error")
```

### Dependencies communes

```python
# User depuis headers Nginx/Adonis
user: Optional[dict] = Depends(get_user_from_header)

# Session base de données
db: Session = Depends(get_db)

# Service ML
ml_service: MLService = Depends(get_ml_service)

# Pagination
pagination: PaginationParams = Depends()
```

### Validation de query parameters

```python
@router.get("/items")
async def get_items(
    limit: int = Query(10, ge=1, le=100, description="Nombre d'items"),
    offset: int = Query(0, ge=0, description="Décalage"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie")
):
    pass
```

## 🧪 Tests d'Endpoints

### Structure de test

```python
# test_eta_endpoints.py
def test_predict_eta_success(client, valid_eta_request):
    response = client.post("/api/ai/eta/predict", json=valid_eta_request)
    
    assert response.status_code == 200
    data = response.json()
    assert "estimated_duration_minutes" in data
    assert data["confidence_score"] >= 0
    assert data["confidence_score"] <= 1

def test_predict_eta_invalid_coordinates(client):
    invalid_request = {
        "origin_lat": 200,  # Invalid
        "origin_lng": 9.7043,
        "destination_lat": 3.8480,
        "destination_lng": 11.5021,
        "vehicle_type