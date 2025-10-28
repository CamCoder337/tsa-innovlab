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

        # Configurable thresholds (can be overridden by env vars)
        import os
        self.min_purchases_collaborative = int(os.getenv("REC_MIN_PURCHASES_COLLABORATIVE", "3"))
        self.min_purchases_content = int(os.getenv("REC_MIN_PURCHASES_CONTENT", "1"))
        self.similar_users_limit = int(os.getenv("REC_SIMILAR_USERS_LIMIT", "20"))
        self.min_common_products = int(os.getenv("REC_MIN_COMMON_PRODUCTS", "2"))
        self.price_range_multiplier = float(os.getenv("REC_PRICE_RANGE_MULTIPLIER", "0.5"))
        self.similar_product_price_range = float(os.getenv("REC_SIMILAR_PRICE_RANGE", "0.3"))
        self.default_time_window_days = int(os.getenv("REC_DEFAULT_TIME_WINDOW_DAYS", "30"))

        # A/B testing configuration
        self.ab_testing_enabled = os.getenv("REC_AB_TESTING_ENABLED", "false").lower() == "true"

        logger.info(f"ProductRecommendationService initialized with version {self.model_version}")
        logger.info(f"Thresholds: collaborative={self.min_purchases_collaborative}, "
                   f"content={self.min_purchases_content}, similar_users={self.similar_users_limit}")
        logger.info(f"A/B Testing: {'enabled' if self.ab_testing_enabled else 'disabled'}")

    def _get_ab_test_group(self, user_id: str) -> str:
        """
        Assign user to A/B test group based on user_id hash
        This ensures consistent assignment across requests

        Returns: 'control', 'variant_a', 'variant_b'
        """
        if not self.ab_testing_enabled:
            return 'control'

        # Use hash to consistently assign users to groups
        import hashlib
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)

        # Split traffic: 34% control, 33% variant_a, 33% variant_b
        group_num = hash_value % 100

        if group_num < 34:
            return 'control'
        elif group_num < 67:
            return 'variant_a'
        else:
            return 'variant_b'

    def _apply_ab_test_config(self, group: str) -> Dict[str, Any]:
        """
        Apply different configuration based on A/B test group

        Control: Standard configuration
        Variant A: More aggressive collaborative filtering (lower thresholds)
        Variant B: More conservative (higher thresholds, larger user pool)
        """
        configs = {
            'control': {
                'min_purchases_collaborative': self.min_purchases_collaborative,
                'min_common_products': self.min_common_products,
                'similar_users_limit': self.similar_users_limit,
            },
            'variant_a': {
                'min_purchases_collaborative': max(2, self.min_purchases_collaborative - 1),
                'min_common_products': max(1, self.min_common_products - 1),
                'similar_users_limit': self.similar_users_limit,
            },
            'variant_b': {
                'min_purchases_collaborative': self.min_purchases_collaborative + 1,
                'min_common_products': self.min_common_products,
                'similar_users_limit': min(50, self.similar_users_limit + 10),
            }
        }

        return configs.get(group, configs['control'])

    def _log_error(self, context: str, err: Exception) -> None:
        """
        Log errors with full details for debugging
        """
        err_type = err.__class__.__name__
        err_msg = str(err)

        # Log full error details for debugging
        logger.error(f"{context}: {err_type} - {err_msg}", exc_info=True)

        # Also log a summary without stack trace for quick scanning
        logger.error(f"ERROR SUMMARY - {context}: {err_type}")

    async def get_personalized_recommendations(
        self, request: PersonalizedProductRecommendationRequest
    ) -> ProductRecommendationResponse:
        """
        Get personalized recommendations for a user
        Uses multiple strategies based on available data
        Supports A/B testing when enabled
        """
        start_time = datetime.utcnow()

        try:
            db = SessionLocal()

            # A/B testing: assign user to test group
            ab_group = self._get_ab_test_group(request.user_id)
            ab_config = self._apply_ab_test_config(ab_group)

            # Store original thresholds
            original_min_purchases = self.min_purchases_collaborative
            original_min_common = self.min_common_products
            original_similar_limit = self.similar_users_limit

            # Apply A/B test configuration temporarily
            if self.ab_testing_enabled:
                self.min_purchases_collaborative = ab_config['min_purchases_collaborative']
                self.min_common_products = ab_config['min_common_products']
                self.similar_users_limit = ab_config['similar_users_limit']
                logger.info(f"User {request.user_id} assigned to A/B group: {ab_group}")

            # Get user purchase history
            user_history = await self._get_user_history(db, request.user_id)

            # Choose strategy based on user history
            if len(user_history) >= self.min_purchases_collaborative:
                # User has enough history - use collaborative filtering
                recommendations = await self._collaborative_filtering_recommendations(
                    db, request.user_id, user_history, request.limit, request.exclude_product_ids
                )
                strategy = "collaborative_filtering"
            elif len(user_history) >= self.min_purchases_content:
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

            # Restore original thresholds
            if self.ab_testing_enabled:
                self.min_purchases_collaborative = original_min_purchases
                self.min_common_products = original_min_common
                self.similar_users_limit = original_similar_limit

            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            # Add A/B test metadata
            metadata = {}
            if self.ab_testing_enabled:
                metadata['ab_test_group'] = ab_group
                metadata['ab_test_config'] = ab_config

            return ProductRecommendationResponse(
                success=True,
                recommendations=recommendations,
                strategy_used=strategy,
                total=len(recommendations),
                processing_time_ms=round(processing_time, 2),
                metadata=metadata if metadata else None
            )

        except Exception as e:
            self._log_error("Personalized product recommendations failed", e)

            # Restore original thresholds even on error
            if self.ab_testing_enabled:
                self.min_purchases_collaborative = original_min_purchases
                self.min_common_products = original_min_common
                self.similar_users_limit = original_similar_limit

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
        Optimized with single query using CTEs and JOINs
        """
        try:
            # Get product IDs from user history
            user_product_ids = [item["product_id"] for item in user_history]

            # Build optimized query with CTEs (Common Table Expressions)
            base_sql = """
                WITH similar_users AS (
                    -- Find users who bought similar products
                    SELECT o.user_id, COUNT(DISTINCT oi.product_id) as common_products
                    FROM orders o
                    JOIN order_items oi ON o.id = oi.order_id
                    WHERE oi.product_id IN :product_ids
                    AND o.user_id != :user_id
                    AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
                    GROUP BY o.user_id
                    HAVING COUNT(DISTINCT oi.product_id) >= :min_common
                    ORDER BY common_products DESC
                    LIMIT :similar_users_limit
                ),
                similar_user_purchases AS (
                    -- Get what similar users bought
                    SELECT
                        oi.product_id,
                        p.name,
                        COUNT(*) as purchase_count,
                        AVG(p.price) as avg_price,
                        MAX(o.created_at) as last_purchase_date
                    FROM similar_users su
                    JOIN orders o ON su.user_id = o.user_id
                    JOIN order_items oi ON o.id = oi.order_id
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.product_id NOT IN :user_products
            """

            params = {
                "product_ids": tuple(user_product_ids),
                "user_id": user_id,
                "min_common": self.min_common_products,
                "similar_users_limit": self.similar_users_limit,
                "user_products": tuple(user_product_ids),
                "limit": limit,
            }

            if exclude_ids:
                base_sql += "\n                    AND oi.product_id NOT IN :exclude_ids"
                params["exclude_ids"] = tuple(exclude_ids)

            base_sql += """
                    AND p.is_active = true
                    AND p.stock > 0
                    AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
                    GROUP BY oi.product_id, p.name
                )
                SELECT
                    product_id,
                    name,
                    purchase_count,
                    avg_price,
                    last_purchase_date
                FROM similar_user_purchases
                ORDER BY purchase_count DESC, last_purchase_date DESC
                LIMIT :limit
            """

            query = text(base_sql)
            result = db.execute(query, params)
            rows = result.fetchall()

            if not rows:
                # Fallback to content-based if no similar users found
                return await self._content_based_recommendations(db, user_history, limit, exclude_ids)

            # Calculate scores based on purchase frequency with temporal weighting
            max_count = rows[0][2] if rows else 1
            now = datetime.utcnow()
            recommendations = []

            for row in rows:
                product_id = str(row[0])
                product_name = row[1]
                purchase_count = int(row[2])
                last_purchase_date = row[4]

                # Base score from purchase frequency
                frequency_score = purchase_count / max_count

                # Temporal weighting: recent purchases are more relevant
                if last_purchase_date:
                    days_ago = (now - last_purchase_date).days
                    # Decay factor: 1.0 for recent (0-7 days), 0.5 for old (>180 days)
                    temporal_weight = max(0.5, 1.0 - (days_ago / 365))
                else:
                    temporal_weight = 0.5

                # Combined score
                score = frequency_score * temporal_weight

                reason = f"Aimé par des utilisateurs similaires ({purchase_count} achats)"
                if days_ago <= 7:
                    reason += " - Tendance récente"

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
            price_min = avg_price * self.price_range_multiplier
            price_max = avg_price * (2.0 / self.price_range_multiplier)

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

    async def get_ab_test_results(self) -> Dict[str, Any]:
        """
        Get A/B test results comparing performance across test groups
        """
        try:
            if not self.ab_testing_enabled:
                return {
                    "enabled": False,
                    "message": "A/B testing is not enabled. Set REC_AB_TESTING_ENABLED=true to enable."
                }

            db = SessionLocal()

            # Query to get stats for each A/B test group
            # Note: We need to store ab_test_group in feedback metadata
            query = text("""
                WITH group_stats AS (
                    SELECT
                        metadata->>'ab_test_group' as test_group,
                        strategy_used,
                        COUNT(DISTINCT user_id) as users,
                        COUNT(*) as impressions,
                        SUM(CASE WHEN action = 'view' THEN 1 ELSE 0 END) as views,
                        SUM(CASE WHEN action = 'click' THEN 1 ELSE 0 END) as clicks,
                        SUM(CASE WHEN action = 'purchase' THEN 1 ELSE 0 END) as purchases
                    FROM product_recommendation_feedbacks
                    WHERE created_at >= NOW() - INTERVAL '30 days'
                    AND metadata IS NOT NULL
                    AND metadata->>'ab_test_group' IS NOT NULL
                    GROUP BY metadata->>'ab_test_group', strategy_used
                )
                SELECT
                    test_group,
                    strategy_used,
                    users,
                    impressions,
                    views,
                    clicks,
                    purchases,
                    CASE WHEN views > 0 THEN (clicks::FLOAT / views * 100) ELSE 0 END as ctr,
                    CASE WHEN clicks > 0 THEN (purchases::FLOAT / clicks * 100) ELSE 0 END as conversion_rate
                FROM group_stats
                ORDER BY test_group, strategy_used
            """)

            results = db.execute(query).fetchall()
            db.close()

            # Organize results by group
            groups = {}
            for row in results:
                test_group = row[0]
                if test_group not in groups:
                    groups[test_group] = {
                        'group': test_group,
                        'total_users': 0,
                        'total_impressions': 0,
                        'strategies': {}
                    }

                strategy = row[1]
                groups[test_group]['total_users'] += int(row[2])
                groups[test_group]['total_impressions'] += int(row[3])
                groups[test_group]['strategies'][strategy] = {
                    'users': int(row[2]),
                    'impressions': int(row[3]),
                    'views': int(row[4]),
                    'clicks': int(row[5]),
                    'purchases': int(row[6]),
                    'ctr': round(float(row[7]), 2),
                    'conversion_rate': round(float(row[8]), 2)
                }

            # Determine winner based on overall conversion rate
            winner = None
            best_conversion = 0
            for group_name, group_data in groups.items():
                total_clicks = sum(s.get('clicks', 0) for s in group_data['strategies'].values())
                total_purchases = sum(s.get('purchases', 0) for s in group_data['strategies'].values())
                overall_conversion = (total_purchases / total_clicks * 100) if total_clicks > 0 else 0
                group_data['overall_conversion_rate'] = round(overall_conversion, 2)

                if overall_conversion > best_conversion:
                    best_conversion = overall_conversion
                    winner = group_name

            return {
                "enabled": True,
                "period": "last_30_days",
                "groups": groups,
                "winner": winner,
                "best_conversion_rate": round(best_conversion, 2),
                "recommendation": f"Group '{winner}' performs best with {best_conversion:.2f}% conversion rate" if winner else "Insufficient data"
            }

        except Exception as e:
            self._log_error("Failed to get A/B test results", e)
            return {
                "enabled": self.ab_testing_enabled,
                "error": "Failed to retrieve A/B test results",
                "recommendation": "Check that feedback metadata includes ab_test_group"
            }

    async def analyze_and_adjust_thresholds(self) -> Dict[str, Any]:
        """
        Analyze feedback data and suggest threshold adjustments
        Returns recommended threshold values based on performance metrics
        """
        try:
            db = SessionLocal()

            # Analyze collaborative filtering performance
            collab_query = text("""
                WITH user_purchase_counts AS (
                    SELECT
                        f.user_id,
                        COUNT(DISTINCT CASE WHEN f.action = 'purchase' THEN f.product_id END) as purchases,
                        COUNT(DISTINCT CASE WHEN f.action = 'click' THEN f.product_id END) as clicks
                    FROM product_recommendation_feedbacks f
                    WHERE f.strategy_used = 'collaborative_filtering'
                    AND f.created_at >= NOW() - INTERVAL '30 days'
                    GROUP BY f.user_id
                )
                SELECT
                    AVG(CASE WHEN clicks > 0 THEN purchases::FLOAT / clicks ELSE 0 END) as avg_conversion,
                    COUNT(*) as user_count
                FROM user_purchase_counts
            """)

            collab_result = db.execute(collab_query).fetchone()
            collab_conversion = float(collab_result[0]) if collab_result and collab_result[0] else 0

            # Analyze content-based performance
            content_query = text("""
                SELECT
                    COUNT(CASE WHEN action = 'purchase' THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN action = 'click' THEN 1 END), 0) as conversion,
                    COUNT(DISTINCT user_id) as user_count
                FROM product_recommendation_feedbacks
                WHERE strategy_used = 'content_based'
                AND created_at >= NOW() - INTERVAL '30 days'
            """)

            content_result = db.execute(content_query).fetchone()
            content_conversion = float(content_result[0]) if content_result and content_result[0] else 0

            # Analyze popularity performance
            popularity_query = text("""
                SELECT
                    COUNT(CASE WHEN action = 'purchase' THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN action = 'click' THEN 1 END), 0) as conversion,
                    COUNT(DISTINCT user_id) as user_count
                FROM product_recommendation_feedbacks
                WHERE strategy_used = 'popularity_based'
                AND created_at >= NOW() - INTERVAL '30 days'
            """)

            popularity_result = db.execute(popularity_query).fetchone()
            popularity_conversion = float(popularity_result[0]) if popularity_result and popularity_result[0] else 0

            db.close()

            # Suggest adjustments based on performance
            recommendations = {
                "current_thresholds": {
                    "min_purchases_collaborative": self.min_purchases_collaborative,
                    "min_purchases_content": self.min_purchases_content,
                    "similar_users_limit": self.similar_users_limit,
                    "min_common_products": self.min_common_products,
                },
                "performance_metrics": {
                    "collaborative_conversion": round(collab_conversion * 100, 2),
                    "content_conversion": round(content_conversion * 100, 2),
                    "popularity_conversion": round(popularity_conversion * 100, 2),
                },
                "suggested_adjustments": {},
                "reasoning": []
            }

            # If collaborative filtering performs well, potentially lower threshold
            if collab_conversion > 0.05:  # 5% conversion
                if self.min_purchases_collaborative > 2:
                    recommendations["suggested_adjustments"]["min_purchases_collaborative"] = max(2, self.min_purchases_collaborative - 1)
                    recommendations["reasoning"].append("Collaborative filtering performs well - consider lowering threshold to serve more users")

            # If collaborative performs poorly, increase threshold
            elif collab_conversion < 0.02:  # 2% conversion
                recommendations["suggested_adjustments"]["min_purchases_collaborative"] = self.min_purchases_collaborative + 1
                recommendations["reasoning"].append("Collaborative filtering underperforms - increase threshold for better quality")

            # If content-based outperforms collaborative, suggest using it more
            if content_conversion > collab_conversion * 1.5:
                recommendations["reasoning"].append("Content-based significantly outperforms collaborative - consider prioritizing it")

            # If popularity performs best, users might be too diverse
            if popularity_conversion > max(collab_conversion, content_conversion) * 1.3:
                recommendations["suggested_adjustments"]["similar_users_limit"] = min(50, self.similar_users_limit + 10)
                recommendations["reasoning"].append("Popularity performs best - increase similar_users_limit to find more patterns")

            recommendations["recommendation"] = "Apply suggested adjustments and monitor for 7 days" if recommendations["suggested_adjustments"] else "Current thresholds are optimal"

            return recommendations

        except Exception as e:
            self._log_error("Failed to analyze thresholds", e)
            return {
                "error": "Failed to analyze feedback data",
                "current_thresholds": {
                    "min_purchases_collaborative": self.min_purchases_collaborative,
                    "min_purchases_content": self.min_purchases_content,
                },
                "recommendation": "Insufficient data for analysis"
            }

    async def get_recommendation_stats(self) -> Dict[str, Any]:
        """
        Get real-time statistics from feedback data
        """
        try:
            db = SessionLocal()

            # Get overall stats
            overall_query = text("""
                SELECT
                    COUNT(DISTINCT user_id) as total_users,
                    COUNT(*) as total_recommendations,
                    SUM(CASE WHEN action = 'view' THEN 1 ELSE 0 END) as total_views,
                    SUM(CASE WHEN action = 'click' THEN 1 ELSE 0 END) as total_clicks,
                    SUM(CASE WHEN action = 'add_to_cart' THEN 1 ELSE 0 END) as total_add_to_cart,
                    SUM(CASE WHEN action = 'purchase' THEN 1 ELSE 0 END) as total_purchases
                FROM product_recommendation_feedbacks
                WHERE created_at >= NOW() - INTERVAL '30 days'
            """)

            overall_result = db.execute(overall_query).fetchone()

            # Get stats by strategy
            strategy_query = text("""
                SELECT
                    strategy_used,
                    COUNT(*) as usage_count,
                    SUM(CASE WHEN action = 'view' THEN 1 ELSE 0 END) as views,
                    SUM(CASE WHEN action = 'click' THEN 1 ELSE 0 END) as clicks,
                    SUM(CASE WHEN action = 'purchase' THEN 1 ELSE 0 END) as purchases
                FROM product_recommendation_feedbacks
                WHERE strategy_used IS NOT NULL
                AND created_at >= NOW() - INTERVAL '30 days'
                GROUP BY strategy_used
            """)

            strategy_results = db.execute(strategy_query).fetchall()
            db.close()

            # Calculate CTR and conversion rates
            strategies_performance = {}
            for row in strategy_results:
                strategy = row[0]
                usage_count = row[1]
                views = row[2]
                clicks = row[3]
                purchases = row[4]

                ctr = (clicks / views * 100) if views > 0 else 0
                conversion = (purchases / clicks * 100) if clicks > 0 else 0

                strategies_performance[strategy] = {
                    "usage_count": usage_count,
                    "avg_ctr": round(ctr, 2),
                    "avg_conversion": round(conversion, 2),
                }

            # Fill in missing strategies with zeros
            for strategy in ["collaborative_filtering", "content_based", "popularity_based"]:
                if strategy not in strategies_performance:
                    strategies_performance[strategy] = {
                        "usage_count": 0,
                        "avg_ctr": 0.0,
                        "avg_conversion": 0.0,
                    }

            return {
                "total_recommendations_served": overall_result[1] if overall_result else 0,
                "total_users_recommended": overall_result[0] if overall_result else 0,
                "total_views": overall_result[2] if overall_result else 0,
                "total_clicks": overall_result[3] if overall_result else 0,
                "total_purchases": overall_result[5] if overall_result else 0,
                "strategies_performance": strategies_performance,
                "last_updated": datetime.utcnow().isoformat(),
                "status": "operational",
            }

        except Exception as e:
            self._log_error("Failed to get recommendation stats", e)
            # Return empty stats on error
            return {
                "total_recommendations_served": 0,
                "total_users_recommended": 0,
                "total_views": 0,
                "total_clicks": 0,
                "total_purchases": 0,
                "strategies_performance": {
                    "collaborative_filtering": {"usage_count": 0, "avg_ctr": 0.0, "avg_conversion": 0.0},
                    "content_based": {"usage_count": 0, "avg_ctr": 0.0, "avg_conversion": 0.0},
                    "popularity_based": {"usage_count": 0, "avg_ctr": 0.0, "avg_conversion": 0.0},
                },
                "last_updated": datetime.utcnow().isoformat(),
                "status": "error",
            }

    async def store_feedback(
        self, user_id: str, product_id: str, action: str, context: str = None,
        strategy_used: str = None, recommendation_score: float = None, metadata: Dict = None
    ) -> bool:
        """
        Store recommendation feedback in database for learning and metrics
        """
        try:
            db = SessionLocal()

            query = text("""
                INSERT INTO product_recommendation_feedbacks
                (user_id, product_id, action, context, strategy_used, recommendation_score, metadata, created_at, updated_at)
                VALUES (:user_id, :product_id, :action, :context, :strategy_used, :recommendation_score, :metadata, NOW(), NOW())
                RETURNING id
            """)

            result = db.execute(query, {
                "user_id": user_id,
                "product_id": product_id,
                "action": action,
                "context": context,
                "strategy_used": strategy_used,
                "recommendation_score": recommendation_score,
                "metadata": metadata
            })

            db.commit()
            feedback_id = result.fetchone()[0]
            db.close()

            logger.info(f"Feedback stored successfully: {feedback_id} - user={user_id}, product={product_id}, action={action}")
            return True

        except Exception as e:
            self._log_error("Failed to store feedback", e)
            if db:
                db.rollback()
                db.close()
            return False

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
            price_min = price * (1.0 - self.similar_product_price_range)
            price_max = price * (1.0 + self.similar_product_price_range)

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