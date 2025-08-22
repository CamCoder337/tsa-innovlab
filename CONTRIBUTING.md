# Contributing to TSA-Logistique

Bienvenue dans le projet TSA-Logistique ! Ce guide explique comment contribuer au projet en respectant notre workflow Git Flow.

## 🌿 Structure des Branches

Notre projet utilise un workflow Git Flow avec trois types de branches :

```
main                    # 🔒 Branche de production (PROTÉGÉE)
integration            # 🔄 Branche d'intégration (base de développement)
feature/**             # 🚀 Branches de fonctionnalités
```

### 📋 Rôles des Branches

- **`main`** : Version stable, déploiement automatique via CI/CD
- **`integration`** : Intégration continue des développements
- **`feature/**`** : Développement de nouvelles fonctionnalités

## 🚨 Règles de Contribution

### ✅ Ce que vous POUVEZ faire :

- Créer des branches `feature/**` depuis `integration`
- Développer et commiter sur vos branches `feature/**`
- Ouvrir des Pull Requests : `feature/**` → `integration`
- Merger vos PR après review

### ❌ Ce que vous ne POUVEZ PAS faire :

- Pusher directement sur `main` ou `integration`
- Créer des PR vers `main` (réservé au CI/CD)
- Merger `main` dans vos branches

## 🛠️ Workflow de Développement

### 1. 🚀 Démarrer une nouvelle fonctionnalité

```bash
# 1. S'assurer d'être à jour
git checkout integration
git pull origin integration

# 2. Créer une branche feature
git checkout -b feature/nom-de-votre-feature

# Conventions de nommage :
# feature/frontend-login-form
# feature/backend-auth-api  
# feature/ai-route-optimization
# feature/shared-types-update
```

### 2. 💻 Développer

```bash
# Développer normalement
# ... éditer les fichiers ...

# Commiter régulièrement avec des messages clairs
git add .
git commit -m "feat: ajout composant LoginForm"

git add .
git commit -m "test: tests unitaires LoginForm"

git add .
git commit -m "docs: documentation LoginForm"
```

### 3. 🔄 Synchroniser et Pusher

**Utilisez OBLIGATOIREMENT le script de push sécurisé :**

```bash
# Windows
tools\safe-push-integration.bat

# Unix/Mac/Linux
./tools/safe-push-integration.sh
```

**Le script fait automatiquement :**
- ✅ Vérification que vous avez committé
- ✅ Synchronisation avec `integration`
- ✅ Merge d'`integration` dans votre branche
- ✅ Détection et gestion des conflits
- ✅ Push de votre branche

### 4. 🌐 Créer une Pull Request

1. **Aller sur GitHub** après le push réussi
2. **Créer une PR** : `feature/votre-branche` → `integration`
3. **Remplir le template** de PR
4. **Assigner des reviewers** des autres équipes
5. **Attendre la review** et l'approbation

### 5. 🧹 Après merge de votre PR

```bash
# 1. Retourner sur integration
git checkout integration
git pull origin integration

# 2. Supprimer votre branche locale (optionnel)
git branch -d feature/votre-branche

# 3. Prêt pour la prochaine feature
git checkout -b feature/nouvelle-feature
```

## 📝 Conventions de Nommage

### Branches
```bash
feature/frontend-*     # Équipe Frontend
feature/backend-*      # Équipe Backend
feature/ai-*           # Équipe IA  
feature/shared-*       # Packages partagés
feature/docs-*         # Documentation
feature/ci-*           # CI/CD
```

### Messages de Commit
Utilisez le format [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
feat: ajout d'une nouvelle fonctionnalité
fix: correction d'un bug
docs: mise à jour documentation
style: changements de style (formatting, etc.)
refactor: refactoring du code
test: ajout ou modification de tests
chore: tâches de maintenance
```

**Exemples :**
```bash
git commit -m "feat: ajout authentification utilisateur"
git commit -m "fix: correction validation formulaire"
git commit -m "docs: mise à jour README API"
git commit -m "test: ajout tests composant Button"
```

## 🔧 Résolution de Conflits

Si le script `safe-push-integration` détecte des conflits :

### 1. 📋 Identifier les conflits
```bash
# Le script liste les fichiers en conflit
git status
```

### 2. 🛠️ Résoudre les conflits
```bash
# Ouvrir chaque fichier en conflit
# Chercher les marqueurs :
<<<<<<< HEAD
votre code
=======
code de integration
>>>>>>> integration

# Décider quel code garder (généralement le vôtre)
# Supprimer TOUS les marqueurs <<<< ==== >>>>
```

### 3. ✅ Finaliser la résolution
```bash
# Marquer comme résolu
git add .
git commit -m "resolve: fusion avec integration"

# Relancer le script
tools/safe-push-integration.bat
```

## 🚀 CI/CD et Déploiement

### Déploiement Automatique

- **`integration` → `main`** : Géré automatiquement par CI/CD
- **Conditions de merge** : Tests passent, qualité code OK
- **Fréquence** : Nightly builds ou sur demande

### Vous n'avez pas à vous préoccuper de :

- ❌ Merger vers `main`
- ❌ Déploiement en production
- ❌ Gestion des tags de version
- ❌ Release notes

## 🛡️ Protections de Branches

### Branche `main`
- 🔒 **Push direct interdit**
- 🔒 **Merge manuel interdit**
- ✅ **Merge automatique depuis `integration` via CI/CD uniquement**

### Branche `integration`
- 🔒 **Push direct interdit**
- ✅ **Merge via Pull Request uniquement**
- ✅ **Review obligatoire**

## 📊 Pull Request Guidelines

### Template de PR

Votre PR doit inclure :

```markdown
## 📋 Description
Brève description des changements

## 🎯 Type de changement
- [ ] Nouvelle fonctionnalité
- [ ] Correction de bug
- [ ] Documentation
- [ ] Refactoring

## 🧪 Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests d'intégration passent
- [ ] Testé manuellement

## 📸 Screenshots (si applicable)
Ajouter des captures d'écran pour les changements UI

## 🔗 Issues liées
Fixes #123
```

### Critères d'Approbation

- ✅ **Code review** par au moins 1 membre d'une autre équipe
- ✅ **Tests passent** (CI automatique)
- ✅ **Pas de conflits** avec `integration`
- ✅ **Documentation** mise à jour si nécessaire

## 🏗️ Structure du Projet

### Répertoires par Équipe

```
apps/
├── frontend-web/      # Équipe Frontend
├── mobile-app/        # (optionnel)
└── admin-dashboard/   # (optionnel)

services/
├── api-backend/       # Équipe Backend
├── ai-service/        # Équipe IA
└── notification-service/ # (optionnel)

packages/
├── shared-types/      # Types partagés
├── shared-utils/      # Utilitaires partagés
└── shared-config/     # Configurations partagées
```

### Règles de Modification

- **Frontend** : Uniquement `apps/frontend-web/` + `packages/`
- **Backend** : Uniquement `services/api-backend/` + `packages/`
- **IA** : Uniquement `services/ai-service/` + `packages/`

## 🆘 Support et Questions

### En cas de problème :

1. **Lire ce guide** en entier
2. **Vérifier les issues** existantes
3. **Demander de l'aide** dans le chat équipe
4. **Créer une issue** si nécessaire

### Contacts

- **Author** : [camcoder337@gmail.com]
- **Documentation** : [lien wiki]soon

## 🎯 Checklist Développeur

Avant chaque contribution, vérifiez :

- [ ] Branche créée depuis `integration` à jour
- [ ] Commits avec messages conventionnels
- [ ] Code testé localement
- [ ] Script `safe-push-integration` utilisé
- [ ] PR créée vers `integration` (PAS `main`)
- [ ] Template de PR rempli
- [ ] Reviewers assignés

## 🏆 Bonnes Pratiques

### Commits

- **Atomiques** : Un commit = une fonctionnalité/fix
- **Fréquents** : Commitez souvent, pas tout à la fin
- **Descriptifs** : Messages clairs et détaillés

### Branches

- **Courte durée** : Pas de branches qui vivent des semaines
- **Focalisées** : Une branche = une fonctionnalité
- **Nettoyage** : Supprimez vos branches après merge

### Code

- **Lisible** : Code auto-documenté
- **Testé** : Tests pour les nouvelles fonctionnalités
- **Cohérent** : Respectez les conventions du projet

---

**Merci de contribuer à TSA-Logistique ! 🚀**

*Ce guide est vivant, n'hésitez pas à proposer des améliorations via une PR.*