# LLM Integration Guide - Groq

## Vue d'ensemble

Le chatbot TSA utilise maintenant **Groq** pour des réponses intelligentes via LLM (Large Language Model).

### Architecture Hybrid

```
User Message
    ↓
Intent Classifier (règles regex)
    ↓
Confidence Check
    ├─ High confidence (>0.6) → Rule-based response (rapide)
    └─ Low confidence (<0.6) → LLM response (intelligent)
```

## Configuration

### 1. Obtenir une clé API Groq (GRATUIT)

1. Aller sur https://console.groq.com
2. Créer un compte (gratuit)
3. Créer une API key
4. Copier la clé

**Limites gratuites :**
- 14,400 requêtes/jour
- Pas de carte bancaire nécessaire
- Pas d'expiration

### 2. Configurer l'environnement

Dans `services/tsa-ai/.env` :

```env
# LLM Configuration (Groq)
GROQ_API_KEY="gsk_your_api_key_here"
LLM_MODEL="llama-3.1-70b-versatile"
LLM_ENABLED=true
```

**Modèles disponibles :**
- `llama-3.1-70b-versatile` (recommandé) - Le plus performant
- `llama-3.1-8b-instant` - Plus rapide, moins précis
- `mixtral-8x7b-32768` - Bon compromis

### 3. Installer les dépendances

```bash
cd services/tsa-ai
pip install -r requirements.txt
```

## Test

### Test rapide du LLM

```bash
cd services/tsa-ai
python test_llm_manual.py
```

Cela teste le LLM sans démarrer le serveur complet.

### Test du chatbot complet

```bash
# Démarrer le serveur
python -m uvicorn app.main:app --reload

# Dans un autre terminal
python test_chatbot_manual.py
```

Ou via curl :

```bash
curl -X POST http://localhost:8000/api/ai/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Pourquoi les prix varient ?",
    "user_id": "test123",
    "user_role": "CLIENT"
  }'
```

## Fonctionnement

### Quand le LLM est utilisé

Le LLM est activé pour :

1. **Faible confiance** (< 0.6)
   - "C'est quoi TSA ?"
   - "Je comprends pas"

2. **Intent inconnu**
   - Questions hors scope des règles

3. **Questions conversationnelles**
   - "Pourquoi..."
   - "Comment..."
   - "Explique-moi..."
   - "Quelle est la différence..."

### Quand les règles sont utilisées

Les règles regex sont utilisées pour :

1. **Haute confiance** (> 0.6)
   - "Où est mon colis #12345 ?"
   - "Prix Douala Yaoundé"

2. **Intents structurés**
   - Tracking
   - Pricing
   - Products

**Avantage :** Réponse instantanée (<50ms) pour 80% des cas

## Personnalisation

### Modifier le prompt système

Dans `app/services/llm_service.py`, méthode `_build_system_prompt()` :

```python
base_prompt = """Tu es l'assistant virtuel de TSA Logistique...

Ajoute tes instructions ici
"""
```

### Ajuster la température

Dans `app/services/llm_service.py`, méthode `generate_response()` :

```python
"temperature": 0.7,  # 0.0 = déterministe, 1.0 = créatif
"max_tokens": 500,   # Longueur max de la réponse
```

### Changer les critères d'utilisation du LLM

Dans `app/services/llm_service.py`, méthode `should_use_llm()` :

```python
# Utiliser LLM pour confiance < 0.7 au lieu de 0.6
if confidence < 0.7:
    return True
```

## Monitoring

### Logs

Le service log automatiquement :

```
INFO - LLM Service initialized with model: llama-3.1-70b-versatile
INFO - Using LLM for response generation
INFO - LLM response generated successfully
WARNING - LLM failed, falling back to rule-based response
```

### Métriques à surveiller

- Taux d'utilisation LLM vs règles
- Temps de réponse LLM
- Taux d'erreur LLM
- Nombre de requêtes/jour (limite 14,400)

## Désactiver le LLM

Pour revenir au mode règles uniquement :

```env
LLM_ENABLED=false
```

Ou supprimer la clé API :

```env
GROQ_API_KEY=""
```

Le chatbot fonctionnera normalement avec les règles regex.

## Coûts

**Groq (gratuit) :**
- 14,400 requêtes/jour
- Suffisant pour contest + démos
- Pas de carte bancaire

**Si dépassement (peu probable) :**
- Passer à un plan payant (~0.0001$/requête)
- Ou utiliser un autre provider (OpenAI, Mistral)

## Changer de provider

Le code est conçu pour être flexible. Pour utiliser OpenAI au lieu de Groq :

1. Installer : `pip install openai`
2. Modifier `app/services/llm_service.py` :

```python
from openai import AsyncOpenAI

class LLMService:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)
    
    async def generate_response(self, message: str, ...):
        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[...]
        )
        return response.choices[0].message.content
```

## Troubleshooting

### Erreur : "LLM Service disabled - no API key provided"

→ Ajouter `GROQ_API_KEY` dans `.env`

### Erreur : "Groq API error: 401"

→ Clé API invalide, vérifier sur https://console.groq.com

### Erreur : "Groq API error: 429"

→ Limite de 14,400 requêtes/jour atteinte (très rare)

### Réponses lentes

→ Utiliser un modèle plus rapide : `llama-3.1-8b-instant`

### Réponses pas assez précises

→ Améliorer le prompt système dans `_build_system_prompt()`

## Exemples de réponses

### Avec règles (haute confiance)

```
User: "Où est mon colis #12345 ?"
Bot: "🚚 Colis #12345 est en transit.
     📍 Position actuelle: Douala
     ⏱️ Livraison estimée: 2 heures"
```

### Avec LLM (basse confiance)

```
User: "Pourquoi les prix varient autant ?"
Bot: "Les prix de transport varient selon plusieurs facteurs :
     - Distance (plus c'est loin, plus c'est cher)
     - Poids de la marchandise
     - Urgence de la livraison
     - Disponibilité des transporteurs
     
     Notre système de pricing dynamique ajuste les tarifs en temps réel. 💰"
```

## Prochaines étapes

1. **RAG (Retrieval Augmented Generation)**
   - Indexer vos docs, FAQ, tarifs
   - Le LLM répond avec vos vraies données

2. **Fine-tuning**
   - Entraîner sur vos conversations
   - Vocabulaire spécifique TSA

3. **Multi-modal**
   - Intégrer avec vision service
   - "Montre-moi cette pièce" + image

4. **Agents autonomes**
   - Le bot peut créer des missions
   - Appeler les services automatiquement
