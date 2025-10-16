# TSA Contest - AdonisJS Monolith

API principale pour le concours TSA Contest 2025. Ce service gère l'authentification, la logique métier et l'orchestration des services.

## 🚀 Vue d'ensemble

Monolithe AdonisJS qui fournit :

- **Authentification & autorisation** : JWT, sessions, MFA/TOTP
- **Gestion des utilisateurs** : Profils, rôles (Admin/Transporteur/Affreteur)
- **Système de missions** : CRUD, publication, suivi en temps réel
- **API métier** : Logique complète de la plateforme de transport
- **Intégration AI** : Communication avec le service FastAPI
- **Base de données** : Migrations, modèles, relations complètes

## 🏗️ Architecture

```
tsa-monolith/
├── app/                     # Code application
│   ├── controllers/         # Contrôleurs HTTP
│   ├── models/             # Modèles Lucid ORM
│   ├── services/           # Services métier
│   ├── middleware/         # Middlewares personnalisés
│   ├── validators/         # Validateurs de requêtes
│   └── exceptions/         # Gestionnaires d'exceptions
├── config/                 # Configuration AdonisJS
├── database/               # Migrations et seeders
├── start/                  # Démarrage et routes
├── tests/                  # Tests unitaires et fonctionnels
└── bin/                    # Scripts de démarrage
```

## 🔧 Installation

### Prérequis

- Node.js 20+
- PostgreSQL 15+
- Redis 7+ (optionnel)
- Docker & Docker Compose

### Setup rapide avec Docker

```bash
# Cloner le projet
git clone <repo-url>
cd services/tsa-monolith

# Lancer avec Docker Compose
docker-compose up -d

# Vérifier le service
curl http://localhost:3333/health
```

### Setup développement local

```bash
# Installer dépendances
npm install

# Configurer environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Lancer migrations
node ace migration:run

# Démarrer en mode développement
npm run dev

# Ou avec hot-reload
node ace serve --hmr
```

## 🔑 Configuration

Variables d'environnement principales :

```bash
# Application
APP_KEY=your-32-character-secret-key
NODE_ENV=development
HOST=localhost
PORT=3333

# Base de données
DB_CONNECTION=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=tsa_user
DB_PASSWORD=tsa_password
DB_DATABASE=tsa_contest

# Session et cache
SESSION_DRIVER=cookie
REDIS_HOST=localhost
REDIS_PORT=6379

# Services externes
FASTAPI_BASE_URL=http://localhost:8000
```

## 📡 API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur courant

### Missions (Affreteur)

- `GET /api/affreteur/missions` - Mes missions avec filtres
- `POST /api/affreteur/missions` - Créer mission (DRAFT)
- `GET /api/affreteur/missions/:id` - Détails mission
- `PUT /api/affreteur/missions/:id` - Modifier mission
- `POST /api/affreteur/missions/:id/publish` - Publier mission
- `DELETE /api/affreteur/missions/:id` - Supprimer mission

### Missions (Transporteur)

- `GET /api/transporteur/missions/available` - Missions PUBLISHED
- `GET /api/transporteur/missions/:id` - Détails mission publique
- `GET /api/transporteur/my-missions` - Mes missions assignées
- `PUT /api/transporteur/missions/:id/status` - Mettre à jour statut
- `POST /api/transporteur/missions/:id/location` - Localisation GPS
- `POST /api/transporteur/missions/:id/proof` - Preuve livraison

### Missions (Admin)

- `GET /api/admin/missions` - Toutes les missions avec filtres
- `POST /api/admin/missions` - Créer mission pour affreteur
- `GET /api/admin/missions/stats` - Statistiques globales
- `PUT /api/admin/missions/:id/status` - Changer statut mission

### Health Check

- `GET /health` - Status basique
- `GET /health/detailed` - Status détaillé avec DB

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests fonctionnels
npm run test:functional

# Tests avec couverture
npm run test:coverage

# Linter
npm run lint

# Format code
npm run format

# Vérification TypeScript
npm run typecheck
```

## 🗄️ Base de données

### Migrations

```bash
# Créer une migration
node ace make:migration create_shipments_table

# Lancer les migrations
node ace migration:run

# Rollback dernière migration
node ace migration:rollback

# Status des migrations
node ace migration:status
```

### Modèles

```bash
# Créer un modèle
node ace make:model Shipment

# Créer modèle avec migration
node ace make:model Shipment --migration
```

## 📋 Conventions de nommage

### Variables et fonctions

```typescript
// camelCase pour variables et fonctions
const userId = 123
const userProfile = await getUserProfile()
const databaseConnection = Database.connection()

// UPPER_SNAKE_CASE pour constantes
const MAX_LOGIN_ATTEMPTS = 5
const DEFAULT_PAGE_SIZE = 20
const API_VERSION = 'v1'
```

### Classes et interfaces

```typescript
// PascalCase pour classes
class UserController {
  public async index() {}
}

class AuthService {
  public async login() {}
}

// Interfaces avec préfixe "I" (optionnel)
interface IUserRepository {
  findById(id: number): Promise<User>
}

// Types avec préfixe "T" (optionnel)
type TUserRole = 'admin' | 'user' | 'moderator'
```

### Modèles Lucid

```typescript
// PascalCase, singulier
class User extends BaseModel {
  // Snake_case pour colonnes DB, camelCase en TS
  public static table = 'users'

  @column({ isPrimary: true })
  public id: number

  @column()
  public firstName: string // first_name dans DB

  @column()
  public lastName: string // last_name dans DB

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
```

### Contrôleurs

```typescript
// PascalCase + "Controller" suffix
class UsersController {
  // Actions en camelCase
  public async index({}: HttpContextContract) {}
  public async show({}: HttpContextContract) {}
  public async store({}: HttpContextContract) {}
  public async update({}: HttpContextContract) {}
  public async destroy({}: HttpContextContract) {}
}

class AuthController {
  public async login({}: HttpContextContract) {}
  public async register({}: HttpContextContract) {}
  public async logout({}: HttpContextContract) {}
}
```

### Services

```typescript
// PascalCase + "Service" suffix
class UserService {
  public async createUser(data: any): Promise<User> {}
  public async updateUserProfile(userId: number, data: any): Promise<User> {}
  public async deleteUserAccount(userId: number): Promise<void> {}
}

class AuthService {
  public async authenticateUser(credentials: any): Promise<any> {}
  private async validateCredentials(credentials: any): Promise<boolean> {}
}
```

### Routes

```typescript
// Kebab-case dans URLs, groupées par ressource
Route.group(() => {
  Route.get('/users', 'UsersController.index')
  Route.get('/users/:id', 'UsersController.show')
  Route.post('/users', 'UsersController.store')
  Route.put('/users/:id', 'UsersController.update')
  Route.delete('/users/:id', 'UsersController.destroy')
})
  .prefix('/api')
  .middleware('auth')

// Routes spéciales
Route.post('/api/auth/login', 'AuthController.login')
Route.get('/health', 'HealthController.index')
```

### Middleware

```typescript
// PascalCase + "Middleware" suffix
class AuthMiddleware {
  public async handle({}: HttpContextContract, next: NextFn) {}
}

class AdminMiddleware {
  public async handle({}: HttpContextContract, next: NextFn) {}
}

// Enregistrement en snake_case
export default {
  auth: () => import('App/Middleware/AuthMiddleware'),
  admin: () => import('App/Middleware/AdminMiddleware'),
}
```

### Validateurs

```typescript
// PascalCase + "Validator" suffix
class CreateUserValidator {
  public schema = schema.create({
    firstName: schema.string(),
    lastName: schema.string(),
    email: schema.string({}, [rules.email()]),
    password: schema.string({}, [rules.minLength(8)]),
  })
}

class UpdateProfileValidator {
  public schema = schema.create({
    first_name: schema.string.optional(),
    last_name: schema.string.optional(),
  })
}
```

### Migrations

```typescript
// Snake_case pour fichiers
// 1756021226576_create_users_table.ts

class CreateUsersTable extends BaseSchema {
  protected tableName = 'users' // Snake_case

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('first_name').notNullable() // Snake_case
      table.string('last_name').notNullable()
      table.string('email').unique().notNullable()
      table.timestamps(true)
    })
  }
}
```

### Tests

```typescript
// Descriptif avec "should"
test('should authenticate user with valid credentials', async ({ assert }) => {
  // Test logic
})

test('should return 401 for invalid credentials', async ({ assert }) => {
  // Test logic
})

test('should create user with valid data', async ({ assert }) => {
  // Test logic
})

// Groupes de tests
test.group('Auth Controller', () => {
  test('should login user', async ({ assert }) => {})
  test('should register user', async ({ assert }) => {})
})
```

### Variables d'environnement

```typescript
// UPPER_SNAKE_CASE
const dbConfig = {
  host: Env.get('DB_HOST'),
  port: Env.get('DB_PORT'),
  user: Env.get('DB_USER'),
  password: Env.get('DB_PASSWORD'),
  database: Env.get('DB_DATABASE'),
}
```

### Fichiers et dossiers

```
# Snake_case pour fichiers TypeScript
user_controller.ts (si préféré)
auth_service.ts
create_users_table.ts

# Ou PascalCase (convention AdonisJS)
UserController.ts
AuthService.ts
CreateUsersTable.ts

# Dossiers en minuscules, pluriels
controllers/
models/
services/
middleware/
```

## 🚢 Déploiement

### Docker Production

```bash
# Build image
docker build -t tsa-adonis-api .

# Run container
docker run -d \
  --name tsa-adonis-api \
  -p 3333:3333 \
  -e NODE_ENV=production \
  -e DB_HOST=postgres \
  tsa-adonis-api
```

### Build pour production

```bash
# Build TypeScript
npm run build

# Lancer en production
npm start
```

## 🔄 Intégration avec FastAPI

```typescript
// Service pour communiquer avec l'AI
class AIService {
  private baseUrl = Env.get('FASTAPI_BASE_URL')

  public async predictETA(data: any) {
    const response = await axios.post(`${this.baseUrl}/api/ai/eta/predict`, data)
    return response.data
  }
}
```

## 📈 Performance

- **Réponse moyenne** : < 100ms
- **Connexions simultanées** : 1000+
- **Rate limiting** : Configuré par route
- **Cache Redis** : Session et données fréquentes

## 🐛 Debug

```bash
# Logs AdonisJS
node ace serve --hmr --debug

# Tests debug
DEBUG=adonis:* npm test

# DB queries debug
DEBUG=knex:query npm run dev
```

## 📚 Documentation

- **API Docs** : Génération automatique avec Swagger (TODO)
- **Architecture** : `/docs/architecture/`
- **AdonisJS Docs** : https://adonisjs.com/

## 🤝 Contribution

1. Fork le projet
2. Créer branch feature (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Créer Pull Request

## 📄 License

Projet TSA Contest 2025 - Usage interne uniquement.
#   T e s t   t r i g g e r  
 