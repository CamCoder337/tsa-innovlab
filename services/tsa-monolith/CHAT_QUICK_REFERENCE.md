# 💬 Chat System - Quick Reference

## 🚀 Quick Start

### 1. Connect to WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3333/ws/notifications')
const token = 'your_jwt_token'

ws.onopen = () => console.log('✅ Connected')
ws.onmessage = (e) => console.log('📨', JSON.parse(e.data))

// Heartbeat
setInterval(() => ws.send('ping'), 30000)
```

### 2. Create Conversation

```bash
# Direct conversation
POST /api/common/conversations/direct
{ "userId": "target-user-id" }

# Mission conversation
POST /api/common/conversations/mission
{ "missionId": "mission-id", "userId": "target-user-id" }
```

### 3. Send Message

```bash
POST /api/common/conversations/:conversationId/messages
{ "content": "Hello!" }
```

---

## 📋 Authorization Rules

| From         | To           | Direct | Mission             |
| ------------ | ------------ | ------ | ------------------- |
| Admin        | Anyone       | ✅     | ✅                  |
| Affreteur    | Affreteur    | ✅     | -                   |
| Affreteur    | Transporteur | ❌     | ✅ (must be linked) |
| Transporteur | Transporteur | ✅     | -                   |

---

## 🔌 WebSocket Events

### Incoming Events

```typescript
// New message
{
  "type": "chat:message",
  "data": {
    "conversationId": 1,
    "message": { /* message object */ }
  }
}

// Message read
{
  "type": "chat:read",
  "data": {
    "conversationId": 1,
    "readerId": "uuid",
    "messageIds": [1, 2, 3],
    "readAt": "2025-01-15T10:00:00Z"
  }
}

// Typing indicator
{
  "type": "chat:typing:start",  // or "chat:typing:stop"
  "data": {
    "conversationId": 1,
    "senderId": "uuid",
    "isTyping": true
  }
}
```

---

## 📡 API Endpoints Summary

```
GET    /api/common/conversations               # List conversations
GET    /api/common/conversations/:id           # Get conversation
POST   /api/common/conversations/direct        # Create direct
POST   /api/common/conversations/mission       # Create mission
GET    /api/common/conversations/search/users  # Search users

GET    /api/common/conversations/:id/messages  # List messages
POST   /api/common/conversations/:id/messages  # Send message
PUT    /api/common/messages/:id/read           # Mark message read
PUT    /api/common/conversations/:id/messages/read-all  # Mark all read
GET    /api/common/messages/unread-count       # Get unread count
POST   /api/common/conversations/:id/typing    # Send typing indicator
```

---

## 🧪 Test with cURL

```bash
# Create direct conversation
curl -X POST http://localhost:3333/api/common/conversations/direct \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "target-uuid"}'

# Send message
curl -X POST http://localhost:3333/api/common/conversations/1/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!"}'

# Test WebSocket with wscat
npx wscat -c "ws://localhost:3333/ws/notifications"
```

---

## 🐛 Debug

```typescript
// Check WebSocket stats
const stats = websocketService.getConnectionStats()
// { total: 10, transporteurs: 5, affreteurs: 4, admins: 1 }

// Check if user is connected
const isConnected = websocketService.isUserConnected('user-uuid')

// Get active connections
const connections = websocketService.getActiveConnections()
```

---

## 📚 Full Documentation

See [CHAT_SYSTEM.md](./CHAT_SYSTEM.md) for complete documentation.
