#!/bin/bash
# Script pour vérifier et gérer le cache EasyOCR

echo "🔍 Vérification du cache EasyOCR..."

# Vérifier si le volume existe
if docker volume ls | grep -q "easyocr_models"; then
    echo "✅ Volume easyocr_models existe"
    
    # Vérifier le contenu
    echo "📦 Contenu du volume:"
    docker run --rm -v tsa-innovlab_easyocr_models:/data alpine ls -lh /data/model/ 2>/dev/null || echo "⚠️  Pas encore de modèles téléchargés"
else
    echo "❌ Volume easyocr_models n'existe pas"
    echo "🔧 Création du volume..."
    docker volume create tsa-innovlab_easyocr_models
    echo "✅ Volume créé"
fi

echo ""
echo "📊 Informations du volume:"
docker volume inspect tsa-innovlab_easyocr_models 2>/dev/null || echo "Volume non trouvé"

echo ""
echo "💡 Pour forcer le re-téléchargement des modèles:"
echo "   docker volume rm tsa-innovlab_easyocr_models"
echo ""
echo "💡 Pour sauvegarder les modèles:"
echo "   docker run --rm -v tsa-innovlab_easyocr_models:/data -v \$(pwd):/backup alpine tar czf /backup/easyocr-models.tar.gz -C /data ."
echo ""
echo "💡 Pour restaurer les modèles:"
echo "   docker run --rm -v tsa-innovlab_easyocr_models:/data -v \$(pwd):/backup alpine tar xzf /backup/easyocr-models.tar.gz -C /data"
