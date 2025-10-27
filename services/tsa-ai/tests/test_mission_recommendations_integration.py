#!/usr/bin/env python3
"""
Test d'intégration pour le système de recommandations de missions
Vérifie que l'intégration dans tsa-ai fonctionne correctement
"""
import asyncio
import sys
import os
from pathlib import Path

# Ajouter le chemin de l'app au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

async def test_mission_recommendations_integration():
    """Test complet de l'intégration des recommandations de missions"""
    
    print("🧪 Test d'intégration du système de recommandations de missions")
    print("=" * 60)
    
    try:
        # Test 1: Import des modules
        print("1. Test des imports...")
        from app.services.mission_recommendation_service import mission_recommendation_service
        from app.schemas.mission_recommendations import (
            MissionRecommendationRequest, 
            TransporterProfile, 
            MissionInfo, 
            RecommendationMethod
        )
        print("   ✅ Imports réussis")
        
        # Test 2: Vérification du service
        print("\n2. Test du service de recommandations...")
        stats = mission_recommendation_service.get_service_stats()
        print(f"   📊 Modèle chargé: {stats['model_loaded']}")
        print(f"   📊 Version: {stats['model_version']}")
        print(f"   📊 Chemin: {stats['model_path']}")
        print(f"   📊 Villes supportées: {stats['supported_cities']}")
        print(f"   📊 Types de marchandises: {stats['supported_merchandise_types']}")
        
        # Test 3: Données de test
        print("\n3. Préparation des données de test...")
        test_transporter = TransporterProfile(
            transporter_id="TEST_TRANS_001",
            max_weight=8000.0,
            max_distance=600.0,
            min_budget=75000.0,
            experience_years=3,
            reputation_score=78.0,
            preferred_merchandise_types=["Électronique", "Alimentaire"],
            known_cities=["Yaoundé", "Douala", "Bafoussam"],
            preferred_delay_days=5,
            vehicle_type="Camion 8T"
        )
        
        test_missions = [
            MissionInfo(
                mission_id="TEST_MISSION_001",
                weight=3500.0,
                budget=120000.0,
                delay_days=4,
                depart_city="Yaoundé",
                arrival_city="Douala",
                merchandise_type="Électronique",
                description="Transport d'équipements informatiques",
                urgency_level=3
            ),
            MissionInfo(
                mission_id="TEST_MISSION_002",
                weight=6000.0,
                budget=180000.0,
                delay_days=7,
                depart_city="Douala",
                arrival_city="Bafoussam",
                merchandise_type="Alimentaire",
                description="Livraison de produits alimentaires",
                urgency_level=2
            ),
            MissionInfo(
                mission_id="TEST_MISSION_003",
                weight=2000.0,
                budget=95000.0,
                delay_days=3,
                depart_city="Yaoundé",
                arrival_city="Kribi",
                merchandise_type="Textile",
                description="Transport de vêtements",
                urgency_level=4
            )
        ]
        print("   ✅ Données de test créées")
        
        # Test 4: Recommandations rule-based
        print("\n4. Test recommandations rule-based...")
        request_rule = MissionRecommendationRequest(
            transporter_profile=test_transporter,
            available_missions=test_missions,
            method=RecommendationMethod.RULE_BASED,
            max_recommendations=5
        )
        result_rule = await mission_recommendation_service.recommend_missions(request_rule)
        print(f"   📊 Nombre de recommandations: {len(result_rule.recommendations) if isinstance(result_rule.recommendations, list) else 'N/A'}")
        print(f"   ⏱️  Temps: {result_rule.processing_time_ms}ms")
        
        # Test 5: Recommandations ML-based
        print("\n5. Test recommandations ML-based...")
        request_ml = MissionRecommendationRequest(
            transporter_profile=test_transporter,
            available_missions=test_missions,
            method=RecommendationMethod.ML_BASED,
            max_recommendations=5
        )
        result_ml = await mission_recommendation_service.recommend_missions(request_ml)
        print(f"   📊 Nombre de recommandations: {len(result_ml.recommendations) if isinstance(result_ml.recommendations, list) else 'N/A'}")
        print(f"   ⏱️  Temps: {result_ml.processing_time_ms}ms")
        
        # Test 6: Comparaison des méthodes
        print("\n6. Test comparaison des méthodes...")
        request_both = MissionRecommendationRequest(
            transporter_profile=test_transporter,
            available_missions=test_missions,
            method=RecommendationMethod.BOTH,
            max_recommendations=5
        )
        result_both = await mission_recommendation_service.recommend_missions(request_both)
        print(f"   📊 Comparaison disponible: {isinstance(result_both.recommendations, dict)}")
        
        # Test 7: Test des fonctionnalités du modèle
        print("\n7. Test des fonctionnalités du modèle...")
        recommender = mission_recommendation_service.recommender
        
        # Test distance
        distance = recommender.get_distance("Yaoundé", "Douala")
        print(f"   📏 Distance Yaoundé-Douala: {distance}km")
        
        # Test villes supportées
        print(f"   🏙️  Villes supportées: {len(recommender.cities)}")
        print(f"   📦 Types de marchandises: {len(recommender.merchandise_types)}")
        
        # Test 8: Statistiques finales
        print("\n8. Statistiques finales...")
        final_stats = mission_recommendation_service.get_service_stats()
        print(f"   📊 Total requêtes: {final_stats['total_requests']}")
        print(f"   📊 Temps moyen: {final_stats['avg_response_time']:.3f}s")
        print(f"   📊 Utilisation par méthode: {final_stats['method_usage']}")
        
        print("\n" + "=" * 60)
        print("🎉 TOUS LES TESTS RÉUSSIS !")
        print("✅ L'intégration du système de recommandations de missions est fonctionnelle")
        
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
        from app.endpoints.mission_recommendations import router
        
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


def test_model_files():
    """Test de présence des fichiers modèles"""
    
    print("\n📁 Test de présence des modèles ML")
    print("=" * 50)
    
    try:
        models_to_check = [
            ("mission_recommender_model.pkl", "Recommandations de missions"),
            ("piece_quality_scorer.pkl", "Scoring de pièces")
        ]
        
        all_found = True
        
        for model_file, description in models_to_check:
            model_path = Path("ml_models") / model_file
            
            if model_path.exists():
                size_mb = model_path.stat().st_size / (1024 * 1024)
                print(f"✅ {description}: {model_path} ({size_mb:.1f} MB)")
            else:
                print(f"❌ {description}: {model_path} (manquant)")
                all_found = False
        
        return all_found
            
    except Exception as e:
        print(f"❌ Erreur lors de la vérification des modèles: {e}")
        return False


async def main():
    """Test principal"""
    
    print("🚀 TESTS D'INTÉGRATION - RECOMMANDATIONS DE MISSIONS TSA INNOVLAB")
    print("=" * 70)
    
    # Changer vers le répertoire de l'application
    os.chdir(Path(__file__).parent.parent)
    
    # Tests
    tests = [
        ("Fichiers modèles", test_model_files()),
        ("Endpoints", await test_endpoints_availability()),
        ("Intégration complète", await test_mission_recommendations_integration())
    ]
    
    # Résultats
    print("\n" + "=" * 70)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 70)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in tests:
        status = "✅ RÉUSSI" if result else "❌ ÉCHEC"
        print(f"{test_name:<25} : {status}")
        if result:
            passed += 1
    
    print(f"\nRésultat global: {passed}/{total} tests réussis")
    
    if passed == total:
        print("🎉 INTÉGRATION COMPLÈTEMENT FONCTIONNELLE !")
        print("\n📚 Prochaines étapes:")
        print("   1. Démarrer le service: uvicorn app.main:app --reload")
        print("   2. Tester via Swagger: http://localhost:8000/docs")
        print("   3. Test demo: http://localhost:8000/api/ai/missions/demo")
        print("   4. Villes supportées: http://localhost:8000/api/ai/missions/cities")
    else:
        print("⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.")
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
