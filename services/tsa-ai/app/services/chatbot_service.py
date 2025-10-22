"""
Chatbot Service
Handles intent detection, response generation, and integration with other services
"""
import logging
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.utils.intent_classifier import IntentClassifier
from app.schemas.chatbot import ChatbotResponse, Intent
from app.core.config import settings

logger = logging.getLogger(__name__)


class ChatbotService:
    """
    Main chatbot service
    Coordinates intent detection and response generation
    """
    
    def __init__(self):
        self.classifier = IntentClassifier()
        self.monolith_base_url = settings.monolith_api_url
        self.conversation_history: Dict[str, List[Dict]] = {}  # Simple in-memory storage
    
    async def process_message(
        self,
        message: str,
        user_id: str,
        user_role: Optional[str] = None,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> ChatbotResponse:
        """
        Process user message and generate response
        """
        try:
            # Classify intent
            intent_name, confidence, entities = self.classifier.classify(message)
            
            logger.info(f"Intent detected: {intent_name} (confidence: {confidence:.2f})")
            logger.info(f"Entities: {entities}")
            
            # Store in conversation history
            self._add_to_history(conversation_id or user_id, {
                "role": "user",
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Generate response based on intent
            response = await self._handle_intent(
                intent_name=intent_name,
                confidence=confidence,
                entities=entities,
                user_id=user_id,
                user_role=user_role,
                context=context
            )
            
            # Store bot response in history
            self._add_to_history(conversation_id or user_id, {
                "role": "bot",
                "message": response.message,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return ChatbotResponse(
                message="Désolé, j'ai rencontré une erreur. Un agent humain va vous aider.",
                requires_human=True
            )
    
    async def _handle_intent(
        self,
        intent_name: str,
        confidence: float,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        context: Optional[Dict[str, Any]]
    ) -> ChatbotResponse:
        """Route to appropriate handler based on intent"""
        
        handlers = {
            "tracking": self._handle_tracking,
            "pricing": self._handle_pricing,
            "products": self._handle_products,
            "mission_status": self._handle_mission_status,
            "help": self._handle_help,
            "greeting": self._handle_greeting,
            "unknown": self._handle_unknown,
        }
        
        handler = handlers.get(intent_name, self._handle_unknown)
        return await handler(entities, user_id, user_role, confidence)
    
    async def _handle_tracking(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle tracking intent"""
        
        shipment_id = entities.get('id')
        
        if not shipment_id:
            return ChatbotResponse(
                message="Pour suivre votre colis, merci de me fournir le numéro de suivi (ex: #12345)",
                intent=Intent(name="tracking", confidence=confidence, entities=entities),
                suggestions=[
                    "Voir mes colis en cours",
                    "Historique de livraisons"
                ]
            )
        
        # TODO: Call monolith API for tracking info
        # For now, return mock response
        return ChatbotResponse(
            message=f"🚚 Colis #{shipment_id} est en transit.\n"
                   f"📍 Position actuelle: Douala\n"
                   f"⏱️ Livraison estimée: 2 heures\n"
                   f"👤 Transporteur: Jean Dupont",
            intent=Intent(name="tracking", confidence=confidence, entities=entities),
            suggestions=[
                "Voir sur la carte",
                "Contacter le transporteur",
                "Historique complet"
            ],
            data={
                "shipment_id": shipment_id,
                "status": "in_transit",
                "location": "Douala",
                "eta_minutes": 120
            }
        )
    
    async def _handle_pricing(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle pricing intent"""
        
        origin = entities.get('origin')
        destination = entities.get('destination')
        weight = entities.get('weight', 1.0)
        
        if not origin or not destination:
            return ChatbotResponse(
                message="Pour calculer un tarif, j'ai besoin de:\n"
                       "• Ville de départ\n"
                       "• Ville d'arrivée\n"
                       "• Poids (optionnel)\n\n"
                       "Exemple: 'Combien coûte de Douala à Yaoundé pour 500kg ?'",
                intent=Intent(name="pricing", confidence=confidence, entities=entities),
                suggestions=[
                    "Douala → Yaoundé",
                    "Yaoundé → Bafoussam",
                    "Voir grille tarifaire"
                ]
            )
        
        # Call pricing service (already in tsa-ai)
        try:
            from app.services.dynamic_pricing_service import get_dynamic_pricing_service
            pricing_service = get_dynamic_pricing_service()
            
            # Estimate distance (mock for now)
            distance_km = 250  # Mock distance
            
            result = pricing_service.calculate_dynamic_price(
                origin=origin,
                destination=destination,
                distance_km=distance_km,
                weight_tons=weight / 1000,
                cargo_type="general",
                urgency="standard"
            )
            
            return ChatbotResponse(
                message=f"💰 Estimation de prix:\n"
                       f"📍 {origin} → {destination}\n"
                       f"📦 Poids: {weight}kg\n"
                       f"💵 Prix: {result['calculated_price']:,.0f} FCFA\n"
                       f"📊 Marge de négociation: {result['negotiation_range']['min_price']:,.0f} - {result['negotiation_range']['max_price']:,.0f} FCFA",
                intent=Intent(name="pricing", confidence=confidence, entities=entities),
                suggestions=[
                    "Créer une mission",
                    "Voir les transporteurs disponibles",
                    "Modifier le poids"
                ],
                data=result
            )
            
        except Exception as e:
            logger.error(f"Pricing calculation error: {e}")
            return ChatbotResponse(
                message="Désolé, je n'ai pas pu calculer le prix. Veuillez réessayer.",
                intent=Intent(name="pricing", confidence=confidence, entities=entities),
                requires_human=True
            )
    
    async def _handle_products(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle products search intent"""
        
        brand = entities.get('brand')
        category = entities.get('category')
        
        filters = []
        if brand:
            filters.append(f"Marque: {brand}")
        if category:
            filters.append(f"Catégorie: {category}")
        
        filter_text = " | ".join(filters) if filters else "Tous les produits"
        
        # TODO: Call monolith API for products
        # For now, return mock response
        return ChatbotResponse(
            message=f"🔧 Recherche de pièces reconditionnées\n"
                   f"🔍 Filtres: {filter_text}\n\n"
                   f"Voici quelques résultats:\n"
                   f"1. Moteur Volvo D13 - 450 000 FCFA\n"
                   f"2. Boîte de vitesses Mercedes - 320 000 FCFA\n"
                   f"3. Système de freinage complet - 180 000 FCFA",
            intent=Intent(name="products", confidence=confidence, entities=entities),
            suggestions=[
                "Voir plus de détails",
                "Ajouter au panier",
                "Recherche par photo"
            ],
            data={
                "filters": entities,
                "results_count": 3
            }
        )
    
    async def _handle_mission_status(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle mission status intent"""
        
        if user_role == "TRANSPORTEUR":
            message = "🚛 Missions disponibles:\n\n" \
                     "1. Douala → Yaoundé | 150 000 FCFA | 500kg\n" \
                     "2. Yaoundé → Bafoussam | 80 000 FCFA | 300kg\n" \
                     "3. Douala → Garoua | 250 000 FCFA | 1000kg"
            suggestions = ["Voir détails mission #1", "Réclamer une mission", "Mes missions en cours"]
        
        elif user_role == "AFFRETEUR":
            message = "📦 Vos missions:\n\n" \
                     "• 2 missions en cours\n" \
                     "• 1 mission en attente de transporteur\n" \
                     "• 5 missions terminées ce mois"
            suggestions = ["Créer nouvelle mission", "Voir missions en cours", "Historique"]
        
        else:
            message = "Pour voir vos missions, veuillez vous connecter en tant qu'Affréteur ou Transporteur."
            suggestions = ["Se connecter", "En savoir plus"]
        
        return ChatbotResponse(
            message=message,
            intent=Intent(name="mission_status", confidence=confidence, entities=entities),
            suggestions=suggestions
        )
    
    async def _handle_help(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle help intent"""
        
        return ChatbotResponse(
            message="👋 Je suis l'assistant TSA Logistique !\n\n"
                   "Je peux vous aider avec:\n"
                   "🚚 Suivi de colis (ex: 'Où est mon colis #123')\n"
                   "💰 Calcul de tarifs (ex: 'Prix Douala Yaoundé')\n"
                   "🔧 Recherche de pièces (ex: 'Pièces pour Volvo')\n"
                   "📋 Gestion de missions\n\n"
                   "Que puis-je faire pour vous ?",
            intent=Intent(name="help", confidence=confidence, entities=entities),
            suggestions=[
                "Suivre un colis",
                "Calculer un prix",
                "Chercher des pièces",
                "Voir mes missions"
            ]
        )
    
    async def _handle_greeting(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle greeting intent"""
        
        return ChatbotResponse(
            message="👋 Bonjour ! Je suis votre assistant TSA Logistique.\n"
                   "Comment puis-je vous aider aujourd'hui ?",
            intent=Intent(name="greeting", confidence=confidence, entities=entities),
            suggestions=[
                "Suivre un colis",
                "Calculer un tarif",
                "Voir les pièces disponibles",
                "Aide"
            ]
        )
    
    async def _handle_unknown(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle unknown intent"""
        
        return ChatbotResponse(
            message="🤔 Je n'ai pas bien compris votre demande.\n\n"
                   "Je peux vous aider avec:\n"
                   "• Suivi de colis\n"
                   "• Calcul de tarifs\n"
                   "• Recherche de pièces\n"
                   "• Gestion de missions\n\n"
                   "Pouvez-vous reformuler ?",
            intent=Intent(name="unknown", confidence=confidence, entities=entities),
            suggestions=[
                "Suivre un colis",
                "Calculer un prix",
                "Voir le catalogue",
                "Parler à un humain"
            ],
            requires_human=confidence < 0.5
        )
    
    def _add_to_history(self, conversation_id: str, message: Dict[str, Any]):
        """Add message to conversation history"""
        if conversation_id not in self.conversation_history:
            self.conversation_history[conversation_id] = []
        
        self.conversation_history[conversation_id].append(message)
        
        # Keep only last 20 messages
        if len(self.conversation_history[conversation_id]) > 20:
            self.conversation_history[conversation_id] = self.conversation_history[conversation_id][-20:]
    
    def get_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history"""
        return self.conversation_history.get(conversation_id, [])


# Singleton instance
_chatbot_service: Optional[ChatbotService] = None


def get_chatbot_service() -> ChatbotService:
    """Get or create chatbot service instance"""
    global _chatbot_service
    if _chatbot_service is None:
        _chatbot_service = ChatbotService()
    return _chatbot_service
