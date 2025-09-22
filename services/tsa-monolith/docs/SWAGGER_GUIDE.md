# Guide Swagger/OpenAPI - TSA Logistics API

## 🚀 Accès à la documentation

Une fois votre serveur lancé (`npm run dev`), la documentation Swagger est accessible à :

- **Interface Swagger UI** : http://localhost:3333/docs
- **Spec JSON** : http://localhost:3333/swagger.json

## 🔑 Authentification dans Swagger

### 1. Obtenir un token JWT

D'abord, utilisez l'endpoint `/api/auth/login` dans Swagger pour vous authentifier :

```json
{
  "email": "admin@tsa-logistics.com", 
  "password": "Admin123!",
  "mfaCode": "123456"
}
```

### 2. Configurer l'authentification

1. Copiez le `accessToken` de la réponse
2. Cliquez sur le bouton **"Authorize"** 🔒 en haut de Swagger UI
3. Dans le champ "bearerAuth", entrez : `Bearer VOTRE_TOKEN`
4. Cliquez sur **"Authorize"**

Maintenant tous vos appels API seront authentifiés !

## 📋 Endpoints documentés

### ✅ Déjà implémentés avec Swagger

- **Auth** : `/api/auth/login` - Connexion avec support MFA
- **Affreteur Missions** :
  - `GET /api/affreteur/missions` - Liste des missions
  - `POST /api/affreteur/missions` - Créer mission
  - `POST /api/affreteur/missions/{id}/publish` - Publier mission

### 🔄 À documenter (exemples d'annotations)

Pour ajouter d'autres endpoints à Swagger, utilisez ce format dans vos contrôleurs :

```typescript
/**
 * @swagger
 * /api/admin/missions:
 *   get:
 *     tags: [Admin - Missions]
 *     summary: Récupérer toutes les missions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
async index({ request, response }: HttpContext) {
  // Votre code ici
}
```

## 🎨 Personnalisation

### Ajouter de nouveaux schémas

Modifiez `/config/swagger.ts` dans la section `components.schemas` :

```typescript
NewSchema: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' }
  }
}
```

### Nouveaux tags

Ajoutez dans `options.tags` :

```typescript
{
  name: 'Propositions',
  description: 'Gestion des propositions de transport'
}
```

## 🛠️ Commandes utiles

```bash
# Démarrer avec hot reload
npm run dev

# Regénérer la documentation après modifications
# (automatique en mode développement)

# Vérifier la génération Swagger
curl http://localhost:3333/swagger.json

# Tester un endpoint via curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3333/api/affreteur/missions
```

## 📖 Exemples d'annotations avancées

### Avec validation et exemples

```typescript
/**
 * @swagger
 * /api/missions:
 *   post:
 *     tags: [Missions]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titre, typeMarchandise]
 *             properties:
 *               titre:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               budgetMin:
 *                 type: number
 *                 minimum: 1000
 *           examples:
 *             transport_informatique:
 *               value:
 *                 titre: "Transport serveurs"
 *                 budgetMin: 50000
 */
```

### Avec gestion d'erreurs détaillées

```typescript
/**
 * @swagger
 * responses:
 *   400:
 *     description: Requête invalide
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             success: { type: boolean, example: false }
 *             message: { type: string }
 *             errors: 
 *               type: array
 *               items: { type: string }
 *         example:
 *           success: false
 *           message: "Validation failed"
 *           errors: ["Le titre est requis"]
 */
```

## 🎯 Bonnes pratiques

1. **Organisez par tags** : Groupez vos endpoints logiquement
2. **Descriptions claires** : Expliquez le but de chaque endpoint
3. **Exemples complets** : Fournissez des données d'exemple réalistes
4. **Codes d'erreur** : Documentez tous les cas d'erreur possibles
5. **Schémas réutilisables** : Définissez des schémas dans `components`

## 🔄 Export/Import

### Exporter la spec OpenAPI

```bash
curl http://localhost:3333/swagger.json > tsa-api-spec.json
```

### Importer dans Postman

1. Ouvrez Postman
2. File → Import
3. Sélectionnez votre fichier `swagger.json`
4. Une collection complète sera créée !

## 🚨 Dépannage

### Swagger UI ne s'affiche pas

1. Vérifiez que le serveur est lancé sur port 3333
2. Consultez les logs pour erreurs TypeScript
3. Vérifiez que toutes les annotations sont valides

### Endpoints manquants

1. Assurez-vous que les contrôleurs sont dans `app/Controllers/Http/`
2. Vérifiez que les routes sont définies dans `start/routes.ts`
3. Redémarrez le serveur après ajout d'annotations

### Erreurs d'authentification

1. Vérifiez que le token JWT est valide
2. Utilisez le format : `Bearer VOTRE_TOKEN`
3. Assurez-vous que l'utilisateur a le bon rôle

---

**Prochaines étapes** : Ajoutez progressivement des annotations Swagger à tous vos contrôleurs pour une documentation API complète !