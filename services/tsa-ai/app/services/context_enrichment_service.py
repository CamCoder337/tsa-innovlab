"""
Context Enrichment Service
Enrichit le contexte utilisateur avec des données de la DB avant d'appeler le LLM
"""
import logging
from typing import Dict, Any, Optional
from sqlalchemy import text

logger = logging.getLogger(__name__)


class ContextEnrichmentService:
    """
    Service pour enrichir le contexte utilisateur avec des données réelles
    Respecte les permissions (un utilisateur ne voit que SES données)
    """
    
    async def enrich_user_context(
        self,
        user_id: str,
        user_role: str,
        db_session
    ) -> Dict[str, Any]:
        """
        Enrichit le contexte avec les données utilisateur pertinentes
        
        Returns:
            Dict avec: user_info, recent_missions, vehicles (si transporteur), etc.
        """
        context = {}
        
        try:
            # 1. Infos utilisateur de base
            user_info = await self._get_user_info(user_id, db_session)
            if user_info:
                context["user_info"] = user_info
            
            # 2. Données spécifiques au rôle
            role_normalized = user_role.upper() if user_role else "CLIENT"
            
            if role_normalized == "TRANSPORTEUR":
                # Véhicules du transporteur
                vehicles = await self._get_user_vehicles(user_id, db_session)
                if vehicles:
                    context["vehicles"] = vehicles
                
                # Missions récentes (assignées)
                recent_missions = await self._get_transporteur_missions(user_id, db_session)
                if recent_missions:
                    context["recent_missions"] = recent_missions
            
            elif role_normalized == "AFFRETEUR":
                # Missions créées récemment
                recent_missions = await self._get_affreteur_missions(user_id, db_session)
                if recent_missions:
                    context["recent_missions"] = recent_missions
            
            elif role_normalized == "CLIENT":
                # Commandes récentes
                recent_orders = await self._get_client_orders(user_id, db_session)
                if recent_orders:
                    context["recent_orders"] = recent_orders
            
            return context
            
        except Exception as e:
            logger.error(f"Error enriching context: {e}", exc_info=True)
            return {}
    
    async def _get_user_info(self, user_id: str, db) -> Optional[Dict]:
        """Récupère les infos de base de l'utilisateur"""
        try:
            query = text("""
                SELECT 
                    id,
                    first_name,
                    last_name,
                    email,
                    role,
                    phone
                FROM users
                WHERE id = CAST(:user_id AS UUID)
                LIMIT 1
            """)
            
            result = db.execute(query, {"user_id": user_id}).fetchone()
            
            if result:
                return {
                    "id": result.id,
                    "name": f"{result.first_name} {result.last_name}",
                    "email": result.email,
                    "role": result.role,
                    "phone": result.phone
                }
            return None
        except Exception as e:
            logger.error(f"Error getting user info: {e}")
            return None
    
    async def _get_user_vehicles(self, user_id: str, db) -> list:
        """Récupère les véhicules du transporteur"""
        try:
            query = text("""
                SELECT 
                    id,
                    type,
                    immatriculation,
                    capacite,
                    status
                FROM vehicles
                WHERE transporteur_id = CAST(:user_id AS UUID)
                AND status IN ('available', 'in_mission')
                ORDER BY created_at DESC
                LIMIT 5
            """)
            
            results = db.execute(query, {"user_id": user_id}).fetchall()
            
            return [
                {
                    "id": r.id,
                    "type": r.type,
                    "immatriculation": r.immatriculation,
                    "capacite": r.capacite,
                    "status": r.status
                }
                for r in results
            ]
        except Exception as e:
            logger.error(f"Error getting vehicles: {e}")
            return []
    
    async def _get_transporteur_missions(self, user_id: str, db) -> list:
        """Récupère les missions récentes du transporteur"""
        try:
            query = text("""
                SELECT 
                    id,
                    title,
                    status,
                    poids,
                    budget_max
                FROM missions
                WHERE transporteur_id = CAST(:user_id AS UUID)
                AND status IN ('assigned', 'in_progress', 'completed')
                ORDER BY created_at DESC
                LIMIT 3
            """)
            
            results = db.execute(query, {"user_id": user_id}).fetchall()
            
            return [
                {
                    "id": r.id,
                    "title": r.title,
                    "status": r.status,
                    "poids": r.poids,
                    "budget": r.budget_max
                }
                for r in results
            ]
        except Exception as e:
            logger.error(f"Error getting transporteur missions: {e}")
            return []
    
    async def _get_affreteur_missions(self, user_id: str, db) -> list:
        """Récupère les missions récentes de l'affréteur"""
        try:
            query = text("""
                SELECT 
                    id,
                    title,
                    status,
                    poids,
                    budget_max
                FROM missions
                WHERE affreteur_id = CAST(:user_id AS UUID)
                ORDER BY created_at DESC
                LIMIT 3
            """)
            
            results = db.execute(query, {"user_id": user_id}).fetchall()
            
            return [
                {
                    "id": r.id,
                    "title": r.title,
                    "status": r.status,
                    "poids": r.poids,
                    "budget": r.budget_max
                }
                for r in results
            ]
        except Exception as e:
            logger.error(f"Error getting affreteur missions: {e}")
            return []
    
    async def _get_client_orders(self, user_id: str, db) -> list:
        """Récupère les commandes récentes du client"""
        try:
            query = text("""
                SELECT 
                    id,
                    order_number,
                    status,
                    total_amount
                FROM orders
                WHERE user_id = CAST(:user_id AS UUID)
                ORDER BY created_at DESC
                LIMIT 3
            """)
            
            results = db.execute(query, {"user_id": user_id}).fetchall()
            
            return [
                {
                    "id": r.id,
                    "order_number": r.order_number,
                    "status": r.status,
                    "total": r.total_amount
                }
                for r in results
            ]
        except Exception as e:
            logger.error(f"Error getting client orders: {e}")
            return []


# Singleton
_context_service: Optional[ContextEnrichmentService] = None


def get_context_service() -> ContextEnrichmentService:
    """Get or create context enrichment service"""
    global _context_service
    if _context_service is None:
        _context_service = ContextEnrichmentService()
    return _context_service
