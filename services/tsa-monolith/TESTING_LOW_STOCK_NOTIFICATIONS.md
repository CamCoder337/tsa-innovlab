# Guide de Test - Notifications de Stock Faible

## 🎯 Fonctionnalité Implémentée

Système de notification **temps réel** envoyant automatiquement :
- ✉️ **Email** avec template `low_stock_alert.edge`
- 🔔 **Notification in-app** via système de notifications
- ⚡ **WebSocket temps réel** (priorité HIGH) pour les admins connectés

Déclenchement : **Automatique** dès qu'un produit passe sous son seuil d'alerte (`stock <= stockAlert`)

## 📋 Prérequis

1. **Redis** en cours d'exécution (pour les notifications et emails)
2. **Email Worker** actif : `node ace email:worker`
3. **Au moins un utilisateur admin actif** dans la base de données
4. **Configuration email** correcte dans `.env`

## 🧪 Scénarios de Test

### Test 1 : Mise à jour manuelle d'un produit existant

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

2. **Démarrer le worker d'emails** (dans un autre terminal) :
   ```bash
   node ace email:worker
   ```

3. **Identifier un produit** avec stock > stockAlert :
   ```bash
   # Via endpoint API
   GET http://localhost:3333/api/admin/products
   ```

4. **Mettre à jour le stock** pour qu'il passe sous le seuil :
   ```bash
   PUT http://localhost:3333/api/admin/products/{productId}
   Content-Type: application/json
   Authorization: Bearer {admin_token}

   {
     "stock": 3  // Si stockAlert = 5, cela déclenchera l'alerte
   }
   ```

5. **Vérifier les logs du serveur** :
   ```
   ✅ Recherchez : "Low stock alert sent to X admin(s) for product: {productName}"
   ```

6. **Vérifier la queue Redis** :
   ```bash
   redis-cli LLEN notifications
   redis-cli LLEN email_queue
   ```

7. **Vérifier l'email reçu** :
   - Ouvrir la boîte mail de l'admin
   - Chercher : "⚠️ Alerte Stock Faible - Action Requise"
   - Vérifier le contenu du template

### Test 2 : Création d'un nouveau produit avec stock faible

1. **Créer un produit directement en stock faible** :
   ```bash
   POST http://localhost:3333/api/admin/products
   Content-Type: application/json
   Authorization: Bearer {admin_token}

   {
     "name": "Produit Test Stock Faible",
     "price": 10000,
     "stock": 2,
     "stockAlert": 5,
     "unit": "pièce",
     "categoryId": "{category_id}"
   }
   ```

   ⚠️ **Note** : La notification n'est envoyée que lors de la **mise à jour** (hook `@beforeUpdate()`), pas à la création.

2. **Ensuite mettre à jour** pour déclencher :
   ```bash
   PUT http://localhost:3333/api/admin/products/{productId}
   Content-Type: application/json

   {
     "stock": 1  // Diminuer encore plus
   }
   ```

### Test 3 : Vérifier plusieurs admins reçoivent l'alerte

1. **Créer plusieurs utilisateurs admin** :
   ```bash
   node ace create:test-users
   ```

2. **Vérifier qu'ils sont actifs** :
   ```sql
   SELECT id, email, role, status FROM users WHERE role = 'admin' AND status = 'active';
   ```

3. **Déclencher une alerte** (Test 1)

4. **Vérifier que TOUS les admins** ont reçu :
   - Un email
   - Une notification dans leur queue Redis

### Test 4 : Vérifier la notification temps réel WebSocket

1. **S'abonner au canal Redis de l'admin** :
   ```bash
   redis-cli SUBSCRIBE "user:{admin_user_id}:notifications"
   ```

2. **Déclencher une alerte** (dans un autre terminal)

3. **Vérifier la réception immédiate** :
   ```json
   {
     "userId": "...",
     "type": "low_stock_alert",
     "title": "⚠️ Alerte Stock Faible",
     "message": "Le produit \"...\" a un stock faible (X unités restantes)",
     "priority": "high",
     "data": {
       "productName": "...",
       "stockCurrent": 3,
       "stockAlertThreshold": 5,
       "productId": "..."
     }
   }
   ```

## 🔍 Points de Vérification

### Logs Serveur
- ✅ `Low stock alert sent to X admin(s) for product: {name}`
- ✅ Pas d'erreur `Failed to send low stock notifications`

### Base de Données
```sql
-- Vérifier l'AuditLog
SELECT * FROM audit_logs
WHERE action = 'stock.low_alert'
ORDER BY created_at DESC
LIMIT 5;
```

### Redis
```bash
# Vérifier queue des notifications
redis-cli LLEN notifications

# Vérifier queue des emails
redis-cli LLEN email_queue

# Voir les notifications en attente
redis-cli LRANGE notifications 0 -1
```

### Email
- ✅ Subject : "⚠️ Alerte Stock Faible - Action Requise"
- ✅ Template : Tableau HTML avec nom produit + quantité restante
- ✅ Lien vers dashboard : `{FRONTEND_URL}/admin/products`
- ✅ Date/heure de l'alerte

## 🐛 Dépannage

### Aucune notification envoyée

1. **Vérifier que Redis est actif** :
   ```bash
   redis-cli ping
   # Réponse attendue : PONG
   ```

2. **Vérifier les admins actifs** :
   ```bash
   node ace diagnose
   ```

3. **Vérifier les logs d'erreur** :
   ```bash
   # Rechercher dans les logs
   grep "Failed to send low stock notifications" tmp/logs/*
   ```

### Emails non reçus

1. **Vérifier que le worker tourne** :
   ```bash
   # Vérifier les process
   ps aux | grep "email:worker"
   ```

2. **Tester l'envoi d'email direct** :
   ```bash
   node ace test:email
   ```

3. **Vérifier la configuration SMTP** :
   ```bash
   # Dans .env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=...
   SMTP_PASSWORD=...
   ```

### Notifications WebSocket non reçues

1. **Vérifier la priorité** (doit être HIGH) :
   ```typescript
   // Dans notification_service.ts
   low_stock_alert: 'high',
   ```

2. **Vérifier le canal Redis** :
   ```bash
   redis-cli PUBSUB CHANNELS "user:*:notifications"
   ```

## 📊 Cas Limites

### Stock = stockAlert exactement
✅ **Alerte envoyée** (condition : `stock <= stockAlert`)

### Stock déjà sous le seuil
❌ **Pas d'alerte** (condition : `oldStock > stockAlert` ET `stock <= stockAlert`)

### Plusieurs mises à jour successives
✅ **Alerte à chaque fois** (pas de déduplication selon le choix utilisateur)

### Aucun admin actif
⚠️ **Pas d'alerte** mais log d'erreur si admins.length === 0

## ✅ Checklist de Validation

- [ ] Code compile sans erreur (`npm run typecheck`)
- [ ] Serveur démarre sans erreur (`npm run dev`)
- [ ] Email worker démarre (`node ace email:worker`)
- [ ] Redis accessible et actif
- [ ] Mise à jour stock → Log "Low stock alert sent to X admin(s)"
- [ ] AuditLog créé avec action `stock.low_alert`
- [ ] Notification ajoutée à la queue Redis
- [ ] Email envoyé à tous les admins actifs
- [ ] Template email correct (tableau produits)
- [ ] WebSocket push pour priorité HIGH

## 📝 Notes Importantes

1. **Hook `@beforeUpdate()` uniquement** : Les notifications sont envoyées uniquement lors de la mise à jour d'un produit existant, pas à la création.

2. **Pas de déduplication** : Une alerte est envoyée à chaque mise à jour si le stock reste sous le seuil.

3. **Tous les admins** : Tous les utilisateurs avec `role = 'admin'` ET `status = 'active'` reçoivent l'alerte.

4. **Format email** : Le template attend un tableau de produits, nous envoyons donc un tableau avec un seul élément.

5. **Priorité HIGH** : Les notifications ont la priorité `high`, ce qui signifie qu'elles sont aussi poussées en temps réel via WebSocket.

---

**Implémenté par** : Claude Code
**Date** : 2025-10-19
**Version** : 1.0.0
