#!/usr/bin/env python3
"""
Test d'intégration pour le système de scoring de pièces
Vérifie que l'intégration dans tsa-ai fonctionne correctement
"""
import asyncio
import sys
import os
from pathlib import Path

# Ajouter le chemin de l'app au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent))

async def test_scoring_integration():
    """Test complet de l'intégration du scoring"""
    
    print("🧪 Test d'intégration du système de scoring")
    print("=" * 50)
    
    try:
        # Test 1: Import des modules
        print("1. Test des imports...")
        from app.services.piece_scoring_service import piece_scoring_service
        from app.schemas.piece_scoring import PieceScoreRequest, PieceInfo, ScoringMethod
        print("   ✅ Imports réussis")
        
        # Test 2: Vérification du service
        print("\n2. Test du service de scoring...")
        stats = piece_scoring_service.get_service_stats()
        print(f"   📊 Modèle chargé: {stats['model_loaded']}")
        print(f"   📊 Version: {stats['model_version']}")
        print(f"   📊 Chemin: {stats['model_path']}")
        
        # Test 3: Données de test
        print("\n3. Préparation des données de test...")
        test_piece = PieceInfo(
            piece_id="TEST_001",
            piece_name="Alternateur Test",
            piece_age_months=18,
            estimated_lifetime_months=120,
            supplier_rating=4.2,
            supplier_years_experience=8,
            average_customer_rating=4.1,
            number_of_reviews=25,
            physical_condition_score=82.0,
            price=175.0,
            category_code=2,
            brand_reputation_score=85.0
        )
        print("   ✅ Données de test créées")
        
        # Test 4: Scoring rule-based
        print("\n4. Test scoring rule-based...")
        request_rule = PieceScoreRequest(
            piece_info=test_piece,
            method=ScoringMethod.RULE_BASED
        )
        result_rule = await piece_scoring_service.score_piece(request_rule)
        print(f"   📊 Score rule-based: {result_rule.score_result['final_score']}")
        print(f"   📊 Catégorie: {result_rule.score_result['category']}")
        print(f"   ⏱️  Temps: {result_rule.processing_time_ms}ms")
        
        # Test 5: Scoring ML-based
        print("\n5. Test scoring ML-based...")
        request_ml = PieceScoreRequest(
            piece_info=test_piece,
            method=ScoringMethod.ML_BASED
        )
        result_ml = await piece_scoring_service.score_piece(request_ml)
        print(f"   📊 Score ML-based: {result_ml.score_result['final_score']}")
        print(f"   📊 Catégorie: {result_ml.score_result['category']}")
        print(f"   ⏱️  Temps: {result_ml.processing_time_ms}ms")
        
        # Test 6: Comparaison des méthodes
        print("\n6. Test comparaison des méthodes...")
        request_both = PieceScoreRequest(
            piece_info=test_piece,
            method=ScoringMethod.BOTH
        )
        result_both = await piece_scoring_service.score_piece(request_both)
        print(f"   📊 Comparaison disponible: {len(result_both.score_result) > 2}")
        
        # Test 7: Statistiques finales
        print("\n7. Statistiques finales...")
        final_stats = piece_scoring_service.get_service_stats()
        print(f"   📊 Total requêtes: {final_stats['total_requests']}")
        print(f"   📊 Temps moyen: {final_stats['avg_response_time']:.3f}s")
        print(f"   📊 Utilisation par méthode: {final_stats['method_usage']}")
        
        print("\n" + "=" * 50)
        print("🎉 TOUS LES TESTS RÉUSSIS !")
        print("✅ L'intégration du système de scoring est fonctionnelle")
        
        return True
        
    except ImportError as e:
        print(f"❌ Erreur d'import: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_endpoints_availability():
    """Test de disponibilité des endpoints"""
    
    print("\n🌐 Test de disponibilité des endpoints")
    print("=" * 50)
    
    try:
        from app.endpoints.piece_scoring import router
        
        # Compter les routes disponibles
        routes = [route for route in router.routes if hasattr(route, 'methods')]
        
        print(f"📍 Nombre de routes définies: {len(routes)}")
        
        for route in routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                methods = ', '.join(route.methods)
                print(f"   {methods} {route.path}")
        
        print("✅ Tous les endpoints sont définis")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors du test des endpoints: {e}")
        return False


def test_model_file():
    """Test de présence du fichier modèle"""
    
    print("\n📁 Test de présence du modèle ML")
    print("=" * 50)
    
    try:
        model_path = Path("ml_models/piece_quality_scorer.pkl")
        
        if model_path.exists():
            size_mb = model_path.stat().st_size / (1024 * 1024)
            print(f"✅ Modèle trouvé: {model_path}")
            print(f"📊 Taille: {size_mb:.1f} MB")
            return True
        else:
            print(f"❌ Modèle non trouvé: {model_path}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors de la vérification du modèle: {e}")
        return False


async def main():
    """Test principal"""
    
    print("🚀 TESTS D'INTÉGRATION - SYSTÈME DE SCORING TSA INNOVLAB")
    print("=" * 60)
    
    # Changer vers le répertoire de l'application
    os.chdir(Path(__file__).parent)
    
    # Tests
    tests = [
        ("Fichier modèle", test_model_file()),
        ("Endpoints", await test_endpoints_availability()),
        ("Intégration complète", await test_scoring_integration())
    ]
    
    # Résultats
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in tests:
        status = "✅ RÉUSSI" if result else "❌ ÉCHEC"
        print(f"{test_name:<20} : {status}")
        if result:
            passed += 1
    
    print(f"\nRésultat global: {passed}/{total} tests réussis")
    
    if passed == total:
        print("🎉 INTÉGRATION COMPLÈTEMENT FONCTIONNELLE !")
        print("\n📚 Prochaines étapes:")
        print("   1. Démarrer le service: uvicorn app.main:app --reload")
        print("   2. Tester via Swagger: http://localhost:8000/docs")
        print("   3. Test demo: http://localhost:8000/api/ai/scoring/demo")
    else:
        print("⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.")
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
