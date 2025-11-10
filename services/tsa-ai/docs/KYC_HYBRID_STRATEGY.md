# Stratégie Hybride KYC - Documentation

## 🎯 Vue d'Ensemble

Le module KYC utilise une **stratégie hybride intelligente** combinant :
1. **EasyOCR** (gratuit, précis sur CNI camerounaises) - Méthode principale
2. **Google Vision** (payant, rapide) - Fallback automatique

**Résultat :** ~95% des documents traités gratuitement, économie de $100+/an

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KYC Extraction Request                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │  HybridKYCOCRService        │
         │  (Orchestrateur)            │
         └─────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐            ┌────────────────┐
│   EasyOCR     │            │ Google Vision  │
│   (Primary)   │            │   (Fallback)   │
│               │            │                │
│ • Gratuit     │            │ • $0.0015/img  │
│ • 10-60s      │            │ • 1-2s         │
│ • Précis CNI  │            │ • Générique    │
└───────┬───────┘            └────────┬───────┘
        │                             │
        │  Success                    │  Timeout/Error
        │  (95%)                      │  (5%)
        │                             │
        └──────────────┬──────────────┘
                       │
                       ▼
              ┌────────────────┐
              │    Response    │
              │  + Métriques   │
              └────────────────┘
```

---

## ⚙️ Configuration

### Variables d'Environnement

```bash
# Stratégie (hybrid recommandé)
KYC_STRATEGY=hybrid  # hybrid | easyocr | google_vision

# Timeouts EasyOCR
KYC_EASYOCR_TIMEOUT=60  # Appels normaux
KYC_EASYOCR_FIRST_CALL_TIMEOUT=180  # Premier appel (chargement modèles)

# Fallback
KYC_FALLBACK_ENABLED=true
KYC_MIN_CONFIDENCE=0.7  # Fallback si confiance < 70%

# Google Vision (pour fallback)
GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### Stratégies Disponibles

| Stratégie | Description | Cas d'Usage |
|-----------|-------------|-------------|
| **hybrid** | EasyOCR + Google Vision fallback | **Recommandé** - Économies maximales |
| **easyocr** | EasyOCR uniquement | Pas de budget Google Cloud |
| **google_vision** | Google Vision uniquement | Performance critique |

---

## 🔄 Logique de Fallback

### Scénario 1 : Succès EasyOCR (95% des cas)

```
1. Tentative EasyOCR (timeout: 60s)
2. ✅ Succès en 10-30s
3. Confiance > 0.7
4. Retour résultat (coût: $0)
```

### Scénario 2 : Timeout EasyOCR

```
1. Tentative EasyOCR (timeout: 60s)
2. ⏱️  Timeout après 60s
3. Fallback Google Vision
4. ✅ Succès en 1-2s
5. Retour résultat (coût: $0.0015)
```

### Scénario 3 : Confiance Faible

```
1. Tentative EasyOCR
2. ✅ Succès mais confiance = 0.5 (< 0.7)
3. Fallback Google Vision
4. ✅ Succès avec confiance = 0.9
5. Retour résultat Google Vision (coût: $0.0015)
```

### Scénario 4 : Erreur EasyOCR

```
1. Tentative EasyOCR
2. ❌ Erreur (crash, out of memory, etc.)
3. Fallback Google Vision
4. ✅ Succès
5. Retour résultat (coût: $0.0015)
```

---

## 📊 Métriques et Monitoring

### Endpoint de Statistiques

```bash
GET /api/ai/kyc/stats
```

**Réponse :**
```json
{
  "success": true,
  "stats": {
    "easyocr_success": 950,
    "easyocr_timeout": 20,
    "easyocr_error": 10,
    "easyocr_low_confidence": 20,
    "google_vision_fallback": 50,
    "google_vision_direct": 0,
    "total_cost_usd": 0.075,
    "total_extractions": 1000,
    "easyocr_rate": 0.95,
    "fallback_rate": 0.05,
    "strategy": "hybrid",
    "easyocr_available": true,
    "google_vision_available": true
  },
  "cost_analysis": {
    "current_month_usd": 0.075,
    "projected_annual_usd": 0.90,
    "savings_vs_google_only": 107.10,
    "easyocr_percentage": "95.0%",
    "fallback_percentage": "5.0%"
  },
  "recommendations": [
    {
      "level": "success",
      "message": "Excellent ! 95.0% des documents traités gratuitement avec EasyOCR."
    }
  ]
}
```

### Métriques Clés

| Métrique | Description | Cible |
|----------|-------------|-------|
| `easyocr_rate` | % de docs traités par EasyOCR | > 90% |
| `fallback_rate` | % de fallback Google Vision | < 10% |
| `total_cost_usd` | Coût total mensuel | < $10 |
| `easyocr_timeout` | Nombre de timeouts | < 5% |

---

## 💰 Analyse des Coûts

### Projection Annuelle

**Scénario : 100 documents/jour**

| Méthode | Coût/doc | Docs/an | Coût/an |
|---------|----------|---------|---------|
| **Hybrid (95% EasyOCR)** | $0.00015 | 36,500 | **$5.48** |
| **Google Vision seul** | $0.003 | 36,500 | **$109.50** |
| **Économie** | - | - | **$104.02** |

### Calcul Détaillé

```
100 docs/jour × 365 jours = 36,500 docs/an

Hybrid (95% EasyOCR, 5% Google Vision):
- EasyOCR: 34,675 docs × $0 = $0
- Google Vision: 1,825 docs × $0.003 = $5.48
- Total: $5.48/an

Google Vision seul:
- 36,500 docs × $0.003 = $109.50/an

Économie: $109.50 - $5.48 = $104.02/an (95% d'économies)
```

---

## 🚀 Utilisation

### Extraction de Document

```bash
POST /api/ai/kyc/extract
Content-Type: multipart/form-data

document_type: CNI_ANCIEN
recto: cni_recto.jpg
verso: cni_verso.jpg
```

**Réponse :**
```json
{
  "success": true,
  "status": "success",
  "document_type": "CNI_ANCIEN",
  "data": {
    "nom": "KENGNE FOTSO",
    "prenoms": "Etienne Junior",
    ...
  },
  "extraction_time_ms": 15234,
  "confidence_score": 0.85,
  "extraction_method": "easyocr",
  "extraction_cost_usd": 0.0,
  "warnings": [],
  "errors": []
}
```

### Forcer une Méthode (Debug)

Pour tester spécifiquement une méthode :

```bash
# Forcer EasyOCR
KYC_STRATEGY=easyocr

# Forcer Google Vision
KYC_STRATEGY=google_vision
```

---

## 🔧 Optimisation

### Réduire le Taux de Fallback

**Si fallback_rate > 10% :**

1. **Augmenter le timeout**
   ```bash
   KYC_EASYOCR_TIMEOUT=90  # Au lieu de 60
   ```

2. **Améliorer les performances serveur**
   - Vérifier CPU disponible
   - Vérifier RAM disponible
   - Fermer applications inutiles

3. **Réduire la résolution des images**
   - Optimiser avant envoi
   - Réduire le zoom PDF → image

### Réduire les Coûts

**Si coûts > $10/mois :**

1. **Désactiver fallback confiance faible**
   ```bash
   KYC_MIN_CONFIDENCE=0.5  # Plus tolérant
   ```

2. **Augmenter timeout**
   ```bash
   KYC_EASYOCR_TIMEOUT=120  # Laisser plus de temps
   ```

3. **Analyser les causes de fallback**
   ```bash
   GET /api/ai/kyc/stats
   # Vérifier easyocr_timeout vs easyocr_error
   ```

---

## 📈 Performance Attendue

### Sur Votre Serveur (8 cœurs, 22 Go RAM)

| Métrique | Valeur Attendue |
|----------|-----------------|
| Premier appel | 2-3 minutes (chargement modèles) |
| Appels suivants | 10-30 secondes |
| Taux de succès EasyOCR | 90-95% |
| Taux de fallback | 5-10% |
| Coût mensuel | $0.50 - $2.00 |
| Coût annuel | $6 - $24 |

### Avec Parallélisation (Future)

```python
# Traiter 8 documents simultanément
100 docs/jour ÷ 8 cœurs = 12.5 docs séquentiels
12.5 × 15s = 3 minutes de traitement total
```

---

## 🐛 Troubleshooting

### Problème : Tous les appels en fallback

**Symptômes :** `fallback_rate = 100%`

**Causes possibles :**
1. EasyOCR non installé
2. Timeout trop court
3. Serveur surchargé

**Solutions :**
```bash
# Vérifier installation
pip list | grep easyocr

# Augmenter timeout
KYC_EASYOCR_TIMEOUT=120

# Vérifier logs
tail -f logs/kyc.log
```

### Problème : Coûts élevés

**Symptômes :** `total_cost_usd > $10/mois`

**Solutions :**
1. Analyser les stats : `GET /api/ai/kyc/stats`
2. Identifier la cause (timeout vs erreur vs confiance)
3. Ajuster configuration selon la cause

### Problème : EasyOCR très lent

**Symptômes :** `easyocr_timeout` élevé

**Solutions :**
1. Vérifier CPU/RAM disponible
2. Réduire résolution images
3. Augmenter timeout si acceptable

---

## 📚 Références

- **EasyOCR** : https://github.com/JaidedAI/EasyOCR
- **Google Vision** : https://cloud.google.com/vision/docs/ocr
- **Code source** : `app/services/kyc_ocr_service_hybrid.py`
- **Tests** : `tests/test_kyc.py`

---

## ✅ Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] EasyOCR installé (`pip install easyocr`)
- [ ] Google Vision credentials configurés (fallback)
- [ ] Timeout ajusté selon performances serveur
- [ ] Monitoring activé (`/api/ai/kyc/stats`)
- [ ] Tests effectués avec vraies CNI
- [ ] Documentation lue et comprise

---

**Stratégie hybride = Meilleur des deux mondes ! 🎯**
