#!/bin/bash

echo "🔄 TSA-Logistique - Push Sécurisé (Git Flow Integration)"

CURRENT_BRANCH=$(git branch --show-current)

# Vérifier qu'on n'est pas sur main ou integration
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "❌ ERREUR: Vous êtes sur la branche main!"
    echo "✅ Créez d'abord une branche feature:"
    echo "   git checkout integration"
    echo "   git checkout -b feature/mon-feature"
    exit 1
fi

if [ "$CURRENT_BRANCH" = "integration" ]; then
    echo "❌ ERREUR: Vous êtes sur la branche integration!"
    echo "✅ Créez d'abord une branche feature:"
    echo "   git checkout -b feature/mon-feature"
    exit 1
fi

echo "📍 Branche actuelle: $CURRENT_BRANCH"

# Vérifier qu'il y a des commits sur la branche
if ! git log --oneline $CURRENT_BRANCH ^integration >/dev/null 2>&1; then
    echo "❌ ERREUR: Aucun commit sur votre branche!"
    echo "✅ Commitez d'abord vos changements:"
    echo "   git add ."
    echo "   git commit -m 'votre message personnalisé'"
    echo "   puis relancez ./tools/safe-push-integration.sh"
    exit 1
fi

# Vérifier qu'il n'y a pas de changements non commitées
if ! git diff --quiet; then
    echo "❌ ERREUR: Vous avez des changements non commitées!"
    echo "✅ Commitez d'abord:"
    echo "   git add ."
    echo "   git commit -m 'votre message'"
    echo "   puis relancez ./tools/safe-push-integration.sh"
    exit 1
fi

if ! git diff --cached --quiet; then
    echo "❌ ERREUR: Vous avez des fichiers stagés non commitées!"
    echo "✅ Commitez d'abord:"
    echo "   git commit -m 'votre message'"
    echo "   puis relancez ./tools/safe-push-integration.sh"
    exit 1
fi

echo "✅ Branche prête pour synchronisation"
echo "🔄 Synchronisation avec la branche integration..."

# Sauvegarder la branche actuelle
WORKING_BRANCH=$CURRENT_BRANCH

# Passer sur integration et récupérer les dernières modifs
echo "📥 Récupération des dernières modifications d'integration..."
git checkout integration
if ! git pull origin integration; then
    echo "❌ Erreur lors du pull sur integration!"
    git checkout $WORKING_BRANCH
    echo "🔧 Vérifiez votre connexion internet et réessayez"
    exit 1
fi

# Retourner sur la branche de travail et merger integration
echo "🔄 Merge des dernières modifications d'integration dans votre branche..."
git checkout $WORKING_BRANCH
if ! git merge integration; then
    echo "❌ CONFLIT DÉTECTÉ avec la branche integration!"
    echo "🔧 Étapes de résolution:"
    echo "   1. Ouvrir les fichiers en conflit (listés ci-dessus)"
    echo "   2. Chercher les marqueurs <<<< ==== >>>>"
    echo "   3. Garder le code que vous voulez (généralement le vôtre)"
    echo "   4. Supprimer tous les marqueurs <<<< ==== >>>>"
    echo "   5. git add ."
    echo "   6. git commit -m 'resolve: fusion avec integration'"
    echo "   7. Relancer ./tools/safe-push-integration.sh"
    echo ""
    echo "📋 Fichiers en conflit:"
    git status --porcelain | grep "^UU"
    exit 1
fi

# Push sécurisé
echo "✅ Merge avec integration réussi! Push en cours..."
if ! git push origin $WORKING_BRANCH; then
    echo "❌ Erreur lors du push!"
    echo "🔧 Réessayer dans quelques secondes..."
    exit 1
fi

echo ""
echo "✅ SUCCESS! Push réussi sur branche $WORKING_BRANCH!"
echo "🌐 Étape suivante - Créer Pull Request sur GitHub:"
echo "   $WORKING_BRANCH → integration"
echo "   https://github.com/ton-username/tsa-logistique/compare/integration...$WORKING_BRANCH"
echo ""
echo "💡 Une fois la PR mergée dans integration:"
echo "   git checkout integration"
echo "   git pull origin integration"
echo "   git branch -d $WORKING_BRANCH"
echo ""
echo "🔄 Pour créer une nouvelle feature:"
echo "   git checkout integration"
echo "   git checkout -b feature/nouvelle-feature"