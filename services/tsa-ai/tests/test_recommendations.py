"""
Unit tests for recommendation system
Tests the recommendation service and endpoints
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
from sqlalchemy.orm import Session

from app.services.recommendation_service import RecommendationService
from app.schemas.recommendations import (
    PersonalizedRecommendationRequest,
    SimilarProductsRequest,
    ProductRecommendation,
    RecommendationResponse,
)


@pytest.fixture
def recommendation_service():
    """Fixture for recommendation service"""
    return RecommendationService()


@pytest.fixture
def mock_db_session():
    """Mock database session"""
    return Mock(spec=Session)


class TestRecommendationService:
    """Test RecommendationService class"""

    @pytest.mark.asyncio
    async def test_get_personalized_recommendations_new_user(
        self, recommendation_service, mock_db_session
    ):
        """Test personalized recommendations for new user (no history)"""
        request = PersonalizedRecommendationRequest(
            user_id="new-user-123",
            limit=5,
            context="homepage",
        )

        # Mock user history as empty
        with patch.object(
            recommendation_service, "_get_user_history", return_value=[]
        ):
            # Mock popularity-based recommendations
            expected_recommendations = [
                ProductRecommendation(
                    product_id="prod-1",
                    score=0.9,
                    reason="Produit populaire (10 commandes récentes)",
                    confidence=0.85,
                )
            ]
            with patch.object(
                recommendation_service,
                "_popularity_based_recommendations",
                return_value=expected_recommendations,
            ):
                result = await recommendation_service.get_personalized_recommendations(
                    request
                )

                assert result.success is True
                assert result.strategy_used == "popularity_based"
                assert len(result.recommendations) == 1
                assert result.total == 1

    @pytest.mark.asyncio
    async def test_get_personalized_recommendations_existing_user(
        self, recommendation_service
    ):
        """Test personalized recommendations for user with history"""
        request = PersonalizedRecommendationRequest(
            user_id="user-123",
            limit=10,
            context="homepage",
        )

        # Mock user with 5 purchases
        mock_history = [
            {
                "product_id": f"prod-{i}",
                "product_name": f"Product {i}",
                "category_id": "cat-electronics",
                "price": 100.0,
                "created_at": datetime.now(),
            }
            for i in range(5)
        ]

        with patch.object(
            recommendation_service, "_get_user_history", return_value=mock_history
        ):
            # Mock collaborative filtering
            expected_recommendations = [
                ProductRecommendation(
                    product_id="recommended-1",
                    score=0.85,
                    reason="Aimé par des utilisateurs similaires (5 achats)",
                    confidence=0.8,
                )
            ]
            with patch.object(
                recommendation_service,
                "_collaborative_filtering_recommendations",
                return_value=expected_recommendations,
            ):
                result = await recommendation_service.get_personalized_recommendations(
                    request
                )

                assert result.success is True
                assert result.strategy_used == "collaborative_filtering"
                assert len(result.recommendations) >= 1

    @pytest.mark.asyncio
    async def test_get_similar_products_success(self, recommendation_service):
        """Test getting similar products for a valid product"""
        request = SimilarProductsRequest(product_id="product-123", limit=5)

        # Mock base product
        mock_product = {
            "id": "product-123",
            "name": "Laptop",
            "category_id": "electronics",
            "price": 800.0,
            "stock": 10,
            "specifications": {},
        }

        # Mock similar products
        mock_similar = [
            ProductRecommendation(
                product_id="product-456",
                score=0.9,
                reason="Même catégorie et prix similaire",
                confidence=0.8,
            )
        ]

        with patch.object(
            recommendation_service, "_get_product_details", return_value=mock_product
        ):
            with patch.object(
                recommendation_service,
                "_find_similar_products",
                return_value=mock_similar,
            ):
                result = await recommendation_service.get_similar_products(request)

                assert result.success is True
                assert result.strategy_used == "content_similarity"
                assert len(result.recommendations) == 1

    @pytest.mark.asyncio
    async def test_get_similar_products_not_found(self, recommendation_service):
        """Test similar products when base product doesn't exist"""
        request = SimilarProductsRequest(product_id="non-existent", limit=5)

        with patch.object(
            recommendation_service, "_get_product_details", return_value=None
        ):
            result = await recommendation_service.get_similar_products(request)

            assert result.success is False
            assert result.strategy_used == "product_not_found"
            assert len(result.recommendations) == 0

    @pytest.mark.asyncio
    async def test_get_popular_products(self, recommendation_service):
        """Test getting popular/trending products"""
        mock_popular = [
            ProductRecommendation(
                product_id=f"prod-{i}",
                score=0.9 - (i * 0.1),
                reason=f"Produit populaire ({10 - i} commandes récentes)",
                confidence=0.85,
            )
            for i in range(5)
        ]

        with patch.object(
            recommendation_service,
            "_popularity_based_recommendations",
            return_value=mock_popular,
        ):
            result = await recommendation_service.get_popular_products(
                limit=5, time_window_days=30
            )

            assert result.success is True
            assert result.strategy_used == "popularity"
            assert len(result.recommendations) == 5
            # Scores should be in descending order
            scores = [rec.score for rec in result.recommendations]
            assert scores == sorted(scores, reverse=True)

    def test_personalized_recommendation_request_validation(self):
        """Test request validation for personalized recommendations"""
        # Valid request
        valid_request = PersonalizedRecommendationRequest(
            user_id="user-123", limit=10, context="homepage"
        )
        assert valid_request.limit == 10
        assert valid_request.context == "homepage"

        # Invalid context should default to homepage
        request_invalid_context = PersonalizedRecommendationRequest(
            user_id="user-123", context="invalid_context"
        )
        assert request_invalid_context.context == "homepage"

        # Limit should be within bounds
        with pytest.raises(Exception):
            PersonalizedRecommendationRequest(user_id="user-123", limit=100)  # > 50

    def test_similar_products_request_validation(self):
        """Test request validation for similar products"""
        # Valid request
        valid_request = SimilarProductsRequest(product_id="prod-123", limit=10)
        assert valid_request.limit == 10

        # Limit should be within bounds
        with pytest.raises(Exception):
            SimilarProductsRequest(product_id="prod-123", limit=0)  # < 1

    def test_product_recommendation_score_bounds(self):
        """Test that recommendation scores are properly bounded"""
        # Valid score
        rec = ProductRecommendation(
            product_id="prod-1", score=0.5, reason="Test", confidence=0.7
        )
        assert 0 <= rec.score <= 1
        assert 0 <= rec.confidence <= 1

        # Invalid score should raise error
        with pytest.raises(Exception):
            ProductRecommendation(
                product_id="prod-1", score=1.5, reason="Test"  # > 1
            )

        with pytest.raises(Exception):
            ProductRecommendation(
                product_id="prod-1", score=-0.1, reason="Test"  # < 0
            )


class TestRecommendationStrategies:
    """Test individual recommendation strategies"""

    @pytest.mark.asyncio
    async def test_collaborative_filtering_strategy(self, recommendation_service):
        """Test collaborative filtering strategy"""
        mock_db = Mock()
        user_id = "user-123"
        user_history = [
            {
                "product_id": f"prod-{i}",
                "product_name": f"Product {i}",
                "category_id": "electronics",
                "price": 100.0,
            }
            for i in range(3)
        ]

        # Mock database responses
        mock_db.execute = Mock()
        mock_db.execute.return_value.fetchall = Mock(
            side_effect=[
                [("similar-user-1", 2)],  # Similar users
                [
                    ("rec-prod-1", "Recommended Product", 5, 120.0)
                ],  # Recommended products
            ]
        )

        result = await recommendation_service._collaborative_filtering_recommendations(
            mock_db, user_id, user_history, limit=10, exclude_ids=[]
        )

        assert isinstance(result, list)
        if len(result) > 0:
            assert all(isinstance(rec, ProductRecommendation) for rec in result)
            assert all(0 <= rec.score <= 1 for rec in result)

    @pytest.mark.asyncio
    async def test_content_based_strategy(self, recommendation_service):
        """Test content-based recommendation strategy"""
        mock_db = Mock()
        user_history = [
            {
                "product_id": "prod-1",
                "category_id": "electronics",
                "price": 100.0,
            },
            {
                "product_id": "prod-2",
                "category_id": "electronics",
                "price": 120.0,
            },
        ]

        # Mock database response
        mock_db.execute = Mock()
        mock_db.execute.return_value.fetchall = Mock(
            return_value=[("rec-prod-1", "Product", "electronics", 110.0)]
        )

        result = await recommendation_service._content_based_recommendations(
            mock_db, user_history, limit=10, exclude_ids=[]
        )

        assert isinstance(result, list)
        if len(result) > 0:
            assert all(isinstance(rec, ProductRecommendation) for rec in result)

    @pytest.mark.asyncio
    async def test_popularity_based_strategy(self, recommendation_service):
        """Test popularity-based recommendation strategy"""
        mock_db = Mock()

        # Mock database response with popular products
        mock_db.execute = Mock()
        mock_db.execute.return_value.fetchall = Mock(
            return_value=[
                ("prod-1", "Product 1", 10, 50),
                ("prod-2", "Product 2", 8, 40),
                ("prod-3", "Product 3", 5, 25),
            ]
        )

        result = await recommendation_service._popularity_based_recommendations(
            mock_db, limit=10, exclude_ids=[], time_window_days=30
        )

        assert isinstance(result, list)
        if len(result) > 0:
            assert all(isinstance(rec, ProductRecommendation) for rec in result)
            # Scores should be normalized and descending
            scores = [rec.score for rec in result]
            assert all(0 <= score <= 1 for score in scores)


class TestRecommendationResponse:
    """Test recommendation response structure"""

    def test_recommendation_response_structure(self):
        """Test that response has correct structure"""
        recommendations = [
            ProductRecommendation(
                product_id="prod-1", score=0.9, reason="Test", confidence=0.8
            )
        ]

        response = RecommendationResponse(
            success=True,
            recommendations=recommendations,
            strategy_used="collaborative_filtering",
            total=1,
            processing_time_ms=15.5,
        )

        assert response.success is True
        assert len(response.recommendations) == 1
        assert response.total == 1
        assert response.processing_time_ms == 15.5
        assert response.strategy_used == "collaborative_filtering"
        assert isinstance(response.timestamp, datetime)

    def test_empty_recommendation_response(self):
        """Test response with no recommendations"""
        response = RecommendationResponse(
            success=False, recommendations=[], strategy_used="fallback_error", total=0
        )

        assert response.success is False
        assert len(response.recommendations) == 0
        assert response.total == 0
