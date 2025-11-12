# 🚀 Guide de Migration - Chatbot V4

## 📋 Étapes de Migration

### 1️⃣ **Appliquer les Migrations Database**

Les migrations ont été créées dans le monolithe AdonisJS :

```bash
# Aller dans le dossier monolithe
cd services/tsa-monolith

# Lancer les migrations
node ace migration:run

# Vérifier que les tables sont créées
node ace migration:status
```

**Tables créées :**
- `chatbot_conversations` : Historique permanent des conversations
- `chatbot_pending_actions` : Actions en attente de confirmation
- `chatbot_metrics` : Métriques de performance

---

### 2️⃣ **Vérifier la Database**

```bash
# Se connecter à PostgreSQL
psql -U tsa_user -d tsa_contest

# Vérifier les tables
\dt chatbot_*

# Résultat attendu :
#  chatbot_conversations
#  chatbot_pending_actions
#  chatbot_metrics
```

---

### 3️⃣ **Tester le Chatbot V4**

```bash
# Démarrer le service FastAPI
cd services/tsa-ai
uvicorn app.main:app --reload

# Dans un autre terminal, tester
curl -X POST http://localhost:8000/api/ai/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour",
    "user_id": "test-user-123",
    "user_role": "AFFRETEUR"
  }'
```

**Réponse attendue :**
```json
{
  "message": "👋 Bonjour ! Je peux vous aider à créer des missions ou calculer des tarifs.",
  "intent": {
    "name": "greeting",
    "confidence": 1.0,
    "entities": {}
  },
  "suggestions": [
    "Créer une mission",
    "Mes missions",
    "Calculer un prix"
  ],
  "actions": [],
  "requires_human": false,
  "processing_time_ms": 450.23,
  "timestamp": "2025-01-20T10:30:00Z"
}
```

---

### 4️⃣ **Tester le Workflow de Confirmation**

```bash
# Test 1 : Demander une action critique
curl -X POST http://localhost:8000/api/ai/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Crée une mission Douala → Yaoundé 500kg",
    "user_id": "test-user-123",
    "user_role": "AFFRETEUR",
    "conversation_id": "conv-test-123"
  }'

# Réponse : Demande de confirmation avec pending_action

# Test 2 : Confirmer l'action
curl -X POST http://localhost:8000/api/ai/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Oui",
    "user_id": "test-user-123",
    "user_role": "AFFRETEUR",
    "conversation_id": "conv-test-123"
  }'

# Réponse : Action exécutée
```

---

### 5️⃣ **Vérifier l'Historique en DB**

```sql
-- Voir les conversations
SELECT * FROM chatbot_conversations 
WHERE conversation_id = 'conv-test-123' 
ORDER BY created_at DESC;

-- Voir les pending actions
SELECT * FROM chatbot_pending_actions 
WHERE conversation_id = 'conv-test-123';

-- Voir les métriques
SELECT * FROM chatbot_metrics 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔧 Configuration

### Variables d'Environnement

Vérifier que ces variables sont configurées :

```bash
# services/tsa-ai/.env
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
LLM_MODEL=llama-3.3-70b-versatile
LLM_ENABLED=true
DATABASE_URL=postgresql://tsa_user:password@localhost:5432/tsa_contest
```

---

## 🐛 Troubleshooting

### Problème : "Table chatbot_conversations does not exist"

**Solution :**
```bash
cd services/tsa-monolith
node ace migration:run
```

### Problème : "Intent toujours null"

**Cause :** Le LLM n'est pas configuré ou la clé API est invalide

**Solution :**
```bash
# Vérifier la clé API
echo $GROQ_API_KEY

# Tester l'API Groq
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

### Problème : "Suggestions toujours les mêmes"

**Cause :** Le code V3 est encore utilisé au lieu de V4

**Solution :**
- Vérifier que l'endpoint `/query` utilise bien `get_intelligent_chatbot_v4()`
- Redémarrer le serveur FastAPI

### Problème : "Pending action not found"

**Cause :** L'action a expiré (timeout 5 min)

**Solution :**
- Réduire le timeout dans le code si nécessaire
- Ou demander à l'utilisateur de recommencer

---

## 📊 Monitoring

### Métriques à Surveiller

```sql
-- Taux de succès
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
    ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM chatbot_metrics
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Intents les plus fréquents
SELECT 
    intent_name,
    COUNT(*) as count,
    AVG(confidence) as avg_confidence
FROM chatbot_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY intent_name
ORDER BY count DESC;

-- Temps de réponse moyen
SELECT 
    AVG(response_time_ms) as avg_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms) as p50,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95
FROM chatbot_metrics
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## 🧹 Maintenance

### Cleanup des Données Anciennes

```sql
-- Supprimer conversations > 90 jours
DELETE FROM chatbot_conversations 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Supprimer pending actions expirées
DELETE FROM chatbot_pending_actions 
WHERE expires_at < NOW();

-- Supprimer métriques > 30 jours
DELETE FROM chatbot_metrics 
WHERE created_at < NOW() - INTERVAL '30 days';
```

**Recommandation :** Créer un cron job pour exécuter ces requêtes quotidiennement.

---

## 📞 Support

**Questions ?** Voir `CHATBOT_V4_IMPLEMENTATION.md`

**Bugs ?** Ouvrir une issue avec :
- Message utilisateur
- Réponse chatbot
- Logs backend
- Requête SQL qui échoue (si applicable)

---

**Version :** 4.0.0  
**Date :** 2025-01-20  
**Auteur :** Équipe TSA Backend
