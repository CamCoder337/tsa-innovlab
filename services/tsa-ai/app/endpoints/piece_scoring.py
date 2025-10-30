"""
Piece Scoring API Endpoints
Provides REST API for piece quality scoring functionality
"""
import logging
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import JSONResponse

from app.schemas.piece_scoring import (
    PieceScoreRequest,
    PieceScoreResponse,
    BatchPieceScoreRequest,
    BatchPieceScoreResponse,
    ModelInfoResponse,
    ServiceStatsResponse,
    HealthCheckResponse,
    ScoringMethod
)
from app.services.piece_scoring_service import piece_scoring_service

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Service startup time for uptime calculation
service_start_time = datetime.now()


@router.get("/health", response_model=HealthCheckResponse, tags=["Health"])
async def health_check():
    """
    Check the health status of the piece scoring service
    """
    try:
        # Check if model is loaded
        stats = piece_scoring_service.get_service_stats()
        model_status = "loaded" if stats['model_loaded'] else "not_loaded"
        
        return HealthCheckResponse(
            status="healthy",
            model_status=model_status,
            timestamp=datetime.now(),
            version=stats['model_version']
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheckResponse(
            status="unhealthy",
            model_status="error",
            timestamp=datetime.now(),
            version="unknown"
        )


@router.get("/model/info", response_model=ModelInfoResponse, tags=["Model Info"])
async def get_model_info():
    """
    Get information about the loaded scoring model
    """
    try:
        stats = piece_scoring_service.get_service_stats()
        scorer = piece_scoring_service.scorer
        
        return ModelInfoResponse(
            model_version=scorer.model_version,
            model_loaded=stats['model_loaded'],
            model_path=stats['model_path'],
            feature_names=scorer.feature_names,
            score_thresholds=scorer.score_thresholds
        )
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des informations du modèle: {str(e)}"
        )


@router.get("/stats", response_model=ServiceStatsResponse, tags=["Statistics"])
async def get_service_stats():
    """
    Get service usage statistics
    """
    try:
        stats = piece_scoring_service.get_service_stats()
        uptime = (datetime.now() - service_start_time).total_seconds()
        
        return ServiceStatsResponse(
            total_requests=stats['total_requests'],
            method_usage=stats['method_usage'],
            avg_response_time=stats['avg_response_time'],
            model_loaded=stats['model_loaded'],
            model_version=stats['model_version'],
            uptime_seconds=uptime
        )
    except Exception as e:
        logger.error(f"Error getting service stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )


@router.post("/score", response_model=PieceScoreResponse, tags=["Scoring"])
async def score_piece(request: PieceScoreRequest):
    """
    Score a single piece using the specified method
    
    - **rule_based**: Uses business rules for scoring
    - **ml_based**: Uses machine learning model for scoring
    - **both**: Returns comparison between both methods
    
    Auto-enrichment: If piece_id looks like a UUID, the system will automatically
    enrich missing data from the database.
    """
    try:
        logger.info(f"Scoring piece {request.piece_info.piece_id} using method {request.method}")
        
        # 🔍 Auto-enrichment: Si le piece_id ressemble à un UUID, enrichir depuis la DB
        piece_id = request.piece_info.piece_id
        if piece_id and len(piece_id) == 36 and '-' in piece_id:  # UUID format
            logger.info(f"Attempting auto-enrichment for product {piece_id}")
            try:
                from app.core.database import get_db
                from app.services.product_enrichment_service import get_enrichment_service
                
                # Obtenir une session DB
                async for db in get_db():
                    enrichment_service = get_enrichment_service(db)
                    
                    # Enrichir les données
                    enriched_data = await enrichment_service.enrich_product_data(
                        piece_id,
                        request.piece_info.dict()
                    )
                    
                    # Mettre à jour la requête avec les données enrichies
                    for key, value in enriched_data.items():
                        if not key.startswith('_') and value is not None:
                            setattr(request.piece_info, key, value)
                    
                    logger.info(f"Product {piece_id} auto-enriched successfully")
                    break
                    
            except Exception as enrich_error:
                logger.warning(f"Auto-enrichment failed for {piece_id}: {enrich_error}")
                # Continue sans enrichissement en cas d'erreur
        
        result = await piece_scoring_service.score_piece(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in score_piece: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur inattendue lors du scoring: {str(e)}"
        )


@router.post("/score/rule-based", response_model=PieceScoreResponse, tags=["Scoring"])
async def score_piece_rule_based(request: PieceScoreRequest):
    """
    Score a piece using rule-based method only
    """
    request.method = ScoringMethod.RULE_BASED
    return await score_piece(request)


@router.post("/score/ml", response_model=PieceScoreResponse, tags=["Scoring"])
async def score_piece_ml(request: PieceScoreRequest):
    """
    Score a piece using machine learning model only
    """
    request.method = ScoringMethod.ML_BASED
    return await score_piece(request)


@router.post("/score/both", response_model=PieceScoreResponse, tags=["Scoring"])
async def score_piece_both_methods(request: PieceScoreRequest):
    """
    Score a piece using both methods and return comparison
    """
    request.method = ScoringMethod.BOTH
    return await score_piece(request)


@router.post("/score/batch", response_model=BatchPieceScoreResponse, tags=["Batch Scoring"])
async def score_pieces_batch(request: BatchPieceScoreRequest):
    """
    Score multiple pieces in a single request
    
    Maximum 100 pieces per batch for performance reasons.
    """
    try:
        logger.info(f"Batch scoring {len(request.pieces)} pieces using method {request.method}")
        result = await piece_scoring_service.score_batch(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in score_pieces_batch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur inattendue lors du scoring batch: {str(e)}"
        )


@router.get("/score/demo", response_model=PieceScoreResponse, tags=["Demo"])
async def demo_scoring(
    method: ScoringMethod = Query(default=ScoringMethod.ML_BASED, description="Méthode de scoring")
):
    """
    Demo endpoint with sample piece data for testing
    """
    from app.schemas.piece_scoring import PieceInfo
    
    # Sample piece data
    demo_piece = PieceInfo(
        piece_id="DEMO_PIECE_001",
        piece_name="Alternateur Bosch Démo",
        piece_age_months=18,
        estimated_lifetime_months=120,
        supplier_rating=4.2,
        supplier_years_experience=8,
        average_customer_rating=4.1,
        number_of_reviews=25,
        physical_condition_score=82.0,
        price=175.0,
        category_code=2,
        brand_reputation_score=85.0
    )
    
    demo_request = PieceScoreRequest(
        piece_info=demo_piece,
        method=method
    )
    
    return await score_piece(demo_request)


@router.get("/categories", tags=["Reference"])
async def get_score_categories():
    """
    Get available score categories and their thresholds
    """
    scorer = piece_scoring_service.scorer
    return {
        "categories": {
            "excellent": {
                "threshold": scorer.score_thresholds['excellent'],
                "description": "Pièce en excellent état, très fiable"
            },
            "bon": {
                "threshold": scorer.score_thresholds['bon'],
                "description": "Pièce en bon état, fiable"
            },
            "moyen": {
                "threshold": scorer.score_thresholds['moyen'],
                "description": "Pièce en état moyen, fiabilité acceptable"
            },
            "faible": {
                "threshold": scorer.score_thresholds['faible'],
                "description": "Pièce en état faible, fiabilité limitée"
            }
        },
        "weights": scorer.weights
    }


@router.get("/methods", tags=["Reference"])
async def get_scoring_methods():
    """
    Get available scoring methods and their descriptions
    """
    return {
        "methods": {
            "rule_based": {
                "description": "Scoring basé sur des règles métier prédéfinies",
                "advantages": ["Transparent", "Prévisible", "Rapide"],
                "use_cases": ["Validation", "Baseline", "Debugging"]
            },
            "ml_based": {
                "description": "Scoring utilisant un modèle de machine learning",
                "advantages": ["Précis", "Adaptatif", "Basé sur les données"],
                "use_cases": ["Production", "Prédictions complexes", "Optimisation"]
            },
            "both": {
                "description": "Comparaison entre les deux méthodes",
                "advantages": ["Validation croisée", "Analyse", "Debugging"],
                "use_cases": ["Tests", "Validation de modèle", "Analyse comparative"]
            }
        }
    }


# Error handlers
# Note: Exception handlers are registered in main.py, not on individual routers
