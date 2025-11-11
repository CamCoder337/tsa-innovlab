"""
Système d'enregistrement et de gestion des extracteurs OCR
"""
from typing import Dict, Type, Optional, List
from .base import BaseExtractor


class ExtractorRegistry:
    """Registry pour gérer les extracteurs de documents disponibles"""

    _extractors: Dict[str, Type[BaseExtractor]] = {}

    @classmethod
    def register(cls, extractor_class: Type[BaseExtractor]) -> None:
        """
        Enregistre un nouvel extracteur

        Args:
            extractor_class: Classe de l'extracteur à enregistrer
        """
        # Créer une instance temporaire pour obtenir le code
        temp_instance = extractor_class()
        code = temp_instance.document_code

        if code in cls._extractors:
            print(f"Avertissement: L'extracteur '{code}' existe déjà et sera remplacé")

        cls._extractors[code] = extractor_class
        print(f"Extracteur enregistré: {code} - {temp_instance.document_type}")

    @classmethod
    def get_extractor(cls, document_code: str) -> Optional[Type[BaseExtractor]]:
        """
        Récupère un extracteur par son code

        Args:
            document_code: Code du document (ex: 'CNI_ANCIEN')

        Returns:
            Classe de l'extracteur ou None si non trouvé
        """
        return cls._extractors.get(document_code.upper())

    @classmethod
    def get_all_extractors(cls) -> Dict[str, Type[BaseExtractor]]:
        """
        Récupère tous les extracteurs enregistrés

        Returns:
            Dictionnaire des extracteurs
        """
        return cls._extractors.copy()

    @classmethod
    def list_extractors(cls) -> List[Dict[str, str]]:
        """
        Liste tous les extracteurs disponibles avec leurs métadonnées

        Returns:
            Liste des extracteurs avec leurs informations
        """
        extractors_list = []
        for code, extractor_class in cls._extractors.items():
            temp_instance = extractor_class()
            extractors_list.append({
                'code': code,
                'type': temp_instance.document_type,
                'description': f"Extracteur pour {temp_instance.document_type}"
            })
        return extractors_list

    @classmethod
    def create_extractor(cls, document_code: str) -> Optional[BaseExtractor]:
        """
        Crée une instance d'un extracteur

        Args:
            document_code: Code du document

        Returns:
            Instance de l'extracteur ou None si non trouvé
        """
        extractor_class = cls.get_extractor(document_code)
        if extractor_class:
            return extractor_class()
        return None

    @classmethod
    def unregister(cls, document_code: str) -> bool:
        """
        Désenregistre un extracteur

        Args:
            document_code: Code du document à désenregistrer

        Returns:
            True si désenregistré, False si non trouvé
        """
        if document_code.upper() in cls._extractors:
            del cls._extractors[document_code.upper()]
            print(f"Extracteur désenregistré: {document_code}")
            return True
        return False


# Décorateur pour faciliter l'enregistrement
def register_extractor(extractor_class: Type[BaseExtractor]) -> Type[BaseExtractor]:
    """
    Décorateur pour enregistrer automatiquement un extracteur

    Usage:
        @register_extractor
        class MonExtracteur(BaseExtractor):
            ...
    """
    ExtractorRegistry.register(extractor_class)
    return extractor_class
