#!/bin/bash

echo "🔄 TSA-Logistique - Push Sécurisé (Git Flow develop)"

CURRENT_BRANCH=$(git branch --show-current)

# Vérifier qu'on n'est pas sur main ou develop
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "❌ ERREUR: Vous êtes sur la branche main!"
    echo "✅ Créez d'abord une branche feature:"
    echo "   git checkout develop"
    echo "   git checkout -b feature/mon-feature"
    exit 1
fi

if [ "$CURRENT_BRANCH" = "develop" ]; then
    echo "❌ ERREUR: Vous êtes sur la branche develop!"
    echo "✅ Créez d'abord une branche feature:"
    echo "   git checkout -b feature/mon-feature"
    exit 1
fi

echo "📍 Branche actuelle: $CURRENT_BRANCH"

# Vérifier qu'il y a des commits sur la branche
if ! git log --oneline $CURRENT_BRANCH ^develop >/dev/null 2>&1; then
    echo "❌ ERREUR: Aucun commit sur votre branche!"
    echo "✅ Commitez d'abord vos changements:"
    echo "   git add ."
    echo "   git commit -m 'votre message personnalisé'"
    echo "   puis relancez ./tools/safe-push-develop.sh"
    exit 1
fi

# Vérifier qu'il n'y a pas de changements non commitées
if ! git diff --quiet; then
    echo "❌ ERREUR: Vous avez des changements non commitées!"
    echo "✅ Commitez d'abord:"
    echo "   git add ."
    echo "   git commit -m 'votre message'"
    echo "   puis relancez ./tools/safe-push-develop.sh"
    exit 1
fi

if ! git diff --cached --quiet; then
    echo "❌ ERREUR: Vous avez des fichiers stagés non commitées!"
    echo "✅ Commitez d'abord:"
    echo "   git commit -m 'votre message'"
    echo "   puis relancez ./tools/safe-push-develop.sh"
    exit 1
fi

echo "✅ Branche prête pour synchronisation"
echo "🔄 Synchronisation avec la branche develop..."

# Sauvegarder la branche actuelle
WORKING_BRANCH=$CURRENT_BRANCH

# Passer sur develop et récupérer les dernières modifs
echo "📥 Récupération des dernières modifications d'develop..."
git checkout develop
if ! git pull origin develop; then
    echo "❌ Erreur lors du pull sur develop!"
    git checkout $WORKING_BRANCH
    echo "🔧 Vérifiez votre connexion internet et réessayez"
    exit 1
fi

# Retourner sur la branche de travail et merger develop
echo "🔄 Merge des dernières modifications d'develop dans votre branche..."
git checkout $WORKING_BRANCH
if ! git merge develop; then
    echo "❌ CONFLIT DÉTECTÉ avec la branche develop!"
    echo "🔧 Étapes de résolution:"
    echo "   1. Ouvrir les fichiers en conflit (listés ci-dessus)"
    echo "   2. Chercher les marqueurs <<<< ==== >>>>"
    echo "   3. Garder le code que vous voulez (généralement le vôtre)"
    echo "   4. Supprimer tous les marqueurs <<<< ==== >>>>"
    echo "   5. git add ."
    echo "   6. git commit -m 'resolve: fusion avec develop'"
    echo "   7. Relancer ./tools/safe-push-develop.sh"
    echo ""
    echo "📋 Fichiers en conflit:"
    git status --porcelain | grep "^UU"
    exit 1
fi

# Push sécurisé
echo "✅ Merge avec develop réussi! Push en cours..."
if ! git push origin $WORKING_BRANCH; then
    echo "❌ Erreur lors du push!"
    echo "🔧 Réessayer dans quelques secondes..."
    exit 1
fi

echo ""
echo "✅ SUCCESS! Push réussi sur branche $WORKING_BRANCH!"
echo "🌐 Étape suivante - Créer Pull Request sur GitHub:"
echo "   $WORKING_BRANCH → develop"
echo "   https://github.com/ton-username/tsa-logistique/compare/develop...$WORKING_BRANCH"
echo ""
echo "💡 Une fois la PR mergée dans develop:"
echo "   git checkout develop"
echo "   git pull origin develop"
echo "   git branch -d $WORKING_BRANCH"
echo ""
echo "🔄 Pour créer une nouvelle feature:"
echo "   git checkout develop"
echo "   git checkout -b feature/nouvelle-feature"