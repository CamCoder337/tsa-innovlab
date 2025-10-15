"""
Modèle SQLAlchemy pour la configuration du pricing
"""
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class PricingConfig(Base):
    """Configuration du pricing dynamique"""
    __tablename__ = "pricing_config"
    
    key = Column(String, primary_key=True, index=True)
    value = Column(Float, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<PricingConfig(key='{self.key}', value={self.value})>"
