"""
Pydantic schemas for ETA prediction endpoints
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class ETARequest(BaseModel):
    """Request schema for ETA prediction"""

    # Shipment info
    shipment_id: Optional[int] = Field(None, description="ID du colis (optionnel)")

    # Origin coordinates
    origin_lat: float = Field(..., ge=-90, le=90, description="Latitude origine")
    origin_lng: float = Field(..., ge=-180, le=180, description="Longitude origine")
    origin_address: Optional[str] = Field(None, description="Adresse origine")

    # Destination coordinates
    destination_lat: float = Field(..., ge=-90, le=90, description="Latitude destination")
    destination_lng: float = Field(..., ge=-180, le=180, description="Longitude destination")
    destination_address: Optional[str] = Field(None, description="Adresse destination")

    # Vehicle and cargo info
    vehicle_type: str = Field(..., description="Type de véhicule (truck, van, moto)")
    cargo_weight_kg: Optional[float] = Field(None, ge=0, description="Poids cargo en kg")
    cargo_volume_m3: Optional[float] = Field(None, ge=0, description="Volume cargo en m³")

    # Context info
    departure_time: Optional[datetime] = Field(None, description="Heure de départ prévue")
    priority: Optional[str] = Field("normal", description="Priorité (normal, urgent, express)")

    # Driver info (if available)
    driver_id: Optional[int] = Field(None, description="ID du chauffeur")
    driver_experience_years: Optional[int] = Field(None, ge=0, description="Expérience chauffeur")

    @validator('vehicle_type')
    def validate_vehicle_type(cls, v):
        allowed_types = ['truck', 'van', 'moto', 'car', 'pickup']
        if v.lower() not in allowed_types:
            raise ValueError(f'Type de véhicule doit être: {", ".join(allowed_types)}')
        return v.lower()

    @validator('priority')
    def validate_priority(cls, v):
        allowed_priorities = ['normal', 'urgent', 'express']
        if v and v.lower() not in allowed_priorities:
            raise ValueError(f'Priorité doit être: {", ".join(allowed_priorities)}')
        return v.lower() if v else 'normal'


class ETAResponse(BaseModel):
    """Response schema for ETA prediction"""

    # Main prediction
    estimated_duration_minutes: int = Field(..., description="Durée estimée en minutes")
    estimated_arrival_time: Optional[datetime] = Field(None, description="Heure d'arrivée estimée")

    # Confidence and reliability
    confidence_score: float = Field(..., ge=0, le=1, description="Score de confiance (0-1)")
    reliability_level: str = Field(..., description="Niveau de fiabilité (low, medium, high)")

    # Factors analysis
    risk_factors: List[str] = Field(default=[], description="Facteurs de risque identifiés")
    positive_factors: List[str] = Field(default=[], description="Facteurs positifs")

    # Range estimation
    min_duration_minutes: int = Field(..., description="Durée minimum estimée")
    max_duration_minutes: int = Field(..., description="Durée maximum estimée")

    # Additional insights
    traffic_impact: Optional[str] = Field(None, description="Impact trafic (low, medium, high)")
    weather_impact: Optional[str] = Field(None, description="Impact météo (low, medium, high)")
    distance_km: Optional[float] = Field(None, description="Distance estimée en km")

    # Metadata
    prediction_timestamp: datetime = Field(default_factory=datetime.utcnow)
    model_version: str = Field(default="1.0.0", description="Version du modèle utilisé")


class ETAHistoryRequest(BaseModel):
    """Request for ETA history"""
    shipment_id: int = Field(..., description="ID du colis")
    limit: Optional[int] = Field(10, ge=1, le=100, description="Nombre max de prédictions")


class ETAHistoryResponse(BaseModel):
    """Response for ETA history"""
    shipment_id: int
    predictions: List[ETAResponse]
    total_predictions: int
    accuracy_stats: Optional[Dict[str, Any]] = Field(None, description="Statistiques de précision")


class ETABatchRequest(BaseModel):
    """Request for batch ETA prediction"""
    predictions: List[ETARequest] = Field(..., max_items=50, description="Maximum 50 prédictions par batch")

    @validator('predictions')
    def validate_batch_size(cls, v):
        if len(v) == 0:
            raise ValueError('Au moins une prédiction requise')
        if len(v) > 50:
            raise ValueError('Maximum 50 prédictions par batch')
        return v


class ETABatchResponse(BaseModel):
    """Response for batch ETA prediction"""
    predictions: List[ETAResponse]
    successful_predictions: int
    failed_predictions: int
    processing_time_ms: float
    batch_id: Optional[str] = None


class ETAAccuracyFeedback(BaseModel):
    """Feedback for ETA accuracy improvement"""
    shipment_id: int
    predicted_duration_minutes: int
    actual_duration_minutes: int
    actual_arrival_time: datetime
    feedback_notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5, description="Note de 1 à 5")


class ETAModelStats(BaseModel):
    """ETA Model statistics and performance"""
    model_version: str
    total_predictions: int
    average_accuracy_percent: float
    last_trained: Optional[datetime]
    features_used: List[str]
    performance_metrics: Dict[str, float]