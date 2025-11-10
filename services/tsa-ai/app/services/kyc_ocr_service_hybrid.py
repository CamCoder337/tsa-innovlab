"""
Service OCR Hybride pour KYC

Stratégie Intelligente :
1. EasyOCR par défaut (gratuit, précis sur CNI camerounaises)
2. Google Vision en fallback si timeout ou erreur
3. Métriques et monitoring intégrés

Économies : ~95% des documents via EasyOCR = $5-10/an vs $108/an
"""
import logging
import os
import re
import time
from typing import Dict, Optional, Tuple
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

# Google Vision (fallback)
from google.cloud import vision
from google.oauth2 import service_account
import json

# EasyOCR (primary)
try:
    import easyocr
    import cv2
    import fitz  # PyMuPDF
    import numpy as np
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logging.warning("EasyOCR non disponible")

from app.schemas.kyc import DocumentType

logger = logging.getLogger(__name__)


class HybridKYCOCRService:
    """Service OCR hybride avec fallback intelligent"""
    
    def __init__(self):
        # Configuration
        self.strategy = os.getenv('KYC_STRATEGY', 'hybrid')
        self.easyocr_timeout = int(os.getenv('KYC_EASYOCR_TIMEOUT', '60'))
        self.easyocr_first_timeout = int(os.getenv('KYC_EASYOCR_FIRST_CALL_TIMEOUT', '180'))
        self.fallback_enabled = os.getenv('KYC_FALLBACK_ENABLED', 'true').lower() == 'true'
        self.min_confidence = float(os.getenv('KYC_MIN_CONFIDENCE', '0.3'))  # Réduit de 0.7 à 0.3
        
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
        
        logger.info(f"KYC OCR Service initialisé - Stratégie: {self.strategy}")
        
        # Initialiser selon stratégie
        if self.strategy in ['hybrid', 'google_vision']:
            self._initialize_google_vision()
    
    def _initialize_google_vision(self) -> bool:
        """Initialise Google Vision API"""
        try:
            credentials_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
            
            if credentials_json:
                credentials_dict = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_dict)
                self.google_vision_client = vision.ImageAnnotatorClient(credentials=credentials)
                logger.info("✅ Google Vision initialisé")
                return True
            
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if credentials_path and Path(credentials_path).exists():
                self.google_vision_client = vision.ImageAnnotatorClient()
                logger.info("✅ Google Vision initialisé depuis fichier")
                return True
            
            logger.warning("⚠️  Google Vision non configuré")
            return False
            
        except Exception as e:
            logger.error(f"❌ Erreur Google Vision: {e}")
            return False
    
    def _load_easyocr_reader(self):
        """Charge EasyOCR (lazy loading)"""
        if self.easyocr_reader is None and EASYOCR_AVAILABLE:
            logger.info("Chargement des modèles EasyOCR...")
            start = time.time()
            # Utiliser le cache dans /home/app/.EasyOCR
            model_storage_directory = os.path.expanduser('~/.EasyOCR')
            self.easyocr_reader = easyocr.Reader(
                ['fr', 'en'],
                gpu=False,
                verbose=False,
                model_storage_directory=model_storage_directory
            )
            duration = time.time() - start
            logger.info(f"✅ EasyOCR chargé en {duration:.2f}s")
        return self.easyocr_reader is not None
    
    def _preprocess_image(self, image_path: str):
        """Prétraite une image ou PDF"""
        path = Path(image_path)
        
        # Vérifier que le fichier existe
        if not path.exists():
            logger.error(f"❌ Fichier introuvable: {image_path}")
            return None
        
        file_size = path.stat().st_size
        logger.info(f"📄 Preprocessing: {path.name} (taille: {file_size} bytes, extension: {path.suffix})")
        
        # Si PDF, convertir en image
        if path.suffix.lower() == '.pdf':
            logger.info("📄 Conversion PDF en image...")
            doc = fitz.open(str(path))
            page = doc[0]
            # Réduire le zoom pour accélérer l'OCR (2x au lieu de 3x)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_data = pix.tobytes("png")
            img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
            doc.close()
        else:
            logger.info(f"🖼️  Lecture image avec cv2.imread: {image_path}")
            img = cv2.imread(str(path))
            if img is None:
                logger.error(f"❌ cv2.imread a échoué pour: {image_path} (taille: {file_size} bytes)")
                # Essayer de lire avec PIL pour debug
                try:
                    from PIL import Image
                    pil_img = Image.open(str(path))
                    logger.info(f"✅ PIL peut lire l'image: format={pil_img.format}, size={pil_img.size}, mode={pil_img.mode}")
                except Exception as e:
                    logger.error(f"❌ PIL aussi échoue: {e}")
                return None
            
            # Réduire la taille si l'image est trop grande
            height, width = img.shape[:2]
            logger.info(f"✅ Image lue: {width}x{height}")
            max_dimension = 2000
            if max(height, width) > max_dimension:
                scale = max_dimension / max(height, width)
                img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
                logger.info(f"📐 Image redimensionnée: {img.shape[1]}x{img.shape[0]}")
        
        return img
    
    def _extract_with_timeout(self, func, *args, timeout=60, **kwargs):
        """Exécute une fonction avec timeout"""
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(func, *args, **kwargs)
            try:
                return future.result(timeout=timeout)
            except FuturesTimeoutError:
                raise TimeoutError(f"Timeout après {timeout}s")
    
    def _extract_with_easyocr(self, image_path: str) -> Tuple[str, float]:
        """Extrait le texte avec EasyOCR"""
        if not self._load_easyocr_reader():
            raise RuntimeError("EasyOCR non disponible")
        
        logger.info(f"🔍 _extract_with_easyocr appelé avec: {image_path}")
        img = self._preprocess_image(image_path)
        
        if img is None:
            raise RuntimeError(f"Preprocessing a échoué pour {image_path}")
        
        logger.info(f"✅ Image preprocessed, shape: {img.shape}")
        results = self.easyocr_reader.readtext(img, detail=1, paragraph=False)
        
        # Extraire texte et calculer confiance moyenne
        texts = []
        confidences = []
        
        for (bbox, text, conf) in results:
            texts.append(text)
            confidences.append(conf)
        
        full_text = '\n'.join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return full_text, avg_confidence
    
    def _extract_with_google_vision(self, image_path: str) -> Tuple[str, float]:
        """Extrait le texte avec Google Vision"""
        if not self.google_vision_client:
            raise RuntimeError("Google Vision non disponible")
        
        # Prétraiter l'image (convertir PDF si nécessaire)
        try:
            img = self._preprocess_image(image_path)
            # Convertir en bytes PNG pour Google Vision
            import cv2
            success, buffer = cv2.imencode('.png', img)
            if not success:
                raise Exception("Erreur conversion image")
            content = buffer.tobytes()
        except Exception as e:
            # Fallback : lire le fichier directement
            logger.warning(f"Prétraitement échoué, lecture directe: {e}")
            with open(image_path, 'rb') as image_file:
                content = image_file.read()
        
        image = vision.Image(content=content)
        response = self.google_vision_client.document_text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Vision API error: {response.error.message}")
        
        full_text = response.full_text_annotation.text if response.full_text_annotation else ""
        
        # Calculer confiance moyenne
        confidence = 0.0
        if response.full_text_annotation and response.full_text_annotation.pages:
            confidences = []
            for page in response.full_text_annotation.pages:
                for block in page.blocks:
                    confidences.append(block.confidence)
            
            if confidences:
                confidence = sum(confidences) / len(confidences)
        
        # Incrémenter coût
        self.stats['total_cost_usd'] += 0.0015
        
        return full_text, confidence
    
    def extract_text_from_image(
        self,
        image_path: str,
        method: Optional[str] = None
    ) -> Tuple[str, float, str]:
        """
        Extrait le texte d'une image avec stratégie hybride
        
        Returns:
            Tuple (texte, confiance, méthode_utilisée)
        """
        # Déterminer timeout
        timeout = self.easyocr_first_timeout if self.is_first_call else self.easyocr_timeout
        
        # Forcer une méthode spécifique
        if method == 'google_vision' or self.strategy == 'google_vision':
            logger.info("Utilisation de Google Vision (direct)")
            text, conf = self._extract_with_google_vision(image_path)
            self.stats['google_vision_direct'] += 1
            return text, conf, 'google_vision'
        
        # Essayer EasyOCR d'abord
        if self.strategy in ['hybrid', 'easyocr'] and EASYOCR_AVAILABLE:
            try:
                logger.info(f"Tentative EasyOCR (timeout: {timeout}s)...")
                start = time.time()
                
                text, conf = self._extract_with_timeout(
                    self._extract_with_easyocr,
                    image_path,
                    timeout=timeout
                )
                
                duration = time.time() - start
                logger.info(f"✅ EasyOCR réussi en {duration:.2f}s (confiance: {conf:.2f})")
                
                self.is_first_call = False
                
                # Vérifier confiance
                if conf < self.min_confidence:
                    logger.warning(f"⚠️  Confiance faible ({conf:.2f} < {self.min_confidence})")
                    self.stats['easyocr_low_confidence'] += 1
                    
                    if self.fallback_enabled and self.google_vision_client:
                        logger.info("Fallback sur Google Vision (confiance faible)")
                        text_gv, conf_gv = self._extract_with_google_vision(image_path)
                        self.stats['google_vision_fallback'] += 1
                        return text_gv, conf_gv, 'google_vision_fallback'
                
                self.stats['easyocr_success'] += 1
                return text, conf, 'easyocr'
                
            except TimeoutError as e:
                logger.warning(f"⏱️  EasyOCR timeout: {e}")
                self.stats['easyocr_timeout'] += 1
                
            except Exception as e:
                logger.error(f"❌ EasyOCR erreur: {e}")
                self.stats['easyocr_error'] += 1
        
        # Fallback sur Google Vision
        if self.fallback_enabled and self.google_vision_client:
            logger.info("Fallback sur Google Vision")
            text, conf = self._extract_with_google_vision(image_path)
            self.stats['google_vision_fallback'] += 1
            return text, conf, 'google_vision_fallback'
        
        raise RuntimeError("Aucune méthode OCR disponible")
    
    def _parse_cni_ancien(self, text_recto: str, text_verso: str) -> Dict:
        """Parse CNI ancien format avec extracteur avancé"""
        try:
            from app.extractors.cni_ancien_extractor import CNIAncienExtractor
            extractor = CNIAncienExtractor()
            return extractor.extract_from_text(text_recto, text_verso)
        except Exception as e:
            logger.error(f"Erreur extracteur avancé, fallback parsing basique: {e}")
            # Fallback sur parsing basique si extracteur échoue
            return self._parse_cni_ancien_basique(text_recto, text_verso)
    
    def _parse_cni_ancien_basique(self, text_recto: str, text_verso: str) -> Dict:
        """Parse CNI ancien format (parsing basique de secours)"""
        data = {}
        
        # Recto
        lines_recto = text_recto.split('\n')
        for i, line in enumerate(lines_recto):
            line_upper = line.upper()
            
            if 'NOM' in line_upper and ':' in line:
                data['nom'] = line.split(':', 1)[1].strip()
            elif 'PRENOM' in line_upper and ':' in line:
                data['prenoms'] = line.split(':', 1)[1].strip()
            elif re.search(r'\b(\d{2}[./]\d{2}[./]\d{4})\b', line):
                match = re.search(r'\b(\d{2}[./]\d{2}[./]\d{4})\b', line)
                data['date_naissance'] = match.group(1)
            elif 'SEXE' in line_upper:
                if 'M' in line or 'MASCULIN' in line_upper:
                    data['sexe'] = 'M'
                elif 'F' in line or 'FEMININ' in line_upper:
                    data['sexe'] = 'F'
            elif re.search(r'(\d,\d{2}\s*m)', line, re.IGNORECASE):
                match = re.search(r'(\d,\d{2}\s*m)', line, re.IGNORECASE)
                data['taille'] = match.group(1)
            elif 'PROFESSION' in line_upper and i + 1 < len(lines_recto):
                data['profession'] = lines_recto[i + 1].strip()
        
        # Verso
        lines_verso = text_verso.split('\n')
        for i, line in enumerate(lines_verso):
            line_upper = line.upper()
            
            if 'PERE' in line_upper and ':' in line:
                data['pere'] = line.split(':', 1)[1].strip()
            elif 'MERE' in line_upper and ':' in line:
                data['mere'] = line.split(':', 1)[1].strip()
            elif re.match(r'^\d{9,10}$', line.strip()):
                if 'numero' not in data:
                    data['numero'] = line.strip()
            elif 'DELIVRANCE' in line_upper or 'ISSUE' in line_upper:
                # Accepter point, virgule ou slash
                dates = re.findall(r'\b(\d{2}[.,/]\d{2}[.,/]\d{4})\b', line)
                if dates:
                    data['date_delivrance'] = dates[0].replace(',', '.')
            elif 'EXPIRATION' in line_upper or 'EXPIRY' in line_upper:
                # Accepter point, virgule ou slash
                dates = re.findall(r'\b(\d{2}[.,/]\d{2}[.,/]\d{4})\b', line)
                if dates:
                    # Prendre la date la plus récente (expiration > délivrance)
                    for date in dates:
                        date_normalized = date.replace(',', '.')
                        try:
                            year = int(re.search(r'\d{4}', date_normalized).group())
                            if 2020 <= year <= 2050:  # Date future
                                data['date_expiration'] = date_normalized
                                break
                        except:
                            pass
        
        return data
    
    def extract_cni_ancien(
        self,
        recto_path: str,
        verso_path: Optional[str] = None
    ) -> Dict:
        """Extrait CNI ancien format - UNE SEULE tentative OCR"""
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
            'extraction_warnings': [],
            'extraction_method': None
        }
        
        # UNE SEULE extraction pour recto
        text_recto = ""
        conf_recto = 0.0
        method_used = 'unknown'
        
        try:
            text_recto, conf_recto, method_used = self.extract_text_from_image(recto_path)
            logger.info(f"✅ Recto extrait: {len(text_recto)} chars, confiance={conf_recto:.2f}, méthode={method_used}")
        except Exception as e:
            logger.error(f"❌ Erreur extraction recto: {e}")
            data['extraction_warnings'].append(f"Erreur recto: {str(e)}")
        
        # UNE SEULE extraction pour verso (si fourni)
        text_verso = ""
        conf_verso = 0.0
        
        if verso_path:
            try:
                text_verso, conf_verso, _ = self.extract_text_from_image(verso_path)
                logger.info(f"✅ Verso extrait: {len(text_verso)} chars, confiance={conf_verso:.2f}")
            except Exception as e:
                logger.error(f"❌ Erreur extraction verso: {e}")
                data['extraction_warnings'].append(f"Erreur verso: {str(e)}")
        
        # Parser avec extracteur avancé
        try:
            parsed_data = self._parse_cni_ancien(text_recto, text_verso)
            data.update(parsed_data)
            logger.info(f"✅ Parsing réussi: {sum(1 for v in parsed_data.values() if v)}/{len(parsed_data)} champs extraits")
        except Exception as e:
            logger.error(f"❌ Erreur parsing: {e}")
            data['extraction_warnings'].append(f"Erreur parsing: {str(e)}")
        
        # Confiance moyenne
        confidences = [c for c in [conf_recto, conf_verso] if c > 0]
        data['confidence_score'] = sum(confidences) / len(confidences) if confidences else 0.0
        data['extraction_method'] = method_used
        
        return data
    
    def extract_cni_nouveau(
        self,
        recto_path: str,
        verso_path: Optional[str] = None
    ) -> Dict:
        """Extrait CNI nouveau format (similaire à ancien pour l'instant)"""
        return self.extract_cni_ancien(recto_path, verso_path)
    
    def extract_permis_conduire(
        self,
        recto_path: str,
        verso_path: Optional[str] = None
    ) -> Dict:
        """Extrait permis de conduire"""
        data = {
            'nom': None,
            'prenoms': None,
            'date_naissance': None,
            'numero': None,
            'categories': [],
            'date_delivrance': None,
            'date_expiration': None,
            'confidence_score': 0.0,
            'extraction_warnings': ['Parsing permis non implémenté'],
            'extraction_method': None
        }
        return data
    
    def get_stats(self) -> Dict:
        """Retourne les statistiques d'utilisation"""
        total = sum([
            self.stats['easyocr_success'],
            self.stats['google_vision_fallback'],
            self.stats['google_vision_direct']
        ])
        
        return {
            **self.stats,
            'total_extractions': total,
            'easyocr_rate': self.stats['easyocr_success'] / total if total > 0 else 0,
            'fallback_rate': self.stats['google_vision_fallback'] / total if total > 0 else 0,
            'estimated_monthly_cost': self.stats['total_cost_usd'],
            'strategy': self.strategy,
            'easyocr_available': EASYOCR_AVAILABLE,
            'google_vision_available': self.google_vision_client is not None
        }
    
    def is_available(self) -> bool:
        """Vérifie si au moins une méthode OCR est disponible"""
        return EASYOCR_AVAILABLE or self.google_vision_client is not None


# Singleton
_kyc_ocr_service = None


def get_kyc_ocr_service() -> HybridKYCOCRService:
    """Retourne l'instance singleton du service KYC OCR"""
    global _kyc_ocr_service
    if _kyc_ocr_service is None:
        _kyc_ocr_service = HybridKYCOCRService()
    return _kyc_ocr_service
