"""
Mission Recommendations API Endpoints
Provides REST API for mission recommendation functionality for transporters
"""
import logging
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import JSONResponse

from app.schemas.mission_recommendations import (
    MissionRecommendationRequest,
    MissionRecommendationResponse,
    BatchMissionRecommendationRequest,
    BatchMissionRecommendationResponse,
    ModelInfoResponse,
    ServiceStatsResponse,
    HealthCheckResponse,
    CitiesResponse,
    MerchandiseTypesResponse,
    RecommendationMethod,
    TransporterProfile,
    MissionInfo
)
from app.services.mission_recommendation_service import mission_recommendation_service

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Service startup time for uptime calculation
service_start_time = datetime.now()


@router.get("/health", response_model=HealthCheckResponse, tags=["Health"])
async def health_check():
    """
    Check the health status of the mission recommendation service
    """
    try:
        # Check if model is loaded
        stats = mission_recommendation_service.get_service_stats()
        model_status = "loaded" if stats['model_loaded'] else "not_loaded"
        
        return HealthCheckResponse(
            status="healthy",
            model_status=model_status,
            timestamp=datetime.now(),
            version=stats['model_version'],
            cities_count=stats['supported_cities']
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheckResponse(
            status="unhealthy",
            model_status="error",
            timestamp=datetime.now(),
            version="unknown",
            cities_count=0
        )


@router.get("/model/info", response_model=ModelInfoResponse, tags=["Model Info"])
async def get_model_info():
    """
    Get information about the loaded recommendation model
    """
    try:
        stats = mission_recommendation_service.get_service_stats()
        recommender = mission_recommendation_service.recommender
        
        return ModelInfoResponse(
            model_version=recommender.model_version,
            model_loaded=stats['model_loaded'],
            model_path=stats['model_path'],
            supported_cities=stats['supported_cities'],
            supported_merchandise_types=stats['supported_merchandise_types'],
            distance_matrix_size=len(recommender.distances)
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
        stats = mission_recommendation_service.get_service_stats()
        
        return ServiceStatsResponse(
            total_requests=stats['total_requests'],
            method_usage=stats['method_usage'],
            avg_response_time=stats['avg_response_time'],
            model_loaded=stats['model_loaded'],
            model_version=stats['model_version'],
            supported_cities=stats['supported_cities'],
            supported_merchandise_types=stats['supported_merchandise_types']
        )
    except Exception as e:
        logger.error(f"Error getting service stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )


@router.post("/recommend", response_model=MissionRecommendationResponse, tags=["Recommendations"])
async def recommend_missions(request: MissionRecommendationRequest):
    """
    Recommend missions for a transporter using the specified method
    
    - **rule_based**: Uses business rules for recommendations
    - **ml_based**: Uses machine learning model for recommendations
    - **both**: Returns comparison between both methods
    """
    try:
        logger.info(f"Recommending missions for transporter {request.transporter_profile.transporter_id} using method {request.method}")
        result = await mission_recommendation_service.recommend_missions(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in recommend_missions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur inattendue lors des recommandations: {str(e)}"
        )


@router.post("/recommend/rule-based", response_model=MissionRecommendationResponse, tags=["Recommendations"])
async def recommend_missions_rule_based(request: MissionRecommendationRequest):
    """
    Recommend missions using rule-based method only
    """
    request.method = RecommendationMethod.RULE_BASED
    return await recommend_missions(request)


@router.post("/recommend/ml", response_model=MissionRecommendationResponse, tags=["Recommendations"])
async def recommend_missions_ml(request: MissionRecommendationRequest):
    """
    Recommend missions using machine learning model only
    """
    request.method = RecommendationMethod.ML_BASED
    return await recommend_missions(request)


@router.post("/recommend/both", response_model=MissionRecommendationResponse, tags=["Recommendations"])
async def recommend_missions_both_methods(request: MissionRecommendationRequest):
    """
    Recommend missions using both methods and return comparison
    """
    request.method = RecommendationMethod.BOTH
    return await recommend_missions(request)


@router.post("/recommend/batch", response_model=BatchMissionRecommendationResponse, tags=["Batch Recommendations"])
async def recommend_missions_batch(request: BatchMissionRecommendationRequest):
    """
    Recommend missions for multiple transporters in a single request
    
    Maximum 50 transporters per batch for performance reasons.
    """
    try:
        logger.info(f"Batch recommending for {len(request.transporters)} transporters using method {request.method}")
        result = await mission_recommendation_service.recommend_batch(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in recommend_missions_batch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur inattendue lors des recommandations batch: {str(e)}"
        )


@router.get("/demo", response_model=MissionRecommendationResponse, tags=["Demo"])
async def demo_recommendations(
    method: RecommendationMethod = Query(default=RecommendationMethod.ML_BASED, description="Méthode de recommandation")
):
    """
    Demo endpoint with sample transporter and mission data for testing
    """
    # Sample transporter profile
    demo_transporter = TransporterProfile(
        transporter_id="DEMO_TRANS_001",
        max_weight=8000.0,
        max_distance=600.0,
        min_budget=75000.0,
        experience_years=3,
        reputation_score=78.0,
        preferred_merchandise_types=["Électronique", "Alimentaire"],
        known_cities=["Yaoundé", "Douala", "Bafoussam"],
        preferred_delay_days=5,
        vehicle_type="Camion 8T"
    )
    
    # Sample missions
    demo_missions = [
        MissionInfo(
            mission_id="DEMO_MISSION_001",
            weight=3500.0,
            budget=120000.0,
            delay_days=4,
            depart_city="Yaoundé",
            arrival_city="Douala",
            merchandise_type="Électronique",
            description="Transport d'équipements informatiques",
            urgency_level=3
        ),
        MissionInfo(
            mission_id="DEMO_MISSION_002",
            weight=6000.0,
            budget=180000.0,
            delay_days=7,
            depart_city="Douala",
            arrival_city="Bafoussam",
            merchandise_type="Alimentaire",
            description="Livraison de produits alimentaires",
            urgency_level=2
        ),
        MissionInfo(
            mission_id="DEMO_MISSION_003",
            weight=2000.0,
            budget=95000.0,
            delay_days=3,
            depart_city="Yaoundé",
            arrival_city="Kribi",
            merchandise_type="Textile",
            description="Transport de vêtements",
            urgency_level=4
        )
    ]
    
    demo_request = MissionRecommendationRequest(
        transporter_profile=demo_transporter,
        available_missions=demo_missions,
        method=method,
        max_recommendations=5
    )
    
    return await recommend_missions(demo_request)


@router.get("/cities", response_model=CitiesResponse, tags=["Reference"])
async def get_supported_cities():
    """
    Get list of supported Cameroon cities
    """
    try:
        recommender = mission_recommendation_service.recommender
        cities = recommender.cities
        
        return CitiesResponse(
            cities=cities,
            total_count=len(cities)
        )
    except Exception as e:
        logger.error(f"Error getting cities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des villes: {str(e)}"
        )


@router.get("/merchandise-types", response_model=MerchandiseTypesResponse, tags=["Reference"])
async def get_supported_merchandise_types():
    """
    Get list of supported merchandise types
    """
    try:
        recommender = mission_recommendation_service.recommender
        merchandise_types = recommender.merchandise_types
        
        return MerchandiseTypesResponse(
            merchandise_types=merchandise_types,
            total_count=len(merchandise_types)
        )
    except Exception as e:
        logger.error(f"Error getting merchandise types: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des types de marchandises: {str(e)}"
        )


@router.get("/methods", tags=["Reference"])
async def get_recommendation_methods():
    """
    Get available recommendation methods and their descriptions
    """
    return {
        "methods": {
            "rule_based": {
                "description": "Recommandations basées sur des règles métier prédéfinies",
                "advantages": ["Transparent", "Prévisible", "Rapide"],
                "use_cases": ["Validation", "Baseline", "Debugging"],
                "factors": [
                    "Distance et capacité du transporteur",
                    "Budget et rentabilité",
                    "Spécialisation par type de marchandise",
                    "Expérience sur les routes"
                ]
            },
            "ml_based": {
                "description": "Recommandations utilisant un modèle de machine learning",
                "advantages": ["Précis", "Adaptatif", "Basé sur les données historiques"],
                "use_cases": ["Production", "Optimisation", "Prédictions complexes"],
                "factors": [
                    "Patterns d'apprentissage des données historiques",
                    "Corrélations complexes entre variables",
                    "Adaptation aux préférences individuelles",
                    "Optimisation continue"
                ]
            },
            "both": {
                "description": "Comparaison entre les deux méthodes",
                "advantages": ["Validation croisée", "Analyse comparative", "Debugging"],
                "use_cases": ["Tests", "Validation de modèle", "Analyse de performance"],
                "output": "Résultats des deux méthodes avec métriques de comparaison"
            }
        }
    }


@router.get("/distance/{city1}/{city2}", tags=["Reference"])
async def get_distance_between_cities(city1: str, city2: str):
    """
    Get distance between two cities in kilometers
    """
    try:
        recommender = mission_recommendation_service.recommender
        distance = recommender.get_distance(city1, city2)
        
        return {
            "from_city": city1,
            "to_city": city2,
            "distance_km": distance,
            "supported_cities": recommender.cities
        }
    except Exception as e:
        logger.error(f"Error getting distance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du calcul de distance: {str(e)}"
        )


@router.post("/analyze/transporter", tags=["Analysis"])
async def analyze_transporter_profile(profile: TransporterProfile):
    """
    Analyze a transporter profile and provide insights
    """
    try:
        recommender = mission_recommendation_service.recommender
        
        # Analyse du profil
        analysis = {
            "transporter_id": profile.transporter_id,
            "profile_strength": "strong" if profile.reputation_score >= 80 else "moderate" if profile.reputation_score >= 60 else "weak",
            "capacity_category": "heavy" if profile.max_weight >= 10000 else "medium" if profile.max_weight >= 5000 else "light",
            "range_category": "long" if profile.max_distance >= 800 else "medium" if profile.max_distance >= 400 else "short",
            "experience_level": "expert" if profile.experience_years >= 5 else "intermediate" if profile.experience_years >= 2 else "beginner",
            "specializations": profile.preferred_merchandise_types,
            "coverage_area": len(profile.known_cities),
            "recommendations": []
        }
        
        # Recommandations d'amélioration
        if profile.reputation_score < 70:
            analysis["recommendations"].append("Améliorer la réputation en complétant plus de missions avec succès")
        
        if len(profile.known_cities) < 5:
            analysis["recommendations"].append("Élargir la zone de couverture en explorant de nouvelles villes")
        
        if len(profile.preferred_merchandise_types) < 3:
            analysis["recommendations"].append("Diversifier les spécialisations pour plus d'opportunités")
        
        if profile.min_budget > 100000:
            analysis["recommendations"].append("Considérer des missions à budget plus modéré pour augmenter le volume")
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing transporter profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'analyse du profil: {str(e)}"
        )


# Error handlers
# Note: Exception handlers are registered in main.py, not on individual routers
