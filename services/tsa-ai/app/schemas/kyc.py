"""
Schémas Pydantic pour le module KYC
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum


class DocumentType(str, Enum):
    """Types de documents supportés"""
    CNI_ANCIEN = "CNI_ANCIEN"
    CNI_NOUVEAU = "CNI_NOUVEAU"
    PERMIS_CONDUIRE = "PERMIS_CONDUIRE"


class DocumentFace(str, Enum):
    """Face du document"""
    RECTO = "recto"
    VERSO = "verso"


class ExtractionStatus(str, Enum):
    """Statut de l'extraction"""
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


class CNIAncienData(BaseModel):
    """Données extraites d'une CNI ancien format"""
    # Recto
    nom: Optional[str] = None
    prenoms: Optional[str] = None
    date_naissance: Optional[str] = None
    lieu_naissance: Optional[str] = None
    sexe: Optional[str] = None
    taille: Optional[str] = None
    profession: Optional[str] = None
    
    # Verso
    pere: Optional[str] = None
    mere: Optional[str] = None
    numero: Optional[str] = None
    date_delivrance: Optional[str] = None
    date_expiration: Optional[str] = None
    
    # Métadonnées
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    extraction_warnings: List[str] = Field(default_factory=list)


class CNINouveauData(BaseModel):
    """Données extraites d'une CNI nouveau format"""
    # Recto
    nom: Optional[str] = None
    prenoms: Optional[str] = None
    date_naissance: Optional[str] = None
    lieu_naissance: Optional[str] = None
    sexe: Optional[str] = None
    nationalite: Optional[str] = None
    numero: Optional[str] = None
    
    # Verso
    date_delivrance: Optional[str] = None
    date_expiration: Optional[str] = None
    autorite_delivrance: Optional[str] = None
    
    # Métadonnées
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    extraction_warnings: List[str] = Field(default_factory=list)


class PermisConduireData(BaseModel):
    """Données extraites d'un permis de conduire"""
    # Recto
    nom: Optional[str] = None
    prenoms: Optional[str] = None
    date_naissance: Optional[str] = None
    lieu_naissance: Optional[str] = None
    numero: Optional[str] = None
    categories: Optional[List[str]] = Field(default_factory=list)
    
    # Verso
    date_delivrance: Optional[str] = None
    date_expiration: Optional[str] = None
    restrictions: Optional[str] = None
    
    # Métadonnées
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    extraction_warnings: List[str] = Field(default_factory=list)


class OCRExtractionRequest(BaseModel):
    """Requête d'extraction OCR"""
    document_type: DocumentType
    user_id: Optional[str] = Field(None, description="ID de l'utilisateur soumettant le document")
    
    @validator('document_type')
    def validate_document_type(cls, v):
        if v not in DocumentType.__members__.values():
            raise ValueError(f"Type de document invalide. Valeurs acceptées: {list(DocumentType.__members__.keys())}")
        return v


class OCRExtractionResponse(BaseModel):
    """Réponse d'extraction OCR"""
    success: bool
    status: ExtractionStatus
    document_type: DocumentType
    
    # Données extraites (selon le type de document)
    data: Optional[Dict[str, Any]] = None
    
    # Texte brut extrait (pour debug/validation manuelle)
    raw_text_recto: Optional[str] = None
    raw_text_verso: Optional[str] = None
    
    # Métadonnées
    extraction_time_ms: Optional[float] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    
    # Méthode d'extraction utilisée
    extraction_method: Optional[str] = Field(None, description="easyocr | google_vision | google_vision_fallback")
    extraction_cost_usd: Optional[float] = Field(None, description="Coût de cette extraction")
    
    # Pour validation admin
    requires_manual_validation: bool = True
    validation_notes: Optional[str] = None


class DocumentValidationRequest(BaseModel):
    """Requête de validation par admin"""
    extraction_id: str
    validated: bool
    corrected_data: Optional[Dict[str, Any]] = None
    admin_notes: Optional[str] = None


class DocumentValidationResponse(BaseModel):
    """Réponse de validation"""
    success: bool
    message: str
    extraction_id: str
    validated_at: datetime


class KYCHealthResponse(BaseModel):
    """Réponse du health check KYC"""
    status: str
    google_vision_available: bool
    supported_document_types: List[str]
    message: Optional[str] = None
