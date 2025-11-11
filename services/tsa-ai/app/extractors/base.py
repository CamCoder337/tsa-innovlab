"""
Classe abstraite pour tous les extracteurs OCR
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
import numpy as np
import cv2
import fitz  # PyMuPDF
import os


class BaseExtractor(ABC):
    """Classe de base pour tous les extracteurs de documents"""

    def __init__(self):
        """Initialise l'extracteur"""
        pass

    @property
    @abstractmethod
    def document_type(self) -> str:
        """Retourne le type de document géré (ex: 'cni_ancien', 'cni_nouveau', 'passeport')"""
        pass

    @property
    @abstractmethod
    def document_code(self) -> str:
        """Retourne le code unique du document (ex: 'CNI_OLD', 'CNI_NEW', 'PASSPORT')"""
        pass

    def pdf_to_image(self, pdf_path: str) -> np.ndarray:
        """
        Convertit un PDF en image haute résolution

        Args:
            pdf_path: Chemin vers le PDF

        Returns:
            Image en array numpy
        """
        doc = fitz.open(pdf_path)
        page = doc[0]
        zoom = 4  # 4x = 288 DPI
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        doc.close()
        return img

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Charge et prétraite l'image

        Args:
            image_path: Chemin vers l'image ou PDF

        Returns:
            Image prétraitée
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Le fichier {image_path} n'existe pas")

        if image_path.lower().endswith('.pdf'):
            img = self.pdf_to_image(image_path)
        else:
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Impossible de charger l'image: {image_path}")

        return img

    @abstractmethod
    def extract_info(self, recto_path: str, verso_path: str = None) -> Dict[str, Any]:
        """
        Extrait les informations du document

        Args:
            recto_path: Chemin du recto
            verso_path: Chemin du verso (optionnel)

        Returns:
            Dictionnaire des informations extraites
        """
        pass

    def get_metadata(self) -> Dict[str, str]:
        """
        Retourne les métadonnées de l'extracteur

        Returns:
            Dictionnaire avec type et code du document
        """
        return {
            "document_type": self.document_type,
            "document_code": self.document_code
        }
