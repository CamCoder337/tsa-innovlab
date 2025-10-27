"""
Service de reconnaissance visuelle avec Google Cloud Vision API
"""
import logging
import os
from typing import List, Dict, Optional
from pathlib import Path
from google.cloud import vision
from PIL import Image
import io

logger = logging.getLogger(__name__)


class VisionService:
    """Service de reconnaissance visuelle utilisant Google Cloud Vision"""
    
    def __init__(self):
        """Initialise le client Google Cloud Vision"""
        self.client = None
        self.catalog_data = None
        
    def initialize(self):
        """Initialise le client Vision API"""
        try:
            # Option 1: Utiliser les credentials depuis les variables d'environnement
            # Si GOOGLE_CREDENTIALS_JSON est défini, l'utiliser directement
            credentials_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
            
            if credentials_json:
                # Créer les credentials depuis le JSON en variable d'environnement
                import json
                from google.oauth2 import service_account
                
                credentials_dict = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_dict)
                self.client = vision.ImageAnnotatorClient(credentials=credentials)
                logger.info("Client Google Cloud Vision initialisé depuis GOOGLE_CREDENTIALS_JSON")
                return True
            
            # Option 2: Utiliser le fichier de credentials (développement local)
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if credentials_path:
                if not Path(credentials_path).exists():
                    logger.error(f"Fichier de credentials non trouvé: {credentials_path}")
                    return False
                
                self.client = vision.ImageAnnotatorClient()
                logger.info("Client Google Cloud Vision initialisé depuis fichier")
                return True
            
            # Option 3: Utiliser les credentials par défaut (si déployé sur GCP)
            try:
                self.client = vision.ImageAnnotatorClient()
                logger.info("Client Google Cloud Vision initialisé avec credentials par défaut")
                return True
            except Exception:
                logger.warning("Aucune méthode d'authentification Google Cloud disponible")
                logger.info("Définissez GOOGLE_CREDENTIALS_JSON ou GOOGLE_APPLICATION_CREDENTIALS")
                return False
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation du client Vision: {e}")
            return False
    
    def load_catalog(self, catalog_path: str):
        """
        Charge le catalogue de pièces
        
        Args:
            catalog_path: Chemin vers le fichier JSON du catalogue
        """
        import json
        try:
            with open(catalog_path, 'r', encoding='utf-8') as f:
                self.catalog_data = json.load(f)
            logger.info(f"Catalogue chargé: {len(self.catalog_data)} pièces")
        except Exception as e:
            logger.error(f"Erreur lors du chargement du catalogue: {e}")
            raise
    
    def detect_labels(self, image_path: str, max_results: int = 10) -> List[Dict]:
        """
        Détecte les labels dans une image avec Google Cloud Vision
        
        Args:
            image_path: Chemin vers l'image
            max_results: Nombre maximum de labels à retourner
            
        Returns:
            Liste de labels avec scores de confiance
        """
        if not self.client:
            if not self.initialize():
                raise RuntimeError("Client Vision non initialisé")
        
        try:
            # Lire l'image
            with open(image_path, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # Détecter les labels
            response = self.client.label_detection(image=image, max_results=max_results)
            
            if response.error.message:
                raise Exception(f"Vision API error: {response.error.message}")
            
            labels = []
            for label in response.label_annotations:
                labels.append({
                    'description': label.description,
                    'score': label.score,
                    'topicality': label.topicality
                })
            
            return labels
            
        except Exception as e:
            logger.error(f"Erreur lors de la détection de labels: {e}")
            raise
    
    def detect_web_entities(self, image_path: str, max_results: int = 10) -> List[Dict]:
        """
        Détecte les entités web dans une image (meilleur pour les objets)
        
        Args:
            image_path: Chemin vers l'image
            max_results: Nombre maximum d'entités à retourner
            
        Returns:
            Liste d'entités web avec scores
        """
        if not self.client:
            if not self.initialize():
                raise RuntimeError("Client Vision non initialisé")
        
        try:
            with open(image_path, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # Détecter les entités web
            response = self.client.web_detection(image=image, max_results=max_results)
            
            if response.error.message:
                raise Exception(f"Vision API error: {response.error.message}")
            
            entities = []
            if response.web_detection:
                for entity in response.web_detection.web_entities:
                    if entity.description:
                        entities.append({
                            'description': entity.description,
                            'score': entity.score
                        })
            
            return entities
            
        except Exception as e:
            logger.error(f"Erreur lors de la détection d'entités web: {e}")
            raise
    
    def search_by_image(
        self,
        image_path: str,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Recherche de pièces par image
        
        Args:
            image_path: Chemin vers l'image de requête
            top_k: Nombre de résultats à retourner
            filters: Filtres optionnels (categorie, marque, modele_camion)
            
        Returns:
            Liste des pièces correspondantes avec scores
        """
        if not self.catalog_data:
            raise ValueError("Catalogue non chargé. Appelez load_catalog() d'abord.")
        
        # Détecter les labels et entités dans l'image
        labels = self.detect_labels(image_path)
        entities = self.detect_web_entities(image_path)
        
        # Combiner les descriptions
        search_terms = set()
        for label in labels:
            search_terms.add(label['description'].lower())
        for entity in entities:
            search_terms.add(entity['description'].lower())
        
        logger.info(f"Termes détectés: {search_terms}")
        
        # Rechercher dans le catalogue
        results = []
        for item in self.catalog_data:
            # Appliquer les filtres
            if filters:
                if filters.get('categorie') and item.get('categorie') != filters['categorie']:
                    continue
                if filters.get('marque') and item.get('marque') != filters['marque']:
                    continue
                if filters.get('modele_camion'):
                    modeles = item.get('modeles_camion_compatibles', [])
                    if filters['modele_camion'] not in modeles:
                        continue
            
            # Calculer le score de correspondance
            score = self._calculate_match_score(item, search_terms)
            
            if score > 0:
                results.append({
                    **item,
                    'similarity_score': score
                })
        
        # Trier par score décroissant
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return results[:top_k]
    
    def search_by_text(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Recherche de pièces par texte
        
        Args:
            query: Texte de requête
            top_k: Nombre de résultats à retourner
            filters: Filtres optionnels
            
        Returns:
            Liste des pièces correspondantes avec scores
        """
        if not self.catalog_data:
            raise ValueError("Catalogue non chargé. Appelez load_catalog() d'abord.")
        
        query_terms = set(query.lower().split())
        
        results = []
        for item in self.catalog_data:
            # Appliquer les filtres
            if filters:
                if filters.get('categorie') and item.get('categorie') != filters['categorie']:
                    continue
                if filters.get('marque') and item.get('marque') != filters['marque']:
                    continue
                if filters.get('modele_camion'):
                    modeles = item.get('modeles_camion_compatibles', [])
                    if filters['modele_camion'] not in modeles:
                        continue
            
            # Calculer le score
            score = self._calculate_match_score(item, query_terms)
            
            if score > 0:
                results.append({
                    **item,
                    'similarity_score': score
                })
        
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results[:top_k]
    
    def _calculate_match_score(self, item: Dict, search_terms: set) -> float:
        """
        Calcule le score de correspondance entre un item et des termes de recherche
        
        Args:
            item: Item du catalogue
            search_terms: Ensemble de termes de recherche
            
        Returns:
            Score de correspondance (0-1)
        """
        # Créer un texte searchable pour l'item
        searchable_text = " ".join([
            item.get('nom', ''),
            item.get('categorie', ''),
            item.get('marque', ''),
            item.get('description', ''),
            " ".join(item.get('modeles_camion_compatibles', []))
        ]).lower()
        
        # Compter les correspondances
        matches = 0
        for term in search_terms:
            if term in searchable_text:
                matches += 1
        
        # Normaliser le score
        if len(search_terms) == 0:
            return 0.0
        
        return matches / len(search_terms)


# Singleton instance
_vision_service = None


def get_vision_service() -> VisionService:
    """Retourne l'instance singleton du service"""
    global _vision_service
    if _vision_service is None:
        _vision_service = VisionService()
    return _vision_service
