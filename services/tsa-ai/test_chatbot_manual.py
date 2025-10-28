"""
Manual test script for chatbot
Run with: python test_chatbot_manual.py
"""
import asyncio
from app.services.chatbot_service import ChatbotService
from app.utils.intent_classifier import IntentClassifier


async def test_chatbot():
    """Test chatbot with various messages"""
    
    print("=" * 60)
    print("CHATBOT MANUAL TEST")
    print("=" * 60)
    
    service = ChatbotService()
    classifier = IntentClassifier()
    
    test_messages = [
        ("Bonjour", "CLIENT"),
        ("Où est mon colis #12345?", "CLIENT"),
        ("Combien coûte de Douala à Yaoundé pour 500kg?", "AFFRETEUR"),
        ("Pièces pour Volvo", "CLIENT"),
        ("Missions disponibles", "TRANSPORTEUR"),
        ("Aide", "CLIENT"),
        ("xyzabc random", "CLIENT"),
    ]
    
    for message, role in test_messages:
        print(f"\n{'=' * 60}")
        print(f"USER ({role}): {message}")
        print("-" * 60)
        
        # Test intent classification
        intent, confidence, entities = classifier.classify(message)
        print(f"Intent: {intent} (confidence: {confidence:.2f})")
        if entities:
            print(f"Entities: {entities}")
        
        # Test chatbot response
        response = await service.process_message(
            message=message,
            user_id="test_user_123",
            user_role=role
        )
        
        print(f"\nBOT: {response.message}")
        
        if response.suggestions:
            print(f"\nSuggestions:")
            for i, suggestion in enumerate(response.suggestions, 1):
                print(f"  {i}. {suggestion}")
        
        if response.data:
            print(f"\nData: {response.data}")
        
        if response.requires_human:
            print("\n⚠️  Requires human intervention")
    
    print(f"\n{'=' * 60}")
    print("TEST COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_chatbot())
