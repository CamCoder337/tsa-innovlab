@echo off
echo 🔄 TSA-Logistique - Push Sécurisé (Git Flow develop)

REM Vérifier qu'on n'est pas sur main ou develop
for /f %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="main" (
    echo ❌ ERREUR: Vous êtes sur la branche main!
    echo ✅ Créez d'abord une branche feature:
    echo    git checkout develop
    echo    git checkout -b feature/mon-feature
    exit /b 1
)

if "%CURRENT_BRANCH%"=="develop" (
    echo ❌ ERREUR: Vous êtes sur la branche develop!
    echo ✅ Créez d'abord une branche feature:
    echo    git checkout -b feature/mon-feature
    exit /b 1
)

echo 📍 Branche actuelle: %CURRENT_BRANCH%

REM Vérifier qu'il y a des commits sur la branche
git log --oneline %CURRENT_BRANCH% ^develop >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERREUR: Aucun commit sur votre branche!
    echo ✅ Commitez d'abord vos changements:
    echo    git add .
    echo    git commit -m "votre message personnalisé"
    echo    puis relancez tools\safe-push-develop.bat
    exit /b 1
)

REM Vérifier qu'il n'y a pas de changements non commitées
git diff --quiet
if %errorlevel% neq 0 (
    echo ❌ ERREUR: Vous avez des changements non commitées!
    echo ✅ Commitez d'abord:
    echo    git add .
    echo    git commit -m "votre message"
    echo    puis relancez tools\safe-push-develop.bat
    exit /b 1
)

git diff --cached --quiet
if %errorlevel% neq 0 (
    echo ❌ ERREUR: Vous avez des fichiers stagés non commitées!
    echo ✅ Commitez d'abord:
    echo    git commit -m "votre message"
    echo    puis relancez tools\safe-push-develop.bat
    exit /b 1
)

echo ✅ Branche prête pour synchronisation
echo 🔄 Synchronisation avec la branche develop...

REM Sauvegarder la branche actuelle
set WORKING_BRANCH=%CURRENT_BRANCH%

REM Passer sur develop et récupérer les dernières modifs
echo 📥 Récupération des dernières modifications d'develop...
git checkout develop
git pull origin develop

if %errorlevel% neq 0 (
    echo ❌ Erreur lors du pull sur develop!
    git checkout %WORKING_BRANCH%
    echo 🔧 Vérifiez votre connexion internet et réessayez
    exit /b 1
)

REM Retourner sur la branche de travail et merger develop
echo 🔄 Merge des dernières modifications d'develop dans votre branche...
git checkout %WORKING_BRANCH%
git merge develop

if %errorlevel% neq 0 (
    echo ❌ CONFLIT DÉTECTÉ avec la branche develop!
    echo 🔧 Étapes de résolution:
    echo    1. Ouvrir les fichiers en conflit (listés ci-dessus)
    echo    2. Chercher les marqueurs ^^^<^^^<^^^<^^^< ===== ^^^>^^^>^^^>^^^>
    echo    3. Garder le code que vous voulez (généralement le vôtre)
    echo    4. Supprimer tous les marqueurs ^^^<^^^<^^^< ===== ^^^>^^^>^^^>
    echo    5. git add .
    echo    6. git commit -m "resolve: fusion avec develop"
    echo    7. Relancer tools\safe-push-develop.bat
    echo.
    echo 📋 Fichiers en conflit:
    git status --porcelain | findstr "^UU"
    exit /b 1
)

REM Push sécurisé
echo ✅ Merge avec develop réussi! Push en cours...
git push origin %WORKING_BRANCH%

if %errorlevel% neq 0 (
    echo ❌ Erreur lors du push!
    echo 🔧 Réessayer dans quelques secondes...
    exit /b 1
)

echo.
echo ✅ SUCCESS! Push réussi sur branche %WORKING_BRANCH%!
echo 🌐 Étape suivante - Créer Pull Request sur GitHub:
echo    %WORKING_BRANCH% → develop
echo    https://github.com/camcoder337/tsa-logistique/compare/develop...%WORKING_BRANCH%
echo.
echo 💡 Une fois la PR mergée dans develop:
echo    git checkout develop
echo    git pull origin develop
echo    git branch -d %WORKING_BRANCH%
echo.
echo 🔄 Pour créer une nouvelle feature:
echo    git checkout develop
echo    git checkout -b feature/nouvelle-feature