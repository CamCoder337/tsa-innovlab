# Intégration Chatbot - Monolithe ↔ Service AI

## ✅ Architecture Confirmée

### Flow de Communication

```
Frontend/Client
    ↓
    POST /api/common/chatbot/query
    ↓
Monolithe (AdonisJS)
    ├─ Authentification (JWT)
    ├─ Extraction user info (id, role, email)
    ├─ Ajout du token Authorization
    └─ Appel au Service AI
        ↓
        POST http://tsa-ai:8000/api/ai/chatbot/query
        Headers:
          - X-User-Id: {user.id}
          - X-User-Role: {user.role}
          - X-User-Email: {user.email}
        Body:
          - message
          - user_id
          - user_role
          - user_token (pour appels API)
          - conversation_id
          - context
        ↓
Service AI (FastAPI)
    ├─ Récupération user depuis headers
    ├─ Appel au ChatbotFunctionCallingService
    ├─ Exécution des fonctions (17 disponibles)
    └─ Retour de la réponse
        ↓
Monolithe
    └─ Retour au Frontend
```

## 🔌 Endpoints Disponibles

### Monolithe (Port 3333)

#### 1. Query Chatbot
```
POST /api/common/chatbot/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Quelles sont mes missions ?",
  "conversationId": "optional-conversation-id",
  "context": {}
}
```

#### 2. Query Chatbot (Streaming)
```
POST /api/common/chatbot/query/stream
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Cherche des pièces",
  "conversationId": "optional-conversation-id"
}
```

#### 3. Conversation History
```
GET /api/common/chatbot/history/:conversationId
Authorization: Bearer {token}
```

#### 4. Chatbot Metrics
```
GET /api/common/chatbot/metrics
Authorization: Bearer {token}
```

#### 5. Health Check
```
GET /api/common/chatbot/health
```

### Service AI (Port 8000)

#### 1. Query Chatbot
```
POST /api/ai/chatbot/query
X-User-Id: {user_id}
X-User-Role: {user_role}
X-User-Email: {user_email}
Content-Type: application/json

{
  "message": "Mes missions",
  "user_id": "uuid",
  "user_role": "AFFRETEUR",
  "user_token": "Bearer ...",
  "conversation_id": "uuid",
  "context": {}
}
```

## ✅ Fonctions Accessibles via Monolithe

Toutes les **17 fonctions** du chatbot sont accessibles via le monolithe :

### Produits & Catalogue (3)
1. ✅ `search_products` - Rechercher des pièces
2. ✅ `get_product_details` - Détails d'un produit
3. ✅ `get_categories` - Lister les catégories

### Panier & Commandes (3)
4. ✅ `get_cart` - Voir mon panier
5. ✅ `get_my_orders` - Mes commandes
6. ✅ `get_order_details` - Détails d'une commande

### Missions & Transport (5)
7. ✅ `get_user_missions` - Mes missions
8. ✅ `get_mission_updates` - Historique d'une mission
9. ✅ `get_available_missions` - Missions disponibles (transporteur)
10. ✅ `track_shipment` - Suivre une mission
11. ✅ `calculate_price` - Calculer un tarif

### Véhicules (1)
12. ✅ `get_my_vehicles` - Mes véhicules (transporteur)

### Messages & Notifications (2)
13. ✅ `get_unread_messages` - Messages non lus
14. ✅ `get_notifications` - Notifications

### Profil & Compte (2)
15. ✅ `get_my_profile` - Mon profil
16. ✅ `get_my_addresses` - Mes adresses

### Utilitaires (1)
17. ✅ `request_clarification` - Demander une clarification

## 🔒 Sécurité

### Authentification
1. **Monolithe** : Vérifie le JWT token
2. **Service AI** : Reçoit les infos user via headers
3. **Fonctions** : Filtrent par `user_id` dans les requêtes SQL

### Headers Passés
```typescript
headers: {
  'Content-Type': 'application/json',
  'X-User-Id': request.user_id,        // UUID de l'utilisateur
  'X-User-Role': request.user_role,    // AFFRETEUR, TRANSPORTEUR, CLIENT, ADMIN
  'X-User-Email': request.user_email,  // Email de l'utilisateur
}
```

### Fallback en Développement
Si aucun header n'est fourni, le service AI utilise un utilisateur par défaut :
```python
if settings.environment == "development":
    return {
        "id": x_user_id if x_user_id else "1",
        "email": x_user_email or "dev@tsa.com",
        "role": x_user_role or "admin"
    }
```

## 🧪 Tests d'Intégration

### Test via Monolithe (Recommandé)
```bash
# 1. Obtenir un token
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jean.affreteur@example.com", "password": "password"}'

# 2. Utiliser le chatbot
curl -X POST http://localhost:3333/api/common/chatbot/query \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Quelles sont mes missions ?"}'
```

### Test Direct Service AI (Développement)
```bash
curl -X POST http://localhost:8000/api/ai/chatbot/query \
  -H "X-User-Id: 399f2fb8-06d8-4ab1-be99-a56cfb1d0907" \
  -H "X-User-Role: AFFRETEUR" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Mes missions",
    "user_id": "399f2fb8-06d8-4ab1-be99-a56cfb1d0907",
    "user_role": "AFFRETEUR"
  }'
```

## 📊 Logs et Monitoring

### Logs Monolithe
```typescript
logger.info('Chatbot query received', {
  userId: user.id,
  userRole: user.role,
  userEmail: user.email,
  messageLength: message.length,
})

logger.info(`🔍 PAYLOAD: user_id=${user_id} user_role=${user_role}`)
```

### Logs Service AI
```python
logger.info(f"[process_message] RECEIVED: user_id={user_id} user_role={user_role}")
logger.info(f"LLM called function: {function_name} with {function_args}")
```

## ⚙️ Configuration

### Variables d'Environnement Monolithe
```env
AI_SERVICE_URL=http://tsa-ai:8000
AI_SERVICE_TIMEOUT=15000  # 15 secondes
```

### Variables d'Environnement Service AI
```env
ENVIRONMENT=development
GROQ_API_KEY=your_api_key
DATABASE_URL=postgresql://...
```

## 🔄 Flux de Données Complet

### Exemple : "Quelles sont mes missions ?"

1. **Frontend** → Monolithe
   ```json
   POST /api/common/chatbot/query
   Authorization: Bearer eyJhbGc...
   {
     "message": "Quelles sont mes missions ?"
   }
   ```

2. **Monolithe** → Service AI
   ```json
   POST /api/ai/chatbot/query
   X-User-Id: 399f2fb8-06d8-4ab1-be99-a56cfb1d0907
   X-User-Role: AFFRETEUR
   {
     "message": "Quelles sont mes missions ?",
     "user_id": "399f2fb8-06d8-4ab1-be99-a56cfb1d0907",
     "user_role": "AFFRETEUR",
     "user_token": "Bearer eyJhbGc..."
   }
   ```

3. **Service AI** → LLM (Groq)
   ```json
   POST https://api.groq.com/openai/v1/chat/completions
   {
     "model": "llama-3.3-70b-versatile",
     "messages": [...],
     "functions": [17 fonctions disponibles],
     "function_call": "auto"
   }
   ```

4. **LLM** → Service AI
   ```json
   {
     "function_call": {
       "name": "get_user_missions",
       "arguments": "{}"
     }
   }
   ```

5. **Service AI** → Base de Données
   ```sql
   SELECT m.id, m.titre as title, m.status, ...
   FROM missions m
   LEFT JOIN addresses ad ON m.adresse_depart_id = ad.id
   LEFT JOIN addresses aa ON m.adresse_arrivee_id = aa.id
   WHERE m.affreteur_id = '399f2fb8-06d8-4ab1-be99-a56cfb1d0907'
   ORDER BY created_at DESC LIMIT 10
   ```

6. **Service AI** → LLM (avec résultats)
   ```json
   {
     "messages": [...],
     "function_result": {
       "success": true,
       "missions": [10 missions],
       "total": 10
     }
   }
   ```

7. **LLM** → Service AI (réponse finale)
   ```json
   {
     "message": "Tu as 10 missions, notamment 'Mission 1', 'Mission 2'..."
   }
   ```

8. **Service AI** → Monolithe
   ```json
   {
     "message": "Tu as 10 missions...",
     "suggestions": ["Créer une mission", "Mes missions"],
     "navigation": {"path": "/app/missions"},
     "requires_human": false
   }
   ```

9. **Monolithe** → Frontend
   ```json
   {
     "success": true,
     "message": "Tu as 10 missions...",
     "suggestions": [...],
     "navigation": {...}
   }
   ```

## ✅ Vérification de l'Intégration

### Checklist
- ✅ Monolithe peut appeler le service AI
- ✅ Headers user correctement passés
- ✅ Token Authorization transmis
- ✅ 17 fonctions disponibles
- ✅ Filtrage par user_id dans toutes les requêtes
- ✅ Restrictions de rôle appliquées
- ✅ Mode READ-ONLY strict
- ✅ Gestion d'erreurs complète
- ✅ Logs détaillés

### Points de Vigilance
1. ⚠️ **Rate Limit Groq** : Limité à X requêtes/minute
2. ⚠️ **Timeout** : 15 secondes max par requête
3. ⚠️ **Headers** : Doivent être présents en production
4. ⚠️ **Conversation ID** : Utiliser user_id par défaut pour la sécurité

## 🚀 Prochaines Étapes

1. ✅ Tester toutes les fonctions via le monolithe
2. ⏳ Ajouter des tests d'intégration automatisés
3. ⏳ Monitorer les performances (temps de réponse)
4. ⏳ Implémenter un cache pour les requêtes fréquentes
5. ⏳ Ajouter des métriques détaillées

## 📝 Conclusion

**Toutes les 17 fonctions du chatbot sont accessibles via le monolithe** avec :
- ✅ Authentification sécurisée
- ✅ Transmission correcte des informations utilisateur
- ✅ Filtrage par user_id
- ✅ Restrictions de rôle
- ✅ Mode READ-ONLY

L'intégration est **complète et fonctionnelle** ! 🎉
