# 🚀 Guide de Démarrage Rapide

## Problème de connexion Expo Go ?

### ⚡ Solution Express (1 minute)

```bash
cd apps/driver-app

# 1. Diagnostic automatique
npm run diagnose

# 2. Démarrage intelligent (recommandé)
npm start

# 3. Si problème, mode tunnel
npm run start:tunnel
```

### 🔧 Solutions par Symptôme

#### "Could not connect to server"
```bash
# Vérifier + corriger automatiquement
npm run update-ip
npm start
```

#### "Network request failed" dans l'app
```bash
# Vérifier que le backend tourne
cd ../../services/tsa-monolith
npm run dev

# Dans un autre terminal
cd apps/driver-app
npm start
```

#### Problèmes persistants
```bash
# Mode tunnel (plus lent mais fiable)
npm run start:tunnel
```

### 📱 Étapes de Test

1. **Démarrer le backend** (terminal 1):
   ```bash
   cd services/tsa-monolith
   npm run dev
   ```

2. **Démarrer l'app mobile** (terminal 2):
   ```bash
   cd apps/driver-app
   npm start
   ```

3. **Scanner le QR code** avec Expo Go

4. **Si erreur**, essayer le mode tunnel:
   ```bash
   npm run start:tunnel
   ```

### 🌐 URLs de Test

Testez ces URLs dans le navigateur de votre téléphone :

- Backend: `http://[VOTRE_IP]:3333`
- Health check: `http://[VOTRE_IP]:3333/api/health`

Si ça ne marche pas → problème réseau/firewall.

### 🆘 Support Rapide

**Erreur commune**: `exp://192.168.1.55:8081`

**Cause**: IP changée ou firewall

**Solution**:
```bash
npm run update-ip
npm start
```

**Si ça ne marche toujours pas**:
```bash
npm run start:tunnel
```

### 💡 Conseils

- **Même Wi-Fi**: Téléphone et PC sur le même réseau
- **Firewall**: Autoriser le port 3333 sur Windows
- **Cache**: `npm run start:tunnel` si problèmes bizarres
- **Backend**: Toujours démarrer le serveur AdonisJS d'abord

### 🎯 Configuration Recommandée

Pour éviter les problèmes futurs, configurez une IP fixe ou utilisez le mode tunnel par défaut :

```json
// package.json
"start": "expo start --tunnel --clear"
```

Plus lent mais plus fiable pour le développement mobile.