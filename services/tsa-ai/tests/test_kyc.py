"""
Tests pour le module KYC Hybride

Tests du service OCR hybride (EasyOCR + Google Vision fallback)
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

from app.services.kyc_ocr_service_hybrid import HybridKYCOCRService, get_kyc_ocr_service
from app.extractors.cni_ancien_extractor import CNIAncienExtractor
from app.schemas.kyc import DocumentType


class TestHybridKYCOCRService:
    """Tests du service OCR KYC Hybride"""
    
    def setup_method(self):
        """Setup avant chaque test"""
        self.service = HybridKYCOCRService()
    
    def test_service_singleton(self):
        """Test que get_kyc_ocr_service retourne toujours la même instance"""
        service1 = get_kyc_ocr_service()
        service2 = get_kyc_ocr_service()
        assert service1 is service2
    
    def test_hybrid_strategy_configuration(self):
        """Test configuration de la stratégie hybride"""
        service = HybridKYCOCRService()
        assert service.strategy in ['hybrid', 'easyocr', 'google_vision']
        assert service.min_confidence >= 0.0
        assert service.min_confidence <= 1.0
        assert service.easyocr_timeout > 0
    
    def test_stats_tracking(self):
        """Test que les statistiques sont trackées"""
        service = HybridKYCOCRService()
        stats = service.get_stats()
        
        assert 'easyocr_success' in stats
        assert 'google_vision_fallback' in stats
        assert 'total_cost_usd' in stats
        assert 'strategy' in stats
        assert stats['strategy'] == service.strategy
    
    def test_extracteur_cni_ancien_recto_basic(self):
        """Test extracteur avancé pour recto CNI ancien format"""
        text_recto = """REPUBLIQUE DU CAMEROUN
DUPONT MARTIN
Alexandre
15.03.1990
YAOUNDE
M
1,75
PROFESSION
INGENIEUR"""
        
        text_verso = """PERE: MARTIN
MERE: DUBOIS MARIE
NUMERO: 123456789
DATE DE DELIVRANCE: 10.01.2020
DATE D'EXPIRATION: 10.01.2030"""
        
        extractor = CNIAncienExtractor()
        data = extractor.extract_from_text(text_recto, text_verso)
        
        assert data.get('nom') == 'DUPONT MARTIN'
        assert data.get('prenoms') == 'Alexandre'
        assert data.get('date_naissance') == '15.03.1990'
        assert data.get('lieu_naissance') == 'YAOUNDE'
        assert data.get('sexe') == 'M'
        assert data.get('taille') == '1,75 m'
        assert data.get('profession') == 'INGENIEUR'
        assert data.get('pere') == 'MARTIN'
        assert data.get('mere') == 'DUBOIS MARIE'
        assert data.get('numero') == '123456789'
        assert data.get('date_delivrance') == '10.01.2020'
        assert data.get('date_expiration') == '10.01.2030'
    
    def test_extracteur_date_formats(self):
        """Test extraction de différents formats de dates"""
        extractor = CNIAncienExtractor()
        
        # Format avec points
        text_recto = "DUPONT MARTIN\nAlexandre\n15.03.1990"
        data = extractor._parse_recto(text_recto)
        assert data.get('date_naissance') == '15.03.1990'
        
        # Format sans séparateur (DDMMYYYY)
        text_recto2 = "DUPONT MARTIN\nAlexandre\n15031990"
        data2 = extractor._parse_recto(text_recto2)
        assert data2.get('date_naissance') == '15.03.1990'
        
        # Format avec virgules
        text_recto3 = "DUPONT MARTIN\nAlexandre\n15,03,1990"
        data3 = extractor._parse_recto(text_recto3)
        assert data3.get('date_naissance') == '15.03.1990'
    
    def test_extracteur_verso_dates_expiration(self):
        """Test extraction date d'expiration avec différents formats"""
        extractor = CNIAncienExtractor()
        
        # Format avec EXPIRATION
        text_verso = """
        PERE: MARTIN
        MERE: DUBOIS
        DATE D'EXPIRATION: 10.01.2030
        """
        data = extractor._parse_verso(text_verso)
        assert data['date_expiration'] == '10.01.2030'
        
        # Format avec EXPIRY (anglais)
        text_verso2 = """
        PERE: MARTIN
        DATE OF EXPIRY
        10.01,2030
        """
        data2 = extractor._parse_verso(text_verso2)
        assert data2['date_expiration'] == '10.01.2030'
        
        # Format avec virgule comme séparateur
        text_verso3 = """
        DATE D'EXPIRATION: 10,01,2030
        """
        data3 = extractor._parse_verso(text_verso3)
        assert data3['date_expiration'] == '10.01.2030'
    
    def test_extracteur_taille_formats(self):
        """Test extraction de la taille avec différents formats"""
        extractor = CNIAncienExtractor()
        
        # Format avec virgule
        text = "M\n1,75\nPROFESSION"
        data = extractor._parse_recto(text)
        assert data.get('taille') == '1,75 m'
        
        # Format avec point
        text2 = "M\n1.75\nPROFESSION"
        data2 = extractor._parse_recto(text2)
        assert data2.get('taille') == '1,75 m'
        
        # Valider les limites (1.00 - 2.50)
        text3 = "M\n0.50\nPROFESSION"  # Trop petit
        data3 = extractor._parse_recto(text3)
        assert data3.get('taille') is None
        
        text4 = "M\n3.00\nPROFESSION"  # Trop grand
        data4 = extractor._parse_recto(text4)
        assert data4.get('taille') is None
    
    def test_extracteur_prenoms_avec_bruit_ocr(self):
        """Test extraction prénoms avec bruit OCR"""
        extractor = CNIAncienExtractor()
        
        # Cas avec bruit OCR
        text_recto = """
        RÉPUBLIQUE DU CAMEROUN
        DUPONT MARTIN
        Flhomsicivimnames
        Alexandre
        15031990
        """
        data = extractor._parse_recto(text_recto)
        
        # Devrait ignorer "Flhomsicivimnames" (bruit) et prendre "Alexandre"
        assert data['prenoms'] == 'Alexandre'
        assert data['nom'] == 'DUPONT MARTIN'
        assert data['date_naissance'] == '15.03.1990'
    
    def test_extracteur_numero_cni(self):
        """Test extraction du numéro CNI (9-10 chiffres)"""
        extractor = CNIAncienExtractor()
        
        # 9 chiffres
        text = "NUMERO: 123456789"
        data = extractor._parse_verso(text)
        assert data['numero'] == '123456789'
        
        # 10 chiffres
        text2 = "1234567890"
        data2 = extractor._parse_verso(text2)
        assert data2['numero'] == '1234567890'
        
        # Ne devrait pas extraire si moins de 9 chiffres
        text3 = "12345678"
        data3 = extractor._parse_verso(text3)
        assert data3.get('numero') is None
    
    @patch('app.services.kyc_ocr_service_hybrid.vision.ImageAnnotatorClient')
    @patch('builtins.open', create=True)
    def test_extract_with_google_vision_mock(self, mock_open, mock_client_class):
        """Test extraction avec Google Vision mocké"""
        # Setup mock
        mock_client = Mock()
        mock_client_class.return_value = mock_client
        
        # Mock file read
        mock_open.return_value.__enter__.return_value.read.return_value = b'fake image data'
        
        # Mock response
        mock_response = Mock()
        mock_response.error.message = ""
        mock_response.full_text_annotation.text = "TEXTE EXTRAIT"
        
        # Mock confidence
        mock_page = Mock()
        mock_block = Mock()
        mock_block.confidence = 0.95
        mock_page.blocks = [mock_block]
        mock_response.full_text_annotation.pages = [mock_page]
        
        mock_client.document_text_detection.return_value = mock_response
        
        # Créer service avec mock
        service = HybridKYCOCRService()
        service.google_vision_client = mock_client
        
        # Mock preprocessing pour éviter erreur
        with patch.object(service, '_preprocess_image', side_effect=Exception("test")):
            text, confidence = service._extract_with_google_vision("fake_path.jpg")
        
        assert text == "TEXTE EXTRAIT"
        assert confidence == 0.95
        mock_client.document_text_detection.assert_called_once()
    
    @patch('app.services.kyc_ocr_service_hybrid.easyocr.Reader')
    def test_extract_with_easyocr_mock(self, mock_reader_class):
        """Test extraction avec EasyOCR mocké"""
        # Setup mock
        mock_reader = Mock()
        mock_reader_class.return_value = mock_reader
        
        # Mock OCR results: [(bbox, text, confidence), ...]
        mock_reader.readtext.return_value = [
            ([[0, 0], [100, 0], [100, 50], [0, 50]], "DUPONT MARTIN", 0.95),
            ([[0, 60], [100, 60], [100, 110], [0, 110]], "Alexandre", 0.90),
        ]
        
        # Créer service avec mock
        service = HybridKYCOCRService()
        service.easyocr_reader = mock_reader
        
        # Mock preprocessing
        with patch.object(service, '_preprocess_image', return_value=Mock()):
            text, confidence = service._extract_with_easyocr("fake_path.jpg")
        
        assert "DUPONT MARTIN" in text
        assert "Alexandre" in text
        assert 0.85 <= confidence <= 1.0  # Moyenne des confidences
    
    def test_extract_cni_ancien_complete(self):
        """Test extraction complète CNI ancien avec extracteur avancé"""
        service = HybridKYCOCRService()
        
        # Texte OCR réaliste (sans indentation excessive)
        text_recto = """RÉPUBLIQUE DU CAMEROUN
DUPONT MARTIN
Alexandre
15.03.1990
YAOUNDE
M
1,75
INGENIEUR"""
        
        text_verso = """PERE: MARTIN
MERE: DUBOIS MARIE
NUMERO: 123456789
DATE DE DELIVRANCE: 10.01.2020
DATE D'EXPIRATION: 10.01.2030"""
        
        with patch.object(service, 'extract_text_from_image') as mock_extract:
            mock_extract.side_effect = [
                (text_recto, 0.85, 'easyocr'),
                (text_verso, 0.80, 'easyocr')
            ]
            
            data = service.extract_cni_ancien("recto.jpg", "verso.jpg")
        
        assert data.get('nom') == 'DUPONT MARTIN'
        assert data.get('prenoms') == 'Alexandre'
        assert data.get('date_naissance') == '15.03.1990'
        assert data.get('lieu_naissance') == 'YAOUNDE'
        assert data.get('sexe') == 'M'
        assert data.get('taille') == '1,75 m'
        assert data.get('profession') == 'INGENIEUR'
        assert data.get('pere') == 'MARTIN'
        assert data.get('mere') == 'DUBOIS MARIE'
        assert data.get('numero') == '123456789'
        assert data.get('date_delivrance') == '10.01.2020'
        assert data.get('date_expiration') == '10.01.2030'
        assert data['extraction_method'] == 'easyocr'
        assert 0.8 <= data['confidence_score'] <= 0.9
    
    def test_extracteur_empty_text(self):
        """Test extracteur avec texte vide"""
        extractor = CNIAncienExtractor()
        data = extractor.extract_from_text("", "")
        assert isinstance(data, dict)
        # Tous les champs devraient être None
        assert all(v is None for v in data.values())
    
    def test_extracteur_malformed_text(self):
        """Test extracteur avec texte mal formé"""
        extractor = CNIAncienExtractor()
        text = "BLABLA RANDOM TEXT WITHOUT STRUCTURE"
        data = extractor.extract_from_text(text, text)
        assert isinstance(data, dict)
        # Ne devrait pas crasher, juste retourner dict vide/partiel
    
    def test_hybrid_fallback_logic(self):
        """Test logique de fallback EasyOCR → Google Vision"""
        service = HybridKYCOCRService()
        service.min_confidence = 0.7
        service.fallback_enabled = True
        service.google_vision_client = Mock()  # Simuler que GV est disponible
        
        # Mock EasyOCR avec confiance faible
        with patch.object(service, '_extract_with_easyocr', return_value=("texte", 0.4)):
            with patch.object(service, '_extract_with_google_vision', return_value=("texte gv", 0.9)) as mock_gv:
                with patch.object(service, '_extract_with_timeout', side_effect=lambda f, *a, **k: f(*a)):
                    text, conf, method = service.extract_text_from_image("test.jpg")
                    
                    # Devrait fallback sur Google Vision
                    assert method == 'google_vision_fallback'
                    assert conf == 0.9
                    mock_gv.assert_called_once()
    
    def test_hybrid_no_fallback_high_confidence(self):
        """Test pas de fallback si confiance EasyOCR suffisante"""
        service = HybridKYCOCRService()
        service.min_confidence = 0.3
        
        # Mock EasyOCR avec confiance suffisante
        with patch.object(service, '_extract_with_easyocr', return_value=("texte", 0.5)):
            with patch.object(service, '_extract_with_google_vision') as mock_gv:
                text, conf, method = service.extract_text_from_image("test.jpg")
                
                # Ne devrait PAS fallback
                assert method == 'easyocr'
                assert conf == 0.5
                mock_gv.assert_not_called()


class TestKYCSchemas:
    """Tests des schémas Pydantic KYC"""
    
    def test_document_type_enum(self):
        """Test que les types de documents sont valides"""
        assert DocumentType.CNI_ANCIEN.value == "CNI_ANCIEN"
        assert DocumentType.CNI_NOUVEAU.value == "CNI_NOUVEAU"
        assert DocumentType.PERMIS_CONDUIRE.value == "PERMIS_CONDUIRE"
    
    def test_cni_ancien_data_validation(self):
        """Test validation des données CNI ancien"""
        from app.schemas.kyc import CNIAncienData
        
        data = CNIAncienData(
            nom="KENGNE FOTSO",
            prenoms="Etienne Junior",
            date_naissance="15.03.1998",
            sexe="M",
            confidence_score=0.85
        )
        
        assert data.nom == "KENGNE FOTSO"
        assert data.confidence_score == 0.85
        assert data.extraction_warnings == []
    
    def test_confidence_score_bounds(self):
        """Test que le score de confiance est entre 0 et 1"""
        from app.schemas.kyc import CNIAncienData
        
        # Score valide
        data = CNIAncienData(confidence_score=0.5)
        assert data.confidence_score == 0.5
        
        # Score invalide (devrait échouer)
        with pytest.raises(Exception):
            CNIAncienData(confidence_score=1.5)
        
        with pytest.raises(Exception):
            CNIAncienData(confidence_score=-0.1)


@pytest.mark.skip(reason="Endpoints tests nécessitent configuration complète")
class TestKYCEndpoint:
    """Tests des endpoints KYC (nécessite FastAPI TestClient)"""
    
    @pytest.fixture
    def client(self):
        """Fixture pour le client de test"""
        from fastapi.testclient import TestClient
        from app.main import app
        return TestClient(app)
    
    def test_health_endpoint(self, client):
        """Test du endpoint health check"""
        response = client.get("/api/ai/kyc/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "google_vision_available" in data
        assert "supported_document_types" in data
    
    def test_document_types_endpoint(self, client):
        """Test du endpoint listant les types de documents"""
        response = client.get("/api/ai/kyc/document-types")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert len(data["document_types"]) == 3
        
        # Vérifier que CNI_ANCIEN est présent
        codes = [dt["code"] for dt in data["document_types"]]
        assert "CNI_ANCIEN" in codes
    
    @patch('app.services.kyc_ocr_service.KYCOCRService.is_available')
    def test_extract_endpoint_service_unavailable(self, mock_available, client):
        """Test extraction quand le service est indisponible"""
        mock_available.return_value = False
        
        # Créer un fichier fictif
        files = {
            'recto': ('test.jpg', b'fake image data', 'image/jpeg')
        }
        data = {
            'document_type': 'CNI_ANCIEN'
        }
        
        response = client.post("/api/ai/kyc/extract", files=files, data=data)
        assert response.status_code == 503
        assert "indisponible" in response.json()["detail"].lower()


# Tests d'intégration (nécessitent Google Vision configuré)
@pytest.mark.integration
class TestKYCIntegration:
    """
    Tests d'intégration avec vraie API Google Vision
    
    ⚠️ Ces tests nécessitent :
    - GOOGLE_CREDENTIALS_JSON ou GOOGLE_APPLICATION_CREDENTIALS configuré
    - Vraies images de test
    - Coûtent de l'argent ($0.0015 par image)
    
    Exécuter avec : pytest -m integration
    """
    
    @pytest.mark.skip(reason="Nécessite vraies images et credentials Google")
    def test_real_cni_extraction(self):
        """Test avec vraie CNI (à implémenter avec vos images de test)"""
        service = get_kyc_ocr_service()
        
        # Chemins vers vos images de test
        recto_path = "tests/fixtures/cni_recto.jpg"
        verso_path = "tests/fixtures/cni_verso.jpg"
        
        if not Path(recto_path).exists():
            pytest.skip("Images de test non disponibles")
        
        data = service.extract_cni_ancien(recto_path, verso_path)
        
        # Vérifier que des données ont été extraites
        assert data is not None
        assert data.get('confidence_score', 0) > 0
        
        # Afficher pour debug
        print(f"Données extraites: {data}")
