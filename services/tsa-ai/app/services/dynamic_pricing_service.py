"""
Service de calcul de prix dynamique avec marge de négociation
"""
from typing import Dict
from datetime import datetime
import uuid

from app.services.pricing_service import (
    PricingService,
    calculate_dynamic_margin,
    calculate_distance_discount,
    calculate_weight_discount
)


class DynamicPricingService:
    """Service pour calculer les prix dynamiques avec marge de négociation"""
    
    def __init__(self, base_rate: float = 50.0):
        """
        Initialise le service de pricing dynamique.
        
        Args:
            base_rate: Prix de base par tonne/km
        """
        self.base_rate = base_rate
        self.pricing_service = PricingService(base_rate=base_rate)
    
    def calculate_dynamic_price(
        self,
        origin: str,
        destination: str,
        distance_km: float,
        weight_tons: float,
        cargo_type: str = "general",
        urgency: str = "standard"
    ) -> Dict:
        """
        Calcule un prix dynamique avec marge de négociation.
        
        Args:
            origin: Ville de départ
            destination: Ville d'arrivée
            distance_km: Distance en kilomètres
            weight_tons: Poids en tonnes
            cargo_type: Type de marchandise
            urgency: Niveau d'urgence
            
        Returns:
            Dictionnaire avec le prix calculé et la marge de négociation
        """
        # Générer un ID unique pour ce calcul
        calculation_id = f"calc_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}"
        
        # Calcul de base
        base_subtotal = self.base_rate * distance_km * weight_tons
        
        # Calcul des ajustements
        distance_discount = calculate_distance_discount(distance_km, base_subtotal)
        weight_discount = calculate_weight_discount(weight_tons, base_subtotal)
        total_adjustments = distance_discount + weight_discount
        
        # Prix final calculé
        calculated_price = base_subtotal + total_adjustments
        
        # Calcul de la marge de négociation
        margin_percentage = calculate_dynamic_margin(distance_km, weight_tons)
        margin_amount = calculated_price * (margin_percentage / 100)
        
        min_price = calculated_price - margin_amount
        max_price = calculated_price + margin_amount
        
        # Formater le résultat
        return {
            "calculation_id": calculation_id,
            "timestamp": datetime.now(),
            
            # Calcul de base
            "base_rate_per_ton_km": self.base_rate,
            "distance_km": round(distance_km, 2),
            "weight_tons": round(weight_tons, 2),
            "base_subtotal": round(base_subtotal, 0),
            
            # Ajustements
            "distance_discount": round(distance_discount, 0),
            "weight_discount": round(weight_discount, 0),
            "total_adjustments": round(total_adjustments, 0),
            
            # Prix calculé
            "calculated_price": round(calculated_price, 0),
            "currency": "XAF",
            "formatted_price": f"{int(calculated_price):,} FCFA".replace(",", " "),
            
            # Marge de négociation
            "negotiation_range": {
                "min_price": round(min_price, 0),
                "max_price": round(max_price, 0),
                "margin_percentage": round(margin_percentage, 2),
                "margin_calculation": self._get_margin_explanation(
                    distance_km, weight_tons, margin_percentage
                ),
                "reason": self._get_margin_reason(distance_km, weight_tons)
            },
            
            # Métadonnées
            "origin": origin,
            "destination": destination,
            "cargo_type": cargo_type,
            "urgency": urgency
        }
    
    def _get_margin_explanation(
        self, 
        distance_km: float, 
        weight_tons: float, 
        margin: float
    ) -> str:
        """Génère une explication du calcul de marge"""
        return (
            f"±(5% base + 0.01% × {distance_km}km + 0.5% × {weight_tons}t) "
            f"= ±{margin:.2f}%"
        )
    
    def _get_margin_reason(self, distance_km: float, weight_tons: float) -> str:
        """Génère une raison pour la marge calculée"""
        if distance_km < 200 and weight_tons < 10:
            return "Marge standard pour courte distance et poids léger"
        elif distance_km >= 500:
            return "Marge élargie pour longue distance"
        elif weight_tons >= 20:
            return "Marge élargie pour gros tonnage"
        else:
            return "Marge standard pour distance et poids moyens"


def get_dynamic_pricing_service(base_rate: float = 50.0) -> DynamicPricingService:
    """
    Factory pour créer une instance du service de pricing dynamique.
    
    Args:
        base_rate: Prix de base par tonne/km
        
    Returns:
        Instance de DynamicPricingService
    """
    return DynamicPricingService(base_rate=base_rate)
