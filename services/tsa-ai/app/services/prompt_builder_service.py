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

        return prompt

def get_prompt_builder() -> PromptBuilderService:
    return PromptBuilderService.get_instance()
