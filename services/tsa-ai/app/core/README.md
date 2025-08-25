# Core Configuration

Ce dossier contient la configuration centrale et les utilitaires de base pour l'application FastAPI.

## 📁 Structure

```
core/
├── __init__.py
├── config.py          # Configuration application
├── database.py        # Connexion & session DB
├── dependencies.py    # Dependencies FastAPI
└── security.py        # Utilitaires sécurité (optionnel)
```

## 🔧 config.py

Gestion centralisée de la configuration via Pydantic Settings.

### Utilisation

```python
from app.core.config import settings

# Accéder aux paramètres
print(settings.app_name)
print(settings.database_url)
print(settings.environment)

# Vérifier environnement
from app.core.config import is_production, is_development
if is_development():
    print("Mode développement")
```

### Variables d'environnement

```bash
# Application
APP_NAME="TSA Contest AI API"
APP_VERSION="1.0.0"
ENVIRONMENT=development|production|test
DEBUG=true|false
LOG_LEVEL=DEBUG|INFO|WARNING|ERROR

# Base de données
DATABASE_URL=postgresql://user:pass@host:port/db

# CORS
ALLOWED_ORIGINS=["http://localhost:3000"]

# ML
MODELS_PATH=ml_models
PREDICTION_BATCH_SIZE=100
MODEL_RELOAD_INTERVAL=3600

# Monitoring
SENTRY_DSN=https://your-sentry-dsn

# Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300
```

### Configuration par environnement

```python
# Development
settings.debug = True
settings.log_level = "DEBUG"

# Production  
settings.debug = False
settings.log_level = "WARNING"

# Test
settings.database_url = "sqlite:///./test.db"
```

## 🗄️ database.py

Gestion de la connexion PostgreSQL et des sessions SQLAlchemy.

### Utilisation

```python
from app.core.database import get_db, engine, Base

# Dependency pour routes
@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# Test connexion
from app.core.database import test_connection
if test_connection():
    print("DB OK")

# Initialiser DB
await init_db()

# Reflection des tables Adonis
tables = reflect_tables()
print(f"Tables trouvées : {list(tables.keys())}")
```

### Configuration DB

```python
# URL de connexion
DATABASE_URL = "postgresql://tsa_user:tsa_password@postgres:5432/tsa_contest"

# Paramètres pool
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Vérifier connexions
    pool_recycle=300,        # Recycler après 5min
    echo=settings.debug      # Log SQL en debug
)
```

### Session management

```python
# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency avec gestion erreurs
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
```

## 🔗 dependencies.py

Dependencies FastAPI pour injection de dépendances.

### Utilisation

```python
from app.core.dependencies import get_user_from_header

@app.get("/protected")
async def protected_route(user = Depends(get_user_from_header)):
    return {"user_id": user["id"], "role": user["role"]}
```

### Dependencies disponibles

```python
# Récupérer user depuis headers Nginx
async def get_user_from_header(
    x_user_id: str = Header(None),
    x_user_email: str = Header(None),
    x_user_role: str = Header(None)
) -> dict

# Valider appel interne
async def validate_internal_call(
    x_internal_service: str = Header(None)
) -> bool

# ML Service
def get_ml_service() -> MLService

# Session DB
def get_database_session() = Depends(get_db)
```

### Mock en développement

```python
# En mode development, headers optionnels
if settings.environment == "development":
    return {
        "id": int(x_user_id) if x_user_id else 1,
        "email": x_user_email or "dev@tsa.com", 
        "role": x_user_role or "admin"
    }
```

## 🔐 security.py (Optionnel)

Utilitaires de sécurité pour validation et hashing.

> **Note** : Authentification gérée par Adonis, ce fichier est principalement pour les utilitaires.

### Utilisation

```python
from app.core.security import verify_password, get_password_hash

# Hash password (si nécessaire)
hashed = get_password_hash("mypassword")

# Vérifier password  
is_valid = verify_password("mypassword", hashed)

# JWT helpers (pour debug uniquement)
token_claims = get_token_claims(jwt_token)
is_expired = is_token_expired(jwt_token)
```

## 🚀 Initialisation

### Startup sequence

```python
# 1. Charger configuration
from app.core.config import settings

# 2. Initialiser database
from app.core.database import init_db
await init_db()

# 3. Charger ML models
from app.services.ml_service import ml_service
await ml_service.load_all_models()

# 4. App prête
logger.info("FastAPI AI service ready!")
```

### Health checks

```python
# Database health
def check_db_health():
    return test_connection()

# Configuration health  
def check_config_health():
    required_vars = ["DATABASE_URL", "APP_NAME"]
    missing = [var for var in required_vars if not getattr(settings, var.lower())]
    return len(missing) == 0
```

## 🛠️ Développement

### Ajout nouvelle config

```python
# 1. Ajouter dans config.py
class Settings(BaseSettings):
    new_setting: str = Field(default="default_value", alias="NEW_SETTING")

# 2. Ajouter dans .env
NEW_SETTING=my_value

# 3. Utiliser dans app
from app.core.config import settings
print(settings.new_setting)
```

### Nouvelle dependency

```python
# 1. Créer dans dependencies.py
async def get_new_dependency(
    param: str = Header(None)
) -> SomeType:
    # Logic here
    return result

# 2. Utiliser dans endpoint
@router.get("/endpoint")
async def my_endpoint(
    data = Depends(get_new_dependency)
):
    return data
```

## 🧪 Tests

```python
# Test configuration
def test_config():
    assert settings.app_name == "TSA Contest AI API"
    assert is_development() == True

# Test database
def test_database():
    assert test_connection() == True

# Test dependencies
def test_user_header():
    # Mock headers
    headers = {"X-User-ID": "1", "X-User-Role": "admin"}
    user = get_user_from_header(**headers)
    assert user["id"] == 1
```

## 📝 Best Practices

1. **Configuration centralisée** : Tout dans `config.py`
2. **Variables d'environnement** : Utiliser `.env` en dev
3. **Validation Pydantic** : Type checking automatique
4. **Dependencies** : Réutilisables et testables
5. **Error handling** : Gestion propre des erreurs DB
6. **Logging** : Configuration par environnement