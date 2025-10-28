"""
Schemas for Chatbot Service
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class ChatbotQueryRequest(BaseModel):
    """Request schema for chatbot query"""
    message: str = Field(..., min_length=1, max_length=1000, description="User message")
    user_id: str = Field(..., description="User ID from authentication")
    user_role: Optional[str] = Field(None, description="User role (ADMIN, AFFRETEUR, TRANSPORTEUR, CLIENT)")
    user_token: Optional[str] = Field(None, description="JWT token for API calls to monolith")
    conversation_id: Optional[str] = Field(None, description="Conversation ID for context")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context")

    @field_validator('message')
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Validate message is not empty after stripping"""
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()


class Intent(BaseModel):
    """Detected intent"""
    name: str = Field(..., description="Intent name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    entities: Dict[str, Any] = Field(default_factory=dict, description="Extracted entities")


class ChatbotResponse(BaseModel):
    """Response schema for chatbot"""
    message: str = Field(..., description="Bot response message")
    intent: Optional[Intent] = Field(None, description="Detected intent")
    suggestions: List[str] = Field(default_factory=list, description="Suggested follow-up questions")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data (tracking info, pricing, etc.)")
    requires_human: bool = Field(False, description="Whether human support is needed")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Votre colis #12345 est en transit à Douala. Livraison estimée: 2h",
                "intent": {
                    "name": "tracking",
                    "confidence": 0.95,
                    "entities": {"shipment_id": "12345"}
                },
                "suggestions": [
                    "Voir les détails complets",
                    "Contacter le transporteur",
                    "Historique de livraison"
                ],
                "data": {
                    "shipment_id": "12345",
                    "status": "in_transit",
                    "location": "Douala"
                },
                "requires_human": False,
                "timestamp": "2025-01-20T10:30:00Z"
            }
        }
    }


class ChatbotHealthResponse(BaseModel):
    """Health check response for chatbot"""
    status: str
    intents_available: List[str]
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
