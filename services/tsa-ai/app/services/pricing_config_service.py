"""
Service pour gérer la configuration du pricing
"""
from sqlalchemy.orm import Session
from typing import Optional, Dict
import logging

from app.models.pricing_config import PricingConfig

logger = logging.getLogger(__name__)

# Valeurs par défaut
DEFAULT_CONFIG = {
    "base_rate": 50.0,
    "margin_base": 5.0,
    "margin_distance_factor": 0.01,
    "margin_weight_factor": 0.5,
    "margin_min": 5.0,
    "margin_max": 20.0
}


def init_pricing_config(db: Session):
    """Initialise la configuration avec les valeurs par défaut si nécessaire"""
    try:
        # Vérifier si la config existe
        count = db.query(PricingConfig).count()
        
        if count == 0:
            logger.info("Initializing pricing config with default values")
            for key, value in DEFAULT_CONFIG.items():
                config = PricingConfig(key=key, value=value)
                db.add(config)
            db.commit()
            logger.info("Pricing config initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing pricing config: {e}")
        db.rollback()
        raise


def get_config(db: Session, key: str, default: Optional[float] = None) -> Optional[float]:
    """Récupère une valeur de configuration"""
    try:
        config = db.query(PricingConfig).filter(PricingConfig.key == key).first()
        if config:
            return config.value
        return default
    except Exception as e:
        logger.error(f"Error getting config {key}: {e}")
        return default


def set_config(db: Session, key: str, value: float):
    """Définit une valeur de configuration"""
    try:
        config = db.query(PricingConfig).filter(PricingConfig.key == key).first()
        
        if config:
            config.value = value
        else:
            config = PricingConfig(key=key, value=value)
            db.add(config)
        
        db.commit()
        logger.info(f"Config updated: {key} = {value}")
    except Exception as e:
        logger.error(f"Error setting config {key}: {e}")
        db.rollback()
        raise


def get_all_config(db: Session) -> Dict:
    """Récupère toute la configuration"""
    try:
        configs = db.query(PricingConfig).all()
        return {
            config.key: {
                "value": config.value,
                "updated_at": config.updated_at.isoformat() if config.updated_at else None
            }
            for config in configs
        }
    except Exception as e:
        logger.error(f"Error getting all config: {e}")
        return {}
