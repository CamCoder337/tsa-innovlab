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
            logger.warning("Le système utilisera uniquement les règles métier (rule-based)")
            self.model = None  # Force fallback to rule-based
            return False
    
    def get_distance(self, city1: str, city2: str) -> float:
        """Obtenir la distance entre deux villes"""
        return self.distances.get((city1, city2), 400.0)
    
    def _is_rainy_season(self) -> bool:
        """Vérifie si on est en saison des pluies (Juin-Septembre)"""
        current_month = datetime.now().month
        return current_month in [6, 7, 8, 9]
    
    def _is_difficult_route(self, city1: str, city2: str) -> bool:
        """
        Identifie les routes difficiles en saison des pluies
        Routes vers le Nord et l'Est sont plus affectées
        """
        difficult_cities = ['Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua']
        return any(city in difficult_cities for city in [city1, city2])
    
    def _estimate_mission_cost(self, distance_km: float, weight_kg: float, 
                               vehicle_type: str = "Camion") -> float:
        """
        Estime le coût réel d'une mission
        Basé sur les coûts réels au Cameroun (2025)
        """
        # Coûts carburant (FCFA/km) selon type véhicule
        fuel_costs = {
            "Moto": 150,
            "Voiture": 250,
            "Camionnette": 350,
            "Pickup": 400,
            "Camion": 500,
            "Camion 8T": 550,
            "Camion 12T": 600
        }
        fuel_cost_per_km = fuel_costs.get(vehicle_type, 500)
        
        # Coût carburant total
        fuel_cost = distance_km * fuel_cost_per_km
        
        # Coût chauffeur (FCFA/jour)
        driver_cost_per_day = 15000
        estimated_days = max(1, distance_km / 300)  # 300km/jour en moyenne
        driver_cost = estimated_days * driver_cost_per_day
        
        # Coût usure véhicule (FCFA/km)
        wear_cost_per_km = 200
        wear_cost = distance_km * wear_cost_per_km
        
        # Coût cargo (assurance, manutention) - FCFA/kg
        cargo_cost_per_kg = 50
        cargo_cost = weight_kg * cargo_cost_per_kg
        
        # Coûts fixes (péages, parking, etc.)
        fixed_costs = 10000
        
        # Facteur saison des pluies (+20% de coûts)
        seasonal_factor = 1.2 if self._is_rainy_season() else 1.0
        
        total_cost = (fuel_cost + driver_cost + wear_cost + cargo_cost + fixed_costs) * seasonal_factor
        
        return total_cost
    
    def _calculate_optimal_capacity_score(self, weight: float, max_weight: float) -> float:
        """
        Calcule un score basé sur l'utilisation optimale de la capacité
        Favorise 70-90% de remplissage
        """
        capacity_ratio = weight / max_weight
        
        if capacity_ratio < 0.3:
            # Trop peu chargé - perte de rentabilité
            return capacity_ratio * 50  # Max 15 points
        elif 0.3 <= capacity_ratio < 0.7:
            # Acceptable mais pas optimal
            return 15 + (capacity_ratio - 0.3) * 50  # 15-35 points
        elif 0.7 <= capacity_ratio <= 0.9:
            # Zone optimale
            return 35 + (capacity_ratio - 0.7) * 75  # 35-50 points
        elif 0.9 < capacity_ratio <= 1.0:
            # Presque plein - bon mais risqué
            return 50 - (capacity_ratio - 0.9) * 50  # 50-45 points
        else:
            # Surcharge - dangereux
            return 0
    
    def _calculate_merchandise_compatibility(self, merchandise_type: str, 
                                            preferred_types: List[str],
                                            vehicle_type: str) -> float:
        """
        Calcule la compatibilité du type de marchandise
        Prend en compte les préférences ET les contraintes véhicule
        """
        score = 0.0
        
        # Score de préférence
        if merchandise_type in preferred_types:
            score += 25
        elif len(preferred_types) == 0:
            # Pas de préférence = accepte tout
            score += 15
        else:
            # Hors préférence mais possible
            score += 5
        
        # Compatibilité véhicule-marchandise
        vehicle_merchandise_bonus = {
            ("Pharmaceutique", "Camionnette"): 10,
            ("Pharmaceutique", "Voiture"): 10,
            ("Électronique", "Camionnette"): 8,
            ("Électronique", "Voiture"): 8,
            ("Construction", "Camion"): 10,
            ("Construction", "Camion 8T"): 10,
            ("Construction", "Camion 12T"): 10,
            ("Alimentaire", "Camionnette"): 8,
            ("Mobilier", "Camion"): 8,
            ("Agricole", "Pickup"): 8,
            ("Agricole", "Camion"): 8,
        }
        
        bonus = vehicle_merchandise_bonus.get((merchandise_type, vehicle_type), 0)
        score += bonus
        
        return min(score, 35.0)  # Max 35 points
    
    def _get_transporter_history_from_db(self, transporter_id: str) -> Dict:
        """
        Récupère l'historique du transporteur depuis la DB
        """
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            
            # 1. Statistiques globales du transporteur
            global_stats_query = text("""
                SELECT 
                    COUNT(*) as total_missions,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_missions,
                    SUM(CASE WHEN delivered_at <= estimated_delivery_at THEN 1 ELSE 0 END) as on_time_deliveries,
                    AVG(rating) as avg_rating,
                    SUM(CASE WHEN has_damage = true THEN 1 ELSE 0 END) as total_damages
                FROM shipments
                WHERE transporter_id = :transporter_id
                AND status IN ('completed', 'delivered')
            """)
            
            global_result = db.execute(global_stats_query, {'transporter_id': transporter_id}).fetchone()
            
            total_missions = global_result[0] if global_result else 0
            successful_missions = global_result[1] if global_result else 0
            on_time_deliveries = global_result[2] if global_result else 0
            avg_rating = float(global_result[3]) if global_result and global_result[3] else 0.0
            total_damages = global_result[4] if global_result else 0
            
            # 2. Performance par route
            route_performance_query = text("""
                SELECT 
                    CONCAT(origin_city, '-', destination_city) as route_key,
                    COUNT(*) as missions_count,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_count,
                    AVG(rating) as avg_rating,
                    AVG(EXTRACT(EPOCH FROM (delivered_at - pickup_at)) / 
                        EXTRACT(EPOCH FROM (estimated_delivery_at - pickup_at))) as avg_delivery_ratio
                FROM shipments
                WHERE transporter_id = :transporter_id
                AND status IN ('completed', 'delivered')
                GROUP BY origin_city, destination_city
                HAVING COUNT(*) >= 2
            """)
            
            route_results = db.execute(route_performance_query, {'transporter_id': transporter_id}).fetchall()
            
            route_performance = {}
            for row in route_results:
                route_key = row[0]
                route_performance[route_key] = {
                    'count': int(row[1]),
                    'success_rate': float(row[2]) / float(row[1]) if row[1] > 0 else 0.0,
                    'avg_rating': float(row[3]) if row[3] else 0.0,
                    'avg_delivery_ratio': float(row[4]) if row[4] else 1.0
                }
            
            # 3. Performance par type de marchandise
            merchandise_performance_query = text("""
                SELECT 
                    cargo_type,
                    COUNT(*) as missions_count,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_count,
                    AVG(rating) as avg_rating,
                    SUM(CASE WHEN has_damage = true THEN 1 ELSE 0 END) as damage_count
                FROM shipments
                WHERE transporter_id = :transporter_id
                AND status IN ('completed', 'delivered')
                GROUP BY cargo_type
                HAVING COUNT(*) >= 2
            """)
            
            merchandise_results = db.execute(merchandise_performance_query, {'transporter_id': transporter_id}).fetchall()
            
            merchandise_success = {}
            for row in merchandise_results:
                cargo_type = row[0]
                merchandise_success[cargo_type] = {
                    'count': int(row[1]),
                    'success_rate': float(row[2]) / float(row[1]) if row[1] > 0 else 0.0,
                    'avg_rating': float(row[3]) if row[3] else 0.0,
                    'damage_rate': float(row[4]) / float(row[1]) if row[1] > 0 else 0.0
                }
            
            # 4. Performance saisonnière (saison des pluies: Juin-Septembre)
            seasonal_performance_query = text("""
                SELECT 
                    CASE 
                        WHEN EXTRACT(MONTH FROM created_at) IN (6, 7, 8, 9) THEN 'rainy_season'
                        ELSE 'dry_season'
                    END as season,
                    COUNT(*) as missions_count,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_count,
                    AVG(EXTRACT(EPOCH FROM (delivered_at - estimated_delivery_at)) / 86400) as avg_delay_days
                FROM shipments
                WHERE transporter_id = :transporter_id
                AND status IN ('completed', 'delivered')
                GROUP BY season
            """)
            
            seasonal_results = db.execute(seasonal_performance_query, {'transporter_id': transporter_id}).fetchall()
            
            seasonal_performance = {}
            for row in seasonal_results:
                season = row[0]
                seasonal_performance[season] = {
                    'missions_count': int(row[1]),
                    'success_rate': float(row[2]) / float(row[1]) if row[1] > 0 else 0.0,
                    'avg_delay': float(row[3]) if row[3] else 0.0
                }
            
            db.close()
            
            # Calculer les métriques dérivées
            success_rate = successful_missions / total_missions if total_missions > 0 else 0.0
            on_time_rate = on_time_deliveries / total_missions if total_missions > 0 else 0.0
            damage_rate = total_damages / total_missions if total_missions > 0 else 0.0
            
            return {
                'completed_missions': total_missions,
                'success_rate': success_rate,
                'route_performance': route_performance,
                'merchandise_success': merchandise_success,
                'avg_delivery_time_ratio': 1.0,  # Calculé dans route_performance
                'avg_rating': avg_rating,
                'on_time_delivery_rate': on_time_rate,
                'damage_rate': damage_rate,
                'seasonal_performance': seasonal_performance
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de l'historique: {e}")
            # Fallback: retourner historique vide
            return {
                'completed_missions': 0,
                'success_rate': 0.0,
                'route_performance': {},
                'merchandise_success': {},
                'avg_delivery_time_ratio': 1.0,
                'avg_rating': 0.0,
                'on_time_delivery_rate': 0.0,
                'damage_rate': 0.0,
                'seasonal_performance': {}
            }
    
    def _calculate_route_familiarity_score(self, transporter_profile: Dict, mission: Dict, 
                                          history: Dict) -> float:
        """
        Score basé sur l'historique des routes empruntées
        Plus le transporteur a fait cette route, meilleur le score
        """
        route_key = f"{mission['depart_city']}-{mission['arrival_city']}"
        reverse_route = f"{mission['arrival_city']}-{mission['depart_city']}"
        
        route_performance = history.get('route_performance', {})
        
        # Score de base selon villes connues
        known_cities = transporter_profile.get('known_cities', [])
        base_score = 0
        
        if mission['depart_city'] in known_cities and mission['arrival_city'] in known_cities:
            base_score = 15  # Connaît les deux villes
        elif mission['depart_city'] in known_cities or mission['arrival_city'] in known_cities:
            base_score = 8   # Connaît une ville
        else:
            base_score = 3   # Nouvelle route
        
        # Bonus historique de performance sur cette route
        if route_key in route_performance:
            perf = route_performance[route_key]
            missions_count = perf.get('count', 0)
            success_rate = perf.get('success_rate', 0)
            avg_rating = perf.get('avg_rating', 0)
            
            # Bonus selon nombre de missions réussies
            if missions_count >= 10:
                base_score += 15  # Expert de cette route
            elif missions_count >= 5:
                base_score += 10  # Habitué
            elif missions_count >= 2:
                base_score += 5   # Quelques expériences
            
            # Bonus selon taux de succès
            if success_rate >= 0.95:
                base_score += 10  # Excellent historique
            elif success_rate >= 0.85:
                base_score += 5   # Bon historique
            
            # Bonus selon notes clients
            if avg_rating >= 4.5:
                base_score += 5
            elif avg_rating >= 4.0:
                base_score += 3
        
        # Bonus si a fait la route inverse
        elif reverse_route in route_performance:
            base_score += 5  # Connaît la route dans l'autre sens
        
        return min(base_score, 40.0)  # Max 40 points
    
    def _calculate_reputation_impact(self, transporter_profile: Dict, history: Dict) -> float:
        """
        Impact de la réputation et historique de performance
        """
        reputation_score = transporter_profile.get('reputation_score', 70.0)
        
        # Score de base selon réputation
        if reputation_score >= 90:
            base_score = 20
        elif reputation_score >= 80:
            base_score = 15
        elif reputation_score >= 70:
            base_score = 10
        elif reputation_score >= 60:
            base_score = 5
        else:
            base_score = 0
            # Pénalité pour mauvaise réputation
            if reputation_score < 50:
                base_score = -10
        
        # Bonus selon historique
        completed_missions = history.get('completed_missions', 0)
        success_rate = history.get('success_rate', 0.0)
        on_time_rate = history.get('on_time_delivery_rate', 0.0)
        damage_rate = history.get('damage_rate', 0.0)
        
        # Bonus expérience
        if completed_missions >= 100:
            base_score += 10  # Très expérimenté
        elif completed_missions >= 50:
            base_score += 7
        elif completed_missions >= 20:
            base_score += 5
        elif completed_missions >= 10:
            base_score += 3
        
        # Bonus taux de succès
        if success_rate >= 0.95:
            base_score += 8
        elif success_rate >= 0.90:
            base_score += 5
        elif success_rate >= 0.85:
            base_score += 3
        elif success_rate < 0.70:
            base_score -= 5  # Pénalité
        
        # Bonus livraison à temps
        if on_time_rate >= 0.90:
            base_score += 7
        elif on_time_rate >= 0.80:
            base_score += 4
        elif on_time_rate < 0.60:
            base_score -= 5  # Pénalité
        
        # Pénalité taux de dommages
        if damage_rate > 0.05:  # >5% de dommages
            base_score -= 10
        elif damage_rate > 0.02:  # >2% de dommages
            base_score -= 5
        
        return base_score
    
    def _calculate_merchandise_expertise(self, transporter_profile: Dict, mission: Dict, 
                                        history: Dict) -> float:
        """
        Score basé sur l'expertise avec ce type de marchandise
        """
        merchandise_type = mission['merchandise_type']
        preferred_types = transporter_profile.get('preferred_merchandise_types', [])
        vehicle_type = transporter_profile.get('vehicle_type', 'Camion')
        
        score = 0.0
        
        # Score de préférence déclarée
        if merchandise_type in preferred_types:
            score += 15
        elif len(preferred_types) == 0:
            score += 8  # Pas de préférence = accepte tout
        else:
            score += 3  # Hors préférence
        
        # Score basé sur historique réel avec ce type
        merchandise_success = history.get('merchandise_success', {})
        if merchandise_type in merchandise_success:
            perf = merchandise_success[merchandise_type]
            missions_count = perf.get('count', 0)
            success_rate = perf.get('success_rate', 0)
            avg_rating = perf.get('avg_rating', 0)
            
            # Bonus expertise
            if missions_count >= 20:
                score += 15  # Expert
            elif missions_count >= 10:
                score += 10  # Expérimenté
            elif missions_count >= 5:
                score += 5   # Quelques expériences
            
            # Bonus performance
            if success_rate >= 0.95 and avg_rating >= 4.5:
                score += 10  # Excellence prouvée
            elif success_rate >= 0.90 and avg_rating >= 4.0:
                score += 5
        
        # Compatibilité véhicule-marchandise
        vehicle_merchandise_bonus = {
            ("Pharmaceutique", "Camionnette"): 8,
            ("Pharmaceutique", "Voiture"): 8,
            ("Électronique", "Camionnette"): 7,
            ("Électronique", "Voiture"): 7,
            ("Construction", "Camion"): 8,
            ("Construction", "Camion 8T"): 8,
            ("Construction", "Camion 12T"): 8,
            ("Alimentaire", "Camionnette"): 7,
            ("Alimentaire", "Camion"): 6,
            ("Mobilier", "Camion"): 7,
            ("Mobilier", "Camion 8T"): 7,
            ("Agricole", "Pickup"): 7,
            ("Agricole", "Camion"): 7,
            ("Textile", "Camionnette"): 6,
            ("Textile", "Camion"): 5,
        }
        
        bonus = vehicle_merchandise_bonus.get((merchandise_type, vehicle_type), 0)
        score += bonus
        
        return min(score, 50.0)  # Max 50 points
    
    def _calculate_timing_compatibility(self, transporter_profile: Dict, mission: Dict,
                                       history: Dict) -> float:
        """
        Score basé sur les habitudes temporelles du transporteur
        """
        score = 0.0
        
        delay_days = mission.get('delay_days', 7)
        urgency_level = mission.get('urgency_level', 2)
        
        # Estimation temps nécessaire
        distance = self.get_distance(mission['depart_city'], mission['arrival_city'])
        estimated_days = max(1, distance / 300)
        
        # Score selon délai
        if delay_days >= estimated_days * 1.5:
            score += 10  # Délai confortable
        elif delay_days >= estimated_days * 1.2:
            score += 7   # Délai correct
        elif delay_days >= estimated_days:
            score += 4   # Délai juste
        else:
            score -= 5   # Délai trop court - risqué
        
        # Bonus selon historique de livraison à temps
        on_time_rate = history.get('on_time_delivery_rate', 0.0)
        avg_delivery_ratio = history.get('avg_delivery_time_ratio', 1.0)
        
        if on_time_rate >= 0.90:
            # Transporteur fiable, peut gérer urgence
            if urgency_level >= 4:
                score += 8  # Bonus urgence
        elif on_time_rate < 0.70:
            # Transporteur souvent en retard
            if urgency_level >= 4:
                score -= 10  # Pénalité - mission urgente risquée
        
        # Bonus si historiquement rapide
        if avg_delivery_ratio <= 0.9:  # Livre 10% plus vite que prévu
            score += 5
        elif avg_delivery_ratio <= 0.95:
            score += 3
        
        return score
    
    def _calculate_seasonal_adjustment(self, transporter_profile: Dict, mission: Dict,
                                      history: Dict) -> float:
        """
        Ajustement selon performance saisonnière
        """
        adjustment = 0.0
        
        is_rainy = self._is_rainy_season()
        is_difficult = self._is_difficult_route(mission['depart_city'], mission['arrival_city'])
        
        if is_rainy and is_difficult:
            # Route difficile en saison des pluies
            seasonal_perf = history.get('seasonal_performance', {})
            rainy_perf = seasonal_perf.get('rainy_season', {})
            
            if rainy_perf:
                success_rate = rainy_perf.get('success_rate', 0)
                if success_rate >= 0.90:
                    adjustment += 10  # Bon en saison difficile
                elif success_rate >= 0.80:
                    adjustment += 5
                elif success_rate < 0.70:
                    adjustment -= 10  # Mauvais en saison difficile
            else:
                # Pas d'historique en saison des pluies
                adjustment -= 5  # Prudence
        
        return adjustment

    def calculate_affinity_score(self, transporter_profile: Dict, mission: Dict) -> float:
        """
        Calcule le score d'affinité entre un transporteur et une mission
        VERSION AVANCÉE avec historique et personnalisation
        """
        try:
            score = 0.0
            details = {}  # Pour debugging
            
            # Récupérer historique du transporteur
            transporter_id = transporter_profile.get('transporter_id')
            history = self._get_transporter_history_from_db(transporter_id)
            
            # 1. RENTABILITÉ RÉELLE (25 points max) - Toujours important
            distance = self.get_distance(mission['depart_city'], mission['arrival_city'])
            weight = mission['weight']
            vehicle_type = transporter_profile.get('vehicle_type', 'Camion')
            
            estimated_cost = self._estimate_mission_cost(distance, weight, vehicle_type)
            budget = mission['budget']
            profit = budget - estimated_cost
            profit_margin = (profit / budget) * 100 if budget > 0 else -100
            
            if profit_margin >= 30:  # Marge >= 30%
                rentability_score = 25
            elif profit_margin >= 20:  # Marge >= 20%
                rentability_score = 22
            elif profit_margin >= 15:  # Marge >= 15%
                rentability_score = 18
            elif profit_margin >= 10:  # Marge >= 10%
                rentability_score = 15
            elif profit_margin >= 5:  # Marge >= 5%
                rentability_score = 10
            elif profit_margin > 0:  # Marge positive mais faible
                rentability_score = 5
            else:  # Mission non rentable
                rentability_score = 0
                # Pénalité pour mission à perte
                score -= 15
            
            score += rentability_score
            details['rentability'] = {
                'cost': estimated_cost,
                'budget': budget,
                'profit': profit,
                'margin': profit_margin,
                'score': rentability_score
            }
            
            # 2. HISTORIQUE ET FAMILIARITÉ ROUTE (40 points max) - NOUVEAU !
            route_familiarity_score = self._calculate_route_familiarity_score(
                transporter_profile, mission, history
            )
            score += route_familiarity_score
            details['route_familiarity'] = {
                'score': route_familiarity_score,
                'history': history.get('route_performance', {})
            }
            
            # 3. RÉPUTATION ET PERFORMANCE (20 points max) - NOUVEAU !
            reputation_score = self._calculate_reputation_impact(transporter_profile, history)
            score += reputation_score
            details['reputation'] = {
                'score': reputation_score,
                'reputation': transporter_profile.get('reputation_score'),
                'completed_missions': history.get('completed_missions'),
                'success_rate': history.get('success_rate')
            }
            
            # 4. DISTANCE ET FAISABILITÉ (15 points max)
            max_distance = transporter_profile.get('max_distance', 1000)
            
            if distance > max_distance:
                # Mission impossible
                return 0.0
            
            # Facteur saison des pluies
            if self._is_rainy_season() and self._is_difficult_route(
                mission['depart_city'], mission['arrival_city']
            ):
                distance_effective = distance * 1.3  # +30% de difficulté
            else:
                distance_effective = distance
            
            # Score distance (favorise distances moyennes)
            distance_ratio = distance_effective / max_distance
            if distance_ratio < 0.3:
                # Trop court - perte de temps
                distance_score = distance_ratio * 30  # Max 9 points
            elif 0.3 <= distance_ratio <= 0.8:
                # Distance optimale
                distance_score = 9 + (distance_ratio - 0.3) * 12  # 9-15 points
            else:
                # Trop long - risqué
                distance_score = 15 - (distance_ratio - 0.8) * 25  # 15-10 points
            
            score += distance_score
            details['distance'] = {
                'distance_km': distance,
                'max_distance': max_distance,
                'is_rainy_season': self._is_rainy_season(),
                'score': distance_score
            }
            
            # 5. EXPERTISE MARCHANDISE (50 points max) - NOUVEAU avec historique !
            merchandise_expertise_score = self._calculate_merchandise_expertise(
                transporter_profile, mission, history
            )
            score += merchandise_expertise_score
            details['merchandise_expertise'] = {
                'score': merchandise_expertise_score,
                'type': mission['merchandise_type'],
                'history': history.get('merchandise_success', {})
            }
            
            # 6. OPTIMISATION CAPACITÉ (10 points max)
            max_weight = transporter_profile.get('max_weight', 10000)
            
            if weight > max_weight:
                # Surcharge impossible
                return 0.0
            
            capacity_score = self._calculate_optimal_capacity_score(weight, max_weight)
            score += capacity_score * 0.2  # Normaliser à 10 points max
            details['capacity'] = {
                'weight': weight,
                'max_weight': max_weight,
                'ratio': weight / max_weight,
                'score': capacity_score * 0.2
            }
            
            # 7. TIMING ET HABITUDES (10 points max) - NOUVEAU !
            timing_score = self._calculate_timing_compatibility(
                transporter_profile, mission, history
            )
            score += timing_score
            details['timing'] = {
                'score': timing_score,
                'on_time_rate': history.get('on_time_delivery_rate')
            }
            
            # 8. AJUSTEMENT SAISONNIER (±10 points) - NOUVEAU !
            seasonal_adjustment = self._calculate_seasonal_adjustment(
                transporter_profile, mission, history
            )
            score += seasonal_adjustment
            details['seasonal'] = {
                'adjustment': seasonal_adjustment,
                'is_rainy_season': self._is_rainy_season()
            }
            
            # Score final (0-100)
            final_score = max(0, min(score, 100.0))
            
            # Log pour analyse
            logger.debug(f"Affinity score: {final_score:.2f} - Details: {details}")
            
            return final_score
            
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
        VERSION AMÉLIORÉE avec raisons détaillées et pertinentes
        """
        reasons = []
        
        # Calcul rentabilité pour raisons
        distance = self.get_distance(mission['depart_city'], mission['arrival_city'])
        weight = mission['weight']
        vehicle_type = transporter_profile.get('vehicle_type', 'Camion')
        estimated_cost = self._estimate_mission_cost(distance, weight, vehicle_type)
        budget = mission['budget']
        profit = budget - estimated_cost
        profit_margin = (profit / budget) * 100 if budget > 0 else -100
        
        # 1. Raison principale selon score
        if score >= 85:
            reasons.append(f"🌟 Excellente opportunité (score {score:.0f}/100)")
        elif score >= 70:
            reasons.append(f"✅ Très bonne compatibilité (score {score:.0f}/100)")
        elif score >= 55:
            reasons.append(f"👍 Bonne opportunité (score {score:.0f}/100)")
        elif score >= 40:
            reasons.append(f"⚠️ Opportunité acceptable (score {score:.0f}/100)")
        else:
            reasons.append(f"❌ Compatibilité limitée (score {score:.0f}/100)")
        
        # 2. Rentabilité
        if profit_margin >= 25:
            reasons.append(f"💰 Très rentable (marge {profit_margin:.0f}%, profit {profit:,.0f} FCFA)")
        elif profit_margin >= 15:
            reasons.append(f"💵 Rentable (marge {profit_margin:.0f}%, profit {profit:,.0f} FCFA)")
        elif profit_margin >= 5:
            reasons.append(f"💸 Rentabilité correcte (marge {profit_margin:.0f}%)")
        elif profit_margin > 0:
            reasons.append(f"⚠️ Faible marge ({profit_margin:.0f}%)")
        else:
            reasons.append(f"❌ Mission non rentable (perte {abs(profit):,.0f} FCFA)")
        
        # 3. Distance et faisabilité
        max_distance = transporter_profile.get('max_distance', 1000)
        distance_ratio = distance / max_distance
        
        if distance_ratio <= 0.5:
            reasons.append(f"🚗 Distance courte ({distance:.0f}km, {distance/300:.1f} jours)")
        elif distance_ratio <= 0.8:
            reasons.append(f"🛣️ Distance optimale ({distance:.0f}km)")
        else:
            reasons.append(f"⚠️ Longue distance ({distance:.0f}km, {distance/300:.1f} jours)")
        
        # 4. Capacité
        max_weight = transporter_profile.get('max_weight', 10000)
        capacity_ratio = weight / max_weight
        
        if 0.7 <= capacity_ratio <= 0.9:
            reasons.append(f"📦 Capacité optimale ({capacity_ratio*100:.0f}% de remplissage)")
        elif capacity_ratio < 0.5:
            reasons.append(f"⚠️ Sous-utilisé ({capacity_ratio*100:.0f}% de remplissage)")
        elif capacity_ratio > 0.9:
            reasons.append(f"⚠️ Presque plein ({capacity_ratio*100:.0f}% de remplissage)")
        
        # 5. Spécialisation
        preferred_types = transporter_profile.get('preferred_merchandise_types', [])
        if mission['merchandise_type'] in preferred_types:
            reasons.append(f"⭐ Votre spécialité : {mission['merchandise_type']}")
        
        # 6. Expérience route
        known_cities = transporter_profile.get('known_cities', [])
        if mission['depart_city'] in known_cities and mission['arrival_city'] in known_cities:
            reasons.append(f"🗺️ Route connue : {mission['depart_city']} → {mission['arrival_city']}")
        elif mission['depart_city'] in known_cities or mission['arrival_city'] in known_cities:
            reasons.append(f"📍 Ville connue dans le trajet")
        
        # 7. Urgence
        urgency_level = mission.get('urgency_level', 2)
        if urgency_level >= 4:
            reasons.append(f"🚨 Mission urgente (niveau {urgency_level}/5)")
        
        # 8. Saison
        if self._is_rainy_season() and self._is_difficult_route(mission['depart_city'], mission['arrival_city']):
            reasons.append(f"⚠️ Route difficile en saison des pluies")
        
        # Limiter à 5 raisons les plus pertinentes
        return reasons[:5]
    
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
