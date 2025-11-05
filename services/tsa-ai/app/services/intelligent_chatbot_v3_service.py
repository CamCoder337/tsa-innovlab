"""
Intelligent Chatbot Service V3 - Intent-First Architecture
Architecture améliorée avec séparation intent detection / action / response
"""
import logging
import time
from typing import Dict, Any, Optional

from app.services.intent_detector import get_intent_detector, IntentType, ActionType
from app.services.response_generator import get_response_generator
from app.services.context_enrichment_service import get_context_service
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


class IntelligentChatbotV3Service:
    """
    Chatbot V3 avec architecture Intent-First
    
    Flow:
    1. Detect Intent → Détermine ce que l'utilisateur veut
    2. Route Action → Navigation, Function Call, ou Direct Response
    3. Generate Response → Réponse naturelle orientée frontend
    """
    
    def __init__(self):
        self.intent_detector = get_intent_detector()
        self.response_generator = get_response_generator()
        # Import du service V2 pour les function calls
        from app.services.intelligent_chatbot_service import get_intelligent_chatbot
        self.chatbot_v2 = get_intelligent_chatbot()
    
    async def process_message(
        self,
        message: str,
        user_id: str,
        user_role: Optional[str] = None,
        user_token: Optional[str] = None,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process user message with intent-first architecture
        """
        start_time = time.time()
        
        try:
            # Normaliser le rôle
            user_role_normalized = user_role.upper() if user_role else "CLIENT"
            
            logger.info(f"[V3] Processing message from {user_id} ({user_role_normalized}): {message[:50]}...")
            
            # Enrichir le contexte
            if not context:
                context = {}
            
            db = SessionLocal()
            try:
                context_service = get_context_service()
                enriched_context = await context_service.enrich_user_context(
                    user_id, user_role_normalized, db
                )
                context.update(enriched_context)
            finally:
                db.close()
            
            # Extraire le nom utilisateur
            user_name = "Utilisateur"
            if context.get("user_info"):
                user_name = context["user_info"].get("name", "Utilisateur")
            
            # 1. DETECT INTENT
            intent_result = await self.intent_detector.detect_intent(
                message, user_role_normalized, context
            )
            
            intent = intent_result["intent"]
            action = intent_result["action"]
            
            logger.info(f"[V3] Intent: {intent}, Action: {action}")
            
            # 2. ROUTE ACTION
            if action == ActionType.NAVIGATE:
                # Guide vers le frontend
                response = self.response_generator.generate_navigation_response(
                    intent,
                    intent_result.get("route", {}),
                    user_name,
                    user_role_normalized
                )
            
            elif action == ActionType.FUNCTION_CALL:
                # Appeler une fonction
                function_info = intent_result.get("function", {})
                
                # Vérifier les paramètres manquants
                if function_info.get("missing_parameters"):
                    response = self.response_generator.generate_missing_params_response(
                        intent,
                        function_info["missing_parameters"]
                    )
                else:
                    # Appeler la fonction via le service V2
                    function_result = await self.chatbot_v2._execute_function(
                        function_info["name"],
                        function_info["parameters"],
                        user_id,
                        user_role_normalized,
                        user_token
                    )
                    
                    # Générer la réponse
                    response = self.response_generator.generate_function_response(
                        intent,
                        function_result,
                        user_name
                    )
            
            elif action == ActionType.DIRECT_RESPONSE:
                # Réponse directe
                if intent == IntentType.GREETING:
                    response = self.response_generator.generate_greeting_response(
                        user_name, user_role_normalized, context
                    )
                elif intent == IntentType.HELP:
                    response = self.response_generator.generate_help_response(
                        user_role_normalized
                    )
                else:
                    # Intent inconnu → Fallback vers V2
                    logger.info("[V3] Unknown intent, falling back to V2")
                    return await self.chatbot_v2.process_message(
                        message, user_id, user_role, user_token, conversation_id, context
                    )
            
            else:
                # Fallback vers V2
                logger.warning(f"[V3] Unhandled action type: {action}, falling back to V2")
                return await self.chatbot_v2.process_message(
                    message, user_id, user_role, user_token, conversation_id, context
                )
            
            # 3. SAVE TO HISTORY
            conv_id = conversation_id or user_id
            await self._save_to_history(conv_id, message, response["message"])
            
            # 4. ADD METADATA
            response_time_ms = (time.time() - start_time) * 1000
            
            response.update({
                "intent": {
                    "name": intent.value,
                    "confidence": intent_result.get("confidence", 0.0),
                    "entities": intent_result.get("entities", {})
                },
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            })
            
            # Log metrics
            await self._log_metrics(
                user_id, user_role_normalized, message,
                intent.value, response_time_ms, True, response.get("requires_human", False)
            )
            
            logger.info(f"[V3] Response generated in {response_time_ms:.2f}ms")
            
            return response
        
        except Exception as e:
            logger.error(f"[V3] Error processing message: {e}", exc_info=True)
            
            # Fallback vers V2 en cas d'erreur
            logger.info("[V3] Error occurred, falling back to V2")
            return await self.chatbot_v2.process_message(
                message, user_id, user_role, user_token, conversation_id, context
            )
    
    async def _save_to_history(self, conversation_id: str, user_message: str, bot_message: str):
        """Save conversation to history"""
        try:
            from app.services.chatbot_service import get_chatbot_service
            chatbot_service = get_chatbot_service()
            
            # Save user message
            await chatbot_service.save_message(conversation_id, "user", user_message)
            
            # Save bot response
            await chatbot_service.save_message(conversation_id, "bot", bot_message)
        except Exception as e:
            logger.error(f"Error saving to history: {e}")
    
    async def _log_metrics(
        self,
        user_id: str,
        user_role: str,
        message: str,
        intent: str,
        response_time_ms: float,
        success: bool,
        requires_human: bool
    ):
        """Log metrics"""
        try:
            from app.services.chatbot_metrics import get_metrics
            metrics = get_metrics()
            await metrics.log_interaction(
                user_id, user_role, message, intent,
                response_time_ms, success, requires_human, None
            )
        except Exception as e:
            logger.error(f"Error logging metrics: {e}")


# Singleton
_chatbot_v3: Optional[IntelligentChatbotV3Service] = None


def get_intelligent_chatbot_v3() -> IntelligentChatbotV3Service:
    """Get or create intelligent chatbot V3"""
    global _chatbot_v3
    if _chatbot_v3 is None:
        _chatbot_v3 = IntelligentChatbotV3Service()
    return _chatbot_v3
