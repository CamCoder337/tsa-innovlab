# Design Document - Chatbot Cleanup & Fix

## Overview

This design document outlines the technical approach to clean up the chatbot architecture by removing dead code (V3, V4 services) and fixing the Function Calling service to read real data from the database with accurate navigation hints aligned to frontend routes.

**Goals:**
- Single source of truth: `chatbot_function_calling_service.py`
- Real data reads from PostgreSQL database
- Navigation hints that match actual React Router routes
- Secure conversation history isolation by user_id
- Clean, maintainable codebase

## Architecture

### Current State (Problematic)

```
┌─────────────────────────────────────────────────────────────┐
│                    CHATBOT SERVICES (3)                      │
├─────────────────────────────────────────────────────────────┤
│ 1. intelligent_chatbot_service.py (V3) - 1318 lines ❌ DEAD │
│ 2. intelligent_chatbot_v4_service.py (V4) - 1174 lines ❌ DEAD│
│ 3. chatbot_function_calling_service.py - 2000 lines ✅ USED │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              intelligent_chatbot.py (Endpoint)               │
│  - Imports get_chatbot_function_calling() ✅                │
│  - But V3/V4 still exist in codebase                        │
└─────────────────────────────────────────────────────────────┘
```

### Target State (Clean)

```
┌─────────────────────────────────────────────────────────────┐
│           SINGLE CHATBOT SERVICE                             │
│   chatbot_function_calling_service.py (ENHANCED)            │
│   - Pure Function Calling (READ-ONLY)                       │
│   - Real DB reads (shipments, orders, cart, missions)       │
│   - Accurate navigation hints (/app/shop/product/{id})      │
│   - Secure history isolation (user_id only)                 │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Function Handlers

Each handler will be upgraded to read real data from PostgreSQL.

#### 1.1 Track Shipment Handler (BEFORE vs AFTER)

**BEFORE (Fake):**
```python
async def _handle_track_shipment(self, args, user_id, user_role, token):
    shipment_id = args.get("shipment_id")
    return {
        "success": True,
        "shipment_id": shipment_id,
        "message": f"Voici le suivi de ton colis #{shipment_id}",
        "navigation_required": True  # ← NO REAL DATA
    }
```

**AFTER (Real):**
```python
async def _handle_track_shipment(self, args, user_id, user_role, token):
    shipment_id = args.get("shipment_id")
    
    from app.core.database import SessionLocal
    from sqlalchemy import text
    
    db = SessionLocal()
    try:
        query = text("""
            SELECT m.id, m.status, m.title,
                   ad.city as origin, aa.city as destination,
                   m.current_location, m.estimated_delivery_date
            FROM missions m
            LEFT JOIN addresses ad ON m.adresse_depart_id = ad.id
            LEFT JOIN addresses aa ON m.adresse_arrivee_id = aa.id
            WHERE m.id = :mission_id
              AND (m.affreteur_id = :user_id OR m.transporteur_id = :user_id)
        """)
        
        result = db.execute(query, {
            "mission_id": shipment_id,
            "user_id": user_id
        }).fetchone()
        
        if not result:
            return {"success": False, "error": "Mission non trouvée"}
        
        return {
            "success": True,
            "mission": {
                "id": result.id,
                "status": result.status,
                "title": result.title,
                "origin": result.origin,
                "destination": result.destination,
                "current_location": result.current_location,
                "estimated_delivery": result.estimated_delivery_date
            }
        }
    finally:
        db.close()
```

#### 1.2 Get Cart Handler

```python
async def _handle_get_cart(self, args, user_id, user_role, token):
    from app.core.database import SessionLocal
    from sqlalchemy import text
    
    db = SessionLocal()
    try:
        query = text("""
            SELECT ci.id, ci.quantity,
                   p.id as product_id, p.name, p.price, p.stock_quantity
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = :user_id
        """)
        
        results = db.execute(query, {"user_id": user_id}).fetchall()
        
        items = []
        total = 0
        for r in results:
            item_total = r.price * r.quantity
            total += item_total
            items.append({
                "id": r.id,
                "product_id": r.product_id,
                "name": r.name,
                "price": float(r.price),
                "quantity": r.quantity,
                "subtotal": float(item_total)
            })
        
        return {
            "success": True,
            "cart": {
                "items": items,
                "items_count": len(items),
                "total": float(total)
            }
        }
    finally:
        db.close()
```

#### 1.3 Get My Orders Handler

```python
async def _handle_get_my_orders(self, args, user_id, user_role, token):
    from app.core.database import SessionLocal
    from sqlalchemy import text
    
    db = SessionLocal()
    try:
        status_filter = args.get("status", "all")
        limit = min(args.get("limit", 10), 20)
        
        query_text = """
            SELECT o.id, o.order_number, o.status, o.total_amount,
                   o.created_at, COUNT(oi.id) as items_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = :user_id
        """
        
        params = {"user_id": user_id}
        
        if status_filter != "all":
            query_text += " AND o.status = :status"
            params["status"] = status_filter
        
        query_text += " GROUP BY o.id ORDER BY o.created_at DESC LIMIT :limit"
        params["limit"] = limit
        
        results = db.execute(text(query_text), params).fetchall()
        
        orders = []
        for r in results:
            orders.append({
                "id": r.id,
                "order_number": r.order_number,
                "status": r.status,
                "total": float(r.total_amount),
                "items_count": r.items_count,
                "created_at": r.created_at.isoformat()
            })
        
        return {
            "success": True,
            "orders": orders,
            "total_found": len(orders)
        }
    finally:
        db.close()
```

### 2. Navigation Hints Mapping

Based on `apps/frontend-web/src/App.tsx` analysis:


```python
def _get_navigation_hint(self, function_name: str, result: Dict) -> Optional[Dict]:
    """
    Generate navigation hints aligned with React Router routes
    Routes from: apps/frontend-web/src/App.tsx
    """
    
    # Dynamic navigation based on function result
    if function_name == "track_shipment":
        mission_id = result.get("mission", {}).get("id")
        if mission_id:
            return {
                "route": f"/app/mission/{mission_id}/tracking",
                "label": "Voir le tracking en temps réel",
                "description": "Suivi sur carte interactive"
            }
    
    elif function_name == "get_product_details":
        product_id = result.get("product", {}).get("id")
        if product_id:
            return {
                "route": f"/app/shop/product/{product_id}",
                "label": "Voir le produit",
                "description": "Détails complets et ajout au panier"
            }
    
    elif function_name == "get_order_details":
        order_id = result.get("order", {}).get("id")
        if order_id:
            return {
                "route": f"/app/shop/order/{order_id}",
                "label": "Voir la commande",
                "description": "Détails et statut de livraison"
            }
    
    elif function_name == "calculate_price":
        pricing = result.get("pricing", {})
        if pricing:
            return {
                "route": "/app/missions/create",
                "label": "Créer cette mission",
                "description": f"{pricing.get('origin')} → {pricing.get('destination')}",
                "prefill": {
                    "origin": pricing.get("origin"),
                    "destination": pricing.get("destination"),
                    "weight_kg": pricing.get("weight_kg"),
                    "budget_max": pricing.get("price")
                }
            }
    
    elif function_name == "get_cart":
        cart_count = result.get("cart", {}).get("items_count", 0)
        if cart_count > 0:
            return {
                "route": "/app/shop/cart",
                "label": "Voir mon panier",
                "description": f"{cart_count} article(s)"
            }
        else:
            return {
                "route": "/app/shop",
                "label": "Voir le catalogue",
                "description": "Ton panier est vide"
            }
    
    # Static navigation map
    navigation_map = {
        "get_my_orders": {
            "route": "/app/shop/orders",
            "label": "Voir toutes mes commandes",
            "description": "Historique complet"
        },
        "get_user_missions": {
            "route": "/app/missions",
            "label": "Voir toutes mes missions",
            "description": "Gérer mes missions"
        },
        "get_my_vehicles": {
            "route": "/app/vehicles",
            "label": "Gérer mes véhicules",
            "description": "Ajouter ou modifier"
        },
        "get_my_profile": {
            "route": "/app/profile",
            "label": "Voir mon profil",
            "description": "Paramètres du compte"
        },
        "search_products": {
            "route": "/app/shop",
            "label": "Voir le catalogue",
            "description": "Tous les produits disponibles"
        }
    }
    
    return navigation_map.get(function_name)
```

### 3. Conversation History Isolation

**Security Fix: Force conversation_id = user_id**


```python
async def process_message(
    self,
    message: str,
    user_id: str,
    user_role: Optional[str] = None,
    user_token: Optional[str] = None,
    conversation_id: Optional[str] = None,  # ← IGNORED for security
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Process message with pure function calling
    
    SECURITY: conversation_id is FORCED to user_id to prevent
    users from accessing other users' conversation history
    """
    
    user_role_normalized = user_role.upper() if user_role else "CLIENT"
    
    # 🔒 SECURITY FIX: Force conversation_id = user_id
    conv_id = user_id  # ← ALWAYS use user_id, ignore client input
    
    # ... rest of the logic
```

**Memory Storage Update:**

```python
def _save_to_memory(self, conversation_id: str, user_message: str, assistant_message: str):
    """
    Save conversation to memory for context
    
    NOTE: conversation_id is always equal to user_id (enforced in process_message)
    so there's no risk of cross-user data leakage
    """
    if conversation_id not in self.conversation_memory:
        self.conversation_memory[conversation_id] = []
    
    # Add user message
    self.conversation_memory[conversation_id].append({
        "role": "user",
        "content": user_message,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Add assistant message
    self.conversation_memory[conversation_id].append({
        "role": "assistant",
        "content": assistant_message,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Keep only last N messages
    if len(self.conversation_memory[conversation_id]) > self.max_history_length * 2:
        self.conversation_memory[conversation_id] = \
            self.conversation_memory[conversation_id][-self.max_history_length * 2:]
```

## Data Models

### Database Tables Used

#### 1. missions
```sql
SELECT m.id, m.status, m.title,
       ad.city as origin, aa.city as destination,
       m.current_location, m.estimated_delivery_date,
       m.affreteur_id, m.transporteur_id
FROM missions m
LEFT JOIN addresses ad ON m.adresse_depart_id = ad.id
LEFT JOIN addresses aa ON m.adresse_arrivee_id = aa.id
```

#### 2. cart_items + products
```sql
SELECT ci.id, ci.quantity,
       p.id as product_id, p.name, p.price, p.stock_quantity
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.user_id = :user_id
```

#### 3. orders + order_items
```sql
SELECT o.id, o.order_number, o.status, o.total_amount,
       o.created_at, COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = :user_id
```

#### 4. vehicles
```sql
SELECT v.id, v.type, v.immatriculation, v.capacity_kg,
       v.status, v.current_location
FROM vehicles v
WHERE v.transporteur_id = :user_id
```

#### 5. products
```sql
SELECT id, name, price, stock_quantity, brand, category
FROM products
WHERE stock_quantity > 0
  AND LOWER(name) LIKE LOWER(:query)
```

## Error Handling

### 1. Database Connection Errors


```python
try:
    db = SessionLocal()
    try:
        # Query logic
        result = db.execute(query, params).fetchone()
        return {"success": True, "data": result}
    finally:
        db.close()  # ← ALWAYS close connection
except Exception as e:
    logger.error(f"Database error in {function_name}: {e}", exc_info=True)
    return {
        "success": False,
        "error": "Erreur lors de la récupération des données",
        "error_type": "database_error"
    }
```

### 2. Not Found Errors

```python
if not result:
    return {
        "success": False,
        "error": f"Mission #{mission_id} non trouvée ou tu n'y as pas accès",
        "error_type": "not_found"
    }
```

### 3. Permission Errors

```python
# Check permission BEFORE executing
if not self._check_permission(function_name, user_role):
    return {
        "success": False,
        "error": f"Tu n'as pas la permission d'utiliser cette fonction (rôle: {user_role})",
        "error_type": "permission_denied"
    }
```

## Testing Strategy

### 1. Unit Tests for Handlers

```python
# tests/test_chatbot_handlers.py

@pytest.mark.asyncio
async def test_track_shipment_returns_real_data():
    """Verify track_shipment reads from database"""
    # Setup: Create test mission
    mission_id = create_test_mission(
        affreteur_id="user_123",
        origin="Douala",
        destination="Yaoundé",
        status="in_progress"
    )
    
    # Execute
    service = ChatbotFunctionCallingService()
    result = await service._handle_track_shipment(
        args={"shipment_id": mission_id},
        user_id="user_123",
        user_role="AFFRETEUR",
        token="test_token"
    )
    
    # Assert
    assert result["success"] == True
    assert result["mission"]["id"] == mission_id
    assert result["mission"]["origin"] == "Douala"
    assert result["mission"]["destination"] == "Yaoundé"
    assert result["mission"]["status"] == "in_progress"
```

### 2. Navigation Hints Tests

```python
def test_navigation_hints_match_frontend_routes():
    """Verify navigation hints use correct React Router paths"""
    service = ChatbotFunctionCallingService()
    
    # Test product detail
    hint = service._get_navigation_hint(
        "get_product_details",
        {"product": {"id": "prod-123"}}
    )
    assert hint["route"] == "/app/shop/product/prod-123"
    
    # Test mission tracking
    hint = service._get_navigation_hint(
        "track_shipment",
        {"mission": {"id": "M-456"}}
    )
    assert hint["route"] == "/app/mission/M-456/tracking"
    
    # Test cart
    hint = service._get_navigation_hint(
        "get_cart",
        {"cart": {"items_count": 3}}
    )
    assert hint["route"] == "/app/shop/cart"
```

### 3. Security Tests

```python
@pytest.mark.asyncio
async def test_conversation_history_isolation():
    """Verify users cannot access other users' history"""
    service = ChatbotFunctionCallingService()
    
    # User A sends message
    await service.process_message(
        message="Mon secret: 1234",
        user_id="user_A",
        conversation_id="malicious_shared_id"  # ← Ignored
    )
    
    # User B tries to access with same conversation_id
    response = await service.process_message(
        message="Quel était le dernier message ?",
        user_id="user_B",
        conversation_id="malicious_shared_id"  # ← Ignored
    )
    
    # Assert: User B should NOT see User A's message
    assert "1234" not in response["message"]
    assert "secret" not in response["message"].lower()
```

## Migration Plan

### Phase 1: Cleanup (Low Risk)


**Files to DELETE:**
```bash
# Services (dead code)
services/tsa-ai/app/services/intelligent_chatbot_service.py
services/tsa-ai/app/services/intelligent_chatbot_v4_service.py

# Documentation (obsolete)
services/tsa-ai/DEPLOYMENT_CHATBOT_V3.md
services/tsa-monolith/CHATBOT_V4_MIGRATION_GUIDE.md

# Tests (for dead code)
services/tsa-ai/scripts/test_chatbot_v3.py

# Examples (obsolete)
services/tsa-ai/examples/chatbot_streaming_frontend.tsx  # If V3/V4 specific
```

**Files to UPDATE:**
```bash
# Remove imports
services/tsa-ai/app/endpoints/intelligent_chatbot.py
  - Remove any V3/V4 imports (already clean)

# Update tests
services/tsa-ai/tests/test_chatbot_read_only.py
  - Remove V4 isolation tests (use in-memory now)
  
services/tsa-ai/scripts/verify_chatbot_read_only.py
  - Remove V4 references
```

### Phase 2: Enhance Handlers (Medium Risk)

**Order of implementation:**
1. `_handle_track_shipment` - Most critical
2. `_handle_get_cart` - High usage
3. `_handle_get_my_orders` - High usage
4. `_handle_get_user_missions` - Medium usage
5. `_handle_get_my_vehicles` - Low usage
6. `_handle_get_order_details` - Medium usage
7. `_handle_get_product_details` - Already implemented

**Testing approach:**
- Write test FIRST for each handler
- Implement handler
- Run test to verify
- Manual QA with real data

### Phase 3: Fix Navigation Hints (Low Risk)

**Update `_get_navigation_hint()` method:**
- Replace all routes with `/app/*` prefix
- Test each route manually in browser
- Update tests to verify routes

### Phase 4: Security Fix (Critical)

**Update `process_message()` method:**
```python
# BEFORE
conv_id = conversation_id or user_id

# AFTER
conv_id = user_id  # ← ALWAYS use user_id
```

**Impact:** Zero - conversation_id is already defaulted to user_id in controller

### Phase 5: Update Tests (Low Risk)

**New tests to add:**
- Real data read tests for each handler
- Navigation hints route validation
- Security isolation test

**Tests to remove:**
- V4 database isolation tests (no longer relevant)

## Performance Considerations

### 1. Database Query Optimization

**Use indexes:**
```sql
-- Ensure these indexes exist
CREATE INDEX idx_missions_user ON missions(affreteur_id, transporteur_id);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_vehicles_user ON vehicles(transporteur_id);
```

**Limit results:**
```python
# Always use LIMIT in queries
query += " LIMIT :limit"
params["limit"] = min(requested_limit, 20)  # Max 20 results
```

### 2. Connection Pooling

SQLAlchemy SessionLocal already uses connection pooling.
Ensure `finally: db.close()` is ALWAYS called.

### 3. Caching (Future Enhancement)

Consider caching for:
- Product searches (5 min TTL)
- User profile data (10 min TTL)
- Vehicle lists (15 min TTL)

Not needed for MVP, but good for scale.

## Rollback Plan

If issues arise after deployment:

**Step 1: Revert code changes**
```bash
git revert <commit-hash>
git push origin main
```

**Step 2: Redeploy previous version**
```bash
docker-compose down
docker-compose up -d --build
```

**Step 3: Verify service health**
```bash
curl http://localhost:8000/api/ai/chatbot/health
```

**Recovery time:** < 5 minutes

## Success Metrics

### Code Quality
- ✅ Lines of code reduced by ~2500 (V3 + V4 removal)
- ✅ Zero dead code in chatbot services
- ✅ 100% test coverage for handlers

### Functionality
- ✅ All handlers return real data from DB
- ✅ All navigation hints match frontend routes
- ✅ Zero cross-user data leakage

### Performance
- ✅ Response time < 2s for function calls
- ✅ Database queries < 100ms
- ✅ Zero memory leaks

## Conclusion

This design provides a clear path to:
1. **Clean up** dead code (V3, V4)
2. **Fix** handlers to read real data
3. **Align** navigation hints with frontend
4. **Secure** conversation history

The migration is low-risk with clear rollback procedures.
