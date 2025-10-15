# 🛒 Guide du Flux E-commerce - TSA Logistics

## Vue d'ensemble

Le système e-commerce permet aux clients (grand public) d'acheter des produits via une boutique en ligne avec paiement MTN Mobile Money.

## 🎯 Rôles

- **CLIENT** : Grand public, peut parcourir la boutique, gérer son panier et passer des commandes
- **ADMIN** : Gère les produits, catégories, et peut voir toutes les commandes

## 📊 Flux Complet d'Achat

### Étape 1 : Inscription Client

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "client@example.com",
  "password": "password123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+237650000000",
  "role": "client"
}

# Réponse : user créé avec role CLIENT
```

### Étape 2 : Connexion

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "client@example.com",
  "password": "password123"
}

# Réponse : { accessToken, refreshToken }
```

### Étape 3 : Parcourir le Catalogue (Public - pas d'auth requise)

```bash
# Liste des produits
GET /api/shop/products?page=1&limit=20&inStock=true

# Détails d'un produit
GET /api/shop/products/{productId}

# Catégories
GET /api/shop/categories

# Recherche
GET /api/shop/search?q=laptop&type=products
```

### Étape 4 : Ajouter au Panier (Auth requise - role CLIENT)

```bash
# Voir mon panier
GET /api/client/cart
Authorization: Bearer {accessToken}

# Ajouter un produit
POST /api/client/cart/items
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "productId": "uuid-du-produit",
  "quantity": 2
}

# Modifier la quantité
PUT /api/client/cart/items/{cartItemId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "quantity": 3
}

# Retirer un article
DELETE /api/client/cart/items/{cartItemId}
Authorization: Bearer {accessToken}
```

### Étape 5 : Créer une Adresse (si pas déjà fait)

```bash
# Les adresses de livraison et facturation sont nécessaires
# Créer via l'endpoint approprié (à implémenter si besoin)
```

### Étape 6 : Créer la Commande

```bash
POST /api/client/orders
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "shippingAddressId": "uuid-adresse-livraison",
  "billingAddressId": "uuid-adresse-facturation",
  "paymentMethod": "mtn_mobile_money",
  "notes": "Livraison rapide svp"
}

# Réponse : Order créée avec status PENDING
# Le panier est automatiquement converti et vidé
# Le stock est décrémenté
```

### Étape 7 : Initier le Paiement MTN Mobile Money

```bash
POST /api/client/payments/initiate
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "orderId": "uuid-de-la-commande",
  "phoneNumber": "+237650000000"
}

# Réponse : Payment créé avec status PENDING
# En production : MTN envoie un prompt sur le téléphone
# En dev : affiche un message console
```

### Étape 8A : Vérifier le Statut du Paiement

```bash
GET /api/client/payments/{paymentId}/status
Authorization: Bearer {accessToken}

# Statut : PENDING, COMPLETED, FAILED, REFUNDED
```

### Étape 8B : Confirmer le Paiement (DEV SEULEMENT)

```bash
# ⚠️ Cette route existe uniquement en développement
# En production, la confirmation viendra du webhook MTN

POST /api/client/payments/{paymentId}/confirm
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "transactionId": "MTN-TXN-123456",
  "metadata": {
    "simulatedPayment": true
  }
}

# Résultat :
# - Payment status → COMPLETED
# - Order status → PAID
# - Order paymentStatus → COMPLETED
```

### Étape 9 : Suivre la Commande

```bash
# Liste de mes commandes
GET /api/client/orders?status=paid
Authorization: Bearer {accessToken}

# Détails d'une commande
GET /api/client/orders/{orderId}
Authorization: Bearer {accessToken}

# Statistiques personnelles
GET /api/client/orders/stats
Authorization: Bearer {accessToken}

# Paiement d'une commande
GET /api/client/orders/{orderId}/payment
Authorization: Bearer {accessToken}
```

### Étape 10 : Annuler une Commande (si possible)

```bash
POST /api/client/orders/{orderId}/cancel
Authorization: Bearer {accessToken}

# ⚠️ Possible uniquement si status = PENDING ou PAID
# Le stock est automatiquement restitué
```

## 🔄 Cycle de Vie d'une Commande

```
PENDING      → Commande créée, en attente de paiement
   ↓
PAID         → Paiement confirmé
   ↓
PROCESSING   → Commande en préparation (géré par admin)
   ↓
SHIPPED      → Commande expédiée
   ↓
DELIVERED    → Commande livrée (terminée)

CANCELLED    → Annulée (depuis PENDING ou PAID uniquement)
```

## 🔄 Cycle de Vie d'un Paiement

```
PENDING      → Paiement initié, en attente de confirmation MTN
   ↓
COMPLETED    → Paiement confirmé par MTN

FAILED       → Paiement échoué
REFUNDED     → Paiement remboursé (admin uniquement)
```

## 📦 Modèles de Données

### Cart (Panier)

- `id` : UUID
- `userId` : Propriétaire
- `status` : ACTIVE, ABANDONED, CONVERTED
- `expiresAt` : DateTime (7 jours par défaut)
- Relation : `items` (CartItem[])

### CartItem

- `id` : UUID
- `cartId` : Panier parent
- `productId` : Produit
- `quantity` : Nombre d'articles
- `priceAtAdd` : Prix au moment de l'ajout (snapshot)

### Order (Commande)

- `id` : UUID
- `orderNumber` : Généré automatiquement (ORD-YYYYMM-0001)
- `userId` : Client
- `status` : PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- `totalAmount` : Montant total
- `shippingAddressId` : Adresse de livraison
- `billingAddressId` : Adresse de facturation
- `paymentMethod` : Type de paiement
- `paymentStatus` : PENDING, COMPLETED, FAILED, REFUNDED
- Relations : `items`, `payment`, `shippingAddress`, `billingAddress`

### OrderItem

- `id` : UUID
- `orderId` : Commande parent
- `productId` : Produit
- `productName` : Nom du produit (snapshot)
- `quantity` : Quantité
- `unitPrice` : Prix unitaire
- `totalPrice` : Prix total de cette ligne

### Payment (Paiement)

- `id` : UUID
- `orderId` : Commande associée
- `amount` : Montant
- `method` : MTN_MOBILE_MONEY
- `status` : PENDING, COMPLETED, FAILED, REFUNDED
- `transactionId` : ID de transaction MTN
- `phoneNumber` : Numéro MTN utilisé
- `metadata` : Données additionnelles (JSONB)

## 🔐 Sécurité

### Isolation des Données

- Les clients ne voient QUE leurs propres paniers et commandes
- Validation stricte du rôle CLIENT sur toutes les routes `/api/client/*`
- Les admins ont un accès global

### Validations

- Stock vérifié à chaque ajout au panier et création de commande
- Produits inactifs non visibles dans la boutique
- Transitions de statut contrôlées

## 🎨 Gestion du Stock

### Décrémentation Automatique

Lors de la création d'une commande, le stock est automatiquement décrémenté de manière transactionnelle.

### Restitution Automatique

Lors de l'annulation d'une commande, le stock est automatiquement restitué.

### Validation Temps Réel

Avant chaque opération (ajout panier, création commande), le stock est vérifié.

## 💳 Intégration MTN Mobile Money

### État Actuel (Développement)

- Simulation complète du flux de paiement
- Messages console détaillés
- Confirmation manuelle via endpoint `/confirm`

### TODO : Intégration Production

1. Créer un compte développeur MTN : https://momodeveloper.mtn.com/
2. Obtenir les credentials : `subscriptionKey`, `apiUser`, `apiKey`
3. Implémenter l'API MTN dans `PaymentService` :
   - `requestToPay()` : Initier le paiement
   - `getTransactionStatus()` : Vérifier le statut
4. Configurer le webhook pour recevoir les callbacks
5. Valider la signature MTN pour sécuriser le webhook
6. Supprimer l'endpoint `/confirm` (dev only)

### Webhook MTN (Prêt)

Route publique déjà créée :

```
POST /api/webhooks/mtn/payment-callback
```

## 📧 Notifications (À Implémenter)

Suggestions de notifications email :

- ✅ Commande créée
- ✅ Paiement confirmé
- ✅ Commande expédiée
- ✅ Commande livrée
- ✅ Commande annulée

Templates email à créer dans `resources/views/emails/`

## 🧪 Commandes de Test

```bash
# Démarrer le serveur
npm run dev

# Créer des produits de test (si pas déjà fait)
node ace db:seed

# Créer un utilisateur client
# Via l'API /api/auth/register avec role: "client"

# Tester le flux complet avec Postman ou curl
```

## 📈 Métriques Disponibles

### Pour les Clients

```bash
GET /api/client/orders/stats
# Retourne : totalOrders, totalSpent, pendingOrders, completedOrders
```

### Pour les Admins

```bash
GET /api/admin/products/stats
GET /api/admin/products/low-stock
# Gérer les commandes de tous les clients
```

## 🚀 Prochaines Étapes

1. ✅ Système de panier complet
2. ✅ Système de commandes complet
3. ✅ Système de paiement MTN (simulation)
4. ⏳ Intégration API MTN Mobile Money réelle
5. ⏳ Système de notifications email
6. ⏳ Dashboard client (frontend)
7. ⏳ Gestion des adresses de livraison
8. ⏳ Historique des paiements
9. ⏳ Système de wishlist / favoris
10. ⏳ Système de reviews / notes produits

---

**Note** : Ce système est prêt pour la production une fois l'API MTN Mobile Money intégrée !
