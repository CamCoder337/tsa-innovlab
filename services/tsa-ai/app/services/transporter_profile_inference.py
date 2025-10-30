"""
Transporter Profile Inference Service
Infère le profil d'un transporteur depuis son historique de missions
"""
import logging
from typing import Dict, List, Optional
from collections import Counter
from statistics import mean, median

logger = logging.getLogger(__name__)


class TransporterProfileInference:
    """
    Infère le profil d'un transporteur depuis son historique
    """
    
    def __init__(self):
        # Valeurs par défaut pour cold start
        self.defaults = {
            'max_weight': 10000,  # 10 tonnes par défaut
            'max_distance': 1000,  # 1000 km par défaut
            'min_budget': 50000,  # 50,000 FCFA par défaut
            'preferred_merchandise_types': ['Général'],
            'known_cities': ['Douala', 'Yaoundé'],  # Villes principales
            'preferred_delay_days': 7,
        }
    
    def infer_profile(
        self, 
        transporter_id: str, 
        history: Dict,
        vehicles: List[Dict] = None
    ) -> Dict:
        """
        Infère le profil complet d'un transporteur
        
        Args:
            transporter_id: ID du transporteur
            history: Historique des missions (depuis DB)
            vehicles: Liste des véhicules (optionnel)
        
        Returns:
            Profil inféré avec confiance pour chaque attribut
        """
        completed_missions = history.get('completed_missions', 0)
        
        # Cold start : utiliser valeurs par défaut
        if completed_missions == 0:
            logger.info(f"Cold start for transporter {transporter_id}")
            return self._cold_start_profile(transporter_id, vehicles)
        
        # Warm start : inférer depuis historique
        logger.info(f"Inferring profile for transporter {transporter_id} ({completed_missions} missions)")
        
        profile = {
            'transporter_id': transporter_id,
            'max_weight': self._infer_max_weight(history, vehicles),
            'max_distance': self._infer_max_distance(history),
            'min_budget': self._infer_min_budget(history),
            'preferred_merchandise_types': self._infer_preferred_merchandise(history),
            'known_cities': self._infer_known_cities(history),
            'preferred_delay_days': self._infer_preferred_delay(history),
            'vehicle_type': self._infer_vehicle_type(vehicles),
            'experience_years': self._infer_experience_years(history),
            'reputation_score': history.get('avg_rating', 70.0) * 20,  # 0-5 → 0-100
            
            # Métadonnées d'inférence
            '_inference_metadata': {
                'completed_missions': completed_missions,
                'confidence': self._calculate_confidence(completed_missions),
                'data_source': 'inferred_from_history',
            }
        }
        
        return profile
    
    def _cold_start_profile(self, transporter_id: str, vehicles: List[Dict] = None) -> Dict:
        """
        Profil par défaut pour nouveau transporteur
        """
        # Utiliser véhicules si disponibles
        max_weight = self._get_max_weight_from_vehicles(vehicles) if vehicles else self.defaults['max_weight']
        vehicle_type = self._get_primary_vehicle_type(vehicles) if vehicles else 'Camion'
        
        return {
            'transporter_id': transporter_id,
            'max_weight': max_weight,
            'max_distance': self.defaults['max_distance'],
            'min_budget': self.defaults['min_budget'],
            'preferred_merchandise_types': self.defaults['preferred_merchandise_types'],
            'known_cities': self.defaults['known_cities'],
            'preferred_delay_days': self.defaults['preferred_delay_days'],
            'vehicle_type': vehicle_type,
            'experience_years': 1,
            'reputation_score': 70.0,  # Score neutre
            
            '_inference_metadata': {
                'completed_missions': 0,
                'confidence': 0.3,  # Faible confiance
                'data_source': 'cold_start_defaults',
            }
        }
    
    def _infer_max_weight(self, history: Dict, vehicles: List[Dict] = None) -> int:
        """
        Infère le poids maximum que le transporteur peut gérer
        
        Stratégie :
        1. Si véhicules disponibles → capacité max des véhicules
        2. Sinon → max des poids transportés + marge 20%
        """
        # Priorité aux véhicules (données physiques)
        if vehicles:
            return self._get_max_weight_from_vehicles(vehicles)
        
        # Sinon, inférer depuis historique
        route_performance = history.get('route_performance', {})
        if not route_performance:
            return self.defaults['max_weight']
        
        # Trouver le poids max transporté (approximation)
        # Note: Nécessiterait d'ajouter 'max_weight' dans route_performance
        # Pour l'instant, utiliser valeur par défaut
        return self.defaults['max_weight']
    
    def _infer_max_distance(self, history: Dict) -> int:
        """
        Infère la distance maximale que le transporteur accepte
        
        Stratégie :
        - Prendre la distance max des missions complétées + marge 20%
        - Minimum 500 km (local)
        - Maximum 2000 km (national)
        """
        route_performance = history.get('route_performance', {})
        
        if not route_performance:
            return self.defaults['max_distance']
        
        # Extraire toutes les routes
        routes = list(route_performance.keys())
        
        # Calculer distances approximatives (nécessiterait matrice de distances)
        # Pour l'instant, heuristique simple
        if len(routes) >= 5:
            # Beaucoup de routes différentes = accepte longues distances
            return 1500
        elif len(routes) >= 3:
            return 1000
        else:
            return 800
    
    def _infer_min_budget(self, history: Dict) -> int:
        """
        Infère le budget minimum acceptable
        
        Stratégie :
        - Prendre le 25e percentile des budgets acceptés
        - Évite les missions exceptionnellement basses
        """
        # Note: Nécessiterait d'avoir les budgets dans l'historique
        # Pour l'instant, utiliser valeur par défaut
        return self.defaults['min_budget']
    
    def _infer_preferred_merchandise(self, history: Dict) -> List[str]:
        """
        Infère les types de marchandises préférés
        
        Stratégie :
        - Types avec taux de succès > 90% ET nombre de missions >= 3
        - Sinon, types les plus fréquents (top 3)
        """
        merchandise_success = history.get('merchandise_success', {})
        
        if not merchandise_success:
            return self.defaults['preferred_merchandise_types']
        
        # Filtrer par performance
        preferred = []
        for merch_type, perf in merchandise_success.items():
            success_rate = perf.get('success_rate', 0)
            count = perf.get('count', 0)
            
            # Critères : bon taux de succès ET expérience suffisante
            if success_rate >= 0.90 and count >= 3:
                preferred.append(merch_type)
        
        # Si aucun ne qualifie, prendre les 3 plus fréquents
        if not preferred:
            sorted_merch = sorted(
                merchandise_success.items(),
                key=lambda x: x[1].get('count', 0),
                reverse=True
            )
            preferred = [m[0] for m in sorted_merch[:3]]
        
        return preferred if preferred else self.defaults['preferred_merchandise_types']
    
    def _infer_known_cities(self, history: Dict) -> List[str]:
        """
        Infère les villes connues
        
        Stratégie :
        - Villes avec >= 2 missions complétées
        - Taux de succès > 80%
        """
        route_performance = history.get('route_performance', {})
        
        if not route_performance:
            return self.defaults['known_cities']
        
        # Extraire toutes les villes des routes
        cities = set()
        for route_key, perf in route_performance.items():
            # Format: "Ville1-Ville2"
            if '-' in route_key:
                city1, city2 = route_key.split('-', 1)
                
                # Critères : expérience suffisante ET bon taux de succès
                if perf.get('count', 0) >= 2 and perf.get('success_rate', 0) >= 0.80:
                    cities.add(city1)
                    cities.add(city2)
        
        known_cities = list(cities)
        return known_cities if known_cities else self.defaults['known_cities']
    
    def _infer_preferred_delay(self, history: Dict) -> int:
        """
        Infère le délai préféré
        
        Stratégie :
        - Médiane des délais des missions complétées à temps
        """
        # Note: Nécessiterait d'avoir les délais dans l'historique
        # Pour l'instant, utiliser valeur par défaut
        return self.defaults['preferred_delay_days']
    
    def _infer_vehicle_type(self, vehicles: List[Dict] = None) -> str:
        """
        Infère le type de véhicule principal
        """
        if not vehicles:
            return 'Camion'
        
        # Prendre le véhicule avec la plus grande capacité
        primary = max(vehicles, key=lambda v: v.get('capacite', 0))
        return primary.get('type', 'Camion')
    
    def _infer_experience_years(self, history: Dict) -> int:
        """
        Infère les années d'expérience
        
        Stratégie :
        - Basé sur le nombre de missions complétées
        - 1 an par tranche de 20 missions
        - Minimum 1 an
        """
        completed = history.get('completed_missions', 0)
        
        if completed == 0:
            return 1
        elif completed < 20:
            return 1
        elif completed < 50:
            return 2
        elif completed < 100:
            return 3
        else:
            return min(5, 3 + (completed - 100) // 50)
    
    def _calculate_confidence(self, completed_missions: int) -> float:
        """
        Calcule le niveau de confiance de l'inférence
        
        Plus de missions = plus de confiance
        """
        if completed_missions == 0:
            return 0.3  # Faible confiance (cold start)
        elif completed_missions <= 4:
            return 0.5  # Confiance moyenne-faible (1-4 missions)
        elif completed_missions < 20:
            return 0.7  # Confiance moyenne (5-19 missions)
        elif completed_missions < 50:
            return 0.85  # Bonne confiance (20-49 missions)
        else:
            return 0.95  # Très bonne confiance (50+ missions)
    
    def _get_max_weight_from_vehicles(self, vehicles: List[Dict]) -> int:
        """
        Obtient la capacité maximale depuis les véhicules
        """
        if not vehicles:
            return self.defaults['max_weight']
        
        max_capacity = max(v.get('capacite', 0) for v in vehicles)
        return max_capacity if max_capacity > 0 else self.defaults['max_weight']
    
    def _get_primary_vehicle_type(self, vehicles: List[Dict]) -> str:
        """
        Obtient le type de véhicule principal
        """
        if not vehicles:
            return 'Camion'
        
        # Prendre le véhicule avec la plus grande capacité
        primary = max(vehicles, key=lambda v: v.get('capacite', 0))
        return primary.get('type', 'Camion')


# Instance globale
profile_inference_service = TransporterProfileInference()


def infer_transporter_profile(
    transporter_id: str,
    history: Dict,
    vehicles: List[Dict] = None
) -> Dict:
    """
    Helper function pour inférer un profil transporteur
    """
    return profile_inference_service.infer_profile(transporter_id, history, vehicles)
