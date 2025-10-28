"""
LLM Service - Groq Integration
Provides intelligent responses using Groq's fast LLM API
"""
import logging
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class LLMService:
    """
    Service for LLM-powered responses using Groq
    Falls back to rule-based responses if LLM fails
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.groq.com/openai/v1"
        self.enabled = bool(api_key)
        
        if not self.enabled:
            logger.warning("LLM Service disabled - no API key provided")
        else:
            logger.info(f"LLM Service initialized with model: {model}")
    
    async def generate_response(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        user_role: Optional[str] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> Optional[str]:
        """
        Generate a response using Groq LLM
        
        Args:
            message: User message
            context: Additional context (entities, intent, etc.)
            user_role: User role (CLIENT, TRANSPORTEUR, AFFRETEUR)
            conversation_history: Recent conversation messages
            
        Returns:
            Generated response or None if failed
        """
        if not self.enabled:
            return None
        
        try:
            # Build system prompt
            system_prompt = self._build_system_prompt(user_role, context)
            
            # Build messages
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history (last 5 messages)
            if conversation_history:
                for msg in conversation_history[-5:]:
                    role = "assistant" if msg.get("role") == "bot" else "user"
                    messages.append({
                        "role": role,
                        "content": msg.get("message", "")
                    })
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Call Groq API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 500,
                        "top_p": 0.9
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    generated_text = data["choices"][0]["message"]["content"]
                    logger.info(f"LLM response generated successfully")
                    return generated_text.strip()
                else:
                    logger.error(f"Groq API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return None
    
    def _build_system_prompt(self, user_role: Optional[str], context: Optional[Dict[str, Any]]) -> str:
        """Build system prompt based on user role and context"""
        
        base_prompt = """Tu es l'assistant virtuel intelligent de TSA Logistique, la plateforme leader de transport et logistique au Cameroun.

🎯 TON RÔLE :
- Assister les utilisateurs avec précision et professionnalisme
- Fournir des informations concrètes et actionnables
- Guider vers les bonnes fonctionnalités de la plateforme
- Être chaleureux mais efficace

📋 SERVICES TSA :
1. Transport de marchandises (fret routier)
   - Connexion transporteurs ↔ affréteurs
   - Suivi GPS en temps réel
   - Pricing dynamique basé sur l'IA
   
2. Marketplace de pièces détachées reconditionnées
   - Moteurs, boîtes de vitesses, systèmes de freinage
   - Recherche par photo (IA vision)
   - Marques : Volvo, Mercedes, Scania, MAN, Renault

3. Gestion de missions
   - Création et suivi de missions
   - Matching automatique transporteur/mission
   - Paiement sécurisé

🌍 ZONES COUVERTES :
- Douala (hub principal)
- Yaoundé (capitale)
- Bafoussam, Garoua, Bamenda, Limbé
- Routes inter-villes optimisées

💰 TARIFICATION :
- Monnaie : FCFA (Franc CFA)
- Pricing dynamique basé sur : distance, poids, urgence, disponibilité
- Fourchette de négociation transparente
- Exemples de tarifs :
  * Douala → Yaoundé (250km, 500kg) : ~125,000 FCFA
  * Yaoundé → Bafoussam (280km, 1T) : ~180,000 FCFA

👥 TYPES D'UTILISATEURS :
- CLIENT : Expéditeur de marchandises, acheteur de pièces
- TRANSPORTEUR : Propriétaire de camions, cherche missions
- AFFRETEUR : Organisateur de transport, crée missions

📱 STYLE DE RÉPONSE :
- Concis (2-3 phrases max)
- Emojis pertinents (🚚 📦 💰 🔧 📍 ⏱️)
- Chiffres précis quand disponibles
- Toujours proposer une action concrète
- Français professionnel mais accessible

⚠️ IMPORTANT :
- Si tu ne sais pas, dis-le honnêtement
- Redirige vers un humain pour les cas complexes
- Ne jamais inventer de données (prix, tracking, etc.)
- Utilise les données fournies dans le contexte
"""
        
        # Add role-specific context
        if user_role == "TRANSPORTEUR":
            base_prompt += "\nL'utilisateur est un TRANSPORTEUR. Focus sur : missions disponibles, gains, optimisation de trajets."
        elif user_role == "AFFRETEUR":
            base_prompt += "\nL'utilisateur est un AFFRÉTEUR. Focus sur : création de missions, suivi, tarification."
        elif user_role == "CLIENT":
            base_prompt += "\nL'utilisateur est un CLIENT. Focus sur : suivi de colis, achat de pièces, support."
        
        # Add detected context
        if context:
            intent = context.get("intent")
            entities = context.get("entities", {})
            
            if intent:
                base_prompt += f"\n\nIntent détecté : {intent}"
            if entities:
                base_prompt += f"\nEntités extraites : {entities}"
        
        base_prompt += "\n\nRéponds de manière naturelle et utile à la question de l'utilisateur."
        
        return base_prompt
    
    async def should_use_llm(
        self,
        intent: str,
        confidence: float,
        message: str
    ) -> bool:
        """
        Decide if LLM should be used based on intent and confidence
        
        Use LLM for:
        - Unknown intents (confidence < 0.6)
        - Complex questions
        - Conversational queries
        
        Use rules for:
        - High confidence intents (tracking, pricing, etc.)
        - Simple structured queries
        """
        if not self.enabled:
            return False
        
        # Use LLM for low confidence
        if confidence < 0.6:
            return True
        
        # Use LLM for unknown intent
        if intent == "unknown":
            return True
        
        # Use LLM for complex conversational messages
        conversational_keywords = [
            "pourquoi", "comment", "explique", "différence", "conseil",
            "recommande", "meilleur", "opinion", "penses-tu", "aide-moi"
        ]
        
        message_lower = message.lower()
        if any(keyword in message_lower for keyword in conversational_keywords):
            return True
        
        # Use rules for high-confidence structured intents
        return False


# Singleton instance
_llm_service: Optional[LLMService] = None


def get_llm_service(api_key: Optional[str] = None, model: str = "llama-3.3-70b-versatile") -> LLMService:
    """Get or create LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService(api_key=api_key, model=model)
    return _llm_service
