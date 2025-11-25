# Guide des Tests - TSA Driver App

## 🧪 Commandes de Vérification Disponibles

### Vérification TypeScript
Vérifie les erreurs de typage sans générer de build :
```bash
npm run typecheck
```

### Vérification ESLint
Vérifie la qualité du code selon les règles ESLint :
```bash
npm run lint
```

Corriger automatiquement les erreurs ESLint :
```bash
npm run lint:fix
```

### Vérification Prettier
Vérifier le formatage du code :
```bash
npm run format:check
```

Formater automatiquement tout le code :
```bash
npm run format
```

### Test Complet
Lance toutes les vérifications (typecheck + lint + format) :
```bash
npm test
```

## 📋 Checklist Avant Commit

Avant de faire un commit, assurez-vous de :

1. ✅ Aucune erreur TypeScript : `npm run typecheck`
2. ✅ Code conforme aux règles ESLint : `npm run lint`
3. ✅ Code correctement formaté : `npm run format:check`

Ou simplement lancer :
```bash
npm test
```

## 🛠️ Configuration

### ESLint
Configuration dans `.eslintrc.js` :
- Extends : `expo`, `@typescript-eslint`, `prettier`
- Plugins : `@typescript-eslint`, `react`, `react-hooks`
- Règles personnalisées pour React Native

### Prettier
Configuration dans `.prettierrc` :
- Semi-colons : oui
- Single quotes : oui
- Largeur de ligne : 100 caractères
- Tabulation : 2 espaces

### TypeScript
Configuration dans `tsconfig.json` :
- Extends : `expo/tsconfig.base`
- Strict mode : activé

## 🚀 Intégration Continue

Ces commandes peuvent être utilisées dans votre pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Run tests
  run: |
    cd apps/driver-app
    npm install
    npm test
```

## 📝 Résolution des Problèmes

### Erreur : ESLint config not found
```bash
npm install
```

### Trop d'erreurs ESLint
Corriger automatiquement ce qui peut l'être :
```bash
npm run lint:fix
npm run format
```

### Erreur TypeScript sur un type React Native
Vérifier que toutes les dépendances sont installées :
```bash
npm install
```
