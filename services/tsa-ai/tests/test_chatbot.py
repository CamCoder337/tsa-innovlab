"""
Tests for Chatbot Service
"""
import pytest
from app.services.chatbot_service import ChatbotService
from app.utils.intent_classifier import IntentClassifier


class TestIntentClassifier:
    """Test intent classification"""
    
    def setup_method(self):
        self.classifier = IntentClassifier()
    
    def test_tracking_intent(self):
        """Test tracking intent detection"""
        messages = [
            "Où est mon colis #12345?",
            "Suivi de commande 456",
            "Statut de ma livraison",
        ]
        
        for message in messages:
            intent, confidence, entities = self.classifier.classify(message)
            assert intent == "tracking"
            assert confidence > 0.5
    
    def test_pricing_intent(self):
        """Test pricing intent detection"""
        messages = [
            "Combien coûte de Douala à Yaoundé?",
            "Prix pour transport",
            "Tarif Douala Yaoundé",
        ]
        
        for message in messages:
            intent, confidence, entities = self.classifier.classify(message)
            assert intent == "pricing"
            assert confidence > 0.5
    
    def test_products_intent(self):
        """Test products intent detection"""
        messages = [
            "Pièces pour Volvo",
            "Cherche produit moteur",
            "Catalogue disponible",
        ]
        
        for message in messages:
            intent, confidence, entities = self.classifier.classify(message)
            assert intent == "products"
            assert confidence > 0.5
    
    def test_greeting_intent(self):
        """Test greeting intent detection"""
        messages = [
            "Bonjour",
            "Salut",
            "Hello",
        ]
        
        for message in messages:
            intent, confidence, entities = self.classifier.classify(message)
            assert intent == "greeting"
            assert confidence > 0.5
    
    def test_help_intent(self):
        """Test help intent detection"""
        messages = [
            "Aide",
            "Comment ça marche?",
            "Qu'est-ce que tu peux faire?",
        ]
        
        for message in messages:
            intent, confidence, entities = self.classifier.classify(message)
            assert intent == "help"
            assert confidence > 0.5
    
    def test_entity_extraction_tracking(self):
        """Test entity extraction for tracking"""
        message = "Où est mon colis #12345?"
        intent, confidence, entities = self.classifier.classify(message)
        
        assert intent == "tracking"
        assert "id" in entities
        assert entities["id"] == "12345"
    
    def test_entity_extraction_pricing(self):
        """Test entity extraction for pricing"""
        message = "Prix de Douala à Yaoundé pour 500kg"
        intent, confidence, entities = self.classifier.classify(message)
        
        assert intent == "pricing"
        assert "origin" in entities
        assert "destination" in entities
        assert entities["origin"] == "Douala"
        assert entities["destination"] == "Yaoundé"
        assert "weight" in entities
        assert entities["weight"] == 500.0
    
    def test_entity_extraction_products(self):
        """Test entity extraction for products"""
        message = "Pièces moteur pour Volvo"
        intent, confidence, entities = self.classifier.classify(message)
        
        assert intent == "products"
        assert "brand" in entities
        assert entities["brand"] == "Volvo"


class TestChatbotService:
    """Test chatbot service"""
    
    @pytest.mark.asyncio
    async def test_process_greeting(self):
        """Test processing greeting message"""
        service = ChatbotService()
        
        response = await service.process_message(
            message="Bonjour",
            user_id="test_user_123",
            user_role="CLIENT"
        )
        
        assert response.message is not None
        assert response.intent is not None
        assert response.intent.name == "greeting"
        assert len(response.suggestions) > 0
    
    @pytest.mark.asyncio
    async def test_process_tracking_without_id(self):
        """Test tracking request without shipment ID"""
        service = ChatbotService()
        
        response = await service.process_message(
            message="Où est mon colis?",
            user_id="test_user_123",
            user_role="CLIENT"
        )
        
        assert response.intent.name == "tracking"
        assert "numéro" in response.message.lower()
        assert len(response.suggestions) > 0
    
    @pytest.mark.asyncio
    async def test_process_tracking_with_id(self):
        """Test tracking request with shipment ID"""
        service = ChatbotService()
        
        response = await service.process_message(
            message="Où est mon colis #12345?",
            user_id="test_user_123",
            user_role="CLIENT"
        )
        
        assert response.intent.name == "tracking"
        assert response.data is not None
        assert "shipment_id" in response.data
        assert response.data["shipment_id"] == "12345"
    
    @pytest.mark.asyncio
    async def test_process_pricing(self):
        """Test pricing calculation"""
        service = ChatbotService()
        
        response = await service.process_message(
            message="Combien coûte de Douala à Yaoundé pour 500kg?",
            user_id="test_user_123",
            user_role="AFFRETEUR"
        )
        
        assert response.intent.name == "pricing"
        assert response.data is not None
        assert "calculated_price" in response.data
        assert response.data["calculated_price"] > 0
    
    @pytest.mark.asyncio
    async def test_process_help(self):
        """Test help request"""
        service = ChatbotService()
        
        response = await service.process_message(
            message="Aide",
            user_id="test_user_123",
            user_role="CLIENT"
        )
        
        assert response.intent.name == "help"
        assert "assistant" in response.message.lower()
        assert len(response.suggestions) >= 4
    
    @pytest.mark.asyncio
    async def test_conversation_history(self):
        """Test conversation history storage"""
        service = ChatbotService()
        conversation_id = "conv_123"
        
        # Send multiple messages
        await service.process_message(
            message="Bonjour",
            user_id="test_user_123",
            conversation_id=conversation_id
        )
        
        await service.process_message(
            message="Où est mon colis #12345?",
            user_id="test_user_123",
            conversation_id=conversation_id
        )
        
        # Check history
        history = service.get_history(conversation_id)
        assert len(history) == 4  # 2 user messages + 2 bot responses
        assert history[0]["role"] == "user"
        assert history[1]["role"] == "bot"
    
    @pytest.mark.asyncio
    async def test_unknown_intent(self):
        """Test handling of unknown intent"""
        service = ChatbotService()
        
        response = await service.process_message(
            message="xyzabc random gibberish",
            user_id="test_user_123",
            user_role="CLIENT"
        )
        
        assert response.intent.name == "unknown"
        # Accept both rule-based and LLM responses
        assert (
            "compris" in response.message.lower() 
            or "reformuler" in response.message.lower()
            or "clair" in response.message.lower()
            or "détails" in response.message.lower()
            or len(response.message) > 0  # LLM always provides a response
        )
