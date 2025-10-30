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
        
        # Facteurs de pondération optimisés
        self.weights = {
            'age_factor': 0.20,              # Âge de la pièce
            'supplier_reliability': 0.25,    # Fiabilité fournisseur
            'customer_feedback': 0.25,       # Avis clients
            'physical_condition': 0.20,      # État physique
            'brand_reputation': 0.10         # Réputation marque
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
        Calcule le facteur d'âge de la pièce avec courbe dégressive
        Score optimal pour pièces neuves/récentes, décroissance progressive
        """
        if estimated_lifetime_months <= 0:
            return 0.0
        
        age_ratio = piece_age_months / estimated_lifetime_months
        
        # Courbe dégressive plus réaliste
        if age_ratio <= 0.1:  # Quasi neuf (0-10% de vie)
            return 100.0
        elif age_ratio <= 0.25:  # Très récent (10-25%)
            return 95.0 - (age_ratio - 0.1) * 33.3  # 95 → 90
        elif age_ratio <= 0.5:  # Récent à moyen (25-50%)
            return 90.0 - (age_ratio - 0.25) * 40  # 90 → 80
        elif age_ratio <= 0.75:  # Moyen à ancien (50-75%)
            return 80.0 - (age_ratio - 0.5) * 60  # 80 → 65
        elif age_ratio <= 0.9:  # Ancien (75-90%)
            return 65.0 - (age_ratio - 0.75) * 100  # 65 → 50
        else:  # Fin de vie (>90%)
            return max(20.0, 50.0 - (age_ratio - 0.9) * 300)  # 50 → 20
    
    def calculate_supplier_reliability(self, supplier_rating: float, supplier_years: int) -> float:
        """
        Calcule la fiabilité du fournisseur avec pondération expérience
        """
        # Score de base sur la note (0-5 → 0-85)
        base_score = (supplier_rating / 5.0) * 85
        
        # Bonus d'expérience progressif (max 15 points)
        if supplier_years >= 10:
            experience_bonus = 15
        elif supplier_years >= 5:
            experience_bonus = 10 + (supplier_years - 5)  # 10-15
        elif supplier_years >= 2:
            experience_bonus = 5 + (supplier_years - 2) * 1.67  # 5-10
        else:
            experience_bonus = supplier_years * 2.5  # 0-5
        
        # Pénalité pour fournisseur très nouveau (<1 an) avec mauvaise note
        if supplier_years < 1 and supplier_rating < 3.5:
            base_score *= 0.8  # -20% de pénalité
        
        return min(base_score + experience_bonus, 100.0)
    
    def calculate_customer_feedback(self, avg_rating: float, num_reviews: int) -> float:
        """
        Calcule le score basé sur les avis clients avec facteur de confiance
        Plus d'avis = plus de confiance dans la note
        """
        if num_reviews == 0:
            return 60.0  # Score neutre-positif sans avis (bénéfice du doute)
        
        # Score de base sur la note moyenne (0-5 → 0-100)
        base_score = (avg_rating / 5.0) * 100
        
        # Facteur de confiance progressif selon nombre d'avis
        if num_reviews >= 50:
            confidence_factor = 1.0  # Confiance totale
        elif num_reviews >= 20:
            confidence_factor = 0.9 + (num_reviews - 20) * 0.0033  # 0.9-1.0
        elif num_reviews >= 10:
            confidence_factor = 0.75 + (num_reviews - 10) * 0.015  # 0.75-0.9
        elif num_reviews >= 5:
            confidence_factor = 0.6 + (num_reviews - 5) * 0.03  # 0.6-0.75
        else:
            confidence_factor = num_reviews * 0.12  # 0.12-0.6
        
        # Score pondéré : plus d'avis = plus de poids à la note réelle
        weighted_score = base_score * confidence_factor + 60.0 * (1 - confidence_factor)
        
        # Bonus pour excellente note avec beaucoup d'avis
        if avg_rating >= 4.5 and num_reviews >= 20:
            weighted_score = min(weighted_score + 5, 100.0)
        
        # Pénalité pour mauvaise note même avec peu d'avis
        if avg_rating < 2.5 and num_reviews >= 3:
            weighted_score *= 0.85  # -15%
        
        return weighted_score
    
    def calculate_physical_condition(self, condition_score: float) -> float:
        """
        Calcule le score de condition physique
        """
        return max(0.0, min(condition_score, 100.0))
    
    def calculate_brand_reputation(self, brand_score: float, price: float, category_code: int) -> float:
        """
        Calcule le score de réputation de marque avec ajustement prix
        """
        # Score de base de la marque (0-100)
        base_score = max(0.0, min(brand_score, 100.0))
        
        # Ajustement selon rapport qualité/prix
        # Prix élevé avec bonne marque = cohérent
        # Prix bas avec mauvaise marque = cohérent aussi
        # Prix élevé avec mauvaise marque = suspect
        
        # Catégories de prix approximatives (à ajuster selon vos données)
        price_categories = {
            1: 100,   # Fournitures bureau - prix moyen
            2: 500,   # Mobilier - prix moyen
            3: 1000,  # Équipements industriels - prix moyen
            4: 300,   # Électronique - prix moyen
            5: 5000   # Véhicules - prix moyen
        }
        
        expected_price = price_categories.get(category_code, 500)
        price_ratio = price / expected_price if expected_price > 0 else 1.0
        
        # Cohérence prix/marque
        if brand_score >= 80:  # Marque premium
            if price_ratio >= 1.2:  # Prix élevé = cohérent
                base_score = min(base_score + 5, 100.0)
            elif price_ratio < 0.6:  # Prix trop bas = suspect
                base_score *= 0.9
        elif brand_score <= 50:  # Marque bas de gamme
            if price_ratio <= 0.8:  # Prix bas = cohérent
                base_score = min(base_score + 3, 100.0)
            elif price_ratio > 1.5:  # Prix élevé = suspect
                base_score *= 0.85
        
        return base_score
    
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
            
            # Extraction données supplémentaires
            price = piece_data.get('price', 100.0)
            category_code = piece_data.get('category_code', 1)
            brand_score = piece_data.get('brand_reputation_score', 70.0)
            
            # Calcul des facteurs individuels
            age_score = self.calculate_age_factor(piece_age, lifetime)
            supplier_score = self.calculate_supplier_reliability(supplier_rating, supplier_years)
            feedback_score = self.calculate_customer_feedback(avg_rating, num_reviews)
            condition_score = self.calculate_physical_condition(condition)
            brand_reputation_score = self.calculate_brand_reputation(brand_score, price, category_code)
            
            # Score final pondéré
            final_score = (
                age_score * self.weights['age_factor'] +
                supplier_score * self.weights['supplier_reliability'] +
                feedback_score * self.weights['customer_feedback'] +
                condition_score * self.weights['physical_condition'] +
                brand_reputation_score * self.weights['brand_reputation']
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
                    'condition_score': round(condition_score, 2),
                    'brand_reputation_score': round(brand_reputation_score, 2)
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
