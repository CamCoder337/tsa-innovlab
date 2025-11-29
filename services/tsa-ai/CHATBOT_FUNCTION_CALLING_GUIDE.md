# Chatbot Function Calling - Guide Complet

## 🎯 Architecture Actuelle

**Version :** 1.0.0  
**Service Unique :** `chatbot_function_calling_service.py`

Le chatbot TSA utilise une architecture **Pure Function Calling** avec :
- ✅ 14 fonctions READ-ONLY
- ✅ Lecture de données réelles depuis PostgreSQL
- ✅ Navigation hints alignés avec React Router (vérifiés dans `App.tsx`)
- ✅ Suggestions contextuelles intelligentes
- ✅ Historique persistant dans PostgreSQL
- ✅ Rate limiting avec PostgreSQL
- ✅ Streaming SSE support

## 📡 Endpoints API

### POST `/api/ai/chatbot/query`
Chatbot standard (non-streaming)

**Request:**
```json
{
  "message": "créer une mission",
  "user_id": "user-123",
  "user_role": "affreteur",
  "user_token": "Bearer xxx",
  "conversation_id": "optional",
  "context": {}
}
```

**Response:**
```json
{
  "message": "🚚 Création de mission en cours ! Pour confirmer...",
  "suggestions": ["Créer une mission", "Calculer un autre prix", "Mes missions"],
  "navigation": {
    "route": "/app/missions/create",
    "label": "Créer une mission",
    "description": "Formulaire de création"
  },
  "requires_human": false,
  "processing_time_ms": 1234.56,
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### POST `/api/ai/chatbot/query/stream`
Chatbot avec streaming SSE (Server-Sent Events)

**Benefits:**
- First token < 500ms
- ChatGPT-like experience
- 60% reduction in perceived latency

## 🔧 Fonctions Disponibles (READ-ONLY)

### Produits & Catalogue


1. **search_products** - Rechercher des pièces détachées
2. **get_product_details** - Détails complets d'un produit

### Panier & Commandes
3. **get_cart** - Voir le contenu du panier
4. **get_my_orders** - Liste des commandes
5. **get_order_details** - Détails d'une commande

### Missions Transport
6. **get_user_missions** - Mes missions (créées ou assignées)
7. **get_available_missions** - Missions disponibles (transporteurs)
8. **track_shipment** - Tracking d'une mission
9. **calculate_price** - Calculer un tarif de transport

### Véhicules
10. **get_my_vehicles** - Mes véhicules (transporteurs)

### Messages & Notifications
11. **get_unread_messages** - Messages non lus
12. **get_notifications** - Notifications récentes

### Profil
13. **get_my_profile** - Informations du profil

### Utilitaires
14. **request_clarification** - Demander une clarification

## 🧭 Navigation Hints

Tous les hints utilisent le préfixe `/app/*` aligné avec React Router.

### Routes Frontend Mappées

| Fonction | Route | Description |
|----------|-------|-------------|
| `track_shipment` | `/app/mission/{id}/tracking` | Tracking en temps réel |
| `get_product_details` | `/app/shop/product/{id}` | Détails produit |
| `get_order_details` | `/app/shop/order/{id}` | Détails commande |
| `calculate_price` | `/app/missions/create` | Créer mission (prefill) |
| `get_cart` | `/app/shop/cart` | Panier |
| `get_my_orders` | `/app/shop/orders` | Mes commandes |
| `get_user_missions` | `/app/missions` | Mes missions |
| `get_my_vehicles` | `/app/vehicles` | Mes véhicules |
| `get_my_profile` | `/app/profile` | Mon profil |
| `search_products` | `/app/shop` | Catalogue |

### Hints Contextuels (Sans Function Call)

Le chatbot génère aussi des hints basés sur le contexte de la conversation :

```python
# Si le bot parle de création de mission
→ navigation: {route: "/app/missions/create", label: "Créer une mission"}

# Si le bot parle de prix/tarif
→ navigation: {route: "/app/missions/create", label: "Créer une mission"}

# Si le bot parle de produits
→ navigation: {route: "/app/shop", label: "Voir le catalogue"}
```

## 💡 Suggestions Intelligentes

Les suggestions sont générées en analysant :
1. **Le message de l'utilisateur** (intent)
2. **La réponse du bot** (contexte)
3. **Le rôle de l'utilisateur** (permissions)

### Exemples

**Cas 1: Calcul de prix**
```
User: "Combien pour Douala-Yaoundé 500kg ?"
Bot: "Pour 500kg Douala → Yaoundé, ça coûte 125,000 FCFA..."
Suggestions: ["Créer une mission", "Calculer un autre prix", "Mes missions"]
```

**Cas 2: Recherche produit**
```
User: "Tu as des amortisseurs ?"
Bot: "J'ai 3 amortisseurs en stock..."
Suggestions: ["Voir le catalogue", "Rechercher un produit", "Mon panier"]
```

**Cas 3: Tracking**
```
User: "Où est mon colis #123 ?"
Bot: "Ton colis est à Douala, en route vers Yaoundé..."
Suggestions: ["Voir le tracking", "Mes missions", "Contacter le transporteur"]
```

## 🔒 Sécurité

### Isolation de l'Historique

```python
# conversation_id est FORCÉ à user_id
conv_id = user_id  # ← Ignore client input

# Impossible d'accéder à l'historique d'un autre utilisateur
```

### Permissions par Rôle

Chaque fonction vérifie les permissions avant exécution :

```python
def _check_permission(self, function_name: str, user_role: str) -> bool:
    permissions = self._get_function_permissions()
    allowed_roles = permissions.get(function_name, [])
    return user_role in allowed_roles
```

## 🧪 Tests

### Vérification READ-ONLY
```bash
cd services/tsa-ai
python scripts/verify_chatbot_read_only.py
```

### Tests Unitaires
```bash
pytest tests/test_chatbot_read_only.py -v
```

### Test Manuel
```bash
python scripts/test_function_calling.py
```

## 🚀 Déploiement

Le service démarre automatiquement avec :
```bash
docker-compose up -d tsa-ai
```

Vérifier la santé :
```bash
curl http://localhost:8000/api/ai/chatbot/health
```

## 📊 Monitoring

### Métriques Disponibles

GET `/api/ai/chatbot/metrics`

```json
{
  "total_queries": 1234,
  "successful_queries": 1200,
  "errors": 34,
  "error_rate": 2.75,
  "avg_response_time_ms": 1456.78,
  "function_calls": {
    "search_products": 450,
    "calculate_price": 320,
    "track_shipment": 180
  },
  "most_used_functions": [
    ["search_products", 450],
    ["calculate_price", 320],
    ["track_shipment", 180]
  ]
}
```

## 🔄 Intégration Frontend

### Utiliser les Navigation Hints

```typescript
// Dans le composant Chatbot
if (response.navigation) {
  const { route, label, description, prefill } = response.navigation;
  
  // Afficher un bouton
  <Button onClick={() => {
    if (prefill) {
      // Pré-remplir le formulaire
      navigate(route, { state: { prefill } });
    } else {
      navigate(route);
    }
  }}>
    {label}
  </Button>
}
```

### Afficher les Suggestions

```typescript
{response.suggestions.map((suggestion, index) => (
  <Button
    key={index}
    variant="outline"
    onClick={() => sendMessage(suggestion)}
  >
    {suggestion}
  </Button>
))}
```

## ⚠️ Notes Importantes

1. **Le chatbot est READ-ONLY** : Il ne peut pas créer/modifier/supprimer de données
2. **Il guide vers les pages** : Utilise les navigation hints pour rediriger
3. **Données réelles** : Toutes les fonctions lisent la DB PostgreSQL
4. **Sécurité** : Historique isolé par user_id
5. **Performance** : < 2s pour function calls, < 500ms first token en streaming

## 📚 Documentation

**Documentation principale :** `CHATBOT_README.md` (racine du projet)  
**Ce guide :** Détails techniques des fonctions  
**Tests :** `tests/test_chatbot_read_only.py`  
**Migrations :** `services/tsa-monolith/database/migrations/1763100000000_*`
