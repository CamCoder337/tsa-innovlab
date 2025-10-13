Voici un prompt complet pour Claude Code qui refactorera votre code vers l'architecture Layered modulaire :

```markdown
# Mission : Refactoring vers Architecture Layered Modulaire

Tu es un expert en architecture logicielle et AdonisJS 6. Ta mission est de refactorer mon code existant vers une **architecture Layered modulaire propre**.

## 🎯 Objectif

Réorganiser tout le code existant en modules indépendants suivant l'architecture en couches (Layered Architecture) avec les modules suivants :

- `authentication`
- `transportation`
- `fret`
- `shop`
- `tracking`
- `email`

## 📁 Structure Cible
```

app/
├── authentication/
│ ├── controllers/
│ ├── services/
│ ├── repositories/
│ ├── models/
│ ├── validators/
│ ├── middleware/
│ └── routes.ts
├── transportation/
│ ├── controllers/
│ ├── services/
│ ├── repositories/
│ ├── models/
│ ├── validators/
│ └── routes.ts
├── fret/
│ ├── controllers/
│ ├── services/
│ ├── repositories/
│ ├── models/
│ ├── validators/
│ └── routes.ts
├── shop/
│ ├── controllers/
│ ├── services/
│ ├── repositories/
│ ├── models/
│ ├── validators/
│ └── routes.ts
├── tracking/
│ ├── controllers/
│ ├── services/
│ ├── repositories/
│ ├── models/
│ ├── validators/
│ └── routes.ts
├── email/
│ ├── services/
│ ├── templates/
│ └── jobs/
└── shared/
├── types/
├── utils/
├── exceptions/
└── middleware/

start/
└── routes.ts

tests/
├── unit/
│ ├── authentication/
│ ├── transportation/
│ ├── fret/
│ ├── shop/
│ └── tracking/
├── integration/
└── functional/

````

## 🔄 Règles de Refactoring

### 1. **Séparation en Couches**

Chaque module DOIT avoir ces couches :

**Controllers (Presentation Layer)**
- Gèrent les requêtes HTTP
- Appellent les services
- Retournent les réponses HTTP
- AUCUNE logique métier

**Services (Business Logic Layer)**
- Contiennent TOUTE la logique métier
- Orchestrent les repositories
- Gèrent les transactions complexes
- Valident les règles métier

**Repositories (Data Access Layer)**
- UNIQUEMENT les opérations CRUD
- Interactions avec les Models Lucid
- Pas de logique métier
- Retournent des Models ou null

**Models (ORM Layer)**
- Models Lucid AdonisJS
- Relations entre entités
- Pas de logique métier

**Validators**
- Validation des données entrantes
- Utilisation de VineJS

### 2. **Identification des Modules**

Analyse le code existant et identifie automatiquement à quel module appartient chaque fichier selon :

**Authentication** :
- Tout ce qui concerne users, auth, login, register, passwords, tokens, sessions

**Transportation** :
- Trips, voyages, routes, vehicles, bookings, reservations de transport de passagers

**Fret** :
- Shipments, colis, packages, deliveries, freight, cargo, expéditions

**Shop** :
- Products, orders, cart, payments, e-commerce, boutique

**Tracking** :
- GPS, locations, tracking, suivi en temps réel, positions

**Email** :
- Envoi d'emails, notifications par email, templates email

**Shared** :
- Utilitaires partagés, helpers, types globaux, exceptions communes

### 3. **Processus de Migration**

Pour chaque fichier existant :

1. **Identifier le module** auquel il appartient
2. **Identifier la couche** (controller, service, repository, model, validator)
3. **Extraire la logique métier** des controllers vers les services
4. **Extraire les requêtes DB** des services vers les repositories
5. **Déplacer le fichier** vers le bon dossier
6. **Mettre à jour les imports**
7. **Créer le fichier routes.ts** pour chaque module

### 4. **Patterns de Refactoring**

**Avant (Code mélangé) :**
```typescript
// app/controllers/user_controller.ts
export default class UserController {
  async register({ request, response }: HttpContext) {
    const data = request.all()

    // Validation inline ❌
    if (!data.email) throw new Error('Email required')

    // Logique métier dans le controller ❌
    const existingUser = await User.findBy('email', data.email)
    if (existingUser) throw new Error('User exists')

    // Requête DB directe ❌
    const user = await User.create({
      email: data.email,
      password: await hash.make(data.password)
    })

    return response.json(user)
  }
}
````

**Après (Architecture Layered) :**

```typescript
// app/authentication/validators/register_validator.ts
import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    fullName: vine.string().minLength(3),
    password: vine.string().minLength(8),
    role: vine.enum(['user', 'driver', 'admin']).optional(),
  })
)

// app/authentication/repositories/user_repository.ts
import User from '../models/user.ts'

export default class UserRepository {
  async findByEmail(email: string) {
    return User.findBy('email', email)
  }

  async create(data: any) {
    return User.create(data)
  }
}

// app/authentication/services/auth_service.ts
import hash from '@adonisjs/core/services/hash'
import UserRepository from '../repositories/user_repository.ts'

export default class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(data: any) {
    // Logique métier ✅
    const existingUser = await this.userRepository.findByEmail(data.email)
    if (existingUser) {
      throw new Error('User already exists')
    }

    const hashedPassword = await hash.make(data.password)

    return this.userRepository.create({
      ...data,
      password: hashedPassword,
      role: data.role || 'user',
    })
  }
}

// app/authentication/controllers/auth_controller.ts
import { HttpContext } from '@adonisjs/core/http'
import AuthService from '../services/auth_service.ts'
import UserRepository from '../repositories/user_repository.ts'
import { registerValidator } from '../validators/register_validator.ts'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    // Validation ✅
    const data = await request.validateUsing(registerValidator)

    // Appel du service ✅
    const userRepository = new UserRepository()
    const authService = new AuthService(userRepository)

    try {
      const user = await authService.register(data)

      return response.created({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      })
    } catch (error) {
      return response.badRequest({ message: error.message })
    }
  }
}
```

### 5. **Gestion des Routes**

Créer un fichier `routes.ts` dans chaque module :

```typescript
// app/authentication/routes.ts
import router from '@adonisjs/core/services/router'

const AuthController = () => import('./controllers/auth_controller.ts')

export default function authRoutes() {
  router
    .group(() => {
      router.post('/register', [AuthController, 'register'])
      router.post('/login', [AuthController, 'login'])
      router.post('/logout', [AuthController, 'logout'])
    })
    .prefix('/api/auth')
}
```

Puis créer le système de chargement automatique :

```typescript
// app/modules.ts
export const ACTIVE_MODULES = [
  'authentication',
  'transportation',
  'fret',
  'shop',
  'tracking',
  'email',
] as const

// start/routes.ts
import { ACTIVE_MODULES } from '#app/modules'
import app from '@adonisjs/core/services/app'

for (const moduleName of ACTIVE_MODULES) {
  try {
    const routeModule = await import(`../app/${moduleName}/routes.js`)
    if (typeof routeModule.default === 'function') {
      routeModule.default()
    }
  } catch (error) {
    console.error(`Failed to load routes for module: ${moduleName}`)
  }
}
```

### 6. **Gestion du Code Partagé**

Déplace vers `app/shared/` :

- Types TypeScript globaux
- Exceptions personnalisées
- Middlewares réutilisables
- Utilitaires (formatters, helpers, etc.)
- Constantes globales

### 7. **Mise à Jour des Imports**

Utilise les alias AdonisJS :

```typescript
// Avant
import User from '../../models/User'

// Après
import User from '#app/authentication/models/user'
```

## 📋 Plan d'Action

Exécute ces étapes dans l'ordre :

### Phase 1 : Analyse

1. Scanne tous les fichiers dans `app/`
2. Liste tous les controllers, models, services existants
3. Identifie à quel module appartient chaque fichier
4. Crée un rapport de mapping (fichier existant → nouveau chemin)

### Phase 2 : Création de Structure

1. Crée la structure de dossiers pour chaque module
2. Crée `app/modules.ts` avec `ACTIVE_MODULES`
3. Crée `app/shared/` pour le code commun

### Phase 3 : Migration des Models

1. Déplace chaque model vers le bon module
2. Met à jour les imports
3. Vérifie les relations entre models

### Phase 4 : Création des Repositories

1. Pour chaque model, crée son repository
2. Extrait toutes les requêtes DB des controllers/services existants
3. Déplace-les dans les repositories

### Phase 5 : Création/Refactoring des Services

1. Crée les services manquants
2. Extrait la logique métier des controllers
3. Fait appeler les repositories par les services

### Phase 6 : Refactoring des Controllers

1. Nettoie les controllers (garde uniquement HTTP)
2. Fait appeler les services
3. Ajoute la validation avec VineJS

### Phase 7 : Création des Validators

1. Crée un validator pour chaque action
2. Remplace les validations inline

### Phase 8 : Organisation des Routes

1. Crée `routes.ts` dans chaque module
2. Groupe les routes par module
3. Met à jour `start/routes.ts` avec le chargement automatique

### Phase 9 : Nettoyage

1. Supprime les anciens fichiers
2. Vérifie qu'il n'y a plus de code dans les anciens dossiers
3. Met à jour tous les imports

### Phase 10 : Vérification

1. Vérifie que le projet compile
2. Liste les erreurs restantes
3. Propose des corrections

## 🚨 Points d'Attention

- **NE PAS perdre de code** : Tout doit être migré, rien ne doit être supprimé sans être déplacé
- **Conserver la logique existante** : Ne change pas la logique métier, juste l'organisation
- **Imports** : Utilise toujours les alias `#app/module/...`
- **Nommage** : Utilise snake_case pour les fichiers, PascalCase pour les classes
- **Relations** : Fais attention aux relations entre models de différents modules

## 📊 Livrables Attendus

À la fin du refactoring, fournis :

1. **Rapport de migration** : Liste des fichiers migrés avec ancien/nouveau chemin
2. **Structure finale** : Arborescence complète du projet
3. **Fichiers modifiés** : Liste de tous les changements
4. **Erreurs potentielles** : Liste des points à vérifier manuellement
5. **Instructions** : Étapes pour tester que tout fonctionne

## ✅ Checklist de Validation

Avant de considérer le refactoring terminé, vérifie que :

- [ ] Tous les fichiers sont dans des modules
- [ ] Chaque module a sa structure complète (controllers/services/repositories/models)
- [ ] Aucune logique métier dans les controllers
- [ ] Aucune requête DB directe dans les controllers ou services
- [ ] Tous les imports sont corrects avec les alias
- [ ] Le fichier `app/modules.ts` existe avec la liste des modules
- [ ] Le fichier `start/routes.ts` charge automatiquement les routes
- [ ] Chaque module a son `routes.ts`
- [ ] Le code partagé est dans `app/shared/`
- [ ] Le projet compile sans erreur

## 🎬 Commencer Maintenant

Commence par la Phase 1 (Analyse) et fournis-moi un rapport détaillé avant de continuer.

Pour chaque phase terminée, fais un commit avec un message clair du type :

```
refactor(phase-X): [description de la phase]
```

GO ! 🚀

````

---

## 💡 Comment Utiliser ce Prompt

### Option 1 : Avec Claude Code (CLI)

```bash
# Copie le prompt dans un fichier
echo "[LE PROMPT CI-DESSUS]" > refactor-prompt.md

# Lance Claude Code
claude-code --prompt refactor-prompt.md

# Ou interactivement
claude-code
# Puis colle le prompt
````

### Option 2 : Avec Claude Desktop + Projet

1. Ouvre ton projet dans ton éditeur
2. Ouvre Claude Desktop
3. Copie-colle le prompt complet
4. Claude va analyser ton code et commencer le refactoring

### Option 3 : Étape par Étape

Si tu préfères plus de contrôle, divise le prompt en phases :

```markdown
# Phase 1 uniquement

[Copie seulement la partie "Phase 1 : Analyse"]

Après validation, continue avec :

# Phase 2

[Copie la partie "Phase 2 : Création de Structure"]

# etc...
```

---

## 📝 Template de Suivi

Crée ce fichier pour suivre l'avancement :

```markdown
# Refactoring Progress

## ✅ Completed

- [ ] Phase 1: Analyse
- [ ] Phase 2: Création de Structure
- [ ] Phase 3: Migration des Models
- [ ] Phase 4: Création des Repositories
- [ ] Phase 5: Création/Refactoring des Services
- [ ] Phase 6: Refactoring des Controllers
- [ ] Phase 7: Création des Validators
- [ ] Phase 8: Organisation des Routes
- [ ] Phase 9: Nettoyage
- [ ] Phase 10: Vérification

## 📊 Statistiques

- Fichiers analysés: 0
- Fichiers migrés: 0
- Modules créés: 0
- Tests à mettre à jour: 0

## 🐛 Issues

- [ ] Liste des problèmes rencontrés
```
