"""
Piece Scoring Service
Handles ML-based piece quality scoring for TSA InnovLab
Adapted from scoring_algo module to fit tsa-ai architecture
"""
import logging
import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Union, Optional
from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException

from app.core.config import settings
from app.schemas.piece_scoring import (
    PieceScoreRequest,
    PieceScoreResponse,
    BatchPieceScoreRequest,
    BatchPieceScoreResponse,
    PieceInfo,
    ScoreDetails
)

logger = logging.getLogger(__name__)


class PieceQualityScorer:
    """
    Système de scoring de fiabilité pour les pièces reconditionnées
    Intégré dans l'architecture tsa-ai
    """
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.model_version = "1.0.0"
        self.model_path = Path(settings.models_path) / "piece_quality_scorer.pkl"
        
        # Seuils de scoring
        self.score_thresholds = {
            'excellent': 85,
            'bon': 70,
            'moyen': 50,
            'faible': 30
        }
        
        # Facteurs de pondération
        self.weights = {
            'age_factor': 0.25,
            'supplier_reliability': 0.30,
            'customer_feedback': 0.25,
            'physical_condition': 0.20
        }
        
        # Chargement automatique du modèle
        self._load_model()
    
    def _load_model(self) -> bool:
        """
        Charge le modèle ML depuis le fichier pkl
        """
        try:
            if self.model_path.exists():
                model_data = joblib.load(self.model_path)
                
                if isinstance(model_data, dict):
                    self.model = model_data.get('model')
                    self.scaler = model_data.get('scaler')
                    self.feature_names = model_data.get('feature_names')
                else:
                    # Ancien format - juste le modèle
                    self.model = model_data
                
                logger.info(f"Modèle de scoring chargé depuis {self.model_path}")
                return True
            else:
                logger.warning(f"Fichier modèle non trouvé: {self.model_path}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle: {e}")
            return False
    
    def calculate_age_factor(self, piece_age_months: int, estimated_lifetime_months: int) -> float:
        """
        Calcule le facteur d'âge de la pièce
        """
        if estimated_lifetime_months <= 0:
            return 0.0
        
        age_ratio = piece_age_months / estimated_lifetime_months
        
        if age_ratio <= 0.2:  # Très récent
            return 95.0
        elif age_ratio <= 0.4:  # Récent
            return 85.0
        elif age_ratio <= 0.6:  # Moyen
            return 70.0
        elif age_ratio <= 0.8:  # Ancien
            return 50.0
        else:  # Très ancien
            return 30.0
    
    def calculate_supplier_reliability(self, supplier_rating: float, supplier_years: int) -> float:
        """
        Calcule la fiabilité du fournisseur
        """
        # Score de base sur la note
        base_score = (supplier_rating / 5.0) * 80
        
        # Bonus d'expérience
        experience_bonus = min(supplier_years * 2, 20)
        
        return min(base_score + experience_bonus, 100.0)
    
    def calculate_customer_feedback(self, avg_rating: float, num_reviews: int) -> float:
        """
        Calcule le score basé sur les avis clients
        """
        if num_reviews == 0:
            return 50.0  # Score neutre sans avis
        
        # Score de base sur la note moyenne
        base_score = (avg_rating / 5.0) * 100
        
        # Facteur de confiance basé sur le nombre d'avis
        confidence_factor = min(num_reviews / 10, 1.0)
        
        return base_score * confidence_factor + 50.0 * (1 - confidence_factor)
    
    def calculate_physical_condition(self, condition_score: float) -> float:
        """
        Calcule le score de condition physique
        """
        return max(0.0, min(condition_score, 100.0))
    
    def score_rule_based(self, piece_data: Dict) -> Dict:
        """
        Calcule le score en utilisant les règles métier
        """
        try:
            # Extraction des données
            piece_age = piece_data.get('piece_age_months', 0)
            lifetime = piece_data.get('estimated_lifetime_months', 120)
            supplier_rating = piece_data.get('supplier_rating', 3.0)
            supplier_years = piece_data.get('supplier_years_experience', 1)
            avg_rating = piece_data.get('average_customer_rating', 3.0)
            num_reviews = piece_data.get('number_of_reviews', 0)
            condition = piece_data.get('physical_condition_score', 70.0)
            
            # Calcul des facteurs individuels
            age_score = self.calculate_age_factor(piece_age, lifetime)
            supplier_score = self.calculate_supplier_reliability(supplier_rating, supplier_years)
            feedback_score = self.calculate_customer_feedback(avg_rating, num_reviews)
            condition_score = self.calculate_physical_condition(condition)
            
            # Score final pondéré
            final_score = (
                age_score * self.weights['age_factor'] +
                supplier_score * self.weights['supplier_reliability'] +
                feedback_score * self.weights['customer_feedback'] +
                condition_score * self.weights['physical_condition']
            )
            
            # Détermination de la catégorie
            category = self._get_score_category(final_score)
            
            return {
                'final_score': round(final_score, 2),
                'category': category,
                'details': {
                    'age_score': round(age_score, 2),
                    'supplier_score': round(supplier_score, 2),
                    'feedback_score': round(feedback_score, 2),
                    'condition_score': round(condition_score, 2)
                },
                'method': 'rule_based',
                'model_version': self.model_version
            }
            
        except Exception as e:
            logger.error(f"Erreur dans score_rule_based: {e}")
            return {
                'final_score': 50.0,
                'category': 'moyen',
                'details': {},
                'method': 'rule_based',
                'error': str(e)
            }
    
    def score_ml_based(self, piece_data: Dict) -> Dict:
        """
        Calcule le score en utilisant le modèle ML
        """
        try:
            if self.model is None:
                logger.warning("Modèle ML non disponible, utilisation du fallback")
                return self.score_rule_based(piece_data)
            
            # Préparation des features pour le modèle
            features = self._prepare_features(piece_data)
            
            if self.scaler:
                features_scaled = self.scaler.transform([features])
            else:
                features_scaled = [features]
            
            # Prédiction
            prediction = self.model.predict(features_scaled)[0]
            
            # Si le modèle retourne une probabilité, on la convertit en score
            if hasattr(self.model, 'predict_proba'):
                probabilities = self.model.predict_proba(features_scaled)[0]
                # Supposons que les classes sont [0, 1, 2, 3] pour [faible, moyen, bon, excellent]
                score = sum(prob * (i * 25 + 12.5) for i, prob in enumerate(probabilities))
            else:
                # Si c'est une régression directe
                score = float(prediction)
            
            category = self._get_score_category(score)
            
            return {
                'final_score': round(score, 2),
                'category': category,
                'method': 'ml_based',
                'model_version': self.model_version,
                'confidence': round(max(probabilities) if hasattr(self.model, 'predict_proba') else 0.8, 3)
            }
            
        except Exception as e:
            logger.error(f"Erreur dans score_ml_based: {e}")
            # Fallback vers rule-based
            return self.score_rule_based(piece_data)
    
    def _prepare_features(self, piece_data: Dict) -> List[float]:
        """
        Prépare les features pour le modèle ML
        """
        # Features standard attendues par le modèle
        features = [
            piece_data.get('piece_age_months', 0),
            piece_data.get('estimated_lifetime_months', 120),
            piece_data.get('supplier_rating', 3.0),
            piece_data.get('supplier_years_experience', 1),
            piece_data.get('average_customer_rating', 3.0),
            piece_data.get('number_of_reviews', 0),
            piece_data.get('physical_condition_score', 70.0),
            piece_data.get('price', 100.0),
            piece_data.get('category_code', 1),  # Code catégorie
            piece_data.get('brand_reputation_score', 70.0)
        ]
        
        return features
    
    def _get_score_category(self, score: float) -> str:
        """
        Détermine la catégorie basée sur le score
        """
        if score >= self.score_thresholds['excellent']:
            return 'excellent'
        elif score >= self.score_thresholds['bon']:
            return 'bon'
        elif score >= self.score_thresholds['moyen']:
            return 'moyen'
        else:
            return 'faible'
    
    def score_both_methods(self, piece_data: Dict) -> Dict:
        """
        Compare les deux méthodes de scoring
        """
        rule_result = self.score_rule_based(piece_data)
        ml_result = self.score_ml_based(piece_data)
        
        return {
            'rule_based': rule_result,
            'ml_based': ml_result,
            'comparison': {
                'score_difference': abs(rule_result['final_score'] - ml_result['final_score']),
                'category_match': rule_result['category'] == ml_result['category']
            }
        }


class PieceScoringService:
    """
    Service principal pour le scoring de pièces
    Interface avec l'architecture FastAPI de tsa-ai
    """
    
    def __init__(self):
        self.scorer = PieceQualityScorer()
        self.stats = {
            'total_requests': 0,
            'method_usage': {'rule_based': 0, 'ml_based': 0, 'both': 0},
            'avg_response_time': 0.0
        }
    
    async def score_piece(self, request: PieceScoreRequest) -> PieceScoreResponse:
        """
        Score une pièce individuelle
        """
        start_time = datetime.now()
        
        try:
            # Conversion des données de la requête
            piece_data = request.piece_info.dict()
            
            # Scoring selon la méthode demandée
            if request.method == 'rule_based':
                result = self.scorer.score_rule_based(piece_data)
                self.stats['method_usage']['rule_based'] += 1
            elif request.method == 'ml_based':
                result = self.scorer.score_ml_based(piece_data)
                self.stats['method_usage']['ml_based'] += 1
            elif request.method == 'both':
                result = self.scorer.score_both_methods(piece_data)
                self.stats['method_usage']['both'] += 1
            else:
                raise ValueError(f"Méthode non supportée: {request.method}")
            
            # Mise à jour des statistiques
            self.stats['total_requests'] += 1
            response_time = (datetime.now() - start_time).total_seconds()
            self._update_avg_response_time(response_time)
            
            return PieceScoreResponse(
                piece_id=request.piece_info.piece_id,
                score_result=result,
                processing_time_ms=int(response_time * 1000),
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Erreur lors du scoring: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur de scoring: {str(e)}")
    
    async def score_batch(self, request: BatchPieceScoreRequest) -> BatchPieceScoreResponse:
        """
        Score un lot de pièces
        """
        start_time = datetime.now()
        results = []
        
        try:
            for piece_info in request.pieces:
                piece_request = PieceScoreRequest(
                    piece_info=piece_info,
                    method=request.method
                )
                result = await self.score_piece(piece_request)
                results.append(result)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return BatchPieceScoreResponse(
                results=results,
                total_pieces=len(results),
                processing_time_ms=int(processing_time * 1000),
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Erreur lors du scoring batch: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur de scoring batch: {str(e)}")
    
    def _update_avg_response_time(self, new_time: float):
        """
        Met à jour le temps de réponse moyen
        """
        if self.stats['total_requests'] == 1:
            self.stats['avg_response_time'] = new_time
        else:
            self.stats['avg_response_time'] = (
                (self.stats['avg_response_time'] * (self.stats['total_requests'] - 1) + new_time) /
                self.stats['total_requests']
            )
    
    def get_service_stats(self) -> Dict:
        """
        Retourne les statistiques du service
        """
        return {
            **self.stats,
            'model_loaded': self.scorer.model is not None,
            'model_version': self.scorer.model_version,
            'model_path': str(self.scorer.model_path)
        }


# Instance globale du service
piece_scoring_service = PieceScoringService()
