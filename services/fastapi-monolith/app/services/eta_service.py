"""
ETA Prediction Service
Handles all ETA-related machine learning predictions
"""
import math
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from app.core.config import settings
from app.services.ml_service import ml_service
from app.schemas.eta import ETARequest, ETAResponse

logger = logging.getLogger(__name__)


class ETAService:
    """
    Service for ETA predictions using machine learning
    """

    def __init__(self):
        self.model_name = "eta"
        self.model_version = "1.0.0"

    async def predict_eta(self, request: ETARequest) -> ETAResponse:
        """
        Predict ETA for a single shipment
        """
        try:
            # Get ML model
            model = ml_service.get_model(self.model_name)
            if not model:
                logger.warning("ETA model not available, using fallback calculation")
                return await self._fallback_eta_calculation(request)

            # Prepare features for ML model
            features = self._prepare_features(request)

            # Make prediction
            prediction_minutes = model.predict([features])[0]
            confidence_scores = model.predict_proba([features])[0] if hasattr(model, 'predict_proba') else [0.8]

            # Calculate additional insights
            risk_factors, positive_factors = self._analyze_risk_factors(request, features)
            traffic_impact, weather_impact = self._analyze_environmental_factors(request)
            distance_km = self._calculate_distance(
                request.origin_lat, request.origin_lng,
                request.destination_lat, request.destination_lng
            )

            # Calculate confidence and range
            confidence_score = max(confidence_scores) if len(confidence_scores) > 0 else 0.8
            reliability_level = self._get_reliability_level(confidence_score)

            # Calculate min/max range (±20% based on confidence)
            uncertainty_factor = (1 - confidence_score) * 0.4  # Max 40% uncertainty
            min_duration = max(int(prediction_minutes * (1 - uncertainty_factor)), 5)
            max_duration = int(prediction_minutes * (1 + uncertainty_factor))

            # Calculate arrival time if departure time provided
            arrival_time = None
            if request.departure_time:
                arrival_time = request.departure_time + timedelta(minutes=int(prediction_minutes))

            return ETAResponse(
                estimated_duration_minutes=int(prediction_minutes),
                estimated_arrival_time=arrival_time,
                confidence_score=round(confidence_score, 3),
                reliability_level=reliability_level,
                risk_factors=risk_factors,
                positive_factors=positive_factors,
                min_duration_minutes=min_duration,
                max_duration_minutes=max_duration,
                traffic_impact=traffic_impact,
                weather_impact=weather_impact,
                distance_km=round(distance_km, 2),
                model_version=self.model_version
            )

        except Exception as e:
            logger.error(f"ETA prediction failed: {e}")
            # Fallback to basic calculation
            return await self._fallback_eta_calculation(request)

    async def predict_eta_batch(self, requests: List[ETARequest]) -> List[ETAResponse]:
        """
        Predict ETA for multiple shipments (batch processing)
        """
        results = []

        # Process in batches of configured size
        batch_size = settings.prediction_batch_size

        for i in range(0, len(requests), batch_size):
            batch = requests[i:i + batch_size]

            try:
                # Get ML model
                model = ml_service.get_model(self.model_name)

                if model:
                    # Prepare features for entire batch
                    features_batch = [self._prepare_features(req) for req in batch]

                    # Batch prediction
                    predictions = model.predict(features_batch)
                    confidences = model.predict_proba(features_batch) if hasattr(model,
                                                                                 'predict_proba') else [[0.8]] * len(
                        batch)

                    # Process each prediction
                    for j, (request, pred_minutes, conf_scores) in enumerate(zip(batch, predictions, confidences)):
                        try:
                            # Build response similar to single prediction
                            response = await self._build_eta_response(request, pred_minutes, conf_scores)
                            results.append(response)
                        except Exception as e:
                            logger.error(f"Failed to process batch item {j}: {e}")
                            results.append(await self._fallback_eta_calculation(request))
                else:
                    # Fallback for entire batch
                    for request in batch:
                        results.append(await self._fallback_eta_calculation(request))

            except Exception as e:
                logger.error(f"Batch prediction failed: {e}")
                # Fallback for entire batch
                for request in batch:
                    results.append(await self._fallback_eta_calculation(request))

        return results

    def _prepare_features(self, request: ETARequest) -> List[float]:
        """
        Prepare features vector for ML model
        """
        # Calculate basic features
        distance_km = self._calculate_distance(
            request.origin_lat, request.origin_lng,
            request.destination_lat, request.destination_lng
        )

        # Vehicle type encoding
        vehicle_encoding = {
            'moto': 1, 'car': 2, 'van': 3, 'pickup': 4, 'truck': 5
        }
        vehicle_code = vehicle_encoding.get(request.vehicle_type, 3)

        # Priority encoding
        priority_encoding = {'normal': 1, 'urgent': 2, 'express': 3}
        priority_code = priority_encoding.get(request.priority, 1)

        # Time features (if departure time provided)
        hour_of_day = 12  # Default
        day_of_week = 1  # Default (Monday)
        if request.departure_time:
            hour_of_day = request.departure_time.hour
            day_of_week = request.departure_time.weekday() + 1

        # Build features vector
        features = [
            distance_km,
            vehicle_code,
            request.cargo_weight_kg or 1000,  # Default weight
            request.cargo_volume_m3 or 10,  # Default volume
            priority_code,
            hour_of_day,
            day_of_week,
            request.driver_experience_years or 5,  # Default experience
            request.origin_lat,
            request.origin_lng,
            request.destination_lat,
            request.destination_lng
        ]

        return features

    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        """
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])

        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Radius of Earth in kilometers

        return r * c

    def _analyze_risk_factors(self, request: ETARequest, features: List[float]) -> Tuple[List[str], List[str]]:
        """
        Analyze risk and positive factors
        """
        risk_factors = []
        positive_factors = []

        distance_km = features[0]
        vehicle_type = request.vehicle_type
        cargo_weight = request.cargo_weight_kg or 1000

        # Distance-based factors
        if distance_km > 500:
            risk_factors.append("long_distance")
        elif distance_km < 50:
            positive_factors.append("short_distance")

        # Vehicle-based factors
        if vehicle_type == 'truck' and cargo_weight > 5000:
            risk_factors.append("heavy_cargo")
        elif vehicle_type == 'moto':
            positive_factors.append("agile_vehicle")

        # Time-based factors
        if request.departure_time:
            hour = request.departure_time.hour
            if 7 <= hour <= 9 or 17 <= hour <= 19:
                risk_factors.append("rush_hour")
            elif 22 <= hour or hour <= 5:
                positive_factors.append("low_traffic_time")

        # Priority factors
        if request.priority == 'express':
            positive_factors.append("express_priority")

        return risk_factors, positive_factors

    def _analyze_environmental_factors(self, request: ETARequest) -> Tuple[str, str]:
        """
        Analyze traffic and weather impact
        """
        # Simplified analysis - in reality, this would use external APIs

        # Traffic analysis based on time and distance
        traffic_impact = "medium"
        if request.departure_time:
            hour = request.departure_time.hour
            if 7 <= hour <= 9 or 17 <= hour <= 19:
                traffic_impact = "high"
            elif 22 <= hour or hour <= 5:
                traffic_impact = "low"

        # Weather impact (simplified)
        weather_impact = "low"
        if request.departure_time:
            # Could integrate with weather API here
            # For now, random assignment based on season
            month = request.departure_time.month
            if month in [6, 7, 8, 9]:  # Rainy season in Cameroon
                weather_impact = "medium"

        return traffic_impact, weather_impact

    def _get_reliability_level(self, confidence_score: float) -> str:
        """
        Get reliability level based on confidence score
        """
        if confidence_score >= 0.8:
            return "high"
        elif confidence_score >= 0.6:
            return "medium"
        else:
            return "low"

    async def _fallback_eta_calculation(self, request: ETARequest) -> ETAResponse:
        """
        Fallback ETA calculation when ML model is not available
        """
        # Calculate distance
        distance_km = self._calculate_distance(
            request.origin_lat, request.origin_lng,
            request.destination_lat, request.destination_lng
        )

        # Basic speed estimates by vehicle type (km/h)
        speed_estimates = {
            'moto': 35,
            'car': 50,
            'van': 45,
            'pickup': 45,
            'truck': 40
        }

        base_speed = speed_estimates.get(request.vehicle_type, 45)

        # Adjust for cargo weight
        if request.cargo_weight_kg and request.cargo_weight_kg > 3000:
            base_speed *= 0.9  # Reduce speed for heavy cargo

        # Calculate basic duration
        duration_hours = distance_km / base_speed
        duration_minutes = int(duration_hours * 60)

        # Add buffer for stops, traffic, etc.
        duration_minutes = int(duration_minutes * 1.2)

        # Calculate arrival time
        arrival_time = None
        if request.departure_time:
            arrival_time = request.departure_time + timedelta(minutes=duration_minutes)

        return ETAResponse(
            estimated_duration_minutes=duration_minutes,
            estimated_arrival_time=arrival_time,
            confidence_score=0.7,  # Medium confidence for fallback
            reliability_level="medium",
            risk_factors=["fallback_calculation"],
            positive_factors=[],
            min_duration_minutes=int(duration_minutes * 0.8),
            max_duration_minutes=int(duration_minutes * 1.3),
            traffic_impact="medium",
            weather_impact="low",
            distance_km=round(distance_km, 2),
            model_version="fallback-1.0.0"
        )

    async def _build_eta_response(self, request: ETARequest, pred_minutes: float,
                                  conf_scores: List[float]) -> ETAResponse:
        """
        Build ETA response from prediction results
        """
        confidence_score = max(conf_scores) if len(conf_scores) > 0 else 0.8

        # Calculate additional insights
        features = self._prepare_features(request)
        risk_factors, positive_factors = self._analyze_risk_factors(request, features)
        traffic_impact, weather_impact = self._analyze_environmental_factors(request)
        distance_km = features[0]  # Distance is first feature

        # Calculate range
        uncertainty_factor = (1 - confidence_score) * 0.4
        min_duration = max(int(pred_minutes * (1 - uncertainty_factor)), 5)
        max_duration = int(pred_minutes * (1 + uncertainty_factor))

        # Calculate arrival time
        arrival_time = None
        if request.departure_time:
            arrival_time = request.departure_time + timedelta(minutes=int(pred_minutes))

        return ETAResponse(
            estimated_duration_minutes=int(pred_minutes),
            estimated_arrival_time=arrival_time,
            confidence_score=round(confidence_score, 3),
            reliability_level=self._get_reliability_level(confidence_score),
            risk_factors=risk_factors,
            positive_factors=positive_factors,
            min_duration_minutes=min_duration,
            max_duration_minutes=max_duration,
            traffic_impact=traffic_impact,
            weather_impact=weather_impact,
            distance_km=round(distance_km, 2),
            model_version=self.model_version
        )