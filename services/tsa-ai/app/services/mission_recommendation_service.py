"""
Mission Recommendation Service
Handles ML-based mission recommendations for transporters in TSA InnovLab
Adapted from prevision_algo module to fit tsa-ai architecture
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
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics import mean_squared_error, r2_score

from app.core.config import settings
from app.schemas.mission_recommendations import (
    MissionRecommendationRequest,
    MissionRecommendationResponse,
    BatchMissionRecommendationRequest,
    BatchMissionRecommendationResponse,
    MissionInfo,
    TransporterProfile,
    RecommendationResult
)

logger = logging.getLogger(__name__)


class MissionRecommenderModel:
    """
    Système de recommandation de missions pour transporteurs
    Intégré dans l'architecture tsa-ai
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = None
        self.model_version = "1.0.0"
        self.model_path = Path(settings.models_path) / "mission_recommender_model.pkl"
        
        # Configuration des villes camerounaises
        self.cities = [
            'Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Maroua',
            'Bamenda', 'Ngaoundéré', 'Bertoua', 'Buea', 'Kumba',
            'Kribi', 'Limbe', 'Ebolowa', 'Dschang', 'Foumban'
        ]
        
        # Types de marchandises
        self.merchandise_types = [
            'Électronique', 'Alimentaire', 'Textile', 'Construction',
            'Pharmaceutique', 'Mobilier', 'Automobile', 'Agricole'
        ]
        
        # Matrice de distances approximatives (en km)
        self.distances = self._create_distance_matrix()
        
        # Chargement automatique du modèle
        self._load_model()
    
    def _create_distance_matrix(self) -> Dict[Tuple[str, str], float]:
        """Créer une matrice de distances entre villes camerounaises"""
        base_distances = {
            ('Yaoundé', 'Douala'): 250,
            ('Yaoundé', 'Bafoussam'): 280,
            ('Yaoundé', 'Garoua'): 690,
            ('Yaoundé', 'Maroua'): 850,
            ('Yaoundé', 'Bamenda'): 370,
            ('Yaoundé', 'Ngaoundéré'): 480,
            ('Yaoundé', 'Bertoua'): 320,
            ('Yaoundé', 'Buea'): 290,
            ('Yaoundé', 'Kumba'): 310,
            ('Yaoundé', 'Kribi'): 200,
            ('Yaoundé', 'Limbe'): 300,
            ('Yaoundé', 'Ebolowa'): 180,
            ('Yaoundé', 'Dschang'): 300,
            ('Yaoundé', 'Foumban'): 250,
            ('Douala', 'Bafoussam'): 230,
            ('Douala', 'Garoua'): 640,
            ('Douala', 'Maroua'): 800,
            ('Douala', 'Bamenda'): 320,
            ('Douala', 'Ngaoundéré'): 430,
            ('Douala', 'Bertoua'): 470,
            ('Douala', 'Buea'): 70,
            ('Douala', 'Kumba'): 90,
            ('Douala', 'Kribi'): 150,
            ('Douala', 'Limbe'): 80,
            ('Douala', 'Ebolowa'): 280,
            ('Douala', 'Dschang'): 250,
            ('Douala', 'Foumban'): 200
        }
        
        # Créer la matrice symétrique complète
        distances = {}
        for city1 in self.cities:
            for city2 in self.cities:
                if city1 == city2:
                    distances[(city1, city2)] = 0
                elif (city1, city2) in base_distances:
                    distances[(city1, city2)] = base_distances[(city1, city2)]
                elif (city2, city1) in base_distances:
                    distances[(city1, city2)] = base_distances[(city2, city1)]
                else:
                    # Distance approximative basée sur la moyenne
                    distances[(city1, city2)] = 400
        
        return distances
    
    def _load_model(self) -> bool:
        """
        Charge le modèle ML depuis le fichier pkl
        """
        try:
            if self.model_path.exists():
                model_data = joblib.load(self.model_path)
                
                if isinstance(model_data, dict):
                    self.model = model_data.get('model')
                    self.scaler = model_data.get('scaler', StandardScaler())
                    self.label_encoders = model_data.get('label_encoders', {})
                    self.feature_names = model_data.get('feature_names')
                else:
                    # Ancien format - juste le modèle
                    self.model = model_data
                
                logger.info(f"Modèle de recommandations chargé depuis {self.model_path}")
                return True
            else:
                logger.warning(f"Fichier modèle non trouvé: {self.model_path}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle: {e}")
            return False
    
    def get_distance(self, city1: str, city2: str) -> float:
        """Obtenir la distance entre deux villes"""
        return self.distances.get((city1, city2), 400.0)
    
    def calculate_affinity_score(self, transporter_profile: Dict, mission: Dict) -> float:
        """
        Calcule le score d'affinité entre un transporteur et une mission
        """
        try:
            score = 0.0
            
            # Facteur distance (plus c'est proche, mieux c'est)
            distance = self.get_distance(mission['depart_city'], mission['arrival_city'])
            max_distance = transporter_profile.get('max_distance', 1000)
            if distance <= max_distance:
                distance_score = max(0, (max_distance - distance) / max_distance * 30)
                score += distance_score
            
            # Facteur poids (capacité du transporteur)
            weight = mission['weight']
            max_weight = transporter_profile.get('max_weight', 10000)
            if weight <= max_weight:
                weight_score = min(weight / max_weight * 25, 25)
                score += weight_score
            
            # Facteur type de marchandise (spécialisation)
            preferred_types = transporter_profile.get('preferred_merchandise_types', [])
            if mission['merchandise_type'] in preferred_types:
                score += 20
            
            # Facteur budget (rentabilité)
            budget = mission['budget']
            min_budget = transporter_profile.get('min_budget', 10000)
            if budget >= min_budget:
                budget_score = min((budget - min_budget) / min_budget * 15, 15)
                score += budget_score
            
            # Facteur délai
            delay = mission['delay_days']
            preferred_delay = transporter_profile.get('preferred_delay_days', 7)
            if delay >= preferred_delay:
                delay_score = min(10, 10 * (delay / preferred_delay))
                score += delay_score
            
            # Facteur expérience (villes connues)
            known_cities = transporter_profile.get('known_cities', [])
            if (mission['depart_city'] in known_cities or 
                mission['arrival_city'] in known_cities):
                score += 10
            
            return min(score, 100.0)
            
        except Exception as e:
            logger.error(f"Erreur dans calculate_affinity_score: {e}")
            return 50.0  # Score neutre en cas d'erreur
    
    def recommend_missions_rule_based(self, transporter_profile: Dict, available_missions: List[Dict]) -> List[Dict]:
        """
        Recommandations basées sur des règles métier
        """
        try:
            recommendations = []
            
            for mission in available_missions:
                # Vérifications de base
                if (mission['weight'] <= transporter_profile.get('max_weight', 10000) and
                    mission['budget'] >= transporter_profile.get('min_budget', 10000)):
                    
                    affinity_score = self.calculate_affinity_score(transporter_profile, mission)
                    
                    recommendation = {
                        'mission_id': mission.get('mission_id', f"MISSION_{len(recommendations)+1}"),
                        'affinity_score': affinity_score,
                        'confidence': 0.8,  # Confiance fixe pour rule-based
                        'method': 'rule_based',
                        'mission_details': mission,
                        'reasons': self._get_recommendation_reasons(transporter_profile, mission, affinity_score)
                    }
                    
                    recommendations.append(recommendation)
            
            # Trier par score d'affinité décroissant
            recommendations.sort(key=lambda x: x['affinity_score'], reverse=True)
            
            return recommendations[:10]  # Top 10 recommandations
            
        except Exception as e:
            logger.error(f"Erreur dans recommend_missions_rule_based: {e}")
            return []
    
    def recommend_missions_ml_based(self, transporter_profile: Dict, available_missions: List[Dict]) -> List[Dict]:
        """
        Recommandations basées sur le modèle ML
        """
        try:
            if self.model is None:
                logger.warning("Modèle ML non disponible, utilisation du fallback")
                return self.recommend_missions_rule_based(transporter_profile, available_missions)
            
            recommendations = []
            
            for mission in available_missions:
                # Préparer les features pour le modèle
                features = self._prepare_features(transporter_profile, mission)
                
                if self.scaler and hasattr(self.scaler, 'transform'):
                    features_scaled = self.scaler.transform([features])
                else:
                    features_scaled = [features]
                
                # Prédiction du score d'affinité
                predicted_score = self.model.predict(features_scaled)[0]
                
                # Calculer la confiance (si le modèle le supporte)
                confidence = 0.85  # Valeur par défaut
                if hasattr(self.model, 'predict_proba'):
                    try:
                        probabilities = self.model.predict_proba(features_scaled)[0]
                        confidence = max(probabilities)
                    except:
                        pass
                
                recommendation = {
                    'mission_id': mission.get('mission_id', f"MISSION_{len(recommendations)+1}"),
                    'affinity_score': max(0, min(predicted_score, 100)),  # Borner entre 0 et 100
                    'confidence': confidence,
                    'method': 'ml_based',
                    'mission_details': mission,
                    'reasons': self._get_recommendation_reasons(transporter_profile, mission, predicted_score)
                }
                
                recommendations.append(recommendation)
            
            # Trier par score d'affinité décroissant
            recommendations.sort(key=lambda x: x['affinity_score'], reverse=True)
            
            return recommendations[:10]  # Top 10 recommandations
            
        except Exception as e:
            logger.error(f"Erreur dans recommend_missions_ml_based: {e}")
            # Fallback vers rule-based
            return self.recommend_missions_rule_based(transporter_profile, available_missions)
    
    def _prepare_features(self, transporter_profile: Dict, mission: Dict) -> List[float]:
        """
        Prépare les features pour le modèle ML
        """
        features = [
            mission.get('weight', 0),
            mission.get('budget', 0),
            mission.get('delay_days', 1),
            self.get_distance(mission.get('depart_city', ''), mission.get('arrival_city', '')),
            transporter_profile.get('max_weight', 10000),
            transporter_profile.get('max_distance', 1000),
            transporter_profile.get('min_budget', 10000),
            transporter_profile.get('experience_years', 1),
            len(transporter_profile.get('known_cities', [])),
            len(transporter_profile.get('preferred_merchandise_types', [])),
            # Encodage du type de marchandise
            self._encode_merchandise_type(mission.get('merchandise_type', 'Général')),
            # Score de réputation du transporteur
            transporter_profile.get('reputation_score', 70.0)
        ]
        
        return features
    
    def _encode_merchandise_type(self, merchandise_type: str) -> float:
        """Encode le type de marchandise en valeur numérique"""
        if merchandise_type in self.merchandise_types:
            return float(self.merchandise_types.index(merchandise_type))
        return 0.0
    
    def _get_recommendation_reasons(self, transporter_profile: Dict, mission: Dict, score: float) -> List[str]:
        """
        Génère les raisons de la recommandation
        """
        reasons = []
        
        # Analyse du score
        if score >= 80:
            reasons.append("Excellente compatibilité avec votre profil")
        elif score >= 60:
            reasons.append("Bonne compatibilité avec vos préférences")
        elif score >= 40:
            reasons.append("Compatibilité acceptable")
        else:
            reasons.append("Compatibilité limitée")
        
        # Analyse des critères spécifiques
        if mission['weight'] <= transporter_profile.get('max_weight', 10000) * 0.8:
            reasons.append("Poids dans votre capacité optimale")
        
        if mission['budget'] >= transporter_profile.get('min_budget', 10000) * 1.5:
            reasons.append("Budget attractif")
        
        distance = self.get_distance(mission['depart_city'], mission['arrival_city'])
        if distance <= transporter_profile.get('max_distance', 1000) * 0.7:
            reasons.append("Distance courte et rentable")
        
        preferred_types = transporter_profile.get('preferred_merchandise_types', [])
        if mission['merchandise_type'] in preferred_types:
            reasons.append("Type de marchandise dans votre spécialité")
        
        known_cities = transporter_profile.get('known_cities', [])
        if mission['depart_city'] in known_cities or mission['arrival_city'] in known_cities:
            reasons.append("Trajet sur vos routes habituelles")
        
        return reasons[:3]  # Limiter à 3 raisons principales
    
    def recommend_missions_both_methods(self, transporter_profile: Dict, available_missions: List[Dict]) -> Dict:
        """
        Compare les deux méthodes de recommandation
        """
        rule_result = self.recommend_missions_rule_based(transporter_profile, available_missions)
        ml_result = self.recommend_missions_ml_based(transporter_profile, available_missions)
        
        return {
            'rule_based': rule_result,
            'ml_based': ml_result,
            'comparison': {
                'rule_based_count': len(rule_result),
                'ml_based_count': len(ml_result),
                'avg_score_difference': self._calculate_avg_score_difference(rule_result, ml_result)
            }
        }
    
    def _calculate_avg_score_difference(self, rule_result: List[Dict], ml_result: List[Dict]) -> float:
        """Calcule la différence moyenne des scores entre les deux méthodes"""
        try:
            if not rule_result or not ml_result:
                return 0.0
            
            rule_scores = [r['affinity_score'] for r in rule_result[:5]]
            ml_scores = [r['affinity_score'] for r in ml_result[:5]]
            
            if len(rule_scores) == len(ml_scores):
                differences = [abs(r - m) for r, m in zip(rule_scores, ml_scores)]
                return sum(differences) / len(differences)
            
            return 0.0
        except:
            return 0.0


class MissionRecommendationService:
    """
    Service principal pour les recommandations de missions
    Interface avec l'architecture FastAPI de tsa-ai
    """
    
    def __init__(self):
        self.recommender = MissionRecommenderModel()
        self.stats = {
            'total_requests': 0,
            'method_usage': {'rule_based': 0, 'ml_based': 0, 'both': 0},
            'avg_response_time': 0.0
        }
    
    async def recommend_missions(self, request: MissionRecommendationRequest) -> MissionRecommendationResponse:
        """
        Recommande des missions pour un transporteur
        """
        start_time = datetime.now()
        
        try:
            # Conversion des données de la requête
            transporter_data = request.transporter_profile.dict()
            missions_data = [mission.dict() for mission in request.available_missions]
            
            # Recommandations selon la méthode demandée
            if request.method == 'rule_based':
                result = self.recommender.recommend_missions_rule_based(transporter_data, missions_data)
                self.stats['method_usage']['rule_based'] += 1
            elif request.method == 'ml_based':
                result = self.recommender.recommend_missions_ml_based(transporter_data, missions_data)
                self.stats['method_usage']['ml_based'] += 1
            elif request.method == 'both':
                result = self.recommender.recommend_missions_both_methods(transporter_data, missions_data)
                self.stats['method_usage']['both'] += 1
            else:
                raise ValueError(f"Méthode non supportée: {request.method}")
            
            # Mise à jour des statistiques
            self.stats['total_requests'] += 1
            response_time = (datetime.now() - start_time).total_seconds()
            self._update_avg_response_time(response_time)
            
            return MissionRecommendationResponse(
                transporter_id=request.transporter_profile.transporter_id,
                recommendations=result,
                processing_time_ms=int(response_time * 1000),
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Erreur lors des recommandations: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur de recommandation: {str(e)}")
    
    async def recommend_batch(self, request: BatchMissionRecommendationRequest) -> BatchMissionRecommendationResponse:
        """
        Recommande des missions pour plusieurs transporteurs
        """
        start_time = datetime.now()
        results = []
        
        try:
            for transporter_profile in request.transporters:
                transporter_request = MissionRecommendationRequest(
                    transporter_profile=transporter_profile,
                    available_missions=request.available_missions,
                    method=request.method
                )
                result = await self.recommend_missions(transporter_request)
                results.append(result)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return BatchMissionRecommendationResponse(
                results=results,
                total_transporters=len(results),
                processing_time_ms=int(processing_time * 1000),
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Erreur lors des recommandations batch: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur de recommandation batch: {str(e)}")
    
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
            'model_loaded': self.recommender.model is not None,
            'model_version': self.recommender.model_version,
            'model_path': str(self.recommender.model_path),
            'supported_cities': len(self.recommender.cities),
            'supported_merchandise_types': len(self.recommender.merchandise_types)
        }


# Instance globale du service
mission_recommendation_service = MissionRecommendationService()
