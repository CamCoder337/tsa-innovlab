# 🚀 Guide Rapide de Déploiement

> Déployez votre application driver-app en production en **moins de 15 minutes** !

## 📋 Prérequis

- Node.js installé
- Compte Expo (gratuit) : https://expo.dev/signup

## ⚡ Déploiement Ultra-Rapide (Recommandé)

### Étape 1 : Configurer l'environnement de production

```bash
cd apps/driver-app
npm run env:prod
```

✅ Cela configure automatiquement l'application pour utiliser le serveur en ligne : `http://51.91.77.0:30000`

### Étape 2 : Se connecter à Expo

```bash
npx eas login
```

Entrez vos identifiants Expo (ou créez un compte si nécessaire).

### Étape 3 : Déployer sur Android

```bash
npm run deploy:android
```

⏱️ **Attendez 10-15 minutes** pendant que le build se fait dans le cloud.

### Étape 4 : Télécharger et distribuer l'APK

Une fois le build terminé, vous recevrez un lien comme :
```
https://expo.dev/accounts/raylex33/projects/tsa-driver-app/builds/xxxxx
```

📱 **Partagez ce lien directement aux chauffeurs** ou téléchargez l'APK pour le distribuer.

---

## 🎯 Commandes Disponibles

### Gestion des environnements

```bash
# Passer en mode développement (backend local)
npm run env:dev

# Passer en mode production (backend en ligne)
npm run env:prod
```

### Déploiement

```bash
# Déployer Android via EAS (recommandé)
npm run deploy:android

# Déployer iOS via EAS
npm run deploy:ios

# Déployer Android + iOS
npm run deploy:both

# Build Android en local (avancé)
npm run deploy:android:local
```

### Mises à jour

```bash
# Publier une mise à jour OTA (sans rebuild)
npm run update:eas

# Les utilisateurs recevront la mise à jour au prochain démarrage
```

---

## 🔄 Workflow Complet

### Premier déploiement

```bash
# 1. Configurer en production
npm run env:prod

# 2. Vérifier la configuration
cat .env | grep API_BASE_URL
# Devrait afficher: EXPO_PUBLIC_API_BASE_URL=http://51.91.77.0:30000

# 3. Se connecter à Expo
npx eas login

# 4. Déployer
npm run deploy:android

# 5. Télécharger l'APK via le lien fourni
```

### Mise à jour du code (OTA)

```bash
# 1. Modifier le code

# 2. Publier la mise à jour
npm run update:eas

# 3. C'est tout ! Les utilisateurs recevront la mise à jour automatiquement
```

### Nouveau build complet (changement natif)

```bash
# Si vous modifiez des dépendances natives ou la configuration
npm run deploy:android
```

---

## 📱 Installation sur les appareils

### Méthode 1 : Lien direct (Plus simple)

1. Partager le lien Expo aux chauffeurs
2. Ouvrir le lien sur le téléphone Android
3. Télécharger l'APK
4. Autoriser l'installation depuis des sources inconnues
5. Installer

### Méthode 2 : Fichier APK

1. Télécharger l'APK depuis Expo
2. Transférer le fichier aux chauffeurs (email, Drive, etc.)
3. Ouvrir le fichier sur le téléphone
4. Autoriser l'installation
5. Installer

---

## 🔧 Troubleshooting

### "Not logged in to EAS"

```bash
npx eas login
```

### "Build failed"

Vérifier les logs :
```bash
npx eas build:list
```

Nettoyer et réessayer :
```bash
rm -rf node_modules
npm install
npm run deploy:android
```

### "Cannot connect to backend"

Vérifier que vous êtes en mode production :
```bash
cat .env | grep EXPO_PUBLIC_ENV
# Devrait afficher: EXPO_PUBLIC_ENV=production
```

Si non, exécuter :
```bash
npm run env:prod
```

### Tester la connexion au serveur

```bash
# Depuis n'importe quel terminal
curl http://51.91.77.0:30000/health

# Devrait retourner une réponse du serveur
```

---

## 📊 Différences entre les environnements

| Configuration | Development | Production |
|---------------|-------------|------------|
| **API Backend** | localhost:3333 | 51.91.77.0:30000 |
| **Debug Mode** | ✅ Activé | ❌ Désactivé |
| **Simulation** | ✅ Activée | ❌ Désactivée |
| **Logs** | ✅ Détaillés | ❌ Minimaux |

---

## 🎓 En savoir plus

Pour des options de déploiement avancées, consultez :
- [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) - Guide complet avec toutes les méthodes

---

## ✅ Checklist de déploiement

Avant de déployer, vérifiez :

- [ ] Environnement configuré en production (`npm run env:prod`)
- [ ] Tests passés (`npm test`)
- [ ] Connecté à Expo (`npx eas login`)
- [ ] Backend en ligne accessible (`curl http://51.91.77.0:30000/health`)
- [ ] Clé Google Maps configurée dans `.env`

Ensuite :

- [ ] Lancer le build (`npm run deploy:android`)
- [ ] Attendre la fin du build (~15 min)
- [ ] Télécharger l'APK
- [ ] Tester sur un appareil réel
- [ ] Distribuer aux chauffeurs

---

## 💡 Astuces

### Déployer plus rapidement

Utilisez EAS Updates pour les changements de code :
```bash
npm run update:eas
```

Mises à jour instantanées, pas besoin de rebuild !

### Revenir en développement

```bash
npm run env:dev
npm start -- --clear
```

### Vérifier la configuration actuelle

```bash
cat .env | head -20
```

---

**Prêt à déployer ? 🚀**

```bash
npm run env:prod && npm run deploy:android
```
