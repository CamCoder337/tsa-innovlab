# Module KYC - Documentation d'Implémentation

## ⚠️ AVERTISSEMENTS IMPORTANTS

### Choix Technique : Google Vision OCR

Ce module utilise **Google Cloud Vision API** pour l'OCR, ce qui présente plusieurs **limitations critiques** :

#### ❌ Problèmes Identifiés

1. **Parsing Manuel Requis**
   - Google Vision retourne du texte brut non structuré
   - Vous devez parser manuellement chaque champ (nom, prénom, date, etc.)
   - Le code actuel contient un parsing **TRÈS BASIQUE** avec regex simples
   - **Taux d'erreur élevé attendu** sur documents de mauvaise qualité

2. **Coûts Récurrents**
   - $1.50 par 1000 images
   - 100 documents/jour × 2 faces = 200 images/jour
   - **~$9/mois** ou **$108/an**
   - Coûts qui augmentent avec le volume

3. **Dépendance Externe**
   - Nécessite connexion internet
   - Soumis aux quotas Google Cloud
   - Latence réseau (~500ms-1s par image)
   - Pannes possibles du service Google

4. **Pas Optimisé pour Documents Camerounais**
   - Google Vision est générique
   - Ne connaît pas les formats spécifiques CNI camerounaises
   - Pas de validation des champs extraits

#### ✅ Alternative Recommandée (Non Implémentée)

**EasyOCR avec Extracteurs Spécialisés** (code disponible dans `KYC/ocr test/`)

**Avantages :**
- ✅ Gratuit (pas de coûts récurrents)
- ✅ Traitement local (pas de latence réseau)
- ✅ Extracteurs spécialisés pour CNI camerounaises
- ✅ Validation des champs intégrée
- ✅ Meilleure précision sur documents camerounais

**Inconvénients :**
- ⚠️ Nécessite GPU pour performances optimales
- ⚠️ Plus lent sur CPU (~15-30s par document)

**Votre environnement :** Pas de GPU, <100 docs/jour
→ EasyOCR CPU serait **acceptable** (50 min/jour de traitement)

---

## Architecture Actuelle

```
services/tsa-ai/
├── app/
│   ├── endpoints/
│   │   └── kyc.py                    # Endpoints API
│   ├── services/
│   │   └── kyc_ocr_service.py        # Service OCR Google Vision
│   └── schemas/
│       └── kyc.py                    # Schémas Pydantic
```

---

## Endpoints Disponibles

### 1. Health Check

```bash
GET /api/ai/kyc/health
```

Vérifie la disponibilité du service KYC et de Google Vision API.

**Réponse :**
```json
{
  "status": "healthy",
  "google_vision_available": true,
  "supported_document_types": ["CNI_ANCIEN", "CNI_NOUVEAU", "PERMIS_CONDUIRE"],
  "message": "Service KYC opérationnel"
}
```

### 2. Extraction de Document

```bash
POST /api/ai/kyc/extract
Content-Type: multipart/form-data
```

**Paramètres :**
- `document_type` (form): Type de document (`CNI_ANCIEN`, `CNI_NOUVEAU`, `PERMIS_CONDUIRE`)
- `recto` (file): Image recto (obligatoire)
- `verso` (file): Image verso (optionnel)

**Exemple avec curl :**
```bash
curl -X POST "http://localhost:8001/api/ai/kyc/extract" \
  -F "document_type=CNI_ANCIEN" \
  -F "recto=@cni_recto.jpg" \
  -F "verso=@cni_verso.jpg" \
  -H "X-User-Id: user123" \
  -H "X-User-Role: transporteur"
```

**Réponse :**
```json
{
  "success": true,
  "status": "partial",
  "document_type": "CNI_ANCIEN",
  "data": {
    "nom": "KENGNE FOTSO",
    "prenoms": "Etienne Junior",
    "date_naissance": "15.03.1998",
    "lieu_naissance": "DOUALA",
    "sexe": "M",
    "taille": "1,75",
    "profession": "INFORMATICIEN",
    "pere": "FOTSO KAMDEM Jean",
    "mere": "NGUEFACK MARIE LOUISE",
    "numero": "123456789",
    "date_delivrance": "12.05.2020",
    "date_expiration": "12.05.2030",
    "confidence_score": 0.75
  },
  "raw_text_recto": "REPUBLIQUE DU CAMEROUN\nCARTE NATIONALE D'IDENTITE\nNOM: KENGNE FOTSO\n...",
  "raw_text_verso": "PERE: FOTSO KAMDEM Jean\nMERE: NGUEFACK MARIE LOUISE\n...",
  "extraction_time_ms": 1250.5,
  "confidence_score": 0.75,
  "warnings": [
    "Confiance moyenne, vérification manuelle recommandée"
  ],
  "errors": [],
  "requires_manual_validation": true,
  "validation_notes": "Validation admin obligatoire avant acceptation"
}
```

### 3. Types de Documents Supportés

```bash
GET /api/ai/kyc/document-types
```

Liste les types de documents KYC supportés.

### 4. Statistiques (TODO)

```bash
GET /api/ai/kyc/stats
```

Statistiques d'utilisation du service (non implémenté).

---

## Améliorer le Parsing

### Problème Actuel

Le parsing dans `kyc_ocr_service.py` est **TRÈS BASIQUE** :

```python
# Exemple actuel (INSUFFISANT)
if 'NOM' in line_upper:
    data['nom'] = line.split(':', 1)[1].strip()
```

**Problèmes :**
- Ne gère pas les variations de format
- Sensible aux erreurs OCR
- Pas de validation des données
- Pas de correction automatique

### Solutions Recommandées

#### 1. Utiliser des Patterns Regex Plus Robustes

```python
# Amélioration pour dates
date_patterns = [
    r'\b(\d{2})[./](\d{2})[./](\d{4})\b',  # DD.MM.YYYY
    r'\b(\d{2})\s+(JAN|FEV|MAR|AVR|MAI|JUN|JUL|AOU|SEP|OCT|NOV|DEC)\s+(\d{4})\b',  # DD MON YYYY
]

for pattern in date_patterns:
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        # Normaliser au format DD.MM.YYYY
        date = normalize_date(match.groups())
        break
```

#### 2. Utiliser la Position du Texte

Google Vision retourne aussi les **coordonnées** du texte :

```python
# Utiliser document_text_detection avec positions
response = self.client.document_text_detection(image=image)

for page in response.full_text_annotation.pages:
    for block in page.blocks:
        # block.bounding_box contient les coordonnées
        # Utiliser la position pour identifier les champs
        if is_in_top_left(block.bounding_box):
            # Probablement le nom
            pass
```

#### 3. Validation des Données Extraites

```python
def validate_cni_data(data: Dict) -> List[str]:
    """Valide les données extraites"""
    warnings = []
    
    # Vérifier format numéro CNI (9-10 chiffres)
    if data.get('numero'):
        if not re.match(r'^\d{9,10}$', data['numero']):
            warnings.append("Format numéro CNI invalide")
    
    # Vérifier cohérence dates
    if data.get('date_naissance') and data.get('date_delivrance'):
        age_at_delivery = calculate_age(data['date_naissance'], data['date_delivrance'])
        if age_at_delivery < 18:
            warnings.append("Âge à la délivrance < 18 ans (suspect)")
    
    # Vérifier sexe
    if data.get('sexe') and data['sexe'] not in ['M', 'F']:
        warnings.append("Sexe invalide")
    
    return warnings
```

#### 4. Utiliser un Dictionnaire de Corrections

```python
# Corrections communes d'erreurs OCR
OCR_CORRECTIONS = {
    'REPUBL1QUE': 'REPUBLIQUE',
    'NATI0NALE': 'NATIONALE',
    'IDENT1TE': 'IDENTITE',
    'N0M': 'NOM',
    'PREN0MS': 'PRENOMS',
    # etc.
}

def correct_ocr_errors(text: str) -> str:
    """Corrige les erreurs OCR communes"""
    for wrong, correct in OCR_CORRECTIONS.items():
        text = text.replace(wrong, correct)
    return text
```

#### 5. Mode Fusion Multi-Moteurs (Avancé)

Pour améliorer la précision, combiner plusieurs moteurs OCR :

```python
# Extraire avec Google Vision
text_google, conf_google = extract_with_google_vision(image)

# Extraire avec Tesseract (fallback gratuit)
text_tesseract = extract_with_tesseract(image)

# Comparer et fusionner
final_text = merge_ocr_results(text_google, text_tesseract)
```

---

## Intégration avec le Monolithe

### Workflow Complet

1. **Frontend** : Utilisateur upload CNI/Permis
2. **Monolithe (Adonis)** : Reçoit les fichiers
3. **Monolithe → AI Service** : Envoie à `/api/ai/kyc/extract`
4. **AI Service** : Extraction OCR + parsing
5. **AI Service → Monolithe** : Retourne données + texte brut
6. **Monolithe** : Stocke en base avec statut "en attente validation"
7. **Admin** : Valide/corrige les données via interface
8. **Monolithe** : Met à jour le statut "validé"

### Exemple d'Appel depuis Adonis

```typescript
// app/services/kyc_service.ts
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

export class KYCService {
  private aiServiceUrl = Env.get('AI_SERVICE_URL')

  async extractDocument(
    documentType: 'CNI_ANCIEN' | 'CNI_NOUVEAU' | 'PERMIS_CONDUIRE',
    rectoPath: string,
    versoPath?: string
  ) {
    const formData = new FormData()
    formData.append('document_type', documentType)
    formData.append('recto', fs.createReadStream(rectoPath))
    
    if (versoPath) {
      formData.append('verso', fs.createReadStream(versoPath))
    }

    const response = await axios.post(
      `${this.aiServiceUrl}/api/ai/kyc/extract`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000 // 30s timeout
      }
    )

    return response.data
  }
}
```

---

## Monitoring et Coûts

### Tracking des Coûts Google Vision

Chaque appel à `document_text_detection` coûte **$0.0015**.

**Calcul mensuel :**
```
100 documents/jour × 2 faces × 30 jours = 6000 images/mois
6000 × $0.0015 = $9/mois
```

**Recommandation :** Implémenter un compteur en base de données :

```python
# Dans kyc_ocr_service.py
def extract_text_from_image(self, image_path: str):
    # ... extraction ...
    
    # Logger pour monitoring des coûts
    logger.info(f"COST_TRACKING: google_vision_call=1, cost_usd=0.0015")
```

### Métriques à Suivre

1. **Nombre d'extractions** par type de document
2. **Taux de succès** (success/partial/failed)
3. **Temps d'extraction moyen**
4. **Score de confiance moyen**
5. **Taux de validation admin** (combien nécessitent correction)
6. **Coûts Google Vision** cumulés

---

## Tests

### Test Manuel

```bash
# 1. Démarrer le service
cd services/tsa-ai
python -m uvicorn app.main:app --reload --port 8001

# 2. Tester health check
curl http://localhost:8001/api/ai/kyc/health

# 3. Tester extraction (avec vos images)
curl -X POST "http://localhost:8001/api/ai/kyc/extract" \
  -F "document_type=CNI_ANCIEN" \
  -F "recto=@test_cni_recto.jpg" \
  -F "verso=@test_cni_verso.jpg"
```

### Tests Unitaires (TODO)

Créer `tests/test_kyc.py` :

```python
import pytest
from app.services.kyc_ocr_service import KYCOCRService

def test_parse_cni_ancien_recto():
    service = KYCOCRService()
    
    # Texte brut simulé
    text = """
    REPUBLIQUE DU CAMEROUN
    CARTE NATIONALE D'IDENTITE
    NOM: KENGNE FOTSO
    PRENOMS: Etienne Junior
    DATE DE NAISSANCE: 15.03.1998
    """
    
    data = service._parse_cni_ancien_recto(text)
    
    assert data['nom'] == 'KENGNE FOTSO'
    assert data['prenoms'] == 'Etienne Junior'
    assert data['date_naissance'] == '15.03.1998'
```

---

## Prochaines Étapes

### Court Terme (Sprint Actuel)

1. ✅ Implémentation basique avec Google Vision
2. ⚠️ **Améliorer le parsing** (regex + validation)
3. ⚠️ **Tester avec vrais documents** camerounais
4. ⚠️ Intégrer avec le monolithe Adonis
5. ⚠️ Créer interface admin de validation

### Moyen Terme (Sprints Suivants)

1. Implémenter tracking des coûts en DB
2. Ajouter statistiques KYC
3. Améliorer parsing avec positions du texte
4. Ajouter validation automatique des données
5. Créer tests unitaires complets

### Long Terme (Optimisation)

1. **Migrer vers EasyOCR** pour réduire coûts
2. Implémenter cache des résultats
3. Ajouter mode fusion multi-moteurs
4. Machine Learning pour correction automatique
5. API de feedback pour améliorer le parsing

---

## Conclusion

⚠️ **Le module KYC actuel est FONCTIONNEL mais BASIQUE.**

**Points d'attention :**
- Le parsing nécessite **amélioration urgente**
- Tester avec **vrais documents** camerounais
- Surveiller les **coûts Google Vision**
- Validation admin **obligatoire** (déjà prévu)

**Recommandation finale :**
Considérez sérieusement la migration vers **EasyOCR** après le concours pour :
- Éliminer les coûts récurrents
- Améliorer la précision sur documents camerounais
- Réduire la dépendance externe

---

## Support

Pour questions ou améliorations :
1. Consulter la doc Google Vision : https://cloud.google.com/vision/docs/ocr
2. Voir le code EasyOCR existant : `services/tsa-ai/KYC/ocr test/`
3. Tester avec différents formats de documents
4. Itérer sur le parsing selon les résultats réels
