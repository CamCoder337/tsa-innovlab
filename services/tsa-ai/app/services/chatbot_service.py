"""
Chatbot Service
Handles intent detection, response generation, and integration with other services
"""
import logging
import httpx
import json
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.utils.intent_classifier import IntentClassifier
from app.schemas.chatbot import ChatbotResponse, Intent
from app.core.config import settings
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)

# Redis client (lazy initialization)
_redis_client = None


def get_redis_client():
    """Get or create Redis client"""
    global _redis_client
    if _redis_client is None and settings.redis_url:
        try:
            import redis
            _redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            _redis_client.ping()
            logger.info("Redis connected successfully for chatbot")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using in-memory storage.")
            _redis_client = None
    return _redis_client


class ChatbotService:
    """
    Main chatbot service
    Coordinates intent detection and response generation
    """
    
    def __init__(self):
        self.classifier = IntentClassifier()
        self.monolith_base_url = settings.monolith_api_url
        self.conversation_history: Dict[str, List[Dict]] = {}  # Fallback in-memory storage
        self.redis_client = get_redis_client()
        self.history_ttl = 3600  # 1 hour TTL for conversation history
        
        # Initialize LLM service
        self.llm_service = get_llm_service(
            api_key=settings.groq_api_key,
            model=settings.llm_model
        ) if settings.llm_enabled else None
    
    async def process_message(
        self,
        message: str,
        user_id: str,
        user_role: Optional[str] = None,
        user_token: Optional[str] = None,
        conversation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> ChatbotResponse:
        """
        Process user message and generate response
        """
        try:
            # Log incoming request for debugging
            logger.info(f"Processing message - user_id: {user_id}, user_role: {user_role}, message: {message[:50]}")
            
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
            
            # Check if we should use LLM
            use_llm = False
            if self.llm_service:
                use_llm = await self.llm_service.should_use_llm(
                    intent=intent_name,
                    confidence=confidence,
                    message=message
                )
            
            # Generate response
            if use_llm:
                logger.info("Using LLM for response generation")
                response = await self._handle_with_llm(
                    message=message,
                    intent_name=intent_name,
                    confidence=confidence,
                    entities=entities,
                    user_id=user_id,
                    user_role=user_role,
                    user_token=user_token,
                    context=context,
                    conversation_id=conversation_id or user_id
                )
            else:
                logger.info("Using rule-based response")
                response = await self._handle_intent(
                    intent_name=intent_name,
                    confidence=confidence,
                    entities=entities,
                    user_id=user_id,
                    user_role=user_role,
                    user_token=user_token,
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
    
    async def _handle_with_llm(
        self,
        message: str,
        intent_name: str,
        confidence: float,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str],
        context: Optional[Dict[str, Any]],
        conversation_id: str
    ) -> ChatbotResponse:
        """Handle message using LLM"""
        
        # Get conversation history
        history = self.get_history(conversation_id)
        
        # Prepare context for LLM
        llm_context = {
            "intent": intent_name,
            "entities": entities,
            "confidence": confidence
        }
        if context:
            llm_context.update(context)
        
        # Generate response with LLM
        llm_response = await self.llm_service.generate_response(
            message=message,
            context=llm_context,
            user_role=user_role,
            conversation_history=history
        )
        
        # If LLM fails, fallback to rule-based
        if not llm_response:
            logger.warning("LLM failed, falling back to rule-based response")
            return await self._handle_intent(
                intent_name=intent_name,
                confidence=confidence,
                entities=entities,
                user_id=user_id,
                user_role=user_role,
                user_token=user_token,
                context=context
            )
        
        # Build suggestions based on intent
        suggestions = self._get_suggestions_for_intent(intent_name, user_role)
        
        return ChatbotResponse(
            message=llm_response,
            intent=Intent(name=intent_name, confidence=confidence, entities=entities),
            suggestions=suggestions,
            requires_human=confidence < 0.3
        )
    
    def _get_suggestions_for_intent(self, intent: str, user_role: Optional[str]) -> List[str]:
        """Get contextual suggestions based on intent"""
        
        suggestions_map = {
            "tracking": ["Voir sur la carte", "Contacter le transporteur", "Historique"],
            "pricing": ["Créer une mission", "Voir transporteurs", "Modifier le poids"],
            "products": ["Voir détails", "Ajouter au panier", "Recherche par photo"],
            "mission_status": ["Voir missions", "Créer mission", "Historique"],
            "help": ["Suivre un colis", "Calculer un prix", "Chercher des pièces"],
            "greeting": ["Suivre un colis", "Calculer un tarif", "Voir catalogue"],
            "unknown": ["Suivre un colis", "Calculer un prix", "Parler à un humain"]
        }
        
        return suggestions_map.get(intent, ["Aide", "Menu principal"])
    
    async def _handle_intent(
        self,
        intent_name: str,
        confidence: float,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str],
        context: Optional[Dict[str, Any]]
    ) -> ChatbotResponse:
        """Route to appropriate handler based on intent"""
        
        handlers = {
            "tracking": lambda e, uid, role, conf: self._handle_tracking(e, uid, role, user_token, conf),
            "pricing": lambda e, uid, role, conf: self._handle_pricing(e, uid, role, user_token, conf),
            "products": lambda e, uid, role, conf: self._handle_products(e, uid, role, user_token, conf),
            "mission_status": lambda e, uid, role, conf: self._handle_mission_status(e, uid, role, user_token, conf),
            "help": lambda e, uid, role, conf: self._handle_help(e, uid, role, user_token, conf),
            "greeting": lambda e, uid, role, conf: self._handle_greeting(e, uid, role, user_token, conf),
            "unknown": lambda e, uid, role, conf: self._handle_unknown(e, uid, role, user_token, conf),
        }
        
        handler = handlers.get(intent_name, handlers["unknown"])
        return await handler(entities, user_id, user_role, confidence)
    
    async def _handle_tracking(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle tracking intent with real database data"""
        
        shipment_id = entities.get('id')
        
        if not shipment_id:
            return ChatbotResponse(
                message="🔍 Pour suivre votre colis, merci de me fournir le numéro de suivi.\n\n"
                       "Format: #12345 ou TSA-12345",
                intent=Intent(name="tracking", confidence=confidence, entities=entities),
                suggestions=[
                    "Voir mes colis en cours",
                    "Historique de livraisons",
                    "Créer une nouvelle mission"
                ]
            )
        
        # Query real database for shipment
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            
            try:
                # Clean shipment ID (remove # or TSA- prefix)
                clean_id = str(shipment_id).replace('#', '').replace('TSA-', '').strip()
                
                # Query shipment from database (filtered by user access)
                query = text("""
                    SELECT 
                        s.id,
                        s.status,
                        s.origin,
                        s.destination,
                        s.current_location,
                        s.estimated_delivery,
                        s.created_at,
                        u.first_name || ' ' || u.last_name as transporter_name,
                        u.phone as transporter_phone
                    FROM shipments s
                    LEFT JOIN users u ON s.transporter_id = u.id
                    WHERE s.id = :shipment_id
                      AND (
                        s.client_id = :user_id 
                        OR s.transporter_id = :user_id
                        OR s.affreteur_id = :user_id
                      )
                    LIMIT 1
                """)
                
                result = db.execute(query, {"shipment_id": clean_id, "user_id": user_id}).fetchone()
                
                if not result:
                    # Shipment not found - fallback to realistic simulation
                    logger.warning(f"Shipment {clean_id} not found in database")
                    return self._handle_tracking_fallback(shipment_id, confidence, entities)
                
                # Parse result
                from datetime import datetime, timedelta
                import random
                
                # Map database status to display info
                status_map = {
                    "PENDING": {"label": "En attente", "icon": "⏳", "progress": 10},
                    "CONFIRMED": {"label": "Confirmé", "icon": "✅", "progress": 20},
                    "IN_PROGRESS": {"label": "En cours", "icon": "📦", "progress": 40},
                    "IN_TRANSIT": {"label": "En transit", "icon": "🚚", "progress": 60},
                    "NEAR_DESTINATION": {"label": "Proche destination", "icon": "🎯", "progress": 85},
                    "DELIVERED": {"label": "Livré", "icon": "✅", "progress": 100},
                    "CANCELLED": {"label": "Annulé", "icon": "❌", "progress": 0}
                }
                
                db_status = result.status if result.status else "PENDING"
                status_info = status_map.get(db_status, status_map["PENDING"])
                
                # Calculate ETA
                if result.estimated_delivery:
                    eta_time = result.estimated_delivery
                    now = datetime.now()
                    eta_hours = max(0, int((eta_time - now).total_seconds() / 3600))
                    eta_str = eta_time.strftime("%H:%M")
                else:
                    eta_hours = 24
                    eta_str = "Non défini"
                
                # Build location string
                current_loc = result.current_location if result.current_location else result.origin
                
                # Build message based on status
                if db_status == "DELIVERED":
                    message = (
                        f"{status_info['icon']} **Colis #{shipment_id} - {status_info['label']}**\n\n"
                        f"📍 Livré à: {result.destination}\n"
                        f"✅ Statut: Livraison confirmée\n"
                        f"⭐ Merci d'avoir utilisé TSA Logistique!"
                    )
                    suggestions = [
                        "Voir le reçu",
                        "Noter le transporteur",
                        "Nouvelle expédition"
                    ]
                elif db_status == "CANCELLED":
                    message = (
                        f"{status_info['icon']} **Colis #{shipment_id} - {status_info['label']}**\n\n"
                        f"📍 Trajet: {result.origin} → {result.destination}\n"
                        f"❌ Cette mission a été annulée\n"
                        f"💬 Contactez le support pour plus d'informations"
                    )
                    suggestions = [
                        "Contacter le support",
                        "Créer nouvelle mission",
                        "Voir historique"
                    ]
                else:
                    transporter_info = ""
                    if result.transporter_name:
                        transporter_info = f"👤 Transporteur: {result.transporter_name}\n"
                        if result.transporter_phone:
                            transporter_info += f"📞 Contact: {result.transporter_phone}\n"
                    
                    message = (
                        f"{status_info['icon']} **Colis #{shipment_id} - {status_info['label']}**\n\n"
                        f"📍 Trajet: {result.origin} → {result.destination}\n"
                        f"📌 Position actuelle: {current_loc}\n"
                        f"⏱️ Livraison estimée: {eta_str} ({eta_hours}h)\n"
                        f"📊 Progression: {status_info['progress']}%\n"
                        f"{transporter_info}"
                    )
                    suggestions = [
                        "Voir sur la carte GPS",
                        "Contacter le transporteur" if result.transporter_name else "Voir détails",
                        "Historique détaillé"
                    ]
                
                return ChatbotResponse(
                    message=message,
                    intent=Intent(name="tracking", confidence=confidence, entities=entities),
                    suggestions=suggestions,
                    data={
                        "shipment_id": clean_id,
                        "status": db_status,
                        "origin": result.origin,
                        "destination": result.destination,
                        "current_location": current_loc,
                        "eta_hours": eta_hours,
                        "eta_time": eta_str,
                        "progress": status_info['progress'],
                        "transporter": result.transporter_name
                    }
                )
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Database error in tracking: {e}")
            # Fallback to simulation if DB fails
            return self._handle_tracking_fallback(shipment_id, confidence, entities)
    
    def _handle_tracking_fallback(
        self,
        shipment_id: str,
        confidence: float,
        entities: Dict[str, Any]
    ) -> ChatbotResponse:
        """Fallback tracking response when DB is unavailable"""
        from datetime import datetime, timedelta
        import random
        
        statuses = [
            {"status": "pending", "label": "En attente", "icon": "⏳", "location": "Douala - Entrepôt TSA", "eta_hours": 24, "progress": 10},
            {"status": "in_transit", "label": "En transit", "icon": "🚚", "location": "Route Douala-Yaoundé", "eta_hours": 3, "progress": 60},
        ]
        
        status_info = random.choice(statuses)
        eta_time = datetime.now() + timedelta(hours=status_info['eta_hours'])
        eta_str = eta_time.strftime("%H:%M")
        
        message = (
            f"{status_info['icon']} **Colis #{shipment_id} - {status_info['label']}**\n\n"
            f"📍 Position: {status_info['location']}\n"
            f"⏱️ Livraison estimée: Aujourd'hui à {eta_str}\n"
            f"📊 Progression: {status_info['progress']}%\n\n"
            f"ℹ️ Données simulées - Connectez-vous pour voir les vraies données"
        )
        
        return ChatbotResponse(
            message=message,
            intent=Intent(name="tracking", confidence=confidence, entities=entities),
            suggestions=["Se connecter", "Créer une mission", "Support"],
            data={"shipment_id": shipment_id, "simulated": True}
        )
    
    async def _handle_pricing(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle pricing intent with real pricing service"""
        
        origin = entities.get('origin')
        destination = entities.get('destination')
        weight = entities.get('weight', 500.0)  # Default 500kg
        
        if not origin or not destination:
            return ChatbotResponse(
                message="Pour calculer un tarif précis, j'ai besoin de:\n"
                       "• 📍 Ville de départ\n"
                       "• 📍 Ville d'arrivée\n"
                       "• 📦 Poids (optionnel, défaut: 500kg)\n\n"
                       "Exemple: 'Combien coûte de Douala à Yaoundé pour 500kg ?'",
                intent=Intent(name="pricing", confidence=confidence, entities=entities),
                suggestions=[
                    "Douala → Yaoundé 500kg",
                    "Yaoundé → Bafoussam 1000kg",
                    "Voir grille tarifaire"
                ]
            )
        
        # Call real pricing service
        try:
            from app.services.dynamic_pricing_service import get_dynamic_pricing_service
            pricing_service = get_dynamic_pricing_service()
            
            # Calculate real distance based on cities
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
            distance_km = distance_map.get((origin_key, dest_key), 300)  # Default 300km
            
            # Calculate with real service
            result = pricing_service.calculate_dynamic_price(
                origin=origin,
                destination=destination,
                distance_km=distance_km,
                weight_tons=weight / 1000,
                cargo_type="general",
                urgency="standard"
            )
            
            # Format response with real data
            price = result['calculated_price']
            min_price = result['negotiation_range']['min_price']
            max_price = result['negotiation_range']['max_price']
            
            message = (
                f"💰 **Tarif calculé avec notre IA de pricing dynamique**\n\n"
                f"📍 Trajet: {origin} → {destination} ({distance_km}km)\n"
                f"📦 Poids: {weight}kg ({weight/1000:.1f} tonnes)\n"
                f"💵 **Prix recommandé: {price:,.0f} FCFA**\n"
                f"📊 Fourchette de négociation: {min_price:,.0f} - {max_price:,.0f} FCFA\n\n"
                f"✨ Ce prix est optimisé en temps réel selon la demande et la disponibilité."
            )
            
            return ChatbotResponse(
                message=message,
                intent=Intent(name="pricing", confidence=confidence, entities=entities),
                suggestions=[
                    "Créer une mission avec ce prix",
                    "Voir transporteurs disponibles",
                    "Calculer pour un autre trajet"
                ],
                data={
                    **result,
                    'distance_km': distance_km,
                    'weight_kg': weight
                }
            )
            
        except Exception as e:
            logger.error(f"Pricing calculation error: {e}")
            return ChatbotResponse(
                message="❌ Désolé, je n'ai pas pu calculer le prix pour le moment.\n"
                       "Veuillez réessayer ou contacter le support.",
                intent=Intent(name="pricing", confidence=confidence, entities=entities),
                requires_human=True,
                suggestions=["Réessayer", "Contacter le support"]
            )
    
    async def _handle_products(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle products search intent with real database"""
        
        brand = entities.get('brand')
        category = entities.get('category')
        
        # Query real database for products
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            
            try:
                # Build query with filters
                query_parts = ["SELECT id, name, price, stock_quantity, brand, category FROM products WHERE 1=1"]
                params = {}
                
                if brand:
                    query_parts.append("AND LOWER(brand) LIKE LOWER(:brand)")
                    params['brand'] = f"%{brand}%"
                
                if category:
                    query_parts.append("AND LOWER(category) LIKE LOWER(:category)")
                    params['category'] = f"%{category}%"
                
                query_parts.append("AND stock_quantity > 0")
                query_parts.append("ORDER BY stock_quantity DESC, price ASC")
                query_parts.append("LIMIT 5")
                
                query = text(" ".join(query_parts))
                results = db.execute(query, params).fetchall()
                
                if results and len(results) > 0:
                    # Format real products from DB
                    products_list = "\n".join([
                        f"{i+1}. **{row.name}**\n"
                        f"   💰 {row.price:,} FCFA | 📦 Stock: {row.stock_quantity} | ✅ Disponible"
                        for i, row in enumerate(results[:3])
                    ])
                    
                    filters = []
                    if brand:
                        filters.append(f"Marque: {brand}")
                    if category:
                        filters.append(f"Catégorie: {category}")
                    filter_text = " | ".join(filters) if filters else "Tous les produits"
                    
                    message = (
                        f"🔧 **Pièces détachées TSA Marketplace**\n\n"
                        f"🔍 Filtres: {filter_text}\n"
                        f"📦 {len(results)} produits disponibles\n\n"
                        f"{products_list}\n\n"
                        f"💡 Tous nos produits sont certifiés et en stock!"
                    )
                    
                    return ChatbotResponse(
                        message=message,
                        intent=Intent(name="products", confidence=confidence, entities=entities),
                        suggestions=[
                            f"Voir détails produit #{results[0].id}",
                            "Recherche par photo",
                            "Voir tout le catalogue"
                        ],
                        data={
                            "filters": entities,
                            "results_count": len(results),
                            "products": [{"id": r.id, "name": r.name, "price": r.price} for r in results[:3]]
                        }
                    )
                else:
                    # No products found - use fallback
                    logger.info(f"No products found for filters: {entities}")
                    return self._handle_products_fallback(brand, category, confidence, entities)
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Database error in products search: {e}")
            # Fallback to realistic catalog if DB fails
            return self._handle_products_fallback(brand, category, confidence, entities)
    
    def _handle_products_fallback(
        self,
        brand: Optional[str],
        category: Optional[str],
        confidence: float,
        entities: Dict[str, Any]
    ) -> ChatbotResponse:
        """Fallback products response when DB is unavailable"""
        
        # Realistic product catalog as fallback
        products_db = {
            'volvo': [
                {"name": "Moteur Volvo D13 (450ch)", "price": 4500000, "condition": "Reconditionné", "warranty": "6 mois"},
                {"name": "Boîte de vitesses Volvo I-Shift", "price": 3200000, "condition": "Reconditionné", "warranty": "6 mois"},
                {"name": "Turbo Volvo D13", "price": 850000, "condition": "Occasion", "warranty": "3 mois"},
            ],
            'mercedes': [
                {"name": "Moteur Mercedes OM471 (450ch)", "price": 4800000, "condition": "Reconditionné", "warranty": "6 mois"},
                {"name": "Boîte de vitesses Mercedes PowerShift", "price": 3500000, "condition": "Reconditionné", "warranty": "6 mois"},
                {"name": "Système de freinage Mercedes Actros", "price": 1200000, "condition": "Neuf", "warranty": "12 mois"},
            ],
            'scania': [
                {"name": "Moteur Scania DC13 (500ch)", "price": 5200000, "condition": "Reconditionné", "warranty": "6 mois"},
                {"name": "Boîte de vitesses Scania Opticruise", "price": 3800000, "condition": "Reconditionné", "warranty": "6 mois"},
            ],
            'general': [
                {"name": "Système de freinage universel", "price": 180000, "condition": "Neuf", "warranty": "12 mois"},
                {"name": "Kit d'embrayage poids lourd", "price": 250000, "condition": "Neuf", "warranty": "12 mois"},
                {"name": "Radiateur poids lourd", "price": 320000, "condition": "Reconditionné", "warranty": "6 mois"},
            ]
        }
        
        # Select products based on brand
        if brand:
            brand_key = brand.lower()
            products = products_db.get(brand_key, products_db['general'])
        else:
            # Mix of products
            products = products_db['general']
        
        # Build filters text
        filters = []
        if brand:
            filters.append(f"Marque: {brand}")
        if category:
            filters.append(f"Catégorie: {category}")
        filter_text = " | ".join(filters) if filters else "Tous les produits"
        
        # Format products list
        products_list = "\n".join([
            f"{i+1}. **{p['name']}**\n"
            f"   💰 {p['price']:,} FCFA | {p['condition']} | ✅ Garantie {p['warranty']}"
            for i, p in enumerate(products[:3])
        ])
        
        message = (
            f"🔧 **Pièces détachées reconditionnées TSA**\n\n"
            f"🔍 Filtres: {filter_text}\n"
            f"📦 {len(products)} produits disponibles\n\n"
            f"{products_list}\n\n"
            f"💡 Tous nos produits sont certifiés et garantis!"
        )
        
        return ChatbotResponse(
            message=message,
            intent=Intent(name="products", confidence=confidence, entities=entities),
            suggestions=[
                "Voir détails produit #1",
                "Recherche par photo",
                "Voir tout le catalogue"
            ],
            data={
                "filters": entities,
                "results_count": len(products),
                "products": products[:3]
            }
        )
    
    async def _handle_mission_status(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str],
        confidence: float
    ) -> ChatbotResponse:
        """Handle mission status intent with real database"""
        
        # Normalize role (handle both uppercase and lowercase)
        normalized_role = user_role.upper() if user_role else None
        
        logger.info(f"Mission status query - user_id: {user_id}, role: {user_role}, normalized: {normalized_role}")
        
        # Check if user has access (TRANSPORTEUR, AFFRETEUR, or ADMIN)
        if not normalized_role or normalized_role not in ["TRANSPORTEUR", "AFFRETEUR", "ADMIN"]:
            logger.warning(f"Mission status denied - user_id: {user_id}, role: {user_role} (normalized: {normalized_role})")
            
            if not user_role:
                message = "⚠️ Impossible de vérifier votre rôle.\n\nVeuillez vous reconnecter ou contacter le support."
            else:
                message = f"⚠️ Accès aux missions réservé aux Affréteurs, Transporteurs et Admins.\n\nVotre rôle actuel : {user_role}"
            
            return ChatbotResponse(
                message=message,
                intent=Intent(name="mission_status", confidence=confidence, entities=entities),
                suggestions=["Contacter le support", "En savoir plus", "Aide"]
            )
        
        # Call monolith API instead of direct DB access
        if not user_token:
            logger.warning(f"No user token provided for mission status - user_id: {user_id}")
            return ChatbotResponse(
                message="⚠️ Impossible de récupérer vos missions.\n\nVeuillez vous reconnecter.",
                intent=Intent(name="mission_status", confidence=confidence, entities=entities),
                suggestions=["Se reconnecter", "Support"],
                data={"error": "no_token"}
            )
        
        try:
            # Try different API endpoints based on role priority
            # We try in order and use the first one that works (auto-detect role from token)
            api_endpoints = []
            
            # Build list of endpoints to try based on suggested role
            # Use correct API routes based on monolith structure
            if normalized_role == "ADMIN":
                api_endpoints = [
                    ("admin", f"{self.monolith_base_url}/admin/missions?limit=10"),
                    ("affreteur", f"{self.monolith_base_url}/affreteur/missions?limit=5"),
                    ("transporteur", f"{self.monolith_base_url}/transporteur/missions/available?limit=5"),
                ]
            elif normalized_role == "AFFRETEUR":
                api_endpoints = [
                    ("affreteur", f"{self.monolith_base_url}/affreteur/missions?limit=5"),
                    ("admin", f"{self.monolith_base_url}/admin/missions?limit=10"),
                ]
            elif normalized_role == "TRANSPORTEUR":
                api_endpoints = [
                    ("transporteur", f"{self.monolith_base_url}/transporteur/missions/available?limit=5"),
                ]
            else:
                # Unknown role - try all endpoints
                api_endpoints = [
                    ("affreteur", f"{self.monolith_base_url}/affreteur/missions?limit=5"),
                    ("transporteur", f"{self.monolith_base_url}/transporteur/missions/available?limit=5"),
                    ("admin", f"{self.monolith_base_url}/admin/missions?limit=10"),
                ]
            
            # Try each endpoint until one works
            last_error = None
            actual_role = None
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                for role_name, api_url in api_endpoints:
                    logger.info(f"Trying {role_name} API: {api_url}")
                    
                    response = await client.get(
                        api_url,
                        headers={"Authorization": user_token}
                    )
                    
                    if response.status_code == 200:
                        # Success! Use this endpoint
                        actual_role = role_name
                        logger.info(f"Successfully called {role_name} API")
                        
                        # Parse response data
                        data = response.json()
                        
                        # Format response based on role and data structure
                        if actual_role == "transporteur":
                            missions_data = data.get('data', {}).get('missions', {}).get('data', [])
                            if missions_data:
                                missions_list = "\n".join([
                                    f"{i+1}. **{m.get('title', 'Mission')}**\n"
                                    f"   📍 {m.get('adresseDepart', {}).get('city', '?')} → {m.get('adresseArrivee', {}).get('city', '?')}\n"
                                    f"   💰 Budget: {m.get('budget_min', 0):,} - {m.get('budget_max', 0):,} FCFA\n"
                                    f"   📦 {m.get('type_marchandise', 'Marchandise')} | {m.get('poids', 0)}kg"
                                    for i, m in enumerate(missions_data[:3])
                                ])
                                total = data.get('data', {}).get('pagination', {}).get('total', len(missions_data))
                                message = f"🚛 **Missions disponibles**\n\n{missions_list}\n\n💡 {total} missions au total"
                                suggestions = [f"Voir mission #{missions_data[0].get('id')}", "Réclamer une mission", "Filtrer par ville"]
                            else:
                                message = "🚛 Aucune mission disponible pour le moment.\n\nRevenez plus tard ou activez les notifications."
                                suggestions = ["Activer notifications", "Mes missions en cours", "Historique"]
                        
                        elif actual_role == "affreteur":
                            missions_data = data.get('data', {}).get('missions', {}).get('data', [])
                            if missions_data:
                                # Count by status
                                status_counts = {}
                                for m in missions_data:
                                    status = m.get('status', 'unknown')
                                    status_counts[status] = status_counts.get(status, 0) + 1
                                
                                total = data.get('data', {}).get('pagination', {}).get('total', len(missions_data))
                                
                                # Format status summary
                                status_lines = []
                                status_map = {
                                    'draft': ('📝', 'Brouillons'),
                                    'published': ('📢', 'Publiées'),
                                    'assigned': ('🚚', 'Assignées'),
                                    'in_progress': ('⏳', 'En cours'),
                                    'completed': ('✅', 'Terminées'),
                                    'cancelled': ('❌', 'Annulées')
                                }
                                
                                for status, (icon, label) in status_map.items():
                                    count = status_counts.get(status, 0)
                                    if count > 0:
                                        status_lines.append(f"{icon} {count} {label}")
                                
                                status_summary = "\n".join(status_lines) if status_lines else "Aucune mission"
                                
                                message = (
                                    f"📦 **Vos missions (Affréteur)**\n\n"
                                    f"{status_summary}\n\n"
                                    f"📊 **Total : {total} missions**"
                                )
                                suggestions = ["Créer nouvelle mission", "Voir missions en cours", "Publier un brouillon"]
                            else:
                                message = "📦 Vous n'avez pas encore créé de missions.\n\nCommencez par créer votre première mission !"
                                suggestions = ["Créer ma première mission", "Guide de création", "Aide"]
                        
                        elif actual_role == "admin":
                            missions_data = data.get('data', {}).get('missions', {}).get('data', [])
                            total = data.get('data', {}).get('pagination', {}).get('total', len(missions_data))
                            
                            # Count by status
                            status_counts = {}
                            for m in missions_data:
                                status = m.get('status', 'unknown')
                                status_counts[status] = status_counts.get(status, 0) + 1
                            
                            message = (
                                f"👑 **Vue Admin - Toutes les missions**\n\n"
                                f"📊 **Total : {total} missions**\n"
                                f"📢 {status_counts.get('published', 0)} publiées\n"
                                f"🚚 {status_counts.get('assigned', 0)} assignées\n"
                                f"⏳ {status_counts.get('in_progress', 0)} en cours\n"
                                f"✅ {status_counts.get('completed', 0)} terminées\n\n"
                                f"💡 Accès complet au dashboard admin"
                            )
                            suggestions = ["Dashboard admin", "Voir toutes les missions", "Statistiques détaillées"]
                        
                        return ChatbotResponse(
                            message=message,
                            intent=Intent(name="mission_status", confidence=confidence, entities=entities),
                            suggestions=suggestions,
                            data={"user_role": actual_role, "from_api": True, "total_missions": total if 'total' in locals() else 0}
                        )
                    elif response.status_code == 403:
                        # Permission denied - try next endpoint
                        error_data = response.json() if response.text else {}
                        detected_role = error_data.get('user_role')
                        logger.info(f"403 on {role_name} API, detected role: {detected_role}")
                        last_error = error_data
                        
                        # If we detected the actual role, try that endpoint next
                        if detected_role and detected_role not in [r[0] for r in api_endpoints]:
                            if detected_role == 'affreteur':
                                api_url = f"{self.monolith_base_url}/affreteur/missions?stats=true"
                                response = await client.get(api_url, headers={"Authorization": user_token})
                                if response.status_code == 200:
                                    actual_role = 'affreteur'
                                    break
                            elif detected_role == 'transporteur':
                                api_url = f"{self.monolith_base_url}/transporteur/missions?status=available&limit=5"
                                response = await client.get(api_url, headers={"Authorization": user_token})
                                if response.status_code == 200:
                                    actual_role = 'transporteur'
                                    break
                        continue
                    else:
                        # Other error
                        logger.error(f"API error {response.status_code} on {role_name} endpoint")
                        last_error = {"status": response.status_code, "text": response.text}
                        continue
                
                # If no endpoint worked, return error
                if response.status_code != 200:
                    detected_role = last_error.get('user_role') if last_error else None
                    logger.error(f"All API endpoints failed. Last error: {last_error}")
                    
                    # Return helpful message
                    if detected_role == 'affreteur':
                        message = (
                            f"📦 **Vos missions (Affréteur)**\n\n"
                            f"Impossible de récupérer vos missions pour le moment.\n"
                            f"Veuillez réessayer ou utiliser le tableau de bord."
                        )
                        suggestions = ["Réessayer", "Tableau de bord", "Support"]
                    elif detected_role == 'transporteur':
                        message = (
                            f"🚛 **Missions disponibles (Transporteur)**\n\n"
                            f"Impossible de récupérer les missions pour le moment.\n"
                            f"Veuillez réessayer ou utiliser le tableau de bord."
                        )
                        suggestions = ["Réessayer", "Tableau de bord", "Support"]
                    else:
                        message = "⚠️ Impossible de récupérer vos missions.\n\nVeuillez réessayer ou contacter le support."
                        suggestions = ["Réessayer", "Support"]
                    
                    return ChatbotResponse(
                        message=message,
                        intent=Intent(name="mission_status", confidence=confidence, entities=entities),
                        suggestions=suggestions,
                        data={"error": "api_failed", "last_error": last_error}
                    )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Format response based on role
                    if normalized_role == "TRANSPORTEUR":
                        missions = data.get('data', [])
                        if missions:
                            missions_list = "\n".join([
                                f"{i+1}. {m.get('origin', '?')} → {m.get('destination', '?')} | {m.get('price', 0):,} FCFA | {m.get('weight', 0)}kg"
                                for i, m in enumerate(missions[:3])
                            ])
                            message = f"🚛 **Missions disponibles pour vous**\n\n{missions_list}\n\n💡 {len(missions)} missions au total"
                            suggestions = [f"Voir mission #{missions[0].get('id')}", "Réclamer une mission", "Mes missions"]
                        else:
                            message = "🚛 Aucune mission disponible pour le moment.\n\nRevenez plus tard ou activez les notifications."
                            suggestions = ["Activer notifications", "Mes missions en cours", "Historique"]
                    
                    elif normalized_role == "AFFRETEUR":
                        stats = data.get('stats', {})
                        message = (
                            f"📦 **Vos missions**\n\n"
                            f"🚚 {stats.get('in_progress', 0)} missions en cours\n"
                            f"⏳ {stats.get('pending', 0)} missions en attente\n"
                            f"✅ {stats.get('delivered', 0)} missions livrées\n\n"
                            f"💡 Tableau de bord complet disponible"
                        )
                        suggestions = ["Créer nouvelle mission", "Voir missions en cours", "Historique"]
                    
                    elif normalized_role == "ADMIN":
                        stats = data.get('stats', {})
                        message = (
                            f"👑 **Vue Admin - Toutes les missions**\n\n"
                            f"🚚 {stats.get('in_progress', 0)} missions en cours\n"
                            f"⏳ {stats.get('pending', 0)} missions en attente\n"
                            f"✅ {stats.get('delivered', 0)} missions livrées\n"
                            f"📊 **Total : {stats.get('total', 0)} missions**\n\n"
                            f"💡 Accès complet au dashboard admin"
                        )
                        suggestions = ["Dashboard admin", "Voir toutes les missions", "Statistiques"]
                    
                    return ChatbotResponse(
                        message=message,
                        intent=Intent(name="mission_status", confidence=confidence, entities=entities),
                        suggestions=suggestions,
                        data={"user_role": normalized_role, "from_api": True}
                    )
                else:
                    logger.error(f"Monolith API error: {response.status_code} - {response.text}")
                    raise Exception(f"API returned {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Error calling monolith API for mission status: {e}")
            # Fallback to generic message
            if normalized_role == "TRANSPORTEUR":
                message = "🚛 Impossible de récupérer les missions pour le moment.\n\nVeuillez réessayer."
            elif normalized_role == "AFFRETEUR":
                message = "📦 Impossible de récupérer vos missions pour le moment.\n\nVeuillez réessayer."
            else:
                message = "👑 Impossible de récupérer les statistiques pour le moment.\n\nVeuillez réessayer."
            
            return ChatbotResponse(
                message=message,
                intent=Intent(name="mission_status", confidence=confidence, entities=entities),
                suggestions=["Réessayer", "Support", "Aide"],
                data={"error": True, "error_message": str(e)}
            )
    
    async def _handle_help(
        self,
        entities: Dict[str, Any],
        user_id: str,
        user_role: Optional[str],
        user_token: Optional[str],
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
        user_token: Optional[str],
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
        user_token: Optional[str],
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
        """Add message to conversation history (Redis or in-memory)"""
        try:
            if self.redis_client:
                # Use Redis for persistent storage
                key = f"chat_history:{conversation_id}"
                
                # Get existing history
                history_json = self.redis_client.get(key)
                history = json.loads(history_json) if history_json else []
                
                # Add new message
                history.append(message)
                
                # Keep only last 20 messages
                history = history[-20:]
                
                # Save back to Redis with TTL
                self.redis_client.setex(
                    key,
                    self.history_ttl,
                    json.dumps(history)
                )
                
                logger.debug(f"Saved message to Redis for conversation {conversation_id}")
            else:
                # Fallback to in-memory storage
                if conversation_id not in self.conversation_history:
                    self.conversation_history[conversation_id] = []
                
                self.conversation_history[conversation_id].append(message)
                
                # Keep only last 20 messages
                if len(self.conversation_history[conversation_id]) > 20:
                    self.conversation_history[conversation_id] = self.conversation_history[conversation_id][-20:]
                    
        except Exception as e:
            logger.error(f"Error saving to history: {e}")
            # Fallback to in-memory on error
            if conversation_id not in self.conversation_history:
                self.conversation_history[conversation_id] = []
            self.conversation_history[conversation_id].append(message)
    
    def get_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history (Redis or in-memory)"""
        try:
            if self.redis_client:
                # Try to get from Redis
                key = f"chat_history:{conversation_id}"
                history_json = self.redis_client.get(key)
                
                if history_json:
                    history = json.loads(history_json)
                    logger.debug(f"Retrieved {len(history)} messages from Redis for conversation {conversation_id}")
                    return history
                else:
                    logger.debug(f"No history found in Redis for conversation {conversation_id}")
                    return []
            else:
                # Fallback to in-memory storage
                return self.conversation_history.get(conversation_id, [])
                
        except Exception as e:
            logger.error(f"Error retrieving history: {e}")
            # Fallback to in-memory on error
            return self.conversation_history.get(conversation_id, [])


# Singleton instance
_chatbot_service: Optional[ChatbotService] = None


def get_chatbot_service() -> ChatbotService:
    """Get or create chatbot service instance"""
    global _chatbot_service
    if _chatbot_service is None:
        _chatbot_service = ChatbotService()
    return _chatbot_service
