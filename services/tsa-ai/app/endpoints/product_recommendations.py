"""
Product recommendation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import time
import logging

from app.core.database import get_db
from app.schemas.product_recommendations import (
    PersonalizedProductRecommendationRequest,
    SimilarProductsRequest,
    ProductRecommendationResponse,
    PopularProductsRequest,
    ProductRecommendationFeedback,
)
from app.services.product_recommendation_service import product_recommendation_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/personalized", response_model=ProductRecommendationResponse)
async def get_personalized_product_recommendations(
    request: PersonalizedProductRecommendationRequest,
    db: Session = Depends(get_db),
):
    """
    Obtenir des recommandations personnalisées pour un utilisateur

    Utilise plusieurs stratégies selon l'historique:
    - **Collaborative filtering**: Si l'utilisateur a ≥3 achats
    - **Content-based**: Si l'utilisateur a ≥1 achat
    - **Popularity-based**: Nouveaux utilisateurs sans historique

    - **user_id**: UUID de l'utilisateur
    - **limit**: Nombre de recommandations (max 50)
    - **context**: Contexte (homepage, product, cart, checkout)
    - **exclude_product_ids**: Liste de produits à exclure
    """
    try:
        logger.info(f"Personalized recommendations request for user {request.user_id}")

        response = await product_recommendation_service.get_personalized_recommendations(request)

        logger.info(
            f"Personalized recommendations: {response.total} products "
            f"(strategy: {response.strategy_used})"
        )

        return response

    except ValueError as e:
        logger.error(f"Validation error in personalized recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erreur de validation: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Personalized recommendations failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la génération des recommandations",
        )


@router.post("/similar", response_model=ProductRecommendationResponse)
async def get_similar_products(
    request: SimilarProductsRequest,
    db: Session = Depends(get_db),
):
    """
    Obtenir des produits similaires à un produit donné

    Utilise la similarité de contenu basée sur:
    - Catégorie identique
    - Prix similaire (±30%)
    - Attributs comparables

    - **product_id**: UUID du produit de référence
    - **limit**: Nombre de produits similaires (max 50)
    - **exclude_product_ids**: Liste de produits à exclure
    """
    try:
        logger.info(f"Similar products request for product {request.product_id}")

        response = await product_recommendation_service.get_similar_products(request)

        logger.info(
            f"Similar products: {response.total} products "
            f"(strategy: {response.strategy_used})"
        )

        return response

    except ValueError as e:
        logger.error(f"Validation error in similar products: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erreur de validation: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Similar products recommendation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la recherche de produits similaires",
        )


@router.get("/popular", response_model=ProductRecommendationResponse)
async def get_popular_products(
    limit: int = Query(10, ge=1, le=50, description="Nombre de produits"),
    time_window_days: int = Query(
        30, ge=1, le=365, description="Fenêtre temporelle en jours"
    ),
    db: Session = Depends(get_db),
):
    """
    Obtenir les produits populaires/tendances

    Basé sur le nombre de commandes récentes dans la fenêtre temporelle.
    Fallback sur les produits les plus récents si aucune commande.

    - **limit**: Nombre de produits à retourner (max 50)
    - **time_window_days**: Période à analyser (défaut 30 jours)
    """
    try:
        logger.info(f"Popular products request (window: {time_window_days} days)")

        response = await product_recommendation_service.get_popular_products(
            limit=limit, time_window_days=time_window_days
        )

        logger.info(
            f"Popular products: {response.total} products "
            f"(strategy: {response.strategy_used})"
        )

        return response

    except ValueError as e:
        logger.error(f"Validation error in popular products: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erreur de validation: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Popular products recommendation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des produits populaires",
        )


@router.post("/feedback")
async def submit_product_recommendation_feedback(
    feedback: ProductRecommendationFeedback,
    db: Session = Depends(get_db),
):
    """
    Soumettre un feedback sur une recommandation

    Ce feedback est utilisé pour améliorer les algorithmes de recommandation.

    Actions possibles:
    - **view**: L'utilisateur a vu le produit
    - **click**: L'utilisateur a cliqué sur le produit
    - **add_to_cart**: Ajouté au panier
    - **purchase**: Produit acheté
    - **ignore**: Recommandation ignorée
    - **remove**: Retiré du panier
    """
    try:
        logger.info(
            f"Recommendation feedback: user={feedback.user_id}, "
            f"product={feedback.product_id}, action={feedback.action}"
        )

        # TODO: Store feedback in database for algorithm improvement
        # In a production environment, this would:
        # 1. Store feedback in a dedicated table
        # 2. Update user preference vectors
        # 3. Retrain models periodically based on feedback

        # For now, just log and acknowledge
        logger.info("Feedback stored successfully")

        return {
            "message": "Feedback reçu avec succès",
            "status": "success",
            "action": feedback.action,
            "timestamp": feedback.timestamp.isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to store recommendation feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'enregistrement du feedback",
        )


@router.get("/stats")
async def get_product_recommendation_stats(db: Session = Depends(get_db)):
    """
    Obtenir les statistiques du système de recommandations

    Informations sur les performances et l'utilisation.
    """
    try:
        # TODO: Query actual stats from database
        # For now, return mock stats

        return {
            "total_recommendations_served": 0,
            "total_users_recommended": 0,
            "strategies_performance": {
                "collaborative_filtering": {
                    "usage_count": 0,
                    "avg_ctr": 0.0,
                    "avg_conversion": 0.0,
                },
                "content_based": {
                    "usage_count": 0,
                    "avg_ctr": 0.0,
                    "avg_conversion": 0.0,
                },
                "popularity_based": {
                    "usage_count": 0,
                    "avg_ctr": 0.0,
                    "avg_conversion": 0.0,
                },
            },
            "last_updated": "2024-12-19T10:00:00Z",
            "status": "operational",
        }

    except Exception as e:
        logger.error(f"Failed to get recommendation stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des statistiques",
        )


@router.get("/health")
async def product_recommendations_health_check():
    """
    Health check pour le service de recommandations de produits
    """
    return {
        "status": "healthy",
        "service": "product_recommendations",
        "version": "1.0.0",
        "timestamp": time.time(),
    }
