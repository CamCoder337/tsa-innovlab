# TSA Contest - FastAPI AI Monolith

Service d'Intelligence Artificielle pour le concours TSA Contest 2025. Ce service fournit des prédictions ML pour la logistique et le transport.

## 🚀 Vue d'ensemble

FastAPI monolithe modulaire qui gère :
- **Prédictions ETA** : Estimation des temps d'arrivée
- **Détection d'anomalies** : Identification des problèmes de transport
- **Recommandations produits** : Suggestions intelligentes de pièces
- **Analytics avancées** : Insights basés sur les données

## 🏗️ Architecture

```
fastapi-monolith/
├── app/                    # Code application
│   ├── core/              # Configuration & base
│   ├── models/            # Models SQLAlchemy 
│   ├── schemas/           # Schemas Pydantic
│   ├── services/          # Logique métier ML
│   ├── endpoints/         # Routes FastAPI
│   └── utils/             # Utilitaires
├── ml_models/             # Modèles ML persistés
├── tests/                 # Tests unitaires
├── scripts/               # Scripts utilitaires
└── notebooks/             # Jupyter notebooks
```

## 🔧 Installation

### Prérequis
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose

### Setup rapide avec Docker

```bash
# Cloner le projet
git clone <repo-url>
cd services/tsa-ai

# Lancer avec Docker Compose
docker-compose up -d

# Vérifier le service
curl http://localhost:8000/api/ai/health
```

### Setup développement local

```bash
# Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Installer dépendances
pip install -r requirements.txt

# Configurer environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Lancer le serveur
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔑 Configuration

Variables d'environnement principales :

```bash
# Base de données (partagée avec Adonis)
DATABASE_URL=postgresql://user:pass@localhost:5432/tsa_contest

# Environnement
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Monitoring
SENTRY_DSN=your_sentry_dsn

# Cache (optionnel)
REDIS_URL=redis://localhost:6379
```

## 📡 API Endpoints

### Health Check
- `GET /api/ai/health/` - Status basique
- `GET /api/ai/health/detailed` - Status détaillé
- `GET /api/ai/health/database` - Status DB
- `GET /api/ai/health/models` - Status modèles ML

### ETA Predictions
- `POST /api/ai/eta/predict` - Prédiction ETA unique
- `POST /api/ai/eta/predict/batch` - Prédictions batch
- `GET /api/ai/eta/quick/{lat1}/{lng1}/{lat2}/{lng2}` - ETA rapide
- `GET /api/ai/eta/history/{shipment_id}` - Historique ETA
- `POST /api/ai/eta/feedback` - Feedback précision
- `GET /api/ai/eta/model/stats` - Statistiques modèle

### Anomaly Detection (TODO)
- `POST /api/ai/anomalies/detect` - Détecter anomalies
- `GET /api/ai/anomalies/{shipment_id}` - Anomalies colis

### Recommendations (TODO)
- `POST /api/ai/recommendations/products` - Recommander produits
- `GET /api/ai/recommendations/user/{user_id}` - Recommandations utilisateur

## 🧪 Tests

```bash
# Tests unitaires
pytest

# Tests API avec script
python test_api.py

# Tests spécifiques
python test_api.py eta        # Test ETA seulement
python test_api.py health     # Test health seulement
python test_api.py cameroon   # Test routes camerounaises
```

## 📊 Monitoring

- **Logs** : Format JSON avec niveaux configurables
- **Sentry** : Monitoring erreurs et performance
- **Health checks** : Endpoints dédiés pour Kubernetes/Docker
- **Métriques** : Performance des modèles ML

## 🤖 Machine Learning

### Modèles supportés
1. **ETA Model** (`ml_models/eta_model.pkl`)
   - Prédiction temps d'arrivée
   - Features : distance, véhicule, trafic, météo
   
2. **Anomaly Model** (`ml_models/anomaly_model.pkl`)
   - Détection retards et déviations
   - Features : trajectoire, temps, contexte

3. **Recommendation Model** (`ml_models/recommendation_model.pkl`)
   - Suggestions produits personnalisées
   - Features : historique, similarité, popularité

### Entraînement des modèles

```bash
# Générer modèles depuis DB
python scripts/generate_models.py

# Entraîner modèles ML
python scripts/train_models.py

# Évaluer performance
python scripts/evaluate_models.py
```

## 🔐 Sécurité

- **Pas d'authentification** : Gérée par Adonis via headers Nginx
- **Validation** : Pydantic pour tous les inputs
- **Rate limiting** : Configuré dans Nginx
- **CORS** : Configuré pour origines autorisées
- **Headers sécurité** : X-Content-Type-Options, X-Frame-Options

## 🚢 Déploiement

### Docker Production

```bash
# Build image
docker build -t tsa-fastapi-ai .

# Run container
docker run -d \
  --name tsa-fastapi-ai \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e ENVIRONMENT=production \
  tsa-fastapi-ai
```

### Kubernetes

```yaml
# Voir tools/k8s/ pour manifests complets
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fastapi-ai
  template:
    spec:
      containers:
      - name: fastapi-ai
        image: tsa-fastapi-ai:latest
        ports:
        - containerPort: 8000
```

## 🔄 Intégration avec Adonis

```
Adonis (Business) ──[HTTP]──> FastAPI (AI)
                 <──[JSON]──

Flow typique:
1. Frontend → Adonis (Auth + validation)
2. Adonis → FastAPI (Prédiction ML)
3. FastAPI → Adonis (Résultat JSON)
4. Adonis → Frontend (Response finale)
```

## 📈 Performance

- **Réponse ETA** : < 200ms (moyenne)
- **Batch 50 prédictions** : < 2s
- **Throughput** : 100+ req/s
- **Cache Redis** : TTL 5 minutes pour prédictions similaires

## 🐛 Debug

```bash
# Logs en temps réel
docker-compose logs -f fastapi-ai

# Debug modèles ML
python -c "from app.services.ml_service import ml_service; print(ml_service.get_models_status())"

# Test connexion DB
python -c "from app.core.database import test_connection; print(test_connection())"
```

## 📚 Documentation

- **API Docs** : http://localhost:8000/docs (Swagger)
- **ReDoc** : http://localhost:8000/redoc  
- **Architecture** : `/docs/architecture/`
- **Notebooks** : `/notebooks/` pour analyses ML

## 🤝 Contribution

1. Fork le projet
2. Créer branch feature (`git checkout -b feature/new-prediction`)
3. Commit changes (`git commit -am 'Add new prediction model'`)
4. Push to branch (`git push origin feature/new-prediction`)
5. Créer Pull Request

## 📋 Conventions de nommage

### Variables
```python
# Snake_case pour variables et fonctions
user_id = 123
eta_prediction = calculate_eta()
database_connection = get_db_connection()

# UPPERCASE pour constantes
MAX_RETRY_ATTEMPTS = 3
DEFAULT_TIMEOUT = 30
API_BASE_URL = "https://api.example.com"
```

### Fonctions
```python
# Snake_case, verbe descriptif
def calculate_eta_prediction(origin: Point, destination: Point) -> ETAResult:
    pass

def validate_shipment_data(data: dict) -> bool:
    pass

def get_user_recommendations(user_id: int, limit: int = 10) -> List[Product]:
    pass

# Fonctions privées avec underscore
def _process_ml_features(raw_data: dict) -> np.ndarray:
    pass
```

### Classes
```python
# PascalCase pour classes
class ETAPredictionService:
    pass

class AnomalyDetectionModel:
    pass

class ShipmentTracker:
    pass

# Exceptions avec "Error" ou "Exception" suffix
class InvalidShipmentDataError(Exception):
    pass

class ModelLoadingException(Exception):
    pass
```

### Fichiers et modules
```python
# Snake_case pour fichiers Python
eta_service.py
anomaly_detection.py
data_preprocessing.py

# Modules suivent la structure
from app.services.eta_service import ETAPredictionService
from app.models.shipment import Shipment
from app.schemas.eta import ETARequest, ETAResponse
```

### Variables d'environnement
```python
# UPPERCASE avec underscores
DATABASE_URL = os.getenv("DATABASE_URL")
ML_MODEL_PATH = os.getenv("ML_MODEL_PATH")
REDIS_HOST = os.getenv("REDIS_HOST")
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"
```

### Endpoints API
```python
# Kebab-case dans URLs, groupés par fonctionnalité
"/api/ai/eta/predict"
"/api/ai/eta/predict-batch" 
"/api/ai/anomaly/detect"
"/api/ai/recommendations/products"
"/api/ai/health/detailed"
```

### Modèles Pydantic
```python
# PascalCase, suffixe descriptif
class ETARequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float

class ETAResponse(BaseModel):
    estimated_duration_minutes: int
    confidence_score: float
    
class ShipmentCreate(BaseModel):
    pass

class ShipmentUpdate(BaseModel):
    pass
```

### Base de données
```python
# Snake_case pour tables et colonnes
class Shipment(Base):
    __tablename__ = "shipments"
    
    shipment_id = Column(Integer, primary_key=True)
    origin_latitude = Column(Float)
    destination_longitude = Column(Float)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

### Tests
```python
# Préfixe "test_", descriptif
def test_calculate_eta_with_valid_coordinates():
    pass

def test_validate_shipment_data_raises_error_for_invalid_input():
    pass

def test_get_user_recommendations_returns_empty_list_for_new_user():
    pass

# Fixtures avec snake_case
@pytest.fixture
def sample_shipment_data():
    pass

@pytest.fixture
def mock_ml_model():
    pass
```

## 📄 License

Projet TSA Contest 2025 - Usage interne uniquement.