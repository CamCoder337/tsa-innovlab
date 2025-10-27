"""
Pydantic schemas for mission recommendation API
Defines request/response models for mission recommendations for transporters
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum


class RecommendationMethod(str, Enum):
    """Available recommendation methods"""
    RULE_BASED = "rule_based"
    ML_BASED = "ml_based"
    BOTH = "both"


class MerchandiseType(str, Enum):
    """Types de marchandises supportés"""
    ELECTRONIQUE = "Électronique"
    ALIMENTAIRE = "Alimentaire"
    TEXTILE = "Textile"
    CONSTRUCTION = "Construction"
    PHARMACEUTIQUE = "Pharmaceutique"
    MOBILIER = "Mobilier"
    AUTOMOBILE = "Automobile"
    AGRICOLE = "Agricole"


class CameroonCity(str, Enum):
    """Villes camerounaises supportées"""
    YAOUNDE = "Yaoundé"
    DOUALA = "Douala"
    BAFOUSSAM = "Bafoussam"
    GAROUA = "Garoua"
    MAROUA = "Maroua"
    BAMENDA = "Bamenda"
    NGAOUNDERE = "Ngaoundéré"
    BERTOUA = "Bertoua"
    BUEA = "Buea"
    KUMBA = "Kumba"
    KRIBI = "Kribi"
    LIMBE = "Limbe"
    EBOLOWA = "Ebolowa"
    DSCHANG = "Dschang"
    FOUMBAN = "Foumban"


class MissionInfo(BaseModel):
    """Information about a mission to be recommended"""
    mission_id: Optional[str] = Field(None, description="Identifiant unique de la mission")
    weight: float = Field(..., gt=0, description="Poids en kg")
    budget: float = Field(..., gt=0, description="Budget en FCFA")
    delay_days: int = Field(..., ge=1, description="Délai en jours")
    depart_city: str = Field(..., description="Ville de départ")
    arrival_city: str = Field(..., description="Ville d'arrivée")
    merchandise_type: str = Field(..., description="Type de marchandise")
    description: Optional[str] = Field(None, description="Description de la mission")
    urgency_level: Optional[int] = Field(1, ge=1, le=5, description="Niveau d'urgence (1-5)")
    
    @validator('depart_city', 'arrival_city')
    def validate_cities(cls, v):
        """Validate that cities are supported"""
        supported_cities = [city.value for city in CameroonCity]
        if v not in supported_cities:
            # Allow the city but log a warning
            pass
        return v
    
    @validator('merchandise_type')
    def validate_merchandise_type(cls, v):
        """Validate merchandise type"""
        supported_types = [mtype.value for mtype in MerchandiseType]
        if v not in supported_types:
            # Allow the type but log a warning
            pass
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "mission_id": "MISSION_001",
                "weight": 2500.0,
                "budget": 150000.0,
                "delay_days": 5,
                "depart_city": "Yaoundé",
                "arrival_city": "Douala",
                "merchandise_type": "Électronique",
                "description": "Transport d'équipements électroniques",
                "urgency_level": 3
            }
        }


class TransporterProfile(BaseModel):
    """Profile of a transporter for recommendations"""
    transporter_id: str = Field(..., description="Identifiant unique du transporteur")
    max_weight: float = Field(..., gt=0, description="Capacité maximale en kg")
    max_distance: float = Field(..., gt=0, description="Distance maximale en km")
    min_budget: float = Field(..., gt=0, description="Budget minimum accepté en FCFA")
    experience_years: int = Field(..., ge=0, description="Années d'expérience")
    reputation_score: float = Field(70.0, ge=0, le=100, description="Score de réputation (0-100)")
    preferred_merchandise_types: List[str] = Field(default=[], description="Types de marchandises préférés")
    known_cities: List[str] = Field(default=[], description="Villes connues du transporteur")
    preferred_delay_days: int = Field(7, ge=1, description="Délai préféré en jours")
    vehicle_type: Optional[str] = Field(None, description="Type de véhicule")
    
    @validator('preferred_merchandise_types')
    def validate_preferred_types(cls, v):
        """Validate preferred merchandise types"""
        supported_types = [mtype.value for mtype in MerchandiseType]
        for ptype in v:
            if ptype not in supported_types:
                # Log warning but allow
                pass
        return v
    
    @validator('known_cities')
    def validate_known_cities(cls, v):
        """Validate known cities"""
        supported_cities = [city.value for city in CameroonCity]
        for city in v:
            if city not in supported_cities:
                # Log warning but allow
                pass
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "transporter_id": "TRANS_001",
                "max_weight": 10000.0,
                "max_distance": 800.0,
                "min_budget": 50000.0,
                "experience_years": 5,
                "reputation_score": 85.0,
                "preferred_merchandise_types": ["Électronique", "Alimentaire"],
                "known_cities": ["Yaoundé", "Douala", "Bafoussam"],
                "preferred_delay_days": 7,
                "vehicle_type": "Camion 10T"
            }
        }


class RecommendationResult(BaseModel):
    """Result of a single recommendation"""
    mission_id: str = Field(..., description="Identifiant de la mission")
    affinity_score: float = Field(..., ge=0, le=100, description="Score d'affinité (0-100)")
    confidence: float = Field(..., ge=0, le=1, description="Niveau de confiance")
    method: str = Field(..., description="Méthode utilisée")
    mission_details: Dict[str, Any] = Field(..., description="Détails de la mission")
    reasons: List[str] = Field(default=[], description="Raisons de la recommandation")
    
    class Config:
        schema_extra = {
            "example": {
                "mission_id": "MISSION_001",
                "affinity_score": 87.5,
                "confidence": 0.92,
                "method": "ml_based",
                "mission_details": {
                    "weight": 2500.0,
                    "budget": 150000.0,
                    "depart_city": "Yaoundé",
                    "arrival_city": "Douala"
                },
                "reasons": [
                    "Excellente compatibilité avec votre profil",
                    "Budget attractif",
                    "Trajet sur vos routes habituelles"
                ]
            }
        }


class MissionRecommendationRequest(BaseModel):
    """Request for mission recommendations"""
    transporter_profile: TransporterProfile = Field(..., description="Profil du transporteur")
    available_missions: List[MissionInfo] = Field(..., min_items=1, max_items=100, description="Missions disponibles")
    method: RecommendationMethod = Field(default=RecommendationMethod.ML_BASED, description="Méthode de recommandation")
    max_recommendations: int = Field(10, ge=1, le=50, description="Nombre maximum de recommandations")
    
    @validator('available_missions')
    def validate_unique_mission_ids(cls, v):
        """Ensure all mission IDs are unique"""
        mission_ids = [mission.mission_id for mission in v if mission.mission_id]
        if len(mission_ids) != len(set(mission_ids)):
            raise ValueError("Les identifiants de missions doivent être uniques")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "transporter_profile": {
                    "transporter_id": "TRANS_001",
                    "max_weight": 10000.0,
                    "max_distance": 800.0,
                    "min_budget": 50000.0,
                    "experience_years": 5,
                    "reputation_score": 85.0,
                    "preferred_merchandise_types": ["Électronique"],
                    "known_cities": ["Yaoundé", "Douala"]
                },
                "available_missions": [
                    {
                        "mission_id": "MISSION_001",
                        "weight": 2500.0,
                        "budget": 150000.0,
                        "delay_days": 5,
                        "depart_city": "Yaoundé",
                        "arrival_city": "Douala",
                        "merchandise_type": "Électronique"
                    }
                ],
                "method": "ml_based",
                "max_recommendations": 10
            }
        }


class MissionRecommendationResponse(BaseModel):
    """Response for mission recommendations"""
    transporter_id: str = Field(..., description="Identifiant du transporteur")
    recommendations: Any = Field(..., description="Recommandations (format dépend de la méthode)")
    processing_time_ms: int = Field(..., description="Temps de traitement en millisecondes")
    timestamp: datetime = Field(..., description="Timestamp de la réponse")
    
    class Config:
        schema_extra = {
            "example": {
                "transporter_id": "TRANS_001",
                "recommendations": [
                    {
                        "mission_id": "MISSION_001",
                        "affinity_score": 87.5,
                        "confidence": 0.92,
                        "method": "ml_based",
                        "mission_details": {
                            "weight": 2500.0,
                            "budget": 150000.0,
                            "depart_city": "Yaoundé",
                            "arrival_city": "Douala"
                        },
                        "reasons": ["Excellente compatibilité", "Budget attractif"]
                    }
                ],
                "processing_time_ms": 125,
                "timestamp": "2024-12-15T10:30:00Z"
            }
        }


class BatchMissionRecommendationRequest(BaseModel):
    """Request for batch mission recommendations"""
    transporters: List[TransporterProfile] = Field(..., min_items=1, max_items=50, description="Liste des transporteurs")
    available_missions: List[MissionInfo] = Field(..., min_items=1, max_items=100, description="Missions disponibles")
    method: RecommendationMethod = Field(default=RecommendationMethod.ML_BASED, description="Méthode de recommandation")
    max_recommendations: int = Field(10, ge=1, le=50, description="Nombre maximum de recommandations par transporteur")
    
    @validator('transporters')
    def validate_unique_transporter_ids(cls, v):
        """Ensure all transporter IDs are unique"""
        transporter_ids = [t.transporter_id for t in v]
        if len(transporter_ids) != len(set(transporter_ids)):
            raise ValueError("Les identifiants de transporteurs doivent être uniques")
        return v


class BatchMissionRecommendationResponse(BaseModel):
    """Response for batch mission recommendations"""
    results: List[MissionRecommendationResponse] = Field(..., description="Résultats pour chaque transporteur")
    total_transporters: int = Field(..., description="Nombre total de transporteurs traités")
    processing_time_ms: int = Field(..., description="Temps de traitement total en millisecondes")
    timestamp: datetime = Field(..., description="Timestamp de la réponse")


class ModelInfoResponse(BaseModel):
    """Information about the recommendation model"""
    model_version: str = Field(..., description="Version du modèle")
    model_loaded: bool = Field(..., description="Modèle chargé en mémoire")
    model_path: str = Field(..., description="Chemin vers le fichier modèle")
    supported_cities: int = Field(..., description="Nombre de villes supportées")
    supported_merchandise_types: int = Field(..., description="Nombre de types de marchandises")
    distance_matrix_size: int = Field(..., description="Taille de la matrice de distances")
    
    class Config:
        schema_extra = {
            "example": {
                "model_version": "1.0.0",
                "model_loaded": True,
                "model_path": "/app/ml_models/mission_recommender_model.pkl",
                "supported_cities": 15,
                "supported_merchandise_types": 8,
                "distance_matrix_size": 225
            }
        }


class ServiceStatsResponse(BaseModel):
    """Statistics about the recommendation service"""
    total_requests: int = Field(..., description="Nombre total de requêtes")
    method_usage: Dict[str, int] = Field(..., description="Utilisation par méthode")
    avg_response_time: float = Field(..., description="Temps de réponse moyen en secondes")
    model_loaded: bool = Field(..., description="Modèle chargé")
    model_version: str = Field(..., description="Version du modèle")
    supported_cities: int = Field(..., description="Villes supportées")
    supported_merchandise_types: int = Field(..., description="Types de marchandises supportés")
    
    class Config:
        schema_extra = {
            "example": {
                "total_requests": 850,
                "method_usage": {
                    "rule_based": 200,
                    "ml_based": 550,
                    "both": 100
                },
                "avg_response_time": 0.125,
                "model_loaded": True,
                "model_version": "1.0.0",
                "supported_cities": 15,
                "supported_merchandise_types": 8
            }
        }


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: Literal["healthy", "unhealthy"] = Field(..., description="État du service")
    model_status: Literal["loaded", "not_loaded", "error"] = Field(..., description="État du modèle")
    timestamp: datetime = Field(..., description="Timestamp du check")
    version: str = Field(..., description="Version du service")
    cities_count: int = Field(..., description="Nombre de villes supportées")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "model_status": "loaded",
                "timestamp": "2024-12-15T10:30:00Z",
                "version": "1.0.0",
                "cities_count": 15
            }
        }


class CitiesResponse(BaseModel):
    """Response with supported cities"""
    cities: List[str] = Field(..., description="Liste des villes supportées")
    total_count: int = Field(..., description="Nombre total de villes")
    
    class Config:
        schema_extra = {
            "example": {
                "cities": ["Yaoundé", "Douala", "Bafoussam", "Garoua"],
                "total_count": 15
            }
        }


class MerchandiseTypesResponse(BaseModel):
    """Response with supported merchandise types"""
    merchandise_types: List[str] = Field(..., description="Liste des types de marchandises supportés")
    total_count: int = Field(..., description="Nombre total de types")
    
    class Config:
        schema_extra = {
            "example": {
                "merchandise_types": ["Électronique", "Alimentaire", "Textile", "Construction"],
                "total_count": 8
            }
        }
