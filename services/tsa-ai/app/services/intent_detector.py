"""
Intent Detection Service
Détecte l'intention de l'utilisateur et détermine l'action appropriée
"""
import logging
from typing import Dict, Any, Optional, List
from enum import Enum

logger = logging.getLogger(__name__)


class IntentType(str, Enum):
    """Types d'intentions supportées"""
    # Navigation vers frontend
    VIEW_MISSIONS = "view_missions"
    VIEW_VEHICLES = "view_vehicles"
    VIEW_ORDERS = "view_orders"
    VIEW_PRODUCTS = "view_products"
    
    # Actions avec function calls
    TRACK_SHIPMENT = "track_shipment"
    CALCULATE_PRICE = "calculate_price"
    SEARCH_PRODUCT = "search_product"
    CREATE_MISSION = "create_mission"
    
    # Informations générales
    GREETING = "greeting"
    HELP = "help"
    UNKNOWN = "unknown"


class ActionType(str, Enum):
    """Types d'actions à effectuer"""
    NAVIGATE = "navigate"  # Guider vers une page du frontend
    FUNCTION_CALL = "function_call"  # Appeler une fonction
    DIRECT_RESPONSE = "direct_response"  # Réponse directe sans action


class IntentDetector:
    """
    Détecte l'intention de l'utilisateur et détermine l'action appropriée
    """
    
    def __init__(self):
        # Mapping intent → action
        self.intent_actions = {
            # Navigation
            IntentType.VIEW_MISSIONS: ActionType.NAVIGATE,
            IntentType.VIEW_VEHICLES: ActionType.NAVIGATE,
            IntentType.VIEW_ORDERS: ActionType.NAVIGATE,
            IntentType.VIEW_PRODUCTS: ActionType.NAVIGATE,
            
            # Function calls
            IntentType.TRACK_SHIPMENT: ActionType.FUNCTION_CALL,
            IntentType.CALCULATE_PRICE: ActionType.FUNCTION_CALL,
            IntentType.SEARCH_PRODUCT: ActionType.FUNCTION_CALL,
            IntentType.CREATE_MISSION: ActionType.FUNCTION_CALL,
            
            # Direct responses
            IntentType.GREETING: ActionType.DIRECT_RESPONSE,
            IntentType.HELP: ActionType.DIRECT_RESPONSE,
            IntentType.UNKNOWN: ActionType.DIRECT_RESPONSE,
        }
        
        # Routes frontend par rôle
        self.frontend_routes = {
            "AFFRETEUR": {
                IntentType.VIEW_MISSIONS: {
                    "path": "/affreteur/missions",
                    "description": "Mes Missions",
                    "filters": {"status": "published"}
                },
            },
            "TRANSPORTEUR": {
                IntentType.VIEW_MISSIONS: {
                    "path": "/transporteur/missions",
                    "description": "Missions Disponibles"
                },
                IntentType.VIEW_VEHICLES: {
                    "path": "/transporteur/vehicles",
                    "description": "Mes Véhicules"
                },
            },
            "CLIENT": {
                IntentType.VIEW_ORDERS: {
                    "path": "/client/orders",
                    "description": "Mes Commandes"
                },
                IntentType.VIEW_PRODUCTS: {
                    "path": "/shop/products",
                    "description": "Catalogue Produits"
                },
            }
        }
    
    async def detect_intent(
        self,
        message: str,
        user_role: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Détecte l'intention de l'utilisateur
        
        Returns:
            {
                "intent": IntentType,
                "action": ActionType,
                "confidence": float,
                "entities": dict,
                "route": dict (si navigation),
                "function": dict (si function call)
            }
        """
        message_lower = message.lower()
        
        # Détection par mots-clés (simple mais efficace)
        intent_result = self._detect_by_keywords(message_lower, user_role)
        
        # Enrichir avec les informations d'action
        action_type = self.intent_actions.get(intent_result["intent"], ActionType.DIRECT_RESPONSE)
        intent_result["action"] = action_type
        
        # Ajouter les informations de navigation si nécessaire
        if action_type == ActionType.NAVIGATE:
            route = self._get_frontend_route(intent_result["intent"], user_role)
            if route:
                intent_result["route"] = route
        
        # Ajouter les informations de function call si nécessaire
        elif action_type == ActionType.FUNCTION_CALL:
            function_info = self._get_function_info(intent_result["intent"], intent_result["entities"])
            if function_info:
                intent_result["function"] = function_info
        
        logger.info(f"Intent detected: {intent_result['intent']} → {action_type}")
        
        return intent_result
    
    def _detect_by_keywords(self, message: str, user_role: str) -> Dict[str, Any]:
        """Détection d'intent par mots-clés"""
        
        # Salutations
        if any(word in message for word in ["bonjour", "salut", "hello", "hey", "qui suis-je", "qui es-tu"]):
            return {
                "intent": IntentType.GREETING,
                "confidence": 0.95,
                "entities": {}
            }
        
        # Aide
        if any(word in message for word in ["aide", "help", "comment", "peux-tu"]):
            return {
                "intent": IntentType.HELP,
                "confidence": 0.9,
                "entities": {}
            }
        
        # Voir missions
        if any(word in message for word in ["missions", "mission", "voir mes missions", "liste missions"]):
            if any(word in message for word in ["publiées", "publié", "disponibles"]):
                return {
                    "intent": IntentType.VIEW_MISSIONS,
                    "confidence": 0.9,
                    "entities": {"status": "published"}
                }
            return {
                "intent": IntentType.VIEW_MISSIONS,
                "confidence": 0.85,
                "entities": {}
            }
        
        # Voir véhicules
        if any(word in message for word in ["véhicules", "vehicules", "camions", "flotte"]):
            return {
                "intent": IntentType.VIEW_VEHICLES,
                "confidence": 0.9,
                "entities": {}
            }
        
        # Voir commandes
        if any(word in message for word in ["commandes", "commande", "achats"]):
            return {
                "intent": IntentType.VIEW_ORDERS,
                "confidence": 0.9,
                "entities": {}
            }
        
        # Suivi colis
        if any(word in message for word in ["suivre", "suivi", "où est", "tracking", "colis", "livraison"]):
            # Extraire l'ID du colis
            import re
            shipment_id_match = re.search(r'#?(\d+)', message)
            shipment_id = shipment_id_match.group(1) if shipment_id_match else None
            
            return {
                "intent": IntentType.TRACK_SHIPMENT,
                "confidence": 0.9,
                "entities": {"shipment_id": shipment_id} if shipment_id else {}
            }
        
        # Calcul de prix
        if any(word in message for word in ["prix", "coût", "coute", "tarif", "combien"]):
            # Extraire origine, destination, poids
            entities = self._extract_pricing_entities(message)
            return {
                "intent": IntentType.CALCULATE_PRICE,
                "confidence": 0.85,
                "entities": entities
            }
        
        # Recherche produit
        if any(word in message for word in ["produit", "pièce", "cherche", "recherche", "trouver"]):
            return {
                "intent": IntentType.SEARCH_PRODUCT,
                "confidence": 0.8,
                "entities": {"query": message}
            }
        
        # Créer mission
        if any(word in message for word in ["créer mission", "nouvelle mission", "ajouter mission"]):
            return {
                "intent": IntentType.CREATE_MISSION,
                "confidence": 0.85,
                "entities": {}
            }
        
        # Intent inconnu
        return {
            "intent": IntentType.UNKNOWN,
            "confidence": 0.5,
            "entities": {}
        }
    
    def _extract_pricing_entities(self, message: str) -> Dict[str, Any]:
        """Extrait les entités pour le calcul de prix"""
        import re
        
        entities = {}
        
        # Villes camerounaises
        cities = ["douala", "yaoundé", "yaounde", "bafoussam", "garoua", "bamenda", "maroua"]
        found_cities = [city for city in cities if city in message]
        
        if len(found_cities) >= 2:
            entities["origin"] = found_cities[0].capitalize()
            entities["destination"] = found_cities[1].capitalize()
        elif len(found_cities) == 1:
            entities["origin"] = found_cities[0].capitalize()
        
        # Poids (kg, tonnes)
        weight_match = re.search(r'(\d+)\s*(kg|tonnes?|t\b)', message)
        if weight_match:
            weight = int(weight_match.group(1))
            unit = weight_match.group(2)
            if unit in ["tonne", "tonnes", "t"]:
                weight *= 1000  # Convertir en kg
            entities["weight_kg"] = weight
        
        return entities
    
    def _get_frontend_route(self, intent: IntentType, user_role: str) -> Optional[Dict[str, Any]]:
        """Récupère les informations de route frontend"""
        role_routes = self.frontend_routes.get(user_role, {})
        return role_routes.get(intent)
    
    def _get_function_info(self, intent: IntentType, entities: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Récupère les informations de function call"""
        
        function_mapping = {
            IntentType.TRACK_SHIPMENT: {
                "name": "track_shipment",
                "required_params": ["shipment_id"]
            },
            IntentType.CALCULATE_PRICE: {
                "name": "calculate_price",
                "required_params": ["origin", "destination", "weight_kg"]
            },
            IntentType.SEARCH_PRODUCT: {
                "name": "search_products",
                "required_params": ["query"]
            },
        }
        
        function_info = function_mapping.get(intent)
        if not function_info:
            return None
        
        # Vérifier que tous les paramètres requis sont présents
        missing_params = [
            param for param in function_info["required_params"]
            if param not in entities or not entities[param]
        ]
        
        return {
            "name": function_info["name"],
            "parameters": entities,
            "missing_parameters": missing_params
        }


# Singleton
_intent_detector: Optional[IntentDetector] = None


def get_intent_detector() -> IntentDetector:
    """Get or create intent detector"""
    global _intent_detector
    if _intent_detector is None:
        _intent_detector = IntentDetector()
    return _intent_detector
