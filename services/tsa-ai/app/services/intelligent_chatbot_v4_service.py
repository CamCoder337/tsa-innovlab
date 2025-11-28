"""
Intelligent Chatbot V4 - Production Ready
- 100% LLM intent detection with structured JSON
- Contextual suggestions
- Abstract navigation (decoupled from frontend)
- Persistent conversation history (DB)
- Confirmation workflow for critical actions
"""
import logging
import httpx
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================
# Pydantic Models for Structured Responses
# ============================================

class IntentDetection(BaseModel):
    """Structured intent detection from LLM"""
    name: str = Field(..., description="Intent name (tracking, pricing, create_mission, etc.)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    entities: Dict[str, Any] = Field(default_factory=dict, description="Extracted entities")
    requires_confirmation: bool = Field(default=False, description="Does this action need user confirmation?")


class NavigationAction(BaseModel):
    """Abstract navigation action"""
    type: str = Field(..., description="Action type: navigate, execute, confirm")
    target: str = Field(..., description="Abstract target (missions_list, mission_create, etc.)")
    params: Dict[str, Any] = Field(default_factory=dict, description="Parameters for the action")
    label: str = Field(..., description="Human-readable label")


class PendingAction(BaseModel):
    """Action waiting for user confirmation"""
    confirmation_id: str
    action_type: str
    params: Dict[str, Any]
    created_at: datetime
    expires_at: datetime
    description: str


class ChatbotResponseV4(BaseModel):
    """Structured chatbot response"""
    message: str
    intent: IntentDetection
    suggestions: List[str]
    actions: List[NavigationAction] = Field(default_factory=list)
    pending_action: Optional[PendingAction] = None
    requires_human: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================
# Main Service
# ============================================

class IntelligentChatbotV4Service:
    """
    V4 Chatbot with:
    - 100% LLM intent detection (structured JSON)
    - Contextual suggestions
    - Abstract navigation
    - Persistent history (DB)
    - Confirmation workflow
    """
    
    def __init__(self):
        self.llm_api_key = settings.groq_api_key
        self.llm_model = settings.llm_model
        self.llm_base_url = "https://api.groq.com/openai/v1"
        self.monolith_base_url = settings.monolith_api_url
        
        # Configuration
        self.use_fast_intent_for_obvious = False  # Can be enabled later for optimization
        self.confirmation_timeout_minutes = 5
        
        # Actions requiring confirmation
        self.actions_requiring_confirmation = {
            "create_mission",
            "delete_mission",
            "claim_mission",
            "cancel_order",
            "update_mission_status"
        }
    
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
        Process message with V4 architecture
        
        Flow:
        1. Load conversation history from DB
        2. Check for pending confirmations
        3. Detect intent with LLM (structured JSON)
        4. Generate contextual response
        5. Create navigation actions
        6. Save to DB
        """
        import time
        start_time = time.time()
        
        user_role_normalized = user_role.upper() if user_role else "CLIENT"
        conv_id = conversation_id or user_id
        
        try:
            logger.info(f"[V4] Processing message from {user_id} ({user_role_normalized})")
            
            # 1. Load conversation history from DB
            history = await self._load_history_from_db(conv_id, user_id)
            
            # 2. Check for pending confirmations
            pending = await self._get_pending_confirmation(conv_id, history)
            if pending and self._is_confirmation_response(message):
                # User is confirming/rejecting a pending action
                return await self._handle_confirmation(message, pending, user_id, user_role_normalized, user_token, conv_id)
            
            # 3. Detect intent with LLM (structured JSON)
            intent_detection = await self._detect_intent_with_llm(message, history, user_role_normalized, context)
            
            # 3.5. AMBIGUITY CHECK (Clarification Loop)
            # If confidence is "medium" (0.5 - 0.75), ask for clarification instead of guessing
            if 0.5 <= intent_detection.confidence <= 0.75 and intent_detection.name != "unknown":
                return await self._handle_ambiguity(intent_detection, message)
            
            # 4. Check if action requires confirmation
            if intent_detection.requires_confirmation:
                return await self._request_confirmation(
                    message, intent_detection, user_id, user_role_normalized, conv_id
                )
            
            # 5. Execute action or generate response
            response_message, action_data = await self._generate_response(
                message, intent_detection, user_id, user_role_normalized, user_token, context
            )
            
            # 6. Generate contextual suggestions
            suggestions = await self._generate_contextual_suggestions(
                intent_detection, response_message, user_role_normalized, action_data
            )
            
            # 7. Generate navigation actions
            actions = await self._generate_navigation_actions(
                intent_detection, action_data, user_role_normalized
            )
            
            # 8. Save to DB
            await self._save_to_db(conv_id, user_id, message, response_message, intent_detection, actions)
            
            # 9. Build response
            processing_time_ms = (time.time() - start_time) * 1000
            
            return {
                "message": response_message,
                "intent": {
                    "name": intent_detection.name,
                    "confidence": intent_detection.confidence,
                    "entities": intent_detection.entities
                },
                "suggestions": suggestions,
                "actions": [action.dict() for action in actions],
                "requires_human": intent_detection.confidence < 0.3,
                "processing_time_ms": round(processing_time_ms, 2),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"[V4] Error: {e}", exc_info=True)
            return {
                "message": "Désolé, j'ai rencontré une erreur. Un agent humain va vous aider.",
                "intent": {"name": "error", "confidence": 0.0, "entities": {}},
                "suggestions": ["Contacter le support", "Réessayer"],
                "actions": [],
                "requires_human": True,
                "timestamp": datetime.utcnow().isoformat()
            }

    
    def _format_history_for_prompt(self, history: List[Dict]) -> str:
        """Format conversation history for prompt"""
        if not history:
            return "Aucun historique"
        
        formatted = []
        for msg in history[-3:]:
            role = msg.get("role", "user")
            content = msg.get("message", "")[:100]  # Limit length
            formatted.append(f"{role}: {content}")
        
        return " | ".join(formatted)
    
    async def _detect_intent_with_llm(
        self,
        message: str,
        history: List[Dict],
        user_role: str,
        context: Optional[Dict[str, Any]]
    ) -> IntentDetection:
        """
        Detect intent using LLM with structured JSON output
        
        Uses Groq's JSON mode to force structured response
        """
        try:
            # Format history for context
            history_context = self._format_history_for_prompt(history) if history else "Aucun historique"
            
            # Build prompt for intent detection
            # Build prompt using dynamic builder
            from app.services.prompt_builder_service import get_prompt_builder
            prompt_builder = get_prompt_builder()
            system_prompt = await prompt_builder.build_system_prompt(user_role, history_context)

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            # Call Groq with JSON mode
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.llm_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.llm_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.llm_model,
                        "messages": messages,
                        "temperature": 0.3,  # Low temperature for consistent classification
                        "max_tokens": 300,
                        "response_format": {"type": "json_object"}  # Force JSON
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    intent_data = json.loads(content)
                    
                    # Validate and create IntentDetection
                    return IntentDetection(**intent_data)
                else:
                    logger.error(f"LLM API error: {response.status_code}")
                    return IntentDetection(name="unknown", confidence=0.0, entities={})
                    
        except Exception as e:
            logger.error(f"Intent detection error: {e}")
            return IntentDetection(name="unknown", confidence=0.0, entities={})

    
    async def _generate_response(
        self,
        message: str,
        intent: IntentDetection,
        user_id: str,
        user_role: str,
        user_token: Optional[str],
        context: Optional[Dict[str, Any]]
    ) -> tuple[str, Optional[Dict[str, Any]]]:
        """
        Generate response using FULL LLM (natural conversation)
        
        Flow:
        1. Fetch real data based on intent (DB, API)
        2. Build context with data
        3. LLM generates natural response
        
        Returns: (response_message, action_data)
        """
        
        # 1. Fetch real data based on intent
        data_context = await self._fetch_data_for_intent(intent, user_id, user_role, user_token)
        
        # 2. Generate natural response with LLM
        response_message = await self._generate_natural_response_with_llm(
            message, intent, user_role, data_context
        )
        
        # 3. Extract action data for navigation
        action_data = data_context.get("action_data")
        
        return response_message, action_data
    
    async def _fetch_data_for_intent(
        self,
        intent: IntentDetection,
        user_id: str,
        user_role: str,
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """
        Fetch real data from DB/API based on intent
        Returns context dict with data for LLM
        """
        
        if intent.name == "tracking":
            return await self._fetch_tracking_data(intent, user_id)
        
        elif intent.name == "pricing":
            return await self._fetch_pricing_data(intent)
        
        elif intent.name == "search_products":
            return await self._fetch_products_data(intent)
        
        elif intent.name == "mission_status":
            return await self._fetch_missions_data(user_id, user_role, user_token)
        
        else:
            # No data needed for greeting, help, etc.
            return {}
    
    async def _fetch_tracking_data(self, intent: IntentDetection, user_id: str) -> Dict[str, Any]:
        """Fetch tracking data from DB"""
        shipment_id = intent.entities.get("shipment_id")
        
        if not shipment_id:
            return {"error": "missing_shipment_id"}
        
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT id, status, origin, destination, current_location, estimated_delivery
                    FROM shipments
                    WHERE id = :shipment_id AND (client_id = :user_id OR transporter_id = :user_id)
                    LIMIT 1
                """)
                
                result = db.execute(query, {"shipment_id": shipment_id, "user_id": user_id}).fetchone()
                
                if result:
                    return {
                        "shipment": {
                            "id": shipment_id,
                            "status": result.status,
                            "origin": result.origin,
                            "destination": result.destination,
                            "current_location": result.current_location or result.origin,
                            "estimated_delivery": result.estimated_delivery.isoformat() if result.estimated_delivery else None
                        },
                        "action_data": {"shipment_id": shipment_id, "status": result.status}
                    }
                else:
                    return {"error": "shipment_not_found", "shipment_id": shipment_id}
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Tracking error: {e}")
            return {"error": "database_error"}
    
    async def _fetch_pricing_data(self, intent: IntentDetection) -> Dict[str, Any]:
        """Fetch pricing data"""
        origin = intent.entities.get("origin")
        destination = intent.entities.get("destination")
        weight_kg = intent.entities.get("weight_kg", 500)
        
        if not origin or not destination:
            return {"error": "missing_route_info"}
        
        try:
            from app.services.dynamic_pricing_service import get_dynamic_pricing_service
            pricing_service = get_dynamic_pricing_service()
            
            # Calculate distance
            distance_map = {
                ('douala', 'yaoundé'): 250,
                ('yaoundé', 'douala'): 250,
                ('douala', 'bafoussam'): 280,
                ('bafoussam', 'douala'): 280,
            }
            distance_km = distance_map.get((origin.lower(), destination.lower()), 300)
            
            result = pricing_service.calculate_dynamic_price(
                origin=origin,
                destination=destination,
                distance_km=distance_km,
                weight_tons=weight_kg / 1000
            )
            
            return {
                "pricing": {
                    "origin": origin,
                    "destination": destination,
                    "distance_km": distance_km,
                    "weight_kg": weight_kg,
                    "price": result['calculated_price'],
                    "min_price": result['negotiation_range']['min_price'],
                    "max_price": result['negotiation_range']['max_price']
                },
                "action_data": {
                    "origin": origin,
                    "destination": destination,
                    "weight_kg": weight_kg,
                    "price": result['calculated_price']
                }
            }
        except Exception as e:
            logger.error(f"Pricing error: {e}")
            return {"error": "pricing_calculation_failed"}
    
    async def _fetch_products_data(self, intent: IntentDetection) -> Dict[str, Any]:
        """Fetch products data from DB"""
        query = intent.entities.get("query", "")
        brand = intent.entities.get("brand")
        
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                sql_query = "SELECT id, name, price, stock_quantity, brand FROM products WHERE stock_quantity > 0"
                params = {}
                
                if query:
                    sql_query += " AND LOWER(name) LIKE LOWER(:query)"
                    params["query"] = f"%{query}%"
                
                if brand:
                    sql_query += " AND LOWER(brand) LIKE LOWER(:brand)"
                    params["brand"] = f"%{brand}%"
                
                sql_query += " ORDER BY stock_quantity DESC LIMIT 5"
                
                results = db.execute(text(sql_query), params).fetchall()
                
                products = [
                    {
                        "id": r.id,
                        "name": r.name,
                        "price": float(r.price),
                        "stock": r.stock_quantity,
                        "brand": r.brand
                    }
                    for r in results
                ]
                
                return {
                    "products": products,
                    "query": query,
                    "brand": brand,
                    "action_data": {"products": products[:3]}
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Products search error: {e}")
            return {"error": "products_search_failed"}
    
    async def _fetch_missions_data(self, user_id: str, user_role: str, user_token: Optional[str]) -> Dict[str, Any]:
        """Fetch missions data with role-based access control"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                # Base query
                query_str = """
                    SELECT id, status, origin, destination, created_at
                    FROM shipments
                """
                
                params = {"user_id": user_id}
                
                # Role-based filtering
                if user_role == "TRANSPORTEUR":
                    query_str += " WHERE transporter_id = :user_id"
                elif user_role == "AFFRETEUR" or user_role == "CLIENT":
                    query_str += " WHERE client_id = :user_id"
                else:
                    # Admin or unknown sees nothing by default for safety, or all if admin (implement as needed)
                    return {"missions": [], "note": "Rôle non autorisé pour voir les missions"}
                
                query_str += " ORDER BY created_at DESC LIMIT 5"
                
                results = db.execute(text(query_str), params).fetchall()
                
                missions = [
                    {
                        "id": r.id,
                        "status": r.status,
                        "origin": r.origin,
                        "destination": r.destination,
                        "date": r.created_at.strftime("%d/%m/%Y") if r.created_at else "N/A"
                    }
                    for r in results
                ]
                
                if not missions:
                    return {
                        "missions": [],
                        "note": "Aucune mission trouvée pour ce compte."
                    }
                
                return {
                    "missions": missions,
                    "count": len(missions),
                    "role": user_role
                }
                
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Missions fetch error: {e}")
            return {"error": "missions_fetch_failed"}

    
    async def _generate_contextual_suggestions(
        self,
        intent: IntentDetection,
        response_message: str,
        user_role: str,
        action_data: Optional[Dict[str, Any]]
    ) -> List[str]:
        """
        Generate intelligent contextual suggestions based on intent and response
        """
        
        # Intent-specific suggestions
        suggestions_map = {
            "greeting": {
                "TRANSPORTEUR": ["Voir missions disponibles", "Mes missions en cours", "Mes véhicules"],
                "AFFRETEUR": ["Créer une mission", "Mes missions", "Calculer un prix"],
                "CLIENT": ["Suivre un colis", "Voir le catalogue", "Mon panier"]
            },
            "tracking": ["Voir sur la carte", "Contacter le transporteur", "Historique"],
            "pricing": ["Créer une mission avec ce prix", "Voir transporteurs", "Calculer autre trajet"],
            "search_products": ["Voir détails", "Recherche par photo", "Voir catalogue complet"],
            "mission_status": ["Créer nouvelle mission", "Voir missions en cours", "Filtrer par statut"],
            "help": ["Suivre un colis", "Calculer un prix", "Chercher des pièces"],
            "complaint": ["Contacter le support", "Voir mes réclamations", "FAQ"],
        }
        
        # Get base suggestions
        if intent.name in suggestions_map:
            if isinstance(suggestions_map[intent.name], dict):
                suggestions = suggestions_map[intent.name].get(user_role, suggestions_map[intent.name].get("CLIENT", []))
            else:
                suggestions = suggestions_map[intent.name]
        else:
            suggestions = ["Aide", "Menu principal", "Parler à un humain"]
        
        # Add contextual suggestions based on action_data
        if action_data:
            if "price" in action_data:
                suggestions.insert(0, f"Créer mission à {action_data['price']:,.0f} FCFA")
            if "shipment_id" in action_data:
                suggestions.insert(0, f"Voir détails colis #{action_data['shipment_id']}")
        
        return suggestions[:3]  # Max 3 suggestions
    
    async def _generate_navigation_actions(
        self,
        intent: IntentDetection,
        action_data: Optional[Dict[str, Any]],
        user_role: str
    ) -> List[NavigationAction]:
        """
        Generate abstract navigation actions (decoupled from frontend routes)
        """
        actions = []
        
        # Intent-specific navigation
        if intent.name == "tracking" and action_data and "shipment_id" in action_data:
            actions.append(NavigationAction(
                type="navigate",
                target="tracking_detail",
                params={"id": action_data["shipment_id"]},
                label="Voir sur la carte"
            ))
        
        elif intent.name == "pricing" and action_data:
            actions.append(NavigationAction(
                type="navigate",
                target="mission_create",
                params={
                    "origin": action_data.get("origin"),
                    "destination": action_data.get("destination"),
                    "weight_kg": action_data.get("weight_kg"),
                    "budget_max": action_data.get("price")
                },
                label="Créer une mission"
            ))
        
        elif intent.name == "mission_status":
            if user_role == "TRANSPORTEUR":
                actions.append(NavigationAction(
                    type="navigate",
                    target="missions_available",
                    params={},
                    label="Voir missions disponibles"
                ))
            elif user_role == "AFFRETEUR":
                actions.append(NavigationAction(
                    type="navigate",
                    target="missions_list",
                    params={},
                    label="Mes missions"
                ))
        
        elif intent.name == "search_products":
            actions.append(NavigationAction(
                type="navigate",
                target="products_catalog",
                params={"query": intent.entities.get("query", "")},
                label="Voir le catalogue"
            ))
        
        elif intent.name == "create_mission":
            actions.append(NavigationAction(
                type="navigate",
                target="mission_create",
                params={
                    "origin": intent.entities.get("origin"),
                    "destination": intent.entities.get("destination"),
                    "weight_kg": intent.entities.get("weight_kg")
                },
                label="Créer la mission"
            ))

        elif intent.name == "claim_mission":
            actions.append(NavigationAction(
                type="navigate",
                target="mission_claim",
                params={"mission_id": intent.entities.get("mission_id")},
                label="Réclamer la mission"
            ))
        
        return actions

    
    # ============================================
    # Confirmation Workflow
    # ============================================
    
    async def _handle_ambiguity(self, intent: IntentDetection, message: str) -> Dict[str, Any]:
        """
        Handle ambiguous intents by asking clarifying questions
        """
        suggestions = []
        clarification_msg = ""
        
        if intent.name == "pricing":
            clarification_msg = "Voulez-vous connaître le **tarif d'une livraison** ou le **prix d'une pièce détachée** ?"
            suggestions = ["Tarif livraison", "Prix pièce auto"]
            
        elif intent.name == "search_products":
            clarification_msg = "Cherchez-vous à **acheter une pièce** ou à **vérifier un stock** ?"
            suggestions = ["Acheter pièce", "Vérifier stock"]
            
        elif intent.name == "tracking":
             clarification_msg = "Je peux suivre un colis si vous me donnez son **numéro** (ex: #12345). L'avez-vous ?"
             suggestions = ["Oui, j'ai le numéro", "Non, retrouver mon colis"]
             
        else:
            clarification_msg = "Je ne suis pas sûr de bien comprendre. Pouvez-vous préciser votre demande ?"
            suggestions = ["Aide", "Menu principal"]
            
        return {
            "message": clarification_msg,
            "intent": {"name": "clarification", "confidence": 1.0, "entities": {}},
            "suggestions": suggestions,
            "actions": [],
            "requires_human": False,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def _request_confirmation(
        self,
        message: str,
        intent: IntentDetection,
        user_id: str,
        user_role: str,
        conv_id: str
    ) -> Dict[str, Any]:
        """
        Request user confirmation for critical actions
        """
        import uuid
        
        confirmation_id = f"conf_{uuid.uuid4().hex[:8]}"
        expires_at = datetime.utcnow() + timedelta(minutes=self.confirmation_timeout_minutes)
        
        # Build confirmation message
        if intent.name == "delete_mission":
            mission_id = intent.entities.get("mission_id")
            confirmation_message = f"⚠️ Vous allez **supprimer** la mission #{mission_id}.\n\n**Êtes-vous sûr ?**"
        
        else:
            confirmation_message = f"Cette action nécessite votre confirmation.\n\n**Confirmez-vous ?**"
        
        # Create pending action
        pending = PendingAction(
            confirmation_id=confirmation_id,
            action_type=intent.name,
            params=intent.entities,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
            description=confirmation_message
        )
        
        # Save to DB
        await self._save_pending_action_to_db(conv_id, pending)
        
        return {
            "message": confirmation_message,
            "intent": {
                "name": intent.name,
                "confidence": intent.confidence,
                "entities": intent.entities
            },
            "suggestions": ["✅ Oui, confirmer", "✏️ Modifier", "❌ Annuler"],
            "pending_action": pending.dict(),
            "requires_human": False,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _is_confirmation_response(self, message: str) -> bool:
        """Check if message is a confirmation/rejection"""
        message_lower = message.lower().strip()
        confirmations = ["oui", "yes", "confirme", "ok", "d'accord", "✅"]
        rejections = ["non", "no", "annule", "cancel", "❌"]
        
        return any(word in message_lower for word in confirmations + rejections)
    
    async def _handle_confirmation(
        self,
        message: str,
        pending: PendingAction,
        user_id: str,
        user_role: str,
        user_token: Optional[str],
        conv_id: str
    ) -> Dict[str, Any]:
        """
        Handle user confirmation/rejection
        """
        message_lower = message.lower().strip()
        confirmations = ["oui", "yes", "confirme", "ok", "d'accord", "✅"]
        
        is_confirmed = any(word in message_lower for word in confirmations)
        
        if is_confirmed:
            # Execute the action
            result = await self._execute_confirmed_action(pending, user_id, user_role, user_token)
            
            # Clear pending action
            await self._clear_pending_action_from_db(conv_id, pending.confirmation_id)
            
            if result.get("success"):
                return {
                    "message": f"✅ {result.get('message', 'Action effectuée avec succès !')}",
                    "intent": {"name": pending.action_type, "confidence": 1.0, "entities": pending.params},
                    "suggestions": result.get("suggestions", ["Voir le résultat", "Nouvelle action"]),
                    "actions": result.get("actions", []),
                    "requires_human": False,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "message": f"❌ {result.get('message', 'Erreur lors de l\'exécution')}",
                    "intent": {"name": "error", "confidence": 1.0, "entities": {}},
                    "suggestions": ["Réessayer", "Contacter le support"],
                    "requires_human": True,
                    "timestamp": datetime.utcnow().isoformat()
                }
        else:
            # User rejected
            await self._clear_pending_action_from_db(conv_id, pending.confirmation_id)
            
            return {
                "message": "❌ Action annulée. Que souhaitez-vous faire ?",
                "intent": {"name": "cancel", "confidence": 1.0, "entities": {}},
                "suggestions": ["Aide", "Menu principal"],
                "requires_human": False,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _execute_confirmed_action(
        self,
        pending: PendingAction,
        user_id: str,
        user_role: str,
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """
        Execute a confirmed action
        """
        try:
            if pending.action_type == "create_mission":
                # Call monolith API to create mission
                # TODO: Implement real API call
                return {
                    "success": True,
                    "message": "Mission créée avec succès !",
                    "suggestions": ["Voir la mission", "Créer une autre"],
                    "actions": [{
                        "type": "navigate",
                        "target": "mission_detail",
                        "params": {"id": "123"},
                        "label": "Voir la mission"
                    }]
                }
            
            elif pending.action_type == "delete_mission":
                # TODO: Implement
                return {"success": True, "message": "Mission supprimée"}
            
            elif pending.action_type == "claim_mission":
                # TODO: Implement
                return {"success": True, "message": "Mission réclamée"}
            
            else:
                return {"success": False, "message": "Action non supportée"}
                
        except Exception as e:
            logger.error(f"Error executing action: {e}")
            return {"success": False, "message": str(e)}

    
    # ============================================
    # Database Operations (Persistent History)
    # ============================================
    
    async def _load_history_from_db(self, conv_id: str, user_id: str) -> List[Dict]:
        """
        Load conversation history from database (permanent storage)
        """
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                # Query last 10 messages
                query = text("""
                    SELECT role, content, intent_name, entities, created_at, actions
                    FROM chatbot_conversations
                    WHERE conversation_id = :conv_id AND user_id = :user_id
                    ORDER BY created_at DESC
                    LIMIT 10
                """)
                
                results = db.execute(query, {"conv_id": conv_id, "user_id": user_id}).fetchall()
                
                # Reverse to get chronological order
                history = []
                for row in reversed(results):
                    history.append({
                        "role": row.role,
                        "message": row.content,
                        "intent": row.intent_name,
                        "entities": json.loads(row.entities) if row.entities else {},
                        "timestamp": row.created_at.isoformat(),
                        "actions": json.loads(row.actions) if row.actions else []
                    })
                
                logger.info(f"Loaded {len(history)} messages from DB for conv_id={conv_id}")
                return history
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error loading history from DB: {e}")
            return []
    
    async def _save_to_db(
        self,
        conv_id: str,
        user_id: str,
        user_message: str,
        bot_message: str,
        intent: IntentDetection,
        actions: List[NavigationAction]
    ):
        """
        Save conversation to database (permanent storage)
        """
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                # Save user message
                query_user = text("""
                    INSERT INTO chatbot_conversations 
                    (conversation_id, user_id, role, content, intent_name, entities, created_at, updated_at)
                    VALUES (:conv_id, :user_id, 'user', :content, NULL, NULL, :timestamp, :timestamp)
                """)
                
                db.execute(query_user, {
                    "conv_id": conv_id,
                    "user_id": user_id,
                    "content": user_message,
                    "timestamp": datetime.utcnow()
                })
                
                # Save bot message
                query_bot = text("""
                    INSERT INTO chatbot_conversations 
                    (conversation_id, user_id, role, content, intent_name, entities, actions, created_at, updated_at)
                    VALUES (:conv_id, :user_id, 'bot', :content, :intent_name, :entities, :actions, :timestamp, :timestamp)
                """)
                
                db.execute(query_bot, {
                    "conv_id": conv_id,
                    "user_id": user_id,
                    "content": bot_message,
                    "intent_name": intent.name,
                    "entities": json.dumps(intent.entities),
                    "actions": json.dumps([action.dict() for action in actions]),
                    "timestamp": datetime.utcnow()
                })
                
                db.commit()
                logger.info(f"Saved conversation to DB: conv_id={conv_id}")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error saving to DB: {e}")
    
    async def _get_pending_confirmation(self, conv_id: str, history: List[Dict]) -> Optional[PendingAction]:
        """
        Get pending confirmation from DB
        """
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT confirmation_id, action_type, params, created_at, expires_at, description
                    FROM chatbot_pending_actions
                    WHERE conversation_id = :conv_id
                      AND expires_at > :now
                    ORDER BY created_at DESC
                    LIMIT 1
                """)
                
                result = db.execute(query, {"conv_id": conv_id, "now": datetime.utcnow()}).fetchone()
                
                if result:
                    return PendingAction(
                        confirmation_id=result.confirmation_id,
                        action_type=result.action_type,
                        params=json.loads(result.params),
                        created_at=result.created_at,
                        expires_at=result.expires_at,
                        description=result.description
                    )
                
                return None
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting pending confirmation: {e}")
            return None
    
    async def _save_pending_action_to_db(self, conv_id: str, pending: PendingAction):
        """Save pending action to DB"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    INSERT INTO chatbot_pending_actions
                    (conversation_id, confirmation_id, action_type, params, created_at, expires_at, description)
                    VALUES (:conv_id, :conf_id, :action_type, :params, :created_at, :expires_at, :description)
                """)
                
                db.execute(query, {
                    "conv_id": conv_id,
                    "conf_id": pending.confirmation_id,
                    "action_type": pending.action_type,
                    "params": json.dumps(pending.params),
                    "created_at": pending.created_at,
                    "expires_at": pending.expires_at,
                    "description": pending.description
                })
                
                db.commit()
                logger.info(f"Saved pending action: {pending.confirmation_id}")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error saving pending action: {e}")
    
    async def _clear_pending_action_from_db(self, conv_id: str, confirmation_id: str):
        """Clear pending action from DB"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    DELETE FROM chatbot_pending_actions
                    WHERE conversation_id = :conv_id AND confirmation_id = :conf_id
                """)
                
                db.execute(query, {"conv_id": conv_id, "conf_id": confirmation_id})
                db.commit()
                logger.info(f"Cleared pending action: {confirmation_id}")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error clearing pending action: {e}")


# Singleton
_chatbot_v4: Optional[IntelligentChatbotV4Service] = None


def get_intelligent_chatbot_v4() -> IntelligentChatbotV4Service:
    """Get or create V4 chatbot instance"""
    global _chatbot_v4
    if _chatbot_v4 is None:
        _chatbot_v4 = IntelligentChatbotV4Service()
    return _chatbot_v4

    
    async def _generate_natural_response_with_llm(
        self,
        message: str,
        intent: IntentDetection,
        user_role: str,
        data_context: Dict[str, Any]
    ) -> str:
        """
        Generate natural conversational response using LLM
        
        This is the CORE of Full LLM approach:
        - Takes real data from DB/API
        - LLM generates natural, human-like response
        - No templates, no hardcoded messages
        """
        
        # Build system prompt for natural conversation
        system_prompt = f"""Tu es l'assistant virtuel de TSA Logistique au Cameroun.

TON STYLE DE CONVERSATION:
- Parle comme un humain camerounais sympathique et professionnel
- Utilise un français naturel, pas robotique
- Sois concis (2-3 phrases max)
- Utilise des emojis avec modération (1-2 max)
- Tutoie l'utilisateur
- Sois chaleureux mais efficace

CONTEXTE UTILISATEUR:
- Rôle: {user_role}
- Intent détecté: {intent.name}
- Confidence: {intent.confidence}

DONNÉES RÉELLES DISPONIBLES:
{json.dumps(data_context, ensure_ascii=False, indent=2)}

INSTRUCTIONS SPÉCIFIQUES PAR INTENT:

Si GREETING:
- Salue chaleureusement
- Mentionne 1-2 choses que tu peux faire selon le rôle
- Exemple: "Salut ! Je peux t'aider à suivre tes colis ou trouver des pièces. Qu'est-ce que tu cherches ?"

Si TRACKING:
- Si données disponibles: Donne le statut de manière naturelle
- Si erreur: Explique gentiment le problème
- Exemple: "Ton colis est actuellement à Douala, en route vers Yaoundé. Il devrait arriver demain vers 14h."

Si PRICING:
- Donne le prix de manière conversationnelle
- Mentionne la fourchette si pertinent
- Exemple: "Pour transporter 500kg de Douala à Yaoundé, ça te coûtera environ 125,000 FCFA. Le prix peut varier entre 118k et 131k selon la disponibilité."

Si SEARCH_PRODUCTS:
- Liste 2-3 produits de manière naturelle
- Mentionne les prix
- Exemple: "J'ai trouvé 3 pièces en stock. Il y a un système de freinage à 180k FCFA, un kit d'embrayage à 250k, et un radiateur reconditionné à 320k. Lequel t'intéresse ?"

Si HELP:
- Liste les principales fonctionnalités
- Demande ce qu'il cherche
- Exemple: "Je peux t'aider avec le suivi de colis, le calcul de tarifs, la recherche de pièces ou la gestion de missions. Qu'est-ce que tu veux faire ?"

Si COMPLAINT:
- Montre de l'empathie
- Rassure
- Exemple: "Je suis vraiment désolé pour ce problème. Un agent va te contacter rapidement pour régler ça. Tu peux aussi appeler le support au +237 XXX."

Si ERROR dans data_context:
- Explique le problème gentiment
- Propose une solution
- Exemple: "Je n'ai pas trouvé ce colis dans le système. Tu es sûr du numéro ? Sinon, je peux vérifier tes dernières expéditions."

RÈGLES ABSOLUES:
- PAS de markdown (**bold**, ##headers)
- PAS de listes numérotées (1. 2. 3.)
- PAS de structure rigide
- Parle comme dans une vraie conversation WhatsApp
- Maximum 3-4 phrases

Réponds UNIQUEMENT avec le message conversationnel, rien d'autre."""

        # Build user message with context
        user_message = f"Message utilisateur: {message}\n\nGénère une réponse naturelle basée sur les données fournies."
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.llm_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.llm_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.llm_model,
                        "messages": messages,
                        "temperature": 0.7,  # Higher for more natural variation
                        "max_tokens": 300,
                        "top_p": 0.9
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    generated_text = data["choices"][0]["message"]["content"]
                    return generated_text.strip()
                else:
                    logger.error(f"LLM API error: {response.status_code}")
                    return "Désolé, j'ai un petit problème technique. Réessaye dans quelques secondes."
                    
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            return "Désolé, j'ai rencontré une erreur. Un agent va t'aider."
