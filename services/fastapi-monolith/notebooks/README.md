# Notebooks - Analyse et Développement ML

Ce dossier contient les notebooks Jupyter pour l'exploration des données, le développement des modèles ML et l'analyse des performances pour le projet TSA Contest.

## 📁 Structure

```
notebooks/
├── README.md                           # Ce fichier
├── 01_data_exploration/
│   ├── data_exploration.ipynb          # Exploration générale des données
│   ├── cameroon_routes_analysis.ipynb  # Analyse routes camerounaises
│   └── logistics_patterns.ipynb        # Patterns logistiques
├── 02_feature_engineering/
│   ├── eta_features.ipynb              # Engineering features ETA
│   ├── geospatial_features.ipynb       # Features géospatiales
│   └── temporal_features.ipynb         # Features temporelles
├── 03_model_development/
│   ├── eta_model_training.ipynb        # Entraînement modèle ETA
│   ├── anomaly_detection.ipynb         # Modèle détection anomalies
│   ├── recommendation_system.ipynb     # Système de recommandation
│   └── model_comparison.ipynb          # Comparaison des modèles
├── 04_model_evaluation/
│   ├── eta_performance_analysis.ipynb  # Analyse performance ETA
│   ├── error_analysis.ipynb            # Analyse des erreurs
│   └── business_impact.ipynb           # Impact métier des modèles
├── 05_production_monitoring/
│   ├── model_drift_detection.ipynb     # Détection dérive modèles
│   ├── performance_monitoring.ipynb    # Monitoring performance
│   └── business_metrics.ipynb          # Métriques métier
└── utils/
    ├── notebook_utils.py               # Utilitaires communs
    ├── plotting_helpers.py             # Helpers visualisation
    └── data_connectors.py              # Connecteurs données
```

## 🎯 Objectifs des Notebooks

### **Phase 1 : Exploration des Données**
- Comprendre la distribution des données logistiques TSA
- Identifier les patterns géographiques du Cameroun
- Analyser les comportements temporels (trafic, saisons)
- Détecter les anomalies dans les données historiques

### **Phase 2 : Feature Engineering**
- Créer des features géospatiales pertinentes
- Encoder les variables temporelles (heures, saisons)
- Développer des features métier spécifiques logistique
- Optimiser la représentation des données pour ML

### **Phase 3 : Développement Modèles**
- Entraîner modèles ETA avec validation croisée
- Développer système de détection d'anomalies
- Créer moteur de recommandations personnalisées
- Comparer performances de différents algorithmes

### **Phase 4 : Évaluation et Optimisation**
- Analyser performance sur données de test
- Identifier sources d'erreurs principales
- Optimiser hyperparamètres des modèles
- Calculer impact métier des améliorations

### **Phase 5 : Monitoring Production**
- Surveiller dérive des modèles en production
- Analyser performance continue des prédictions
- Mesurer ROI et impact business des modèles

## 🚀 Setup et Installation

### Prérequis

```bash
# Installer Jupyter et dépendances ML
pip install jupyter jupyterlab
pip install pandas numpy scikit-learn matplotlib seaborn
pip install plotly folium geopandas
pip install psycopg2-binary sqlalchemy

# Ou utiliser requirements-notebooks.txt
pip install -r requirements-notebooks.txt
```

### Lancement Jupyter

```bash
# Option 1: Jupyter Lab (recommandé)
jupyter lab

# Option 2: Jupyter Notebook classique
jupyter notebook

# Option 3: Dans Docker
docker run -p 8888:8888 -v $(pwd):/home/jovyan/work jupyter/scipy-notebook
```

### Configuration environnement

```python
# Dans chaque notebook - cellule d'initialisation
import sys
sys.path.append('../..')

from notebooks.utils.notebook_utils import setup_environment
setup_environment()

# Variables globales
DATABASE_URL = "postgresql://tsa_user:tsa_password@localhost:5432/tsa_contest"
DATA_PATH = "../data/"
MODELS_PATH = "../ml_models/"
```

## 📊 01_data_exploration/

### data_exploration.ipynb

**Objectif** : Vue d'ensemble des données TSA

```python
# Contenu principal du notebook
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# 1. Chargement et aperçu des données
shipments_df = load_shipments_data()
print(f"Dataset: {shipments_df.shape}")
shipments_df.head()

# 2. Analyse statistiques descriptives
shipments_df.describe()

# 3. Distribution des variables clés
plt.figure(figsize=(15, 10))

# Distance distribution
plt.subplot(2, 3, 1)
shipments_df['distance_km'].hist(bins=50)
plt.title('Distribution Distance (km)')

# Duration distribution  
plt.subplot(2, 3, 2)
shipments_df['actual_duration_minutes'].hist(bins=50)
plt.title('Distribution Durée (minutes)')

# Vehicle types
plt.subplot(2, 3, 3)
shipments_df['vehicle_type'].value_counts().plot(kind='bar')
plt.title('Types de Véhicules')

# 4. Corrélations
correlation_matrix = shipments_df.select_dtypes(include=[np.number]).corr()
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm')

# 5. Insights métier
print("🎯 Insights découverts:")
print(f"- Distance moyenne: {shipments_df['distance_km'].mean():.1f} km")
print(f"- Durée médiane: {shipments_df['actual_duration_minutes'].median():.0f} min")
print(f"- Véhicule le plus utilisé: {shipments_df['vehicle_type'].mode()[0]}")
```

### cameroon_routes_analysis.ipynb

**Objectif** : Analyse spécifique des routes camerounaises

```python
# Analyse géographique du Cameroun
import folium
import geopandas as gpd

# 1. Visualisation carte des routes
def create_cameroon_routes_map():
    # Centre sur le Cameroun
    cameroon_map = folium.Map(
        location=[7.3697, 12.3547], 
        zoom_start=6,
        tiles='OpenStreetMap'
    )
    
    # Ajouter principales routes
    major_routes = [
        {'start': [4.0483, 9.7043], 'end': [3.8480, 11.5021], 'name': 'Douala-Yaoundé'},
        {'start': [3.8480, 11.5021], 'end': [5.4781, 10.4176], 'name': 'Yaoundé-Bafoussam'},
        {'start': [4.0483, 9.7043], 'end': [7.3697, 12.3547], 'name': 'Douala-Ngaoundéré'}
    ]
    
    for route in major_routes:
        folium.PolyLine(
            locations=[route['start'], route['end']],
            popup=route['name'],
            color='red',
            weight=3
        ).add_to(cameroon_map)
    
    return cameroon_map

# 2. Analyse performance par route
route_performance = analyze_route_performance()
route_performance.head()

# 3. Patterns temporels par région
seasonal_analysis = analyze_seasonal_patterns_by_region()
plot_seasonal_heatmap(seasonal_analysis)
```

## 🔧 02_feature_engineering/

### eta_features.ipynb

**Objectif** : Développement features pour modèle ETA

```python
# Feature engineering pour ETA
class ETAFeatureEngineer:
    
    def __init__(self):
        self.feature_names = []
    
    def create_distance_features(self, df):
        """Features basées sur la distance"""
        # Distance Haversine
        df['distance_km'] = haversine_vectorized(
            df['origin_lat'], df['origin_lng'],
            df['destination_lat'], df['destination_lng']
        )
        
        # Catégorisation distance
        df['distance_category'] = pd.cut(
            df['distance_km'], 
            bins=[0, 50, 200, 500, 1000, np.inf],
            labels=['very_short', 'short', 'medium', 'long', 'very_long']
        )
        
        return df
    
    def create_temporal_features(self, df):
        """Features temporelles"""
        df['departure_hour'] = df['departure_time'].dt.hour
        df['departure_dow'] = df['departure_time'].dt.dayofweek
        df['departure_month'] = df['departure_time'].dt.month
        
        # Catégories temporelles
        df['is_rush_hour'] = df['departure_hour'].isin([7, 8, 17, 18, 19])
        df['is_weekend'] = df['departure_dow'].isin([5, 6])
        df['is_rainy_season'] = df['departure_month'].isin([6, 7, 8, 9])
        
        return df
    
    def create_vehicle_features(self, df):
        """Features véhicule et cargo"""
        # Encodage véhicule
        vehicle_encoding = {'moto': 1, 'car': 2, 'van': 3, 'pickup': 4, 'truck': 5}
        df['vehicle_code'] = df['vehicle_type'].map(vehicle_encoding)
        
        # Ratio cargo
        df['cargo_density'] = df['cargo_weight_kg'] / (df['cargo_volume_m3'] + 1)
        df['is_heavy_cargo'] = df['cargo_weight_kg'] > 3000
        
        return df
    
    def create_historical_features(self, df):
        """Features basées sur l'historique"""
        # Performance chauffeur historique
        driver_stats = df.groupby('driver_id').agg({
            'actual_duration_minutes': ['mean', 'std'],
            'delay_minutes': 'mean'
        }).round(2)
        
        # Merge back
        df = df.merge(driver_stats, left_on='driver_id', right_index=True, how='left')
        
        return df

# Utilisation
feature_engineer = ETAFeatureEngineer()
features_df = feature_engineer.create_all_features(raw_data)

# Analyse importance des features
feature_importance_analysis(features_df)
```

## 🤖 03_model_development/

### eta_model_training.ipynb

**Objectif** : Entraînement et optimisation modèle ETA

```python
# Entraînement modèle ETA
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

class ETAModelTrainer:
    
    def __init__(self):
        self.models = {}
        self.best_model = None
        
    def prepare_data(self, df):
        """Préparation données pour entraînement"""
        # Features
        feature_cols = [
            'distance_km', 'vehicle_code', 'cargo_weight_kg', 'cargo_volume_m3',
            'departure_hour', 'departure_dow', 'driver_experience_years',
            'origin_lat', 'origin_lng', 'destination_lat', 'destination_lng'
        ]
        
        X = df[feature_cols].fillna(df[feature_cols].median())
        y = df['actual_duration_minutes']
        
        return train_test_split(X, y, test_size=0.2, random_state=42)
    
    def train_random_forest(self, X_train, y_train):
        """Entraîner Random Forest"""
        rf_params = {
            'n_estimators': [50, 100, 200],
            'max_depth': [10, 15, 20],
            'min_samples_split': [2, 5, 10]
        }
        
        rf = RandomForestRegressor(random_state=42)
        rf_grid = GridSearchCV(rf, rf_params, cv=5, scoring='neg_mean_absolute_error')
        rf_grid.fit(X_train, y_train)
        
        self.models['random_forest'] = rf_grid.best_estimator_
        return rf_grid.best_estimator_
    
    def train_gradient_boosting(self, X_train, y_train):
        """Entraîner Gradient Boosting"""
        gb_params = {
            'n_estimators': [100, 200],
            'learning_rate': [0.1, 0.2],
            'max_depth': [6, 8, 10]
        }
        
        gb = GradientBoostingRegressor(random_state=42)
        gb_grid = GridSearchCV(gb, gb_params, cv=5, scoring='neg_mean_absolute_error')
        gb_grid.fit(X_train, y_train)
        
        self.models['gradient_boosting'] = gb_grid.best_estimator_
        return gb_grid.best_estimator_
    
    def evaluate_models(self, X_test, y_test):
        """Évaluation des modèles"""
        results = {}
        
        for name, model in self.models.items():
            y_pred = model.predict(X_test)
            
            results[name] = {
                'mae': mean_absolute_error(y_test, y_pred),
                'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
                'r2': r2_score(y_test, y_pred)
            }
        
        return results
    
    def select_best_model(self, results):
        """Sélectionner le meilleur modèle"""
        best_mae = float('inf')
        best_model_name = None
        
        for name, metrics in results.items():
            if metrics['mae'] < best_mae:
                best_mae = metrics['mae']
                best_model_name = name
        
        self.best_model = self.models[best_model_name]
        return best_model_name, best_mae

# Entraînement complet
trainer = ETAModelTrainer()
X_train, X_test, y_train, y_test = trainer.prepare_data(processed_data)

# Entraîner modèles
trainer.train_random_forest(X_train, y_train)
trainer.train_gradient_boosting(X_train, y_train)

# Évaluation
results = trainer.evaluate_models(X_test, y_test)
best_model_name, best_mae = trainer.select_best_model(results)

print(f"🏆 Meilleur modèle: {best_model_name}")
print(f"📊 MAE: {best_mae:.2f} minutes")

# Sauvegarde
import joblib
joblib.dump(trainer.best_model, '../ml_models/eta_model.pkl')
```

## 📈 04_model_evaluation/

### eta_performance_analysis.ipynb

**Objectif** : Analyse approfondie des performances

```python
# Analyse performance détaillée
class ModelPerformanceAnalyzer:
    
    def __init__(self, model, X_test, y_test):
        self.model = model
        self.X_test = X_test
        self.y_test = y_test
        self.y_pred = model.predict(X_test)
    
    def overall_metrics(self):
        """Métriques globales"""
        mae = mean_absolute_error(self.y_test, self.y_pred)
        rmse = np.sqrt(mean_squared_error(self.y_test, self.y_pred))
        mape = np.mean(np.abs((self.y_test - self.y_pred) / self.y_test)) * 100
        r2 = r2_score(self.y_test, self.y_pred)
        
        return {'MAE': mae, 'RMSE': rmse, 'MAPE': mape, 'R²': r2}
    
    def error_distribution_analysis(self):
        """Analyse distribution des erreurs"""
        errors = self.y_pred - self.y_test
        
        plt.figure(figsize=(15, 5))
        
        # Distribution erreurs
        plt.subplot(1, 3, 1)
        plt.hist(errors, bins=50, alpha=0.7)
        plt.title('Distribution des Erreurs')
        plt.xlabel('Erreur (minutes)')
        
        # Q-Q plot
        plt.subplot(1, 3, 2)
        from scipy import stats
        stats.probplot(errors, dist="norm", plot=plt)
        plt.title('Q-Q Plot Normalité')
        
        # Résidus vs prédictions
        plt.subplot(1, 3, 3)
        plt.scatter(self.y_pred, errors, alpha=0.5)
        plt.axhline(y=0, color='r', linestyle='--')
        plt.title('Résidus vs Prédictions')
        plt.xlabel('Prédictions')
        plt.ylabel('Résidus')
        
        plt.tight_layout()
        plt.show()
    
    def performance_by_segments(self):
        """Performance par segments"""
        # Ajouter features pour segmentation
        test_df = self.X_test.copy()
        test_df['actual'] = self.y_test
        test_df['predicted'] = self.y_pred
        test_df['error'] = self.y_pred - self.y_test
        test_df['abs_error'] = np.abs(test_df['error'])
        
        # Segments par distance
        test_df['distance_segment'] = pd.cut(
            test_df['distance_km'],
            bins=[0, 100, 300, 500, np.inf],
            labels=['Court', 'Moyen', 'Long', 'Très Long']
        )
        
        # Performance par segment
        segment_performance = test_df.groupby('distance_segment').agg({
            'abs_error': ['mean', 'std', 'median'],
            'error': lambda x: (np.abs(x) <= 20).mean()  # % dans ±20min
        }).round(2)
        
        return segment_performance

# Utilisation
analyzer = ModelPerformanceAnalyzer(best_model, X_test, y_test)

# Métriques globales
global_metrics = analyzer.overall_metrics()
print("📊 Métriques Globales:")
for metric, value in global_metrics.items():
    print(f"  {metric}: {value:.2f}")

# Analyse par segments
segment_perf = analyzer.performance_by_segments()
print("\n📈 Performance par Segment de Distance:")
print(segment_perf)
```

## 🔍 05_production_monitoring/

### model_drift_detection.ipynb

**Objectif** : Surveillance de la dérive des modèles

```python
# Détection dérive des modèles
from scipy.stats import ks_2samp
import warnings

class ModelDriftDetector:
    
    def __init__(self, reference_data, threshold=0.05):
        self.reference_data = reference_data
        self.threshold = threshold
        
    def detect_feature_drift(self, new_data, feature_name):
        """Détecter dérive d'une feature"""
        ref_values = self.reference_data[feature_name].dropna()
        new_values = new_data[feature_name].dropna()
        
        # Test Kolmogorov-Smirnov
        statistic, p_value = ks_2samp(ref_values, new_values)
        
        drift_detected = p_value < self.threshold
        
        return {
            'feature': feature_name,
            'ks_statistic': statistic,
            'p_value': p_value,
            'drift_detected': drift_detected,
            'severity': 'High' if p_value < 0.01 else 'Medium' if p_value < 0.05 else 'Low'
        }
    
    def detect_prediction_drift(self, model, new_data):
        """Détecter dérive des prédictions"""
        # Prédictions de référence
        ref_predictions = model.predict(self.reference_data)
        new_predictions = model.predict(new_data)
        
        # Comparer distributions
        statistic, p_value = ks_2samp(ref_predictions, new_predictions)
        
        return {
            'prediction_drift': p_value < self.threshold,
            'ks_statistic': statistic,
            'p_value': p_value
        }
    
    def generate_drift_report(self, new_data, model):
        """Rapport complet de dérive"""
        report = {
            'timestamp': pd.Timestamp.now(),
            'new_data_size': len(new_data),
            'feature_drift': {},
            'prediction_drift': {}
        }
        
        # Analyser chaque feature
        for feature in self.reference_data.columns:
            if feature in new_data.columns:
                drift_result = self.detect_feature_drift(new_data, feature)
                report['feature_drift'][feature] = drift_result
        
        # Analyser prédictions
        report['prediction_drift'] = self.detect_prediction_drift(model, new_data)
        
        return report

# Utilisation pour monitoring
drift_detector = ModelDriftDetector(training_data)

# Données récentes (dernière semaine)
recent_data = get_recent_shipment_data(days=7)

# Détection de dérive
drift_report = drift_detector.generate_drift_report(recent_data, eta_model)

# Alertes
high_drift_features = [
    f for f, result in drift_report['feature_drift'].items() 
    if result['drift_detected'] and result['severity'] == 'High'
]

if high_drift_features:
    print(f"🚨 ALERTE: Dérive détectée sur {len(high_drift_features)} features:")
    for feature in high_drift_features:
        print(f"  - {feature}")
```

## 🛠️ Utils et Helpers

### notebook_utils.py

```python
# Utilitaires communs pour notebooks
import os
import sys
import pandas as pd
import numpy as np
from sqlalchemy import create_engine

def setup_environment():
    """Configuration environnement notebook"""
    # Ajouter path pour imports
    notebook_dir = os.path.dirname(os.path.abspath('__file__'))
    project_root = os.path.join(notebook_dir, '..')
    sys.path.append(project_root)
    
    # Configuration pandas
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    
    # Configuration plots
    import matplotlib.pyplot as plt
    plt.style.use('seaborn-v0_8')
    plt.rcParams['figure.figsize'] = (12, 8)
    
    print("✅ Environnement notebook configuré")

def get_database_connection():
    """Connexion base de données"""
    DATABASE_URL = "postgresql://tsa_user:tsa_password@localhost:5432/tsa_contest"
    engine = create_engine(DATABASE_URL)
    return engine

def load_shipments_data(limit=None):
    """Charger données shipments"""
    engine = get_database_connection()
    
    query = """
    SELECT 
        s.*,
        u.email as user_email,
        u.role as user_role
    FROM shipments s
    LEFT JOIN orders o ON s.order_id = o.id
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY s.created_at DESC
    """
    
    if limit:
        query += f" LIMIT {limit}"
    
    return pd.read_sql(query, engine)

def save_model_artifacts(model, model_name, metrics):
    """Sauvegarder modèle et métadonnées"""
    import joblib
    import json
    from datetime import datetime
    
    # Sauvegarder modèle
    model_path = f"../ml_models/{model_name}.pkl"
    joblib.dump(model, model_path)
    
    # Sauvegarder métadonnées
    metadata = {
        'model_name': model_name,
        'created_at': datetime.now().isoformat(),
        'metrics': metrics,
        'model_path': model_path
    }
    
    metadata_path = f"../ml_models/metadata/{model_name}_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Modèle sauvegardé: {model_path}")
    print(f"✅ Métadonnées sauvegardées: {metadata_path}")
```

## 🧪 Utilisation et Workflow

### Workflow complet de développement ML

```bash
# 1. Explorer les données
jupyter lab notebooks/01_data_exploration/data_exploration.ipynb

# 2. Créer features
jupyter lab notebooks/02_feature_engineering/eta_features.ipynb

# 3. Entraîner modèles
jupyter lab notebooks/03_model_development/eta_model_training.ipynb

# 4. Évaluer performance
jupyter lab notebooks/04_model_evaluation/eta_performance_analysis.ipynb

# 5. Déployer et monitorer
jupyter lab notebooks/05_production_monitoring/model_drift_detection.ipynb
```

### Bonnes pratiques

1. **Versioning** : Commit notebooks avec outputs cleared
2. **Documentation** : Markdown cells pour expliquer chaque étape
3. **Reproductibilité** : Random seeds fixés
4. **Modularité** : Fonctions dans utils/ réutilisables
5. **Monitoring** : Notebooks de monitoring régulièrement exécutés

Ce README couvre l'utilisation complète des notebooks pour le développement ML du projet TSA Contest ! 📊🤖