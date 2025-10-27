"""
Intent Classification for Chatbot
Uses regex-based pattern matching for MVP
Can be upgraded to ML-based classification later
"""
import re
from typing import Dict, Any, Optional, Tuple, List
from dataclasses import dataclass


@dataclass
class IntentPattern:
    """Pattern definition for intent matching"""
    name: str
    patterns: list[str]
    priority: int = 1  # Higher priority = checked first


@dataclass
class IntentMatch:
    """Represents a matched intent with score"""
    name: str
    confidence: float
    entities: Dict[str, Any]
    match_count: int


class IntentClassifier:
    """
    Simple regex-based intent classifier
    """
    
    def __init__(self):
        self.intents = self._initialize_intents()
    
    def _initialize_intents(self) -> list[IntentPattern]:
        """Initialize intent patterns"""
        return [
            # Tracking intent (highest priority)
            IntentPattern(
                name="tracking",
                patterns=[
                    r"(?:où|ou)\s+(?:est|se trouve)\s+(?:mon|ma|le|la)\s+(?:colis|commande|mission|livraison)",
                    r"(?:suivi|tracking|trace)\s+(?:de\s+)?(?:colis|commande|mission)",
                    r"(?:statut|état)\s+(?:de\s+)?(?:mon|ma|le|la)?\s*(?:colis|commande|mission|livraison)",
                    r"(?:localisation|position)\s+(?:colis|commande)",
                    r"(?:suivi|tracking)\s+(?:de\s+)?(?:commande|colis|mission)\s+\d+",  # "Suivi de commande 456"
                ],
                priority=3
            ),
            
            # Pricing intent
            IntentPattern(
                name="pricing",
                patterns=[
                    r"(?:combien|prix|coût|tarif|coute|coûte)",
                    r"(?:estim|calcul)\w*\s+(?:prix|tarif|coût)",
                    r"(?:de|depuis)\s+[A-Za-zÀ-ÿ]+\s+(?:à|vers|jusqu'à|jusque)\s+[A-Za-zÀ-ÿ]+",  # Origin to destination
                ],
                priority=3  # Same priority as tracking to avoid conflicts
            ),
            
            # Products/Parts search
            IntentPattern(
                name="products",
                patterns=[
                    r"(?:pièce|piece|produit|article)s?\s+(?:pour|de|disponible)",
                    r"(?:cherche|recherche|besoin)\s+(?:pièce|piece|produit)",
                    r"(?:catalogue|stock|inventaire)",
                    r"(?:volvo|mercedes|man|scania|renault|iveco)",  # Truck brands
                ],
                priority=2
            ),
            
            # Mission status
            IntentPattern(
                name="mission_status",
                patterns=[
                    r"(?:mission|course)s?\s+(?:disponible|en cours|terminée)",
                    r"(?:mes|ma)\s+mission",
                    r"(?:accepter|prendre|réclamer)\s+mission",
                ],
                priority=2
            ),
            
            # Help/FAQ
            IntentPattern(
                name="help",
                patterns=[
                    r"(?:aide|help|comment|pourquoi|qu'est-ce)",
                    r"(?:fonctionne|marche|utilise)",
                    r"(?:peux-tu|pouvez-vous|tu peux)",
                ],
                priority=1
            ),
            
            # Greeting
            IntentPattern(
                name="greeting",
                patterns=[
                    r"^(?:bonjour|salut|hello|hi|hey|bonsoir)\b",
                    r"^(?:ça va|comment vas-tu|comment allez-vous)",
                ],
                priority=1
            ),
        ]
    
    def classify(self, message: str) -> Tuple[str, float, Dict[str, Any]]:
        """
        Classify user message into intent
        
        Returns:
            Tuple of (intent_name, confidence, entities)
        """
        message_lower = message.lower().strip()
        
        # Collect all matches with scores
        matches: List[IntentMatch] = []
        
        for intent in self.intents:
            match_count = 0
            for pattern in intent.patterns:
                if re.search(pattern, message_lower, re.IGNORECASE):
                    match_count += 1
            
            if match_count > 0:
                entities = self._extract_entities(message, intent.name)
                confidence = self._calculate_confidence(message, intent.name, entities, match_count)
                matches.append(IntentMatch(
                    name=intent.name,
                    confidence=confidence,
                    entities=entities,
                    match_count=match_count
                ))
        
        # If no matches, return unknown
        if not matches:
            return "unknown", 0.3, {}
        
        # Sort by confidence, then by priority, then by match count
        intent_priority_map = {intent.name: intent.priority for intent in self.intents}
        matches.sort(
            key=lambda m: (m.confidence, intent_priority_map.get(m.name, 0), m.match_count),
            reverse=True
        )
        
        best_match = matches[0]
        return best_match.name, best_match.confidence, best_match.entities
    
    def _extract_entities(self, message: str, intent: str) -> Dict[str, Any]:
        """Extract entities based on intent"""
        entities = {}
        
        if intent == "tracking":
            # Extract shipment/mission ID
            id_match = re.search(r'#?(\d{3,})', message)
            if id_match:
                entities['id'] = id_match.group(1)
        
        elif intent == "pricing":
            # Extract origin and destination
            route_match = re.search(
                r'(?:de|depuis)\s+([A-Za-zÀ-ÿ]+)\s+(?:à|vers|jusqu\'à|jusque)\s+([A-Za-zÀ-ÿ]+)',
                message,
                re.IGNORECASE
            )
            if route_match:
                entities['origin'] = route_match.group(1).capitalize()
                entities['destination'] = route_match.group(2).capitalize()
            
            # Extract weight
            weight_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|tonnes?|t)', message, re.IGNORECASE)
            if weight_match:
                entities['weight'] = float(weight_match.group(1))
        
        elif intent == "products":
            # Extract brand
            brands = ['volvo', 'mercedes', 'man', 'scania', 'renault', 'iveco']
            for brand in brands:
                if brand in message.lower():
                    entities['brand'] = brand.capitalize()
                    break
            
            # Extract category
            categories = ['moteur', 'freins', 'transmission', 'suspension', 'électrique']
            for category in categories:
                if category in message.lower():
                    entities['category'] = category
                    break
        
        return entities
    
    def _calculate_confidence(
        self,
        message: str,
        intent: str,
        entities: Dict[str, Any],
        match_count: int
    ) -> float:
        """
        Calculate confidence score based on:
        - Pattern match strength
        - Number of entities extracted
        - Message clarity
        - Number of patterns matched
        """
        base_confidence = 0.6
        
        # Boost for multiple pattern matches
        base_confidence += 0.1 * min(match_count - 1, 2)
        
        # Boost confidence if entities were extracted
        if entities:
            base_confidence += 0.1 * min(len(entities), 3)
        
        # Boost for specific keywords
        keyword_boost = {
            "tracking": ["suivi", "tracking", "où", "statut", "colis"],
            "pricing": ["prix", "coût", "tarif", "combien"],
            "products": ["pièce", "produit", "catalogue"],
        }
        
        if intent in keyword_boost:
            keywords_found = sum(1 for kw in keyword_boost[intent] if kw in message.lower())
            base_confidence += 0.05 * keywords_found
        
        # Cap at 0.95 (never 100% certain with regex)
        return min(base_confidence, 0.95)
