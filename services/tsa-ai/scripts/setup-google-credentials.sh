#!/bin/bash

# ========================================
# Script de configuration des credentials Google Cloud Vision
# ========================================
# Ce script aide à configurer les credentials pour différents environnements

set -e

echo "🔐 Configuration des credentials Google Cloud Vision"
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ Erreur: $1${NC}"
    exit 1
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les avertissements
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier si le fichier google-credentials.json existe
if [ ! -f "google-credentials.json" ]; then
    error "Fichier google-credentials.json non trouvé dans le répertoire actuel"
fi

success "Fichier google-credentials.json trouvé"

# Menu de choix
echo ""
echo "Choisissez votre environnement :"
echo "1) Développement local (fichier)"
echo "2) Production (variable d'environnement)"
echo "3) Docker Compose (les deux options)"
echo ""
read -p "Votre choix (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📝 Configuration pour développement local"
        echo ""
        echo "Ajoutez cette ligne à votre fichier .env :"
        echo ""
        echo "GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json"
        echo ""
        success "Configuration terminée"
        ;;
    
    2)
        echo ""
        echo "📝 Configuration pour production"
        echo ""
        echo "Conversion du JSON en une seule ligne..."
        
        # Vérifier si jq est installé
        if ! command -v jq &> /dev/null; then
            warning "jq n'est pas installé. Installation recommandée : apt-get install jq"
            echo ""
            echo "Conversion manuelle nécessaire :"
            echo "1. Ouvrez google-credentials.json"
            echo "2. Supprimez tous les retours à la ligne"
            echo "3. Copiez le résultat"
        else
            # Convertir avec jq
            CREDENTIALS_JSON=$(jq -c . google-credentials.json)
            
            echo ""
            echo "Ajoutez cette ligne à votre fichier .env de production :"
            echo ""
            echo "GOOGLE_CREDENTIALS_JSON='${CREDENTIALS_JSON}'"
            echo ""
            
            # Sauvegarder dans un fichier temporaire
            echo "GOOGLE_CREDENTIALS_JSON='${CREDENTIALS_JSON}'" > .env.google-credentials
            success "Configuration sauvegardée dans .env.google-credentials"
            warning "Copiez cette ligne dans votre .env de production puis supprimez .env.google-credentials"
        fi
        ;;
    
    3)
        echo ""
        echo "📝 Configuration pour Docker Compose"
        echo ""
        echo "Le fichier docker-compose.yml est déjà configuré pour supporter les deux options :"
        echo ""
        echo "Option 1 (Développement) - Ajoutez à .env :"
        echo "GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json"
        echo ""
        echo "Option 2 (Production) - Ajoutez à .env :"
        
        if command -v jq &> /dev/null; then
            CREDENTIALS_JSON=$(jq -c . google-credentials.json)
            echo "GOOGLE_CREDENTIALS_JSON='${CREDENTIALS_JSON}'"
            echo ""
            echo "GOOGLE_CREDENTIALS_JSON='${CREDENTIALS_JSON}'" > .env.google-credentials
            success "Configuration sauvegardée dans .env.google-credentials"
        else
            echo "GOOGLE_CREDENTIALS_JSON='<votre-json-sur-une-ligne>'"
            warning "Installez jq pour la conversion automatique : apt-get install jq"
        fi
        ;;
    
    *)
        error "Choix invalide"
        ;;
esac

echo ""
echo "📚 Pour plus d'informations, consultez DEPLOYMENT_GUIDE.md"
echo ""
