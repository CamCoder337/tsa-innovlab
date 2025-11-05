"""
Intelligent Chatbot API Endpoints
LLM-First architecture with function calling
"""
import logging
import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.chatbot import ChatbotQueryRequest, ChatbotResponse
from app.services.intelligent_chatbot_service import get_intelligent_chatbot, IntelligentChatbotService
from app.core.dependencies import get_user_from_header
from app.core.metrics import chatbot_queries_total, chatbot_query_duration

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/query", response_model=ChatbotResponse)
async def intelligent_chatbot_query(
    request: ChatbotQueryRequest,
    chatbot: IntelligentChatbotService = Depends(get_intelligent_chatbot)
):
    """
    Process chatbot query with intelligent LLM-first approach
    
    Features:
    - LLM analyzes message and decides actions
    - Function calling for real data (tracking, pricing, products, missions)
    - Context-aware responses
    - Personalized suggestions
    
    Example:
    ```json
    {
      "message": "Combien coûte un transport de Douala à Yaoundé pour 500kg ?",
      "user_id": "399f2fb8-06d8-4ab1-be99-a56cfb1d0907",
      "user_role": "affreteur"
    }
    ```
    
    Response:
    ```json
    {
      "message": "💰 Pour un transport Douala → Yaoundé (250km, 500kg):\n\n**Prix recommandé: 125,000 FCFA**\nFourchette: 118,750 - 131,250 FCFA\n\n✨ Prix optimisé par notre IA de pricing dynamique.",
      "suggestions": ["Créer une mission avec ce prix", "Voir transporteurs disponibles"],
      "requires_human": false
    }
    ```
    """
    start_time = time.time()
    try:
        # ✅ FIX: Utiliser les données du request body (envoyées par le monolithe)
        # au lieu de get_user_from_header qui retourne un mock user en dev
        user_id = request.user_id
        user_role = request.user_role

        logger.info(f"Intelligent chatbot query from {user_id} ({user_role}): {request.message[:50]}...")

        response = await chatbot.process_message(
            message=request.message,
            user_id=user_id,
            user_role=user_role,
            user_token=request.user_token,
            conversation_id=request.conversation_id,
            context=request.context
        )

        # Track metrics
        chatbot_queries_total.labels(version='v2', status='success').inc()
        chatbot_query_duration.observe(time.time() - start_time)

        return ChatbotResponse(**response)

    except Exception as e:
        logger.error(f"Error in intelligent chatbot: {e}", exc_info=True)
        chatbot_queries_total.labels(version='v2', status='error').inc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chatbot query: {str(e)}"
        )


@router.get("/health")
async def intelligent_chatbot_health():
    """Health check for intelligent chatbot"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "architecture": "LLM-First with Function Calling",
        "features": [
            "Real-time tracking",
            "Dynamic pricing",
            "Product search",
            "Mission management",
            "Personalized recommendations"
        ]
    }


@router.get("/metrics")
async def intelligent_chatbot_metrics():
    """Get chatbot metrics and statistics"""
    try:
        from app.services.chatbot_metrics import get_metrics
        metrics = get_metrics()
        stats = await metrics.get_stats()
        
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@router.post("/v4/query", response_model=ChatbotResponse)
async def intelligent_chatbot_v4_query(
    request: ChatbotQueryRequest
):
    """
    Chatbot V4 - Layered Architecture (3 Levels)
    
    Improvements over V3:
    - 3-level processing: Quick (<100ms), Contextual (<500ms), Deep (<2s)
    - Conversational responses with real data
    - Optimized context loading per level
    - Performance monitoring and warnings
    
    Example:
    ```json
    {
      "message": "Quelles sont mes missions ?",
      "user_id": "399f2fb8-06d8-4ab1-be99-a56cfb1d0907",
      "user_role": "affreteur"
    }
    ```
    
    Response:
    ```json
    {
      "message": "Vous avez 3 missions actives ! La plus récente est Douala-Yaoundé avec 2 propositions 🚚...",
      "navigation": {
        "path": "/affreteur/missions",
        "description": "Mes Missions"
      },
      "processing_level": "contextual",
      "suggestions": ["Créer une mission", "Calculer un prix"]
    }
    ```
    """
    try:
        from app.services.intelligent_chatbot_v4_service import get_intelligent_chatbot_v4
        
        chatbot_v4 = get_intelligent_chatbot_v4()
        
        logger.info(f"[V4] Chatbot query from {request.user_id} ({request.user_role}): {request.message[:50]}...")
        
        response = await chatbot_v4.process_message(
            message=request.message,
            user_id=request.user_id,
            user_role=request.user_role,
            user_token=request.user_token,
            conversation_id=request.conversation_id,
            context=request.context
        )
        
        return ChatbotResponse(**response)
        
    except Exception as e:
        logger.error(f"[V4] Error in chatbot: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chatbot query: {str(e)}"
        )


@router.post("/v3/query", response_model=ChatbotResponse)
async def intelligent_chatbot_v3_query(
    request: ChatbotQueryRequest
):
    """
    Chatbot V3 - Intent-First Architecture (Legacy)
    
    Improvements over V2:
    - Intent detection first (what does the user want?)
    - Smart routing: Navigate to frontend OR call functions
    - No technical code in responses
    - Better UX with frontend-oriented guidance
    
    Example:
    ```json
    {
      "message": "Quelles sont mes missions publiées ?",
      "user_id": "399f2fb8-06d8-4ab1-be99-a56cfb1d0907",
      "user_role": "affreteur"
    }
    ```
    
    Response:
    ```json
    {
      "message": "📋 Pour voir toutes vos missions publiées, rendez-vous dans **Mes Missions**...",
      "navigation": {
        "path": "/affreteur/missions",
        "description": "Mes Missions",
        "filters": {"status": "published"}
      },
      "suggestions": ["Créer une mission", "Calculer un prix"]
    }
    ```
    """
    try:
        from app.services.intelligent_chatbot_v3_service import get_intelligent_chatbot_v3
        
        chatbot_v3 = get_intelligent_chatbot_v3()
        
        logger.info(f"[V3] Chatbot query from {request.user_id} ({request.user_role}): {request.message[:50]}...")
        
        response = await chatbot_v3.process_message(
            message=request.message,
            user_id=request.user_id,
            user_role=request.user_role,
            user_token=request.user_token,
            conversation_id=request.conversation_id,
            context=request.context
        )
        
        return ChatbotResponse(**response)
        
    except Exception as e:
        logger.error(f"[V3] Error in chatbot: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chatbot query: {str(e)}"
        )
