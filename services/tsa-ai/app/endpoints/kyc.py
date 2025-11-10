"""
Endpoints pour le module KYC (Know Your Customer)

Fonctionnalités :
- Extraction OCR de documents (CNI, Permis)
- Validation par admin (géré par le monolithe)
- Health check du service

⚠️ Note : Ce service utilise Google Vision OCR
Coût : ~$1.50/1000 images
"""
import logging
import time
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pathlib import Path
import tempfile
import os

from app.schemas.kyc import (
    DocumentType,
    OCRExtractionRequest,
    OCRExtractionResponse,
    ExtractionStatus,
    KYCHealthResponse,
    CNIAncienData,
    CNINouveauData,
    PermisConduireData
)
from app.services.kyc_ocr_service_hybrid import get_kyc_ocr_service, HybridKYCOCRService
from app.core.dependencies import get_user_from_header

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kyc", tags=["KYC"])


@router.get("/health", response_model=KYCHealthResponse)
async def kyc_health_check():
    """
    Health check du service KYC
    
    Vérifie :
    - Disponibilité EasyOCR et/ou Google Vision
    - Stratégie configurée
    - Types de documents supportés
    """
    try:
        kyc_service = get_kyc_ocr_service()
        is_available = kyc_service.is_available()
        stats = kyc_service.get_stats()
        
        status_message = []
        if stats['easyocr_available']:
            status_message.append("EasyOCR disponible")
        if stats['google_vision_available']:
            status_message.append("Google Vision disponible")
        
        status_message.append(f"Stratégie: {stats['strategy']}")
        
        return KYCHealthResponse(
            status="healthy" if is_available else "degraded",
            google_vision_available=stats['google_vision_available'],
            supported_document_types=[dt.value for dt in DocumentType],
            message=" | ".join(status_message) if status_message else "Aucun moteur OCR disponible"
        )
    except Exception as e:
        logger.error(f"Erreur health check KYC: {e}")
        return KYCHealthResponse(
            status="unhealthy",
            google_vision_available=False,
            supported_document_types=[],
            message=f"Erreur: {str(e)}"
        )


@router.post("/extract", response_model=OCRExtractionResponse)
async def extract_document(
    document_type: DocumentType = Form(..., description="Type de document (CNI_ANCIEN, CNI_NOUVEAU, PERMIS_CONDUIRE)"),
    recto: UploadFile = File(..., description="Image recto du document"),
    verso: Optional[UploadFile] = File(None, description="Image verso du document (optionnel)"),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Extrait les informations d'un document KYC
    
    **Types de documents supportés :**
    - `CNI_ANCIEN` : CNI camerounaise ancien format
    - `CNI_NOUVEAU` : CNI camerounaise nouveau format
    - `PERMIS_CONDUIRE` : Permis de conduire camerounais
    
    **Processus :**
    1. Upload des images (recto obligatoire, verso optionnel)
    2. Extraction OCR avec Google Vision
    3. Parsing des données structurées
    4. Retour des données + texte brut pour validation admin
    
    **⚠️ Important :**
    - Validation admin obligatoire (requires_manual_validation=True)
    - Les données extraites peuvent contenir des erreurs
    - Vérifier le score de confiance (confidence_score)
    
    **Coût :** ~$0.0015 par document (2 faces)
    """
    start_time = time.time()
    
    # Vérifier le service
    kyc_service = get_kyc_ocr_service()
    if not kyc_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Service KYC indisponible. Google Vision API non configurée."
        )
    
    # Créer dossier temporaire
    temp_dir = Path(tempfile.mkdtemp())
    recto_path = None
    verso_path = None
    
    try:
        # Sauvegarder les fichiers temporairement
        recto_path = temp_dir / f"recto_{recto.filename}"
        logger.info(f"📥 Réception fichier recto: {recto.filename}, content_type: {recto.content_type}")
        with open(recto_path, "wb") as f:
            content = await recto.read()
            f.write(content)
        # Debug: afficher les premiers bytes pour vérifier le format
        header = content[:20].hex() if len(content) >= 20 else content.hex()
        logger.info(f"💾 Fichier recto sauvegardé: {recto_path} ({len(content)} bytes), header: {header}")
        
        if verso:
            verso_path = temp_dir / f"verso_{verso.filename}"
            logger.info(f"📥 Réception fichier verso: {verso.filename}, content_type: {verso.content_type}")
            with open(verso_path, "wb") as f:
                content = await verso.read()
                f.write(content)
            logger.info(f"💾 Fichier verso sauvegardé: {verso_path} ({len(content)} bytes)")
        
        # Extraire selon le type de document
        extracted_data = None
        raw_text_recto = None
        raw_text_verso = None
        warnings = []
        errors = []
        confidence = 0.0  # Initialiser ici
        
        try:
            if document_type == DocumentType.CNI_ANCIEN:
                extracted_data = kyc_service.extract_cni_ancien(
                    str(recto_path),
                    str(verso_path) if verso_path else None
                )
                
            elif document_type == DocumentType.CNI_NOUVEAU:
                extracted_data = kyc_service.extract_cni_nouveau(
                    str(recto_path),
                    str(verso_path) if verso_path else None
                )
                
            elif document_type == DocumentType.PERMIS_CONDUIRE:
                extracted_data = kyc_service.extract_permis_conduire(
                    str(recto_path),
                    str(verso_path) if verso_path else None
                )
            
            # Extraire texte brut pour validation admin (retourne 3 valeurs maintenant)
            try:
                result = kyc_service.extract_text_from_image(str(recto_path))
                raw_text_recto = result[0] if result else None
            except:
                raw_text_recto = None
            
            if verso_path:
                try:
                    result = kyc_service.extract_text_from_image(str(verso_path))
                    raw_text_verso = result[0] if result else None
                except:
                    raw_text_verso = None
            
            # Récupérer warnings
            if extracted_data and 'extraction_warnings' in extracted_data:
                warnings = extracted_data.pop('extraction_warnings', [])
            
            # Déterminer le statut
            confidence = extracted_data.get('confidence_score', 0.0) if extracted_data else 0.0
            
            if confidence > 0.8 and not warnings:
                status = ExtractionStatus.SUCCESS
            elif confidence > 0.5:
                status = ExtractionStatus.PARTIAL
                warnings.append("Confiance moyenne, vérification manuelle recommandée")
            else:
                status = ExtractionStatus.PARTIAL
                warnings.append("Confiance faible, vérification manuelle obligatoire")
            
        except Exception as e:
            logger.error(f"Erreur extraction {document_type}: {e}")
            errors.append(str(e))
            status = ExtractionStatus.FAILED
            confidence = 0.0  # S'assurer que confidence est définie
        
        # Calculer temps d'exécution
        execution_time = (time.time() - start_time) * 1000
        
        # Récupérer méthode et coût
        extraction_method = extracted_data.get('extraction_method', 'unknown') if extracted_data else 'unknown'
        extraction_cost = 0.0015 if 'google_vision' in extraction_method else 0.0
        
        # Logger pour monitoring
        user_id = user.get('id') if user else 'anonymous'
        logger.info(
            f"KYC extraction: user={user_id}, type={document_type}, "
            f"status={status}, time={execution_time:.0f}ms, confidence={confidence:.2f}, "
            f"method={extraction_method}, cost=${extraction_cost:.4f}"
        )
        
        return OCRExtractionResponse(
            success=status != ExtractionStatus.FAILED,
            status=status,
            document_type=document_type,
            data=extracted_data,
            raw_text_recto=raw_text_recto,
            raw_text_verso=raw_text_verso,
            extraction_time_ms=execution_time,
            confidence_score=confidence,
            warnings=warnings,
            errors=errors,
            extraction_method=extraction_method,
            extraction_cost_usd=extraction_cost,
            requires_manual_validation=True,  # Toujours True selon vos specs
            validation_notes="Validation admin obligatoire avant acceptation"
        )
        
    except Exception as e:
        logger.error(f"Erreur inattendue extraction KYC: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'extraction: {str(e)}"
        )
        
    finally:
        # Nettoyer les fichiers temporaires
        try:
            if recto_path and recto_path.exists():
                os.remove(recto_path)
            if verso_path and verso_path.exists():
                os.remove(verso_path)
            if temp_dir.exists():
                temp_dir.rmdir()
        except Exception as e:
            logger.warning(f"Erreur nettoyage fichiers temporaires: {e}")


@router.get("/document-types")
async def get_supported_document_types():
    """
    Liste les types de documents supportés
    
    Retourne les codes et descriptions des documents KYC supportés
    """
    return {
        "success": True,
        "document_types": [
            {
                "code": DocumentType.CNI_ANCIEN.value,
                "name": "CNI Camerounaise (Ancien Format)",
                "description": "Carte Nationale d'Identité camerounaise ancien format",
                "requires_verso": True
            },
            {
                "code": DocumentType.CNI_NOUVEAU.value,
                "name": "CNI Camerounaise (Nouveau Format)",
                "description": "Carte Nationale d'Identité camerounaise nouveau format biométrique",
                "requires_verso": True
            },
            {
                "code": DocumentType.PERMIS_CONDUIRE.value,
                "name": "Permis de Conduire",
                "description": "Permis de conduire camerounais",
                "requires_verso": True
            }
        ]
    }


@router.get("/stats")
async def get_kyc_stats(
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Statistiques du service KYC
    
    Retourne :
    - Nombre d'extractions par méthode (EasyOCR vs Google Vision)
    - Taux de succès et de fallback
    - Coûts estimés
    - Performance globale
    """
    kyc_service = get_kyc_ocr_service()
    stats = kyc_service.get_stats()
    
    return {
        "success": True,
        "stats": stats,
        "cost_analysis": {
            "current_month_usd": stats['estimated_monthly_cost'],
            "projected_annual_usd": stats['estimated_monthly_cost'] * 12,
            "savings_vs_google_only": 108 - (stats['estimated_monthly_cost'] * 12),
            "easyocr_percentage": f"{stats['easyocr_rate'] * 100:.1f}%",
            "fallback_percentage": f"{stats['fallback_rate'] * 100:.1f}%"
        },
        "recommendations": _get_recommendations(stats)
    }


def _get_recommendations(stats: dict) -> list:
    """Génère des recommandations basées sur les stats"""
    recommendations = []
    
    if stats['fallback_rate'] > 0.15:
        recommendations.append({
            "level": "warning",
            "message": f"Taux de fallback élevé ({stats['fallback_rate']*100:.1f}%). Considérez augmenter le timeout EasyOCR."
        })
    
    if stats['easyocr_timeout'] > stats['easyocr_success'] * 0.1:
        recommendations.append({
            "level": "info",
            "message": "Beaucoup de timeouts EasyOCR. Vérifiez les performances du serveur."
        })
    
    if stats['easyocr_rate'] > 0.9:
        recommendations.append({
            "level": "success",
            "message": f"Excellent ! {stats['easyocr_rate']*100:.1f}% des documents traités gratuitement avec EasyOCR."
        })
    
    if stats['estimated_monthly_cost'] > 10:
        recommendations.append({
            "level": "warning",
            "message": f"Coûts mensuels élevés (${stats['estimated_monthly_cost']:.2f}). Optimisez le taux de fallback."
        })
    
    return recommendations
