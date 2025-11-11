"""
Modèle pour le tracking des extractions KYC

⚠️ Note : Ce modèle est OPTIONNEL
Il permet de tracker les extractions pour :
- Statistiques d'utilisation
- Monitoring des coûts
- Audit trail
- Amélioration du parsing

Si vous ne voulez pas de tracking, ce fichier peut être ignoré.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class KYCExtraction(Base):
    """
    Historique des extractions KYC
    
    Permet de tracker :
    - Qui a soumis quel document
    - Résultats de l'extraction
    - Temps d'exécution
    - Coûts
    - Validation admin
    """
    __tablename__ = "kyc_extractions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Métadonnées utilisateur
    user_id = Column(String(255), index=True, nullable=True, comment="ID de l'utilisateur")
    user_role = Column(String(50), nullable=True, comment="Rôle (transporteur, affréteur)")
    
    # Type de document
    document_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="CNI_ANCIEN, CNI_NOUVEAU, PERMIS_CONDUIRE"
    )
    
    # Résultats extraction
    extraction_status = Column(
        String(20),
        nullable=False,
        comment="success, partial, failed"
    )
    
    extracted_data = Column(
        JSON,
        nullable=True,
        comment="Données extraites (JSON)"
    )
    
    raw_text_recto = Column(
        Text,
        nullable=True,
        comment="Texte brut recto (pour debug)"
    )
    
    raw_text_verso = Column(
        Text,
        nullable=True,
        comment="Texte brut verso (pour debug)"
    )
    
    # Métriques
    confidence_score = Column(
        Float,
        nullable=True,
        comment="Score de confiance (0-1)"
    )
    
    extraction_time_ms = Column(
        Float,
        nullable=True,
        comment="Temps d'extraction en millisecondes"
    )
    
    # Warnings et erreurs
    warnings = Column(
        JSON,
        nullable=True,
        comment="Liste des warnings"
    )
    
    errors = Column(
        JSON,
        nullable=True,
        comment="Liste des erreurs"
    )
    
    # Validation admin
    requires_manual_validation = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Nécessite validation admin"
    )
    
    validated = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Validé par admin"
    )
    
    validated_by = Column(
        String(255),
        nullable=True,
        comment="ID de l'admin validateur"
    )
    
    validated_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Date de validation"
    )
    
    corrected_data = Column(
        JSON,
        nullable=True,
        comment="Données corrigées par admin"
    )
    
    admin_notes = Column(
        Text,
        nullable=True,
        comment="Notes de l'admin"
    )
    
    # Coûts (pour monitoring)
    google_vision_calls = Column(
        Integer,
        default=0,
        comment="Nombre d'appels Google Vision"
    )
    
    estimated_cost_usd = Column(
        Float,
        default=0.0,
        comment="Coût estimé en USD"
    )
    
    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Date de création"
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Date de mise à jour"
    )
    
    def __repr__(self):
        return f"<KYCExtraction(id={self.id}, type={self.document_type}, status={self.extraction_status})>"
    
    def to_dict(self):
        """Convertit en dictionnaire"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'document_type': self.document_type,
            'extraction_status': self.extraction_status,
            'confidence_score': self.confidence_score,
            'extraction_time_ms': self.extraction_time_ms,
            'validated': self.validated,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# TODO: Créer migration Alembic
# alembic revision --autogenerate -m "Add KYC extraction tracking"
# alembic upgrade head
