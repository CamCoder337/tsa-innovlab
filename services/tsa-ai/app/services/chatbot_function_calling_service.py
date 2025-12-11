"""
Chatbot with Pure Function Calling (No Intent Detection)
Let the LLM decide freely what to do
"""
import logging
import httpx
import json
import re
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class ChatbotFunctionCallingService:
    """
    Pure Function Calling Chatbot
    - No rigid intent detection
    - LLM decides freely which functions to call
    - Natural conversation flow
    """
    
    def __init__(self):
        self.llm_api_key = settings.groq_api_key
        self.llm_model = settings.llm_model
        self.llm_base_url = "https://api.groq.com/openai/v1"
        self.monolith_base_url = settings.monolith_api_url
        
        # Initialize PromptBuilderService for dynamic prompting
        from app.services.prompt_builder_service import PromptBuilderService
        self.prompt_builder = PromptBuilderService.get_instance()
        
        # Register available functions
        self.functions = self._register_functions()
        self.function_handlers = self._register_handlers()
        
        # Conversation memory (in-memory cache, could be Redis in production)
        self.conversation_memory: Dict[str, List[Dict]] = {}
        self.max_history_length = 10  # Keep last 10 messages
        
        # Pending clarifications (state machine)
        self.pending_clarifications: Dict[str, Dict] = {}  # conversation_id -> clarification state
        
        # Rate limiting (simple in-memory, use Redis in production)
        self.rate_limit_window = 60  # 60 seconds
        self.rate_limit_max = 10  # 10 requests per minute
        self.rate_limit_tracker: Dict[str, List[float]] = {}  # user_id -> [timestamps]
        
        # Analytics & Monitoring
        self.metrics = {
            "total_queries": 0,
            "function_calls": {},  # Count per function
            "errors": 0,
            "avg_response_time_ms": 0,
            "total_response_time_ms": 0
        }
    
    def _register_functions(self) -> List[Dict[str, Any]]:
        """
        Register READ-ONLY functions that LLM can call
        
        ⚠️ IMPORTANT: Toutes les fonctions sont READ-ONLY
        Aucune création, modification ou suppression de données
        """
        return [
            # === PRODUITS & CATALOGUE (READ-ONLY) ===
            {
                "name": "search_products",
                "description": "Rechercher des PIÈCES DÉTACHÉES dans le catalogue (LECTURE SEULE). Utilise cette fonction pour vérifier la disponibilité, le stock, les prix des produits.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Terme de recherche (ex: amortisseur, frein, moteur)"
                        },
                        "brand": {
                            "type": "string",
                            "description": "Marque de véhicule (ex: Toyota, Mercedes, Volvo)"
                        },
                        "check_stock_only": {
                            "type": "boolean",
                            "description": "true si l'utilisateur veut juste savoir si c'est en stock"
                        }
                    }
                }
            },
            {
                "name": "get_product_details",
                "description": "Obtenir les détails complets d'un produit (LECTURE SEULE): prix, stock, description, specs.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_id": {
                            "type": "string",
                            "description": "ID du produit"
                        }
                    },
                    "required": ["product_id"]
                }
            },
            {
                "name": "get_categories",
                "description": "Lister les catégories de produits disponibles (LECTURE SEULE).",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            
            # === PANIER & COMMANDES (READ-ONLY) ===
            {
                "name": "get_cart",
                "description": "Voir le contenu du panier actuel (LECTURE SEULE). Ne peut PAS ajouter/modifier/supprimer des articles.",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "get_my_orders",
                "description": "Récupérer les commandes de l'utilisateur (LECTURE SEULE).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"],
                            "description": "Filtrer par statut"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Nombre de commandes à retourner",
                            "default": 10
                        }
                    }
                }
            },
            {
                "name": "get_order_details",
                "description": "Obtenir les détails complets d'une commande (LECTURE SEULE).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "order_id": {
                            "type": "string",
                            "description": "ID ou numéro de la commande"
                        }
                    },
                    "required": ["order_id"]
                }
            },
            
            # === MISSIONS (TRANSPORT - READ-ONLY) ===
            {
                "name": "get_user_missions",
                "description": "Récupérer MES missions (LECTURE SEULE). Créées si affréteur, assignées si transporteur.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["all", "draft", "published", "assigned", "in_progress", "completed", "cancelled"],
                            "description": "Filtrer par statut"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Nombre de missions à retourner",
                            "default": 10
                        }
                    }
                }
            },
            {
                "name": "get_available_missions",
                "description": "Voir les missions disponibles pour transporteurs (LECTURE SEULE). Missions publiées non assignées.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "integer",
                            "description": "Nombre de missions à retourner",
                            "default": 10
                        }
                    }
                }
            },
            {
                "name": "track_shipment",
                "description": "Obtenir le lien vers le tracking en temps réel d'un colis/mission (NAVIGATION). Redirige vers la page de tracking du frontend.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "shipment_id": {
                            "type": "string",
                            "description": "ID du colis ou de la mission"
                        }
                    },
                    "required": ["shipment_id"]
                }
            },
            {
                "name": "calculate_price",
                "description": "Calculer le TARIF D'UN TRANSPORT entre deux villes (CALCUL SEUL, pas de création de mission). Utilise l'IA de pricing dynamique.",
                "parameters": {
                    "type": "object",
                    "properties": {
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
                            "description": "Poids en kilogrammes"
                        }
                    },
                    "required": ["origin", "destination"]
                }
            },
            {
                "name": "get_mission_updates",
                "description": "Voir l'historique des mises à jour d'une mission (LECTURE SEULE).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mission_id": {
                            "type": "string",
                            "description": "ID de la mission"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Nombre de mises à jour",
                            "default": 10
                        }
                    },
                    "required": ["mission_id"]
                }
            },
            
            # === VÉHICULES (TRANSPORTEUR - READ-ONLY) ===
            {
                "name": "get_my_vehicles",
                "description": "Récupérer MES véhicules avec leur statut (LECTURE SEULE).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["all", "available", "in_mission", "maintenance"],
                            "description": "Filtrer par statut"
                        }
                    }
                }
            },
            
            # === MESSAGES & NOTIFICATIONS (READ-ONLY) ===
            {
                "name": "get_unread_messages",
                "description": "Récupérer le nombre de messages non lus (LECTURE SEULE).",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "get_notifications",
                "description": "Récupérer les notifications récentes (LECTURE SEULE).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "unread_only": {
                            "type": "boolean",
                            "description": "Afficher seulement les notifications non lues",
                            "default": False
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Nombre de notifications à retourner",
                            "default": 10
                        }
                    }
                }
            },
            
            # === COMPTE & PROFIL (READ-ONLY) ===
            {
                "name": "get_my_profile",
                "description": "Récupérer les informations du profil utilisateur (LECTURE SEULE): nom, email, rôle, stats.",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "get_my_addresses",
                "description": "Récupérer mes adresses enregistrées (LECTURE SEULE).",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            
            # === CLARIFICATION ===
            {
                "name": "request_clarification",
                "description": "Demander une clarification à l'utilisateur quand la requête est AMBIGUË.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ambiguity_reason": {
                            "type": "string",
                            "description": "Pourquoi c'est ambigu (ex: 'prix peut signifier produit ou transport')"
                        },
                        "options": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Liste des options à proposer (2-3 max)",
                            "minItems": 2,
                            "maxItems": 3
                        }
                    },
                    "required": ["ambiguity_reason", "options"]
                }
            }
        ]
    
    def _register_handlers(self) -> Dict[str, Any]:
        """Map function names to handlers"""
        return {
            # Produits
            "search_products": self._handle_search_products,
            "get_product_details": self._handle_get_product_details,
            "get_categories": self._handle_get_categories,
            
            # Panier & Commandes (READ-ONLY)
            "get_cart": self._handle_get_cart,
            "get_my_orders": self._handle_get_my_orders,
            "get_order_details": self._handle_get_order_details,
            
            # Missions (READ-ONLY)
            "get_user_missions": self._handle_get_user_missions,
            "get_mission_updates": self._handle_get_mission_updates,
            "get_available_missions": self._handle_get_available_missions,
            "track_shipment": self._handle_track_shipment,
            "calculate_price": self._handle_calculate_price,
            
            # Véhicules (READ-ONLY)
            "get_my_vehicles": self._handle_get_my_vehicles,
            
            # Messages & Notifications (READ-ONLY)
            "get_unread_messages": self._handle_get_unread_messages,
            "get_notifications": self._handle_get_notifications,
            
            # Profil (READ-ONLY)
            "get_my_profile": self._handle_get_my_profile,
            "get_my_addresses": self._handle_get_my_addresses,
            
            # Clarification
            "request_clarification": self._handle_request_clarification,
        }
    
    def _get_function_permissions(self) -> Dict[str, List[str]]:
        """Define which roles can call which READ-ONLY functions"""
        return {
            # Tous les rôles (READ-ONLY)
            "search_products": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "get_product_details": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "get_cart": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "get_my_orders": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "get_order_details": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "get_my_profile": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "get_unread_messages": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "get_notifications": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "track_shipment": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "request_clarification": ["CLIENT", "TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            
            # Missions - Affréteur & Admin (READ-ONLY)
            "get_user_missions": ["TRANSPORTEUR", "AFFRETEUR", "ADMIN"],
            "calculate_price": ["AFFRETEUR", "TRANSPORTEUR", "ADMIN"],
            
            # Missions - Transporteur & Admin (READ-ONLY)
            "get_available_missions": ["TRANSPORTEUR", "ADMIN"],
            "get_my_vehicles": ["TRANSPORTEUR", "ADMIN"],
        }
    
    def _check_permission(self, function_name: str, user_role: str) -> bool:
        """Check if user role has permission to call function"""
        permissions = self._get_function_permissions()
        allowed_roles = permissions.get(function_name, [])
        return user_role in allowed_roles

    
    async def process_message_stream(
        self,
        message: str,
        user_id: str,
        user_role: Optional[str] = None,
        user_token: Optional[str] = None,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Process message with streaming (SSE)
        Yields chunks as they arrive from LLM
        """
        import time
        start_time = time.time()
        
        user_role_normalized = user_role.upper() if user_role else "CLIENT"
        
        try:
            # Build system prompt with context
            system_prompt = self._build_conversational_prompt(user_role_normalized, context)
            
            # Build messages with conversation history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history (context)
            if conv_id in self.conversation_memory:
                history = self.conversation_memory[conv_id]
                messages.extend(history[-self.max_history_length:])  # Last N messages
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Send start event
            yield {
                "type": "start",
                "timestamp": time.time()
            }
            
            # Call LLM with function calling
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.llm_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.llm_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.llm_model,
                        "messages": messages,
                        "functions": self.functions,
                        "function_call": "auto",
                        "temperature": 0.7,
                        "max_tokens": 800,
                        "stream": True  # Enable streaming
                    }
                )
                
                if response.status_code != 200:
                    yield {
                        "type": "error",
                        "message": "Erreur lors de la communication avec le LLM"
                    }
                    return
                
                # Process streaming response
                function_call_data = None
                accumulated_content = ""
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk["choices"][0]["delta"]
                            
                            # Check for function call
                            if "function_call" in delta:
                                if not function_call_data:
                                    function_call_data = {
                                        "name": delta["function_call"].get("name", ""),
                                        "arguments": ""
                                    }
                                if "arguments" in delta["function_call"]:
                                    function_call_data["arguments"] += delta["function_call"]["arguments"]
                            
                            # Stream content
                            if "content" in delta and delta["content"]:
                                accumulated_content += delta["content"]
                                yield {
                                    "type": "chunk",
                                    "content": delta["content"]
                                }
                        except json.JSONDecodeError:
                            continue
                
                # If function was called, execute it
                if function_call_data and function_call_data["name"]:
                    yield {
                        "type": "function_call",
                        "function": function_call_data["name"]
                    }
                    
                    function_args = json.loads(function_call_data["arguments"])
                    function_result = await self._execute_function(
                        function_call_data["name"],
                        function_args,
                        user_id,
                        user_role_normalized,
                        user_token
                    )
                    
                    # Second LLM call with function result (also streamed)
                    messages.append({
                        "role": "assistant",
                        "content": None,
                        "function_call": function_call_data
                    })
                    messages.append({
                        "role": "function",
                        "name": function_call_data["name"],
                        "content": json.dumps(function_result, ensure_ascii=False)
                    })
                    
                    response2 = await client.post(
                        f"{self.llm_base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self.llm_api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": self.llm_model,
                            "messages": messages,
                            "temperature": 0.7,
                            "max_tokens": 500,
                            "stream": True
                        }
                    )
                    
                    final_content = ""
                    async for line in response2.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            
                            try:
                                chunk = json.loads(data_str)
                                delta = chunk["choices"][0]["delta"]
                                
                                if "content" in delta and delta["content"]:
                                    final_content += delta["content"]
                                    yield {
                                        "type": "chunk",
                                        "content": delta["content"]
                                    }
                            except json.JSONDecodeError:
                                continue
                    
                    accumulated_content = final_content
                    
                    # Get navigation hint
                    navigation_hint = self._get_navigation_hint(
                        function_call_data["name"],
                        function_result
                    )
                else:
                    navigation_hint = None
                
                # Generate suggestions
                suggestions = self._generate_smart_suggestions(
                    message,
                    accumulated_content,
                    user_role_normalized
                )
                
                # Send done event
                processing_time_ms = (time.time() - start_time) * 1000
                done_data = {
                    "type": "done",
                    "suggestions": suggestions,
                    "processing_time_ms": round(processing_time_ms, 2),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                if navigation_hint:
                    done_data["navigation"] = navigation_hint
                
                yield done_data
                
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield {
                "type": "error",
                "message": "Désolé, j'ai rencontré une erreur.",
                "requires_human": True
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
        Process message with pure function calling
        
        Flow:
        1. LLM analyzes message freely
        2. LLM decides if it needs to call functions
        3. Backend executes functions
        4. LLM generates natural response with results
        
        SECURITY: conversation_id is FORCED to user_id to prevent
        users from accessing other users' conversation history
        """
        import time
        start_time = time.time()
        
        logger.info(f"[process_message] RECEIVED: user_id={user_id} (type={type(user_id)}), user_role={user_role}")
        
        user_role_normalized = user_role.upper() if user_role else "CLIENT"
        
        # 🔒 SECURITY FIX: Force conversation_id = user_id
        # This prevents malicious users from accessing other users' conversation history
        # by passing arbitrary conversation_id values
        conv_id = user_id  # ← ALWAYS use user_id, ignore client input
        
        try:
            # Check rate limit using DB (distributed across instances)
            is_allowed, remaining = await self._check_rate_limit_db(user_id)
            if not is_allowed:
                logger.warning(f"Rate limit exceeded for user {user_id}")
                return {
                    "message": "Tu envoies trop de messages. Attends un peu avant de réessayer 😊",
                    "suggestions": ["Attendre 1 minute", "Contacter le support"],
                    "requires_human": False,
                    "rate_limited": True,
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            # Check if this is a response to a pending clarification
            pending_clarification = self._get_pending_clarification(conv_id)
            if pending_clarification:
                clarified_message = self._detect_clarification_response(message, pending_clarification)
                if clarified_message:
                    # User responded to clarification - use the clarified message
                    logger.info(f"Clarification resolved: '{message}' → '{clarified_message}'")
                    message = clarified_message
                    self._clear_pending_clarification(conv_id)
        except Exception as e:
            logger.error(f"Error during initial checks: {e}")
            # Continue with processing even if checks fail
        
        # Build system prompt (conversational, no rigid categories)
        # Use the shared PromptBuilderService for dynamic entities and consistent instructions
        system_prompt = await self.prompt_builder.build_conversational_prompt(user_role_normalized, context)
        
        # Build messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]
        
        # Call LLM API
        try:
            # Call LLM with function calling
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.llm_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.llm_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.llm_model,
                        "messages": messages,
                        "functions": self.functions,
                        "function_call": "auto",
                        "temperature": 0.7,
                        "max_tokens": 800
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"LLM API error: {response.status_code}")
                
                data = response.json()
                llm_message = data["choices"][0]["message"]
                
                # Check if LLM wants to call a function
                if llm_message.get("function_call"):
                    # LLM decided to call a function
                    function_name = llm_message["function_call"]["name"]
                    function_args = json.loads(llm_message["function_call"]["arguments"])
                    
                    logger.info(f"LLM called function: {function_name} with {function_args}")
                    
                    # Execute function
                    function_result = await self._execute_function(
                        function_name, function_args, user_id, user_role_normalized, user_token
                    )
                    
                    # Check if it's a clarification request
                    if function_result.get("type") == "clarification_needed":
                        # Format clarification message
                        options = function_result.get("options", [])
                        final_message = "Je ne suis pas sûr de comprendre. Tu veux :\n\n"
                        for i, option in enumerate(options, 1):
                            final_message += f"{i}️⃣ {option}\n"
                        final_message += "\nRéponds avec le numéro ou précise ta demande 😊"
                        
                        # Save pending clarification for follow-up
                        self._save_pending_clarification(conv_id, message, options)
                        
                        # Generate contextual suggestions based on options
                        suggestions = [f"{i}️⃣ {opt[:30]}..." if len(opt) > 30 else f"{i}️⃣ {opt}" 
                                     for i, opt in enumerate(options, 1)]
                    else:
                        # Normal function call - generate response with LLM
                        # Add function result to conversation
                        messages.append({
                            "role": "assistant",
                            "content": None,
                            "function_call": llm_message["function_call"]
                        })
                        messages.append({
                            "role": "function",
                            "name": function_name,
                            "content": json.dumps(function_result, ensure_ascii=False)
                        })
                        
                        # Second LLM call: Generate natural response with results
                        response2 = await client.post(
                            f"{self.llm_base_url}/chat/completions",
                            headers={
                                "Authorization": f"Bearer {self.llm_api_key}",
                                "Content-Type": "application/json"
                            },
                            json={
                                "model": self.llm_model,
                                "messages": messages,
                                "temperature": 0.7,
                                "max_tokens": 500
                            }
                        )
                        
                        if response2.status_code == 200:
                            data2 = response2.json()
                            final_message = data2["choices"][0]["message"]["content"]
                        else:
                            final_message = "J'ai récupéré les données mais j'ai un problème pour te répondre."
                        
                        # Generate suggestions
                        suggestions = self._generate_smart_suggestions(message, final_message, user_role_normalized)
                else:
                    # No function call needed, use LLM response directly
                    final_message = llm_message.get("content", "")
                    
                    # Generate suggestions
                    suggestions = self._generate_smart_suggestions(message, final_message, user_role_normalized)
                
                # Generate navigation hint (HYBRID: guide frontend)
                navigation_hint = None
                if llm_message.get("function_call"):
                    navigation_hint = self._get_navigation_hint(
                        llm_message["function_call"]["name"],
                        function_result
                    )
                else:
                    # Generate contextual hint even without function call
                    navigation_hint = self._get_contextual_navigation_hint(
                        message, final_message, user_role_normalized
                    )
                
                processing_time_ms = (time.time() - start_time) * 1000
                
                response_data = {
                    "message": final_message,
                    "suggestions": suggestions,
                    "requires_human": False,
                    "processing_time_ms": round(processing_time_ms, 2),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # Clean response from artifacts (e.g. <function=...>)
                response_data["message"] = self._clean_response(response_data["message"])
                
                # Add navigation hint if available (HYBRID approach)
                if navigation_hint:
                    response_data["navigation"] = navigation_hint
                
                # Save to DB instead of memory (persistent storage)
                await self._save_to_db(user_id, "user", message)
                await self._save_to_db(user_id, "assistant", final_message)
                
                # Track metrics
                self._track_metrics(
                    processing_time_ms,
                    llm_message.get("function_call", {}).get("name") if llm_message.get("function_call") else None,
                    success=True
                )
                
                return response_data
                
        except httpx.TimeoutException as e:
            logger.error(f"Timeout error: {e}")
            self._track_metrics(0, None, success=False)
            return {
                "message": "Le service met trop de temps à répondre. Réessaie dans quelques secondes 🕐",
                "suggestions": ["Réessayer", "Simplifier la question", "Contacter le support"],
                "requires_human": False,
                "error_type": "timeout",
                "timestamp": datetime.utcnow().isoformat()
            }
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            self._track_metrics(0, None, success=False)
            return {
                "message": "Problème de connexion avec le service IA. Réessaie dans un instant 🔌",
                "suggestions": ["Réessayer", "Contacter le support"],
                "requires_human": False,
                "error_type": "http_error",
                "timestamp": datetime.utcnow().isoformat()
            }
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            self._track_metrics(0, None, success=False)
            return {
                "message": "Erreur de traitement de la réponse. Reformule ta question 🔄",
                "suggestions": ["Reformuler", "Réessayer", "Contacter le support"],
                "requires_human": False,
                "error_type": "json_error",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            self._track_metrics(0, None, success=False)
            return {
                "message": "Désolé, j'ai rencontré une erreur inattendue. Un agent va t'aider 🆘",
                "suggestions": ["Contacter le support", "Réessayer plus tard"],
                "requires_human": True,
                "error_type": "unexpected",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    # _build_conversational_prompt removed - using PromptBuilderService instead
        

    
    def _generate_smart_suggestions(self, message: str, response: str, user_role: str) -> List[str]:
        """
        Generate contextual suggestions based on message, response content, and user role
        
        Strategy:
        1. Analyze bot response for context clues
        2. Analyze user message for intent
        3. Provide next logical actions
        """
        message_lower = message.lower()
        response_lower = response.lower()
        
        # Analyze response content for better context
        # If bot mentions creating/mission creation
        if any(word in response_lower for word in ["créer", "création", "mission", "formulaire", "pré-remplir"]):
            if user_role == "AFFRETEUR":
                return ["Créer une mission", "Calculer un autre prix", "Mes missions"]
            elif user_role == "TRANSPORTEUR":
                return ["Missions disponibles", "Mes missions", "Mes véhicules"]
        
        # If bot mentions price/tarif
        if any(word in response_lower for word in ["prix", "tarif", "fcfa", "coût"]):
            if user_role in ["AFFRETEUR", "TRANSPORTEUR"]:
                return ["Créer une mission", "Calculer un autre prix", "Mes missions"]
            else:
                return ["Voir le catalogue", "Mon panier", "Rechercher un produit"]
        
        # If bot mentions products/stock
        if any(word in response_lower for word in ["produit", "pièce", "stock", "catalogue", "disponible"]):
            return ["Voir le catalogue", "Rechercher un produit", "Mon panier"]
        
        # If bot mentions cart/panier
        if any(word in response_lower for word in ["panier", "article", "commander"]):
            return ["Voir mon panier", "Passer commande", "Continuer mes achats"]
        
        # If bot mentions tracking/suivi
        if any(word in response_lower for word in ["suivi", "tracking", "colis", "livraison"]):
            return ["Voir le tracking", "Mes missions", "Contacter le transporteur"]
        
        # If bot mentions orders/commandes
        if any(word in response_lower for word in ["commande", "order", "paiement"]):
            return ["Mes commandes", "Suivre ma commande", "Mon panier"]
        
        # Context-aware suggestions based on user message
        if "panier" in message_lower or "cart" in message_lower:
            return ["Voir mon panier", "Passer commande", "Continuer mes achats"]
        elif "commande" in message_lower or "order" in message_lower:
            return ["Mes commandes", "Suivre ma commande", "Aide commande"]
        elif "mission" in message_lower:
            if user_role == "TRANSPORTEUR":
                return ["Missions disponibles", "Mes missions", "Mes véhicules"]
            else:
                return ["Créer une mission", "Mes missions", "Calculer un prix"]
        elif "message" in message_lower or "notification" in message_lower:
            return ["Mes messages", "Mes notifications", "Conversations"]
        elif "produit" in message_lower or "pièce" in message_lower or "stock" in message_lower:
            return ["Voir le catalogue", "Rechercher un produit", "Mon panier"]
        
        # Role-based default suggestions (tous ont accès à la boutique)
        if user_role == "TRANSPORTEUR":
            return ["Missions disponibles", "Mes véhicules", "Boutique pièces"]
        elif user_role == "AFFRETEUR":
            return ["Créer une mission", "Mes missions", "Boutique pièces"]
        elif user_role == "CLIENT":
            return ["Voir le catalogue", "Mon panier", "Mes commandes"]
        elif user_role == "ADMIN":
            return ["Dashboard", "Gérer produits", "Gérer missions"]
        else:
            return ["Aide", "Mon profil", "Boutique"]
    
    def _save_to_memory(self, conversation_id: str, user_message: str, assistant_message: str):
        """
        Save conversation to memory for context
        
        SECURITY NOTE: conversation_id is always equal to user_id (enforced in process_message)
        so there's no risk of cross-user data leakage. Each user has their own isolated
        conversation history in memory.
        """
        if conversation_id not in self.conversation_memory:
            self.conversation_memory[conversation_id] = []
        
        # Add user message
        self.conversation_memory[conversation_id].append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Add assistant message
        self.conversation_memory[conversation_id].append({
            "role": "assistant",
            "content": assistant_message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep only last N messages to avoid context overflow
        if len(self.conversation_memory[conversation_id]) > self.max_history_length * 2:
            self.conversation_memory[conversation_id] = self.conversation_memory[conversation_id][-self.max_history_length * 2:]
    
    def _get_conversation_context(self, conversation_id: str) -> str:
        """Get conversation context summary"""
        if conversation_id not in self.conversation_memory:
            return "Nouvelle conversation"
        
        history = self.conversation_memory[conversation_id]
        if not history:
            return "Nouvelle conversation"
        
        # Summarize last few exchanges
        recent = history[-4:]  # Last 2 exchanges
        summary = []
        for msg in recent:
            role = "User" if msg["role"] == "user" else "Assistant"
            content = msg["content"][:50] + "..." if len(msg["content"]) > 50 else msg["content"]
            summary.append(f"{role}: {content}")
        
        return " | ".join(summary)
    
    def clear_conversation_memory(self, conversation_id: str):
        """Clear conversation memory (useful for testing or reset)"""
        if conversation_id in self.conversation_memory:
            del self.conversation_memory[conversation_id]
    
    def _track_metrics(self, response_time_ms: float, function_name: Optional[str], success: bool):
        """Track analytics metrics"""
        self.metrics["total_queries"] += 1
        
        if success:
            self.metrics["total_response_time_ms"] += response_time_ms
            self.metrics["avg_response_time_ms"] = (
                self.metrics["total_response_time_ms"] / self.metrics["total_queries"]
            )
            
            if function_name:
                if function_name not in self.metrics["function_calls"]:
                    self.metrics["function_calls"][function_name] = 0
                self.metrics["function_calls"][function_name] += 1
        else:
            self.metrics["errors"] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        total = self.metrics["total_queries"]
        errors = self.metrics["errors"]
        
        return {
            "total_queries": total,
            "successful_queries": total - errors,
            "errors": errors,
            "error_rate": round(errors / total * 100, 2) if total > 0 else 0,
            "avg_response_time_ms": round(self.metrics["avg_response_time_ms"], 2),
            "function_calls": self.metrics["function_calls"],
            "most_used_functions": sorted(
                self.metrics["function_calls"].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
        }
    
    def reset_metrics(self):
        """Reset metrics (useful for testing)"""
        self.metrics = {
            "total_queries": 0,
            "function_calls": {},
            "errors": 0,
            "avg_response_time_ms": 0,
            "total_response_time_ms": 0
        }
    
    def _get_navigation_hint(self, function_name: str, result: Dict) -> Optional[Dict]:
        """
        Generate navigation hints aligned with React Router routes
        Routes from: apps/frontend-web/src/App.tsx
        
        All routes use /app/* prefix as defined in the frontend routing
        """
        
        # Dynamic navigation based on function result
        if function_name == "track_shipment":
            mission_id = result.get("mission", {}).get("id") or result.get("shipment_id")
            if mission_id:
                return {
                    "path": f"/app/mission/{mission_id}/tracking",
                    "label": "Voir le tracking en temps réel",
                    "description": "Suivi sur carte interactive"
                }
        
        elif function_name == "get_product_details":
            product_id = result.get("product", {}).get("id")
            if product_id:
                return {
                    "path": f"/app/shop/product/{product_id}",
                    "label": "Voir le produit",
                    "description": "Détails complets et ajout au panier"
                }
        
        elif function_name == "get_order_details":
            order_id = result.get("order", {}).get("id")
            if order_id:
                return {
                    "path": f"/app/shop/order/{order_id}",
                    "label": "Voir la commande",
                    "description": "Détails et statut de livraison"
                }
        
        elif function_name == "calculate_price":
            pricing = result.get("pricing", {})
            if pricing:
                return {
                    "path": "/app/missions/create",
                    "label": "Créer cette mission",
                    "description": f"{pricing.get('origin')} → {pricing.get('destination')}",
                    "prefill": {
                        "origin": pricing.get("origin"),
                        "destination": pricing.get("destination"),
                        "weight_kg": pricing.get("weight_kg"),
                        "budget_max": pricing.get("price")
                    }
                }
        
        elif function_name == "get_cart":
            cart_count = result.get("cart", {}).get("items_count", 0)
            if cart_count > 0:
                return {
                    "path": "/app/shop/cart",
                    "label": "Voir mon panier",
                    "description": f"{cart_count} article(s)"
                }
            else:
                return {
                    "path": "/app/shop",
                    "label": "Voir le catalogue",
                    "description": "Ton panier est vide"
                }
        
        # Static navigation map for other functions
        navigation_map = {
            "get_my_orders": {
                "path": "/app/shop/orders",
                "label": "Voir toutes mes commandes",
                "description": "Historique complet"
            },
            "get_user_missions": {
                "path": "/app/missions",
                "label": "Voir toutes mes missions",
                "description": "Gérer mes missions"
            },
            "get_available_missions": {
                "path": "/app/missions",
                "label": "Voir toutes les missions",
                "description": "Missions disponibles"
            },
            "get_my_vehicles": {
                "path": "/app/vehicles",
                "label": "Gérer mes véhicules",
                "description": "Ajouter ou modifier"
            },
            "get_notifications": {
                "path": "/app/notifications",
                "label": "Voir toutes les notifications",
                "description": "Centre de notifications"
            },
            "get_my_profile": {
                "path": "/app/profile",
                "label": "Voir mon profil",
                "description": "Paramètres du compte"
            },
            "search_products": {
                "path": "/app/shop",
                "label": "Voir le catalogue",
                "description": "Tous les produits disponibles"
            }
        }
        
        return navigation_map.get(function_name)
    
    def _get_contextual_navigation_hint(self, message: str, response: str, user_role: str) -> Optional[Dict]:
        """
        Generate navigation hints based on conversation context
        Even when no function was called, guide user to relevant pages
        """
        message_lower = message.lower()
        response_lower = response.lower()
        
        # Analyze response for context clues
        if any(word in response_lower for word in ["créer", "création", "mission", "formulaire"]):
            if user_role in ["AFFRETEUR", "ADMIN"]:
                return {
                    "path": "/app/missions/create",
                    "label": "Créer une mission",
                    "description": "Formulaire de création"
                }
        
        if any(word in response_lower for word in ["prix", "tarif", "calculer", "coût"]) and \
           any(word in message_lower for word in ["douala", "yaoundé", "bafoussam", "transport"]):
            return {
                "path": "/app/missions/create",
                "label": "Créer une mission",
                "description": "Avec calcul de prix"
            }
        
        if any(word in response_lower for word in ["produit", "pièce", "catalogue", "stock"]):
            return {
                "path": "/app/shop",
                "label": "Voir le catalogue",
                "description": "Tous les produits disponibles"
            }
        
        if any(word in response_lower for word in ["panier", "article"]):
            return {
                "path": "/app/shop/cart",
                "label": "Voir mon panier",
                "description": "Gérer mes articles"
            }
        
        if any(word in response_lower for word in ["commande", "order"]):
            return {
                "path": "/app/shop/orders",
                "label": "Mes commandes",
                "description": "Historique et suivi"
            }
        
        if any(word in response_lower for word in ["mission", "transport"]) and user_role != "CLIENT":
            return {
                "path": "/app/missions",
                "label": "Mes missions",
                "description": "Gérer mes missions"
            }
        
        if any(word in response_lower for word in ["véhicule", "camion"]) and user_role == "TRANSPORTEUR":
            return {
                "path": "/app/vehicles",
                "label": "Mes véhicules",
                "description": "Gérer ma flotte"
            }
        
        # Default: no specific hint
        return None
    
    async def _execute_function(
        self,
        function_name: str,
        arguments: Dict[str, Any],
        user_id: str,
        user_role: str,
        user_token: Optional[str],
        retry_count: int = 0,
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """
        Execute a function with retry logic and permission check
        
        Retry strategy:
        - Retry on transient errors (DB connection, timeout)
        - Don't retry on validation errors (bad params)
        - Exponential backoff
        """
        # Check permission FIRST
        if not self._check_permission(function_name, user_role):
            logger.warning(f"Permission denied: {user_role} tried to call {function_name}")
            return {
                "success": False,
                "error": f"Tu n'as pas la permission d'utiliser cette fonction (rôle: {user_role})",
                "error_type": "permission_denied"
            }
        
        handler = self.function_handlers.get(function_name)
        if not handler:
            return {
                "success": False,
                "error": f"Function {function_name} not found",
                "error_type": "function_not_found"
            }
        
        try:
            result = await handler(arguments, user_id, user_role, user_token)
            
            # If success, return immediately
            if result.get("success", False):
                return result
            
            # If validation error, don't retry
            error_msg = result.get("error", "")
            if any(keyword in error_msg.lower() for keyword in ["manquant", "invalide", "non autorisé", "non trouvé"]):
                return result
            
            # If transient error and retries left, retry
            if retry_count < max_retries:
                logger.warning(f"Retrying {function_name} (attempt {retry_count + 1}/{max_retries})")
                import asyncio
                await asyncio.sleep(0.5 * (2 ** retry_count))  # Exponential backoff
                return await self._execute_function(
                    function_name, arguments, user_id, user_role, user_token,
                    retry_count + 1, max_retries
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Error executing {function_name}: {e}", exc_info=True)
            
            # Retry on exception if retries left
            if retry_count < max_retries:
                logger.warning(f"Retrying {function_name} after exception (attempt {retry_count + 1}/{max_retries})")
                import asyncio
                await asyncio.sleep(0.5 * (2 ** retry_count))
                return await self._execute_function(
                    function_name, arguments, user_id, user_role, user_token,
                    retry_count + 1, max_retries
                )
            
            return {
                "success": False,
                "error": "Erreur lors de l'exécution de la fonction",
                "error_type": "execution_error",
                "details": str(e)
            }
    
    async def _handle_search_products(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Search products in database"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            # Handle None args
            if args is None:
                args = {}
            
            db = SessionLocal()
            try:
                query_text = "SELECT id, name, price, stock, description, reference FROM products WHERE stock > 0 AND is_active = true"
                params = {}
                
                if args.get("query"):
                    query_text += " AND (LOWER(name) LIKE LOWER(:query) OR LOWER(description) LIKE LOWER(:query))"
                    params["query"] = f"%{args['query']}%"
                
                if args.get("reference"):
                    query_text += " AND LOWER(reference) LIKE LOWER(:reference)"
                    params["reference"] = f"%{args['reference']}%"
                
                query_text += " ORDER BY stock DESC LIMIT 5"
                
                results = db.execute(text(query_text), params).fetchall()
                
                products = [
                    {
                        "id": str(r.id),
                        "name": r.name,
                        "price": float(r.price),
                        "stock": r.stock,
                        "reference": r.reference,
                        "description": r.description[:100] if r.description else None
                    }
                    for r in results
                ]
                
                return {
                    "success": True,
                    "products": products,
                    "total_found": len(products)
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Search products error: {e}")
            return {"success": False, "error": "Erreur lors de la recherche"}
    
    def _validate_limit(self, limit: Any) -> int:
        """Validate and sanitize limit parameter"""
        try:
            limit_int = int(limit)
            return max(1, min(limit_int, 20))  # Clamp between 1-20
        except (ValueError, TypeError):
            return 10  # Default safe value
    
    def _validate_uuid(self, value: Any) -> Optional[str]:
        """Validate UUID format"""
        if not value:
            return None
        try:
            import uuid
            # Try to parse as UUID
            uuid.UUID(str(value))
            return str(value)
        except (ValueError, AttributeError):
            # Not a valid UUID, return as string (might be order_number, etc.)
            return str(value).strip()
    
    async def _save_to_db(self, user_id: str, role: str, content: str, metadata: Optional[Dict] = None):
        """
        Save message to PostgreSQL chatbot_history table
        
        Args:
            user_id: User ID
            role: 'user' or 'assistant'
            content: Message content
            metadata: Optional metadata (function calls, etc.)
        """
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    INSERT INTO chatbot_history (user_id, role, content, metadata, created_at)
                    VALUES (:user_id, :role, :content, :metadata, NOW())
                """)
                
                db.execute(query, {
                    "user_id": user_id,
                    "role": role,
                    "content": content,
                    "metadata": json.dumps(metadata) if metadata else None
                })
                db.commit()
                logger.debug(f"Saved message to DB: user={user_id}, role={role}")
            except Exception as e:
                logger.error(f"Error saving to DB: {e}", exc_info=True)
                db.rollback()
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Database connection error: {e}", exc_info=True)
    
    async def _load_from_db(self, user_id: str, limit: int = 10) -> List[Dict]:
        """
        Load conversation history from PostgreSQL chatbot_history table
        
        Args:
            user_id: User ID
            limit: Maximum number of messages to load
            
        Returns:
            List of messages in chronological order
        """
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT role, content, created_at
                    FROM chatbot_history
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC
                    LIMIT :limit
                """)
                
                results = db.execute(query, {
                    "user_id": user_id,
                    "limit": limit
                }).fetchall()
                
                # Reverse to get chronological order (oldest first)
                messages = []
                for r in reversed(results):
                    messages.append({
                        "role": r.role,
                        "content": r.content,
                        "timestamp": r.created_at.isoformat()
                    })
                
                logger.debug(f"Loaded {len(messages)} messages from DB for user {user_id}")
                return messages
            except Exception as e:
                logger.error(f"Error loading from DB: {e}", exc_info=True)
                return []
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Database connection error: {e}", exc_info=True)
            return []
    
    async def _check_rate_limit_db(self, user_id: str) -> tuple[bool, int]:
        """
        Check rate limit using PostgreSQL chatbot_rate_limits table
        
        Args:
            user_id: User ID
            
        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            from datetime import timedelta
            
            db = SessionLocal()
            try:
                # Count requests in last minute
                query = text("""
                    SELECT COUNT(*) as count
                    FROM chatbot_rate_limits
                    WHERE user_id = :user_id
                      AND request_at > NOW() - INTERVAL '1 minute'
                """)
                
                result = db.execute(query, {"user_id": user_id}).fetchone()
                current_count = result.count if result else 0
                remaining = self.rate_limit_max - current_count
                
                if current_count >= self.rate_limit_max:
                    logger.warning(f"Rate limit exceeded for user {user_id}: {current_count}/{self.rate_limit_max}")
                    return False, 0
                
                # Record this request
                insert_query = text("""
                    INSERT INTO chatbot_rate_limits (user_id, request_at)
                    VALUES (:user_id, NOW())
                """)
                db.execute(insert_query, {"user_id": user_id})
                db.commit()
                
                logger.debug(f"Rate limit check: user={user_id}, count={current_count + 1}/{self.rate_limit_max}")
                return True, remaining - 1
            except Exception as e:
                logger.error(f"Rate limit check error: {e}", exc_info=True)
                db.rollback()
                # Fail open - allow request if DB error
                return True, 10
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Database connection error: {e}", exc_info=True)
            # Fail open - allow request if DB error
            return True, 10
    
    async def _cleanup_old_rate_limits(self):
        """
        Clean up old rate limit records (run periodically)
        Removes records older than 1 hour
        """
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    DELETE FROM chatbot_rate_limits
                    WHERE request_at < NOW() - INTERVAL '1 hour'
                """)
                
                result = db.execute(query)
                db.commit()
                deleted_count = result.rowcount
                logger.info(f"Cleaned up {deleted_count} old rate limit records")
            except Exception as e:
                logger.error(f"Cleanup error: {e}", exc_info=True)
                db.rollback()
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Database connection error: {e}", exc_info=True)
    
    async def _handle_track_shipment(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """
        Track shipment - Read REAL data from missions table
        Returns actual mission status, location, and delivery info
        """
        shipment_id = args.get("shipment_id")
        if not shipment_id:
            return {
                "success": False,
                "error": "Quel est le numéro de ton colis ?",
                "error_type": "missing_parameter"
            }
        
        # Clean and validate shipment_id
        shipment_id = str(shipment_id).replace("#", "").replace("M-", "").strip()
        shipment_id = self._validate_uuid(shipment_id)
        
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT m.id, m.status, m.titre as title,
                           ad.city as origin, aa.city as destination,
                           m.date_arrivee_prevue as estimated_delivery_date,
                           u.first_name || ' ' || u.last_name as transporter_name
                    FROM missions m
                    LEFT JOIN addresses ad ON m.adresse_depart_id = ad.id
                    LEFT JOIN addresses aa ON m.adresse_arrivee_id = aa.id
                    LEFT JOIN users u ON m.transporteur_id = u.id
                    WHERE m.id = CAST(:mission_id AS UUID)
                      AND (m.affreteur_id = CAST(:user_id AS UUID) OR m.transporteur_id = CAST(:user_id AS UUID))
                    LIMIT 1
                """)
                
                result = db.execute(query, {
                    "mission_id": shipment_id,
                    "user_id": user_id
                }).fetchone()
                
                if not result:
                    return {
                        "success": False,
                        "error": f"Mission #{shipment_id} non trouvée ou tu n'y as pas accès",
                        "error_type": "not_found"
                    }
                
                return {
                    "success": True,
                    "mission": {
                        "id": str(result.id),
                        "status": result.status,
                        "title": result.title,
                        "origin": result.origin,
                        "destination": result.destination,
                        "current_location": result.origin,  # Default to origin since no current_location field
                        "estimated_delivery": result.estimated_delivery_date.isoformat() if result.estimated_delivery_date else None,
                        "transporter_name": result.transporter_name
                    }
                }
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Track shipment error: {e}", exc_info=True)
            return {
                "success": False,
                "error": "Erreur lors de la récupération des données de tracking",
                "error_type": "database_error",
                "details": str(e) if logger.level <= 10 else None  # Include details in debug mode
            }
    
    async def _handle_calculate_price(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Calculate transport price"""
        origin = args.get("origin")
        destination = args.get("destination")
        weight_kg = args.get("weight_kg", 500)
        
        if not origin or not destination:
            return {"success": False, "error": "Origine et destination requises"}
        
        try:
            from app.services.dynamic_pricing_service import get_dynamic_pricing_service
            pricing_service = get_dynamic_pricing_service()
            
            distance_map = {
                ('douala', 'yaoundé'): 250,
                ('yaoundé', 'douala'): 250,
                ('douala', 'bafoussam'): 280,
            }
            distance_km = distance_map.get((origin.lower(), destination.lower()), 300)
            
            result = pricing_service.calculate_dynamic_price(
                origin=origin,
                destination=destination,
                distance_km=distance_km,
                weight_tons=weight_kg / 1000
            )
            
            return {
                "success": True,
                "pricing": {
                    "origin": origin,
                    "destination": destination,
                    "distance_km": distance_km,
                    "weight_kg": weight_kg,
                    "price": result['calculated_price'],
                    "min_price": result['negotiation_range']['min_price'],
                    "max_price": result['negotiation_range']['max_price']
                }
            }
        except Exception as e:
            logger.error(f"Calculate price error: {e}")
            return {"success": False, "error": "Erreur lors du calcul"}
    
    async def _handle_get_user_missions(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get user missions"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            # Handle None args
            if args is None:
                args = {}
            
            status_filter = args.get("status", "all")
            limit = self._validate_limit(args.get("limit", 10))
            
            db = SessionLocal()
            try:
                # Différent selon le rôle
                if user_role == "AFFRETEUR":
                    query = text("""
                        SELECT m.id, m.titre as title, m.status, m.budget_min, m.budget_max, 
                               ad.city as depart_city, aa.city as arrival_city, m.created_at
                        FROM missions m
                        LEFT JOIN addresses ad ON m.adresse_depart_id = ad.id
                        LEFT JOIN addresses aa ON m.adresse_arrivee_id = aa.id
                        WHERE m.affreteur_id = :user_id
                    """)
                elif user_role == "TRANSPORTEUR":
                    query = text("""
                        SELECT m.id, m.titre as title, m.status, m.budget_min, m.budget_max,
                               ad.city as depart_city, aa.city as arrival_city, m.created_at
                        FROM missions m
                        LEFT JOIN addresses ad ON m.adresse_depart_id = ad.id
                        LEFT JOIN addresses aa ON m.adresse_arrivee_id = aa.id
                        WHERE m.transporteur_id = :user_id
                    """)
                
                # Common ordering for both roles
                query = text(str(query) + f" ORDER BY created_at DESC LIMIT {limit}")
                
                params = {"user_id": user_id}
                if status_filter != "all":
                    params["status"] = status_filter
                
                results = db.execute(query, params).fetchall()
                
                missions = [
                    {
                        "id": str(r.id),
                        "title": r.title,
                        "status": r.status,
                        "budget": f"{r.budget_min}-{r.budget_max} FCFA" if r.budget_min else "Non défini",
                        "path": f"{r.depart_city} → {r.arrival_city}" if r.depart_city and r.arrival_city else "Non défini",
                        "created_at": r.created_at.isoformat() if r.created_at else None
                    }
                    for r in results
                ]
                
                return {
                    "success": True,
                    "missions": missions,
                    "total": len(missions),
                    "role": user_role
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get user missions error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération des missions"}
    
    async def _handle_get_mission_updates(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get mission updates history"""
        mission_id = args.get("mission_id")
        if not mission_id:
            return {"success": False, "error": "ID mission manquant"}
        
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            # Handle None args
            if args is None:
                args = {}
            
            limit = self._validate_limit(args.get("limit", 10))
            
            db = SessionLocal()
            try:
                # Vérifier que l'utilisateur a accès à cette mission
                access_query = text("""
                    SELECT id FROM missions
                    WHERE id = CAST(:mission_id AS UUID)
                    AND (affreteur_id = CAST(:user_id AS UUID) OR transporteur_id = CAST(:user_id AS UUID))
                    LIMIT 1
                """)
                
                access = db.execute(access_query, {"mission_id": mission_id, "user_id": user_id}).fetchone()
                
                if not access:
                    return {"success": False, "error": "Mission non trouvée ou accès refusé"}
                
                # Récupérer les mises à jour
                query = text(f"""
                    SELECT id, type, title, description, old_status, new_status,
                           latitude, longitude, address, created_at
                    FROM mission_updates
                    WHERE mission_id = CAST(:mission_id AS UUID)
                    AND is_public = true
                    ORDER BY created_at DESC
                    LIMIT {limit}
                """)
                
                results = db.execute(query, {"mission_id": mission_id}).fetchall()
                
                updates = [
                    {
                        "id": r.id,
                        "type": r.type,
                        "title": r.title,
                        "description": r.description,
                        "old_status": r.old_status,
                        "new_status": r.new_status,
                        "location": {
                            "latitude": float(r.latitude) if r.latitude else None,
                            "longitude": float(r.longitude) if r.longitude else None,
                            "address": r.address
                        } if r.latitude or r.longitude or r.address else None,
                        "created_at": r.created_at.isoformat() if r.created_at else None
                    }
                    for r in results
                ]
                
                return {
                    "success": True,
                    "updates": updates,
                    "total": len(updates)
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get mission updates error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération des mises à jour"}
    
    async def _handle_get_product_details(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get product details"""
        product_id = args.get("product_id")
        if not product_id:
            return {"success": False, "error": "ID produit manquant"}
        
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT id, name, description, price, stock, reference, unit, category_id
                    FROM products
                    WHERE id = CAST(:product_id AS UUID) AND is_active = true
                    LIMIT 1
                """)
                
                result = db.execute(query, {"product_id": product_id}).fetchone()
                
                if result:
                    return {
                        "success": True,
                        "product": {
                            "id": str(result.id),
                            "name": result.name,
                            "description": result.description,
                            "price": float(result.price),
                            "stock": result.stock,
                            "reference": result.reference,
                            "unit": result.unit,
                            "available": result.stock > 0
                        }
                    }
                else:
                    return {"success": False, "error": "Produit non trouvé"}
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get product details error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération du produit"}
    
    async def _handle_get_categories(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get product categories"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT id, name, description, slug, parent_id
                    FROM categories
                    WHERE is_active = true
                    ORDER BY display_order ASC, name ASC
                """)
                
                results = db.execute(query).fetchall()
                
                categories = [
                    {
                        "id": str(r.id),
                        "name": r.name,
                        "description": r.description,
                        "slug": r.slug,
                        "parent_id": str(r.parent_id) if r.parent_id else None
                    }
                    for r in results
                ]
                
                return {
                    "success": True,
                    "categories": categories,
                    "total": len(categories)
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get categories error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération des catégories"}
    
    async def _handle_get_cart(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get user cart"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                # Get cart
                cart_query = text("""
                    SELECT id
                    FROM carts
                    WHERE user_id = CAST(:user_id AS UUID) AND status = 'active'
                    LIMIT 1
                """)
                cart = db.execute(cart_query, {"user_id": user_id}).fetchone()
                
                if not cart:
                    return {
                        "success": True,
                        "cart": {"items": [], "total": 0, "items_count": 0},
                        "message": "Panier vide"
                    }
                
                # Get cart items
                items_query = text("""
                    SELECT ci.id, ci.quantity, ci.unit_price,
                           p.name as product_name, p.stock
                    FROM cart_items ci
                    JOIN products p ON ci.product_id = p.id
                    WHERE ci.cart_id = :cart_id
                """)
                items = db.execute(items_query, {"cart_id": cart.id}).fetchall()
                
                cart_items = [
                    {
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "unit_price": float(item.unit_price),
                        "subtotal": float(item.unit_price * item.quantity),
                        "in_stock": item.stock >= item.quantity
                    }
                    for item in items
                ]
                
                total = sum(float(item.unit_price * item.quantity) for item in items)
                
                return {
                    "success": True,
                    "cart": {
                        "items": cart_items,
                        "total": total,
                        "items_count": len(cart_items)
                    }
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get cart error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération du panier"}
    
    # ❌ HANDLER SUPPRIMÉ : add_to_cart (MODE READ-ONLY)
    # Le chatbot ne peut plus ajouter au panier
    # Il guide l'utilisateur vers la page produit à la place
    async def _handle_get_my_orders(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get user orders"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            # Handle None args
            if args is None:
                args = {}
            
            status_filter = args.get("status", "all")
            limit = self._validate_limit(args.get("limit", 10))
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT id, order_number, status, total, created_at
                    FROM orders
                    WHERE user_id = CAST(:user_id AS UUID)
                """)
                
                if status_filter != "all":
                    query = text(str(query) + " AND status = CAST(:status AS order_status)")
                
                query = text(str(query) + f" ORDER BY created_at DESC LIMIT {limit}")
                
                params = {"user_id": user_id}
                if status_filter != "all":
                    params["status"] = status_filter
                
                results = db.execute(query, params).fetchall()
                
                orders = [
                    {
                        "id": str(r.id),
                        "order_number": r.order_number,
                        "status": r.status,
                        "total": float(r.total),
                        "date": r.created_at.isoformat() if r.created_at else None
                    }
                    for r in results
                ]
                
                return {
                    "success": True,
                    "orders": orders,
                    "total": len(orders)
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get orders error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération des commandes"}
    
    async def _handle_get_order_details(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get order details"""
        order_id = args.get("order_id")
        if not order_id:
            return {"success": False, "error": "ID commande manquant"}
        
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                # Get order
                order_query = text("""
                    SELECT id, order_number, status, total, created_at
                    FROM orders
                    WHERE (id = CAST(:order_id AS UUID) OR order_number = :order_id) 
                    AND user_id = CAST(:user_id AS UUID)
                    LIMIT 1
                """)
                order = db.execute(order_query, {"order_id": order_id, "user_id": user_id}).fetchone()
                
                if not order:
                    return {"success": False, "error": "Commande non trouvée"}
                
                # Get order items
                items_query = text("""
                    SELECT oi.quantity, oi.unit_price, p.name as product_name
                    FROM order_items oi
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = :order_id
                """)
                items = db.execute(items_query, {"order_id": order.id}).fetchall()
                
                order_items = [
                    {
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "unit_price": float(item.unit_price),
                        "subtotal": float(item.unit_price * item.quantity)
                    }
                    for item in items
                ]
                
                return {
                    "success": True,
                    "order": {
                        "order_number": order.order_number,
                        "status": order.status,
                        "total": float(order.total),
                        "items": order_items,
                        "date": order.created_at.isoformat() if order.created_at else None
                    }
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get order details error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération de la commande"}
    
    async def _handle_get_available_missions(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get available missions for transporters"""
        if user_role != "TRANSPORTEUR":
            return {"success": False, "error": "Fonction réservée aux transporteurs"}
        
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            # Handle None args
            if args is None:
                args = {}
            
            limit = self._validate_limit(args.get("limit", 10))
            
            db = SessionLocal()
            try:
                query = text(f"""
                    SELECT m.id, m.titre as title, m.budget_min, m.budget_max, 
                           ad.city as depart_city, aa.city as arrival_city, 
                           m.type_marchandise, m.poids
                    FROM missions m
                    LEFT JOIN addresses ad ON m.adresse_depart_id = ad.id
                    LEFT JOIN addresses aa ON m.adresse_arrivee_id = aa.id
                    WHERE m.status = 'published' AND m.transporteur_id IS NULL
                    ORDER BY m.created_at DESC
                    LIMIT {limit}
                """)
                
                results = db.execute(query).fetchall()
                
                missions = [
                    {
                        "id": str(r.id),
                        "title": r.title,
                        "budget": f"{r.budget_min}-{r.budget_max} FCFA" if r.budget_min else "À négocier",
                        "path": f"{r.depart_city} → {r.arrival_city}" if r.depart_city and r.arrival_city else "Non défini",
                        "cargo": r.type_marchandise,
                        "weight": f"{r.poids}kg" if r.poids else "Non spécifié"
                    }
                    for r in results
                ]
                
                return {
                    "success": True,
                    "missions": missions,
                    "total": len(missions)
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get available missions error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération des missions"}
    
    async def _handle_get_my_vehicles(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get transporter vehicles"""
        if user_role != "TRANSPORTEUR":
            return {"success": False, "error": "Fonction réservée aux transporteurs"}
        
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            # Handle None args
            if args is None:
                args = {}
            
            status_filter = args.get("status", "all")
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT id, registration, type, description, status
                    FROM vehicles
                    WHERE user_id = CAST(:user_id AS UUID)
                """)
                
                if status_filter != "all":
                    query = text(str(query) + " AND status = :status")
                
                query = text(str(query) + " ORDER BY created_at DESC")
                
                params = {"user_id": user_id}
                if status_filter != "all":
                    params["status"] = status_filter
                
                results = db.execute(query, params).fetchall()
                
                vehicles = [
                    {
                        "id": str(r.id),
                        "registration": r.registration,
                        "type": r.type,
                        "description": r.description,
                        "status": r.status
                    }
                    for r in results
                ]
                
                return {
                    "success": True,
                    "vehicles": vehicles,
                    "total": len(vehicles)
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get vehicles error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération des véhicules"}
    
    async def _handle_get_unread_messages(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get unread messages count"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                # Count unread messages
                count_query = text("""
                    SELECT COUNT(*) as unread_count
                    FROM messages m
                    JOIN conversations c ON m.conversation_id = c.id
                    WHERE (c.user1_id = :user_id OR c.user2_id = :user_id)
                    AND m.sender_id != :user_id
                    AND m.read_at IS NULL
                """)
                count = db.execute(count_query, {"user_id": user_id}).fetchone()
                
                # Get recent conversations with unread
                convs_query = text("""
                    SELECT DISTINCT c.id, c.type, 
                           CASE 
                             WHEN c.user1_id = :user_id THEN u2.first_name || ' ' || u2.last_name
                             ELSE u1.first_name || ' ' || u1.last_name
                           END as other_user_name,
                           COUNT(m.id) as unread_in_conv
                    FROM conversations c
                    LEFT JOIN users u1 ON c.user1_id = u1.id
                    LEFT JOIN users u2 ON c.user2_id = u2.id
                    LEFT JOIN messages m ON m.conversation_id = c.id 
                                         AND m.sender_id != :user_id 
                                         AND m.read_at IS NULL
                    WHERE c.user1_id = :user_id OR c.user2_id = :user_id
                    GROUP BY c.id, c.type, u1.first_name, u1.last_name, u2.first_name, u2.last_name
                    HAVING COUNT(m.id) > 0
                    LIMIT 5
                """)
                convs = db.execute(convs_query, {"user_id": user_id}).fetchall()
                
                conversations = [
                    {
                        "conversation_id": str(conv.id),
                        "type": conv.type,
                        "other_user": conv.other_user_name,
                        "unread_count": conv.unread_in_conv
                    }
                    for conv in convs
                ]
                
                return {
                    "success": True,
                    "total_unread": count.unread_count if count else 0,
                    "conversations": conversations
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get unread messages error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération des messages"}
    
    async def _handle_get_notifications(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get user notifications"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            # Handle None args
            if args is None:
                args = {}
            
            unread_only = args.get("unread_only", False)
            limit = self._validate_limit(args.get("limit", 10))
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT id, type, title, message, priority, read_at, created_at
                    FROM notifications
                    WHERE user_id = :user_id
                """)
                
                if unread_only:
                    query = text(str(query) + " AND read_at IS NULL")
                
                query = text(str(query) + f" ORDER BY created_at DESC LIMIT {limit}")
                
                results = db.execute(query, {"user_id": user_id}).fetchall()
                
                notifications = [
                    {
                        "id": str(r.id),
                        "type": r.type,
                        "title": r.title,
                        "message": r.message,
                        "priority": r.priority,
                        "read": r.read_at is not None,
                        "date": r.created_at.isoformat() if r.created_at else None
                    }
                    for r in results
                ]
                
                return {
                    "success": True,
                    "notifications": notifications,
                    "total": len(notifications)
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get notifications error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération des notifications"}
    
    async def _handle_get_my_profile(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get user profile"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT id, email, first_name, last_name, phone, role, 
                           email_verified_at, mfa_enabled, created_at
                    FROM users
                    WHERE id = CAST(:user_id AS UUID)
                    LIMIT 1
                """)
                
                result = db.execute(query, {"user_id": user_id}).fetchone()
                
                if result:
                    return {
                        "success": True,
                        "profile": {
                            "id": str(result.id),
                            "email": result.email,
                            "name": f"{result.first_name} {result.last_name}",
                            "phone": result.phone,
                            "role": result.role,
                            "email_verified": result.email_verified_at is not None,
                            "mfa_enabled": result.mfa_enabled,
                            "member_since": result.created_at.isoformat() if result.created_at else None
                        }
                    }
                else:
                    return {"success": False, "error": "Profil non trouvé"}
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get profile error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération du profil"}
    
    async def _handle_get_my_addresses(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """Get user addresses"""
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                query = text("""
                    SELECT id, label, street, city, region, 
                           postal_code, country
                    FROM addresses
                    WHERE user_id = CAST(:user_id AS UUID)
                    ORDER BY created_at DESC
                """)
                
                results = db.execute(query, {"user_id": user_id}).fetchall()
                
                addresses = [
                    {
                        "id": str(r.id),
                        "label": r.label,
                        "address": f"{r.street}, {r.city}",
                        "full_address": f"{r.street}, {r.city}, {r.region or ''}, {r.postal_code or ''}, {r.country}".replace(", ,", ",").strip(", "),
                    }
                    for r in results
                ]
                
                return {
                    "success": True,
                    "addresses": addresses,
                    "total": len(addresses)
                }
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get addresses error: {e}")
            return {"success": False, "error": "Erreur lors de la récupération des adresses"}
    
    async def _handle_request_clarification(self, args: Dict, user_id: str, user_role: str, token: Optional[str]) -> Dict:
        """
        Handle clarification request.
        This is a special function that does not fetch data but signals ambiguity.
        """
        ambiguity_reason = args.get("ambiguity_reason", "Requête ambiguë")
        options = args.get("options", [])
        
        logger.info(f"Clarification requested: {ambiguity_reason} | Options: {options}")
        
        return {
            "success": True,
            "type": "clarification_needed",
            "reason": ambiguity_reason,
            "options": options,
            "message": "Clarification demandée à l'utilisateur"
        }
    
    def _save_pending_clarification(self, conversation_id: str, original_message: str, options: List[str]):
        """Save clarification state for follow-up"""
        self.pending_clarifications[conversation_id] = {
            "original_message": original_message,
            "options": options,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _get_pending_clarification(self, conversation_id: str) -> Optional[Dict]:
        """Get pending clarification if exists"""
        return self.pending_clarifications.get(conversation_id)
    
    def _clear_pending_clarification(self, conversation_id: str):
        """Clear pending clarification after resolution"""
        if conversation_id in self.pending_clarifications:
            del self.pending_clarifications[conversation_id]
    
    def _detect_clarification_response(self, message: str, pending: Dict) -> Optional[str]:
        """Detect if message is a response to clarification (1, 2, 3, etc.)"""
        message_clean = message.strip().lower()
        
        # Check for numeric response
        if message_clean in ["1", "1️⃣", "un", "premier", "première"]:
            return pending["options"][0] if len(pending["options"]) > 0 else None
        elif message_clean in ["2", "2️⃣", "deux", "deuxième", "second"]:
            return pending["options"][1] if len(pending["options"]) > 1 else None
        elif message_clean in ["3", "3️⃣", "trois", "troisième"]:
            return pending["options"][2] if len(pending["options"]) > 2 else None
        
        return None
    
    def _check_rate_limit(self, user_id: str) -> tuple[bool, int]:
        """
        Check if user has exceeded rate limit
        Returns: (is_allowed, remaining_requests)
        """
        import time
        now = time.time()
        
        # Get user's request history
        if user_id not in self.rate_limit_tracker:
            self.rate_limit_tracker[user_id] = []
        
        # Remove old timestamps outside the window
        self.rate_limit_tracker[user_id] = [
            ts for ts in self.rate_limit_tracker[user_id]
            if now - ts < self.rate_limit_window
        ]
        
        # Check limit
        current_count = len(self.rate_limit_tracker[user_id])
        remaining = self.rate_limit_max - current_count
        
        if current_count >= self.rate_limit_max:
            return False, 0
        
        # Add current request
        self.rate_limit_tracker[user_id].append(now)
        
        return True, remaining - 1


    def _clean_response(self, text: str) -> str:
        """Clean response from artifacts like <function=...> tags"""
        if not text:
            return ""
        
        # Remove <function=name>...</function> tags
        # This regex matches <function=name> content </function>
        # It uses non-greedy matching for content
        cleaned = re.sub(r'<function=[^>]+>.*?</function>', '', text, flags=re.DOTALL)
        
        # Also remove standalone <function=name> tags if any
        cleaned = re.sub(r'<function=[^>]+>', '', cleaned)
        cleaned = re.sub(r'</function>', '', cleaned)
        
        return cleaned.strip()

# Singleton
_chatbot_fc: Optional[ChatbotFunctionCallingService] = None


def get_chatbot_function_calling() -> ChatbotFunctionCallingService:
    "Get or create function calling chatbot"
    global _chatbot_fc
    if _chatbot_fc is None:
        _chatbot_fc = ChatbotFunctionCallingService()
    return _chatbot_fc

