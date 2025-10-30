"""
Product Data Enrichment Service
Enrichit automatiquement les données de scoring depuis la base de données
"""
import logging
from datetime import datetime
from typing import Dict, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class ProductEnrichmentService:
    """
    Service pour enrichir automatiquement les données de produits
    depuis la base de données PostgreSQL
    """
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    async def enrich_product_data(self, product_id: str, provided_data: Dict) -> Dict:
        """
        Enrichit les données de scoring avec des métriques calculées depuis la DB
        
        Args:
            product_id: ID du produit
            provided_data: Données déjà fournies par l'utilisateur
            
        Returns:
            Dict avec données enrichies (ne remplace pas les données fournies)
        """
        try:
            # Récupérer les informations du produit
            product_info = await self._get_product_info(product_id)
            
            if not product_info:
                logger.warning(f"Product {product_id} not found for enrichment")
                return provided_data
            
            # Calculer les métriques depuis la DB
            sales_metrics = await self._calculate_sales_metrics(product_id)
            age_metrics = self._calculate_age_metrics(product_info)
            category_metrics = self._get_category_metrics(product_info)
            
            # Construire les données enrichies
            enriched = {
                # Âge et durée de vie
                'piece_age_months': provided_data.get('piece_age_months') or age_metrics['age_months'],
                'estimated_lifetime_months': provided_data.get('estimated_lifetime_months') or category_metrics['estimated_lifetime'],
                
                # Fournisseur (basé sur historique de ventes)
                'supplier_rating': provided_data.get('supplier_rating') or sales_metrics['supplier_rating'],
                'supplier_years_experience': provided_data.get('supplier_years_experience') or age_metrics['years_in_catalog'],
                
                # Avis clients (basé sur ventes)
                'average_customer_rating': provided_data.get('average_customer_rating') or sales_metrics['customer_rating'],
                'number_of_reviews': provided_data.get('number_of_reviews') or sales_metrics['total_orders'],
                
                # État physique (basé sur stock)
                'physical_condition_score': provided_data.get('physical_condition_score') or sales_metrics['condition_score'],
                
                # Prix et catégorie
                'price': provided_data.get('price') or product_info['price'],
                'category_code': provided_data.get('category_code') or category_metrics['category_code'],
                
                # Réputation marque (basé sur prix relatif)
                'brand_reputation_score': provided_data.get('brand_reputation_score') or sales_metrics['brand_score'],
                
                # Métadonnées d'enrichissement
                '_enrichment_metadata': {
                    'auto_enriched': True,
                    'total_sales': sales_metrics['total_sales'],
                    'total_orders': sales_metrics['total_orders'],
                    'data_source': 'database',
                    'enriched_at': datetime.now().isoformat(),
                }
            }
            
            logger.info(f"Product {product_id} enriched successfully")
            return enriched
            
        except Exception as e:
            logger.error(f"Error enriching product {product_id}: {e}")
            # En cas d'erreur, retourner les données fournies
            return provided_data
    
    async def _get_product_info(self, product_id: str) -> Optional[Dict]:
        """Récupère les informations de base du produit"""
        try:
            query = """
                SELECT 
                    p.id,
                    p.name,
                    p.price,
                    p.stock,
                    p.stock_alert,
                    p.created_at,
                    p.category_id,
                    c.name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = :product_id
            """
            
            result = await self.db.execute(query, {'product_id': product_id})
            row = result.fetchone()
            
            if row:
                return {
                    'id': row[0],
                    'name': row[1],
                    'price': float(row[2]),
                    'stock': row[3],
                    'stock_alert': row[4],
                    'created_at': row[5],
                    'category_id': row[6],
                    'category_name': row[7],
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching product info: {e}")
            return None
    
    async def _calculate_sales_metrics(self, product_id: str) -> Dict:
        """Calcule les métriques basées sur l'historique des ventes"""
        try:
            query = """
                SELECT 
                    COUNT(DISTINCT oi.order_id) as total_orders,
                    COALESCE(SUM(oi.quantity), 0) as total_sales,
                    COUNT(DISTINCT CASE WHEN o.status IN ('delivered', 'completed') THEN oi.order_id END) as completed_orders
                FROM order_items oi
                LEFT JOIN orders o ON oi.order_id = o.id
                WHERE oi.product_id = :product_id
            """
            
            result = await self.db.execute(query, {'product_id': product_id})
            row = result.fetchone()
            
            total_orders = row[0] if row else 0
            total_sales = row[1] if row else 0
            completed_orders = row[2] if row else 0
            
            # Calculer les scores basés sur les ventes
            # Plus de ventes = meilleure réputation implicite
            supplier_rating = min(5.0, 3.0 + (total_orders * 0.1))
            customer_rating = min(5.0, 3.5 + (total_sales * 0.05))
            condition_score = min(100, 70 + (completed_orders * 3))
            brand_score = min(100, 60 + (total_sales * 2))
            
            return {
                'total_orders': total_orders,
                'total_sales': total_sales,
                'completed_orders': completed_orders,
                'supplier_rating': round(supplier_rating, 1),
                'customer_rating': round(customer_rating, 1),
                'condition_score': round(condition_score),
                'brand_score': round(brand_score),
            }
            
        except Exception as e:
            logger.error(f"Error calculating sales metrics: {e}")
            return {
                'total_orders': 0,
                'total_sales': 0,
                'completed_orders': 0,
                'supplier_rating': 3.5,
                'customer_rating': 3.5,
                'condition_score': 80,
                'brand_score': 70,
            }
    
    def _calculate_age_metrics(self, product_info: Dict) -> Dict:
        """Calcule les métriques d'âge du produit"""
        try:
            created_at = product_info['created_at']
            now = datetime.now()
            
            # Calculer l'âge en mois
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            
            age_delta = now - created_at
            age_months = int(age_delta.days / 30)
            years_in_catalog = max(1, int(age_months / 12))
            
            return {
                'age_months': age_months,
                'years_in_catalog': years_in_catalog,
            }
            
        except Exception as e:
            logger.error(f"Error calculating age metrics: {e}")
            return {
                'age_months': 0,
                'years_in_catalog': 1,
            }
    
    def _get_category_metrics(self, product_info: Dict) -> Dict:
        """Détermine les métriques basées sur la catégorie"""
        category_name = product_info.get('category_name', '')
        
        # Mapping catégorie → durée de vie estimée
        lifetime_map = {
            'fournitures de bureau': 24,  # 2 ans
            'mobilier': 120,  # 10 ans
            'équipements industriels': 180,  # 15 ans
            'électronique': 60,  # 5 ans
            'véhicules et transport': 240,  # 20 ans
            'construction': 180,  # 15 ans
            'alimentaire': 12,  # 1 an
            'textile': 36,  # 3 ans
        }
        
        # Mapping catégorie → code
        category_code_map = {
            'fournitures de bureau': 1,
            'mobilier': 2,
            'équipements industriels': 3,
            'électronique': 4,
            'véhicules et transport': 5,
            'construction': 6,
            'alimentaire': 7,
            'textile': 8,
        }
        
        # Recherche par correspondance partielle
        estimated_lifetime = 120  # Défaut 10 ans
        category_code = 1  # Défaut
        
        if category_name:
            category_lower = category_name.lower()
            for key, lifetime in lifetime_map.items():
                if key in category_lower:
                    estimated_lifetime = lifetime
                    category_code = category_code_map.get(key, 1)
                    break
        
        return {
            'estimated_lifetime': estimated_lifetime,
            'category_code': category_code,
        }


# Instance globale (sera initialisée avec une session DB)
_enrichment_service: Optional[ProductEnrichmentService] = None


def get_enrichment_service(db_session: AsyncSession) -> ProductEnrichmentService:
    """Factory pour obtenir une instance du service d'enrichissement"""
    return ProductEnrichmentService(db_session)
