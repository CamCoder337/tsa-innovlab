"""
Service OCR Hybride pour KYC

Stratégie :
1. Essayer EasyOCR d'abord (gratuit, précis sur CNI camerounaises)
2. Fallback sur Google Vision si timeout ou erreur

Avantages :
- Économies : ~95% des docs via EasyOCR ($0)
- Fiabilité : Fallback automatique si problème
- Performance : Timeout configurable
"""
import logging
import os
import re
import time
import signal
from typing import Dict, Optional, Tuple, List
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from contextlib import contextmanager

# Google Vision (fallback)
from google.cloud import vision
from google.oauth2 import service_account
import json

# EasyOCR (primary)
try:
    import easyocr
    import cv2
    import fitz  # PyMuPDF
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logging.warning("EasyOCR non disponible, utilisation de Google Vision uniquement")

from app.schemas.kyc import DocumentType, ExtractionStatus
from app.core.config import settings

logger = logging.getLogger(__name__)


class KYCOCRService:
    """Service d'extraction OCR hybride pour documents KYC"""
    
    def __init__(self):
        """Initialise le service OCR hybride"""
        # Configuration
        self.strategy = os.getenv('KYC_STRATEGY', 'hybrid')  # hybrid | easyocr | google_vision
        self.easyocr_timeout = int(os.getenv('KYC_EASYOCR_TIMEOUT', '60'))
        self.easyocr_first_timeout = int(os.getenv('KYC_EASYOCR_FIRST_CALL_TIMEOUT', '180'))
        self.fallback_enabled = os.getenv('KYC_FALLBACK_ENABLED', 'true').lower() == 'true'
        self.min_confidence = float(os.getenv('KYC_MIN_CONFIDENCE', '0.7'))
        
        # Services
        self.easyocr_reader = None
        self.google_vision_client = None
        self.is_first_call = True
        
        # Métriques
        self.stats = {
            'easyocr_success': 0,
            'easyocr_timeout': 0,
            'easyocr_error': 0,
            'easyocr_low_confidence': 0,
            'google_vision_fallback': 0,
            'google_vision_direct': 0,
            'total_cost_usd': 0.0
        }
        
        # Initialiser selon la stratégie
        if self.strategy in ['hybrid', 'easyocr']:
            self._initialize_easyocr()
        
        if self.strategy in ['hybrid', 'google_vision']:
            self._initialize_google_vision()
    
    def _initialize_easyocr(self) -> bool:
        """Initialise EasyOCR (lazy loading)"""
        if not EASYOCR_AVAILABLE:
            logger.warning("EasyOCR non disponible")
            return False
        
        # Ne pas charger immédiatement, attendre le premier appel
        logger.info("EasyOCR sera chargé au premier appel")
        return True
    
    def _load_easyocr_reader(self):
        """Charge le reader EasyOCR (lazy loading)"""
        if self.easyocr_reader is None and EASYOCR_AVAILABLE:
            logger.info("Chargement des modèles EasyOCR...")
            start = time.time()
            self.easyocr_reader = easyocr.Reader(['fr', 'en'], gpu=False, verbose=False)
            duration = time.time() - start
            logger.info(f"✅ Modèles EasyOCR chargés en {duration:.2f}s")
        return self.easyocr_reader is not None
    
    def _initialize_google_vision(self) -> bool:
        """
        Initialise le client Google Cloud Vision
        
        Returns:
            True si succès, False sinon
        """
        try:
            credentials_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
            
            if credentials_json:
                credentials_dict = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_dict)
                self.client = vision.ImageAnnotatorClient(credentials=credentials)
                logger.info("✅ Client Google Cloud Vision initialisé (KYC)")
                return True
            
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if credentials_path and Path(credentials_path).exists():
                self.client = vision.ImageAnnotatorClient()
                logger.info("✅ Client Google Cloud Vision initialisé depuis fichier (KYC)")
                return True
            
            logger.error("❌ Aucune credential Google Cloud disponible pour KYC")
            return False
            
        except Exception as e:
            logger.error(f"❌ Erreur initialisation Google Vision (KYC): {e}")
            return False
    
    def extract_with_timeout(self, func, *args, timeout=60, **kwargs):
        """Exécute une fonction avec timeout"""
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(func, *args, **kwargs)
            try:
                return future.result(timeout=timeout)
            except FuturesTimeoutError:
                logger.warning(f"Timeout après {timeout}s")
                raise TimeoutError(f"Extraction timeout après {timeout}s")
    
    def extract_text_from_image_easyocr(self, image_path: str) -> Tuple[str, float]:
        """
        Extrait le texte d'une image avec Google Vision OCR
        
        Args:
            image_path: Chemin vers l'image
            
        Returns:
            Tuple (texte_extrait, score_confiance)
            
        Raises:
            RuntimeError: Si le client n'est pas initialisé
            Exception: Si erreur lors de l'extraction
        """
        if not self.client:
            if not self._initialize_client():
                raise RuntimeError("Client Google Vision non disponible")
        
        try:
            with open(image_path, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # Utiliser document_text_detection pour meilleure précision sur documents
            response = self.client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(f"Vision API error: {response.error.message}")
            
            # Extraire le texte complet
            full_text = response.full_text_annotation.text if response.full_text_annotation else ""
            
            # Calculer score de confiance moyen
            confidence = 0.0
            if response.full_text_annotation and response.full_text_annotation.pages:
                confidences = []
                for page in response.full_text_annotation.pages:
                    for block in page.blocks:
                        confidences.append(block.confidence)
                
                if confidences:
                    confidence = sum(confidences) / len(confidences)
            
            logger.info(f"✅ Texte extrait: {len(full_text)} caractères, confiance: {confidence:.2f}")
            return full_text, confidence
            
        except Exception as e:
            logger.error(f"❌ Erreur extraction OCR: {e}")
            raise
    
    def extract_cni_ancien(
        self,
        recto_path: str,
        verso_path: Optional[str] = None
    ) -> Dict:
        """
        Extrait les données d'une CNI ancien format
        
        ⚠️ ATTENTION : Parsing manuel basique
        Vous devrez améliorer cette logique selon vos besoins
        
        Args:
            recto_path: Chemin vers le recto
            verso_path: Chemin vers le verso (optionnel)
            
        Returns:
            Dictionnaire avec données extraites
        """
        data = {
            'nom': None,
            'prenoms': None,
            'date_naissance': None,
            'lieu_naissance': None,
            'sexe': None,
            'taille': None,
            'profession': None,
            'pere': None,
            'mere': None,
            'numero': None,
            'date_delivrance': None,
            'date_expiration': None,
            'confidence_score': 0.0,
            'extraction_warnings': []
        }
        
        confidences = []
        
        # Extraire recto
        try:
            text_recto, conf_recto = self.extract_text_from_image(recto_path)
            confidences.append(conf_recto)
            
            # Parsing basique (À AMÉLIORER)
            data.update(self._parse_cni_ancien_recto(text_recto))
            
        except Exception as e:
            logger.error(f"Erreur extraction recto: {e}")
            data['extraction_warnings'].append(f"Erreur recto: {str(e)}")
        
        # Extraire verso
        if verso_path:
            try:
                text_verso, conf_verso = self.extract_text_from_image(verso_path)
                confidences.append(conf_verso)
                
                data.update(self._parse_cni_ancien_verso(text_verso))
                
            except Exception as e:
                logger.error(f"Erreur extraction verso: {e}")
                data['extraction_warnings'].append(f"Erreur verso: {str(e)}")
        
        # Calculer confiance moyenne
        if confidences:
            data['confidence_score'] = sum(confidences) / len(confidences)
        
        return data
    
    def _parse_cni_ancien_recto(self, text: str) -> Dict:
        """
        Parse le texte brut du recto CNI ancien format
        
        ⚠️ PARSING TRÈS BASIQUE - À AMÉLIORER
        
        Args:
            text: Texte brut extrait
            
        Returns:
            Dictionnaire avec champs extraits
        """
        data = {}
        lines = text.split('\n')
        
        # Recherche de patterns (TRÈS BASIQUE)
        for i, line in enumerate(lines):
            line_upper = line.upper()
            
            # Nom (souvent après "NOM" ou en majuscules)
            if 'NOM' in line_upper and not data.get('nom'):
                # Prendre la ligne suivante ou le reste de la ligne
                if ':' in line:
                    data['nom'] = line.split(':', 1)[1].strip()
                elif i + 1 < len(lines):
                    data['nom'] = lines[i + 1].strip()
            
            # Prénoms
            if 'PRENOM' in line_upper and not data.get('prenoms'):
                if ':' in line:
                    data['prenoms'] = line.split(':', 1)[1].strip()
                elif i + 1 < len(lines):
                    data['prenoms'] = lines[i + 1].strip()
            
            # Date de naissance (format DD.MM.YYYY ou DD/MM/YYYY)
            if not data.get('date_naissance'):
                date_match = re.search(r'\b(\d{1,2}[./]\d{1,2}[./]\d{4})\b', line)
                if date_match:
                    data['date_naissance'] = date_match.group(1)
            
            # Sexe
            if 'SEXE' in line_upper and not data.get('sexe'):
                if 'M' in line or 'MASCULIN' in line_upper:
                    data['sexe'] = 'M'
                elif 'F' in line or 'FEMININ' in line_upper:
                    data['sexe'] = 'F'
            
            # Taille (format X,XX m ou XXX cm)
            if not data.get('taille'):
                taille_match = re.search(r'(\d,\d{2}\s*m|\d{3}\s*cm)', line, re.IGNORECASE)
                if taille_match:
                    data['taille'] = taille_match.group(1)
            
            # Profession
            if 'PROFESSION' in line_upper and not data.get('profession'):
                if ':' in line:
                    data['profession'] = line.split(':', 1)[1].strip()
                elif i + 1 < len(lines):
                    data['profession'] = lines[i + 1].strip()
        
        return data
    
    def _parse_cni_ancien_verso(self, text: str) -> Dict:
        """
        Parse le texte brut du verso CNI ancien format
        
        ⚠️ PARSING TRÈS BASIQUE - À AMÉLIORER
        """
        data = {}
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            line_upper = line.upper()
            
            # Père
            if 'PERE' in line_upper and not data.get('pere'):
                if ':' in line:
                    data['pere'] = line.split(':', 1)[1].strip()
                elif i + 1 < len(lines):
                    data['pere'] = lines[i + 1].strip()
            
            # Mère
            if 'MERE' in line_upper and not data.get('mere'):
                if ':' in line:
                    data['mere'] = line.split(':', 1)[1].strip()
                elif i + 1 < len(lines):
                    data['mere'] = lines[i + 1].strip()
            
            # Numéro CNI (souvent 9-10 chiffres)
            if not data.get('numero'):
                numero_match = re.search(r'\b(\d{9,10})\b', line)
                if numero_match:
                    data['numero'] = numero_match.group(1)
            
            # Dates de délivrance et expiration
            dates = re.findall(r'\b(\d{1,2}[./]\d{1,2}[./]\d{4})\b', line)
            if dates and not data.get('date_delivrance'):
                data['date_delivrance'] = dates[0]
                if len(dates) > 1:
                    data['date_expiration'] = dates[1]
        
        return data
    
    def extract_cni_nouveau(
        self,
        recto_path: str,
        verso_path: Optional[str] = None
    ) -> Dict:
        """
        Extrait les données d'une CNI nouveau format
        
        ⚠️ TODO: Implémenter le parsing spécifique au nouveau format
        """
        # Pour l'instant, logique similaire à ancien format
        # À adapter selon le format réel
        return self.extract_cni_ancien(recto_path, verso_path)
    
    def extract_permis_conduire(
        self,
        recto_path: str,
        verso_path: Optional[str] = None
    ) -> Dict:
        """
        Extrait les données d'un permis de conduire
        
        ⚠️ TODO: Implémenter le parsing spécifique au permis
        """
        data = {
            'nom': None,
            'prenoms': None,
            'date_naissance': None,
            'lieu_naissance': None,
            'numero': None,
            'categories': [],
            'date_delivrance': None,
            'date_expiration': None,
            'restrictions': None,
            'confidence_score': 0.0,
            'extraction_warnings': []
        }
        
        # TODO: Implémenter parsing permis
        data['extraction_warnings'].append("Parsing permis non implémenté")
        
        return data
    
    def is_available(self) -> bool:
        """Vérifie si le service est disponible"""
        return self.client is not None


# Singleton
_kyc_ocr_service = None


def get_kyc_ocr_service() -> KYCOCRService:
    """Retourne l'instance singleton du service KYC OCR"""
    global _kyc_ocr_service
    if _kyc_ocr_service is None:
        _kyc_ocr_service = KYCOCRService()
    return _kyc_ocr_service
