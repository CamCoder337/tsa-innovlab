# Corrections des Schémas SQL du Chatbot

## Résumé
Toutes les fonctions du chatbot ont été vérifiées et corrigées pour correspondre aux schémas réels de la base de données PostgreSQL.

## Corrections Effectuées

### 1. **_handle_search_products**
- ❌ Avant : `stock_quantity`, `brand`
- ✅ Après : `stock`, `reference`, `description`
- Ajout du filtre `is_active = true`
- Conversion UUID en string

### 2. **_handle_get_product_details**
- ❌ Avant : `stock_quantity`, `brand`
- ✅ Après : `stock`, `reference`, `unit`
- Ajout de `CAST(:product_id AS UUID)`

### 3. **_handle_get_cart**
- ❌ Avant : `total_amount`, `items_count` (colonnes inexistantes), `stock_quantity`
- ✅ Après : Calcul dynamique du total et du nombre d'items, `stock`
- Ajout de `CAST(:user_id AS UUID)`

### 4. **_handle_get_my_orders**
- ❌ Avant : `total_amount`
- ✅ Après : `total`
- Ajout de `CAST(:user_id AS UUID)` et `CAST(:status AS order_status)`

### 5. **_handle_get_order_details**
- ❌ Avant : `total_amount`, `shipping_address` (colonne inexistante)
- ✅ Après : `total`, suppression de `shipping_address`
- Ajout de `CAST` pour les UUIDs

### 6. **_handle_get_user_missions** (Déjà corrigé)
- ❌ Avant : `title`, `status`, `depart_city`, `arrival_city`
- ✅ Après : `titre as title`, `status`, JOIN avec `addresses` pour les villes
- Conversion UUID en string

### 7. **_handle_get_available_missions**
- ❌ Avant : `title`, `depart_city`, `arrival_city`
- ✅ Après : `titre as title`, JOIN avec `addresses` pour les villes
- Conversion UUID en string

### 8. **_handle_get_my_vehicles**
- ❌ Avant : `immatriculation`, `capacite`, `transporteur_id`
- ✅ Après : `registration`, `description`, `user_id`
- Ajout de `CAST(:user_id AS UUID)`

### 9. **_handle_get_my_profile**
- ✅ Déjà correct, ajout de `CAST(:user_id AS UUID)`

### 10. **_handle_get_my_addresses**
- ❌ Avant : `address_line1`, `address_line2`, `is_default`
- ✅ Après : `street`, `city`, `region`, suppression de `is_default`
- Ajout de `CAST(:user_id AS UUID)`

### 11. **_handle_track_shipment**
- ❌ Avant : `title`, `current_location`, `estimated_delivery_date`
- ✅ Après : `titre as title`, `date_arrivee_prevue`, suppression de `current_location`
- Ajout de `CAST` pour les UUIDs

### 12. **prompt_builder_service.py**
- ❌ Avant : Table `shipments` (inexistante), colonne `brand` dans `products`
- ✅ Après : Table `addresses` avec colonne `city`, suppression de la requête `brand`

## Schémas de Tables Vérifiés

### products
- `id` (UUID)
- `name` (VARCHAR)
- `description` (TEXT)
- `price` (NUMERIC)
- `stock` (INTEGER) ← pas `stock_quantity`
- `reference` (VARCHAR)
- `unit` (VARCHAR)
- `is_active` (BOOLEAN)

### orders
- `id` (UUID)
- `order_number` (VARCHAR)
- `user_id` (UUID)
- `status` (order_status ENUM)
- `total` (NUMERIC) ← pas `total_amount`
- `shipping_address_id` (UUID) ← pas `shipping_address`
- `billing_address_id` (UUID)

### carts
- `id` (UUID)
- `user_id` (UUID)
- `status` (cart_status ENUM)
- ❌ Pas de `total_amount` ni `items_count`

### missions
- `id` (UUID)
- `titre` (VARCHAR) ← pas `title`
- `status` (mission_status ENUM)
- `affreteur_id` (UUID)
- `transporteur_id` (UUID)
- `adresse_depart_id` (UUID) ← pas de colonnes ville directes
- `adresse_arrivee_id` (UUID)
- `date_arrivee_prevue` (TIMESTAMP)

### vehicles
- `id` (UUID)
- `user_id` (UUID) ← pas `transporteur_id`
- `registration` (VARCHAR) ← pas `immatriculation`
- `type` (TEXT)
- `description` (TEXT) ← pas `capacite`
- `status` (TEXT)

### addresses
- `id` (UUID)
- `label` (VARCHAR)
- `street` (TEXT) ← pas `address_line1`
- `city` (VARCHAR)
- `region` (VARCHAR)
- `country` (VARCHAR)
- ❌ Pas de `is_default`

### users
- `id` (UUID)
- `email` (VARCHAR)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `phone` (VARCHAR)
- `role` (user_role ENUM)

## Tests Effectués

✅ **get_user_missions** : Récupère correctement les 10 missions
✅ **search_products** : Trouve les produits avec stock > 0
✅ **get_my_profile** : Affiche le nom de l'utilisateur
✅ **Aucune erreur SQL** dans les logs

## Notes Importantes

1. **UUIDs** : Toujours utiliser `CAST(:param AS UUID)` pour les paramètres UUID
2. **ENUMs** : Utiliser `CAST(:param AS enum_type)` pour les types ENUM
3. **Conversions** : Convertir les UUIDs en string avec `str()` dans les résultats
4. **JOINs** : Les villes sont dans la table `addresses`, pas directement dans `missions`
5. **Colonnes calculées** : `total` et `items_count` du panier doivent être calculés dynamiquement

## Prochaines Étapes

- Tester toutes les fonctions via le frontend
- Vérifier les fonctions de notifications et messages
- Ajouter des tests unitaires pour chaque fonction
