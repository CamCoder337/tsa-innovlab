#!/usr/bin/env python3
"""
Test du service d'inférence de profil transporteur
"""
import sys
sys.path.insert(0, '.')

from app.services.transporter_profile_inference import TransporterProfileInference

def test_cold_start():
    """Test avec nouveau transporteur (0 missions)"""
    print("=" * 80)
    print("TEST 1: Cold Start (Nouveau Transporteur)")
    print("=" * 80)
    
    inference = TransporterProfileInference()
    
    # Historique vide
    history = {
        'completed_missions': 0,
        'success_rate': 0.0,
        'route_performance': {},
        'merchandise_success': {},
    }
    
    # Véhicules
    vehicles = [
        {'type': 'Camion', 'capacite': 8000},
        {'type': 'Camionnette', 'capacite': 2000}
    ]
    
    profile = inference.infer_profile('TEST_TRANS_001', history, vehicles)
    
    print(f"\n✅ Profil inféré:")
    print(f"  - Confiance: {profile['_inference_metadata']['confidence']:.2f}")
    print(f"  - Max weight: {profile['max_weight']} kg (depuis véhicules)")
    print(f"  - Max distance: {profile['max_distance']} km")
    print(f"  - Préférences: {profile['preferred_merchandise_types']}")
    print(f"  - Villes connues: {profile['known_cities']}")
    print(f"  - Expérience: {profile['experience_years']} an(s)")
    print(f"  - Réputation: {profile['reputation_score']}/100")
    
    assert profile['_inference_metadata']['confidence'] == 0.3, "Cold start devrait avoir confiance 0.3"
    assert profile['max_weight'] == 8000, "Devrait prendre capacité max des véhicules"
    print("\n✅ Test cold start réussi!")


def test_warm_start():
    """Test avec transporteur ayant quelques missions"""
    print("\n" + "=" * 80)
    print("TEST 2: Warm Start (5 missions)")
    print("=" * 80)
    
    inference = TransporterProfileInference()
    
    # Historique avec 5 missions
    history = {
        'completed_missions': 5,
        'success_rate': 0.80,
        'avg_rating': 4.0,
        'route_performance': {
            'Douala-Yaoundé': {'count': 3, 'success_rate': 0.90, 'avg_rating': 4.2},
            'Douala-Bafoussam': {'count': 2, 'success_rate': 0.85, 'avg_rating': 3.8},
        },
        'merchandise_success': {
            'Construction': {'count': 3, 'success_rate': 0.90, 'avg_rating': 4.3},
            'Alimentaire': {'count': 2, 'success_rate': 0.70, 'avg_rating': 3.5},
        },
    }
    
    vehicles = [{'type': 'Camion', 'capacite': 10000}]
    
    profile = inference.infer_profile('TEST_TRANS_002', history, vehicles)
    
    print(f"\n✅ Profil inféré:")
    print(f"  - Confiance: {profile['_inference_metadata']['confidence']:.2f}")
    print(f"  - Préférences: {profile['preferred_merchandise_types']}")
    print(f"  - Villes connues: {profile['known_cities']}")
    print(f"  - Expérience: {profile['experience_years']} an(s)")
    print(f"  - Réputation: {profile['reputation_score']:.1f}/100")
    
    assert profile['_inference_metadata']['confidence'] == 0.7, "5 missions = confiance 0.7 (5-19 missions)"
    assert 'Construction' in profile['preferred_merchandise_types'], "Construction devrait être préféré (90% succès)"
    assert 'Douala' in profile['known_cities'], "Douala devrait être connue"
    assert 'Yaoundé' in profile['known_cities'], "Yaoundé devrait être connue"
    print("\n✅ Test warm start réussi!")


def test_expert():
    """Test avec transporteur expérimenté (50+ missions)"""
    print("\n" + "=" * 80)
    print("TEST 3: Expert (75 missions)")
    print("=" * 80)
    
    inference = TransporterProfileInference()
    
    # Historique riche
    history = {
        'completed_missions': 75,
        'success_rate': 0.95,
        'avg_rating': 4.6,
        'route_performance': {
            'Douala-Yaoundé': {'count': 20, 'success_rate': 0.95, 'avg_rating': 4.7},
            'Douala-Bafoussam': {'count': 15, 'success_rate': 0.93, 'avg_rating': 4.5},
            'Yaoundé-Bertoua': {'count': 10, 'success_rate': 0.90, 'avg_rating': 4.4},
            'Douala-Kribi': {'count': 12, 'success_rate': 0.92, 'avg_rating': 4.6},
            'Yaoundé-Ebolowa': {'count': 8, 'success_rate': 0.88, 'avg_rating': 4.3},
            'Douala-Limbe': {'count': 10, 'success_rate': 0.90, 'avg_rating': 4.5},
        },
        'merchandise_success': {
            'Électronique': {'count': 25, 'success_rate': 0.96, 'avg_rating': 4.8},
            'Construction': {'count': 20, 'success_rate': 0.95, 'avg_rating': 4.6},
            'Alimentaire': {'count': 15, 'success_rate': 0.93, 'avg_rating': 4.4},
            'Mobilier': {'count': 10, 'success_rate': 0.90, 'avg_rating': 4.3},
            'Textile': {'count': 5, 'success_rate': 0.80, 'avg_rating': 4.0},
        },
    }
    
    vehicles = [
        {'type': 'Camion 8T', 'capacite': 8000},
        {'type': 'Camionnette', 'capacite': 2000}
    ]
    
    profile = inference.infer_profile('TEST_TRANS_003', history, vehicles)
    
    print(f"\n✅ Profil inféré:")
    print(f"  - Confiance: {profile['_inference_metadata']['confidence']:.2f}")
    print(f"  - Préférences: {profile['preferred_merchandise_types']}")
    print(f"  - Villes connues ({len(profile['known_cities'])}): {profile['known_cities']}")
    print(f"  - Max distance: {profile['max_distance']} km")
    print(f"  - Expérience: {profile['experience_years']} an(s)")
    print(f"  - Réputation: {profile['reputation_score']:.1f}/100")
    
    assert profile['_inference_metadata']['confidence'] == 0.95, "75 missions = confiance 0.95"
    assert 'Électronique' in profile['preferred_merchandise_types'], "Électronique devrait être préféré"
    assert 'Construction' in profile['preferred_merchandise_types'], "Construction devrait être préféré"
    assert len(profile['known_cities']) >= 6, "Devrait connaître au moins 6 villes"
    assert profile['max_distance'] == 1500, "6 routes = longue distance (1500 km)"
    assert profile['experience_years'] == 3, "75 missions = 3 ans d'expérience"
    print("\n✅ Test expert réussi!")


def test_confidence_levels():
    """Test des niveaux de confiance"""
    print("\n" + "=" * 80)
    print("TEST 4: Niveaux de Confiance")
    print("=" * 80)
    
    inference = TransporterProfileInference()
    
    test_cases = [
        (0, 0.3, "Cold start"),
        (3, 0.5, "Peu de missions"),
        (10, 0.7, "Confiance moyenne"),
        (30, 0.85, "Bonne confiance"),
        (100, 0.95, "Très bonne confiance"),
    ]
    
    for missions, expected_confidence, label in test_cases:
        history = {'completed_missions': missions}
        profile = inference.infer_profile(f'TEST_{missions}', history)
        actual_confidence = profile['_inference_metadata']['confidence']
        
        print(f"  {missions:3d} missions → Confiance: {actual_confidence:.2f} ({label})")
        assert actual_confidence == expected_confidence, f"Confiance incorrecte pour {missions} missions"
    
    print("\n✅ Test niveaux de confiance réussi!")


if __name__ == '__main__':
    try:
        test_cold_start()
        test_warm_start()
        test_expert()
        test_confidence_levels()
        
        print("\n" + "=" * 80)
        print("✅ TOUS LES TESTS RÉUSSIS!")
        print("=" * 80)
        print("\nLe service d'inférence de profil fonctionne correctement.")
        print("Prêt pour intégration en production.")
        
    except AssertionError as e:
        print(f"\n❌ Test échoué: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
