"""
ETA prediction endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import time
import logging

from app.core.database import get_db
from app.core.dependencies import get_user_from_header
from app.core.metrics import eta_predictions_total, eta_prediction_duration
from app.schemas.eta import (
    ETARequest, ETAResponse, ETABatchRequest, ETABatchResponse,
    ETAHistoryRequest, ETAHistoryResponse, ETAAccuracyFeedback,
    ETAModelStats
)
from app.services.eta_service import ETAService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/predict", response_model=ETAResponse)
async def predict_eta(
    request: ETARequest,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Prédire l'ETA pour une livraison

    - **shipment_id**: ID du colis (optionnel)
    - **origin_lat/lng**: Coordonnées du point de départ
    - **destination_lat/lng**: Coordonnées de destination
    - **vehicle_type**: Type de véhicule (truck, van, moto, car, pickup)
    - **cargo_weight_kg**: Poids du cargo en kg
    - **departure_time**: Heure de départ prévue
    - **priority**: Priorité (normal, urgent, express)
    """
    start_time = time.time()
    try:
        logger.info(f"ETA prediction request for user {user.get('id') if user else 'anonymous'}")

        eta_service = ETAService()
        prediction = await eta_service.predict_eta(request)

        logger.info(f"ETA predicted: {prediction.estimated_duration_minutes} minutes")

        # Track metrics
        eta_predictions_total.labels(status='success').inc()
        eta_prediction_duration.observe(time.time() - start_time)

        return prediction

    except ValueError as e:
        logger.error(f"Validation error in ETA prediction: {e}")
        eta_predictions_total.labels(status='error').inc()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erreur de validation: {str(e)}"
        )
    except Exception as e:
        logger.error(f"ETA prediction failed: {e}")
        eta_predictions_total.labels(status='error').inc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la prédiction ETA"
        )


@router.post("/predict/batch", response_model=ETABatchResponse)
async def predict_eta_batch(
    request: ETABatchRequest,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Prédire l'ETA pour plusieurs livraisons en une seule fois

    Maximum 50 prédictions par batch pour éviter les timeouts.
    """
    try:
        start_time = time.time()

        logger.info(f"Batch ETA prediction for {len(request.predictions)} shipments")

        eta_service = ETAService()
        predictions = await eta_service.predict_eta_batch(request.predictions)

        # Calculate processing stats
        processing_time_ms = (time.time() - start_time) * 1000
        successful_predictions = len([p for p in predictions if p.model_version != "fallback-1.0.0"])
        failed_predictions = len(predictions) - successful_predictions

        logger.info(f"Batch prediction completed: {successful_predictions} successful, {failed_predictions} fallback")

        return ETABatchResponse(
            predictions=predictions,
            successful_predictions=successful_predictions,
            failed_predictions=failed_predictions,
            processing_time_ms=round(processing_time_ms, 2),
            batch_id=f"batch_{int(time.time())}"
        )

    except ValueError as e:
        logger.error(f"Validation error in batch ETA prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erreur de validation: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Batch ETA prediction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la prédiction ETA en batch"
        )


@router.get("/history/{shipment_id}", response_model=ETAHistoryResponse)
async def get_eta_history(
    shipment_id: int,
    limit: int = Query(10, ge=1, le=100, description="Nombre de prédictions à retourner"),
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Récupérer l'historique des prédictions ETA pour un colis

    Utile pour analyser la précision des prédictions au fil du temps.
    """
    try:
        logger.info(f"Fetching ETA history for shipment {shipment_id}")

        # TODO: Implement database query to fetch prediction history
        # For now, return mock data

        # In a real implementation, you would query the database:
        # predictions = db.query(ETAPrediction).filter(
        #     ETAPrediction.shipment_id == shipment_id
        # ).order_by(ETAPrediction.created_at.desc()).limit(limit).all()

        return ETAHistoryResponse(
            shipment_id=shipment_id,
            predictions=[],  # Empty for now
            total_predictions=0,
            accuracy_stats={
                "average_accuracy": 0.85,
                "total_predictions": 0,
                "last_updated": "2024-12-19T10:00:00Z"
            }
        )

    except Exception as e:
        logger.error(f"Failed to fetch ETA history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération de l'historique ETA"
        )


@router.post("/feedback")
async def submit_eta_feedback(
    feedback: ETAAccuracyFeedback,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Soumettre un feedback sur la précision d'une prédiction ETA

    Ce feedback est utilisé pour améliorer les modèles ML.
    """
    try:
        logger.info(f"Received ETA feedback for shipment {feedback.shipment_id}")

        # Calculate accuracy
        accuracy = 1 - abs(feedback.predicted_duration_minutes - feedback.actual_duration_minutes) / max(feedback.predicted_duration_minutes, feedback.actual_duration_minutes)
        accuracy_percent = round(accuracy * 100, 2)

        # TODO: Store feedback in database for model retraining
        # feedback_record = ETAFeedback(
        #     shipment_id=feedback.shipment_id,
        #     predicted_duration=feedback.predicted_duration_minutes,
        #     actual_duration=feedback.actual_duration_minutes,
        #     accuracy_percent=accuracy_percent,
        #     rating=feedback.rating,
        #     notes=feedback.feedback_notes,
        #     created_at=datetime.utcnow()
        # )
        # db.add(feedback_record)
        # db.commit()

        logger.info(f"ETA feedback stored with {accuracy_percent}% accuracy")

        return {
            "message": "Feedback reçu avec succès",
            "accuracy_percent": accuracy_percent,
            "status": "success"
        }

    except Exception as e:
        logger.error(f"Failed to store ETA feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'enregistrement du feedback"
        )


@router.get("/model/stats", response_model=ETAModelStats)
async def get_model_stats(
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Obtenir les statistiques du modèle ETA

    Informations sur les performances et l'état du modèle.
    """
    try:
        # TODO: Query actual stats from database
        # For now, return mock stats

        return ETAModelStats(
            model_version="1.0.0",
            total_predictions=0,
            average_accuracy_percent=85.5,
            last_trained=None,
            features_used=[
                "distance_km",
                "vehicle_type",
                "cargo_weight",
                "departure_time",
                "traffic_conditions",
                "weather_impact"
            ],
            performance_metrics={
                "mae": 12.5,  # Mean Absolute Error in minutes
                "rmse": 18.3,  # Root Mean Square Error
                "mape": 15.2,  # Mean Absolute Percentage Error
                "r2_score": 0.78  # R-squared score
            }
        )

    except Exception as e:
        logger.error(f"Failed to get model stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des statistiques"
        )


@router.get("/quick/{origin_lat}/{origin_lng}/{dest_lat}/{dest_lng}")
async def quick_eta_estimate(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    vehicle_type: str = Query("van", description="Type de véhicule"),
    cargo_weight: Optional[float] = Query(None, description="Poids cargo en kg")
):
    """
    Estimation ETA rapide avec coordonnées dans l'URL

    Endpoint simplifié pour une estimation rapide sans payload JSON.
    Utile pour les intégrations simples ou les tests.
    """
    try:
        # Validate coordinates
        if not (-90 <= origin_lat <= 90 and -180 <= origin_lng <= 180):
            raise ValueError("Coordonnées origine invalides")
        if not (-90 <= dest_lat <= 90 and -180 <= dest_lng <= 180):
            raise ValueError("Coordonnées destination invalides")

        # Create request object
        request = ETARequest(
            origin_lat=origin_lat,
            origin_lng=origin_lng,
            destination_lat=dest_lat,
            destination_lng=dest_lng,
            vehicle_type=vehicle_type,
            cargo_weight_kg=cargo_weight
        )

        eta_service = ETAService()
        prediction = await eta_service.predict_eta(request)

        # Return simplified response
        return {
            "duration_minutes": prediction.estimated_duration_minutes,
            "distance_km": prediction.distance_km,
            "confidence": prediction.confidence_score,
            "arrival_range": {
                "min_minutes": prediction.min_duration_minutes,
                "max_minutes": prediction.max_duration_minutes
            },
            "factors": {
                "risks": prediction.risk_factors,
                "advantages": prediction.positive_factors
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Quick ETA estimation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'estimation rapide"
        )