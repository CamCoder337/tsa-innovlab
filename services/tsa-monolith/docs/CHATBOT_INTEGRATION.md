# Chatbot Integration - Monolith

## Vue d'ensemble

Le chatbot TSA avec LLM Groq est maintenant intégré dans le monolithe AdonisJS.

## Architecture

```
Frontend → Monolith (AdonisJS) → tsa-ai (FastAPI) → Groq LLM
                ↓
         ChatbotController
                ↓
           AIService
```

## Fichiers créés/modifiés

### Nouveaux fichiers

- `app/controllers/http/common/chatbot_controller.ts` - Contrôleur chatbot
- `tests/unit/common/chatbot_controller.spec.ts` - Tests unitaires

### Fichiers modifiés

- `app/services/ai_service.ts` - Ajout méthodes chatbot
- `start/routes.ts` - Ajout routes chatbot

## Routes disponibles

### POST /api/common/chatbot/query

Envoyer un message au chatbot

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "message": "Bonjour",
  "conversation_id": "optional_conv_id",
  "context": {
    "page": "homepage"
  }
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "👋 Bonjour ! Je suis votre assistant TSA Logistique...",
  "intent": {
    "name": "greeting",
    "confidence": 0.95,
    "entities": {}
  },
  "suggestions": ["Suivre un colis", "Calculer un tarif", "Voir catalogue"],
  "requires_human": false,
  "timestamp": "2025-10-26T..."
}
```

**Response 503:**

```json
{
  "success": false,
  "message": "Chatbot service is temporarily unavailable",
  "fallback_message": "Désolé, je ne suis pas disponible..."
}
```

### GET /api/common/chatbot/history/:conversationId

Récupérer l'historique de conversation

**Headers:**

```
Authorization: Bearer <token>
```

**Response 200:**

```json
{
  "success": true,
  "conversation_id": "123",
  "messages": [
    {
      "role": "user",
      "message": "Bonjour",
      "timestamp": "2025-10-26T..."
    },
    {
      "role": "bot",
      "message": "Bonjour ! Comment puis-je vous aider ?",
      "timestamp": "2025-10-26T..."
    }
  ],
  "count": 2
}
```

### GET /api/common/chatbot/health

Vérifier la santé du chatbot

**Response 200:**

```json
{
  "success": true,
  "status": "healthy",
  "message": "Chatbot service is operational"
}
```

## Utilisation dans le code

### Depuis un contrôleur

```typescript
import AIService from '#services/ai_service'

const aiService = new AIService()

const response = await aiService.queryChatbot({
  message: 'Bonjour',
  user_id: user.id.toString(),
  user_role: user.role,
  conversation_id: conversationId,
  context: {},
})

if (response) {
  console.log(response.message)
  console.log(response.intent)
  console.log(response.suggestions)
}
```

### Depuis le frontend

```typescript
// React/Vue/Angular
const response = await fetch('/api/common/chatbot/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: userMessage,
    conversation_id: conversationId,
  }),
})

const data = await response.json()

if (data.success) {
  displayMessage(data.message)
  displaySuggestions(data.suggestions)
}
```

## Tests

### Lancer les tests

```bash
cd services/tsa-monolith
node ace test tests/unit/common/chatbot_controller.spec.ts
```

### Tests disponibles

1. ✅ Query chatbot successfully
2. ✅ Reject empty message
3. ✅ Reject missing message
4. ✅ Require authentication
5. ✅ Get conversation history
6. ✅ Check chatbot health
7. ✅ Handle complex queries
8. ✅ Handle conversation context

## Gestion des erreurs

### Service AI indisponible

Le contrôleur retourne automatiquement un fallback :

```json
{
  "success": false,
  "message": "Chatbot service is temporarily unavailable",
  "fallback_message": "Désolé, je ne suis pas disponible..."
}
```

### Message vide

```json
{
  "success": false,
  "message": "Message is required"
}
```

### Non authentifié

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

## Sécurité

### Authentification

- Toutes les routes nécessitent un token JWT valide
- Le middleware `auth()` est appliqué

### Autorisation

- Les utilisateurs ne peuvent accéder qu'à leur propre historique
- Le `user_id` est extrait du token, pas du body

### Validation

- Les messages vides sont rejetés
- Les messages sont trimés avant envoi
- Timeout de 15s sur les appels LLM

## Performance

### Temps de réponse

| Type de requête     | Méthode | Temps  |
| ------------------- | ------- | ------ |
| Questions simples   | Règles  | <100ms |
| Questions complexes | LLM     | 1-2s   |
| Historique          | Cache   | <50ms  |

### Optimisations

- Timeout de 15s pour éviter les blocages
- Fallback automatique si service AI down
- Historique limité à 20 messages

## Monitoring

### Logs

Le service log automatiquement :

```typescript
logger.info('Chatbot query received', {
  userId: user.id,
  messageLength: message.length,
})

logger.error('Failed to query chatbot from AI service', { error })
```

### Métriques à surveiller

- Taux de succès des requêtes
- Temps de réponse moyen
- Taux d'utilisation LLM vs règles
- Nombre de fallbacks

## Configuration

### Variables d'environnement

Dans `services/tsa-monolith/.env` :

```env
# URL du service AI
FASTAPI_BASE_URL=http://localhost:8000

# Ou en production
FASTAPI_BASE_URL=http://tsa-ai:8000
```

## Intégration WebSocket (optionnel)

Pour des conversations en temps réel :

```typescript
// Dans start/routes.ts
router.ws('/ws/chatbot', async (ctx) => {
  const { ws, auth } = ctx
  const user = auth.getUserOrFail()

  ws.on('message', async (message) => {
    const response = await aiService.queryChatbot({
      message: message.toString(),
      user_id: user.id.toString(),
      user_role: user.role,
    })

    ws.send(JSON.stringify(response))
  })
})
```

## Exemples d'utilisation

### Chat widget

```typescript
// components/ChatWidget.tsx
const ChatWidget = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const sendMessage = async () => {
    const response = await fetch('/api/common/chatbot/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: input })
    })

    const data = await response.json()

    setMessages([
      ...messages,
      { role: 'user', text: input },
      { role: 'bot', text: data.message }
    ])

    setInput('')
  }

  return (
    <div className="chat-widget">
      {messages.map((msg, i) => (
        <div key={i} className={msg.role}>
          {msg.text}
        </div>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Envoyer</button>
    </div>
  )
}
```

### Support page

```typescript
// pages/Support.tsx
const SupportPage = () => {
  const [chatbotResponse, setChatbotResponse] = useState(null)

  const askQuestion = async (question: string) => {
    const response = await fetch('/api/common/chatbot/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: question,
        context: { page: 'support' }
      })
    })

    const data = await response.json()
    setChatbotResponse(data)
  }

  return (
    <div>
      <h1>Support</h1>
      <div className="quick-questions">
        <button onClick={() => askQuestion('Comment suivre mon colis ?')}>
          Suivre un colis
        </button>
        <button onClick={() => askQuestion('Comment calculer un tarif ?')}>
          Calculer un tarif
        </button>
      </div>
      {chatbotResponse && (
        <div className="response">
          <p>{chatbotResponse.message}</p>
          <div className="suggestions">
            {chatbotResponse.suggestions.map((s, i) => (
              <button key={i} onClick={() => askQuestion(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

## Troubleshooting

### Erreur : "Chatbot service is temporarily unavailable"

**Causes possibles :**

- Service tsa-ai non démarré
- URL incorrecte dans FASTAPI_BASE_URL
- Firewall bloque la connexion

**Solution :**

```bash
# Vérifier que tsa-ai tourne
curl http://localhost:8000/api/ai/chatbot/health

# Vérifier les logs
docker-compose logs tsa-ai
```

### Erreur : "Message is required"

**Cause :** Message vide ou manquant

**Solution :** Envoyer un message non vide

### Timeout

**Cause :** LLM prend trop de temps (>15s)

**Solution :** Augmenter le timeout dans `ai_service.ts`

```typescript
signal: AbortSignal.timeout(30000) // 30 secondes
```

## Prochaines étapes

1. **Frontend :** Créer un composant chat widget
2. **WebSocket :** Implémenter chat temps réel
3. **Analytics :** Tracker les conversations
4. **Feedback :** Permettre aux users de noter les réponses

---

**Documentation complète :** `services/tsa-ai/docs/LLM_INTEGRATION.md`  
**Tests :** `tests/unit/common/chatbot_controller.spec.ts`  
**Service AI :** `app/services/ai_service.ts`
