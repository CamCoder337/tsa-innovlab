"""
Tests d'intégration pour le chatbot avec vraie DB PostgreSQL
Ces tests nécessitent une base de données PostgreSQL configurée et accessible
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from app.services.chatbot_function_calling_service import ChatbotFunctionCallingService


@pytest.mark.integration
class TestChatbotPersistence:
    """Tests de persistance avec PostgreSQL"""
    
    @pytest.mark.asyncio
    async def test_save_and_load_history(self):
        """Test que l'historique est bien sauvegardé et chargé depuis la DB"""
        service = ChatbotFunctionCallingService()
        user_id = f"test-user-{datetime.now().timestamp()}"
        
        # Save messages
        await service._save_to_db(user_id, "user", "Bonjour")
        await service._save_to_db(user_id, "assistant", "Bonjour ! Comment puis-je vous aider ?")
        await service._save_to_db(user_id, "user", "Où est mon colis ?")
        
        # Load history
        history = await service._load_from_db(user_id, limit=10)
        
        # Verify
        assert len(history) >= 3, "L'historique devrait contenir au moins 3 messages"
        assert history[0]["role"] == "user", "Premier message devrait être de l'utilisateur"
        assert history[0]["content"] == "Bonjour", "Contenu du premier message incorrect"
        assert history[1]["role"] == "assistant", "Deuxième message devrait être de l'assistant"
        assert history[2]["content"] == "Où est mon colis ?", "Contenu du troisième message incorrect"
        
        print(f"✅ Test passed: {len(history)} messages loaded from DB")
    
    @pytest.mark.asyncio
    async def test_history_isolation(self):
        """Test que l'historique est isolé par user_id"""
        service = ChatbotFunctionCallingService()
        user_a = f"test-user-a-{datetime.now().timestamp()}"
        user_b = f"test-user-b-{datetime.now().timestamp()}"
        
        # Save messages for user A
        await service._save_to_db(user_a, "user", "Secret A")
        
        # Save messages for user B
        await service._save_to_db(user_b, "user", "Secret B")
        
        # Load history for each user
        history_a = await service._load_from_db(user_a, limit=10)
        history_b = await service._load_from_db(user_b, limit=10)
        
        # Verify isolation
        assert any("Secret A" in msg["content"] for msg in history_a), "User A devrait voir son message"
        assert not any("Secret B" in msg["content"] for msg in history_a), "User A ne devrait pas voir le message de B"
        assert any("Secret B" in msg["content"] for msg in history_b), "User B devrait voir son message"
        assert not any("Secret A" in msg["content"] for msg in history_b), "User B ne devrait pas voir le message de A"
        
        print("✅ Test passed: History is properly isolated by user_id")
    
    @pytest.mark.asyncio
    async def test_history_limit(self):
        """Test que la limite de messages fonctionne"""
        service = ChatbotFunctionCallingService()
        user_id = f"test-user-limit-{datetime.now().timestamp()}"
        
        # Save 15 messages
        for i in range(15):
            await service._save_to_db(user_id, "user", f"Message {i}")
        
        # Load with limit 5
        history = await service._load_from_db(user_id, limit=5)
        
        # Verify
        assert len(history) == 5, f"Devrait retourner exactement 5 messages, reçu {len(history)}"
        assert history[0]["content"] == "Message 10", "Devrait retourner les 5 derniers messages"
        assert history[-1]["content"] == "Message 14", "Dernier message devrait être Message 14"
        
        print("✅ Test passed: History limit works correctly")


@pytest.mark.integration
class TestChatbotRateLimiting:
    """Tests de rate limiting avec PostgreSQL"""
    
    @pytest.mark.asyncio
    async def test_rate_limit_allows_requests(self):
        """Test que les requêtes sont autorisées sous la limite"""
        service = ChatbotFunctionCallingService()
        user_id = f"test-user-rate-{datetime.now().timestamp()}"
        
        # First request should be allowed
        is_allowed, remaining = await service._check_rate_limit_db(user_id)
        
        assert is_allowed == True, "Première requête devrait être autorisée"
        assert remaining >= 0, f"Remaining devrait être >= 0, reçu {remaining}"
        
        print(f"✅ Test passed: Request allowed, {remaining} remaining")
    
    @pytest.mark.asyncio
    async def test_rate_limit_blocks_excess(self):
        """Test que les requêtes sont bloquées après la limite"""
        service = ChatbotFunctionCallingService()
        user_id = f"test-user-block-{datetime.now().timestamp()}"
        
        # Make max_limit requests
        for i in range(service.rate_limit_max):
            is_allowed, remaining = await service._check_rate_limit_db(user_id)
            assert is_allowed == True, f"Requête {i+1} devrait être autorisée"
        
        # Next request should be blocked
        is_allowed, remaining = await service._check_rate_limit_db(user_id)
        
        assert is_allowed == False, "Requête au-delà de la limite devrait être bloquée"
        assert remaining == 0, f"Remaining devrait être 0, reçu {remaining}"
        
        print(f"✅ Test passed: Rate limit blocks after {service.rate_limit_max} requests")
    
    @pytest.mark.asyncio
    async def test_rate_limit_distributed(self):
        """Test que le rate limiting fonctionne entre plusieurs instances"""
        service1 = ChatbotFunctionCallingService()
        service2 = ChatbotFunctionCallingService()
        user_id = f"test-user-distributed-{datetime.now().timestamp()}"
        
        # Make 5 requests from service1
        for _ in range(5):
            await service1._check_rate_limit_db(user_id)
        
        # Make 5 requests from service2
        for _ in range(5):
            await service2._check_rate_limit_db(user_id)
        
        # Next request from either service should be blocked
        is_allowed1, _ = await service1._check_rate_limit_db(user_id)
        is_allowed2, _ = await service2._check_rate_limit_db(user_id)
        
        assert is_allowed1 == False, "Service1 devrait être bloqué"
        assert is_allowed2 == False, "Service2 devrait être bloqué"
        
        print("✅ Test passed: Rate limiting works across multiple instances")
    
    @pytest.mark.asyncio
    async def test_cleanup_old_records(self):
        """Test que le cleanup supprime les anciens enregistrements"""
        service = ChatbotFunctionCallingService()
        
        # Run cleanup
        await service._cleanup_old_rate_limits()
        
        # Verify (just check it doesn't crash)
        print("✅ Test passed: Cleanup executed without errors")


@pytest.mark.integration
class TestChatbotEndToEnd:
    """Tests end-to-end avec vraie DB"""
    
    @pytest.mark.asyncio
    async def test_full_conversation_flow(self):
        """Test un flux de conversation complet avec persistance"""
        service = ChatbotFunctionCallingService()
        user_id = f"test-user-e2e-{datetime.now().timestamp()}"
        
        # Simulate conversation
        messages = [
            "Bonjour",
            "Où est mon colis #123 ?",
            "Merci"
        ]
        
        for msg in messages:
            # Save user message
            await service._save_to_db(user_id, "user", msg)
            
            # Simulate assistant response
            response = f"Réponse à: {msg}"
            await service._save_to_db(user_id, "assistant", response)
        
        # Load full history
        history = await service._load_from_db(user_id, limit=10)
        
        # Verify
        assert len(history) == 6, f"Devrait avoir 6 messages (3 user + 3 assistant), reçu {len(history)}"
        assert history[0]["content"] == "Bonjour", "Premier message incorrect"
        assert history[-1]["content"] == "Réponse à: Merci", "Dernier message incorrect"
        
        print(f"✅ Test passed: Full conversation flow with {len(history)} messages")


# Helper function to run all tests
def run_integration_tests():
    """Run all integration tests"""
    pytest.main([__file__, "-v", "-m", "integration"])


if __name__ == "__main__":
    run_integration_tests()
