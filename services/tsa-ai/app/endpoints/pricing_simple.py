"""
Endpoints simplifiés pour le pricing dynamique
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session

from app.services.dynamic_pricing_service import get_dynamic_pricing_service
from app.services import pricing_config_service
from app.core.database import get_db

router = APIRouter(tags=["Pricing Dynamique"])


class UpdateConfigRequest(BaseModel):
    """Requête pour modifier une configuration"""
    base_rate: Optional[float] = Field(None, gt=0, description="Prix de base (FCFA/t/km)")
    margin_base: Optional[float] = Field(None, ge=0, le=100, description="Marge de base (%)")
    margin_distance_factor: Optional[float] = Field(None, ge=0, description="Facteur distance (%/km)")
    margin_weight_factor: Optional[float] = Field(None, ge=0, description="Facteur poids (%/t)")
    margin_min: Optional[float] = Field(None, ge=0, le=100, description="Marge minimum (%)")
    margin_max: Optional[float] = Field(None, ge=0, le=100, description="Marge maximum (%)")
    updated_by: Optional[str] = Field(None, description="ID de l'admin")


class DynamicPriceRequest(BaseModel):
    """Requête pour calculer un prix dynamique"""
    origin: str
    destination: str
    distance_km: float = Field(..., gt=0)
    weight_tons: float = Field(..., gt=0)
    cargo_type: Optional[str] = "general"
    urgency: Optional[str] = "standard"


@router.get("/config")
def get_pricing_config(db: Session = Depends(get_db)):
    """
    Récupère toute la configuration de pricing.
    """
    config = pricing_config_service.get_all_config(db)
    
    return {
        "base_rate": config.get("base_rate", {}).get("value", 50.0),
        "margin": {
            "base": config.get("margin_base", {}).get("value", 5.0),
            "distance_factor": config.get("margin_distance_factor", {}).get("value", 0.01),
            "weight_factor": config.get("margin_weight_factor", {}).get("value", 0.5),
            "min": config.get("margin_min", {}).get("value", 5.0),
            "max": config.get("margin_max", {}).get("value", 20.0)
        },
        "last_updated": config.get("base_rate", {}).get("updated_at")
    }


@router.post("/config")
def update_pricing_config(request: UpdateConfigRequest, db: Session = Depends(get_db)):
    """
    Met à jour la configuration de pricing (admin uniquement).
    
    Permet de modifier :
    - Le prix de base (FCFA/t/km)
    - Les paramètres de marge (base, facteurs, min/max)
    """
    updated_fields = []
    
    if request.base_rate is not None:
        pricing_config_service.set_config(db, "base_rate", request.base_rate)
        updated_fields.append(f"base_rate={request.base_rate}")
    
    if request.margin_base is not None:
        pricing_config_service.set_config(db, "margin_base", request.margin_base)
        updated_fields.append(f"margin_base={request.margin_base}%")
    
    if request.margin_distance_factor is not None:
        pricing_config_service.set_config(db, "margin_distance_factor", request.margin_distance_factor)
        updated_fields.append(f"margin_distance_factor={request.margin_distance_factor}")
    
    if request.margin_weight_factor is not None:
        pricing_config_service.set_config(db, "margin_weight_factor", request.margin_weight_factor)
        updated_fields.append(f"margin_weight_factor={request.margin_weight_factor}")
    
    if request.margin_min is not None:
        pricing_config_service.set_config(db, "margin_min", request.margin_min)
        updated_fields.append(f"margin_min={request.margin_min}%")
    
    if request.margin_max is not None:
        pricing_config_service.set_config(db, "margin_max", request.margin_max)
        updated_fields.append(f"margin_max={request.margin_max}%")
    
    if not updated_fields:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
    
    return {
        "message": "Configuration mise à jour",
        "updated_fields": updated_fields,
        "updated_by": request.updated_by,
        "config": get_pricing_config(db)
    }


@router.post("/calculate")
def calculate_dynamic_price(request: DynamicPriceRequest, db: Session = Depends(get_db)):
    """
    Calcule un prix dynamique avec marge de négociation.
    
    Utilise la configuration actuelle (prix de base + paramètres de marge).
    """
    # Récupérer la configuration actuelle
    base_rate = pricing_config_service.get_config(db, "base_rate", 50.0)
    margin_base = pricing_config_service.get_config(db, "margin_base", 5.0)
    margin_distance_factor = pricing_config_service.get_config(db, "margin_distance_factor", 0.01)
    margin_weight_factor = pricing_config_service.get_config(db, "margin_weight_factor", 0.5)
    margin_min = pricing_config_service.get_config(db, "margin_min", 5.0)
    margin_max = pricing_config_service.get_config(db, "margin_max", 20.0)
    
    # Calculer le prix dynamique
    service = get_dynamic_pricing_service(base_rate=base_rate)
    result = service.calculate_dynamic_price(
        origin=request.origin,
        destination=request.destination,
        distance_km=request.distance_km,
        weight_tons=request.weight_tons,
        cargo_type=request.cargo_type or "general",
        urgency=request.urgency or "standard"
    )
    
    # Recalculer la marge avec les paramètres configurables
    calculated_price = result["calculated_price"]
    
    # Marge personnalisée
    margin_percentage = margin_base + (margin_distance_factor * request.distance_km) + (margin_weight_factor * request.weight_tons)
    margin_percentage = max(margin_min, min(margin_max, margin_percentage))
    
    margin_amount = calculated_price * (margin_percentage / 100)
    min_price = calculated_price - margin_amount
    max_price = calculated_price + margin_amount
    
    # Mettre à jour la marge dans le résultat
    result["negotiation_range"] = {
        "min_price": round(min_price, 0),
        "max_price": round(max_price, 0),
        "margin_percentage": round(margin_percentage, 2),
        "margin_calculation": f"±({margin_base}% base + {margin_distance_factor}% × {request.distance_km}km + {margin_weight_factor}% × {request.weight_tons}t) = ±{margin_percentage:.2f}%",
        "reason": result["negotiation_range"]["reason"]
    }
    
    # Ajouter le champ success pour compatibilité avec le monolithe
    result["success"] = True
    
    # Ajouter breakdown pour compatibilité
    if "breakdown" not in result:
        result["breakdown"] = {
            "base_cost": result.get("base_subtotal", 0),
            "distance_factor": 1.0,
            "weight_factor": 1.0,
            "cargo_type_multiplier": 1.0,
            "urgency_multiplier": 1.0
        }
    
    return result
