# Machine Learning Models

Ce dossier contient les modèles ML entraînés et prêts pour l'inférence dans l'API FastAPI.

## 📁 Structure

```
ml_models/
├── README.md                    # Ce fichier
├── eta_model.pkl               # Modèle prédiction ETA
├── anomaly_model.pkl           # Modèle détection anomalies
├── recommendation_model.pkl    # Modèle recommandations
├── metadata/
│   ├── eta_features.json       # Features du modèle ETA
│   ├── model_versions.json     # Versions et métriques
│   └── training_logs/          # Logs d'entraînement
└── archived/                   # Versions précédentes
    ├── eta_model_v0.9.pkl
    └── ...
```

## 🎯 Modèles Disponibles

### 1. ETA Model (`eta_model.pkl`)

**Objectif** : Prédire le temps d'arrivée estimé pour les livraisons

**Algorithme** : Random Forest Regressor
- **Features** : 12 variables (distance, véhicule, cargo, temps, coordonnées)
- **Target** : Durée en minutes
- **Métriques** : MAE: 12.5 min, RMSE: 18.3 min, R²: 0.78

#### Features utilisées

```json
{
  "features": [
    {
      "name": "distance_km",
      "type": "float",
      "description": "Distance Haversine en kilomètres",
      "importance": 0.35
    },
    {
      "name": "vehicle_code",
      "type": "int", 
      "description": "Code véhicule (1=moto, 2=car, 3=van, 4=pickup, 5=truck)",
      "importance": 0.18
    },
    {
      "name": "cargo_weight_kg",
      "type": "float",
      "description": "Poids cargo en kg",
      "importance": 0.12
    },
    {
      "name": "cargo_volume_m3",
      "type": "float", 
      "description": "Volume cargo en m³",
      "importance": 0.08
    },
    {
      "name": "priority_code",
      "type": "int",
      "description": "Priorité (1=normal, 2=urgent, 3=express)",
      "importance": 0.06
    },
    {
      "name": "hour_of_day",
      "type": "int",
      "description": "Heure de départ (0-23)",
      "importance": 0.09
    },
    {
      "name": "day_of_week", 
      "type": "int",
      "description": "Jour semaine (1-7)",
      "importance": 0.04
    },
    {
      "name": "driver_experience_years",
      "type": "int",
      "description": "Expérience chauffeur en années",
      "importance": 0.03
    },
    {
      "name": "origin_lat",
      "type": "float",
      "description": "Latitude origine",
      "importance": 0.02
    },
    {
      "name": "origin_lng", 
      "type": "float",
      "description": "Longitude origine",
      "importance": 0.01
    },
    {
      "name": "destination_lat",
      "type": "float", 
      "description": "Latitude destination",
      "importance": 0.01
    },
    {
      "name": "destination_lng",
      "type": "float",
      "description": "Longitude destination", 
      "importance": 0.01
    }
  ]
}
```

#### Utilisation en code

```python
# Chargement automatique par MLService
from app.services.ml_service import ml_service
eta_model = ml_service.get_model("eta")

# Prédiction
features = [240.5, 5, 2000, 15, 1, 14, 2, 8, 4.0483, 9.7043, 3.8480, 11.5021]
duration_minutes = eta_model.predict([features])[0]
confidence = eta_model.predict_proba([features])[0] if hasattr(eta_model, 'predict_proba') else 0.8
```

### 2. Anomaly Model (`anomaly_model.pkl`)

**Objectif** : Détecter des anomalies dans les transports

**Algorithme** : Isolation Forest
- **Features** : Trajectoire, timing, contexte cargo
- **Target** : Anomalie binaire (0=normal, 1=anomalie)
- **Métriques** : Precision: 0.82, Recall: 0.76, F1: 0.79

#### Types d'anomalies détectées

```python
ANOMALY_TYPES = {
    "delay": "Retard significatif vs ETA prédite",
    "route_deviation": "Déviation importante de route", 
    "speed_anomaly": "Vitesse anormalement lente/rapide",
    "stop_duration": "Arrêt prolongé non planifié",
    "cargo_discrepancy": "Incohérence poids/volume cargo"
}
```

#### Features modèle anomalies

- **Temporal** : Écart vs ETA, durée arrêts, vitesse moyenne
- **Spatial** : Distance parcourue, déviations GPS, zones visitées  
- **Contextual** : Type véhicule, cargo, météo, trafic
- **Historical** : Patterns chauffeur, route habituelle

### 3. Recommendation Model (`recommendation_model.pkl`)

**Objectif** : Recommander des pièces reconditionnées aux clients

**Algorithme** : Collaborative Filtering + Content-Based
- **Approche** : Matrice de factorisation (SVD)
- **Features** : Historique achats, similarité produits, popularité
- **Métriques** : NDCG@10: 0.73, Hit Rate@10: 0.68

#### Algorithmes de recommandation

```python
RECOMMENDATION_ALGORITHMS = {
    "collaborative": {
        "description": "Filtrage collaboratif basé utilisateurs similaires",
        "use_case": "Nouveaux produits pour utilisateurs actifs",
        "accuracy": 0.75
    },
    "content_based": {
        "description": "Basé sur caractéristiques produits",
        "use_case": "Produits similaires à historique",
        "accuracy": 0.68
    },
    "hybrid": {
        "description": "Combinaison collaborative + content",
        "use_case": "Recommandations générales",
        "accuracy": 0.82
    },
    "popularity": {
        "description": "Basé sur popularité générale",
        "use_case": "Nouveaux utilisateurs (cold start)",
        "accuracy": 0.61
    }
}
```

## 🔄 Cycle de Vie des Modèles

### 1. Développement

```bash
# Exploration des données
jupyter notebook notebooks/data_exploration.ipynb

# Entraînement modèle
python scripts/train_eta_model.py
python scripts/train_anomaly_model.py
python scripts/train_recommendation_model.py

# Évaluation
python scripts/evaluate_models.py
```

### 2. Déploiement

```python
# Test modèle avant déploiement
def validate_model(model_path):
    model = joblib.load(model_path)
    
    # Test avec données de référence
    test_features = load_test_dataset()
    predictions = model.predict(test_features)
    
    # Vérifications
    assert predictions.shape[0] == test_features.shape[0]
    assert not np.isnan(predictions).any()
    assert predictions.min() >= 0  # Pour ETA
    
    return True

# Backup ancien modèle
shutil.move("eta_model.pkl", "archived/eta_model_backup.pkl")

# Déploiement nouveau modèle
shutil.copy("new_eta_model.pkl", "eta_model.pkl")

# Rechargement dans service
await ml_service.load_all_models()
```

### 3. Monitoring

```python
# Métriques de performance en production
class ModelPerformanceTracker:
    def track_prediction(self, model_name, features, prediction, actual=None):
        """Enregistre prédiction pour monitoring"""
        
    def calculate_drift(self, model_name, recent_features):
        """Détecte dérive des données d'entrée"""
        
    def evaluate_accuracy(self, model_name, period="1w"):
        """Calcule précision sur période récente"""
```

## 🛠️ Gestion des Modèles

### Chargement automatique

```python
# Dans ml_service.py
async def load_all_models(self):
    """Charge tous les modèles disponibles"""
    models_to_load = [
        ("eta", "eta_model.pkl"),
        ("anomaly", "anomaly_model.pkl"), 
        ("recommendation", "recommendation_model.pkl")
    ]
    
    for model_name, model_file in models_to_load:
        model_path = self.models_path / model_file
        
        if model_path.exists():
            try:
                with open(model_path, 'rb') as f:
                    self.models[model_name] = pickle.load(f)
                logger.info(f"Loaded {model_name} model")
            except Exception as e:
                logger.error(f"Failed to load {model_name}: {e}")
                # Créer modèle dummy en fallback
                self.models[model_name] = self._create_dummy_model(model_name)
        else:
            logger.warning(f"Model file not found: {model_file}")
            self.models[model_name] = self._create_dummy_model(model_name)
```

### Validation des modèles

```python
def validate_eta_model(model):
    """Valide modèle ETA avant utilisation"""
    
    # Test avec features valides
    test_features = [240.5, 5, 2000, 15, 1, 14, 2, 8, 4.0483, 9.7043, 3.8480, 11.5021]
    
    try:
        prediction = model.predict([test_features])
        
        # Vérifications
        assert len(prediction) == 1
        assert isinstance(prediction[0], (int, float))
        assert 0 < prediction[0] < 2000  # ETA raisonnable (< 33h)
        
        return True
        
    except Exception as e:
        logger.error(f"Model validation failed: {e}")
        return False
```

### Modèles de fallback

```python
class DummyETAModel:
    """Modèle de secours pour ETA quand ML indisponible"""
    
    def predict(self, X):
        predictions = []
        for features in X:
            distance_km = features[0]
            vehicle_code = features[1]
            
            # Vitesses moyennes par véhicule
            speeds = {1: 35, 2: 50, 3: 45, 4: 45, 5: 40}  # moto, car, van, pickup, truck
            speed = speeds.get(vehicle_code, 45)
            
            # Calcul simple avec buffer
            duration_minutes = int((distance_km / speed) * 60 * 1.2)
            predictions.append(max(duration_minutes, 10))  # Minimum 10 min
            
        return np.array(predictions)
    
    def predict_proba(self, X):
        # Confiance moyenne pour fallback
        return [[0.3, 0.7] for _ in X]  # [low_confidence, medium_confidence]
```

## 📊 Métriques et Performance

### Métriques ETA Model

```json
{
  "model_name": "eta_model",
  "version": "1.0.0",
  "algorithm": "RandomForestRegressor",
  "training_date": "2024-12-15",
  "dataset_size": 50000,
  "metrics": {
    "mae": 12.5,              // Mean Absolute Error (minutes)
    "rmse": 18.3,             // Root Mean Square Error
    "mape": 15.2,             // Mean Absolute Percentage Error  
    "r2_score": 0.78,         // R-squared
    "median_error": 8.7       // Médiane erreur absolue
  },
  "validation": {
    "cv_scores": [0.76, 0.79, 0.77, 0.80, 0.75],
    "mean_cv_score": 0.774,
    "std_cv_score": 0.018
  }
}
```

### Benchmarks par route

```json
{
  "route_performance": {
    "douala_yaounde": {
      "samples": 2500,
      "mae": 10.2,
      "accuracy_80_percent": 0.73  // % prédictions dans ±20% réalité
    },
    "yaounde_bafoussam": {
      "samples": 1800,
      "mae": 14.8,
      "accuracy_80_percent": 0.68
    },
    "long_distance": {
      "samples": 1200,
      "mae": 22.3,
      "accuracy_80_percent": 0.61
    }
  }
}
```

## 🔄 Mise à Jour des Modèles

### Script de mise à jour

```bash
#!/bin/bash
# update_models.sh

echo "🤖 Updating ML models..."

# Backup modèles actuels
mkdir -p archived/$(date +%Y%m%d)
cp *.pkl archived/$(date +%Y%m%d)/

# Télécharger nouveaux modèles (depuis S3, etc.)
aws s3 sync s3://tsa-ml-models/latest/ ./

# Valider modèles
python scripts/validate_models.py

if [ $? -eq 0 ]; then
    echo "✅ Models validated successfully"
    
    # Redémarrer service pour rechargement
    docker-compose restart fastapi-ai
    
    echo "🚀 Models updated and service restarted"
else
    echo "❌ Model validation failed, rolling back..."
    
    # Restore backup
    cp archived/$(date +%Y%m%d)/*.pkl ./
    
    echo "🔄 Rollback completed"
fi
```

### Pipeline CI/CD pour modèles

```yaml
# .github/workflows/model-update.yml
name: Update ML Models

on:
  schedule:
    - cron: '0 2 * * 0'  # Dimanche 2h du matin
  workflow_dispatch:

jobs:
  update-models:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Python
      uses: actions/setup-python@v3
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: pip install -r requirements.txt
    
    - name: Train new models
      run: |
        python scripts/train_eta_model.py
        python scripts/train_anomaly_model.py
        python scripts/train_recommendation_model.py
    
    - name: Validate models
      run: python scripts/validate_models.py
    
    - name: Deploy to staging
      run: |
        aws s3 cp ml_models/ s3://tsa-ml-models/staging/ --recursive
    
    - name: Integration tests
      run: python test_models_integration.py
    
    - name: Deploy to production
      if: success()
      run: |
        aws s3 cp ml_models/ s3://tsa-ml-models/production/ --recursive
        
    - name: Notify deployment
      run: |
        curl -X POST $SLACK_WEBHOOK \
          -d '{"text": "🤖 ML models updated successfully"}'
```

## 🧪 Tests des Modèles

### Tests unitaires

```python
# test_models.py
def test_eta_model_predictions():
    model = ml_service.get_model("eta")
    
    # Test prédictions normales
    features = [100, 3, 1000, 5, 1, 10, 1, 5, 4.0, 9.0, 4.1, 9.1]
    prediction = model.predict([features])[0]
    
    assert 30 <= prediction <= 500  # ETA raisonnable
    assert isinstance(prediction, (int, float))

def test_anomaly_model_detection():
    model = ml_service.get_model("anomaly")
    
    # Features normales (pas d'anomalie)
    normal_features = [0, 45, 120, 0, 0]  # delay, speed, duration, deviations, stops
    prediction = model.predict([normal_features])[0]
    assert prediction == 0  # Normal
    
    # Features anormales
    anomaly_features = [60, 15, 300, 5, 3]  # Gros retard, vitesse lente, etc.
    prediction = model.predict([anomaly_features])[0]
    assert prediction == 1  # Anomalie

def test_model_fallbacks():
    """Test que les modèles dummy fonctionnent"""
    ml_service.models = {}  # Clear models
    
    # Les services doivent créer des fallbacks
    eta_service = ETAService()
    request = ETARequest(...)
    
    response = await eta_service.predict_eta(request)
    assert response.model_version.startswith("fallback")
    assert response.estimated_duration_minutes > 0
```

### Tests d'intégration

```python
def test_models_integration():
    """Test intégration complète des modèles"""
    
    # Charger tous les modèles
    await ml_service.load_all_models()
    
    # Vérifier que tous sont chargés
    assert ml_service.is_model_loaded("eta")
    assert ml_service.is_model_loaded("anomaly")
    assert ml_service.is_model_loaded("recommendation")
    
    # Test pipeline complet ETA
    eta_service = ETAService()
    eta_request = ETARequest(...)
    eta_response = await eta_service.predict_eta(eta_request)
    
    assert eta_response.confidence_score > 0
    assert eta_response.model_version != "fallback-1.0.0"
```

## 📚 Documentation des Modèles

### Métadonnées complètes

Chaque modèle doit être accompag