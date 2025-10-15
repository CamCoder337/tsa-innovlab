# 💰 Guide du Système de Tarification

## 🎯 Formule Simple

```
Prix (FCFA) = 50 × Distance (km) × Poids (tonnes)
```

---

## 📋 Architecture du Système

### 1. Calcul de la Distance (HORS TSA-AI)

**Responsable :** Backend AdonisJS (tsa-monolith)  
**Méthode :** Google Maps API  
**Stockage :** Table `addresses` avec coordonnées GPS

```typescript
// Dans tsa-monolith
const distance = await googleMapsService.calculateDistance(
  adresse_depart.latitude,
  adresse_depart.longitude,
  adresse_arrivee.latitude,
  adresse_arrivee.longitude
);
```

### 2. Calcul du Prix (DANS TSA-AI)

**Responsable :** Service FastAPI (tsa-ai)  
**Fichier :** `app/services/pricing_service.py`  
**Input :** Distance (fournie) + Poids (depuis mission)

```python
# Dans tsa-ai
from app.services.pricing_service import PricingService

service = PricingService()
result = service.calculate_price(
    distance_km=236.1,  # Fournie par Google Maps API
    poids_tonnes=5.0    # Depuis la mission
)
```

---

## 🔧 Utilisation du Service

### Import

```python
from app.services.pricing_service import PricingService, get_pricing_service

# Option 1 : Instance directe
service = PricingService()

# Option 2 : Singleton (recommandé pour FastAPI)
service = get_pricing_service()
```

### Calcul Simple

```python
result = service.calculate_price(
    distance_km=236.1,
    poids_tonnes=5.0
)

print(result)
# {
#     "prix_calcule": 59025.0,
#     "devise": "FCFA",
#     "details": {
#         "distance_km": 236.1,
#         "poids_tonnes": 5.0,
#         "prix_par_km_par_tonne": 50,
#         "formule": "50 × distance × tonnes",
#         "calcul": "50 × 236.1 × 5.0 = 59025.0"
#     }
# }
```

### Calcul avec Métadonnées

```python
result = service.calculate_price(
    distance_km=236.1,
    poids_tonnes=5.0,
    metadata={
        "ville_depart": "Yaoundé",
        "ville_arrivee": "Douala",
        "mission_id": "uuid-123"
    }
)

# Les métadonnées sont incluses dans la réponse
print(result['metadata'])
```

### Calcul Batch (Plusieurs Missions)

```python
missions = [
    {"distance_km": 236.1, "poids_tonnes": 5.0},
    {"distance_km": 1109.0, "poids_tonnes": 10.0},
    {"distance_km": 157.6, "poids_tonnes": 2.5}
]

results = service.calculate_price_batch(missions)

for result in results:
    if result['success']:
        print(f"Prix: {result['prix_calcule']} FCFA")
    else:
        print(f"Erreur: {result['error']}")
```

### Fourchette de Prix (Min/Max)

```python
result = service.get_price_estimate_range(
    distance_km=236.1,
    poids_tonnes=5.0,
    variation_percent=5.0  # ±5%
)

print(result)
# {
#     "prix_min": 56073.75,
#     "prix_moyen": 59025.0,
#     "prix_max": 61976.25,
#     "devise": "FCFA",
#     "variation_percent": 5.0
# }
```

---

## 🧪 Tests

**Fichier :** `tests/test_pricing_service.py`

```bash
# Exécuter les tests
pytest tests/test_pricing_service.py -v

# Résultat attendu : 9 tests passés
```

---

## 📊 Exemples Réels (Cameroun)

| Route | Distance | Poids | Calcul | Prix |
|-------|----------|-------|--------|------|
| Yaoundé → Douala | 236.1 km | 5 t | 50 × 236.1 × 5 | **59,025 FCFA** |
| Yaoundé → Garoua | 1,109 km | 10 t | 50 × 1,109 × 10 | **554,500 FCFA** |
| Yaoundé → Ebolowa | 157.6 km | 2.5 t | 50 × 157.6 × 2.5 | **19,700 FCFA** |
| Yaoundé → Bamenda | 372.2 km | 7 t | 50 × 372.2 × 7 | **130,270 FCFA** |

---

## 🔄 Flux Complet (AdonisJS → FastAPI)

### 1. Frontend envoie une mission

```typescript
// Frontend
POST /api/missions
{
  "adresse_depart_id": "uuid-depart",
  "adresse_arrivee_id": "uuid-arrivee",
  "poids": 5.0,
  ...
}
```

### 2. AdonisJS calcule la distance

```typescript
// tsa-monolith
const adresseDepart = await Address.find(mission.adresse_depart_id)
const adresseArrivee = await Address.find(mission.adresse_arrivee_id)

const distance = await googleMapsService.calculateDistance(
  adresseDepart.latitude,
  adresseDepart.longitude,
  adresseArrivee.latitude,
  adresseArrivee.longitude
)
```

### 3. AdonisJS appelle FastAPI pour le prix

```typescript
// tsa-monolith
const response = await axios.post('http://tsa-ai:8000/api/v1/pricing/calculate', {
  distance_km: distance,
  poids_tonnes: mission.poids
})

const prix = response.data.prix_calcule
```

### 4. AdonisJS retourne au frontend

```typescript
// tsa-monolith
return {
  mission: mission,
  prix_estime: prix,
  devise: "FCFA"
}
```

---

## ⚠️ Validation des Inputs

Le service valide automatiquement :

- ✅ Distance > 0
- ✅ Poids > 0
- ❌ Lève `ValueError` si invalide

```python
# Exemple d'erreur
try:
    service.calculate_price(-100, 5.0)
except ValueError as e:
    print(e)  # "La distance doit être positive. Reçu : -100 km"
```

---

## 📁 Fichiers Importants

### Code
- ✅ `app/services/pricing_service.py` - Service principal
- ✅ `tests/test_pricing_service.py` - Tests unitaires

### Documentation
- ✅ `docs/PRICING_GUIDE.md` - Ce fichier
- ✅ `docs/PRICING_SIMPLE.md` - Guide détaillé
- ✅ `PRICING_README.md` - Vue d'ensemble

### Données (Référence uniquement)
- ℹ️ `FICHE DE DISTANCE...xlsx` - 68 villes (pour info, pas utilisé dans le code)

---

## 🚀 Prochaine Étape

**Créer l'endpoint FastAPI** pour exposer le service via HTTP.

Fichier à créer : `app/endpoints/pricing.py`

---

_TSA InnovLab Contest 2025 - Système de Tarification Simplifié_
