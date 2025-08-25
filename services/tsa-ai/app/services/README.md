# Services - Business Logic

Ce dossier contient la logique métier et les services ML de l'application FastAPI.

## 📁 Structure

```
services/
├── __init__.py
├── ml_service.py           # Service ML de base
├── eta_service.py          # Service prédictions ETA
├── anomaly_service.py      # Service détection anomalies
├── recommendation_service.py # Service recommandations
└── analytics_service.py    # Service analytics avancées
```

## 🎯 Principe des Services

Les services encapsulent :
- **Logique métier** complexe
- **Interactions ML** avec les modèles
- **Traitement des données** avant/après prédiction
- **Cache** et optimisations
- **Logging** et monitoring

## 🤖 ml_service.py

Service de base pour la gestion des modèles ML.

### Responsabilités

```python
class MLService:
    """Service de base pour gestion des modèles ML"""
    
    def __init__(self):
        self.models = {}
        self.models_loaded = False
        
    async def load_all_models(self):
        """Charge tous les modèles ML au démarrage"""
        
    def get_model(self, model_name: str):
        """Récupère un modèle chargé"""
        
    def is_model_loaded(self, model_name: str) -> bool:
        """Vérifie si modèle est chargé"""
        
    def get_models_status(self) -> dict:
        """Status de tous les modèles"""
```

### Utilisation

```python
from app.services.ml_service import ml_service

# Au démarrage app
await ml_service.load_all_models()

# Dans un service spécialisé
eta_model = ml_service.get_model("eta")
if eta_model:
    prediction =