"""
Chatbot API Endpoints
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status

from app.schemas.chatbot import (
    ChatbotQueryRequest,
    ChatbotResponse,
    ChatbotHealthResponse
)
from app.services.chatbot_function_calling_service import get_chatbot_function_calling, ChatbotFunctionCallingService
from app.core.dependencies import get_user_from_header

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/query", response_model=ChatbotResponse)
async def chatbot_query(
    request: ChatbotQueryRequest,
    chatbot_fc: ChatbotFunctionCallingService = Depends(get_chatbot_function_calling),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Process chatbot query (Migrated to V2 Agentic Engine)
    
    This endpoint now uses the Function Calling engine for:
    - Natural conversation flow
    - Dynamic tool usage
    - Ambiguity handling
    """
    try:
        # Use user from headers if available, otherwise from request body
        user_id = user.get('id') if user else request.user_id
        user_role = user.get('role') if user else request.user_role
        
        logger.info(f"Processing chatbot query from user {user_id} (V2 Engine): {request.message[:50]}...")
        
        response = await chatbot_fc.process_message(
            message=request.message,
            user_id=user_id,
            user_role=user_role,
            user_token=request.user_token,
            conversation_id=request.conversation_id,
            context=request.context
        )
        
        return ChatbotResponse(**response)
        
    except Exception as e:
        logger.error(f"Error processing chatbot query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chatbot query: {str(e)}"
        )


@router.get("/health", response_model=ChatbotHealthResponse)
async def chatbot_health():
    """
    Chatbot health check
    """
    return ChatbotHealthResponse(
        status="healthy",
        intents_available=[
            "tracking",
            "pricing",
            "products",
            "mission_status",
            "help",
            "greeting"
        ],
        version="1.0.0"
    )


@router.get("/history/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    chatbot_fc: ChatbotFunctionCallingService = Depends(get_chatbot_function_calling),
    user: Optional[dict] = Depends(get_user_from_header)
):
    """
    Get conversation history
    
    Note: In production, add proper authorization to ensure users
    can only access their own conversation history
    """
    try:
        history = chatbot_fc.get_history(conversation_id)
        return {
            "conversation_id": conversation_id,
            "messages": history,
            "count": len(history)
        }
    except Exception as e:
        logger.error(f"Error fetching conversation history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversation history: {str(e)}"
        )
