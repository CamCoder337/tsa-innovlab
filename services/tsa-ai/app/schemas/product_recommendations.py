"""
Pydantic schemas for product recommendation endpoints
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class PersonalizedProductRecommendationRequest(BaseModel):
    """Request schema for personalized product recommendations"""

    user_id: str = Field(..., description="UUID de l'utilisateur")
    limit: int = Field(10, ge=1, le=50, description="Nombre de recommandations (max 50)")
    context: Optional[str] = Field(
        'homepage', description="Contexte (homepage, product, cart, checkout)"
    )
    exclude_product_ids: Optional[List[str]] = Field(
        default=[], description="IDs de produits à exclure"
    )

    @validator('context')
    def validate_context(cls, v):
        allowed_contexts = ['homepage', 'product', 'cart', 'checkout']
        if v and v.lower() not in allowed_contexts:
            return 'homepage'
        return v.lower() if v else 'homepage'


class SimilarProductsRequest(BaseModel):
    """Request schema for similar products"""

    product_id: str = Field(..., description="UUID du produit de référence")
    limit: int = Field(10, ge=1, le=50, description="Nombre de produits similaires (max 50)")
    exclude_product_ids: Optional[List[str]] = Field(
        default=[], description="IDs de produits à exclure"
    )


class ProductRecommendation(BaseModel):
    """Individual product recommendation with score and reason"""

    product_id: str = Field(..., description="UUID du produit recommandé")
    score: float = Field(..., ge=0, le=1, description="Score de recommandation (0-1)")
    reason: str = Field(..., description="Raison de la recommandation")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Confiance (0-1)")


class ProductRecommendationResponse(BaseModel):
    """Response schema for product recommendations"""

    success: bool = Field(True, description="Statut de la requête")
    recommendations: List[ProductRecommendation] = Field(
        ..., description="Liste des produits recommandés"
    )
    strategy_used: str = Field(..., description="Stratégie utilisée pour les recommandations")
    total: int = Field(..., description="Nombre total de recommandations")
    metadata: Optional[dict] = Field(None, description="Métadonnées additionnelles")
    processing_time_ms: Optional[float] = Field(None, description="Temps de traitement en ms")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PopularProductsRequest(BaseModel):
    """Request schema for popular/trending products"""

    limit: int = Field(10, ge=1, le=50, description="Nombre de produits (max 50)")
    time_window_days: Optional[int] = Field(
        30, ge=1, le=365, description="Fenêtre temporelle en jours"
    )
    category_id: Optional[str] = Field(None, description="Filtrer par catégorie")


class ProductRecommendationFeedback(BaseModel):
    """Feedback for improving product recommendations"""

    user_id: str = Field(..., description="UUID de l'utilisateur")
    product_id: str = Field(..., description="UUID du produit")
    action: str = Field(..., description="Action (view, click, add_to_cart, purchase, ignore)")
    context: Optional[str] = Field(None, description="Contexte de l'action")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    @validator('action')
    def validate_action(cls, v):
        allowed_actions = ['view', 'click', 'add_to_cart', 'purchase', 'ignore', 'remove']
        if v.lower() not in allowed_actions:
            raise ValueError(f'Action doit être: {", ".join(allowed_actions)}')
        return v.lower()


class ProductRecommendationStats(BaseModel):
    """Statistics about product recommendation performance"""

    total_recommendations_served: int
    total_users_recommended: int
    average_ctr: float = Field(..., description="Click-through rate moyen")
    average_conversion_rate: float = Field(..., description="Taux de conversion moyen")
    strategies_performance: dict = Field(..., description="Performance par stratégie")
    last_updated: datetime
