"""
Response Generator Service
Génère des réponses naturelles orientées vers le frontend
"""
import logging
from typing import Dict, Any, Optional, List

from app.services.intent_detector import IntentType, ActionType

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """
    Génère des réponses naturelles qui guident l'utilisateur vers les bonnes interfaces
    """
    
    def generate_navigation_response(
        self,
        intent: IntentType,
        route: Dict[str, Any],
        user_name: str = "Utilisateur",
        user_role: str = "CLIENT"
    ) -> Dict[str, Any]:
        """
        Génère une réponse qui guide vers une page du frontend
        """
        
        templates = {
            IntentType.VIEW_MISSIONS: {
                "AFFRETEUR": "📋 Pour voir toutes vos missions publiées, rendez-vous dans **{description}**. Vous y trouverez le statut, les transporteurs intéressés et tous les détails de chaque mission.",
                "TRANSPORTEUR": "🚚 Pour voir les missions disponibles, consultez **{description}**. Vous pourrez filtrer par ville, poids et budget pour trouver les missions qui vous conviennent."
            },
            IntentType.VIEW_VEHICLES: {
                "TRANSPORTEUR": "🚛 Pour gérer votre flotte, allez dans **{description}**. Vous pourrez ajouter, modifier ou voir le statut de chaque véhicule."
            },
            IntentType.VIEW_ORDERS: {
                "CLIENT": "📦 Pour consulter vos commandes, rendez-vous dans **{description}**. Vous y verrez l'historique complet avec les statuts de livraison."
            },
            IntentType.VIEW_PRODUCTS: {
                "CLIENT": "🔧 Pour parcourir notre catalogue, visitez **{description}**. Vous pouvez filtrer par catégorie, marque et prix."
            }
        }
        
        # Récupérer le template approprié
        role_templates = templates.get(intent, {})
        template = role_templates.get(user_role, "Pour accéder à cette fonctionnalité, rendez-vous dans **{description}**.")
        
        # Générer le message
        message = template.format(description=route.get("description", "l'interface appropriée"))
        
        # Générer les suggestions
        suggestions = self._generate_navigation_suggestions(intent, user_role)
        
        return {
            "message": message,
            "suggestions": suggestions,
            "navigation": {
                "path": route.get("path"),
                "description": route.get("description"),
                "filters": route.get("filters", {})
            },
            "requires_human": False
        }
    
    def generate_function_response(
        self,
        intent: IntentType,
        function_result: Dict[str, Any],
        user_name: str = "Utilisateur"
    ) -> Dict[str, Any]:
        """
        Génère une réponse basée sur le résultat d'une function call
        """
        
        if intent == IntentType.TRACK_SHIPMENT:
            return self._format_tracking_response(function_result)
        
        elif intent == IntentType.CALCULATE_PRICE:
            return self._format_pricing_response(function_result)
        
        elif intent == IntentType.SEARCH_PRODUCT:
            return self._format_product_search_response(function_result)
        
        else:
            return {
                "message": "✅ Action effectuée avec succès !",
                "suggestions": ["Que puis-je faire d'autre ?"],
                "requires_human": False
            }
    
    def generate_missing_params_response(
        self,
        intent: IntentType,
        missing_params: List[str]
    ) -> Dict[str, Any]:
        """
        Génère une réponse quand des paramètres sont manquants
        """
        
        param_questions = {
            "shipment_id": "Quel est le numéro de votre colis ? (ex: #123)",
            "origin": "Quelle est la ville de départ ?",
            "destination": "Quelle est la ville d'arrivée ?",
            "weight_kg": "Quel est le poids en kg ?",
            "query": "Que recherchez-vous ?"
        }
        
        questions = [param_questions.get(param, f"Veuillez préciser: {param}") for param in missing_params]
        
        return {
            "message": f"Pour vous aider, j'ai besoin de quelques informations :\n\n" + "\n".join(f"• {q}" for q in questions),
            "suggestions": ["Annuler"],
            "requires_human": False
        }
    
    def generate_greeting_response(
        self,
        user_name: str,
        user_role: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Génère une réponse de salutation personnalisée
        """
        
        role_messages = {
            "AFFRETEUR": f"Bonjour {user_name} ! 👋 Vous êtes affréteur chez TSA Logistique.",
            "TRANSPORTEUR": f"Bonjour {user_name} ! 👋 Vous êtes transporteur chez TSA Logistique.",
            "CLIENT": f"Bonjour {user_name} ! 👋 Bienvenue sur TSA Logistique.",
            "ADMIN": f"Bonjour {user_name} ! 👋 Vous êtes administrateur TSA Logistique."
        }
        
        message = role_messages.get(user_role, f"Bonjour {user_name} ! 👋")
        
        # Ajouter des infos contextuelles
        if context:
            if context.get("recent_missions"):
                count = len(context["recent_missions"])
                message += f" Vous avez {count} mission{'s' if count > 1 else ''} récente{'s' if count > 1 else ''}."
            
            if context.get("vehicles"):
                count = len(context["vehicles"])
                message += f" Vous avez {count} véhicule{'s' if count > 1 else ''} enregistré{'s' if count > 1 else ''}."
        
        message += " Comment puis-je vous aider ? 🚚"
        
        suggestions = self._generate_role_suggestions(user_role)
        
        return {
            "message": message,
            "suggestions": suggestions,
            "requires_human": False
        }
    
    def generate_help_response(self, user_role: str) -> Dict[str, Any]:
        """
        Génère une réponse d'aide
        """
        
        capabilities = {
            "AFFRETEUR": [
                "📋 Voir vos missions",
                "💰 Calculer un prix de transport",
                "🚚 Suivre un colis",
                "➕ Créer une nouvelle mission"
            ],
            "TRANSPORTEUR": [
                "🚛 Voir vos véhicules",
                "📋 Consulter les missions disponibles",
                "🚚 Suivre vos livraisons",
                "💰 Calculer un prix"
            ],
            "CLIENT": [
                "📦 Voir vos commandes",
                "🔧 Rechercher des pièces détachées",
                "🚚 Suivre un colis",
                "🛒 Parcourir le catalogue"
            ]
        }
        
        role_capabilities = capabilities.get(user_role, [
            "🚚 Suivre un colis",
            "💰 Calculer un prix",
            "❓ Obtenir de l'aide"
        ])
        
        message = "Je peux vous aider avec :\n\n" + "\n".join(role_capabilities)
        
        return {
            "message": message,
            "suggestions": ["Voir mes missions", "Calculer un prix", "Suivre un colis"],
            "requires_human": False
        }
    
    def _format_tracking_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Formate la réponse de suivi de colis"""
        
        if result.get("error"):
            return {
                "message": f"❌ {result['error']}",
                "suggestions": ["Réessayer", "Contacter le support"],
                "requires_human": True
            }
        
        tracking = result.get("tracking", {})
        message = f"📦 **Colis #{tracking.get('id')}**\n\n"
        message += f"📍 Position actuelle: {tracking.get('current_location', 'En transit')}\n"
        message += f"📊 Statut: {tracking.get('status', 'En cours')}\n"
        message += f"🕐 ETA: {tracking.get('eta', 'À déterminer')}"
        
        return {
            "message": message,
            "suggestions": ["Voir les détails", "Contacter le transporteur"],
            "requires_human": False
        }
    
    def _format_pricing_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Formate la réponse de calcul de prix"""
        
        if result.get("error"):
            return {
                "message": f"❌ {result['error']}",
                "suggestions": ["Réessayer", "Modifier les paramètres"],
                "requires_human": False
            }
        
        price = result.get("calculated_price", 0)
        range_info = result.get("negotiation_range", {})
        
        message = f"💰 **Prix estimé: {price:,.0f} FCFA**\n\n"
        message += f"📊 Fourchette de négociation:\n"
        message += f"• Minimum: {range_info.get('min_price', 0):,.0f} FCFA\n"
        message += f"• Maximum: {range_info.get('max_price', 0):,.0f} FCFA\n\n"
        message += "✨ Prix optimisé par notre IA de pricing dynamique."
        
        return {
            "message": message,
            "suggestions": ["Créer une mission avec ce prix", "Recalculer"],
            "requires_human": False
        }
    
    def _format_product_search_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Formate la réponse de recherche de produits"""
        
        products = result.get("products", [])
        
        if not products:
            return {
                "message": "❌ Aucun produit trouvé. Essayez avec d'autres mots-clés.",
                "suggestions": ["Parcourir le catalogue", "Affiner la recherche"],
                "requires_human": False
            }
        
        count = len(products)
        message = f"🔧 **{count} produit{'s' if count > 1 else ''} trouvé{'s' if count > 1 else ''}**\n\n"
        
        # Afficher les 3 premiers
        for product in products[:3]:
            message += f"• {product.get('name')} - {product.get('price', 0):,.0f} FCFA\n"
        
        if count > 3:
            message += f"\n... et {count - 3} autre{'s' if count > 4 else ''} produit{'s' if count > 4 else ''}."
        
        message += "\n\n📋 Pour voir tous les détails, consultez le catalogue complet."
        
        return {
            "message": message,
            "suggestions": ["Voir le catalogue", "Affiner la recherche"],
            "navigation": {
                "path": "/shop/products",
                "description": "Catalogue Produits"
            },
            "requires_human": False
        }
    
    def _generate_navigation_suggestions(self, intent: IntentType, user_role: str) -> List[str]:
        """Génère des suggestions contextuelles pour la navigation"""
        
        suggestions_map = {
            IntentType.VIEW_MISSIONS: ["Créer une mission", "Calculer un prix"],
            IntentType.VIEW_VEHICLES: ["Ajouter un véhicule", "Voir les missions"],
            IntentType.VIEW_ORDERS: ["Passer une commande", "Suivre un colis"],
            IntentType.VIEW_PRODUCTS: ["Rechercher un produit", "Voir mon panier"]
        }
        
        return suggestions_map.get(intent, ["Que puis-je faire d'autre ?"])
    
    def _generate_role_suggestions(self, user_role: str) -> List[str]:
        """Génère des suggestions basées sur le rôle"""
        
        suggestions_map = {
            "AFFRETEUR": ["Voir mes missions", "Créer une mission", "Calculer un prix"],
            "TRANSPORTEUR": ["Voir mes véhicules", "Missions disponibles", "Mes livraisons"],
            "CLIENT": ["Voir mes commandes", "Parcourir le catalogue", "Suivre un colis"],
            "ADMIN": ["Statistiques", "Gérer les utilisateurs", "Voir les missions"]
        }
        
        return suggestions_map.get(user_role, ["Aide", "Que peux-tu faire ?"])


# Singleton
_response_generator: Optional[ResponseGenerator] = None


def get_response_generator() -> ResponseGenerator:
    """Get or create response generator"""
    global _response_generator
    if _response_generator is None:
        _response_generator = ResponseGenerator()
    return _response_generator
