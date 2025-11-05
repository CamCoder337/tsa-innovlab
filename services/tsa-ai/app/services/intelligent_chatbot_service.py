"""
Intelligent Chatbot Service - LLM-First Architecture
Uses Groq LLM with function calling for intelligent responses and actions
"""
import logging
import httpx
import json
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime

from app.core.config import settings
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)


class IntelligentChatbotService:
    """
    LLM-First Chatbot with Function Calling
    
    Architecture:
    1. LLM analyzes user message and decides what to do
    2. LLM can call functions (track_shipment, calculate_price, etc.)
    3. LLM formats the response based on function results
    """
    
    def __init__(self):
        self.llm_service = get_llm_service(
            api_key=settings.groq_api_key,
            model=settings.llm_model
        )
        self.monolith_base_url = settings.monolith_api_url
        
        # Register available functions
        self.functions = self._register_functions()
        self.function_handlers = self._register_handlers()
    
    def _register_functions(self) -> List[Dict[str, Any]]:
        """
        Register functions that the LLM can call
        OpenAI-compatible function calling format
        """
        return [
            {
                "name": "track_shipment",
                "description": "Suivre un colis/mission par son ID. Retourne la position actuelle, le statut, l'ETA et les détails du transporteur.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "shipment_id": {
                            "type": "string",
                            "description": "ID du colis (ex: 123, #456, TSA-789)"
                        }
                    },
                    "required": ["shipment_id"]
                }
            },
            {
                "name": "calculate_price",
                "description": "Calculer le prix dynamique d'un transport. Utilise l'IA de pricing pour donner un tarif optimisé.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "origin": {
                            "type": "string",
                            "description": "Ville de départ (ex: Douala, Yaoundé)"
                        },
                        "destination": {
                            "type": "string",
                            "description": "Ville d'arrivée (ex: Yaoundé, Bafoussam)"
                        },
                        "weight_kg": {
                            "type": "number",
                            "description": "Poids en kilogrammes (ex: 500, 1000)"
                        },
                        "urgency": {
                            "type": "string",
                            "enum": ["standard", "express"],
                            "description": "Niveau d'urgence"
                        }
                    },
                    "required": ["origin", "destination", "weight_kg"]
                }
            },
            {
                "name": "search_products",
                "description": "Rechercher des pièces détachées dans le catalogue. Peut filtrer par marque, catégorie, prix.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Terme de recherche (ex: moteur, freins, Volvo)"
                        },
                        "brand": {
                            "type": "string",
                            "description": "Marque (ex: Volvo, Mercedes, Scania)"
                        },
                        "category": {
                            "type": "string",
                            "description": "Catégorie (ex: moteur, transmission, freins)"
                        },
                        "max_price": {
                            "type": "number",
                            "description": "Prix maximum en FCFA"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_user_missions",
                "description": "Récupérer les missions de l'utilisateur (créées si affréteur, disponibles si transporteur, toutes si admin).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["all", "draft", "published", "assigned", "in_progress", "completed"],
                            "description": "Filtrer par statut"
                        },
                        "limit": {
                            "type": "number",
                            "description": "Nombre de missions à retourner (max 10)"
                        }
                    }
                }
            },
            {
                "name": "create_mission",
                "description": "Créer une nouvelle mission de transport (réservé aux affréteurs).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "Titre de la mission"
                        },
                        "origin": {
                            "type": "string",
                            "description": "Ville de départ"
                        },
                        "destination": {
                            "type": "string",
                            "description": "Ville d'arrivée"
                        },
                        "weight_kg": {
                            "type": "number",
                            "description": "Poids en kg"
                        },
                        "merchandise_type": {
                            "type": "string",
                            "description": "Type de marchandise"
                        },
                        "budget_max": {
                            "type": "number",
                            "description": "Budget maximum en FCFA"
                        }
                    },
                    "required": ["title", "origin", "destination", "weight_kg", "merchandise_type"]
                }
            },
            {
                "name": "claim_mission",
                "description": "Réclamer une mission disponible (réservé aux transporteurs avec véhicule).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mission_id": {
                            "type": "string",
                            "description": "ID de la mission à réclamer"
                        },
                        "vehicle_id": {
                            "type": "string",
                            "description": "ID du véhicule à utiliser"
                        }
                    },
                    "required": ["mission_id", "vehicle_id"]
                }
            },
            {
                "name": "get_recommendations",
                "description": "Obtenir des recommandations personnalisées (produits pour clients, missions pour transporteurs).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": ["products", "missions"],
                            "description": "Type de recommandations"
                        },
                        "limit": {
                            "type": "number",
                            "description": "Nombre de recommandations"
                        }
                    },
                    "required": ["type"]
                }
            }
        ]
    
    def _register_handlers(self) -> Dict[str, Callable]:
        """Map function names to handler methods"""
        return {
            "track_shipment": self._handle_track_shipment,
            "calculate_price": self._handle_calculate_price,
            "search_products": self._handle_search_products,
            "get_user_missions": self._handle_get_user_missions,
            "create_mission": self._handle_create_mission,
            "claim_mission": self._handle_claim_mission,
            "get_recommendations": self._handle_get_recommendations,
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
        Process user message with LLM-first approach + context enrichment + history
        
        Flow:
        1. Enrich context with user data from DB
        2. Load conversation history
        3. LLM analyzes message and decides if function call is needed
        4. If yes, execute function and get results
        5. LLM formats final response with results
        6. Save to history and return
        """
        # ✅ METRICS: Start timer
        import time
        start_time = time.time()
        function_called = None
        success = True
        error_msg = None
        
        # ✅ NORMALISATION: Rôle en uppercase partout
        user_role_normalized = user_role.upper() if user_role else "CLIENT"
        
        # 🔍 DEBUG: Logger le rôle reçu
        logger.info(f"🔍 DEBUG ROLE - Input: user_role={user_role}")
        logger.info(f"🔍 DEBUG ROLE - Normalized: user_role_normalized={user_role_normalized}")
        
        try:
            logger.info(f"Processing message from {user_id} ({user_role_normalized}): {message[:50]}...")
            
            # ✅ ENRICHISSEMENT CONTEXTE: Récupérer données utilisateur de la DB
            from app.core.database import SessionLocal
            from app.services.context_enrichment_service import get_context_service
            
            db = SessionLocal()
            try:
                context_service = get_context_service()
                enriched_context = await context_service.enrich_user_context(
                    user_id, user_role_normalized, db
                )
                
                # Fusionner avec le contexte existant
                if context:
                    context.update(enriched_context)
                else:
                    context = enriched_context
                
                logger.info(f"Context enriched with: {list(context.keys())}")
                
                # 🔍 DEBUG: Logger le rôle depuis la DB
                if context and context.get("user_info"):
                    logger.info(f"🔍 DEBUG ROLE - From DB: {context['user_info'].get('role')}")
                    logger.info(f"🔍 DEBUG ROLE - User name: {context['user_info'].get('name')}")
            finally:
                db.close()
            
            # ✅ HISTORIQUE: Récupérer la conversation
            conv_id = conversation_id or user_id
            conversation_history = self.get_history(conv_id)
            logger.info(f"🔍 HISTORY: Loaded {len(conversation_history)} messages for conv_id={conv_id}")
            if conversation_history:
                logger.info(f"🔍 HISTORY: Last message: {conversation_history[-1]}")
            
            # Build system prompt with enriched context
            system_prompt = self._build_system_prompt(user_role_normalized, context)
            
            # 🔍 DEBUG: Logger le prompt système (premiers 500 caractères)
            logger.info(f"🔍 DEBUG ROLE - System prompt preview:\n{system_prompt[:500]}")
            
            # ✅ HISTORIQUE: Construire les messages avec historique
            messages = [{"role": "system", "content": system_prompt}]
            
            # ✅ FIX: Si historique existe, ajouter un séparateur clair
            if conversation_history:
                messages.append({
                    "role": "system",
                    "content": "=== DÉBUT DE L'HISTORIQUE DE CONVERSATION ==="
                })
            
            # Ajouter les 5 derniers messages de l'historique
            for msg in conversation_history[-5:]:
                role = "assistant" if msg.get("role") == "bot" else "user"
                content = msg.get("message", "")
                if content:  # Ignorer messages vides
                    messages.append({"role": role, "content": content})
            
            # ✅ FIX: Marquer la fin de l'historique
            if conversation_history:
                messages.append({
                    "role": "system",
                    "content": "=== FIN DE L'HISTORIQUE - MESSAGE ACTUEL CI-DESSOUS ==="
                })
            
            # Ajouter le message actuel
            messages.append({"role": "user", "content": message})
            
            # Call LLM with function calling
            llm_response = await self._call_llm_with_functions(messages)
            
            # ✅ ROBUSTESSE: Vérifier que la réponse LLM est valide
            if not llm_response or (not llm_response.get("function_call") and not llm_response.get("content")):
                logger.error("LLM returned invalid response")
                raise Exception("LLM returned empty or invalid response")
            
            # Check if LLM wants to call a function
            if llm_response.get("function_call"):
                function_name = llm_response["function_call"]["name"]
                function_called = function_name  # ✅ METRICS: Track function
                function_args = json.loads(llm_response["function_call"]["arguments"])
                
                logger.info(f"LLM requested function: {function_name} with args: {function_args}")
                
                # Execute the function
                function_result = await self._execute_function(
                    function_name,
                    function_args,
                    user_id,
                    user_role_normalized,
                    user_token
                )
                
                # ✅ ROBUSTESSE: Vérifier que la fonction a retourné un résultat
                if not function_result:
                    function_result = {"error": "La fonction n'a retourné aucun résultat"}
                
                # Add function result to conversation
                messages.append({
                    "role": "assistant",
                    "content": None,
                    "function_call": llm_response["function_call"]
                })
                messages.append({
                    "role": "function",
                    "name": function_name,
                    "content": json.dumps(function_result, ensure_ascii=False)
                })
                
                # Second LLM call: Format response with function results
                final_response = await self._call_llm_with_functions(messages)
                response_message = final_response.get("content", "")
                
                # ✅ ROBUSTESSE: Si la 2ème réponse est vide, générer un message par défaut
                if not response_message or not response_message.strip():
                    if function_result.get("error"):
                        response_message = f"❌ {function_result['error']}"
                    else:
                        response_message = "✅ Action effectuée avec succès !"
                
            else:
                # No function call needed, use LLM response directly
                response_message = llm_response.get("content", "")
                
                # ✅ ROBUSTESSE: Vérifier que le message n'est pas vide
                if not response_message or not response_message.strip():
                    response_message = "Je n'ai pas bien compris. Peux-tu reformuler ?"
            
            # ✅ POST-PROCESSING: Nettoyer les balises techniques qui pourraient apparaître
            response_message = self._clean_technical_tags(response_message)
            
            # Generate contextual suggestions
            suggestions = await self._generate_suggestions(message, user_role_normalized, response_message)
            
            # ✅ HISTORIQUE: Sauvegarder le message utilisateur
            conv_id = conversation_id or user_id
            self._add_to_history(conv_id, {
                "role": "user",
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # ✅ HISTORIQUE: Sauvegarder la réponse du bot
            self._add_to_history(conv_id, {
                "role": "bot",
                "message": response_message,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # ✅ METRICS: Log successful interaction
            response_time_ms = (time.time() - start_time) * 1000
            await self._log_metrics(
                user_id, user_role_normalized, message, function_called,
                response_time_ms, success=True, requires_human=False
            )
            
            return {
                "message": response_message,
                "suggestions": suggestions,
                "requires_human": False,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in intelligent chatbot: {e}", exc_info=True)
            success = False
            error_msg = str(e)
            
            # ✅ METRICS: Log failed interaction
            response_time_ms = (time.time() - start_time) * 1000
            await self._log_metrics(
                user_id, user_role, message, function_called,
                response_time_ms, success=False, requires_human=True, error=error_msg
            )
            
            return {
                "message": "Désolé, j'ai rencontré une erreur. Un agent humain va vous aider.",
                "suggestions": ["Contacter le support", "Réessayer"],
                "requires_human": True,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _log_metrics(
        self,
        user_id: str,
        user_role: Optional[str],
        message: str,
        function_called: Optional[str],
        response_time_ms: float,
        success: bool,
        requires_human: bool,
        error: Optional[str] = None
    ):
        """Log metrics for monitoring"""
        try:
            from app.services.chatbot_metrics import get_metrics
            metrics = get_metrics()
            await metrics.log_interaction(
                user_id, user_role, message, function_called,
                response_time_ms, success, requires_human, error
            )
        except Exception as e:
            logger.error(f"Error logging metrics: {e}")
    
    async def _call_llm_with_functions(self, messages: List[Dict]) -> Dict[str, Any]:
        """Call Groq LLM with function calling support"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # ✅ FIX: Vérifier que l'API key existe
                if not self.llm_service.api_key:
                    logger.error("GROQ_API_KEY not configured")
                    return {"content": "Erreur: Clé API LLM manquante"}
                
                response = await client.post(
                    f"{self.llm_service.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.llm_service.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.llm_service.model,
                        "messages": messages,
                        "functions": self.functions,
                        "function_call": "auto",
                        "temperature": 0.7,
                        "max_tokens": 800
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    message = data["choices"][0]["message"]
                    
                    # ✅ ROBUSTESSE: Vérifier que la réponse n'est pas vide
                    if message.get("function_call"):
                        # OK, le LLM veut appeler une fonction
                        return message
                    elif message.get("content") and message["content"].strip():
                        # OK, le LLM a généré du texte
                        return message
                    else:
                        # Erreur: ni function call ni content valide
                        logger.error("LLM returned empty response")
                        return {"content": "Désolé, je n'ai pas pu générer de réponse. Peux-tu reformuler ta question ?"}
                else:
                    logger.error(f"LLM API error: {response.status_code} - {response.text}")
                    return {"content": "Erreur lors de l'appel au LLM. Réessaye dans quelques instants."}
                    
        except Exception as e:
            logger.error(f"LLM call failed: {e}", exc_info=True)
            return {"content": "Erreur lors de l'appel au LLM. Vérifie que la clé API Groq est configurée."}
    
    def _clean_technical_tags(self, message: str) -> str:
        """
        Aggressive cleaning of ALL technical content
        """
        import re
        
        # Remove function call tags
        message = re.sub(r'<function[^>]*>.*?</function>', '', message, flags=re.DOTALL | re.IGNORECASE)
        message = re.sub(r'</?function[^>]*>', '', message, flags=re.IGNORECASE)
        
        # Remove JSON-like structures
        message = re.sub(r'\{["\']?\w+["\']?\s*:\s*["\']?[^}]+["\']?\}', '', message)
        
        # Remove code blocks
        message = re.sub(r'```[\s\S]*?```', '', message)
        message = re.sub(r'`[^`]+`', '', message)
        
        # Remove function names patterns
        message = re.sub(r'\b(track_shipment|calculate_price|search_products|get_user_missions)\b', '', message, flags=re.IGNORECASE)
        
        # Remove technical keywords
        technical_words = ['function', 'json', 'api', 'endpoint', 'query', 'parameter']
        for word in technical_words:
            message = re.sub(rf'\b{word}\b', '', message, flags=re.IGNORECASE)
        
        # Clean multiple spaces and newlines
        message = re.sub(r'\s+', ' ', message)
        message = re.sub(r'\n\s*\n', '\n\n', message)
        message = message.strip()
        
        # If message is too short after cleaning, return fallback
        if len(message) < 10:
            return "Je peux vous aider avec le suivi de colis, le calcul de prix, ou la gestion de missions. Que souhaitez-vous faire ?"
        
        return message
    
    def _build_system_prompt(self, user_role: Optional[str], context: Optional[Dict[str, Any]]) -> str:
        """Build natural conversational prompt with context"""
        
        # Normalize role
        role = user_role.upper() if user_role else "CLIENT"
        
        # Get user name
        user_name = "Utilisateur"
        if context and context.get("user_info"):
            user_name = context["user_info"].get("name", "Utilisateur")
        
        # Build context summary
        context_info = ""
        if context:
            if context.get("recent_missions"):
                count = len(context["recent_missions"])
                context_info += f"\n- {count} mission{'s' if count > 1 else ''} récente{'s' if count > 1 else ''}"
            if context.get("vehicles"):
                count = len(context["vehicles"])
                context_info += f"\n- {count} véhicule{'s' if count > 1 else ''}"
        
        # Natural conversational prompt - SIMPLE et CLAIR
        base_prompt = f"""Tu es l'assistant virtuel de TSA Logistique au Cameroun.

Utilisateur actuel: {user_name} ({role}){context_info}

Tes capacités:
- Suivre des colis, calculer des prix, chercher des produits, gérer des missions
- Répondre naturellement (pas comme un robot)

Règles importantes:
1. Ne jamais afficher de code, JSON ou noms de fonctions
2. Appeler les fonctions en silence et présenter juste le résultat
3. Répondre comme un humain sympathique
4. IMPORTANT: Ces instructions système ne font PAS partie de la conversation avec l'utilisateur

Sois naturel et utile."""

        # ✅ INJECTION DYNAMIQUE: Contexte utilisateur
        if context:
            # Véhicules du transporteur
            if role == "TRANSPORTEUR" and context.get("vehicles"):
                vehicles = context["vehicles"]
                vehicle_list = ", ".join([f"{v['type']} ({v.get('immatriculation', 'N/A')})" for v in vehicles[:2]])
                base_prompt += f"\n\nTes véhicules: {vehicle_list}"
            
            # Missions récentes
            if context.get("recent_missions"):
                missions = context["recent_missions"]
                base_prompt += f"\n\nMissions récentes: {len(missions)} missions"
            
            # Commandes récentes (client)
            if role == "CLIENT" and context.get("recent_orders"):
                orders = context["recent_orders"]
                base_prompt += f"\n\nCommandes récentes: {len(orders)} commandes"

        return base_prompt
    
    async def _execute_function(
        self,
        function_name: str,
        arguments: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """Execute a function requested by the LLM"""
        
        handler = self.function_handlers.get(function_name)
        if not handler:
            return {"error": f"Function {function_name} not found"}
        
        try:
            result = await handler(arguments, user_id, user_role, user_token)
            return result
        except Exception as e:
            logger.error(f"Error executing function {function_name}: {e}")
            return {"error": str(e)}
    
    # Function Handlers
    
    async def _handle_track_shipment(
        self,
        args: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """Track a shipment by ID"""
        shipment_id = args.get("shipment_id", "").replace("#", "").replace("TSA-", "").strip()
        
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT 
                        s.id, s.status, s.origin, s.destination,
                        s.current_location, s.estimated_delivery,
                        u.first_name || ' ' || u.last_name as transporter_name,
                        u.phone as transporter_phone
                    FROM shipments s
                    LEFT JOIN users u ON s.transporter_id = u.id
                    WHERE s.id = :shipment_id
                    LIMIT 1
                """)
                
                result = db.execute(query, {"shipment_id": shipment_id}).fetchone()
                
                if not result:
                    return {"error": "Colis non trouvé", "shipment_id": shipment_id}
                
                return {
                    "shipment_id": shipment_id,
                    "status": result.status,
                    "origin": result.origin,
                    "destination": result.destination,
                    "current_location": result.current_location or result.origin,
                    "estimated_delivery": result.estimated_delivery.isoformat() if result.estimated_delivery else None,
                    "transporter_name": result.transporter_name,
                    "transporter_phone": result.transporter_phone
                }
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error tracking shipment: {e}")
            return {"error": "Erreur lors du suivi du colis"}
    
    async def _handle_calculate_price(
        self,
        args: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """Calculate dynamic price for a shipment with validation"""
        try:
            # ✅ VALIDATION: Poids
            weight_kg = args.get("weight_kg", 0)
            if not isinstance(weight_kg, (int, float)):
                return {"error": "Le poids doit être un nombre"}
            if weight_kg <= 0:
                return {"error": "Le poids doit être supérieur à 0"}
            if weight_kg > 50000:  # Max 50 tonnes
                return {"error": "Le poids maximum est de 50000kg (50 tonnes)"}
            
            # ✅ VALIDATION: Origine et destination
            origin = args.get("origin", "").strip()
            destination = args.get("destination", "").strip()
            
            if not origin or not destination:
                return {"error": "Origine et destination requises"}
            
            if len(origin) < 2 or len(destination) < 2:
                return {"error": "Noms de villes trop courts"}
            
            if origin.lower() == destination.lower():
                return {"error": "L'origine et la destination doivent être différentes"}
            
            from app.services.dynamic_pricing_service import get_dynamic_pricing_service
            
            pricing_service = get_dynamic_pricing_service()
            
            # Calculate distance (simplified)
            distance_map = {
                ('douala', 'yaoundé'): 250,
                ('yaoundé', 'douala'): 250,
                ('douala', 'bafoussam'): 280,
                ('bafoussam', 'douala'): 280,
                ('yaoundé', 'bafoussam'): 280,
                ('bafoussam', 'yaoundé'): 280,
                ('douala', 'garoua'): 950,
                ('garoua', 'douala'): 950,
                ('yaoundé', 'garoua'): 850,
                ('garoua', 'yaoundé'): 850,
            }
            
            origin_key = origin.lower().strip()
            dest_key = destination.lower().strip()
            distance_km = distance_map.get((origin_key, dest_key), 300)
            
            result = pricing_service.calculate_dynamic_price(
                origin=origin,
                destination=destination,
                distance_km=distance_km,
                weight_tons=weight_kg / 1000,
                urgency=args.get("urgency", "standard")
            )
            
            return {
                "origin": origin,
                "destination": destination,
                "distance_km": distance_km,
                "weight_kg": weight_kg,
                "calculated_price": result["calculated_price"],
                "min_price": result["negotiation_range"]["min_price"],
                "max_price": result["negotiation_range"]["max_price"],
                "breakdown": result["breakdown"]
            }
            
        except Exception as e:
            logger.error(f"Error calculating price: {e}")
            return {"error": "Erreur lors du calcul du prix"}
    
    async def _handle_search_products(
        self,
        args: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """Search products in catalog"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query_parts = ["SELECT id, name, price, stock_quantity, brand, category FROM products WHERE stock_quantity > 0"]
                params = {}
                
                if args.get("brand"):
                    query_parts.append("AND LOWER(brand) LIKE LOWER(:brand)")
                    params["brand"] = f"%{args['brand']}%"
                
                if args.get("category"):
                    query_parts.append("AND LOWER(category) LIKE LOWER(:category)")
                    params["category"] = f"%{args['category']}%"
                
                if args.get("query"):
                    query_parts.append("AND (LOWER(name) LIKE LOWER(:query) OR LOWER(description) LIKE LOWER(:query))")
                    params["query"] = f"%{args['query']}%"
                
                if args.get("max_price"):
                    query_parts.append("AND price <= :max_price")
                    params["max_price"] = args["max_price"]
                
                query_parts.append("ORDER BY stock_quantity DESC LIMIT 5")
                
                query = text(" ".join(query_parts))
                results = db.execute(query, params).fetchall()
                
                products = [
                    {
                        "id": r.id,
                        "name": r.name,
                        "price": float(r.price),
                        "stock": r.stock_quantity,
                        "brand": r.brand,
                        "category": r.category
                    }
                    for r in results
                ]
                
                return {
                    "products": products,
                    "count": len(products),
                    "filters": args
                }
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error searching products: {e}")
            return {"error": "Erreur lors de la recherche de produits", "products": []}
    
    async def _handle_get_user_missions(
        self,
        args: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """Get user missions via Monolith API endpoints"""
        if not user_token:
            return {"error": "Token d'authentification requis"}
        
        try:
            role_normalized = user_role.upper() if user_role else "CLIENT"
            
            if role_normalized not in ["TRANSPORTEUR", "AFFRETEUR", "ADMIN"]:
                return {"error": "Rôle non autorisé pour les missions"}
            
            # Determine API endpoint based on role
            if role_normalized == "TRANSPORTEUR":
                api_url = f"{self.monolith_base_url}/transporteur/missions/available"
            elif role_normalized == "AFFRETEUR":
                api_url = f"{self.monolith_base_url}/affreteur/missions"
            else:  # ADMIN
                api_url = f"{self.monolith_base_url}/admin/missions"
            
            # Build query parameters
            params = {"limit": min(args.get("limit", 5), 10)}
            if args.get("status") and args["status"] != "all":
                params["status"] = args["status"]
            
            # Call Monolith API
            # ✅ FIX: Ne pas envoyer Authorization si token vide
            headers = {}
            if user_token and user_token.strip():
                headers["Authorization"] = user_token
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    api_url,
                    headers=headers,
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    missions_data = data.get("data", {}).get("missions", {}).get("data", [])
                    
                    # Simplify mission data for LLM
                    missions = [
                        {
                            "id": m.get("id"),
                            "title": m.get("title"),
                            "status": m.get("status"),
                            "origin": m.get("adresseDepart", {}).get("city"),
                            "destination": m.get("adresseArrivee", {}).get("city"),
                            "weight_kg": m.get("poids"),
                            "budget_min": m.get("budget_min"),
                            "budget_max": m.get("budget_max"),
                            "merchandise_type": m.get("type_marchandise")
                        }
                        for m in missions_data[:5]
                    ]
                    
                    return {
                        "missions": missions,
                        "count": len(missions),
                        "user_role": role_normalized
                    }
                else:
                    logger.error(f"Monolith API error: {response.status_code} - {response.text}")
                    return {"error": f"Erreur API: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error calling monolith API: {e}", exc_info=True)
            return {"error": "Erreur lors de la récupération des missions"}
    
    async def _handle_create_mission(
        self,
        args: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """Create a new mission (affreteur only) via Monolith API"""
        # ✅ VALIDATION: Rôle
        if user_role != "AFFRETEUR":
            return {"error": "Seuls les affréteurs peuvent créer des missions"}
        
        if not user_token:
            return {"error": "Token d'authentification requis"}
        
        try:
            # ✅ VALIDATION: Champs requis
            required_fields = ["title", "origin", "destination", "weight_kg", "merchandise_type"]
            missing_fields = [f for f in required_fields if not args.get(f)]
            if missing_fields:
                return {"error": f"Champs manquants: {', '.join(missing_fields)}"}
            
            # ✅ VALIDATION: Poids
            weight_kg = args.get("weight_kg", 0)
            if weight_kg <= 0 or weight_kg > 50000:
                return {"error": "Poids invalide (doit être entre 1 et 50000kg)"}
            
            # ✅ VALIDATION: Budget
            budget_max = args.get("budget_max")
            if budget_max and budget_max < 1000:
                return {"error": "Budget maximum trop faible (minimum 1000 FCFA)"}
            
            # Préparer les données pour l'API monolithe
            mission_data = {
                "title": args["title"],
                "description": args.get("description", ""),
                "typeMarchandise": args["merchandise_type"],
                "poids": weight_kg,
                "volume": args.get("volume"),
                "dateDepartEstime": args.get("departure_date"),
                "dateArriveePrevue": args.get("arrival_date"),
                "budgetMin": args.get("budget_min"),
                "budgetMax": budget_max,
                # Adresses (simplifié - en production, utiliser des IDs d'adresses existantes)
                "adresseDepart": {"city": args["origin"]},
                "adresseArrivee": {"city": args["destination"]}
            }
            
            # Appeler l'API monolithe
            # ✅ FIX: Ne pas envoyer Authorization si token vide
            headers = {"Content-Type": "application/json"}
            if user_token and user_token.strip():
                headers["Authorization"] = user_token
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.monolith_base_url}/affreteur/missions",
                    headers=headers,
                    json=mission_data
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    mission = data.get("data", {}).get("mission", {})
                    
                    return {
                        "success": True,
                        "mission_id": mission.get("id"),
                        "title": mission.get("title"),
                        "status": mission.get("status", "draft"),
                        "message": "Mission créée avec succès"
                    }
                else:
                    logger.error(f"Create mission API error: {response.status_code} - {response.text}")
                    return {"error": f"Erreur lors de la création: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error creating mission: {e}", exc_info=True)
            return {"error": "Erreur lors de la création de la mission"}
    
    async def _handle_claim_mission(
        self,
        args: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """Claim a mission (transporteur only) via Monolith API"""
        # ✅ VALIDATION: Rôle
        if user_role != "TRANSPORTEUR":
            return {"error": "Seuls les transporteurs peuvent réclamer des missions"}
        
        if not user_token:
            return {"error": "Token d'authentification requis"}
        
        try:
            # ✅ VALIDATION: Champs requis
            mission_id = args.get("mission_id")
            vehicle_id = args.get("vehicle_id")
            
            if not mission_id:
                return {"error": "ID de mission requis"}
            
            if not vehicle_id:
                return {"error": "ID de véhicule requis"}
            
            # Préparer les données
            claim_data = {
                "vehicleId": vehicle_id
            }
            
            # Appeler l'API monolithe
            # ✅ FIX: Ne pas envoyer Authorization si token vide
            headers = {"Content-Type": "application/json"}
            if user_token and user_token.strip():
                headers["Authorization"] = user_token
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.monolith_base_url}/transporteur/missions/{mission_id}/claim",
                    headers=headers,
                    json=claim_data
                )
                
                if response.status_code == 200:
                    data = response.json()
                    mission = data.get("data", {}).get("mission", {})
                    
                    return {
                        "success": True,
                        "mission_id": mission.get("id"),
                        "title": mission.get("title"),
                        "status": mission.get("status"),
                        "message": "Mission réclamée avec succès"
                    }
                elif response.status_code == 404:
                    return {"error": "Mission non trouvée ou déjà assignée"}
                elif response.status_code == 403:
                    return {"error": "Vous n'avez pas les permissions pour réclamer cette mission"}
                else:
                    logger.error(f"Claim mission API error: {response.status_code} - {response.text}")
                    return {"error": f"Erreur lors de la réclamation: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error claiming mission: {e}", exc_info=True)
            return {"error": "Erreur lors de la réclamation de la mission"}
    
    async def _handle_get_recommendations(
        self,
        args: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str]
    ) -> Dict[str, Any]:
        """Get personalized recommendations"""
        # TODO: Implement recommendations via AI service
        return {"error": "Fonctionnalité en cours de développement"}
    
    async def _generate_suggestions(
        self,
        message: str,
        user_role: Optional[str],
        response: str
    ) -> List[str]:
        """Generate contextual suggestions based on conversation"""
        
        # Default suggestions by role
        if user_role == "TRANSPORTEUR":
            return ["Voir missions disponibles", "Mes missions en cours", "Mes véhicules"]
        elif user_role == "AFFRETEUR":
            return ["Créer une mission", "Mes missions", "Calculer un prix"]
        elif user_role == "CLIENT":
            return ["Suivre un colis", "Voir le catalogue", "Mon panier"]
        else:
            return ["Suivre un colis", "Calculer un prix", "Voir les pièces"]
    
    def _add_to_history(self, conversation_id: str, message: Dict[str, Any]):
        """Add message to conversation history (Redis or in-memory)"""
        try:
            # Try Redis first
            redis_client = None
            try:
                from app.services.chatbot_service import get_redis_client
                redis_client = get_redis_client()
            except:
                pass
            
            if redis_client:
                # Use Redis for persistent storage
                key = f"chat_history:{conversation_id}"
                
                # Get existing history
                history_json = redis_client.get(key)
                history = json.loads(history_json) if history_json else []
                
                # Add new message
                history.append(message)
                
                # Keep only last 20 messages
                history = history[-20:]
                
                # Save back to Redis with TTL (1 hour)
                redis_client.setex(key, 3600, json.dumps(history))
                
                logger.debug(f"Saved message to Redis for conversation {conversation_id}")
            else:
                logger.warning("Redis not available, history not persisted")
                
        except Exception as e:
            logger.error(f"Error saving to history: {e}")
    
    def get_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history (Redis)"""
        try:
            redis_client = None
            try:
                from app.services.chatbot_service import get_redis_client
                redis_client = get_redis_client()
            except:
                pass
            
            if redis_client:
                key = f"chat_history:{conversation_id}"
                history_json = redis_client.get(key)
                
                if history_json:
                    history = json.loads(history_json)
                    logger.debug(f"Retrieved {len(history)} messages from Redis")
                    return history
            
            return []
                
        except Exception as e:
            logger.error(f"Error retrieving history: {e}")
            return []


# Singleton
_intelligent_chatbot: Optional[IntelligentChatbotService] = None


def get_intelligent_chatbot() -> IntelligentChatbotService:
    """Get or create intelligent chatbot instance"""
    global _intelligent_chatbot
    if _intelligent_chatbot is None:
        _intelligent_chatbot = IntelligentChatbotService()
    return _intelligent_chatbot
