"""
Pydantic schemas for piece scoring API
Defines request/response models for piece quality scoring
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum


class ScoringMethod(str, Enum):
    """Available scoring methods"""
    RULE_BASED = "rule_based"
    ML_BASED = "ml_based"
    BOTH = "both"


class ScoreCategory(str, Enum):
    """Score quality categories"""
    EXCELLENT = "excellent"
    BON = "bon"
    MOYEN = "moyen"
    FAIBLE = "faible"


class PieceInfo(BaseModel):
    """Information about a piece to be scored"""
    piece_id: str = Field(..., description="Identifiant unique de la pièce")
    piece_name: str = Field(..., description="Nom de la pièce")
    piece_age_months: int = Field(..., ge=0, description="Âge de la pièce en mois")
    estimated_lifetime_months: int = Field(..., gt=0, description="Durée de vie estimée en mois")
    supplier_rating: float = Field(..., ge=0, le=5, description="Note du fournisseur (0-5)")
    supplier_years_experience: int = Field(..., ge=0, description="Années d'expérience du fournisseur")
    average_customer_rating: float = Field(..., ge=0, le=5, description="Note moyenne des clients (0-5)")
    number_of_reviews: int = Field(..., ge=0, description="Nombre d'avis clients")
    physical_condition_score: float = Field(..., ge=0, le=100, description="Score de condition physique (0-100)")
    price: float = Field(..., gt=0, description="Prix de la pièce")
    category_code: int = Field(default=1, description="Code de catégorie de la pièce")
    brand_reputation_score: float = Field(default=70.0, ge=0, le=100, description="Score de réputation de la marque")
    
    @validator('piece_age_months')
    def validate_age_vs_lifetime(cls, v, values):
        """Validate that piece age is not greater than estimated lifetime"""
        if 'estimated_lifetime_months' in values and v > values['estimated_lifetime_months']:
            raise ValueError("L'âge de la pièce ne peut pas dépasser sa durée de vie estimée")
        return v


class ScoreDetails(BaseModel):
    """Detailed breakdown of scoring factors"""
    age_score: Optional[float] = Field(None, description="Score basé sur l'âge")
    supplier_score: Optional[float] = Field(None, description="Score du fournisseur")
    feedback_score: Optional[float] = Field(None, description="Score des avis clients")
    condition_score: Optional[float] = Field(None, description="Score de condition physique")


class ScoreResult(BaseModel):
    """Result of a single scoring operation"""
    final_score: float = Field(..., ge=0, le=100, description="Score final (0-100)")
    category: ScoreCategory = Field(..., description="Catégorie de qualité")
    method: str = Field(..., description="Méthode utilisée pour le scoring")
    model_version: str = Field(..., description="Version du modèle")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Niveau de confiance (ML uniquement)")
    details: Optional[ScoreDetails] = Field(None, description="Détails du scoring")
    error: Optional[str] = Field(None, description="Message d'erreur éventuel")


class ComparisonResult(BaseModel):
    """Comparison between rule-based and ML scoring"""
    rule_based: ScoreResult = Field(..., description="Résultat du scoring par règles")
    ml_based: ScoreResult = Field(..., description="Résultat du scoring ML")
    comparison: Dict[str, Any] = Field(..., description="Métriques de comparaison")


class PieceScoreRequest(BaseModel):
    """Request for scoring a single piece"""
    piece_info: PieceInfo = Field(..., description="Informations sur la pièce")
    method: ScoringMethod = Field(default=ScoringMethod.ML_BASED, description="Méthode de scoring")
    
    class Config:
        schema_extra = {
            "example": {
                "piece_info": {
                    "piece_id": "PIECE_001",
                    "piece_name": "Alternateur Bosch",
                    "piece_age_months": 24,
                    "estimated_lifetime_months": 120,
                    "supplier_rating": 4.2,
                    "supplier_years_experience": 8,
                    "average_customer_rating": 4.1,
                    "number_of_reviews": 15,
                    "physical_condition_score": 85.0,
                    "price": 150.0,
                    "category_code": 2,
                    "brand_reputation_score": 80.0
                },
                "method": "ml_based"
            }
        }


class PieceScoreResponse(BaseModel):
    """Response for piece scoring"""
    piece_id: str = Field(..., description="Identifiant de la pièce")
    score_result: Dict[str, Any] = Field(..., description="Résultat du scoring")
    processing_time_ms: int = Field(..., description="Temps de traitement en millisecondes")
    timestamp: datetime = Field(..., description="Timestamp de la réponse")
    
    class Config:
        schema_extra = {
            "example": {
                "piece_id": "PIECE_001",
                "score_result": {
                    "final_score": 78.5,
                    "category": "bon",
                    "method": "ml_based",
                    "model_version": "1.0.0",
                    "confidence": 0.85
                },
                "processing_time_ms": 45,
                "timestamp": "2024-12-15T10:30:00Z"
            }
        }


class BatchPieceScoreRequest(BaseModel):
    """Request for scoring multiple pieces"""
    pieces: List[PieceInfo] = Field(..., min_items=1, max_items=100, description="Liste des pièces à scorer")
    method: ScoringMethod = Field(default=ScoringMethod.ML_BASED, description="Méthode de scoring")
    
    @validator('pieces')
    def validate_unique_piece_ids(cls, v):
        """Ensure all piece IDs are unique"""
        piece_ids = [piece.piece_id for piece in v]
        if len(piece_ids) != len(set(piece_ids)):
            raise ValueError("Les identifiants de pièces doivent être uniques")
        return v


class BatchPieceScoreResponse(BaseModel):
    """Response for batch piece scoring"""
    results: List[PieceScoreResponse] = Field(..., description="Résultats pour chaque pièce")
    total_pieces: int = Field(..., description="Nombre total de pièces traitées")
    processing_time_ms: int = Field(..., description="Temps de traitement total en millisecondes")
    timestamp: datetime = Field(..., description="Timestamp de la réponse")
    
    class Config:
        schema_extra = {
            "example": {
                "results": [
                    {
                        "piece_id": "PIECE_001",
                        "score_result": {
                            "final_score": 78.5,
                            "category": "bon",
                            "method": "ml_based",
                            "model_version": "1.0.0"
                        },
                        "processing_time_ms": 45,
                        "timestamp": "2024-12-15T10:30:00Z"
                    }
                ],
                "total_pieces": 1,
                "processing_time_ms": 50,
                "timestamp": "2024-12-15T10:30:00Z"
            }
        }


class ModelInfoResponse(BaseModel):
    """Information about the scoring model"""
    model_version: str = Field(..., description="Version du modèle")
    model_loaded: bool = Field(..., description="Modèle chargé en mémoire")
    model_path: str = Field(..., description="Chemin vers le fichier modèle")
    feature_names: Optional[List[str]] = Field(None, description="Noms des features")
    score_thresholds: Dict[str, float] = Field(..., description="Seuils de catégorisation")
    
    class Config:
        schema_extra = {
            "example": {
                "model_version": "1.0.0",
                "model_loaded": True,
                "model_path": "/app/ml_models/piece_quality_scorer.pkl",
                "feature_names": [
                    "piece_age_months",
                    "estimated_lifetime_months",
                    "supplier_rating",
                    "supplier_years_experience",
                    "average_customer_rating",
                    "number_of_reviews",
                    "physical_condition_score",
                    "price",
                    "category_code",
                    "brand_reputation_score"
                ],
                "score_thresholds": {
                    "excellent": 85,
                    "bon": 70,
                    "moyen": 50,
                    "faible": 30
                }
            }
        }


class ServiceStatsResponse(BaseModel):
    """Statistics about the scoring service"""
    total_requests: int = Field(..., description="Nombre total de requêtes")
    method_usage: Dict[str, int] = Field(..., description="Utilisation par méthode")
    avg_response_time: float = Field(..., description="Temps de réponse moyen en secondes")
    model_loaded: bool = Field(..., description="Modèle chargé")
    model_version: str = Field(..., description="Version du modèle")
    uptime_seconds: Optional[float] = Field(None, description="Temps de fonctionnement en secondes")
    
    class Config:
        schema_extra = {
            "example": {
                "total_requests": 1250,
                "method_usage": {
                    "rule_based": 300,
                    "ml_based": 800,
                    "both": 150
                },
                "avg_response_time": 0.045,
                "model_loaded": True,
                "model_version": "1.0.0",
                "uptime_seconds": 86400
            }
        }


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: Literal["healthy", "unhealthy"] = Field(..., description="État du service")
    model_status: Literal["loaded", "not_loaded", "error"] = Field(..., description="État du modèle")
    timestamp: datetime = Field(..., description="Timestamp du check")
    version: str = Field(..., description="Version du service")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "model_status": "loaded",
                "timestamp": "2024-12-15T10:30:00Z",
                "version": "1.0.0"
            }
        }
