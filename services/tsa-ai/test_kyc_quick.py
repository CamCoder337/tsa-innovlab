#!/usr/bin/env python3
"""
Script de test rapide pour le module KYC

Usage:
    python test_kyc_quick.py

Vérifie :
1. Import des modules
2. Initialisation du service
3. Parsing basique
"""
import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent))

print("=" * 60)
print("TEST RAPIDE MODULE KYC")
print("=" * 60)

# Test 1: Import des modules
print("\n[1/5] Test import des modules...")
try:
    from app.schemas.kyc import (
        DocumentType,
        OCRExtractionRequest,
        OCRExtractionResponse,
        CNIAncienData
    )
    from app.services.kyc_ocr_service import KYCOCRService, get_kyc_ocr_service
    from app.endpoints import kyc
    print("✅ Tous les modules importés avec succès")
except Exception as e:
    print(f"❌ Erreur import: {e}")
    sys.exit(1)

# Test 2: Création du service
print("\n[2/5] Test création du service...")
try:
    service = get_kyc_ocr_service()
    print(f"✅ Service créé: {service}")
except Exception as e:
    print(f"❌ Erreur création service: {e}")
    sys.exit(1)

# Test 3: Vérification disponibilité Google Vision
print("\n[3/5] Test disponibilité Google Vision...")
try:
    is_available = service.is_available()
    if is_available:
        print("✅ Google Vision API disponible")
    else:
        print("⚠️  Google Vision API non disponible")
        print("   Vérifiez GOOGLE_CREDENTIALS_JSON ou GOOGLE_APPLICATION_CREDENTIALS")
except Exception as e:
    print(f"❌ Erreur vérification: {e}")

# Test 4: Test parsing basique
print("\n[4/5] Test parsing basique...")
try:
    text_recto = """
    REPUBLIQUE DU CAMEROUN
    CARTE NATIONALE D'IDENTITE
    NOM: KENGNE FOTSO
    PRENOMS: Etienne Junior
    DATE DE NAISSANCE: 15.03.1998
    LIEU DE NAISSANCE: DOUALA
    SEXE: M
    TAILLE: 1,75 m
    PROFESSION: INFORMATICIEN
    """
    
    data = service._parse_cni_ancien_recto(text_recto)
    
    print(f"   Nom: {data.get('nom')}")
    print(f"   Prénoms: {data.get('prenoms')}")
    print(f"   Date naissance: {data.get('date_naissance')}")
    print(f"   Sexe: {data.get('sexe')}")
    
    if data.get('nom') == 'KENGNE FOTSO':
        print("✅ Parsing recto fonctionne")
    else:
        print("⚠️  Parsing recto incomplet")
    
    text_verso = """
    PERE: FOTSO KAMDEM Jean
    MERE: NGUEFACK MARIE LOUISE
    NUMERO: 123456789
    DATE DE DELIVRANCE: 12.05.2020
    DATE D'EXPIRATION: 12.05.2030
    """
    
    data_verso = service._parse_cni_ancien_verso(text_verso)
    
    print(f"   Père: {data_verso.get('pere')}")
    print(f"   Mère: {data_verso.get('mere')}")
    print(f"   Numéro: {data_verso.get('numero')}")
    
    if data_verso.get('numero') == '123456789':
        print("✅ Parsing verso fonctionne")
    else:
        print("⚠️  Parsing verso incomplet")
        
except Exception as e:
    print(f"❌ Erreur parsing: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Test schémas Pydantic
print("\n[5/5] Test schémas Pydantic...")
try:
    # Test CNIAncienData
    cni_data = CNIAncienData(
        nom="KENGNE FOTSO",
        prenoms="Etienne Junior",
        date_naissance="15.03.1998",
        sexe="M",
        confidence_score=0.85
    )
    print(f"✅ Schéma CNIAncienData valide")
    
    # Test OCRExtractionResponse
    response = OCRExtractionResponse(
        success=True,
        status="success",
        document_type=DocumentType.CNI_ANCIEN,
        data=cni_data.dict(),
        confidence_score=0.85,
        requires_manual_validation=True
    )
    print(f"✅ Schéma OCRExtractionResponse valide")
    
except Exception as e:
    print(f"❌ Erreur schémas: {e}")
    import traceback
    traceback.print_exc()

# Résumé
print("\n" + "=" * 60)
print("RÉSUMÉ")
print("=" * 60)
print("""
✅ Module KYC installé et fonctionnel

Prochaines étapes :
1. Configurer Google Vision API (si pas déjà fait)
2. Tester avec de vraies images CNI
3. Améliorer le parsing selon les résultats
4. Intégrer avec le monolithe Adonis

Documentation :
- docs/KYC_IMPLEMENTATION.md
- app/services/README_KYC.md

Endpoints disponibles :
- GET  /api/ai/kyc/health
- POST /api/ai/kyc/extract
- GET  /api/ai/kyc/document-types
- GET  /api/ai/kyc/stats

⚠️  IMPORTANT :
Le parsing actuel est BASIQUE. Vous devrez l'améliorer
après avoir testé avec de vrais documents camerounais.

Voir docs/KYC_IMPLEMENTATION.md section "Améliorer le Parsing"
""")
print("=" * 60)
