# KYC Module - Guide de Démarrage Rapide

## 🚀 Installation (5 minutes)

### 1. Installer les Dépendances

```bash
cd services/tsa-ai

# Installer toutes les dépendances (incluant EasyOCR)
pip install -r requirements.txt

# Ou installer uniquement EasyOCR
pip install easyocr torch torchvision opencv-python PyMuPDF
```

**⏱️ Temps d'installation :** 5-10 minutes (téléchargement PyTorch)

---

### 2. Configurer les Variables d'Environnement

```bash
# Copier le fichier exemple
cp .env.example .env

# Éditer .env
nano .env
```

**Configuration minimale :**
```bash
# Stratégie hybride (recommandé)
KYC_STRATEGY=hybrid
KYC_EASYOCR_TIMEOUT=60
KYC_FALLBACK_ENABLED=true

# Google Vision (pour fallback)
GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
```

---

### 3. Démarrer le Serveur

```bash
# Depuis services/tsa-ai
python -m uvicorn app.main:app --reload --port 8001
```

**Sortie attendue :**
```
INFO:     KYC OCR Service initialisé - Stratégie: hybrid
INFO:     Uvicorn running on http://0.0.0.0:8001
```

---

## ✅ Vérification

### 1. Health Check

```bash
curl http://localhost:8001/api/ai/kyc/health
```

**Réponse attendue :**
```json
{
  "status": "healthy",
  "google_vision_available": true,
  "supported_document_types": ["CNI_ANCIEN", "CNI_NOUVEAU", "PERMIS_CONDUIRE"],
  "message": "EasyOCR disponible | Google Vision disponible | Stratégie: hybrid"
}
```

---

### 2. Test d'Extraction

```bash
curl -X POST "http://localhost:8001/api/ai/kyc/extract" \
  -F "document_type=CNI_ANCIEN" \
  -F "recto=@test_cni_recto.jpg" \
  -F "verso=@test_cni_verso.jpg"
```

**Réponse attendue :**
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
  "extraction_method": "easyocr",
  "extraction_cost_usd": 0.0,
  "extraction_time_ms": 15234
}
```

---

### 3. Vérifier les Statistiques

```bash
curl http://localhost:8001/api/ai/kyc/stats
```

**Réponse attendue :**
```json
{
  "success": true,
  "stats": {
    "easyocr_success": 1,
    "google_vision_fallback": 0,
    "total_extractions": 1,
    "easyocr_rate": 1.0,
    "fallback_rate": 0.0,
    "total_cost_usd": 0.0
  },
  "cost_analysis": {
    "current_month_usd": 0.0,
    "projected_annual_usd": 0.0,
    "savings_vs_google_only": 108.0
  }
}
```

---

## 📊 Performance Attendue

### Premier Appel

```
Temps: 2-3 minutes
Raison: Chargement des modèles EasyOCR
Méthode: easyocr
Coût: $0
```

### Appels Suivants

```
Temps: 10-30 secondes
Raison: Modèles déjà en mémoire
Méthode: easyocr (95%) ou google_vision_fallback (5%)
Coût: $0 (95%) ou $0.0015 (5%)
```

---

## 🔧 Configuration Avancée

### Ajuster les Timeouts

```bash
# Si beaucoup de timeouts
KYC_EASYOCR_TIMEOUT=90  # Au lieu de 60

# Si premier appel très lent
KYC_EASYOCR_FIRST_CALL_TIMEOUT=240  # Au lieu de 180
```

### Désactiver le Fallback (Mode EasyOCR Pur)

```bash
KYC_STRATEGY=easyocr
KYC_FALLBACK_ENABLED=false
```

### Forcer Google Vision (Debug)

```bash
KYC_STRATEGY=google_vision
```

---

## 🐛 Problèmes Courants

### Erreur : "EasyOCR non disponible"

**Solution :**
```bash
pip install easyocr torch torchvision opencv-python
```

### Erreur : "Google Vision non configuré"

**Solution :**
```bash
# Ajouter dans .env
GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### Extraction Très Lente (>2 min)

**Normal pour le premier appel** (chargement modèles).
Les appels suivants seront plus rapides.

---

## 📚 Documentation Complète

- **Architecture Hybride** : `docs/KYC_HYBRID_STRATEGY.md`
- **Implémentation** : `docs/KYC_IMPLEMENTATION.md`
- **API Reference** : `http://localhost:8001/docs`

---

## ✅ Checklist

- [ ] Dépendances installées
- [ ] Variables d'environnement configurées
- [ ] Serveur démarré
- [ ] Health check OK
- [ ] Test d'extraction réussi
- [ ] Statistiques vérifiées

**Temps total : 10-15 minutes** ⚡

---

**Vous êtes prêt ! 🎉**

Prochaine étape : Intégrer avec le monolithe Adonis
