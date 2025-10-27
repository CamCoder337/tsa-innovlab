# 🔧 Correction des WebSockets en Production

## 📋 Problème Identifié

**Symptôme** : Erreur dans la console du navigateur
```
WebSocket connection to 'ws://51.91.77.0:30000/ws/notifications?token=...' failed
```

**Cause** : Nginx ne proxifiait pas les connexions WebSocket vers le backend AdonisJS car il manquait la configuration spécifique pour "upgrader" les connexions HTTP vers le protocole WebSocket.

## ✅ Solution Appliquée

### 1. Configuration Nginx Ajoutée

**Fichier modifié** : `services/tsa-monolith/nginx-backend.conf` (ligne 107-133)

Ajout d'une nouvelle section `location /ws/` avec :
- Headers WebSocket : `Upgrade` et `Connection "upgrade"`
- Timeouts longs (7 jours) pour connexions persistantes
- Buffering désactivé pour communication temps réel
- Pas de rate limiting (contrairement aux endpoints API)

```nginx
location /ws/ {
    proxy_pass http://adonisjs_backend;
    proxy_http_version 1.1;

    # WebSocket upgrade headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Long timeouts for WebSocket connections (7 days)
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;

    # Disable buffering for real-time communication
    proxy_buffering off;

    # Disable cache for WebSocket
    proxy_cache_bypass 1;
    proxy_no_cache 1;
}
```

### 2. Architecture après correction

```
Frontend Web (apps/frontend-web)
    ↓ ws://51.91.77.0:30000/ws/notifications?token=xxx
Nginx (port 30000 externe)
    ↓ Upgrade: websocket, Connection: upgrade
AdonisJS Backend (services/tsa-monolith, port 3333 interne)
    ↓ WebSocket handler (start/routes.ts:446-509)
WebSocketService Singleton (app/services/websocket_service.ts)
    ↓ Gestion des connexions temps réel
```

## 🚀 Étapes de Redéploiement

### Option 1 : Redémarrage Simple (Recommandé)

```bash
# Sur le VPS, redémarrer le container backend/nginx
cd /path/to/tsa-innovlab/services/tsa-monolith
docker-compose restart

# OU si container individuel
docker restart <container-name-backend>
```

### Option 2 : Rebuild Complet (Si changement de Dockerfile)

```bash
# Sur le VPS
cd /path/to/tsa-innovlab/services/tsa-monolith

# Rebuild l'image avec la nouvelle config nginx
docker-compose build --no-cache

# Relancer le service
docker-compose up -d
```

### Option 3 : Sans Docker (Nginx système)

```bash
# Copier la nouvelle config
sudo cp services/tsa-monolith/nginx-backend.conf /etc/nginx/sites-available/tsa-backend

# Tester la config
sudo nginx -t

# Si OK, recharger nginx
sudo systemctl reload nginx
```

## ✅ Vérification du Fonctionnement

### 1. Dans les logs Nginx

```bash
# Vérifier qu'il n'y a pas d'erreur
docker logs <container-nginx> --tail 50

# Vous devriez voir des connexions WebSocket réussies
```

### 2. Dans le navigateur (Console DevTools)

Après redéploiement, vous devriez voir dans la console :

```
✅ WebSocket connection opened
✅ WebSocket authenticated successfully
```

Au lieu de :

```
❌ WebSocket connection to 'ws://...' failed
```

### 3. Test de bout en bout

1. Ouvrir l'application frontend en production
2. Se connecter avec un compte utilisateur
3. Ouvrir la console DevTools (F12)
4. Vérifier l'onglet **Network** → **WS** (WebSocket)
5. La connexion `ws/notifications` doit avoir le statut `101 Switching Protocols`

### 4. Test des notifications temps réel

Pour vérifier que les notifications fonctionnent :

```bash
# Dans le backend, broadcaster un message test
# (nécessite l'accès au serveur ou un endpoint de test)
curl -X POST http://51.91.77.0:30000/api/test/broadcast \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "Test WebSocket"}'
```

## 📝 Notes Importantes

### Pourquoi ça marchait en local ?

En développement local, le frontend se connectait **directement** au backend sur `ws://localhost:3333/ws/notifications` sans passer par nginx. En production, nginx intercepte toutes les requêtes, donc il **doit** être configuré pour gérer les WebSockets.

### Headers WebSocket Critiques

Les deux headers obligatoires pour upgrader HTTP → WebSocket :
- `Upgrade: $http_upgrade` : indique le protocole de destination
- `Connection: "upgrade"` : active le mécanisme d'upgrade

Sans ces headers, nginx retourne une erreur 400 ou ferme la connexion.

### Timeouts

Les WebSockets sont des **connexions persistantes** qui peuvent durer des heures/jours. Les timeouts standards (60s) fermeraient la connexion prématurément. C'est pourquoi on utilise `7d` (7 jours).

Le heartbeat (`ping`/`pong` toutes les 30s) dans le code frontend/backend maintient la connexion active.

## 🔍 Troubleshooting

### WebSocket refuse toujours de se connecter

1. **Vérifier que nginx a bien redémarré**
   ```bash
   docker ps  # Voir l'uptime du container
   docker logs <container> --tail 50
   ```

2. **Vérifier la config nginx**
   ```bash
   # Dans le container
   docker exec <container> nginx -t
   ```

3. **Vérifier les logs backend**
   ```bash
   # Voir si le backend reçoit la tentative de connexion
   docker logs <backend-container> | grep WebSocket
   ```

4. **Tester l'URL directement**
   ```bash
   # Depuis le VPS
   wscat -c ws://localhost:3333/ws/notifications?token=<token>
   ```

### Erreur 502 Bad Gateway

Le backend n'est pas joignable. Vérifier :
- Container backend en cours d'exécution : `docker ps`
- Backend écoute bien sur le port 3333 : `netstat -tulpn | grep 3333`

### Erreur 400 Bad Request

Headers WebSocket manquants ou malformés. Vérifier :
- La config nginx a bien été appliquée
- Les headers `Upgrade` et `Connection` sont présents

## 📚 Références

- [Nginx WebSocket Proxying](https://nginx.org/en/docs/http/websocket.html)
- [AdonisJS WebSocket Provider](https://github.com/reg2005/adonis5-websocket)
- [W3C WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)

## 👥 Contacts

En cas de problème persistant, contacter l'équipe DevOps ou consulter les logs détaillés dans `/var/log/nginx/` sur le VPS.

---

**Date de correction** : 2025-10-27
**Fichiers modifiés** : `services/tsa-monolith/nginx-backend.conf`
**Statut** : ✅ Prêt pour redéploiement
