"""
Schémas Pydantic pour la reconnaissance visuelle
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class SearchFilters(BaseModel):
    """Filtres de recherche"""
    categorie: Optional[str] = Field(None, description="Catégorie de pièce")
    marque: Optional[str] = Field(None, description="Marque de la pièce")
    modele_camion: Optional[str] = Field(None, description="Modèle de camion compatible")


class TextSearchRequest(BaseModel):
    """Requête de recherche par texte"""
    query: str = Field(..., description="Texte de recherche", min_length=1)
    top_k: int = Field(5, description="Nombre de résultats", ge=1, le=50)
    filters: Optional[SearchFilters] = None


class PartResult(BaseModel):
    """Résultat de recherche de pièce"""
    id: str
    nom: str
    reference_oem: str
    marque: str
    categorie: str
    modeles_camion_compatibles: List[str]
    prix: float
    stock: int
    image_path: str
    similarity_score: float = Field(..., description="Score de similarité (0-1)")


class SearchResponse(BaseModel):
    """Réponse de recherche"""
    results: List[PartResult]
    total: int
    query_type: str = Field(..., description="Type de requête: 'image' ou 'text'")


class ProductRecognitionResult(BaseModel):
    """Résultat de reconnaissance de produit pour l'API TypeScript"""
    product_id: str
    product_name: str
    confidence: float
    category: str


class VisualRecognitionResponse(BaseModel):
    """Réponse de reconnaissance visuelle pour l'API TypeScript"""
    success: bool
    results: List[ProductRecognitionResult]
    processing_time_ms: float


class HealthResponse(BaseModel):
    """Réponse de santé du service"""
    status: str
    vision_api_configured: bool
    catalog_loaded: bool
    catalog_size: int
