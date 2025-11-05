"""
Chatbot Metrics Service
Simple metrics collection for monitoring chatbot performance
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class ChatbotMetrics:
    """Simple metrics collector for chatbot"""
    
    def __init__(self):
        self.redis_client = None
        try:
            from app.services.chatbot_service import get_redis_client
            self.redis_client = get_redis_client()
        except Exception as e:
            logger.warning(f"Redis not available for metrics: {e}")
    
    async def log_interaction(
        self,
        user_id: str,
        user_role: Optional[str],
        message: str,
        function_called: Optional[str],
        response_time_ms: float,
        success: bool,
        requires_human: bool,
        error: Optional[str] = None
    ):
        """Log a chatbot interaction for metrics"""
        try:
            metric = {
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "user_role": user_role,
                "message_length": len(message),
                "function_called": function_called,
                "response_time_ms": response_time_ms,
                "success": success,
                "requires_human": requires_human,
                "error": error
            }
            
            # Log to file
            logger.info(f"CHATBOT_METRIC: {json.dumps(metric)}")
            
            # Store in Redis if available
            if self.redis_client:
                key = f"chatbot_metrics:{datetime.utcnow().strftime('%Y-%m-%d')}"
                self.redis_client.lpush(key, json.dumps(metric))
                self.redis_client.expire(key, 86400 * 7)  # Keep 7 days
                
                # Increment counters
                self._increment_counter("total_queries")
                if success:
                    self._increment_counter("successful_queries")
                if requires_human:
                    self._increment_counter("human_required")
                if function_called:
                    self._increment_counter(f"function_{function_called}")
                
        except Exception as e:
            logger.error(f"Error logging metrics: {e}")
    
    def _increment_counter(self, counter_name: str):
        """Increment a counter in Redis"""
        if self.redis_client:
            try:
                key = f"chatbot_counter:{counter_name}"
                self.redis_client.incr(key)
                self.redis_client.expire(key, 86400 * 30)  # Keep 30 days
            except Exception as e:
                logger.error(f"Error incrementing counter {counter_name}: {e}")
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get chatbot statistics"""
        if not self.redis_client:
            return {"error": "Redis not available"}
        
        try:
            total = int(self.redis_client.get("chatbot_counter:total_queries") or 0)
            successful = int(self.redis_client.get("chatbot_counter:successful_queries") or 0)
            human_required = int(self.redis_client.get("chatbot_counter:human_required") or 0)
            
            # Get function call counts
            function_counts = {}
            for func in ["track_shipment", "calculate_price", "search_products", 
                        "get_user_missions", "create_mission", "claim_mission"]:
                count = int(self.redis_client.get(f"chatbot_counter:function_{func}") or 0)
                if count > 0:
                    function_counts[func] = count
            
            return {
                "total_queries": total,
                "successful_queries": successful,
                "success_rate": round(successful / total * 100, 2) if total > 0 else 0,
                "human_required": human_required,
                "human_required_rate": round(human_required / total * 100, 2) if total > 0 else 0,
                "function_calls": function_counts
            }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {"error": str(e)}


# Singleton
_metrics: Optional[ChatbotMetrics] = None


def get_metrics() -> ChatbotMetrics:
    """Get or create metrics instance"""
    global _metrics
    if _metrics is None:
        _metrics = ChatbotMetrics()
    return _metrics
