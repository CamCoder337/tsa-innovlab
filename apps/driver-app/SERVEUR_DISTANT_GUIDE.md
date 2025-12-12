# Guide de Configuration pour Serveur Distant

## ✅ Configuration Effectuée

L'application mobile a été configurée pour utiliser le serveur distant au lieu du réseau local.

### Changements Appliqués

1. **Fichier `.env` modifié** :
   - `EXPO_PUBLIC_API_BASE_URL` changé de `http://192.168.1.55:3333` vers `http://51.91.77.0:30000`

### Configuration Actuelle

```env
EXPO_PUBLIC_API_BASE_URL=http://51.91.77.0:30000
```

## 🚀 Étapes pour Utiliser l'App avec le Serveur Distant

### 1. Redémarrer l'Application

Pour que les nouvelles variables d'environnement soient prises en compte :

```bash
cd apps/driver-app
npx expo start --clear
```

### 2. Vérifier la Configuration

L'app affichera la configuration au démarrage si le mode debug est activé. Vous devriez voir :

```
🔌 API Configuration:
   Base URL: http://51.91.77.0:30000
```

### 3. Tester la Connectivité

Une fois l'app démarrée, testez une fonctionnalité qui fait appel à l'API pour vérifier que la connexion fonctionne.

## 🔧 Configurations Disponibles

### Environnements Prédéfinis

- **Développement Local** : `cp .env.development .env`
- **Serveur Distant** : `cp .env.production .env` (déjà fait)

### Basculer Entre les Configurations

```bash
# Pour revenir au développement local
cp .env.development .env

# Pour utiliser le serveur distant
cp .env.production .env
```

## 🌐 Avantages du Serveur Distant

- ✅ Plus besoin d'être sur le même réseau local
- ✅ Accès depuis n'importe où avec une connexion internet
- ✅ Données partagées entre tous les utilisateurs
- ✅ Configuration de production

## 🔍 Dépannage

### Si l'app ne se connecte pas :

1. **Vérifier l'URL du serveur** :
   - Assurez-vous que `http://51.91.77.0:30000` est accessible
   - Testez dans un navigateur web

2. **Redémarrer l'app complètement** :
   ```bash
   npx expo start --clear
   ```

3. **Vérifier les logs** :
   - Regardez la console Expo pour les erreurs de réseau
   - Les logs d'API sont activés en mode debug

4. **Vérifier la configuration** :
   ```bash
   cat .env | grep API_BASE_URL
   ```

### Erreurs Communes

- **Network Error** : Le serveur n'est pas accessible
- **Timeout** : Le serveur met trop de temps à répondre
- **CORS Error** : Configuration CORS du serveur à vérifier

## 📱 Build pour Production

Pour créer un build avec cette configuration :

```bash
# Build de développement
npx expo build:android
npx expo build:ios

# Ou avec EAS Build
eas build --platform android
eas build --platform ios
```

## 🔄 Retour au Développement Local

Si vous voulez revenir au développement local :

```bash
cp .env.development .env
npx expo start --clear
```

---

**Note** : Cette configuration utilise le serveur distant `http://51.91.77.0:30000` qui doit être accessible depuis internet.