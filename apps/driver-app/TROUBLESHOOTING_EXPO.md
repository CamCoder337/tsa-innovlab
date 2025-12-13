# Guide de Dépannage Expo Go

## Erreur: "Could not connect to the server"

### 🔍 Diagnostic rapide

Exécutez d'abord le diagnostic automatique :
```bash
cd apps/driver-app
npm run diagnose
```

### 🛠️ Solutions par ordre de priorité

#### 1. Serveur backend non démarré
**Symptôme**: `localhost:3333` inaccessible

**Solution**:
```bash
cd services/tsa-monolith
npm run dev
```

#### 2. IP address changée
**Symptôme**: IP dans .env différente de l'IP actuelle

**Solution**:
```bash
cd apps/driver-app
npm run update-ip
npm start
```

#### 3. Firewall Windows
**Symptôme**: `localhost` OK mais IP locale inaccessible

**Solution**:
1. Ouvrir "Pare-feu Windows Defender"
2. Cliquer "Paramètres avancés"
3. "Règles de trafic entrant" → "Nouvelle règle"
4. Type: Port → TCP → Port 3333
5. Action: Autoriser la connexion
6. Profils: Tous
7. Nom: "TSA Backend"

#### 4. Réseau Wi-Fi différent
**Symptôme**: Téléphone et PC sur des réseaux différents

**Solution**:
- Connecter le téléphone au même Wi-Fi que le PC
- Ou utiliser le mode tunnel: `expo start --tunnel`

#### 5. Cache Expo
**Symptôme**: Erreurs persistantes après corrections

**Solution**:
```bash
expo start --clear
# Ou
npx expo start --clear --reset-cache
```

### 📱 Tests de connectivité

#### Depuis le navigateur du téléphone
Testez ces URLs dans le navigateur de votre téléphone :

```
http://[VOTRE_IP]:3333
http://[VOTRE_IP]:3333/api/health
```

Si ça ne fonctionne pas, le problème est réseau/firewall.

#### Depuis Expo Go
1. Scanner le QR code
2. Si erreur "Could not connect", problème réseau
3. Si l'app se lance mais API errors, problème backend

### 🔧 Commandes utiles

```bash
# Diagnostic complet
npm run diagnose

# Mise à jour IP automatique
npm run update-ip

# Démarrage avec cache clear
npm run dev

# Mode tunnel (plus lent mais contourne les problèmes réseau)
expo start --tunnel

# Vérifier l'IP actuelle
ipconfig (Windows) / ifconfig (Mac/Linux)

# Tester le backend
curl http://localhost:3333/api/health
```

### 🌐 Modes de connexion Expo

#### 1. LAN (par défaut)
- Plus rapide
- Nécessite même réseau Wi-Fi
- Peut être bloqué par firewall

#### 2. Tunnel
- Plus lent mais plus fiable
- Passe par les serveurs Expo
- Fonctionne avec n'importe quel réseau

```bash
expo start --tunnel
```

#### 3. Localhost (développement)
- Seulement pour simulateurs
- Ne fonctionne pas sur appareils physiques

### 🚨 Erreurs courantes

#### "Network request failed"
- Backend non démarré
- URL incorrecte dans .env
- Firewall bloque les connexions

#### "Expo Go crashed"
- Code JavaScript avec erreurs
- Dépendances manquantes
- Cache corrompu

#### "Unable to resolve module"
- Dépendances non installées: `npm install`
- Cache Metro: `npx expo start --clear`

### 📞 Support

Si le problème persiste après ces étapes :

1. Exécuter `npm run diagnose` et copier la sortie
2. Vérifier les logs du serveur backend
3. Tester avec `expo start --tunnel`
4. Redémarrer complètement (PC + téléphone + router)

### 🎯 Configuration recommandée

Pour éviter les problèmes futurs :

```bash
# .env
EXPO_PUBLIC_API_BASE_URL=http://[IP_FIXE]:3333

# Ou utiliser un nom d'hôte local
EXPO_PUBLIC_API_BASE_URL=http://dev.local:3333
```

Et configurer `dev.local` dans le fichier hosts du système.