"""
Tests for Chatbot Streaming (SSE)
"""
import pytest
import asyncio
from httpx import AsyncClient
from app.main import app


class TestChatbotStreaming:
    """Test chatbot streaming functionality"""
    
    @pytest.mark.asyncio
    async def test_streaming_endpoint_exists(self):
        """Test that streaming endpoint is accessible"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/ai/chatbot/query/stream",
                json={
                    "message": "Bonjour",
                    "user_id": "test_user_123",
                    "user_role": "CLIENT"
                }
            )
            
            # Should return 200 with SSE content type
            assert response.status_code == 200
            assert "text/event-stream" in response.headers.get("content-type", "")
    
    @pytest.mark.asyncio
    async def test_streaming_response_format(self):
        """Test that streaming returns proper SSE format"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            async with client.stream(
                "POST",
                "/api/ai/chatbot/query/stream",
                json={
                    "message": "Combien coûte Douala → Yaoundé ?",
                    "user_id": "test_user_123",
                    "user_role": "AFFRETEUR"
                }
            ) as response:
                assert response.status_code == 200
                
                events = []
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        import json
                        data = json.loads(line[6:])
                        events.append(data)
                
                # Should have at least start, chunks, and done events
                assert len(events) > 0
                
                # First event should be 'start'
                assert events[0]["type"] == "start"
                
                # Last event should be 'done'
                assert events[-1]["type"] == "done"
                
                # Should have suggestions
                assert "suggestions" in events[-1]
                assert isinstance(events[-1]["suggestions"], list)
    
    @pytest.mark.asyncio
    async def test_streaming_vs_normal_performance(self):
        """Compare streaming vs normal endpoint performance"""
        import time
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Test normal endpoint
            start_normal = time.time()
            response_normal = await client.post(
                "/api/ai/chatbot/query",
                json={
                    "message": "Prix Douala Yaoundé 500kg",
                    "user_id": "test_user_123",
                    "user_role": "AFFRETEUR"
                }
            )
            time_normal = (time.time() - start_normal) * 1000
            
            # Test streaming endpoint (time to first chunk)
            start_stream = time.time()
            first_chunk_time = None
            
            async with client.stream(
                "POST",
                "/api/ai/chatbot/query/stream",
                json={
                    "message": "Prix Douala Yaoundé 500kg",
                    "user_id": "test_user_123",
                    "user_role": "AFFRETEUR"
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: ") and first_chunk_time is None:
                        import json
                        data = json.loads(line[6:])
                        if data["type"] == "chunk":
                            first_chunk_time = (time.time() - start_stream) * 1000
                            break
            
            # Streaming should be faster to first response
            print(f"\n📊 Performance Comparison:")
            print(f"   Normal endpoint: {time_normal:.0f}ms")
            print(f"   Streaming (first chunk): {first_chunk_time:.0f}ms")
            print(f"   Improvement: {((time_normal - first_chunk_time) / time_normal * 100):.1f}%")
            
            # First chunk should arrive faster than full response
            assert first_chunk_time < time_normal
    
    @pytest.mark.asyncio
    async def test_streaming_error_handling(self):
        """Test error handling in streaming"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            async with client.stream(
                "POST",
                "/api/ai/chatbot/query/stream",
                json={
                    "message": "",  # Empty message should trigger error
                    "user_id": "test_user_123",
                    "user_role": "CLIENT"
                }
            ) as response:
                events = []
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        import json
                        data = json.loads(line[6:])
                        events.append(data)
                
                # Should have error event
                error_events = [e for e in events if e.get("type") == "error"]
                assert len(error_events) > 0


class TestChatbotUnified:
    """Test unified chatbot endpoint"""
    
    @pytest.mark.asyncio
    async def test_unified_endpoint_simple_query(self):
        """Test unified endpoint with simple query (should use rules)"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/ai/chatbot/query",
                json={
                    "message": "Bonjour",
                    "user_id": "test_user_123",
                    "user_role": "CLIENT"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "message" in data
            assert "suggestions" in data
            assert "processing_time_ms" in data
            
            # Simple greeting should be fast (< 500ms)
            assert data["processing_time_ms"] < 500
    
    @pytest.mark.asyncio
    async def test_unified_endpoint_complex_query(self):
        """Test unified endpoint with complex query (should use LLM)"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/ai/chatbot/query",
                json={
                    "message": "Pourquoi les prix varient-ils autant ?",
                    "user_id": "test_user_123",
                    "user_role": "AFFRETEUR"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "message" in data
            assert len(data["message"]) > 50  # Should have detailed response
    
    @pytest.mark.asyncio
    async def test_unified_endpoint_with_context(self):
        """Test unified endpoint with enriched context"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/ai/chatbot/query",
                json={
                    "message": "Quelles sont mes missions ?",
                    "user_id": "test_user_123",
                    "user_role": "TRANSPORTEUR",
                    "user_token": "Bearer test_token"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "message" in data
            # Should mention missions or provide guidance
            assert any(word in data["message"].lower() for word in ["mission", "disponible", "aucune"])


class TestChatbotHealth:
    """Test chatbot health and metrics"""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        """Test health check endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/ai/chatbot/health")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["status"] == "healthy"
            assert data["version"] == "3.0.0-unified"
            assert "features" in data
            assert "performance" in data
    
    @pytest.mark.asyncio
    async def test_metrics_endpoint(self):
        """Test metrics endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/ai/chatbot/metrics")
            
            assert response.status_code == 200
            data = response.json()
            
            assert "success" in data
            if data["success"]:
                assert "stats" in data


class TestChatbotBackwardCompatibility:
    """Test that old V2 endpoint still works (if needed)"""
    
    @pytest.mark.asyncio
    async def test_v2_endpoint_removed(self):
        """Verify V2 endpoint is removed"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/ai/chatbot/v2/query",
                json={
                    "message": "Test",
                    "user_id": "test_user_123",
                    "user_role": "CLIENT"
                }
            )
            
            # Should return 404 (endpoint removed)
            assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_v3_endpoint_removed(self):
        """Verify V3 endpoint is removed"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/ai/chatbot/v3/query",
                json={
                    "message": "Test",
                    "user_id": "test_user_123",
                    "user_role": "CLIENT"
                }
            )
            
            # Should return 404 (endpoint removed)
            assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_v4_endpoint_removed(self):
        """Verify V4 endpoint is removed"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/ai/chatbot/v4/query",
                json={
                    "message": "Test",
                    "user_id": "test_user_123",
                    "user_role": "CLIENT"
                }
            )
            
            # Should return 404 (endpoint removed)
            assert response.status_code == 404
