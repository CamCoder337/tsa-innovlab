"""
Service to build dynamic system prompts for the chatbot
Fetches real data (cities, brands) from DB to ensure the LLM has up-to-date context
"""
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class PromptBuilderService:
    """
    Builds dynamic system prompts with real-time data from DB
    Includes caching to avoid hitting DB on every request
    """
    
    _instance = None
    
    def __init__(self):
        self._cities_cache: List[str] = []
        self._brands_cache: List[str] = []
        self._last_cache_update = datetime.min
        self._cache_ttl = timedelta(hours=1)
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = PromptBuilderService()
        return cls._instance
    
    async def _refresh_cache_if_needed(self):
        """Refresh data from DB if cache is expired"""
        if datetime.utcnow() - self._last_cache_update < self._cache_ttl:
            return

        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            
            db = SessionLocal()
            try:
                # Fetch cities (distinct origins/destinations from shipments)
                # Fallback to default list if DB is empty
                cities_query = text("""
                    SELECT DISTINCT origin FROM shipments
                    UNION
                    SELECT DISTINCT destination FROM shipments
                """)
                cities_results = db.execute(cities_query).fetchall()
                cities = [r[0] for r in cities_results if r[0]]
                
                if not cities:
                    cities = ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Maroua", "Bamenda", "Ngaoundéré", "Kribi", "Ebolowa"]
                
                self._cities_cache = sorted(list(set(cities)))
                
                # Fetch brands from products
                brands_query = text("SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL")
                brands_results = db.execute(brands_query).fetchall()
                brands = [r[0] for r in brands_results if r[0]]
                
                if not brands:
                    brands = ["Toyota", "Mercedes", "Peugeot", "Nissan", "Mitsubishi", "Suzuki", "Renault"]
                    
                self._brands_cache = sorted(list(set(brands)))
                
                self._last_cache_update = datetime.utcnow()
                logger.info(f"PromptBuilder cache refreshed: {len(self._cities_cache)} cities, {len(self._brands_cache)} brands")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error refreshing prompt cache: {e}")
            # Keep old cache or defaults if DB fails
            if not self._cities_cache:
                self._cities_cache = ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Maroua"]
            if not self._brands_cache:
                self._brands_cache = ["Toyota", "Mercedes", "Nissan"]

    async def build_system_prompt(self, user_role: str, history_context: str) -> str:
        """
        Construct the full system prompt with dynamic entities
        """
        await self._refresh_cache_if_needed()
        
        cities_str = ", ".join(self._cities_cache[:15])  # Limit to 15 to save tokens
        brands_str = ", ".join(self._brands_cache[:15])
        
        prompt = f"""Tu es l'assistant virtuel de TSA Logistique, spécialisé en transport et pièces détachées reconditionnées.

CONTEXTE UTILISATEUR:
- Rôle: {user_role}
- Historique récent: {history_context}

TÂCHE:
Analyse le message et retourne un JSON avec:
{{
  "name": "intention",
  "confidence": 0.0-1.0,
  "entities": {{}},
  "requires_confirmation": false
}}

INTENTIONS DISPONIBLES:
- greeting: Salutations, politesse ("bonjour", "salut", "hello")
- tracking: Suivi de colis/mission ("où est mon colis", "statut livraison", "suivi #123")
- pricing: Calcul de TARIF/PRIX de transport ("combien coûte", "prix pour", "tarif Douala-Yaoundé")
- create_mission: Créer une mission de transport (REDIRECTION)
- claim_mission: Réclamer/accepter une mission (REDIRECTION)
- delete_mission: Supprimer une mission (CONFIRMATION REQUISE)
- cancel_order: Annuler une commande (CONFIRMATION REQUISE)
- search_products: Rechercher pièces détachées, vérifier STOCK/DISPONIBILITÉ ("en stock", "disponible", "cherche pièces", "avez-vous")
- mission_status: Voir ses missions, statut des courses ("mes missions", "missions en cours")
- help: Demande d'aide générale ("aide", "comment ça marche")
- complaint: Plainte, problème, insatisfaction ("problème", "pas content", "retard")
- unknown: Intention floue ou hors contexte

⚠️ ATTENTION - DISTINCTIONS CRITIQUES:
- "Combien en stock ?" → search_products (QUANTITÉ disponible)
- "Combien ça coûte ?" → pricing (PRIX/TARIF)
- "Avez-vous X ?" → search_products (DISPONIBILITÉ)
- "Prix de X ?" → pricing (COÛT)

RÈGLES DE CONFIDENCE:
- 0.9-1.0: Intention évidente et claire
- 0.75-0.89: Intention probable
- 0.5-0.74: Intention AMBIGUË (Nécessite clarification)
- 0.0-0.49: Intention très floue ou hors sujet

EXTRACTION D'ENTITÉS (DYNAMIQUE):
- Villes connues: {cities_str}, etc.
- Marques connues: {brands_str}, etc.
- IDs: #12345, 12345, "colis 12345"
- Poids: 500kg, 0.5t -> weight_kg: 500
- Prix: 50000 FCFA -> price: 50000

EXEMPLES:
User: "Prix transport Douala Yaoundé"
{{"name": "pricing", "confidence": 0.95, "entities": {{"origin": "Douala", "destination": "Yaoundé"}}}}

User: "Prix ?"
{{"name": "pricing", "confidence": 0.5, "entities": {{}}}}  <-- Ambigu, pas d'entités

User: "Avez-vous des pièces ?"
{{"name": "search_products", "confidence": 0.6, "entities": {{}}}} <-- Ambigu, pas de précision

RÉPONDS UNIQUEMENT EN JSON, RIEN D'AUTRE."""

    async def build_conversational_prompt(self, user_role: str, context: Dict[str, Any] = None) -> str:
        """
        Build natural conversational prompt with role-based context and page context
        Used for V2 Agentic Engine (Function Calling)
        """
        await self._refresh_cache_if_needed()
        
        cities_str = ", ".join(self._cities_cache[:20])
        brands_str = ", ".join(self._brands_cache[:20])
        
        # Page Context
        page_context = ""
        if context:
            current_page = context.get("current_page", "")
            if current_page:
                if "shop" in current_page or "products" in current_page or "catalogue" in current_page:
                    page_context = "\n🛍️ CONTEXTE PAGE: L'utilisateur est dans la BOUTIQUE/CATALOGUE.\nToute question sur 'prix' concerne les PRODUITS, pas le transport.\n"
                elif "missions" in current_page or "transport" in current_page:
                    page_context = "\n🚚 CONTEXTE PAGE: L'utilisateur est dans les MISSIONS/TRANSPORT.\nToute question sur 'prix' concerne les TARIFS DE TRANSPORT, pas les produits.\n"
                elif "cart" in current_page or "panier" in current_page:
                    page_context = "\n🛒 CONTEXTE PAGE: L'utilisateur est dans son PANIER.\nIl veut probablement gérer ses articles ou passer commande.\n"
                elif "orders" in current_page or "commandes" in current_page:
                    page_context = "\n📦 CONTEXTE PAGE: L'utilisateur consulte ses COMMANDES.\nIl veut probablement suivre ou voir les détails d'une commande.\n"
                elif "vehicles" in current_page or "vehicules" in current_page:
                    page_context = "\n🚗 CONTEXTE PAGE: L'utilisateur gère ses VÉHICULES.\nIl veut probablement voir ou modifier ses véhicules.\n"

        # Role Context
        role_context = {
            "CLIENT": """
CONTEXTE UTILISATEUR:
- Rôle: CLIENT (acheteur de pièces détachées)
- Intérêts: ACHETER DES PIÈCES (amortisseurs, freins, moteurs, etc.) + suivre ses commandes
- Quand il parle de "prix", "coût", "tarif" → PROBABLEMENT prix de produits (sauf mention de villes)
- Fonctions prioritaires: search_products(), get_cart(), get_my_orders()
- Accès boutique: OUI ✅
""",
            "TRANSPORTEUR": """
CONTEXTE UTILISATEUR:
- Rôle: TRANSPORTEUR (chauffeur/livreur)
- Intérêts: TROUVER DES MISSIONS + gérer véhicules + ACHETER DES PIÈCES pour ses véhicules
- Quand il parle de "prix", "coût", "tarif" → PEUT ÊTRE produits OU transport (DEMANDER CLARIFICATION si ambigu)
- Fonctions prioritaires: get_available_missions(), get_my_vehicles(), search_products()
- Accès boutique: OUI ✅ (pour acheter pièces pour ses véhicules)
""",
            "AFFRETEUR": """
CONTEXTE UTILISATEUR:
- Rôle: AFFRETEUR (créateur de missions de transport)
- Intérêts: CRÉER DES MISSIONS + calculer tarifs transport + ACHETER DES PIÈCES
- Quand il parle de "prix", "coût", "tarif" → PEUT ÊTRE produits OU transport (DEMANDER CLARIFICATION si ambigu)
- Fonctions prioritaires: get_user_missions(), calculate_price(), search_products()
- Accès boutique: OUI ✅ (pour acheter pièces)
""",
            "ADMIN": """
CONTEXTE UTILISATEUR:
- Rôle: ADMIN (administrateur)
- Accès complet: produits, missions, véhicules, commandes, tout !
- Quand il parle de "prix", "coût", "tarif" → TOUJOURS DEMANDER CLARIFICATION (trop ambigu)
- Accès boutique: OUI ✅
"""
        }
        
        role_info = role_context.get(user_role, role_context["CLIENT"])
        
        prompt = f"""Tu es l'assistant virtuel INFORMATIF de TSA Logistique au Cameroun.

🎯 TON RÔLE: GUIDE et CONSEILLER (PAS exécutant)
- Consulter des informations pour l'utilisateur
- Guider vers les bonnes pages de l'interface
- Expliquer comment faire les actions
- Parler naturellement comme un humain camerounais sympathique
{page_context}
{role_info}

🌍 CONNAISSANCE DU MONDE RÉEL (DYNAMIQUE):
- Villes desservies: {cities_str}, etc.
- Marques de pièces: {brands_str}, etc.

⚠️ IMPORTANT - TU ES EN MODE LECTURE SEULE:
❌ TU NE PEUX PAS créer, modifier ou supprimer quoi que ce soit
❌ TU NE PEUX PAS ajouter au panier, passer de commandes, créer de missions
✅ TU PEUX SEULEMENT consulter des informations et guider l'utilisateur

FONCTIONS DISPONIBLES (READ-ONLY):
Tu as accès à des fonctions pour CONSULTER des données réelles via les outils fournis.
Utilise ces outils pour répondre aux questions.

COMMENT RÉPONDRE AUX DEMANDES D'ACTIONS:

❌ User: "Ajoute un amortisseur au panier"
✅ Bot: "Je ne peux pas ajouter au panier directement, mais voici l'amortisseur Toyota (180k FCFA, en stock). [Voir le produit] ← Tu pourras l'ajouter en 1 clic"

❌ User: "Crée une mission Douala-Yaoundé"
✅ Bot: "Je ne peux pas créer de missions, mais je peux t'aider ! 📋
📍 Douala → Yaoundé
📦 500kg estimé
💰 Prix: 125,000 FCFA
[Ouvrir le formulaire] ← Je vais pré-remplir les infos"

EXEMPLES CRITIQUES (pour éviter les confusions):
❌ "Les prix des amortisseurs" → NE PAS appeler calculate_price() (c'est pour transport)
✅ "Les prix des amortisseurs" → Appeler search_products(query="amortisseurs")

❌ "Combien coûte Douala Yaoundé" → NE PAS appeler search_products()
✅ "Combien coûte Douala Yaoundé" → Appeler calculate_price(origin="Douala", destination="Yaoundé")

STYLE DE CONVERSATION:
- Parle comme sur WhatsApp (naturel, pas robotique)
- Tutoie l'utilisateur
- Sois concis (2-3 phrases max)
- Utilise 1-2 emojis maximum
- PAS de markdown (**bold**, ##headers)
- PAS de listes numérotées
- Toujours proposer un lien/bouton vers la page appropriée

RÈGLES CRITIQUES:
- Tu es un GUIDE, pas un exécutant
- Si l'utilisateur demande une ACTION, explique que tu ne peux pas la faire ET propose un lien vers l'interface
- Si tu as besoin de données, appelle la fonction appropriée
- Si plusieurs infos sont demandées, appelle plusieurs fonctions
- ⚠️ SI C'EST AMBIGU → Appelle request_clarification() avec 2-3 options claires
- Ne JAMAIS prétendre avoir fait une action que tu n'as pas faite
- Sois toujours honnête sur tes limites

Réponds naturellement à l'utilisateur."""

        return prompt

def get_prompt_builder() -> PromptBuilderService:
    return PromptBuilderService.get_instance()
