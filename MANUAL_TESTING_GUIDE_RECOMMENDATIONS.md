# Guide de Test Manuel - Système de Recommandations

**Date**: 2025-10-28
**Version**: 1.0
**Objectif**: Vérifier que le système de recommandations personnalisées fonctionne correctement

---

## Pré-requis

### Services à Lancer

1. **PostgreSQL**: Base de données principale
2. **Redis**: Cache et sessions
3. **FastAPI AI Service** (port 8000):
   ```bash
   cd services/tsa-ai
   source venv/bin/activate  # Windows: venv\Scripts\activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **AdonisJS Monolith** (port 3333):
   ```bash
   cd services/tsa-monolith
   npm run dev
   ```

5. **Frontend React** (port 5173):
   ```bash
   cd apps/frontend-web
   yarn dev
   ```

### Données de Test Nécessaires

- Au moins 2 utilisateurs avec historiques d'achats différents
- Au moins 10 produits actifs dans différentes catégories
- Quelques commandes complétées pour alimenter l'historique

---

## Test 1: Recommandations pour Visiteurs (Non Connectés)

### Objectif
Vérifier que les visiteurs non authentifiés voient les produits populaires

### Étapes

1. Ouvrir une fenêtre de navigation privée
2. Aller sur `http://localhost:5173`
3. Naviguer vers la page Shop (sans se connecter)

### Vérifications

**Interface:**
- [ ] Section "Produits Populaires" visible en haut de la page
- [ ] Icône "TrendingUp" affichée dans le titre
- [ ] Description: "Les produits les plus demandés par nos clients"
- [ ] 4 produits affichés (par défaut)

**Réseau (Outils Dev > Network):**
```
Request:
GET http://localhost:3333/api/shop/product-recommendations/popular?limit=4

Response esperada:
{
  "success": true,
  "message": "Popular products retrieved successfully",
  "data": {
    "products": [...],
    "strategy": "popularity" ou "fallback_recent",
    "total": 4
  }
}
```

**Pas de Tracking:**
- [ ] Aucune requête POST vers `/feedback` (visiteurs non trackés)

---

## Test 2: Recommandations Personnalisées (Utilisateur Connecté)

### Objectif
Vérifier que les utilisateurs authentifiés reçoivent des recommandations personnalisées

### Étapes

1. Se connecter avec un compte utilisateur ayant un historique d'achats
   - Email: `client@example.com` (ou tout compte client)
   - Password: votre mot de passe

2. Aller sur la page Shop

### Vérifications

**Interface:**
- [ ] Section "Recommandé pour vous" visible
- [ ] Icône "Sparkles" affichée dans le titre
- [ ] Badge "IA" affiché à droite du titre
- [ ] Description: "Sélection personnalisée basée sur vos préférences"
- [ ] Les produits affichés sont DIFFÉRENTS de ceux montrés aux visiteurs

**Réseau (Outils Dev > Network):**
```
Request:
GET http://localhost:3333/api/shop/product-recommendations?limit=4&context=homepage
Headers:
Authorization: Bearer <votre_token_jwt>

Response esperada:
{
  "success": true,
  "message": "Personalized recommendations retrieved successfully",
  "data": {
    "products": [...],
    "strategy": "collaborative_filtering" ou "content_based" ou "popularity",
    "total": 4
  }
}
```

**Tracking Automatique des Vues:**
```
4 requêtes POST vers /api/shop/product-recommendations/feedback
(une par produit recommandé)

Body de chaque requête:
{
  "product_id": "...",
  "action": "view",
  "context": "personalized"
}

Response esperada (200 OK):
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "action": "view",
    "product_id": "...",
    "timestamp": "..."
  }
}
```

---

## Test 3: Tracking des Clics

### Objectif
Vérifier que les clics sur les produits recommandés sont trackés

### Étapes

1. Être connecté
2. Sur la page Shop, dans la section "Recommandé pour vous"
3. Cliquer sur l'image ou le titre d'un produit recommandé
4. Ouvrir les outils dev > Network AVANT de cliquer

### Vérifications

**Comportement:**
- [ ] Redirection vers la page du produit
- [ ] URL: `http://localhost:5173/app/shop/product/{productId}`

**Tracking (Network):**
```
Request:
POST http://localhost:3333/api/shop/product-recommendations/feedback
Headers:
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "product_id": "...",
  "action": "click",
  "context": "personalized"
}

Response esperada:
Status: 200 OK
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

---

## Test 4: Tracking des Ajouts au Panier

### Objectif
Vérifier que les ajouts au panier depuis les recommandations sont trackés

### Étapes

1. Être connecté
2. Sur la page Shop
3. Dans la section "Recommandé pour vous", cliquer sur le bouton "Ajouter" d'un produit

### Vérifications

**Comportement:**
- [ ] Produit ajouté au panier (icône panier se met à jour)
- [ ] Toast notification de succès
- [ ] Nombre d'articles dans le panier augmente

**Tracking (Network):**
```
Deux requêtes doivent être envoyées:

1. Ajout au panier:
POST http://localhost:3333/api/client/cart/items

2. Feedback de recommandation:
POST http://localhost:3333/api/shop/product-recommendations/feedback

Body:
{
  "product_id": "...",
  "action": "add_to_cart",
  "context": "personalized"
}
```

---

## Test 5: Produits Similaires (Page Produit)

### Objectif
Vérifier que les recommandations de produits similaires fonctionnent

### Étapes

1. Être connecté
2. Accéder à la page détails d'un produit: `http://localhost:5173/app/shop/product/{id}`
3. Scroller en bas de la page

### Vérifications

**Interface:**
- [ ] Section "Produits Similaires" visible
- [ ] Icône "Users" affichée
- [ ] Description: "D'autres produits qui pourraient vous intéresser"
- [ ] Produits affichés sont de la même catégorie ou similaires

**Réseau:**
```
Request:
GET http://localhost:3333/api/shop/product-recommendations/similar/{productId}?limit=4
Headers:
Authorization: Bearer <token>

Response esperada:
{
  "success": true,
  "message": "Similar products retrieved successfully",
  "data": {
    "base_product": {...},
    "products": [...],
    "strategy": "content_similarity" ou "fallback_same_category",
    "total": 4
  }
}
```

**Tracking:**
- [ ] Requêtes POST de tracking "view" pour chaque produit similaire affiché
- [ ] context: "similar"

---

## Test 6: Comparaison Utilisateurs Différents

### Objectif
Vérifier que différents utilisateurs voient des recommandations différentes

### Étapes

1. **Session 1**: Se connecter avec User A (ayant acheté des produits électroniques)
2. Noter les recommandations affichées
3. Se déconnecter
4. **Session 2**: Se connecter avec User B (ayant acheté des vêtements)
5. Noter les recommandations affichées

### Vérifications

- [ ] Les recommandations de User A sont différentes de celles de User B
- [ ] Les produits recommandés correspondent aux catégories d'achats précédents
- [ ] Le champ `strategy_used` dans la réponse API indique la stratégie utilisée:
  - `collaborative_filtering` si l'utilisateur a ≥3 achats
  - `content_based` si l'utilisateur a 1-2 achats
  - `popularity` si nouvel utilisateur (0 achats)

---

## Test 7: Vérification en Base de Données

### Objectif
Confirmer que les feedbacks sont enregistrés dans PostgreSQL

### Étapes

1. Effectuer plusieurs actions:
   - Voir des recommandations (4 produits)
   - Cliquer sur 2 produits
   - Ajouter 1 produit au panier

2. Se connecter à PostgreSQL:
   ```bash
   psql -U postgres -d tsa_contest
   ```

3. Vérifier la table de feedback:
   ```sql
   SELECT * FROM product_recommendation_feedbacks
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### Vérifications

**Colonnes attendues:**
- [ ] `id`: UUID unique
- [ ] `user_id`: UUID de l'utilisateur connecté
- [ ] `product_id`: UUID du produit
- [ ] `action`: 'view', 'click', ou 'add_to_cart'
- [ ] `context`: 'personalized', 'popular', ou 'similar'
- [ ] `strategy_used`: stratégie de recommandation utilisée
- [ ] `metadata`: JSONB (peut être null)
- [ ] `created_at`: timestamp

**Données attendues:**
```sql
-- 4 entrées "view" + 2 entrées "click" + 1 entrée "add_to_cart" = 7 lignes minimum

-- Exemple de ligne:
{
  id: 'uuid...',
  user_id: 'uuid_user',
  product_id: 'uuid_product',
  action: 'view',
  context: 'personalized',
  strategy_used: 'collaborative_filtering',
  metadata: null,
  created_at: '2025-10-28 10:00:00'
}
```

---

## Test 8: Tests de Performance

### Objectif
Vérifier que le système répond rapidement

### Étapes

1. Ouvrir les DevTools > Network
2. Vider le cache (Ctrl+Shift+Delete)
3. Recharger la page Shop

### Vérifications

**Temps de réponse:**
- [ ] `/product-recommendations` ou `/popular`: < 500ms
- [ ] `/product-recommendations/similar/{id}`: < 500ms
- [ ] `/product-recommendations/feedback`: < 200ms (fire and forget)

**Cache:**
- [ ] Les requêtes subséquentes devraient être plus rapides (cache Redis actif)

---

## Test 9: Tests de Fallback

### Objectif
Vérifier que le système fonctionne même si le service AI est indisponible

### Étapes

1. **Arrêter le service FastAPI** (Ctrl+C dans le terminal tsa-ai)
2. Recharger la page Shop (connecté)

### Vérifications

**Comportement:**
- [ ] Les recommandations s'affichent toujours (fallback)
- [ ] Stratégie utilisée: `fallback_recent` ou `fallback_same_category`
- [ ] Produits affichés: produits récents ou de la même catégorie

**Logs Backend (AdonisJS):**
```
[ERROR] Failed to get personalized product recommendations from AI service
```

**Pas de crash:**
- [ ] L'application frontend reste fonctionnelle
- [ ] Aucune erreur 500 affichée à l'utilisateur

---

## Test 10: Tests de Sécurité

### Objectif
Vérifier que les endpoints protégés nécessitent l'authentification

### Étapes

1. Se déconnecter
2. Essayer d'accéder à `/api/shop/product-recommendations` sans token

### Vérifications avec cURL ou Postman:

```bash
# Sans authentification - devrait échouer
curl http://localhost:3333/api/shop/product-recommendations

# Response attendue:
{
  "success": false,
  "message": "Unauthorized",
  "status": 401
}

# Endpoint public - devrait fonctionner
curl http://localhost:3333/api/shop/product-recommendations/popular

# Response attendue:
{
  "success": true,
  "data": {...}
}
```

---

## Checklist Complète

### Fonctionnalités Principales
- [ ] Produits populaires pour visiteurs
- [ ] Recommandations personnalisées pour utilisateurs connectés
- [ ] Produits similaires sur page produit
- [ ] Différentiation entre utilisateurs

### Tracking
- [ ] Tracking automatique des vues
- [ ] Tracking des clics sur produits
- [ ] Tracking des ajouts au panier
- [ ] Enregistrement en base de données

### Performance et Fiabilité
- [ ] Temps de réponse < 500ms
- [ ] Fallback fonctionnel si AI service down
- [ ] Pas de crash ou erreurs frontend
- [ ] Cache Redis opérationnel

### Sécurité
- [ ] Endpoints protégés nécessitent auth
- [ ] Endpoint public accessible sans auth
- [ ] Tokens JWT validés correctement

---

## Problèmes Courants et Solutions

### Problème: Pas de recommandations affichées

**Causes possibles:**
1. Service FastAPI non démarré → Vérifier `http://localhost:8000/docs`
2. AdonisJS non démarré → Vérifier `http://localhost:3333/health`
3. Pas de produits en base → Exécuter les seeders

**Solution:**
```bash
# Vérifier les services
curl http://localhost:8000/api/ai/health
curl http://localhost:3333/health

# Exécuter les seeders
cd services/tsa-monolith
node ace db:seed
```

### Problème: Erreur 404 sur /product-recommendations

**Cause:** Routes non enregistrées correctement

**Solution:**
```bash
# Redémarrer AdonisJS
cd services/tsa-monolith
npm run dev
```

### Problème: Tracking non enregistré en base

**Causes possibles:**
1. Table `product_recommendation_feedbacks` n'existe pas
2. Migration non exécutée

**Solution:**
```bash
cd services/tsa-monolith
node ace migration:run
```

### Problème: Toujours les mêmes recommandations

**Causes possibles:**
1. Cache Redis trop agressif
2. Pas assez de données d'historique

**Solution:**
```bash
# Vider le cache Redis
redis-cli FLUSHALL

# Ajouter plus de données de test
cd services/tsa-monolith
node ace db:seed --force
```

---

## Reporting des Bugs

Si vous trouvez un bug, notez:

1. **Étape du test** où le bug s'est produit
2. **Comportement attendu** vs **Comportement observé**
3. **Logs console** (Frontend et Backend)
4. **Requêtes réseau** (copier la requête/réponse)
5. **État de la session** (connecté/déconnecté)

---

## Conclusion

Tous les tests devraient passer sans erreur. Si tous les tests sont ✅, le système de recommandations personnalisées est pleinement fonctionnel et prêt pour la production!

**Temps estimé pour tous les tests**: 30-45 minutes
