# 📦 Configuration de Déploiement - Driver App

## ✅ Changements Effectués

Votre application driver-app est maintenant prête pour le déploiement en production ! Voici ce qui a été configuré :

### 1. Configuration de l'environnement production

**Fichier `.env` mis à jour** pour pointer vers le serveur en ligne :
```bash
EXPO_PUBLIC_API_BASE_URL=http://51.91.77.0:30000
EXPO_PUBLIC_ENV=production
```

### 2. Fichiers d'environnement séparés

Trois fichiers de configuration créés :

- **`.env`** - Configuration active (actuellement en **production**)
- **`.env.production`** - Configuration pour le serveur en ligne (51.91.77.0:30000)
- **`.env.development`** - Configuration pour le développement local (localhost:3333)

### 3. Scripts automatisés

**Nouveaux scripts dans `package.json`** :

```json
{
  "env:dev": "Basculer en développement",
  "env:prod": "Basculer en production",
  "deploy:android": "Déployer Android via EAS",
  "deploy:ios": "Déployer iOS via EAS",
  "deploy:both": "Déployer Android + iOS",
  "deploy:android:local": "Build Android en local",
  "build:eas": "Build manuel EAS",
  "update:eas": "Publier une mise à jour OTA",
  "publish": "Publier sur Expo"
}
```

### 4. Scripts helper créés

- **`scripts/switch-env.js`** - Script intelligent pour basculer entre environnements
- **`scripts/deploy.js`** - Script de déploiement automatisé avec vérifications

### 5. Documentation complète

- **`QUICK_DEPLOY.md`** - Guide rapide (15 minutes)
- **`DEPLOYMENT_GUIDE.md`** - Guide complet avec 4 méthodes de déploiement
- **`DEPLOYMENT_SETUP.md`** - Ce fichier (récapitulatif)

---

## 🚀 Comment Déployer Maintenant

### Option 1 : Déploiement Rapide (Recommandé)

```bash
# Étape 1 : Aller dans le dossier
cd apps/driver-app

# Étape 2 : Se connecter à Expo
npx eas login

# Étape 3 : Déployer
npm run deploy:android

# Étape 4 : Attendre ~15 minutes et télécharger l'APK
```

### Option 2 : Avec vérification manuelle

```bash
# 1. Vérifier l'environnement actuel
cat .env | grep API_BASE_URL
# Devrait afficher: http://51.91.77.0:30000

# 2. Si ce n'est pas le cas, basculer en production
npm run env:prod

# 3. Se connecter à Expo
npx eas login

# 4. Déployer
npm run deploy:android
```

---

## 🔄 Basculer entre environnements

### Développement (Backend local)

```bash
npm run env:dev
```

Configuration appliquée :
- ✅ API: `http://localhost:3333`
- ✅ Debug: Activé
- ✅ Simulation: Activée

### Production (Backend en ligne)

```bash
npm run env:prod
```

Configuration appliquée :
- ✅ API: `http://51.91.77.0:30000`
- ❌ Debug: Désactivé
- ❌ Simulation: Désactivée

---

## 📋 Structure des fichiers

```
apps/driver-app/
├── .env                          # Configuration active (actuellement PRODUCTION)
├── .env.development              # Configuration développement
├── .env.production               # Configuration production
├── scripts/
│   ├── switch-env.js            # Script pour changer d'environnement
│   ├── deploy.js                # Script de déploiement automatisé
│   └── detect-local-ip.js       # Script existant (détection IP)
├── QUICK_DEPLOY.md              # Guide rapide de déploiement
├── DEPLOYMENT_GUIDE.md          # Guide complet (4 méthodes)
└── DEPLOYMENT_SETUP.md          # Ce fichier
```

---

## 🎯 Méthodes de Déploiement Disponibles

### 1. Expo Go (Test rapide)
- ✅ 100% Gratuit
- ✅ Instantané
- ❌ Nécessite l'app Expo Go

```bash
npm start
# Scanner le QR code avec Expo Go
```

### 2. EAS Build (Recommandé pour production)
- ✅ 100% Gratuit
- ✅ Build dans le cloud
- ✅ APK standalone professionnel

```bash
npm run deploy:android
```

### 3. Build Local
- ✅ 100% Gratuit
- ✅ Contrôle total
- ⚠️ Nécessite Android Studio

```bash
npm run deploy:android:local
```

### 4. GitHub Actions (Automatisation)
- ✅ 100% Gratuit
- ✅ CI/CD automatique
- ⚠️ Configuration avancée requise

Voir `DEPLOYMENT_GUIDE.md` pour la configuration.

---

## 🔧 Commandes Utiles

### Vérifications

```bash
# Vérifier l'environnement actuel
cat .env | head -20

# Vérifier la connexion au serveur
curl http://51.91.77.0:30000/health

# Vérifier la configuration Expo
npx expo config --type public

# Voir les builds EAS
npx eas build:list
```

### Développement

```bash
# Mode développement avec backend local
npm run env:dev
npm run dev

# Mode production avec backend en ligne
npm run env:prod
npm start -- --clear
```

### Déploiement

```bash
# Déployer Android
npm run deploy:android

# Déployer iOS
npm run deploy:ios

# Déployer les deux plateformes
npm run deploy:both

# Mise à jour OTA (sans rebuild)
npm run update:eas
```

---

## 🎓 Guides Complets

1. **Pour démarrer rapidement** : Lisez [`QUICK_DEPLOY.md`](./QUICK_DEPLOY.md)
2. **Pour toutes les options** : Consultez [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)

---

## 📊 Configuration Actuelle

**Environnement :** Production
**API Backend :** http://51.91.77.0:30000
**Debug Mode :** Désactivé
**Plateforme cible :** Android (APK)

Pour vérifier :
```bash
cat .env
```

---

## ⚠️ Important

### Avant de déployer en production

- [x] Configuration `.env` mise à jour
- [ ] Tests passés (`npm test`)
- [ ] Backend accessible (`curl http://51.91.77.0:30000/health`)
- [ ] Compte Expo créé
- [ ] Connecté à EAS (`npx eas login`)

### Sécurité

- ✅ Le fichier `.env` est dans `.gitignore` (ne sera pas commit)
- ✅ Utilisez `.env.development` et `.env.production` comme templates
- ✅ Jamais de secrets dans le code source

---

## 🆘 Besoin d'aide ?

### Le build échoue

```bash
# Nettoyer et réinstaller
rm -rf node_modules
npm install

# Vérifier la connexion EAS
npx eas whoami

# Relancer le build
npm run deploy:android
```

### L'app ne se connecte pas au backend

```bash
# Vérifier la configuration
cat .env | grep API_BASE_URL

# Devrait afficher : http://51.91.77.0:30000
# Si différent :
npm run env:prod
npm start -- --clear
```

### Revenir à la configuration locale

```bash
npm run env:dev
```

---

## 🎉 Résumé

Vous avez maintenant :

✅ Une configuration production prête
✅ Des scripts automatisés pour déployer
✅ La possibilité de basculer facilement entre dev/prod
✅ Une documentation complète
✅ 4 méthodes de déploiement gratuites

**Prochaine étape :** Déployer l'application !

```bash
npm run deploy:android
```

Bonne chance ! 🚀
