# 🔧 Scripts Utilitaires - TSA Driver App

Ce dossier contient des scripts utilitaires pour faciliter le développement de l'application mobile Driver.

## 📋 Scripts Disponibles

### `detect-local-ip.js`

**Détection automatique de l'adresse IP locale**

Ce script détecte automatiquement l'adresse IP locale de votre machine et met à jour le fichier `.env` avec la bonne URL de l'API backend.

#### Utilisation

```bash
# Via npm script (recommandé)
npm run update-ip

# Ou directement avec Node
node scripts/detect-local-ip.js
```

#### Fonctionnement

1. **Détection de l'IP** : Scanne les interfaces réseau de votre machine
   - Priorité aux interfaces Wi-Fi et Ethernet
   - Ignore les adresses internes (127.0.0.1)
   - Sélectionne la première IPv4 valide trouvée

2. **Mise à jour du .env** : Remplace automatiquement la valeur de `EXPO_PUBLIC_API_BASE_URL`
   - Format : `http://<IP_DETECTEE>:3333`
   - Préserve les autres variables du fichier

3. **Affichage d'aide** : Fournit des instructions selon le type d'appareil
   - Simulateur iOS → `localhost`
   - Émulateur Android → `10.0.2.2`
   - Appareil physique → IP détectée

#### Exemple de sortie

```
🔍 Détection de l'adresse IP locale...

✓ IP détectée via interface "Wi-Fi": 192.168.1.170

📝 Mise à jour du .env :
   Ancien: http://10.237.65.221:3333
   Nouveau: http://192.168.1.170:3333

✅ Fichier .env mis à jour avec succès!

================================================================================
📱 Guide de connexion selon votre appareil :
================================================================================

📍 Simulateur iOS (Mac) :
   → URL: http://localhost:3333
   → Déjà configuré par défaut

📍 Émulateur Android :
   → URL: http://10.0.2.2:3333
   → 10.0.2.2 est l'alias pour localhost sur Android

📍 Appareil Physique (Wi-Fi) :
   → URL: http://192.168.1.170:3333
   → Assurez-vous que l'appareil et votre PC sont sur le même réseau Wi-Fi
   → Vérifiez que le firewall autorise les connexions sur le port 3333
```

#### Cas d'usage

**Quand utiliser ce script :**

- ✅ Au premier lancement du projet
- ✅ Quand votre IP locale change (changement de réseau Wi-Fi)
- ✅ Quand vous testez sur un appareil physique
- ✅ En début de chaque session de développement (recommandé)

**Quand ne PAS l'utiliser :**

- ❌ Quand vous développez uniquement sur émulateur/simulateur
- ❌ En production (utiliser EAS Build avec variables d'environnement)

#### Intégration avec le workflow

Ce script est automatiquement exécuté avec la commande `npm run dev` :

```bash
# Cette commande :
# 1. Détecte et met à jour l'IP
# 2. Lance Expo avec cache nettoyé
npm run dev
```

#### Dépannage

**Le script ne détecte aucune IP**

```bash
⚠ Aucune adresse IP locale détectée
```

**Solution :** Vérifiez que vous êtes connecté à un réseau (Wi-Fi ou Ethernet)

**L'IP détectée n'est pas la bonne**

Le script priorise les interfaces dans cet ordre :
1. Wi-Fi
2. Ethernet
3. Autres interfaces réseau

Si vous avez plusieurs interfaces actives, le script choisira la première trouvée selon cet ordre.

**Le backend reste inaccessible**

Même avec l'IP correcte, vérifiez :
- Le backend AdonisJS est bien lancé (`npm run dev` dans `services/tsa-monolith/`)
- Le backend écoute sur `0.0.0.0:3333` (pas seulement `localhost`)
- Le firewall autorise les connexions sur le port 3333
- Votre appareil et votre PC sont sur le même réseau Wi-Fi

#### Configuration avancée

Pour modifier le port du backend, éditez le script :

```javascript
// scripts/detect-local-ip.js
const BACKEND_PORT = 3333; // Changez cette valeur
```

---

## 🔗 Ressources

- [Documentation complète de l'environnement](../ENV_SETUP.md)
- [Variables d'environnement disponibles](../.env.example)
- [Configuration Expo](../app.json)
