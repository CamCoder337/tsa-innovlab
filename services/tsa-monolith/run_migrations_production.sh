#!/bin/bash
###############################################################################
# Script pour lancer les migrations sur le serveur de production
# Usage: ./run_migrations_production.sh
#
# Ce script doit être exécuté sur le serveur de production (51.91.77.0)
# où Docker et Portainer sont installés
###############################################################################

set -e  # Arrêter en cas d'erreur

echo "🚀 Lancement des migrations en production..."
echo ""

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Nom du conteneur backend (défini dans docker-compose.portainer.yml)
CONTAINER_NAME="tsa-backend"

# Vérifier que le conteneur existe et est en cours d'exécution
echo "📦 Vérification du conteneur $CONTAINER_NAME..."
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Erreur: Le conteneur $CONTAINER_NAME n'est pas en cours d'exécution${NC}"
    echo ""
    echo "Conteneurs Docker actifs:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    exit 1
fi

echo -e "${GREEN}✅ Conteneur $CONTAINER_NAME trouvé et actif${NC}"
echo ""

# Afficher l'état actuel des migrations
echo "📊 État actuel des migrations..."
docker exec "$CONTAINER_NAME" node ace migration:status || true
echo ""

# Lancer les migrations
echo "🔄 Lancement des migrations..."
if docker exec "$CONTAINER_NAME" node ace migration:run --force; then
    echo -e "${GREEN}✅ Migrations exécutées avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'exécution des migrations${NC}"
    exit 1
fi
echo ""

# Vérifier les migrations après exécution
echo "📊 Nouvel état des migrations..."
docker exec "$CONTAINER_NAME" node ace migration:status
echo ""

# Vérifier que les tables orders existent
echo "🔍 Vérification des tables créées..."
docker exec "$CONTAINER_NAME" sh -c '
echo "SELECT tablename FROM pg_tables WHERE schemaname = '"'"'public'"'"' AND tablename LIKE '"'"'%order%'"'"' OR tablename LIKE '"'"'%cart%'"'"' OR tablename LIKE '"'"'%payment%'"'"';" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_DATABASE
' || echo -e "${YELLOW}⚠️  Impossible de vérifier les tables (psql non disponible)${NC}"
echo ""

# Redémarrer le conteneur pour recharger les routes
echo "🔄 Redémarrage du conteneur backend..."
if docker restart "$CONTAINER_NAME"; then
    echo -e "${GREEN}✅ Conteneur redémarré avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du redémarrage du conteneur${NC}"
    exit 1
fi
echo ""

# Attendre que le conteneur soit prêt
echo "⏳ Attente du démarrage du serveur (60 secondes)..."
sleep 60

# Tester la route /health
echo "🏥 Test de la route /health..."
if curl -s http://localhost:30000/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Serveur opérationnel${NC}"
else
    echo -e "${YELLOW}⚠️  Le serveur ne répond pas encore, attendez quelques secondes${NC}"
fi
echo ""

# Tester la route /api/admin/orders (elle devrait maintenant fonctionner)
echo "🧪 Test de la route /api/admin/orders..."
RESPONSE=$(curl -s http://localhost:30000/api/admin/orders)
if echo "$RESPONSE" | grep -q "Cannot GET"; then
    echo -e "${RED}❌ ERREUR: La route /api/admin/orders ne fonctionne toujours pas${NC}"
    echo "Réponse: $RESPONSE"
    echo ""
    echo "Actions supplémentaires à essayer:"
    echo "1. Vérifier les logs: docker logs $CONTAINER_NAME --tail 100"
    echo "2. Vérifier le build: docker exec $CONTAINER_NAME ls -la build/app/controllers/http/admin/orders_controller.js"
    echo "3. Reconstruire l'image: docker-compose -f docker-compose.portainer.yml build backend"
    exit 1
else
    echo -e "${GREEN}✅ Route /api/admin/orders fonctionne !${NC}"
    echo "Réponse: $RESPONSE"
fi
echo ""

echo -e "${GREEN}🎉 Migrations terminées avec succès !${NC}"
echo ""
echo "Actions suivantes recommandées:"
echo "  1. Tester l'application depuis le frontend"
echo "  2. Vérifier les logs: docker logs $CONTAINER_NAME --tail 50"
echo "  3. Monitorer les performances"
