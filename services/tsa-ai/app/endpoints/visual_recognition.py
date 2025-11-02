"""
Endpoints API pour la reconnaissance visuelle de pièces avec Google Cloud Vision
"""
import logging
import tempfile
import time
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse

from app.schemas.visual_recognition import (
    TextSearchRequest,
    SearchResponse,
    PartResult,
    HealthResponse,
    VisualRecognitionResponse,
    ProductRecognitionResult
)
from app.services.vision_service import get_vision_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Charger le catalogue au démarrage
CATALOG_PATH = Path("data/visual_recognition/catalog.json")
service = get_vision_service()

try:
    if CATALOG_PATH.exists():
        service.load_catalog(str(CATALOG_PATH))
        logger.info("Catalogue de reconnaissance visuelle chargé")
    else:
        logger.warning(f"Catalogue non trouvé: {CATALOG_PATH}")
except Exception as e:
    logger.error(f"Erreur lors du chargement du catalogue: {e}")


@router.post("/search/image", response_model=VisualRecognitionResponse)
async def search_by_image(
    image: UploadFile = File(..., description="Image du produit à rechercher"),
    top_k: int = Query(10, ge=1, le=50, description="Nombre de résultats"),
    categorie: Optional[str] = Query(None, description="Filtrer par catégorie"),
    marque: Optional[str] = Query(None, description="Filtrer par marque"),
    modele_camion: Optional[str] = Query(None, description="Filtrer par modèle de camion")
):
    """
    Recherche de produits par image avec Google Cloud Vision

    Upload une image d'un produit et trouve les produits similaires dans le catalogue.
    Retourne un format compatible avec le service TypeScript.
    """
    start_time = time.time()

    if service.catalog_data is None:
        return VisualRecognitionResponse(
            success=False,
            results=[],
            processing_time_ms=0
        )

    # Vérifier le type de fichier
    if not image.content_type or not image.content_type.startswith('image/'):
        return VisualRecognitionResponse(
            success=False,
            results=[],
            processing_time_ms=(time.time() - start_time) * 1000
        )

    try:
        # Sauvegarder temporairement l'image
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            content = await image.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Construire les filtres
        filters = {}
        if categorie:
            filters['categorie'] = categorie
        if marque:
            filters['marque'] = marque
        if modele_camion:
            filters['modele_camion'] = modele_camion

        # Rechercher
        results = service.search_by_image(
            image_path=tmp_path,
            top_k=top_k,
            filters=filters if filters else None
        )

        # Nettoyer le fichier temporaire
        Path(tmp_path).unlink()

        # Convertir au format attendu par TypeScript
        product_results = [
            ProductRecognitionResult(
                product_id=r['id'],
                product_name=r['nom'],
                confidence=r['similarity_score'],
                category=r['categorie']
            )
            for r in results
        ]

        processing_time = (time.time() - start_time) * 1000

        return VisualRecognitionResponse(
            success=True,
            results=product_results,
            processing_time_ms=processing_time
        )

    except Exception as e:
        logger.error(f"Erreur lors de la recherche par image: {e}")
        processing_time = (time.time() - start_time) * 1000
        return VisualRecognitionResponse(
            success=False,
            results=[],
            processing_time_ms=processing_time
        )


@router.post("/search/text", response_model=SearchResponse)
async def search_by_text(request: TextSearchRequest):
    """
    Recherche de pièces par texte
    
    Recherche des pièces en utilisant une description textuelle.
    Exemples: "filtre à huile", "plaquettes de frein avant", "phare LED droit"
    """
    if service.catalog_data is None:
        raise HTTPException(
            status_code=503,
            detail="Service non disponible: catalogue non chargé"
        )
    
    try:
        # Construire les filtres
        filters = None
        if request.filters:
            filters = request.filters.model_dump(exclude_none=True)
        
        # Rechercher
        results = service.search_by_text(
            query=request.query,
            top_k=request.top_k,
            filters=filters
        )
        
        return SearchResponse(
            results=[PartResult(**r) for r in results],
            total=len(results),
            query_type="text"
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de la recherche par texte: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la recherche: {str(e)}"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Vérification de santé du service de reconnaissance visuelle
    """
    import os
    vision_configured = bool(os.getenv('GOOGLE_APPLICATION_CREDENTIALS'))
    
    return HealthResponse(
        status="healthy" if service.catalog_data is not None and vision_configured else "degraded",
        vision_api_configured=vision_configured,
        catalog_loaded=service.catalog_data is not None,
        catalog_size=len(service.catalog_data) if service.catalog_data else 0
    )
