# Guide d'intégration du Chatbot dans tsa-monolith

## Option 1 : Intégration WebSocket (Recommandée)

### Étape 1 : Créer un service chatbot dans le monolithe

Créer `services/tsa-monolith/app/services/chatbot_integration_service.ts` :

```typescript
import axios, { AxiosInstance } from 'axios'
import env from '#start/env'

export interface ChatbotQuery {
  message: string
  user_id: string
  user_role: string
  conversation_id?: string
  context?: Record<string, any>
}

export interface ChatbotResponse {
  message: string
  intent?: {
    name: string
    confidence: number
    entities: Record<string, any>
  }
  suggestions: string[]
  data?: Record<string, any>
  requires_human: boolean
  timestamp: string
}

class ChatbotIntegrationService {
  private client: AxiosInstance
  private baseUrl: string

  constructor() {
    this.baseUrl = env.get('AI_SERVICE_URL', 'http://localhost:8000')
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Query the chatbot
   */
  async query(params: ChatbotQuery): Promise<ChatbotResponse> {
    try {
      const response = await this.client.post<ChatbotResponse>(
        '/api/ai/chatbot/query',
        params,
        {
          headers: {
            'X-User-Id': params.user_id,
            'X-User-Role': params.user_role,
          },
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Chatbot query error:', error.message)
      
      // Fallback response
      return {
        message: 'Désolé, le bot est temporairement indisponible. Un agent va vous aider.',
        suggestions: ['Parler à un humain'],
        requires_human: true,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Check chatbot health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/ai/chatbot/health')
      return response.data.status === 'healthy'
    } catch {
      return false
    }
  }

  /**
   * Detect if message is a bot command
   */
  isBotCommand(message: string): boolean {
    return message.trim().startsWith('/bot ') || message.trim().startsWith('@bot ')
  }

  /**
   * Extract message from bot command
   */
  extractBotMessage(message: string): string {
    return message.replace(/^\/(bot|@bot)\s+/i, '').trim()
  }
}

export default new ChatbotIntegrationService()
```

### Étape 2 : Modifier le WebSocket service

Dans `services/tsa-monolith/app/services/websocket_service.ts`, ajouter :

```typescript
import chatbotService from '#services/chatbot_integration_service'

// Dans la méthode qui gère les messages WebSocket
async handleIncomingMessage(userId: string, message: string, conversationId?: string) {
  // Vérifier si c'est une commande bot
  if (chatbotService.isBotCommand(message)) {
    const botMessage = chatbotService.extractBotMessage(message)
    
    // Récupérer l'utilisateur
    const user = await User.find(userId)
    if (!user) return
    
    // Appeler le chatbot
    const botResponse = await chatbotService.query({
      message: botMessage,
      user_id: user.id,
      user_role: user.role,
      conversation_id: conversationId,
    })
    
    // Envoyer la réponse via WebSocket
    this.sendToUser(userId, {
      type: 'bot_response',
      conversation_id: conversationId,
      message: botResponse.message,
      intent: botResponse.intent,
      suggestions: botResponse.suggestions,
      data: botResponse.data,
      requires_human: botResponse.requires_human,
      timestamp: botResponse.timestamp,
    })
    
    // Si nécessite intervention humaine, notifier les admins
    if (botResponse.requires_human) {
      this.notifyAdmins({
        type: 'bot_escalation',
        user_id: userId,
        conversation_id: conversationId,
        original_message: botMessage,
      })
    }
    
    return // Ne pas traiter comme message normal
  }
  
  // Traiter les messages normaux...
}
```

### Étape 3 : Ajouter la configuration

Dans `services/tsa-monolith/.env` :

```env
# AI Service URL
AI_SERVICE_URL=http://localhost:8000

# En production avec Docker
AI_SERVICE_URL=http://tsa-ai:8000
```

Dans `services/tsa-monolith/start/env.ts` :

```typescript
export default await Env.create(new URL('../', import.meta.url), {
  // ... existing config
  AI_SERVICE_URL: Env.schema.string.optional(),
})
```

## Option 2 : Route HTTP dédiée (Plus simple)

### Créer un controller

Créer `services/tsa-monolith/app/controllers/http/common/chatbot_controller.ts` :

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import chatbotService from '#services/chatbot_integration_service'

export default class ChatbotController {
  /**
   * Query the chatbot
   */
  async query({ request, auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { message, conversation_id, context } = request.only([
        'message',
        'conversation_id',
        'context',
      ])

      if (!message || message.trim().length === 0) {
        return response.badRequest({
          success: false,
          message: 'Message is required',
        })
      }

      const botResponse = await chatbotService.query({
        message: message.trim(),
        user_id: user.id,
        user_role: user.role,
        conversation_id,
        context,
      })

      return response.ok({
        success: true,
        data: botResponse,
      })
    } catch (error: any) {
      return response.internalServerError({
        success: false,
        message: 'Failed to process chatbot query',
        error: error.message,
      })
    }
  }

  /**
   * Get chatbot health status
   */
  async health({ response }: HttpContext) {
    const isHealthy = await chatbotService.healthCheck()

    return response.ok({
      success: true,
      status: isHealthy ? 'healthy' : 'unhealthy',
    })
  }
}
```

### Ajouter la route

Dans `services/tsa-monolith/start/routes.ts` :

```typescript
// Dans la section ROUTES COMMUNES PROTÉGÉES
router
  .group(() => {
    // ... existing routes
    
    // Chatbot
    router.post('/chatbot/query', '#controllers/http/common/chatbot_controller.query')
    router.get('/chatbot/health', '#controllers/http/common/chatbot_controller.health')
  })
  .prefix('/api/common')
  .middleware(middleware.auth())
```

## Option 3 : Intégration Frontend directe

Le frontend peut appeler directement l'API du chatbot :

```typescript
// Dans le frontend
async function queryChatbot(message: string) {
  const response = await fetch('http://localhost:8000/api/ai/chatbot/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': currentUser.id,
      'X-User-Email': currentUser.email,
      'X-User-Role': currentUser.role,
    },
    body: JSON.stringify({
      message,
      user_id: currentUser.id,
      user_role: currentUser.role,
      conversation_id: currentConversationId,
    }),
  })
  
  return await response.json()
}
```

## Tests d'intégration

### Test 1 : Via le monolithe

```bash
# Démarrer les deux services
cd services/tsa-ai && uvicorn app.main:app --reload --port 8000
cd services/tsa-monolith && npm run dev

# Tester via le monolithe
curl -X POST http://localhost:3333/api/common/chatbot/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Où est mon colis #12345?"
  }'
```

### Test 2 : WebSocket

```javascript
// Dans le frontend
const ws = new WebSocket('ws://localhost:3333/ws/notifications')

ws.onopen = () => {
  // Envoyer une commande bot
  ws.send('/bot Où est mon colis #12345?')
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.type === 'bot_response') {
    console.log('Bot:', data.message)
    console.log('Suggestions:', data.suggestions)
  }
}
```

## Gestion des erreurs

### Timeout

Si le chatbot ne répond pas en 10 secondes :

```typescript
const response = await Promise.race([
  chatbotService.query(params),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 10000)
  )
])
```

### Fallback

Si le service est down :

```typescript
try {
  return await chatbotService.query(params)
} catch (error) {
  // Fallback vers réponse générique
  return {
    message: 'Le bot est temporairement indisponible. Veuillez réessayer ou contacter le support.',
    requires_human: true,
    suggestions: ['Parler à un agent', 'Réessayer plus tard'],
    timestamp: new Date().toISOString(),
  }
}
```

## Monitoring

### Logs à ajouter

```typescript
// Log chaque requête bot
logger.info('Chatbot query', {
  user_id: params.user_id,
  message_length: params.message.length,
  conversation_id: params.conversation_id,
})

// Log les réponses
logger.info('Chatbot response', {
  intent: response.intent?.name,
  confidence: response.intent?.confidence,
  requires_human: response.requires_human,
  response_time_ms: Date.now() - startTime,
})
```

### Métriques

- Nombre de requêtes bot par jour
- Taux de résolution automatique
- Temps de réponse moyen
- Intents les plus utilisés

## Checklist de déploiement

- [ ] Service chatbot déployé et accessible
- [ ] Variables d'environnement configurées
- [ ] Routes ajoutées dans le monolithe
- [ ] Tests d'intégration passent
- [ ] Logs et monitoring en place
- [ ] Documentation utilisateur créée
- [ ] Fallbacks testés
- [ ] Performance validée (< 2s de réponse)
