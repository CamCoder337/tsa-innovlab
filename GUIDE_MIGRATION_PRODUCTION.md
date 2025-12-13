# 🚀 Guide de Migration Production - Déploiement Sécurisé

## ✅ Analyse de la Situation Actuelle

### État des Migrations
- **tracking_pin** : Défini comme `nullable()` ✅
- **Missions existantes** : Peuvent avoir `tracking_pin = NULL` ✅
- **Contrainte UNIQUE** : Seulement sur les PINs non-NULL ✅

### Pourquoi C'est Sécurisé

```sql
-- Migration actuelle (SÉCURISÉE)
ALTER TABLE missions ALTER COLUMN tracking_pin TYPE VARCHAR(8);

-- Index UNIQUE partiel (INTELLIGENT)
CREATE UNIQUE INDEX missions_tracking_pin_unique
ON missions (tracking_pin)
WHERE tracking_pin IS NOT NULL;
```

**Avantages** :
- ✅ Les missions existantes gardent `tracking_pin = NULL`
- ✅ Pas de conflit avec les données existantes
- ✅ Nouvelles missions peuvent avoir un PIN
- ✅ Unicité garantie seulement pour les PINs non-NULL

## 🔄 Plan de Déploiement Étape par Étape

### 1. Préparation (Avant le Push)

```bash
# Sauvegarder la base de données de production
pg_dump -h 51.91.77.0 -p 5432 -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Tester les migrations en local
cd services/tsa-monolith
npm run migration:run
npm run migration:rollback  # Test du rollback
npm run migration:run       # Re-test
```

### 2. Vérification des Migrations

```bash
# Lister les migrations en attente
npm run migration:status

# Voir le contenu des migrations
ls database/migrations/ | tail -5
```

### 3. Déploiement Production

```bash
# 1. Arrêter l'application (maintenance)
docker-compose -f docker-compose.prod.yml down

# 2. Sauvegarder la DB
docker exec postgres_container pg_dump -U user database > backup.sql

# 3. Appliquer les migrations
docker-compose -f docker-compose.prod.yml run --rm api npm run migration:run

# 4. Redémarrer l'application
docker-compose -f docker-compose.prod.yml up -d
```

## 🛡️ Stratégie de Rollback

### Si Problème Détecté

```bash
# Rollback immédiat
docker-compose -f docker-compose.prod.yml run --rm api npm run migration:rollback

# Restaurer la sauvegarde si nécessaire
docker exec -i postgres_container psql -U user database < backup.sql
```

### Migration Spécifique au PIN

```sql
-- En cas de problème, cette requête vérifie l'état
SELECT 
  COUNT(*) as total_missions,
  COUNT(tracking_pin) as missions_with_pin,
  COUNT(*) - COUNT(tracking_pin) as missions_without_pin
FROM missions;
```

## 📊 Vérifications Post-Déploiement

### 1. Vérifier la Structure

```sql
-- Vérifier la colonne tracking_pin
\d missions;

-- Vérifier l'index UNIQUE
\di missions_tracking_pin_unique;
```

### 2. Tester les Fonctionnalités

```bash
# Test API - Créer une mission avec PIN
curl -X POST http://51.91.77.0:30000/api/missions \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","tracking_pin":"ABC12345"}'

# Test API - Missions existantes
curl http://51.91.77.0:30000/api/missions
```

### 3. Vérifier les Logs

```bash
# Logs de l'application
docker-compose -f docker-compose.prod.yml logs api

# Logs de la base de données
docker-compose -f docker-compose.prod.yml logs postgres
```

## 🎯 Points Critiques à Surveiller

### ❌ Problèmes Potentiels

1. **Contrainte UNIQUE** : Si deux missions ont le même PIN non-NULL
2. **Taille de colonne** : Si des PINs existants > 8 caractères
3. **Dépendances** : Code qui assume que tracking_pin n'est jamais NULL

### ✅ Solutions Préventives

```sql
-- Vérifier les doublons avant migration
SELECT tracking_pin, COUNT(*) 
FROM missions 
WHERE tracking_pin IS NOT NULL 
GROUP BY tracking_pin 
HAVING COUNT(*) > 1;

-- Vérifier la taille des PINs existants
SELECT MAX(LENGTH(tracking_pin)) as max_pin_length 
FROM missions 
WHERE tracking_pin IS NOT NULL;
```

## 🔧 Script de Vérification Automatique

```bash
#!/bin/bash
# check-migration-safety.sh

echo "🔍 Vérification de la sécurité des migrations..."

# Vérifier les doublons
DUPLICATES=$(docker exec postgres_container psql -U user -d database -t -c "
  SELECT COUNT(*) FROM (
    SELECT tracking_pin FROM missions 
    WHERE tracking_pin IS NOT NULL 
    GROUP BY tracking_pin 
    HAVING COUNT(*) > 1
  ) duplicates;
")

if [ "$DUPLICATES" -gt 0 ]; then
  echo "❌ ATTENTION: $DUPLICATES PINs dupliqués détectés!"
  exit 1
fi

echo "✅ Aucun doublon détecté"

# Vérifier la taille des PINs
MAX_LENGTH=$(docker exec postgres_container psql -U user -d database -t -c "
  SELECT COALESCE(MAX(LENGTH(tracking_pin)), 0) 
  FROM missions 
  WHERE tracking_pin IS NOT NULL;
")

if [ "$MAX_LENGTH" -gt 8 ]; then
  echo "❌ ATTENTION: PIN de $MAX_LENGTH caractères détecté (max: 8)!"
  exit 1
fi

echo "✅ Taille des PINs compatible"
echo "🚀 Migration sécurisée - Vous pouvez déployer!"
```

## 📋 Checklist de Déploiement

### Avant le Push
- [ ] Sauvegarder la base de données de production
- [ ] Tester les migrations en local
- [ ] Exécuter le script de vérification
- [ ] Vérifier que l'application fonctionne en local

### Pendant le Déploiement
- [ ] Mettre l'application en maintenance
- [ ] Appliquer les migrations
- [ ] Vérifier les logs
- [ ] Tester les endpoints critiques

### Après le Déploiement
- [ ] Vérifier la structure de la base
- [ ] Tester la création de nouvelles missions
- [ ] Vérifier que les missions existantes fonctionnent
- [ ] Surveiller les logs pendant 30 minutes

## 🎉 Conclusion

**Ton déploiement est SÉCURISÉ** car :

1. ✅ `tracking_pin` est nullable - pas de conflit avec les données existantes
2. ✅ Index UNIQUE partiel - seulement sur les PINs non-NULL
3. ✅ Migration progressive - les anciennes missions gardent NULL
4. ✅ Rollback possible - migration réversible

**Les missions existantes continueront de fonctionner normalement** même sans PIN, et les nouvelles missions pourront avoir un PIN unique.

---

**Recommandation** : Déploie en confiance, mais garde ce guide sous la main et fais la sauvegarde recommandée ! 🚀