# Module KYC - Guide Rapide

## Démarrage Rapide

### 1. Vérifier que Google Vision est configuré

```bash
# Vérifier les variables d'environnement
echo $GOOGLE_CREDENTIALS_JSON
# ou
echo $GOOGLE_APPLICATION_CREDENTIALS
```

### 2. Tester le service

```bash
# Health check
curl http://localhost:8001/api/ai/kyc/health

# Devrait retourner :
# {
#   "status": "healthy",
#   "google_vision_available": true,
#   ...
# }
```

### 3. Extraire un document

```bash
curl -X POST "http://localhost:8001/api/ai/kyc/extract" \
  -F "document_type=CNI_ANCIEN" \
  -F "recto=@cni_recto.jpg" \
  -F "verso=@cni_verso.jpg"
```

## Utilisation depuis le Monolithe

```typescript
// Dans Adonis
import axios from 'axios'
import FormData from 'form-data'

const formData = new FormData()
formData.append('document_type', 'CNI_ANCIEN')
formData.append('recto', fs.createReadStream(rectoPath))
formData.append('verso', fs.createReadStream(versoPath))

const response = await axios.post(
  'http://tsa-ai:8001/api/ai/kyc/extract',
  formData,
  { headers: formData.getHeaders() }
)

const { data, confidence_score, warnings } = response.data
```

## ⚠️ Points d'Attention

1. **Parsing Basique** : Le code actuel fait un parsing TRÈS simple
   - Améliorer les regex dans `kyc_ocr_service.py`
   - Tester avec vrais documents camerounais
   - Ajouter validation des données

2. **Coûts** : $0.0015 par image
   - 100 docs/jour × 2 faces = $9/mois
   - Surveiller l'utilisation

3. **Validation Admin** : Toujours obligatoire
   - `requires_manual_validation` est toujours `True`
   - Admin doit vérifier/corriger les données

4. **Performance** : ~1-2s par document
   - Latence réseau Google Vision
   - Acceptable pour <100 docs/jour

## Améliorer le Parsing

Voir `docs/KYC_IMPLEMENTATION.md` pour :
- Patterns regex avancés
- Utilisation des positions du texte
- Validation des données
- Correction d'erreurs OCR

## Tests

```bash
# Tests unitaires (avec mocks)
pytest tests/test_kyc.py -v

# Tests d'intégration (nécessite Google Vision)
pytest tests/test_kyc.py -m integration -v
```

## Documentation Complète

Voir `docs/KYC_IMPLEMENTATION.md` pour :
- Architecture détaillée
- Exemples d'intégration
- Monitoring des coûts
- Roadmap d'amélioration
