"""
Product Recommendation Service
Handles all ML-based product recommendation logic
Accesses PostgreSQL directly for user history and product data
"""
import logging
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import math

from sqlalchemy import text
from app.core.database import SessionLocal
from app.schemas.product_recommendations import (
    PersonalizedProductRecommendationRequest,
    SimilarProductsRequest,
    ProductRecommendation,
    ProductRecommendationResponse,
)

logger = logging.getLogger(__name__)


class ProductRecommendationService:
    """
    Service for product recommendations using multiple strategies
    """

    def __init__(self):
        self.model_version = "1.0.0"
        self.cache = {}  # Simple in-memory cache for product similarities

    def _log_error(self, context: str, err: Exception) -> None:
        """
        Log errors without leaking SQL statements or parameters.
        Only the error type is recorded to keep logs clean.
        """
        try:
            err_type = err.__class__.__name__
        except Exception:
            err_type = "UnknownError"
        logger.error(f"{context}: {err_type}")

    async def get_personalized_recommendations(
        self, request: PersonalizedProductRecommendationRequest
    ) -> ProductRecommendationResponse:
        """
        Get personalized recommendations for a user
        Uses multiple strategies based on available data
        """
        start_time = datetime.utcnow()

        try:
            db = SessionLocal()

            # Get user purchase history
            user_history = await self._get_user_history(db, request.user_id)

            # Choose strategy based on user history
            if len(user_history) >= 3:
                # User has enough history - use collaborative filtering
                recommendations = await self._collaborative_filtering_recommendations(
                    db, request.user_id, user_history, request.limit, request.exclude_product_ids
                )
                strategy = "collaborative_filtering"
            elif len(user_history) >= 1:
                # User has some history - use content-based recommendations
                recommendations = await self._content_based_recommendations(
                    db, user_history, request.limit, request.exclude_product_ids
                )
                strategy = "content_based"
            else:
                # New user - use popularity-based recommendations
                recommendations = await self._popularity_based_recommendations(
                    db, request.limit, request.exclude_product_ids
                )
                strategy = "popularity_based"

            db.close()

            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            return ProductRecommendationResponse(
                success=True,
                recommendations=recommendations,
                strategy_used=strategy,
                total=len(recommendations),
                processing_time_ms=round(processing_time, 2),
            )

        except Exception as e:
            self._log_error("Personalized product recommendations failed", e)
            # Return empty recommendations on failure
            return ProductRecommendationResponse(
                success=False,
                recommendations=[],
                strategy_used="fallback_error",
                total=0,
                processing_time_ms=0,
            )

    async def get_similar_products(
        self, request: SimilarProductsRequest
    ) -> ProductRecommendationResponse:
        """
        Get products similar to a given product
        """
        start_time = datetime.utcnow()

        try:
            db = SessionLocal()

            # Get base product details
            base_product = await self._get_product_details(db, request.product_id)

            if not base_product:
                db.close()
                return ProductRecommendationResponse(
                    success=False,
                    recommendations=[],
                    strategy_used="product_not_found",
                    total=0,
                )

            # Find similar products based on category, price range, and attributes
            recommendations = await self._find_similar_products(
                db, base_product, request.limit, request.exclude_product_ids
            )

            db.close()

            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            return ProductRecommendationResponse(
                success=True,
                recommendations=recommendations,
                strategy_used="content_similarity",
                total=len(recommendations),
                processing_time_ms=round(processing_time, 2),
            )

        except Exception as e:
            self._log_error("Similar products recommendations failed", e)
            return ProductRecommendationResponse(
                success=False,
                recommendations=[],
                strategy_used="fallback_error",
                total=0,
            )

    async def get_popular_products(
        self, limit: int = 10, time_window_days: int = 30
    ) -> ProductRecommendationResponse:
        """
        Get popular/trending products based on recent orders
        """
        start_time = datetime.utcnow()

        try:
            db = SessionLocal()

            # Get popular products from recent orders
            recommendations = await self._popularity_based_recommendations(
                db, limit, [], time_window_days
            )

            db.close()

            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            return ProductRecommendationResponse(
                success=True,
                recommendations=recommendations,
                strategy_used="popularity",
                total=len(recommendations),
                processing_time_ms=round(processing_time, 2),
            )

        except Exception as e:
            self._log_error("Popular products recommendations failed", e)
            return ProductRecommendationResponse(
                success=False,
                recommendations=[],
                strategy_used="fallback_error",
                total=0,
            )

    async def _get_user_history(self, db, user_id: str) -> List[Dict[str, Any]]:
        """
        Get user's purchase history from database
        """
        try:
            query = text("""
                SELECT
                    oi.product_id,
                    oi.product_name,
                    p.category_id,
                    p.price,
                    o.created_at
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                WHERE o.user_id = :user_id
                AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
                ORDER BY o.created_at DESC
                LIMIT 50
            """)

            result = db.execute(query, {"user_id": user_id})
            rows = result.fetchall()

            return [
                {
                    "product_id": str(row[0]),
                    "product_name": row[1],
                    "category_id": str(row[2]) if row[2] else None,
                    "price": float(row[3]) if row[3] else 0,
                    "created_at": row[4],
                }
                for row in rows
            ]

        except Exception as e:
            self._log_error("Failed to get user history", e)
            return []

    async def _get_product_details(self, db, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Get product details from database
        """
        try:
            query = text("""
                SELECT
                    id, name, category_id, price, stock, specifications
                FROM products
                WHERE id = :product_id AND is_active = true
            """)

            result = db.execute(query, {"product_id": product_id})
            row = result.fetchone()

            if not row:
                return None

            return {
                "id": str(row[0]),
                "name": row[1],
                "category_id": str(row[2]) if row[2] else None,
                "price": float(row[3]) if row[3] else 0,
                "stock": int(row[4]) if row[4] else 0,
                "specifications": row[5],
            }

        except Exception as e:
            self._log_error("Failed to get product details", e)
            return None

    async def _collaborative_filtering_recommendations(
        self, db, user_id: str, user_history: List[Dict], limit: int, exclude_ids: List[str]
    ) -> List[ProductRecommendation]:
        """
        Collaborative filtering: find similar users and recommend their purchases
        """
        try:
            # Get product IDs from user history
            user_product_ids = [item["product_id"] for item in user_history]

            # Find other users who bought similar products
            query = text("""
                SELECT DISTINCT o.user_id, COUNT(DISTINCT oi.product_id) as common_products
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE oi.product_id IN :product_ids
                AND o.user_id != :user_id
                AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
                GROUP BY o.user_id
                HAVING COUNT(DISTINCT oi.product_id) >= 2
                ORDER BY common_products DESC
                LIMIT 20
            """)

            result = db.execute(
                query, {"product_ids": tuple(user_product_ids), "user_id": user_id}
            )
            similar_users = [str(row[0]) for row in result.fetchall()]

            if not similar_users:
                # Fallback to content-based if no similar users found
                return await self._content_based_recommendations(db, user_history, limit, exclude_ids)

            # Get products purchased by similar users but not by current user
            base_sql = """
                SELECT
                    oi.product_id,
                    p.name,
                    COUNT(*) as purchase_count,
                    AVG(p.price) as avg_price
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                WHERE o.user_id IN :similar_users
                AND oi.product_id NOT IN :user_products
            """
            params = {
                "similar_users": tuple(similar_users),
                "user_products": tuple(user_product_ids),
                "limit": limit,
            }
            if exclude_ids:
                base_sql += "\n                AND oi.product_id NOT IN :exclude_ids"
                params["exclude_ids"] = tuple(exclude_ids)
            base_sql += """
                AND p.is_active = true
                AND p.stock > 0
                GROUP BY oi.product_id, p.name
                ORDER BY purchase_count DESC
                LIMIT :limit
            """

            query = text(base_sql)
            result = db.execute(query, params)
            rows = result.fetchall()

            # Calculate scores based on purchase frequency
            max_count = rows[0][2] if rows else 1
            recommendations = []

            for row in rows:
                product_id = str(row[0])
                product_name = row[1]
                purchase_count = int(row[2])

                score = purchase_count / max_count  # Normalize to 0-1
                reason = f"Aimé par des utilisateurs similaires ({purchase_count} achats)"

                recommendations.append(
                    ProductRecommendation(
                        product_id=product_id, score=round(score, 3), reason=reason, confidence=0.8
                    )
                )

            return recommendations

        except Exception as e:
            self._log_error("Collaborative filtering failed", e)
            return []

    async def _content_based_recommendations(
        self, db, user_history: List[Dict], limit: int, exclude_ids: List[str]
    ) -> List[ProductRecommendation]:
        """
        Content-based: recommend products similar to what user has purchased
        """
        try:
            # Get categories and price ranges from user history
            categories = [item["category_id"] for item in user_history if item.get("category_id")]
            prices = [item["price"] for item in user_history if item.get("price")]

            if not categories:
                # Fallback to popularity if no category data
                return await self._popularity_based_recommendations(db, limit, exclude_ids)

            # Calculate preferred category (most frequent)
            category_counter = Counter(categories)
            preferred_categories = [cat for cat, _ in category_counter.most_common(3)]

            # Calculate average price range
            avg_price = sum(prices) / len(prices) if prices else 0
            price_min = avg_price * 0.5
            price_max = avg_price * 2.0

            # Get products from purchased history
            purchased_ids = [item["product_id"] for item in user_history]
            exclude_list = exclude_ids + purchased_ids

            # Find similar products in same categories and price range
            base_sql = """
                SELECT
                    id, name, category_id, price
                FROM products
                WHERE category_id IN :categories
                AND price BETWEEN :price_min AND :price_max
            """
            params = {
                "categories": tuple(preferred_categories),
                "price_min": price_min,
                "price_max": price_max,
                "limit": limit,
            }
            if exclude_list:
                base_sql += "\n                AND id NOT IN :exclude_ids"
                params["exclude_ids"] = tuple(exclude_list)
            base_sql += """
                AND is_active = true
                AND stock > 0
                ORDER BY created_at DESC
                LIMIT :limit
            """

            query = text(base_sql)
            result = db.execute(query, params)
            rows = result.fetchall()

            recommendations = []
            for idx, row in enumerate(rows):
                product_id = str(row[0])
                product_name = row[1]
                price = float(row[3])

                # Score based on price similarity and category match
                price_similarity = 1 - abs(price - avg_price) / (avg_price + 1)
                score = max(0.5, price_similarity)  # Minimum score of 0.5

                reason = "Similaire à vos achats précédents"

                recommendations.append(
                    ProductRecommendation(
                        product_id=product_id, score=round(score, 3), reason=reason, confidence=0.75
                    )
                )

            return recommendations

        except Exception as e:
            self._log_error("Content-based recommendations failed", e)
            return []

    async def _popularity_based_recommendations(
        self, db, limit: int, exclude_ids: List[str], time_window_days: int = 30
    ) -> List[ProductRecommendation]:
        """
        Popularity-based: recommend trending products
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=time_window_days)

            # Get most ordered products in time window
            base_sql = """
                SELECT
                    oi.product_id,
                    p.name,
                    COUNT(*) as order_count,
                    SUM(oi.quantity) as total_quantity
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                WHERE o.created_at >= :cutoff_date
            """
            params = {"cutoff_date": cutoff_date, "limit": limit}
            if exclude_ids:
                base_sql += "\n                AND oi.product_id NOT IN :exclude_ids"
                params["exclude_ids"] = tuple(exclude_ids)
            base_sql += """
                AND p.is_active = true
                AND p.stock > 0
                GROUP BY oi.product_id, p.name
                ORDER BY order_count DESC, total_quantity DESC
                LIMIT :limit
            """

            query = text(base_sql)
            result = db.execute(query, params)
            rows = result.fetchall()

            # If no recent orders, get newest products
            if not rows:
                base_sql = """
                    SELECT id, name
                    FROM products
                    WHERE is_active = true
                    AND stock > 0
                """
                params = {"limit": limit}
                if exclude_ids:
                    base_sql += "\n                    AND id NOT IN :exclude_ids"
                    params["exclude_ids"] = tuple(exclude_ids)
                base_sql += """
                    ORDER BY created_at DESC
                    LIMIT :limit
                """

                query = text(base_sql)
                result = db.execute(query, params)
                rows = result.fetchall()

                recommendations = []
                for row in rows:
                    recommendations.append(
                        ProductRecommendation(
                            product_id=str(row[0]),
                            score=0.7,
                            reason="Produit récent",
                            confidence=0.6,
                        )
                    )
                return recommendations

            # Calculate scores based on popularity
            max_count = rows[0][2] if rows else 1
            recommendations = []

            for row in rows:
                product_id = str(row[0])
                product_name = row[1]
                order_count = int(row[2])

                score = order_count / max_count
                reason = f"Produit populaire ({order_count} commandes récentes)"

                recommendations.append(
                    ProductRecommendation(
                        product_id=product_id, score=round(score, 3), reason=reason, confidence=0.85
                    )
                )

            return recommendations

        except Exception as e:
            self._log_error("Popularity-based recommendations failed", e)
            return []

    async def _find_similar_products(
        self, db, base_product: Dict, limit: int, exclude_ids: List[str]
    ) -> List[ProductRecommendation]:
        """
        Find products similar to a given product
        """
        try:
            exclude_list = exclude_ids + [base_product["id"]]

            # Find products in same category with similar price
            price = base_product["price"]
            price_min = price * 0.7
            price_max = price * 1.3

            base_sql = """
                SELECT
                    id, name, price, category_id
                FROM products
                WHERE category_id = :category_id
                AND price BETWEEN :price_min AND :price_max
            """
            params = {
                "category_id": base_product["category_id"],
                "price_min": price_min,
                "price_max": price_max,
                "target_price": price,
                "limit": limit,
            }
            if exclude_list:
                base_sql += "\n                AND id NOT IN :exclude_ids"
                params["exclude_ids"] = tuple(exclude_list)
            base_sql += """
                AND is_active = true
                AND stock > 0
                ORDER BY ABS(price - :target_price)
                LIMIT :limit
            """

            query = text(base_sql)
            result = db.execute(query, params)
            rows = result.fetchall()

            recommendations = []
            for row in rows:
                product_id = str(row[0])
                product_name = row[1]
                product_price = float(row[2])

                # Calculate similarity score based on price difference
                price_diff = abs(product_price - price)
                price_similarity = 1 - (price_diff / (price + 1))
                score = max(0.5, price_similarity)

                reason = "Même catégorie et prix similaire"

                recommendations.append(
                    ProductRecommendation(
                        product_id=product_id, score=round(score, 3), reason=reason, confidence=0.8
                    )
                )

            return recommendations

        except Exception as e:
            self._log_error("Find similar products failed", e)
            return []


# Singleton instance
product_recommendation_service = ProductRecommendationService()
