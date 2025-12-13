# 🚀 Guide de Déploiement Gratuit - TSA Driver App

Ce guide présente plusieurs méthodes **100% gratuites** pour déployer l'application driver-app et la rendre accessible aux chauffeurs.

## 📋 Table des matières

1. [Configuration préalable](#configuration-préalable)
2. [Méthode 1 : Expo Go (Test rapide)](#méthode-1--expo-go-test-rapide)
3. [Méthode 2 : EAS Build + Updates (Recommandé)](#méthode-2--eas-build--updates-recommandé)
4. [Méthode 3 : Build local + APK Direct](#méthode-3--build-local--apk-direct)
5. [Méthode 4 : GitHub Actions + Release](#méthode-4--github-actions--release)

---

## ✅ Configuration préalable

### 1. Vérifier la configuration backend

Le fichier `.env` a été configuré pour pointer vers le serveur en ligne :

```bash
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_BASE_URL=http://51.91.77.0:30000
```

### 2. Installer les outils nécessaires

```bash
# Installer EAS CLI (pour les méthodes 2 et 3)
npm install -g eas-cli

# Se connecter à Expo
npx eas login
```

---

## 🎯 Méthode 1 : Expo Go (Test rapide)

**Idéal pour :** Tests rapides, démonstrations
**Coût :** 100% Gratuit
**Limitations :** Ne fonctionne qu'avec Expo Go installé sur le téléphone

### Étapes :

1. **Démarrer le serveur de développement**
   ```bash
   cd apps/driver-app
   npm start
   ```

2. **Scanner le QR code**
   - Sur Android : Scanner avec l'app Expo Go
   - Sur iOS : Scanner avec l'appareil photo

3. **Publier sur Expo Cloud** (optionnel pour partage)
   ```bash
   npx expo publish
   ```

**Avantages :**
- ✅ Déploiement instantané
- ✅ 100% gratuit
- ✅ Mises à jour en temps réel

**Inconvénients :**
- ❌ Nécessite l'app Expo Go
- ❌ Ne fonctionne pas avec certaines fonctionnalités natives
- ❌ Pas professionnel pour production

---

## 🏆 Méthode 2 : EAS Build + Updates (Recommandé)

**Idéal pour :** Production professionnelle
**Coût :** 100% Gratuit (avec compte Expo gratuit)
**Résultat :** APK/IPA standalone

### Configuration initiale :

1. **Créer un compte Expo** sur https://expo.dev (gratuit)

2. **Configurer EAS**
   ```bash
   cd apps/driver-app
   npx eas build:configure
   ```

3. **Mettre à jour `eas.json`**
   ```json
   {
     "build": {
       "production": {
         "android": {
           "buildType": "apk",
           "distribution": "internal"
         },
         "ios": {
           "buildType": "archive",
           "distribution": "internal"
         }
       },
       "preview": {
         "android": {
           "buildType": "apk",
           "distribution": "internal"
         }
       }
     }
   }
   ```

### Build Android (APK) :

```bash
# Build pour Android
npx eas build --platform android --profile production

# Attendre la fin du build (~10-15 minutes)
# Télécharger l'APK depuis le lien fourni
```

### Distribution :

**Option A : Lien direct**
- Après le build, Expo fournit un lien de téléchargement
- Partager ce lien aux chauffeurs
- Valable pendant 30 jours (renouvelable gratuitement)

**Option B : Expo Updates (OTA)**
```bash
# Publier des mises à jour sans rebuild
npx eas update --branch production --message "Mise à jour v1.0.1"
```

**Avantages :**
- ✅ Application standalone professionnelle
- ✅ Build dans le cloud (pas besoin de Android Studio)
- ✅ Mises à jour OTA gratuites
- ✅ Builds illimités sur le plan gratuit
- ✅ Signature automatique de l'APK

**Inconvénients :**
- ⏱️ Build prend 10-15 minutes
- 📱 Installation manuelle nécessaire (pas sur Play Store)

### Limites du plan gratuit Expo :
- ✅ Builds illimités
- ✅ Updates OTA illimités jusqu'à 30 requêtes/minute
- ✅ Pas de limite de téléchargement

---

## 💻 Méthode 3 : Build local + APK Direct

**Idéal pour :** Contrôle total, pas de dépendance cloud
**Coût :** 100% Gratuit
**Prérequis :** Android Studio installé

### Étapes :

1. **Installer Android Studio**
   - Télécharger depuis https://developer.android.com/studio
   - Installer les SDK Android 33+

2. **Configurer l'environnement**
   ```bash
   cd apps/driver-app

   # Créer les dossiers Android si nécessaire
   npx expo prebuild --platform android
   ```

3. **Build l'APK en local**
   ```bash
   # Option 1 : Via Expo
   npx expo run:android --variant release

   # Option 2 : Via Gradle directement
   cd android
   ./gradlew assembleRelease
   ```

4. **Récupérer l'APK**
   ```
   apps/driver-app/android/app/build/outputs/apk/release/app-release.apk
   ```

5. **Distribuer l'APK**
   - Upload sur Google Drive / Dropbox
   - Envoyer par email
   - Héberger sur un serveur web simple

**Avantages :**
- ✅ 100% gratuit et autonome
- ✅ Contrôle total du processus
- ✅ Pas de dépendance à des services cloud
- ✅ APK disponible immédiatement

**Inconvénients :**
- ⚙️ Configuration initiale complexe
- 💾 Nécessite de l'espace disque (~5 GB)
- 🔄 Pas de mises à jour OTA automatiques

---

## 🤖 Méthode 4 : GitHub Actions + Release

**Idéal pour :** Automatisation complète, CI/CD
**Coût :** 100% Gratuit (GitHub Actions)
**Résultat :** APK publié automatiquement sur GitHub Releases

### Configuration :

1. **Créer `.github/workflows/build-android.yml`**

```yaml
name: Build Android APK

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        working-directory: apps/driver-app
        run: npm ci

      - name: Build APK
        working-directory: apps/driver-app
        run: npx eas build --platform android --profile production --non-interactive

      - name: Upload to Release
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: |
            apps/driver-app/android/app/build/outputs/apk/release/*.apk
```

2. **Configurer les secrets GitHub**
   - Aller dans Settings > Secrets > Actions
   - Ajouter `EXPO_TOKEN` (obtenir via `npx eas login`)

3. **Créer une release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Télécharger l'APK**
   - Aller sur GitHub > Releases
   - Télécharger l'APK généré

**Avantages :**
- ✅ 100% automatisé
- ✅ Versionning clair
- ✅ Builds reproductibles
- ✅ Gratuit jusqu'à 2000 minutes/mois

**Inconvénients :**
- ⚙️ Configuration initiale complexe
- 🔧 Nécessite de maintenir le workflow

---

## 📊 Comparaison des méthodes

| Critère | Expo Go | EAS Build | Build Local | GitHub Actions |
|---------|---------|-----------|-------------|----------------|
| **Coût** | Gratuit | Gratuit | Gratuit | Gratuit |
| **Facilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Temps setup** | < 1 min | 5 min | 30 min | 20 min |
| **Professionnalisme** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Updates OTA** | ✅ | ✅ | ❌ | ❌ |
| **Standalone APK** | ❌ | ✅ | ✅ | ✅ |

---

## 🎯 Recommandation

### Pour démarrage rapide (aujourd'hui) :
**→ Méthode 2 : EAS Build**
- Simple, rapide, professionnel
- APK prêt en 15 minutes
- Mises à jour OTA gratuites

### Pour production long terme :
**→ Méthode 2 (EAS Build) + Méthode 4 (GitHub Actions)**
- EAS Build pour les premiers déploiements
- GitHub Actions pour automatiser les releases futures

---

## 🚀 Quick Start (Méthode 2 recommandée)

```bash
# 1. Se connecter à Expo
npx eas login

# 2. Configurer EAS (si pas déjà fait)
cd apps/driver-app
npx eas build:configure

# 3. Lancer le build Android
npx eas build --platform android --profile production

# 4. Attendre ~15 minutes

# 5. Télécharger l'APK via le lien fourni

# 6. Distribuer aux chauffeurs
```

---

## 📱 Installation de l'APK sur Android

### Méthode 1 : Téléchargement direct
1. Envoyer le lien de l'APK aux chauffeurs
2. Ouvrir le lien sur le téléphone Android
3. Autoriser l'installation depuis des sources inconnues
4. Installer l'APK

### Méthode 2 : Via câble USB
```bash
# Activer le mode développeur sur le téléphone
# Activer le débogage USB
adb install app-release.apk
```

---

## 🔄 Mises à jour

### Avec EAS Updates (Méthode 2) :
```bash
# Modifier le code
# Publier la mise à jour
npx eas update --branch production --message "Fix bug connexion"

# Les utilisateurs recevront la mise à jour au prochain démarrage
```

### Sans EAS Updates (Méthodes 3 et 4) :
- Rebuild l'APK
- Redistribuer le nouveau fichier
- Les utilisateurs doivent réinstaller manuellement

---

## 🆘 Troubleshooting

### L'APK ne se connecte pas au serveur
```bash
# Vérifier que le serveur est accessible
curl http://51.91.77.0:30000/health

# Vérifier le .env
cat apps/driver-app/.env | grep API_BASE_URL
```

### Expo Go ne fonctionne pas
- Vérifier que le téléphone et l'ordinateur sont sur le même réseau
- Utiliser l'option "Tunnel" dans Expo

### EAS Build échoue
```bash
# Vérifier les logs
npx eas build:list

# Nettoyer et réessayer
cd apps/driver-app
rm -rf node_modules
npm install
npx eas build --platform android --profile production --clear-cache
```

---

## 📞 Support

- Documentation Expo : https://docs.expo.dev
- EAS Build : https://docs.expo.dev/build/introduction
- EAS Updates : https://docs.expo.dev/eas-update/introduction

---

**Prêt à déployer ? 🚀**

Je recommande de commencer par la **Méthode 2 (EAS Build)**. C'est le meilleur équilibre entre simplicité et professionnalisme.
