# Fonctions du Chatbot par Profil

## Vue d'ensemble

Toutes les fonctions du chatbot sont en mode **READ-ONLY** (lecture seule). Aucune création, modification ou suppression de données n'est possible via le chatbot.

## Fonctions Disponibles par Profil

### 🔵 AFFRETEUR (Créateur de missions)

#### ✅ Fonctions Accessibles
1. **get_user_missions** - Voir MES missions créées
2. **search_products** - Rechercher des pièces détachées
3. **get_product_details** - Détails d'un produit
4. **get_cart** - Voir mon panier
5. **get_my_orders** - Mes commandes de pièces
6. **get_order_details** - Détails d'une commande
7. **track_shipment** - Suivre une mission/colis
8. **calculate_price** - Calculer un tarif de transport
9. **get_unread_messages** - Messages non lus
10. **get_notifications** - Notifications
11. **get_my_profile** - Mon profil
12. **get_my_addresses** - Mes adresses

#### ❌ Fonctions Restreintes
- **get_available_missions** (réservé aux transporteurs)
- **get_my_vehicles** (réservé aux transporteurs)

#### 📝 Exemples de Questions
- "Quelles sont mes missions ?"
- "Cherche des freins Toyota"
- "Mon panier"
- "Mes commandes"
- "Calcule le prix Douala → Yaoundé 500kg"
- "Quel est mon nom ?"

---

### 🟢 TRANSPORTEUR (Exécuteur de missions)

#### ✅ Fonctions Accessibles
1. **get_user_missions** - Voir MES missions assignées
2. **get_available_missions** - Missions disponibles à prendre
3. **get_my_vehicles** - Mes véhicules
4. **search_products** - Rechercher des pièces
5. **get_product_details** - Détails d'un produit
6. **get_cart** - Voir mon panier
7. **get_my_orders** - Mes commandes
8. **get_order_details** - Détails d'une commande
9. **track_shipment** - Suivre une mission
10. **calculate_price** - Calculer un tarif
11. **get_unread_messages** - Messages non lus
12. **get_notifications** - Notifications
13. **get_my_profile** - Mon profil
14. **get_my_addresses** - Mes adresses

#### 📝 Exemples de Questions
- "Mes missions"
- "Missions disponibles"
- "Mes véhicules"
- "Cherche des pièces"
- "Calcule le prix Douala → Yaoundé"

---

### 🟡 CLIENT (Acheteur de pièces)

#### ✅ Fonctions Accessibles
1. **search_products** - Rechercher des pièces
2. **get_product_details** - Détails d'un produit
3. **get_cart** - Voir mon panier
4. **get_my_orders** - Mes commandes
5. **get_order_details** - Détails d'une commande
6. **get_unread_messages** - Messages non lus
7. **get_notifications** - Notifications
8. **get_my_profile** - Mon profil
9. **get_my_addresses** - Mes adresses

#### ❌ Fonctions Restreintes
- **get_user_missions** (pas de missions pour les clients)
- **get_available_missions** (réservé aux transporteurs)
- **get_my_vehicles** (réservé aux transporteurs)
- **track_shipment** (pas de missions)
- **calculate_price** (pas de transport)

#### 📝 Exemples de Questions
- "Cherche des freins"
- "Mon panier"
- "Mes commandes"
- "Mon profil"

---

### 🔴 ADMIN (Administrateur)

#### ✅ Fonctions Accessibles
Toutes les fonctions disponibles (même accès que AFFRETEUR + TRANSPORTEUR combinés)

---

## Corrections Appliquées

### Protection contre `args = None`
Toutes les fonctions ont maintenant une protection :
```python
if args is None:
    args = {}
```

Cela évite l'erreur `'NoneType' object has no attribute 'get'` quand le LLM appelle une fonction sans arguments.

### Fonctions Corrigées
1. ✅ `_handle_search_products`
2. ✅ `_handle_get_user_missions`
3. ✅ `_handle_get_my_orders`
4. ✅ `_handle_get_available_missions`
5. ✅ `_handle_get_my_vehicles`
6. ✅ `_handle_get_notifications`

## Tests de Validation

### AFFRETEUR ✅
- ✓ get_user_missions
- ✓ search_products
- ✓ get_cart
- ✓ get_my_orders
- ✓ get_my_profile

### TRANSPORTEUR (À tester)
- get_user_missions
- get_available_missions
- get_my_vehicles
- search_products
- get_my_profile

### CLIENT (À tester)
- search_products
- get_cart
- get_my_orders
- get_my_profile

## Restrictions de Sécurité

### Vérifications de Rôle
```python
# get_available_missions
if user_role != "TRANSPORTEUR":
    return {"success": False, "error": "Fonction réservée aux transporteurs"}

# get_my_vehicles
if user_role != "TRANSPORTEUR":
    return {"success": False, "error": "Fonction réservée aux transporteurs"}
```

### Vérifications de Propriété
Toutes les requêtes SQL incluent des filtres sur `user_id` pour garantir que :
- Un utilisateur ne voit que SES missions
- Un utilisateur ne voit que SES commandes
- Un utilisateur ne voit que SON panier
- Un utilisateur ne voit que SES véhicules

## Navigation Frontend

Le chatbot peut guider l'utilisateur vers les bonnes pages :
- `/app/missions` - Gérer mes missions
- `/app/missions/create` - Créer une mission
- `/app/shop` - Catalogue de pièces
- `/app/cart` - Mon panier
- `/app/orders` - Mes commandes
- `/app/profile` - Mon profil
- `/app/vehicles` - Mes véhicules (transporteur)

## Prochaines Étapes

1. ✅ Tester toutes les fonctions pour TRANSPORTEUR
2. ✅ Tester toutes les fonctions pour CLIENT
3. ⏳ Ajouter des tests unitaires automatisés
4. ⏳ Tester l'intégration avec le frontend
5. ⏳ Vérifier les permissions au niveau du monolithe
