# Chatbot Service Documentation

## Vue d'ensemble

Le service de chatbot TSA fournit une assistance automatisée pour les utilisateurs via détection d'intents et génération de réponses contextuelles.

## Architecture

```
User → tsa-monolith WebSocket → HTTP POST → tsa-ai/chatbot → Response
```

### Composants

1. **Intent Classifier** (`app/utils/intent_classifier.py`)
   - Détection d'intents basée sur regex
   - Extraction d'entités (IDs, villes, poids, marques)
   - Calcul de score de confiance

2. **Chatbot Service** (`app/services/chatbot_service.py`)
   - Orchestration des intents
   - Génération de réponses
   - Gestion de l'historique de conversation
   - Intégration avec les autres services

3. **API Endpoints** (`app/endpoints/chatbot.py`)
   - `POST /api/ai/chatbot/query` - Traiter une requête
   - `GET /api/ai/chatbot/health` - Health check
   - `GET /api/ai/chatbot/history/{conversation_id}` - Historique

## Intents supportés

### 1. Tracking
**Déclencheurs :** "où est mon colis", "suivi", "statut", "#12345"

**Entités extraites :**
- `id` : Numéro de colis/mission

**Exemple :**
```
User: "Où est mon colis #12345?"
Bot: "🚚 Colis #12345 est en transit.
     📍 Position actuelle: Douala
     ⏱️ Livraison estimée: 2 heures"
```

### 2. Pricing
**Déclencheurs :** "combien", "prix", "tarif", "de X à Y"

**Entités extraites :**
- `origin` : Ville de départ
- `destination` : Ville d'arrivée
- `weight` : Poids en kg

**Exemple :**
```
User: "Combien coûte de Douala à Yaoundé pour 500kg?"
Bot: "💰 Estimation de prix:
     📍 Douala → Yaoundé
     📦 Poids: 500kg
     💵 Prix: 125,000 FCFA"
```

### 3. Products
**Déclencheurs :** "pièce", "produit", "catalogue", marques (Volvo, Mercedes, etc.)

**Entités extraites :**
- `brand` : Marque de camion
- `category` : Catégorie de pièce

**Exemple :**
```
User: "Pièces moteur pour Volvo"
Bot: "🔧 Recherche de pièces reconditionnées
     🔍 Filtres: Marque: Volvo | Catégorie: moteur
     
     Voici quelques résultats:
     1. Moteur Volvo D13 - 450,000 FCFA"
```

### 4. Mission Status
**Déclencheurs :** "mission", "course", "disponible"

**Comportement selon rôle :**
- **TRANSPORTEUR** : Liste des missions disponibles
- **AFFRETEUR** : Statut de ses missions
- **CLIENT** : Message d'information

### 5. Help
**Déclencheurs :** "aide", "help", "comment", "qu'est-ce"

**Réponse :** Liste des capacités du bot

### 6. Greeting
**Déclencheurs :** "bonjour", "salut", "hello"

**Réponse :** Message de bienvenue

## Intégration avec tsa-monolith

### Modification du WebSocket handler

Dans `services/tsa-monolith/app/services/websocket_service.ts` :

```typescript
import axios from 'axios'

// Dans le handler de messages
ws.on('message', async (message: Buffer) => {
  const msg = message.toString()
  
  // Détecter les commandes bot
  if (msg.startsWith('/bot ') || msg.startsWith('@bot ')) {
    const userMessage = msg.replace(/^\/(bot|@bot)\s+/, '')
    
    try {
      // Appeler le service chatbot
      const response = await axios.post(
        'http://tsa-ai:8000/api/ai/chatbot/query',
        {
          message: userMessage,
          user_id: user.id,
          user_role: user.role,
          conversation_id: conversationId,
          context: {}
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id,
            'X-User-Email': user.email,
            'X-User-Role': user.role
          }
        }
      )
      
      // Envoyer la réponse du bot
      ws.send(JSON.stringify({
        type: 'bot_response',
        message: response.data.message,
        intent: response.data.intent,
        suggestions: response.data.suggestions,
        data: response.data.data,
        timestamp: new Date().toISOString()
      }))
      
    } catch (error) {
      console.error('Chatbot error:', error)
      ws.send(JSON.stringify({
        type: 'bot_error',
        message: 'Désolé, le bot est temporairement indisponible.',
        timestamp: new Date().toISOString()
      }))
    }
  }
  
  // Gérer les messages normaux...
})
```

### Alternative : Route HTTP dédiée

Si vous préférez ne pas modifier le WebSocket, créez une route HTTP :

```typescript
// Dans routes.ts
router.post('/api/common/chatbot', async ({ request, auth }) => {
  const user = auth.getUserOrFail()
  const { message, conversation_id } = request.body()
  
  const response = await axios.post(
    'http://tsa-ai:8000/api/ai/chatbot/query',
    {
      message,
      user_id: user.id,
      user_role: user.role,
      conversation_id
    }
  )
  
  return response.data
})
```

## Configuration

### Variables d'environnement

Dans `services/tsa-ai/.env` :

```env
# URL du monolithe pour callbacks
MONOLITH_API_URL=http://localhost:3333/api

# Ou en production
MONOLITH_API_URL=http://tsa-monolith:3333/api
```

## Tests

### Lancer les tests

```bash
cd services/tsa-ai
pytest tests/test_chatbot.py -v
```

### Test manuel via curl

```bash
# Health check
curl http://localhost:8000/api/ai/chatbot/health

# Query
curl -X POST http://localhost:8000/api/ai/chatbot/query \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -H "X-User-Role: CLIENT" \
  -d '{
    "message": "Où est mon colis #12345?",
    "user_id": "user123",
    "user_role": "CLIENT"
  }'
```

## Évolution future (Phase 2)

### Upgrade vers LLM

```python
# Intégration Mistral/OpenAI
from openai import AsyncOpenAI

class ChatbotService:
    def __init__(self):
        self.llm_client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    async def _generate_llm_response(self, message: str, context: dict):
        response = await self.llm_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Tu es l'assistant TSA Logistique..."},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content
```

### WebSocket natif dans tsa-ai

```python
@app.websocket("/ws/chatbot")
async def chatbot_websocket(websocket: WebSocket, token: str):
    await websocket.accept()
    
    # Valider token
    user = await validate_token(token)
    
    try:
        while True:
            message = await websocket.receive_text()
            response = await chatbot_service.process_message(message, user.id)
            await websocket.send_json(response.dict())
    except WebSocketDisconnect:
        logger.info(f"User {user.id} disconnected")
```

## Métriques et monitoring

### Logs importants

- Intent détecté et score de confiance
- Temps de réponse
- Erreurs d'intégration avec services externes
- Messages nécessitant intervention humaine

### Métriques à suivre

- Taux de résolution automatique (% de `requires_human=False`)
- Distribution des intents
- Temps de réponse moyen
- Taux d'erreur

## FAQ

### Q: Comment ajouter un nouvel intent ?

1. Ajouter les patterns dans `IntentClassifier._initialize_intents()`
2. Créer un handler `_handle_new_intent()` dans `ChatbotService`
3. Ajouter le mapping dans `_handle_intent()`
4. Ajouter des tests

### Q: Comment améliorer la détection d'intents ?

- Ajouter plus de patterns regex
- Collecter les messages mal classifiés
- Passer à un modèle ML (spaCy, transformers)

### Q: Le bot peut-il gérer plusieurs langues ?

Actuellement français uniquement. Pour ajouter l'anglais :
- Dupliquer les patterns en anglais
- Détecter la langue du message
- Générer les réponses dans la bonne langue

### Q: Comment gérer les conversations longues ?

L'historique est limité aux 20 derniers messages. Pour améliorer :
- Utiliser Redis pour stockage persistant
- Implémenter un système de résumé de contexte
- Ajouter un timeout de conversation
