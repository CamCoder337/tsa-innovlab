# 🔧 Configuration de l'Environnement - TSA Driver App

Guide complet pour configurer les variables d'environnement de l'application mobile Driver.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Configuration Initiale](#configuration-initiale)
- [Variables d'Environnement](#variables-denvironnement)
- [Environnements Multiples](#environnements-multiples)
- [Configuration Réseau](#configuration-réseau)
- [Déploiement avec EAS](#déploiement-avec-eas)
- [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

L'application Driver utilise un système centralisé de gestion des variables d'environnement qui permet :

- ✅ Configuration flexible selon l'environnement (dev, staging, prod)
- ✅ Type safety complet avec TypeScript
- ✅ Validation au démarrage
- ✅ Fallbacks intelligents
- ✅ Support pour appareils physiques, émulateurs et simulateurs
- ✅ Aucune IP hardcodée

### Architecture

```
apps/driver-app/
├── .env.example          # Template des variables (committé)
├── .env                  # Variables locales (ignoré par git)
├── app.json              # Config Expo avec fallbacks
└── src/config/
    ├── env.ts            # Système centralisé de gestion
    └── environment.types.ts  # Types TypeScript
```

---

## 🚀 Configuration Initiale

### 1. Créer votre fichier `.env`

```bash
cd apps/driver-app
cp .env.example .env
```

### 2. Configurer l'URL de l'API (Automatique)

**🎯 Méthode Recommandée : Détection Automatique**

Utilisez le script de détection automatique d'IP :

```bash
# Détecte automatiquement votre IP locale et met à jour le .env
npm run update-ip

# Ou lancez directement en mode dev (détecte l'IP + démarre Expo)
npm run dev
```

Le script détectera automatiquement votre IP locale et configurera le `.env` correctement !

---

### 2b. Configuration Manuelle (Optionnel)

Si vous préférez configurer manuellement, ouvrez `.env` et modifiez `EXPO_PUBLIC_API_BASE_URL` selon votre cas :

#### Pour Simulateur iOS (Mac)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3333
```

#### Pour Émulateur Android
```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3333
```

#### Pour Appareil Physique (même réseau Wi-Fi)

**Étape 1 : Trouver votre IP locale**

**Windows :**
```bash
ipconfig
# Cherchez "Adresse IPv4" (ex: 192.168.1.100)
```

**Mac/Linux :**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# ou
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Étape 2 : Configurer l'URL**
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3333
```

> ⚠️ **Important** : Remplacez `192.168.1.100` par votre IP réelle

### 3. Redémarrer Expo

Après modification du `.env`, redémarrez avec un cache propre :

```bash
npx expo start --clear
```

---

## 📝 Variables d'Environnement

### Variables Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | URL du backend AdonisJS | `http://192.168.1.100:3333` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Clé API Google Maps | `AIzaSy...` |

### Variables Optionnelles

| Variable | Défaut | Description |
|----------|--------|-------------|
| `EXPO_PUBLIC_ENV` | `development` | Environnement actuel |
| `EXPO_PUBLIC_API_TIMEOUT` | `30000` | Timeout API (ms) |
| `EXPO_PUBLIC_LOCATION_UPDATE_INTERVAL` | `5000` | Intervalle GPS (ms) |
| `EXPO_PUBLIC_LOCATION_DISTANCE_FILTER` | `10` | Distance min GPS (m) |
| `EXPO_PUBLIC_LOCATION_ACCURACY` | `bestForNavigation` | Précision GPS |
| `EXPO_PUBLIC_DEBUG_MODE` | `true` | Logs de debug |
| `EXPO_PUBLIC_DEBUG_TRACKING` | `true` | Logs GPS |
| `EXPO_PUBLIC_DEBUG_API` | `true` | Logs API |

### Valeurs Possibles

**`EXPO_PUBLIC_ENV`** :
- `development` : Développement local
- `staging` : Environnement de test
- `production` : Production

**`EXPO_PUBLIC_LOCATION_ACCURACY`** :
- `lowest` : Économie de batterie max
- `low` : Basse précision
- `balanced` : Équilibré
- `high` : Haute précision
- `highest` : Précision maximale
- `bestForNavigation` : Optimal pour navigation

---

## 🌍 Environnements Multiples

### Créer des configurations spécifiques

**`.env.development`** (local) :
```env
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3333
EXPO_PUBLIC_DEBUG_MODE=true
```

**`.env.staging`** (test) :
```env
EXPO_PUBLIC_ENV=staging
EXPO_PUBLIC_API_BASE_URL=https://staging-api.tsa-innovlab.com
EXPO_PUBLIC_DEBUG_MODE=true
```

**`.env.production`** (prod) :
```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_BASE_URL=https://api.tsa-innovlab.com
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_ENABLE_SSL=true
```

### Charger un environnement spécifique

```bash
# Développement (défaut)
npm start

# Staging
npx expo start --clear

# Production (nécessite EAS Build)
eas build --profile production
```

---

## 🌐 Configuration Réseau

### Réseau Local (Développement)

**Vérifier la connectivité** :

```bash
# Depuis votre machine
curl http://localhost:3333/api/health

# Depuis votre téléphone (remplacer l'IP)
curl http://192.168.1.100:3333/api/health
```

**Problèmes communs** :

| Problème | Solution |
|----------|----------|
| "Network request failed" | Vérifier firewall, IP correcte, backend lancé |
| "Connection refused" | Port 3333 accessible ? Backend écoute sur `0.0.0.0` ? |
| Fonctionne sur émulateur mais pas téléphone | Utiliser IP locale au lieu de `localhost` |

### Firewall Windows

Autoriser le port 3333 :

```powershell
# PowerShell en Admin
New-NetFirewallRule -DisplayName "TSA API" -Direction Inbound -LocalPort 3333 -Protocol TCP -Action Allow
```

### Firewall macOS

```bash
# Désactiver temporairement
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Réactiver après tests
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

---

## 🚀 Déploiement avec EAS

### Configuration EAS

Créer `eas.json` :

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "development",
        "EXPO_PUBLIC_API_BASE_URL": "http://10.0.2.2:3333"
      }
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "staging",
        "EXPO_PUBLIC_API_BASE_URL": "https://staging-api.tsa-innovlab.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ENV": "production",
        "EXPO_PUBLIC_API_BASE_URL": "https://api.tsa-innovlab.com",
        "EXPO_PUBLIC_ENABLE_SSL": "true",
        "EXPO_PUBLIC_DEBUG_MODE": "false"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build & Deploy

```bash
# Installer EAS CLI
npm install -g eas-cli

# Login
eas login

# Build development
eas build --profile development --platform android

# Build staging
eas build --profile staging --platform all

# Build production
eas build --profile production --platform all
```

### Secrets EAS

Configurer des variables sensibles :

```bash
# Ajouter un secret
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "AIzaSy..."

# Lister les secrets
eas secret:list

# Supprimer un secret
eas secret:delete --name GOOGLE_MAPS_API_KEY
```

Utiliser dans `eas.json` :

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "@GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

---

## 🐛 Dépannage

### Logs de Configuration

Au démarrage de l'app (mode debug), vous verrez :

```
╔════════════════════════════════════════════════════════════════════════════╗
║  TSA Driver App - Environment Configuration                                ║
╚════════════════════════════════════════════════════════════════════════════╝

🌍 Environment: development
📱 Platform: ios

🔌 API Configuration:
   Base URL: http://192.168.1.100:3333
   Timeout: 30000ms

🗺️  Google Maps:
   API Key: ✓ Set
   Map ID: Not Set

📍 Location Tracking:
   Update Interval: 5000ms
   Distance Filter: 10m
   Accuracy: bestForNavigation
```

### Activer les Logs Détaillés

Dans `.env` :

```env
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_DEBUG_TRACKING=true
EXPO_PUBLIC_DEBUG_API=true
```

### Vérifier la Configuration Manuellement

Dans votre code :

```typescript
import { env } from '@/config/env';

// Log toute la config
env.logConfig();

// Vérifier des valeurs spécifiques
console.log('API URL:', env.apiBaseUrl());
console.log('Is Dev:', env.isDevelopment());
console.log('Full Config:', env.getConfig());
```

### Problèmes Courants

**1. Variables non prises en compte**

```bash
# Nettoyer le cache
npx expo start --clear

# Ou supprimer complètement
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

**2. IP change constamment**

Utiliser un DNS local (Avahi/Bonjour) :

```env
# macOS/Linux avec Avahi
EXPO_PUBLIC_API_BASE_URL=http://nom-machine.local:3333
```

**3. Backend inaccessible depuis le téléphone**

```bash
# Vérifier que le backend écoute sur toutes les interfaces
# AdonisJS : config/server.ts
host: '0.0.0.0'  # PAS 'localhost'
```

**4. Variables non définies**

```typescript
// Vérifier si une variable est définie
if (!env.apiBaseUrl()) {
  console.error('API Base URL not configured!');
}
```

---

## 📚 Utilisation dans le Code

### Import Recommandé

```typescript
import { env } from '@/config/env';

// ✅ Bon - Utiliser l'objet env
const apiUrl = env.apiBaseUrl();
const timeout = env.apiTimeout();

// ❌ Éviter - Accès direct
const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const apiUrl = Constants.expoConfig?.extra?.apiBaseUrl;
```

### Configuration Complète

```typescript
import { env } from '@/config/env';

// Obtenir toute la configuration
const config = env.getConfig();

console.log(config);
// {
//   env: 'development',
//   isDevelopment: true,
//   apiBaseUrl: 'http://192.168.1.100:3333',
//   apiTimeout: 30000,
//   ...
// }
```

### Vérifications Conditionnelles

```typescript
import { env } from '@/config/env';

// Comportement selon l'environnement
if (env.isDevelopment()) {
  console.log('Dev mode - showing debug info');
}

if (env.debugApi()) {
  console.log('API Request:', url, payload);
}

// Feature flags
if (env.issueReportingEnabled()) {
  // Afficher le bouton de signalement
}
```

---

## 🔒 Sécurité

### Variables Sensibles

**❌ NE JAMAIS committer** :
- `.env` (fichier local)
- Clés API privées
- Tokens d'authentification
- URLs de production avec secrets

**✅ Sûr de committer** :
- `.env.example` (template sans valeurs sensibles)
- `app.json` (avec valeurs de développement uniquement)

### Production

En production, utiliser :
- EAS Secrets pour les clés sensibles
- Variables d'environnement serveur
- Chiffrement des communications (SSL)

```env
EXPO_PUBLIC_ENABLE_SSL=true
```

---

## 📞 Support

Pour plus d'informations :

- **Documentation Expo** : https://docs.expo.dev/guides/environment-variables/
- **Configuration EAS** : https://docs.expo.dev/build/introduction/
- **Problèmes connus** : Voir les issues GitHub du projet

---

**Dernière mise à jour** : Décembre 2024
**Version du système** : 1.0.0
