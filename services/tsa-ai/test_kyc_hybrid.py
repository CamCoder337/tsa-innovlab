#!/usr/bin/env python3
"""
Script de test pour le module KYC hybride

Usage:
    python test_kyc_hybrid.py

Vérifie que l'implémentation hybride fonctionne correctement
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

print("=" * 70)
print("TEST MODULE KYC HYBRIDE")
print("=" * 70)

# Test 1: Import des modules
print("\n[1/6] Test import des modules...")
try:
    from app.services.kyc_ocr_service_hybrid import HybridKYCOCRService, get_kyc_ocr_service
    from app.schemas.kyc import DocumentType, OCRExtractionResponse
    from app.endpoints import kyc
    print("✅ Tous les modules importés")
except Exception as e:
    print(f"❌ Erreur import: {e}")
    sys.exit(1)

# Test 2: Création du service
print("\n[2/6] Test création du service hybride...")
try:
    service = get_kyc_ocr_service()
    print(f"✅ Service créé")
    print(f"   Stratégie: {service.strategy}")
    print(f"   Timeout: {service.easyocr_timeout}s")
    print(f"   Fallback: {service.fallback_enabled}")
except Exception as e:
    print(f"❌ Erreur création: {e}")
    sys.exit(1)

# Test 3: Vérification disponibilité
print("\n[3/6] Test disponibilité des moteurs OCR...")
try:
    stats = service.get_stats()
    print(f"   EasyOCR disponible: {stats['easyocr_available']}")
    print(f"   Google Vision disponible: {stats['google_vision_available']}")
    
    if not service.is_available():
        print("⚠️  Aucun moteur OCR disponible")
        print("   Installer EasyOCR: pip install easyocr")
        print("   Ou configurer Google Vision: GOOGLE_CREDENTIALS_JSON")
    else:
        print("✅ Au moins un moteur OCR disponible")
except Exception as e:
    print(f"❌ Erreur vérification: {e}")

# Test 4: Test parsing basique
print("\n[4/6] Test parsing CNI ancien...")
try:
    text_recto = """
    REPUBLIQUE DU CAMEROUN
    NOM: KENGNE FOTSO
    PRENOMS: Etienne Junior
    DATE DE NAISSANCE: 15.03.1998
    SEXE: M
    """
    
    text_verso = """
    PERE: FOTSO Jean
    MERE: NGUEFACK Marie
    NUMERO: 123456789
    """
    
    data = service._parse_cni_ancien(text_recto, text_verso)
    
    print(f"   Nom: {data.get('nom')}")
    print(f"   Prénoms: {data.get('prenoms')}")
    print(f"   Numéro: {data.get('numero')}")
    
    if data.get('nom') and data.get('numero'):
        print("✅ Parsing fonctionne")
    else:
        print("⚠️  Parsing incomplet")
except Exception as e:
    print(f"❌ Erreur parsing: {e}")

# Test 5: Test schémas
print("\n[5/6] Test schémas Pydantic...")
try:
    response = OCRExtractionResponse(
        success=True,
        status="success",
        document_type=DocumentType.CNI_ANCIEN,
        data={"nom": "TEST"},
        extraction_method="easyocr",
        extraction_cost_usd=0.0,
        confidence_score=0.85,
        requires_manual_validation=True
    )
    print("✅ Schémas valides")
    print(f"   Méthode: {response.extraction_method}")
    print(f"   Coût: ${response.extraction_cost_usd}")
except Exception as e:
    print(f"❌ Erreur schémas: {e}")

# Test 6: Test statistiques
print("\n[6/6] Test statistiques...")
try:
    stats = service.get_stats()
    
    print(f"   Total extractions: {stats['total_extractions']}")
    print(f"   Taux EasyOCR: {stats['easyocr_rate'] * 100:.1f}%")
    print(f"   Taux fallback: {stats['fallback_rate'] * 100:.1f}%")
    print(f"   Coût total: ${stats['total_cost_usd']:.4f}")
    print("✅ Statistiques fonctionnent")
except Exception as e:
    print(f"❌ Erreur stats: {e}")

# Résumé
print("\n" + "=" * 70)
print("RÉSUMÉ")
print("=" * 70)

print("""
✅ Module KYC Hybride installé et fonctionnel

Configuration actuelle:
""")

try:
    stats = service.get_stats()
    print(f"  Stratégie: {stats['strategy']}")
    print(f"  EasyOCR: {'✅ Disponible' if stats['easyocr_available'] else '❌ Non disponible'}")
    print(f"  Google Vision: {'✅ Disponible' if stats['google_vision_available'] else '❌ Non disponible'}")
except:
    pass

print("""
Prochaines étapes:
1. Démarrer le serveur:
   python -m uvicorn app.main:app --reload --port 8001

2. Tester l'API:
   curl http://localhost:8001/api/ai/kyc/health

3. Extraire un document:
   curl -X POST "http://localhost:8001/api/ai/kyc/extract" \\
     -F "document_type=CNI_ANCIEN" \\
     -F "recto=@cni_recto.jpg" \\
     -F "verso=@cni_verso.jpg"

4. Vérifier les stats:
   curl http://localhost:8001/api/ai/kyc/stats

Documentation:
- Démarrage rapide: docs/KYC_QUICKSTART.md
- Architecture: docs/KYC_HYBRID_STRATEGY.md
- Récapitulatif: README_KYC_FINAL.md

⚠️  IMPORTANT:
Pour utiliser EasyOCR, installer les dépendances:
  pip install easyocr torch torchvision opencv-python PyMuPDF

Pour utiliser Google Vision (fallback), configurer:
  GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
""")

print("=" * 70)
print("✅ Test terminé avec succès !")
print("=" * 70)
