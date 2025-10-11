# 🌐 Exemples d'Intégration Client WebSocket

Ce document fournit des exemples de code pour intégrer les WebSockets dans différents types de clients.

---

## 📱 1. JavaScript Vanilla (Browser)

### Connexion Basique

```javascript
// Configuration
const WS_URL = 'ws://localhost:3333/ws/notifications'
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Votre JWT token

// Connexion avec authentification
const ws = new WebSocket(`${WS_URL}`)

// Événement : Connexion établie
ws.addEventListener('open', (event) => {
  console.log('✅ WebSocket connecté')

  // Envoyer le token d'authentification (si nécessaire)
  // Note : Pour ce serveur, le token doit être dans les headers initiaux
  // donc vous devrez le passer différemment (voir exemple avec headers)
})

// Événement : Message reçu
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  console.log('📨 Message reçu:', message)

  // Router selon le type de message
  switch (message.type) {
    case 'connected':
      console.log('✅ Bienvenue:', message.user)
      break

    case 'broadcast':
      if (message.data.type === 'mission:new') {
        console.log('🚛 Nouvelle mission:', message.data.data)
        // Afficher notification UI
        showNewMissionNotification(message.data.data)
      }
      break

    case 'notification':
      if (message.data.type === 'chat:message') {
        console.log('💬 Nouveau message chat:', message.data.data)
        // Mettre à jour le chat
        appendMessageToChat(message.data.data)
      }
      break

    default:
      console.log('❓ Type de message inconnu:', message)
  }
})

// Événement : Erreur
ws.addEventListener('error', (error) => {
  console.error('❌ Erreur WebSocket:', error)
})

// Événement : Fermeture
ws.addEventListener('close', (event) => {
  console.log('❌ WebSocket fermé:', event.code, event.reason)

  // Reconnexion automatique après 5 secondes
  setTimeout(() => {
    console.log('🔄 Tentative de reconnexion...')
    connectWebSocket() // Fonction à définir
  }, 5000)
})

// Heartbeat (ping/pong) toutes les 30 secondes
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send('ping')
  }
}, 30000)

// Fermer proprement la connexion
window.addEventListener('beforeunload', () => {
  ws.close()
})
```

### Connexion avec Headers (Authentification)

⚠️ **Important** : Les WebSockets natifs du navigateur ne supportent pas les headers personnalisés.

**Solutions alternatives :**

#### Option 1 : Token dans l'URL (Déconseillé en production)
```javascript
const token = 'eyJhbGciOiJIUzI1NiIs...'
const ws = new WebSocket(`${WS_URL}?token=${token}`)
```

#### Option 2 : Utiliser une bibliothèque (Recommandé)

```javascript
// Avec Socket.IO
import io from 'socket.io-client'

const socket = io('http://localhost:3333', {
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIs...'
  }
})
```

#### Option 3 : XHR + WebSocket (Solution actuelle)
```javascript
// 1. D'abord établir une session HTTP avec le token
fetch('http://localhost:3333/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// 2. Puis connecter le WebSocket (le cookie de session sera utilisé)
const ws = new WebSocket(WS_URL)
```

---

## ⚛️ 2. React + TypeScript

### Hook Custom `useWebSocket`

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  userId?: string
}

interface UseWebSocketOptions {
  url: string
  token: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectInterval?: number
}

export const useWebSocket = ({
  url,
  token,
  onMessage,
  onConnect,
  onDisconnect,
  reconnectInterval = 5000
}: UseWebSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = () => {
    try {
      // Note: Les headers ne sont pas supportés nativement
      // Vous devrez implémenter l'authentification via cookie de session
      const ws = new WebSocket(url)

      ws.onopen = () => {
        console.log('✅ WebSocket connecté')
        setIsConnected(true)
        onConnect?.()

        // Heartbeat
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 30000)

        ws.onclose = () => {
          clearInterval(heartbeatInterval)
        }
      }

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data)
        onMessage?.(message)
      }

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error)
      }

      ws.onclose = (event) => {
        console.log('❌ WebSocket fermé:', event.code)
        setIsConnected(false)
        onDisconnect?.()

        // Reconnexion automatique
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reconnexion...')
          connect()
        }, reconnectInterval)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('❌ Erreur connexion WebSocket:', error)
    }
  }

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [url, token])

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  return { isConnected, sendMessage, ws: wsRef.current }
}
```

### Composant de Notifications

```typescript
// components/NotificationListener.tsx
import React, { useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

export const NotificationListener: React.FC = () => {
  const { token } = useAuth()
  const WS_URL = 'ws://localhost:3333/ws/notifications'

  const { isConnected } = useWebSocket({
    url: WS_URL,
    token: token!,
    onMessage: (message) => {
      console.log('📨 Message reçu:', message)

      // Nouvelle mission
      if (message.type === 'broadcast' && message.data.type === 'mission:new') {
        const mission = message.data.data
        toast.success(
          `🚛 Nouvelle mission : ${mission.titre}`,
          {
            duration: 5000,
            icon: '🚛',
          }
        )
      }

      // Nouveau message chat
      if (message.type === 'notification' && message.data.type === 'chat:message') {
        const msg = message.data.data.message
        toast(
          `💬 ${msg.sender.firstName}: ${msg.content}`,
          {
            duration: 4000,
            icon: '💬',
          }
        )
      }

      // Mise à jour GPS
      if (message.type === 'notification' && message.data.type === 'location_update') {
        const location = message.data.data
        console.log('📍 Nouvelle position:', location.location)
        // Mettre à jour la carte en temps réel
      }
    },
    onConnect: () => {
      console.log('✅ Connexion WebSocket établie')
      toast.success('Connecté en temps réel', { icon: '🟢' })
    },
    onDisconnect: () => {
      console.log('❌ Déconnexion WebSocket')
      toast.error('Déconnecté du temps réel', { icon: '🔴' })
    }
  })

  return (
    <div className="fixed top-4 right-4 z-50">
      {isConnected ? (
        <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span>En ligne</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg">
          <span className="w-2 h-2 bg-white rounded-full"></span>
          <span>Hors ligne</span>
        </div>
      )}
    </div>
  )
}
```

### Intégration dans l'App

```typescript
// App.tsx
import { NotificationListener } from './components/NotificationListener'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <div className="App">
      {/* Listener de notifications en temps réel */}
      <NotificationListener />

      {/* Toast notifications */}
      <Toaster position="top-right" />

      {/* Votre application */}
      <YourRoutes />
    </div>
  )
}
```

---

## 📱 3. React Native

```typescript
// services/websocket.ts
import { useEffect, useRef } from 'react'

export const useWebSocketNative = (token: string) => {
  const ws = useRef<WebSocket | null>(null)
  const WS_URL = 'ws://192.168.1.100:3333/ws/notifications' // Votre IP locale

  useEffect(() => {
    // Connexion
    ws.current = new WebSocket(WS_URL)

    ws.current.onopen = () => {
      console.log('✅ WebSocket connecté')
    }

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data)

      // Afficher notification native
      if (message.type === 'broadcast' && message.data.type === 'mission:new') {
        showLocalNotification(
          'Nouvelle Mission',
          message.data.data.titre
        )
      }
    }

    ws.current.onclose = () => {
      console.log('❌ WebSocket fermé')
    }

    return () => {
      ws.current?.close()
    }
  }, [token])

  return ws.current
}

// Notification locale
import PushNotification from 'react-native-push-notification'

const showLocalNotification = (title: string, message: string) => {
  PushNotification.localNotification({
    title,
    message,
    playSound: true,
    soundName: 'default',
  })
}
```

---

## 🐍 4. Python Client

```python
# websocket_client.py
import asyncio
import websockets
import json

async def connect_websocket():
    uri = "ws://localhost:3333/ws/notifications"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

    # Headers d'authentification
    headers = {
        "Authorization": f"Bearer {token}"
    }

    async with websockets.connect(uri, extra_headers=headers) as websocket:
        print("✅ Connecté au WebSocket")

        # Écouter les messages
        async for message in websocket:
            data = json.loads(message)
            print(f"📨 Message reçu: {data}")

            # Traiter selon le type
            if data.get('type') == 'broadcast':
                if data['data']['type'] == 'mission:new':
                    mission = data['data']['data']
                    print(f"🚛 Nouvelle mission: {mission['titre']}")

            # Heartbeat
            if data == 'pong':
                print("💓 Heartbeat OK")

# Fonction pour envoyer un ping
async def send_heartbeat(websocket):
    while True:
        await asyncio.sleep(30)
        await websocket.send("ping")

# Exécution
asyncio.run(connect_websocket())
```

---

## 🌍 5. Vue.js 3 (Composition API)

```typescript
// composables/useWebSocket.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useWebSocket(url: string, token: string) {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const messages = ref<any[]>([])

  const connect = () => {
    ws.value = new WebSocket(url)

    ws.value.onopen = () => {
      console.log('✅ WebSocket connecté')
      isConnected.value = true
    }

    ws.value.onmessage = (event) => {
      const message = JSON.parse(event.data)
      messages.value.push(message)

      // Notification toast
      if (message.type === 'broadcast' && message.data.type === 'mission:new') {
        // Utiliser votre système de notifications (ex: vue-toastification)
        console.log('🚛 Nouvelle mission:', message.data.data)
      }
    }

    ws.value.onclose = () => {
      console.log('❌ WebSocket fermé')
      isConnected.value = false

      // Reconnexion
      setTimeout(connect, 5000)
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    ws.value?.close()
  })

  return {
    isConnected,
    messages,
    ws
  }
}
```

```vue
<!-- components/NotificationBadge.vue -->
<template>
  <div class="notification-badge">
    <span v-if="isConnected" class="status online">🟢 En ligne</span>
    <span v-else class="status offline">🔴 Hors ligne</span>
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const WS_URL = 'ws://localhost:3333/ws/notifications'

const { isConnected, messages } = useWebSocket(WS_URL, authStore.token)
</script>
```

---

## 🔧 6. Angular

```typescript
// services/websocket.service.ts
import { Injectable } from '@angular/core'
import { Subject, Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null
  private messagesSubject = new Subject<any>()
  public messages$: Observable<any> = this.messagesSubject.asObservable()

  constructor() {}

  connect(url: string, token: string): void {
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('✅ WebSocket connecté')
    }

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.messagesSubject.next(message)
    }

    this.ws.onclose = () => {
      console.log('❌ WebSocket fermé')
      // Reconnexion
      setTimeout(() => this.connect(url, token), 5000)
    }
  }

  disconnect(): void {
    this.ws?.close()
  }
}
```

```typescript
// components/notifications.component.ts
import { Component, OnInit } from '@angular/core'
import { WebSocketService } from '../services/websocket.service'
import { AuthService } from '../services/auth.service'

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent implements OnInit {
  isConnected = false

  constructor(
    private wsService: WebSocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.authService.getToken()
    const WS_URL = 'ws://localhost:3333/ws/notifications'

    this.wsService.connect(WS_URL, token)

    this.wsService.messages$.subscribe((message) => {
      console.log('📨 Message reçu:', message)

      if (message.type === 'broadcast' && message.data.type === 'mission:new') {
        this.showNotification(message.data.data)
      }
    })
  }

  showNotification(mission: any): void {
    // Afficher notification
    alert(`Nouvelle mission: ${mission.titre}`)
  }
}
```

---

## 🛠️ 7. Gestion d'Erreurs Avancée

```typescript
// Advanced WebSocket Manager
class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(
    private url: string,
    private token: string,
    private onMessage: (message: any) => void
  ) {}

  connect() {
    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('✅ WebSocket connecté')
        this.reconnectAttempts = 0
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        this.onMessage(message)
      }

      this.ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error)
      }

      this.ws.onclose = (event) => {
        console.log('❌ WebSocket fermé:', event.code)
        this.stopHeartbeat()
        this.reconnect()
      }
    } catch (error) {
      console.error('❌ Erreur connexion:', error)
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Nombre maximum de tentatives atteint')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`🔄 Reconnexion dans ${delay}ms (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping')
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  disconnect() {
    this.stopHeartbeat()
    this.ws?.close()
  }
}

// Utilisation
const wsManager = new WebSocketManager(
  'ws://localhost:3333/ws/notifications',
  'your-jwt-token',
  (message) => {
    console.log('Message reçu:', message)
  }
)

wsManager.connect()
```

---

## 📝 Notes Importantes

### Authentification

⚠️ **Le protocole WebSocket natif ne supporte pas les headers personnalisés dans le navigateur.**

**Solutions :**
1. **Cookie de session** (Recommandé) : Établir une session HTTP d'abord, puis le WebSocket utilisera le cookie
2. **Token dans l'URL** : `ws://localhost:3333/ws/notifications?token=xxx` (Déconseillé en production)
3. **Bibliothèque tierce** : Utiliser Socket.IO qui supporte les headers

### Reconnexion Automatique

Toujours implémenter la reconnexion automatique avec backoff exponentiel :
```javascript
let reconnectDelay = 1000
const reconnect = () => {
  setTimeout(() => {
    connect()
    reconnectDelay = Math.min(reconnectDelay * 2, 30000) // Max 30 secondes
  }, reconnectDelay)
}
```

### Heartbeat

Envoyer un ping toutes les 30 secondes pour maintenir la connexion :
```javascript
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send('ping')
  }
}, 30000)
```

---

## 🎯 Checklist d'Intégration

- [ ] Connexion WebSocket avec authentification
- [ ] Gestion des messages entrants (routing par type)
- [ ] Reconnexion automatique en cas de déconnexion
- [ ] Heartbeat (ping/pong) toutes les 30 secondes
- [ ] Fermeture propre à la déconnexion de l'utilisateur
- [ ] Affichage de l'état de connexion (en ligne/hors ligne)
- [ ] Notifications UI pour les messages importants
- [ ] Gestion des erreurs réseau
- [ ] Tests de connexion multiple (plusieurs onglets)
- [ ] Tests de reconnexion après perte de réseau

---

**🚀 Prêt à intégrer les WebSockets dans votre application ! 🌐**
