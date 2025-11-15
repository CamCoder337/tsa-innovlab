# 🚀 Déploiement Chatbot V3 - Guide Complet

## 📋 Checklist Pré-Déploiement

### ✅ Backend (FastAPI)
- [ ] Code V3 mergé dans `main`
- [ ] Tests passent (pytest)
- [ ] Variables d'environnement configurées
- [ ] Redis configuré (optionnel mais recommandé)
- [ ] Groq API key valide
- [ ] Database migrations appliquées

### ✅ Backend (Monolithe)
- [ ] `AIService` mis à jour
- [ ] Routes chatbot testées
- [ ] Timeout ajusté (15s)

### ✅ Infrastructure
- [ ] Nginx configuré pour SSE
- [ ] CORS configuré
- [ ] Load balancer prêt
- [ ] Monitoring configuré

### ✅ Frontend
- [ ] Composant streaming implémenté
- [ ] Tests E2E passent
- [ ] Fallback gracieux en place

---

## 🔧 Configuration Nginx pour SSE

### Problème
Par défaut, Nginx buffer les réponses, ce qui casse le streaming SSE.

### Solution

```nginx
# /etc/nginx/sites-available/tsa-ai

upstream tsa_ai_backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name api.tsa-logistique.com;

    # Chatbot streaming endpoint
    location /api/ai/chatbot/query/stream {
        proxy_pass http://tsa_ai_backend;
        
        # ✅ CRITICAL: Disable buffering for SSE
        proxy_buffering off;
        proxy_cache off;
        
        # ✅ CRITICAL: Set proper headers
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding on;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Normal chatbot endpoint
    location /api/ai/chatbot {
        proxy_pass http://tsa_ai_backend;
        
        # Standard proxy settings
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Other locations...
}
```

### Tester la configuration

```bash
# Tester la syntaxe
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Tester le streaming
curl -N https://api.tsa-logistique.com/api/ai/chatbot/query/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "user_id": "test", "user_role": "CLIENT"}'
```

---

## 🐳 Docker Compose

### docker-compose.yml

```yaml
version: '3.8'

services:
  tsa-ai:
    build: ./services/tsa-ai
    container_name: tsa-ai
    ports:
      - "8000:8000"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - LLM_ENABLED=true
      - LLM_MODEL=llama-3.3-70b-versatile
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://tsa_user:tsa_password@postgres:5432/tsa_contest
      - MONOLITH_API_URL=http://tsa-monolith:3333/api
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/ai/chatbot/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: tsa-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: tsa-postgres
    environment:
      - POSTGRES_USER=tsa_user
      - POSTGRES_PASSWORD=tsa_password
      - POSTGRES_DB=tsa_contest
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

### Déployer avec Docker

```bash
# Build
docker-compose build tsa-ai

# Démarrer
docker-compose up -d tsa-ai redis

# Vérifier les logs
docker-compose logs -f tsa-ai

# Tester
curl http://localhost:8000/api/ai/chatbot/health
```

---

## 🔐 Variables d'Environnement

### Production (.env.production)

```bash
# App
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# LLM (Groq)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=llama-3.3-70b-versatile
LLM_ENABLED=true

# Redis (CRITICAL pour production)
REDIS_URL=redis://redis:6379
CACHE_TTL_SECONDS=3600

# Database
DATABASE_URL=postgresql://tsa_user:secure_password@postgres:5432/tsa_contest

# Monolith API
MONOLITH_API_URL=http://tsa-monolith:3333/api

# CORS
ALLOWED_ORIGINS=["https://tsa-logistique.com", "https://app.tsa-logistique.com"]

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Staging (.env.staging)

```bash
# App
ENVIRONMENT=staging
DEBUG=true
LOG_LEVEL=DEBUG

# LLM (Groq)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=llama-3.3-70b-versatile
LLM_ENABLED=true

# Redis
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://tsa_user:password@localhost:5432/tsa_contest_staging

# Monolith API
MONOLITH_API_URL=http://localhost:3333/api

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

---

## 📊 Monitoring

### Prometheus Metrics

Le chatbot expose des métriques Prometheus :

```python
# app/core/metrics.py
from prometheus_client import Counter, Histogram

chatbot_queries_total = Counter(
    'chatbot_queries_total',
    'Total chatbot queries',
    ['version', 'status']
)

chatbot_query_duration = Histogram(
    'chatbot_query_duration_seconds',
    'Chatbot query duration'
)
```

### Grafana Dashboard

Créer un dashboard avec :
- Requêtes par seconde
- Latence (P50, P95, P99)
- Taux d'erreur
- Taux de fallback humain
- Coût LLM (estimé)

### Alertes

```yaml
# alerts.yml
groups:
  - name: chatbot
    interval: 30s
    rules:
      - alert: ChatbotHighLatency
        expr: histogram_quantile(0.95, chatbot_query_duration_seconds) > 3
        for: 5m
        annotations:
          summary: "Chatbot latency too high"
          description: "P95 latency is {{ $value }}s"

      - alert: ChatbotHighErrorRate
        expr: rate(chatbot_queries_total{status="error"}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "Chatbot error rate too high"
          description: "Error rate is {{ $value }}"

      - alert: ChatbotHighHumanFallback
        expr: rate(chatbot_queries_total{requires_human="true"}[5m]) > 0.1
        for: 10m
        annotations:
          summary: "Too many queries require human intervention"
```

---

## 🧪 Tests de Charge

### Locust (Load Testing)

```python
# tests/load_test_chatbot.py
from locust import HttpUser, task, between

class ChatbotUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def query_normal(self):
        self.client.post("/api/ai/chatbot/query", json={
            "message": "Combien coûte Douala → Yaoundé ?",
            "user_id": f"user-{self.user_id}",
            "user_role": "AFFRETEUR"
        })
    
    @task(1)
    def query_streaming(self):
        with self.client.post(
            "/api/ai/chatbot/query/stream",
            json={
                "message": "Prix Douala Yaoundé 500kg",
                "user_id": f"user-{self.user_id}",
                "user_role": "AFFRETEUR"
            },
            stream=True,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status: {response.status_code}")
```

### Lancer le test

```bash
# Installer locust
pip install locust

# Lancer le test (100 utilisateurs, 10/s)
locust -f tests/load_test_chatbot.py \
  --host=http://localhost:8000 \
  --users=100 \
  --spawn-rate=10 \
  --run-time=5m
```

### Objectifs de Performance

| Métrique | Objectif | Critique |
|----------|----------|----------|
| Latence P50 | < 800ms | < 2s |
| Latence P95 | < 2s | < 5s |
| Latence P99 | < 3s | < 10s |
| Taux d'erreur | < 1% | < 5% |
| Throughput | > 100 req/s | > 50 req/s |

---

## 🔄 Rollback Plan

### Si le déploiement échoue

#### Option 1 : Rollback complet

```bash
# Revenir à la version précédente
git revert HEAD
git push origin main

# Redéployer
docker-compose up -d --build tsa-ai
```

#### Option 2 : Désactiver le streaming

```bash
# Désactiver temporairement le streaming
# Dans nginx.conf, commenter la location /query/stream

# Recharger nginx
sudo systemctl reload nginx
```

#### Option 3 : Fallback vers V2

```python
# Dans ai_service.ts (monolithe)
# Changer l'URL temporairement
const response = await fetch(`${this.baseUrl}/api/ai/chatbot/v2/query`, ...)
```

---

## 📈 Post-Déploiement

### Checklist

- [ ] Vérifier health check : `curl /api/ai/chatbot/health`
- [ ] Tester query normale : `curl -X POST /api/ai/chatbot/query`
- [ ] Tester streaming : `curl -N /api/ai/chatbot/query/stream`
- [ ] Vérifier métriques : `curl /api/ai/chatbot/metrics`
- [ ] Vérifier logs : `docker-compose logs -f tsa-ai`
- [ ] Vérifier Grafana : Latence, erreurs, throughput
- [ ] Tester depuis le frontend
- [ ] Vérifier coût Groq API

### Monitoring (premières 24h)

1. **Heure 0-1 :** Surveillance active
   - Vérifier logs toutes les 15 min
   - Vérifier métriques en temps réel

2. **Heure 1-6 :** Surveillance régulière
   - Vérifier logs toutes les heures
   - Vérifier alertes

3. **Heure 6-24 :** Surveillance normale
   - Vérifier dashboard Grafana
   - Répondre aux alertes

---

## 🐛 Troubleshooting Production

### Problème : Streaming ne fonctionne pas

**Symptômes :**
- Timeout après 60s
- Pas de chunks reçus
- Erreur 502 Bad Gateway

**Solutions :**
1. Vérifier Nginx : `proxy_buffering off`
2. Vérifier timeout : `proxy_read_timeout 300s`
3. Vérifier logs : `docker-compose logs tsa-ai`

### Problème : Latence élevée

**Diagnostics :**
```bash
# Vérifier les métriques
curl http://localhost:8000/api/ai/chatbot/metrics

# Vérifier Redis
redis-cli ping

# Vérifier Groq API
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

**Solutions :**
1. Activer cache Redis
2. Réduire timeout LLM
3. Augmenter workers FastAPI

### Problème : Coût Groq trop élevé

**Diagnostics :**
```bash
# Vérifier nombre de requêtes
curl http://localhost:8000/api/ai/chatbot/metrics | jq '.stats.total_queries'

# Estimer coût
# Groq : ~$0.10 / 1M tokens
# Message moyen : 500 tokens
# Coût par requête : ~$0.00005
```

**Solutions :**
1. Activer cache Redis (réduction 70%)
2. Augmenter seuil LLM (plus de règles)
3. Limiter rate (max 100 req/min par user)

---

## 📞 Support

**Urgence Production :** Slack #tsa-backend-alerts  
**Questions :** Slack #tsa-ai-team  
**Documentation :** Voir `CHATBOT_V3_README.md`

---

**Version :** 3.0.0-unified  
**Date :** 2025-01-20  
**Auteur :** Équipe TSA DevOps
