"""
Service de calcul de prix pour les missions de transport.

Formule simple : Prix = base_rate × distance (km) × poids (tonnes)

Note : La distance est calculée ailleurs via Google Maps API et fournie en paramètre.
"""

from typing import Dict, Optional
from datetime import datetime
import uuid


class PricingService:
    """
    Service de tarification pour les missions de transport.
    
    Responsabilité unique : Calculer le prix basé sur la distance et le poids.
    """
    
    # Constante de tarification par défaut (FCFA par km par tonne)
    DEFAULT_PRIX_PAR_KM_PAR_TONNE = 50
    
    def __init__(self, base_rate: Optional[float] = None):
        """
        Initialise le service de pricing.
        
        Args:
            base_rate: Prix de base personnalisé (optionnel)
        """
        self.base_rate = base_rate or self.DEFAULT_PRIX_PAR_KM_PAR_TONNE
    
    def calculate_price(
        self, 
        distance_km: float, 
        poids_tonnes: float,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Calcule le prix d'une mission de transport.
        
        Formule : Prix = 50 × distance (km) × poids (tonnes)
        
        Args:
            distance_km: Distance en kilomètres (fournie par Google Maps API)
            poids_tonnes: Poids de la marchandise en tonnes
            metadata: Métadonnées optionnelles (ville_depart, ville_arrivee, etc.)
            
        Returns:
            Dictionnaire contenant :
            - prix_calcule (float): Prix en FCFA
            - devise (str): "FCFA"
            - details (dict): Détails du calcul
            
        Raises:
            ValueError: Si distance ou poids sont invalides (négatifs ou nuls)
            
        Example:
            >>> service = PricingService()
            >>> result = service.calculate_price(236.1, 5.0)
            >>> print(result['prix_calcule'])
            59025.0
        """
        # Validation des inputs
        if distance_km <= 0:
            raise ValueError(
                f"La distance doit être positive. Reçu : {distance_km} km"
            )
        
        if poids_tonnes <= 0:
            raise ValueError(
                f"Le poids doit être positif. Reçu : {poids_tonnes} tonnes"
            )
        
        # Calcul du prix
        prix = self.base_rate * distance_km * poids_tonnes
        
        # Construction de la réponse
        response = {
            "prix_calcule": round(prix, 0),  # Arrondi à l'entier
            "devise": "FCFA",
            "details": {
                "distance_km": round(distance_km, 2),
                "poids_tonnes": round(poids_tonnes, 2),
                "prix_par_km_par_tonne": self.base_rate,
                "formule": f"{self.base_rate} × distance × tonnes",
                "calcul": f"{self.base_rate} × {distance_km} × {poids_tonnes} = {round(prix, 0)}"
            }
        }
        
        # Ajouter les métadonnées si fournies
        if metadata:
            response["metadata"] = metadata
        
        return response
    
    def calculate_price_batch(
        self, 
        missions: list[Dict]
    ) -> list[Dict]:
        """
        Calcule le prix pour plusieurs missions en batch.
        
        Args:
            missions: Liste de dictionnaires avec 'distance_km' et 'poids_tonnes'
            
        Returns:
            Liste de résultats de calcul de prix
            
        Example:
            >>> service = PricingService()
            >>> missions = [
            ...     {"distance_km": 236.1, "poids_tonnes": 5.0},
            ...     {"distance_km": 1109.0, "poids_tonnes": 10.0}
            ... ]
            >>> results = service.calculate_price_batch(missions)
            >>> len(results)
            2
        """
        results = []
        
        for i, mission in enumerate(missions):
            try:
                distance = mission.get('distance_km')
                poids = mission.get('poids_tonnes')
                metadata = mission.get('metadata', {})
                
                if distance is None or poids is None:
                    results.append({
                        "success": False,
                        "error": "distance_km et poids_tonnes sont requis",
                        "mission_index": i
                    })
                    continue
                
                result = self.calculate_price(distance, poids, metadata)
                result["success"] = True
                result["mission_index"] = i
                results.append(result)
                
            except Exception as e:
                results.append({
                    "success": False,
                    "error": str(e),
                    "mission_index": i
                })
        
        return results
    
    def get_price_estimate_range(
        self,
        distance_km: float,
        poids_tonnes: float,
        variation_percent: float = 5.0
    ) -> Dict:
        """
        Calcule une fourchette de prix avec variation.
        
        Utile pour donner une estimation min/max aux utilisateurs.
        
        Args:
            distance_km: Distance en kilomètres
            poids_tonnes: Poids en tonnes
            variation_percent: Pourcentage de variation (défaut: 5%)
            
        Returns:
            Dictionnaire avec prix_min, prix_max, prix_moyen
            
        Example:
            >>> service = PricingService()
            >>> result = service.get_price_estimate_range(236.1, 5.0)
            >>> print(result['prix_min'], result['prix_max'])
            56073.75 61976.25
        """
        base_result = self.calculate_price(distance_km, poids_tonnes)
        prix_base = base_result['prix_calcule']
        
        variation = prix_base * (variation_percent / 100)
        
        return {
            "prix_min": round(prix_base - variation, 0),
            "prix_moyen": round(prix_base, 0),
            "prix_max": round(prix_base + variation, 0),
            "devise": "FCFA",
            "variation_percent": variation_percent,
            "details": base_result['details']
        }


# Instance singleton pour réutilisation
_pricing_service_instance = None


def get_pricing_service(base_rate: Optional[float] = None) -> PricingService:
    """
    Retourne une instance du service de pricing.
    
    Utile pour l'injection de dépendances dans FastAPI.
    
    Args:
        base_rate: Prix de base personnalisé (optionnel)
    
    Returns:
        Instance de PricingService
    """
    return PricingService(base_rate=base_rate)


def calculate_dynamic_margin(distance_km: float, weight_tons: float) -> float:
    """
    Calcule la marge de négociation dynamique.
    
    Formule : 5% + 0.01% × distance_km + 0.5% × weight_tons
    
    Args:
        distance_km: Distance en kilomètres
        weight_tons: Poids en tonnes
        
    Returns:
        Pourcentage de marge (ex: 5.5 pour 5.5%)
    """
    base_margin = 5.0  # 5% de base
    distance_factor = 0.01 * distance_km  # 0.01% par km
    weight_factor = 0.5 * weight_tons  # 0.5% par tonne
    
    total_margin = base_margin + distance_factor + weight_factor
    
    # Limiter la marge entre 5% et 20%
    return max(5.0, min(20.0, total_margin))


def calculate_distance_discount(distance_km: float, base_price: float) -> float:
    """
    Calcule une réduction basée sur la distance (dégressif).
    
    - 0-200 km : 0%
    - 200-500 km : 5%
    - 500+ km : 10%
    
    Args:
        distance_km: Distance en kilomètres
        base_price: Prix de base calculé
        
    Returns:
        Montant de la réduction (négatif)
    """
    if distance_km < 200:
        return 0
    elif distance_km < 500:
        return -base_price * 0.05
    else:
        return -base_price * 0.10


def calculate_weight_discount(weight_tons: float, base_price: float) -> float:
    """
    Calcule une réduction basée sur le poids (dégressif pour gros tonnages).
    
    - 0-10 tonnes : 0%
    - 10-20 tonnes : 3%
    - 20+ tonnes : 5%
    
    Args:
        weight_tons: Poids en tonnes
        base_price: Prix de base calculé
        
    Returns:
        Montant de la réduction (négatif)
    """
    if weight_tons < 10:
        return 0
    elif weight_tons < 20:
        return -base_price * 0.03
    else:
        return -base_price * 0.05
