# Pydantic Schemas

Ce dossier contient tous les schemas Pydantic pour la validation des données d'entrée et de sortie de l'API.

## 📁 Structure

```
schemas/
├── __init__.py
├── health.py           # Schemas health checks
├── eta.py             # Schemas prédictions ETA
├── anomaly.py         # Schemas détection anomalies
├── recommendation.py  # Schemas recommandations
└── common.py          # Schemas communs/partagés
```

## 🎯 Rôle des Schemas

Les schemas Pydantic servent à :
- **Validation** automatique des données entrantes
- **Sérialisation** des réponses JSON
- **Documentation** automatique de l'API
- **Type hints** pour l'IDE et mypy

## 📊 health.py

Schemas pour les endpoints de health check.

### Utilisation

```python
from app.schemas.health import HealthResponse, DetailedHealthResponse

# Response basique
@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        service="TSA Contest AI API",
        version="1.0.0"
    )
```

### Schemas disponibles

```python
class HealthResponse(BaseModel):
    status: str                    # "healthy" | "unhealthy" | "degraded"
    timestamp: datetime
    service: str
    version: str

class DetailedHealthResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str
    version: str
    environment: str
    database: Optional[DatabaseHealth]
    ml_models: Optional[MLModelsHealth]
    system: Optional[SystemHealth]

class DatabaseHealth(BaseModel):
    status: str
    connection: bool
    url: Optional[str]
    error: Optional[str]
```

## 🚛 eta.py

Schemas pour les prédictions ETA - le plus complet du système.

### Request Schemas

```python
class ETARequest(BaseModel):
    # Localisation
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lng: float = Field(..., ge=-180, le=180)
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lng: float = Field(..., ge=-180, le=180)
    
    # Véhicule et cargo
    vehicle_type: str              # "truck" | "van" | "moto" | "car"
    cargo_weight_kg: Optional[float] = Field(None, ge=0)
    cargo_volume_m3: Optional[float] = Field(None, ge=0)
    
    # Contexte
    departure_time: Optional[datetime]
    priority: str = "normal"       # "normal" | "urgent" | "express"
    
    # Validation custom
    @validator('vehicle_type')
    def validate_vehicle_type(cls, v):
        allowed = ['truck', 'van', 'moto', 'car', 'pickup']
        if v.lower() not in allowed:
            raise ValueError(f'Vehicle type must be: {", ".join(allowed)}')
        return v.lower()
```

### Response Schemas

```python
class ETAResponse(BaseModel):
    # Prédiction principale
    estimated_duration_minutes: int
    estimated_arrival_time: Optional[datetime]
    
    # Confiance
    confidence_score: float = Field(..., ge=0, le=1)
    reliability_level: str          # "low" | "medium" | "high"
    
    # Analyse des facteurs
    risk_factors: List[str] = []
    positive_factors: List[str] = []
    
    # Plage d'estimation
    min_duration_minutes: int
    max_duration_minutes: int
    
    # Insights supplémentaires
    traffic_impact: Optional[str]   # "low" | "medium" | "high"
    weather_impact: Optional[str]
    distance_km: Optional[float]
    
    # Métadonnées
    prediction_timestamp: datetime = Field(default_factory=datetime.utcnow)
    model_version: str = "1.0.0"
```

### Batch Schemas

```python
class ETABatchRequest(BaseModel):
    predictions: List[ETARequest] = Field(..., max_items=50)
    
    @validator('predictions')
    def validate_batch_size(cls, v):
        if len(v) == 0:
            raise ValueError('Au moins une prédiction requise')
        return v

class ETABatchResponse(BaseModel):
    predictions: List[ETAResponse]
    successful_predictions: int
    failed_predictions: int
    processing_time_ms: float
    batch_id: Optional[str]
```

### Utilisation dans endpoints

```python
@router.post("/predict", response_model=ETAResponse)
async def predict_eta(request: ETARequest):
    # Validation automatique de request
    # Serialization automatique de response
    pass

@router.post("/batch", response_model=ETABatchResponse)  
async def predict_batch(request: ETABatchRequest):
    # Validation du batch
    pass
```

## 🔍 anomaly.py

Schemas pour la détection d'anomalies.

### Schemas principaux

```python
class AnomalyRequest(BaseModel):
    shipment_id: int
    context_data: Dict[str, Any]
    check_types: List[str] = ["delay", "route", "cargo"]

class AnomalyResponse(BaseModel):
    anomalies_detected: List[DetectedAnomaly]
    overall_risk_score: float
    recommendations: List[str]

class DetectedAnomaly(BaseModel):
    anomaly_type: str              # "delay" | "route_deviation" | "cargo_issue"
    severity: str                  # "low" | "medium" | "high" | "critical"
    confidence_score: float
    description: str
    suggested_actions: List[str]
```

### Utilisation

```python
@router.post("/detect", response_model=AnomalyResponse)
async def detect_anomalies(request: AnomalyRequest):
    # Validation automatique
    pass
```

## 💡 recommendation.py

Schemas pour les recommandations de produits.

### Schemas disponibles

```python
class RecommendationRequest(BaseModel):
    user_id: int
    context_type: str              # "purchase" | "browsing" | "cart"
    product_categories: Optional[List[str]]
    max_recommendations: int = Field(5, ge=1, le=20)

class RecommendationResponse(BaseModel):
    recommendations: List[ProductRecommendation]
    algorithm_used: str
    confidence_threshold: float

class ProductRecommendation(BaseModel):
    product_id: int
    product_name: str
    confidence_score: float
    reason: str                    # Pourquoi recommandé
    estimated_compatibility: float
```

## 🔄 common.py

Schemas communs réutilisés dans plusieurs modules.

### Schemas utilitaires

```python
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)

class TimeRange(BaseModel):
    start_date: datetime
    end_date: datetime
    
    @validator('end_date')
    def end_after_start(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str]

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

## 🎨 Customisation Pydantic

### Validators personnalisés

```python
@validator('email')
def validate_email(cls, v):
    if '@' not in v:
        raise ValueError('Email invalide')
    return v.lower()

@validator('phone')
def validate_cameroon_phone(cls, v):
    # Validation numéro camerounais
    if not v.startswith('+237'):
        v = '+237' + v
    return v
```

### Config personnalisée

```python
class MySchema(BaseModel):
    name: str
    
    class Config:
        # Encoders JSON personnalisés
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        
        # Validation strict
        validate_assignment = True
        
        # Permettre champs supplémentaires
        extra = "forbid"  # ou "allow" ou "ignore"
        
        # Exemple de response
        schema_extra = {
            "example": {
                "name": "John Doe"
            }
        }
```

### Héritage de schemas

```python
class BaseRequest(BaseModel):
    request_id: Optional[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ETARequest(BaseRequest):
    origin_lat: float
    destination_lat: float
    # Hérite de request_id et timestamp
```

## 🧪 Tests des Schemas

```python
def test_eta_request_validation():
    # Valid request
    request = ETARequest(
        origin_lat=4.0483,
        origin_lng=9.7043,
        destination_lat=3.8480,
        destination_lng=11.5021,
        vehicle_type="truck"
    )
    assert request.vehicle_type == "truck"
    
    # Invalid coordinates
    with pytest.raises(ValidationError):
        ETARequest(
            origin_lat=200,  # Invalid
            origin_lng=9.7043,
            destination_lat=3.8480,
            destination_lng=11.5021,
            vehicle_type="truck"
        )

def test_batch_validation():
    # Empty batch should fail
    with pytest.raises(ValidationError):
        ETABatchRequest(predictions=[])
    
    # Too many predictions should fail
    with pytest.raises(ValidationError):
        ETABatchRequest(predictions=[valid_request] * 51)
```

## 📚 Documentation automatique

Les schemas génèrent automatiquement la documentation OpenAPI/Swagger :

```python
# Dans FastAPI
@app.post("/eta/predict", response_model=ETAResponse)
async def predict_eta(request: ETARequest):
    """
    Prédire l'ETA pour une livraison
    
    - **origin_lat/lng**: Coordonnées de départ
    - **destination_lat/lng**: Coordonnées d'arrivée
    - **vehicle_type**: Type de véhicule
    """
    pass
```

## 🛠️ Best Practices

1. **Validation strict** : Utiliser Field() avec contraintes
2. **Documentation** : Ajouter descriptions dans Field()
3. **Réutilisation** : Créer schemas de base communs
4. **Naming** : Convention Request/Response claire
5. **Validators** : Pour logique métier complexe
6. **Types optionnels** : Utiliser Optional[] quand approprié
7. **Defaults** : Valeurs par défaut sensées
8. **Exemples** : schema_extra pour documentation